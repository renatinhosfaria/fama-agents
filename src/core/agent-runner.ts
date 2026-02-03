import type { AgentRegistry } from "./agent-registry.js";
import type { SkillRegistry } from "./skill-registry.js";
import type { ProviderConfig, RunAgentOptions, SkillForRanking } from "./types.js";
import { log } from "../utils/logger.js";
import { startSpan, endSpan } from "../utils/observability.js";
import { loadMemory } from "./agent-memory.js";
import { AgentNotFoundError, AgentBuildError, AgentExecutionError } from "./errors.js";
import { resolveProviderWithFallback, getModelForScale } from "./llm-provider.js";

const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 1000;
const JITTER_FACTOR = 0.3; // 0-30% random jitter

function isRetryableError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  return (
    msg.includes("429") ||
    msg.includes("rate limit") ||
    msg.includes("500") ||
    msg.includes("internal server error") ||
    msg.includes("econnreset") ||
    msg.includes("econnrefused") ||
    msg.includes("timeout")
  );
}

/**
 * Calculates retry delay with exponential backoff and random jitter.
 * Jitter helps prevent thundering herd when multiple agents retry simultaneously.
 */
function getRetryDelay(attempt: number, baseDelayMs: number): number {
  const exponentialDelay = baseDelayMs * Math.pow(2, attempt);
  const jitter = Math.random() * JITTER_FACTOR * exponentialDelay;
  return Math.floor(exponentialDelay + jitter);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Runs an agent using the configured LLM provider (Claude SDK by default).
 * Composes: agent playbook + active skills → system prompt
 * Registers other agents as subagents via SDK agents param (Claude only).
 */
export async function runAgent(
  options: RunAgentOptions,
  agentRegistry: AgentRegistry,
  skillRegistry: SkillRegistry,
  providerConfig?: ProviderConfig,
) {
  const agentSlug = options.agent;
  if (!agentSlug) {
    throw new AgentNotFoundError("(undefined)");
  }

  const agentConfig = agentRegistry.getBySlug(agentSlug);
  if (!agentConfig) {
    throw new AgentNotFoundError(agentSlug);
  }

  // Collect skills with metadata for relevance ranking
  const skillSlugs = [...agentConfig.defaultSkills, ...(options.skills ?? [])];
  const uniqueSlugs = [...new Set(skillSlugs)];
  const missingSkills: string[] = [];
  const skillsForRanking: SkillForRanking[] = [];
  const skillContents: string[] = [];

  for (const slug of uniqueSlugs) {
    const skill = skillRegistry.getBySlug(slug);
    if (!skill) {
      missingSkills.push(slug);
      continue;
    }
    // Collect both formats for flexibility
    skillContents.push(skill.content);
    skillsForRanking.push({
      slug: skill.slug,
      name: skill.name,
      description: skill.description,
      content: skill.content,
    });
  }

  if (missingSkills.length > 0) {
    log.warn(`Missing skills ignored: ${missingSkills.join(", ")}`);
  }

  // Load agent memory if sidecar is enabled
  const memory = agentConfig.hasSidecar
    ? loadMemory(agentSlug, options.cwd ?? process.cwd())
    : undefined;

  // Build the agent definition with skill ranking support
  const agentDef = agentRegistry.buildDefinition(
    agentSlug,
    skillContents,
    memory,
    options.skillTokenBudget,
    {
      task: options.task,
      skillsForRanking,
    },
  );
  if (!agentDef) {
    throw new AgentBuildError(agentSlug);
  }

  // Resolve provider and model with scale-based routing
  let modelInput = options.model;

  // If no explicit model, try scale-based routing
  if (!modelInput && options.scale !== undefined) {
    modelInput = getModelForScale(options.scale, providerConfig?.routing);
    if (options.verbose) {
      log.dim(`Model routing: scale=${options.scale} → model=${modelInput}`);
    }
  }

  // Fall back to agent config model
  if (!modelInput && agentConfig.model !== "inherit") {
    modelInput = agentConfig.model;
  }

  const { provider, resolvedModel } = await resolveProviderWithFallback(modelInput, providerConfig);

  // Build subagent definitions (only if provider supports them)
  const subagents: Record<string, { description: string; prompt: string; tools?: string[] }> = {};

  if (provider.supportsSubagents) {
    for (const otherAgent of agentRegistry.getAll()) {
      if (otherAgent.slug === agentSlug) continue;
      const otherSkills = skillRegistry.getContents(otherAgent.defaultSkills);
      const otherDef = agentRegistry.buildDefinition(otherAgent.slug, otherSkills);
      if (otherDef) {
        subagents[otherAgent.slug] = otherDef;
      }
    }
  } else if (options.verbose) {
    log.warn(`Provider "${provider.name}" does not support subagents.`);
  }

  const allowedTools = [
    ...agentConfig.tools,
    ...(Object.keys(subagents).length > 0 ? ["Task"] : []),
  ];

  if (options.verbose) {
    log.dim(`Agent: ${agentSlug}`);
    log.dim(`Provider: ${provider.name}`);
    log.dim(`Skills: ${uniqueSlugs.join(", ") || "(none)"}`);
    log.dim(`Tools: ${allowedTools.join(", ")}`);
    log.dim(`Subagents: ${Object.keys(subagents).join(", ") || "(none)"}`);
  }

  // Dry-run: show config without executing
  if (options.dryRun) {
    log.info("[DRY RUN] Would execute agent with:");
    log.dim(
      JSON.stringify(
        {
          agent: agentSlug,
          provider: provider.name,
          skills: uniqueSlugs,
          tools: allowedTools,
          model: resolvedModel,
          maxTurns: options.maxTurns,
          subagents: Object.keys(subagents),
        },
        null,
        2,
      ),
    );
    return "[dry-run] No execution performed.";
  }

  const span = startSpan("agent.run", {
    agent: agentSlug,
    model: resolvedModel,
    provider: provider.name,
  });
  const startedAt = Date.now();
  let costUSD: number | undefined;
  let numTurns: number | undefined;

  try {
    let result: string | undefined;

    // Retry loop for transient API errors
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const queryIterator = provider.query(options.task, {
          systemPrompt: agentDef.prompt,
          tools: allowedTools,
          agents: Object.keys(subagents).length > 0 ? subagents : undefined,
          model: resolvedModel,
          maxTurns: options.maxTurns,
          cwd: options.cwd ?? process.cwd(),
          permissionMode: options.permissionMode ?? "default",
          settingSources: ["project"],
        });

        for await (const message of queryIterator) {
          if (message.type === "assistant") {
            if (message.text && options.verbose) {
              process.stdout.write(message.text);
            }
          }

          if (message.type === "result") {
            if (message.subtype === "success") {
              result = message.result;
              costUSD = message.costUSD;
              numTurns = message.numTurns;
              if (options.verbose) {
                log.dim(
                  `\nCost: $${(message.costUSD ?? 0).toFixed(4)} | Turns: ${message.numTurns ?? 1}`,
                );
              }
            } else {
              const rawErrors = message.errors ?? [];
              const errorMessages = rawErrors.map((e) => (typeof e === "string" ? e : String(e)));
              throw new AgentExecutionError(
                agentSlug,
                new Error(`Query failed (${message.subtype}):\n${errorMessages.join("\n")}`),
              );
            }
          }
        }

        // Success — break out of retry loop
        break;
      } catch (err) {
        if (attempt < MAX_RETRIES && isRetryableError(err)) {
          const delay = getRetryDelay(attempt, RETRY_BASE_DELAY_MS);
          log.warn(`Retrying (attempt ${attempt + 1}/${MAX_RETRIES}) after ${delay}ms...`);
          await sleep(delay);
          continue;
        }
        throw err;
      }
    }

    const finishedAt = Date.now();
    options.onEvent?.({
      status: "success",
      result,
      metrics: {
        agent: agentSlug,
        model: resolvedModel,
        maxTurns: options.maxTurns,
        startedAt: new Date(startedAt).toISOString(),
        finishedAt: new Date(finishedAt).toISOString(),
        durationMs: finishedAt - startedAt,
        costUSD,
        turns: numTurns,
      },
    });

    endSpan(span);
    return result;
  } catch (err) {
    endSpan(span);
    const finishedAt = Date.now();
    options.onEvent?.({
      status: "error",
      error: err instanceof Error ? err.message : String(err),
      metrics: {
        agent: agentSlug,
        model: resolvedModel,
        maxTurns: options.maxTurns,
        startedAt: new Date(startedAt).toISOString(),
        finishedAt: new Date(finishedAt).toISOString(),
        durationMs: finishedAt - startedAt,
        costUSD,
        turns: numTurns,
      },
    });
    throw err;
  }
}
