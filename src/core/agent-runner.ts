import { query } from "@anthropic-ai/claude-agent-sdk";
import type { AgentRegistry } from "./agent-registry.js";
import type { SkillRegistry } from "./skill-registry.js";
import type { RunAgentOptions } from "./types.js";
import { log } from "../utils/logger.js";

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
    throw new Error(
      "ANTHROPIC_API_KEY environment variable is required.\n" +
        "Set it in your .env file or run: export ANTHROPIC_API_KEY=your_key\n" +
        "Get your key at: https://console.anthropic.com/",
    );
  }

  const agentSlug = options.agent;
  if (!agentSlug) {
    throw new Error(
      "Agent slug is required. Use --agent <slug> or enable auto-selection.",
    );
  }

  const agentConfig = agentRegistry.getBySlug(agentSlug);
  if (!agentConfig) {
    throw new Error(
      `Agent "${agentSlug}" not found. Use "fama agents" to list available agents.`,
    );
  }

  // Collect skill content to inject
  const skillSlugs = [
    ...agentConfig.defaultSkills,
    ...(options.skills ?? []),
  ];
  const uniqueSlugs = [...new Set(skillSlugs)];
  const skillContents = skillRegistry.getContents(uniqueSlugs);

  // Build the agent definition
  const agentDef = agentRegistry.buildDefinition(agentSlug, skillContents);
  if (!agentDef) {
    throw new Error(`Failed to build agent definition for "${agentSlug}".`);
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

  // Execute via SDK
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

  let result: string | undefined;

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
        if (options.verbose) {
          log.dim(
            `\nCost: $${message.total_cost_usd.toFixed(4)} | Turns: ${message.num_turns}`,
          );
        }
      } else {
        const errors =
          "errors" in message ? (message.errors as string[]) : [];
        throw new Error(
          `Agent query failed (${message.subtype}):\n${errors.join("\n")}`,
        );
      }
    }
  }

  return result;
}
