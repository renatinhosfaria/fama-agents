import { query } from "@anthropic-ai/claude-agent-sdk";
import type { AgentRegistry } from "./agent-registry.js";
import type { SkillRegistry } from "./skill-registry.js";
import type { RunAgentOptions } from "./types.js";
import { log } from "../utils/logger.js";
import { startSpan, endSpan } from "../utils/observability.js";
import { loadMemory } from "./agent-memory.js";
import {
  ApiKeyMissingError,
  AgentNotFoundError,
  AgentBuildError,
  AgentExecutionError,
} from "./errors.js";

const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 1000;

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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Runs an agent using the Claude Agent SDK query() function.
 * Composes: agent playbook + active skills → system prompt
 * Registers other agents as subagents via SDK agents param.
 */
export async function runAgent(
  options: RunAgentOptions,
  agentRegistry: AgentRegistry,
  skillRegistry: SkillRegistry,
) {
  // Validate API key
  if (!process.env["ANTHROPIC_API_KEY"]) {
    throw new ApiKeyMissingError();
  }

  const agentSlug = options.agent;
  if (!agentSlug) {
    throw new AgentNotFoundError("(undefined)");
  }

  const agentConfig = agentRegistry.getBySlug(agentSlug);
  if (!agentConfig) {
    throw new AgentNotFoundError(agentSlug);
  }

  // Collect skill content to inject
  const skillSlugs = [
    ...agentConfig.defaultSkills,
    ...(options.skills ?? []),
  ];
  const uniqueSlugs = [...new Set(skillSlugs)];
  const missingSkills: string[] = [];
  const skillContents = uniqueSlugs.flatMap((slug) => {
    const skill = skillRegistry.getBySlug(slug);
    if (!skill) {
      missingSkills.push(slug);
      return [];
    }
    return [skill.content];
  });

  if (missingSkills.length > 0) {
    log.warn(`Missing skills ignored: ${missingSkills.join(", ")}`);
  }

  // Load agent memory if sidecar is enabled
  const memory = agentConfig.hasSidecar
    ? loadMemory(agentSlug, options.cwd ?? process.cwd())
    : undefined;

  // Build the agent definition
  const agentDef = agentRegistry.buildDefinition(agentSlug, skillContents, memory);
  if (!agentDef) {
    throw new AgentBuildError(agentSlug);
  }

  // Build subagent definitions (all OTHER agents as potential subagents)
  const subagents: Record<
    string,
    { description: string; prompt: string; tools?: string[] }
  > = {};
  for (const otherAgent of agentRegistry.getAll()) {
    if (otherAgent.slug === agentSlug) continue;
    const otherSkills = skillRegistry.getContents(otherAgent.defaultSkills);
    const otherDef = agentRegistry.buildDefinition(
      otherAgent.slug,
      otherSkills,
    );
    if (otherDef) {
      subagents[otherAgent.slug] = otherDef;
    }
  }

  const allowedTools = [
    ...agentConfig.tools,
    ...(Object.keys(subagents).length > 0 ? ["Task"] : []),
  ];

  if (options.verbose) {
    log.dim(`Agent: ${agentSlug}`);
    log.dim(`Skills: ${uniqueSlugs.join(", ") || "(none)"}`);
    log.dim(`Tools: ${allowedTools.join(", ")}`);
    log.dim(`Subagents: ${Object.keys(subagents).join(", ") || "(none)"}`);
  }

  // Resolve model
  const resolvedModel =
    options.model ??
    (agentConfig.model === "inherit" ? undefined : agentConfig.model);

  // Dry-run: show config without executing
  if (options.dryRun) {
    log.info("[DRY RUN] Would execute agent with:");
    log.dim(JSON.stringify({
      agent: agentSlug,
      skills: uniqueSlugs,
      tools: allowedTools,
      model: resolvedModel,
      maxTurns: options.maxTurns,
      subagents: Object.keys(subagents),
    }, null, 2));
    return "[dry-run] No execution performed.";
  }

  const span = startSpan("agent.run", { agent: agentSlug, model: resolvedModel });
  const startedAt = Date.now();
  let costUSD: number | undefined;
  let numTurns: number | undefined;

  try {
    let result: string | undefined;

    // Retry loop for transient API errors
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const queryIterator = query({
          prompt: options.task,
          options: {
            systemPrompt: agentDef.prompt,
            allowedTools,
            agents: Object.keys(subagents).length > 0 ? subagents : undefined,
            model: resolvedModel,
            maxTurns: options.maxTurns,
            cwd: options.cwd ?? process.cwd(),
            permissionMode: options.permissionMode ?? "default",
            settingSources: ["project"],
          },
        });

        for await (const message of queryIterator) {
          if (message.type === "assistant") {
            const content = message.message.content;
            if (Array.isArray(content)) {
              for (const block of content) {
                if ("text" in block && block.text) {
                  if (options.verbose) {
                    process.stdout.write(block.text);
                  }
                }
              }
            }
          }

          if (message.type === "result") {
            if (message.subtype === "success") {
              result = message.result;
              costUSD = message.total_cost_usd;
              numTurns = message.num_turns;
              if (options.verbose) {
                log.dim(
                  `\nCost: $${message.total_cost_usd.toFixed(4)} | Turns: ${message.num_turns}`,
                );
              }
            } else {
              const rawErrors =
                "errors" in message && Array.isArray(message.errors)
                  ? message.errors
                  : [];
              const errorMessages = rawErrors.map((e) =>
                typeof e === "string" ? e : String(e),
              );
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
          const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt);
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
