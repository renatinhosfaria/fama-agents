import { AgentRegistry } from "../core/agent-registry.js";
import type { AgentConfig, MenuEntry } from "../core/types.js";
import { log } from "../utils/logger.js";

export function agentsMenuCommand(slug: string, cwd: string = process.cwd()) {
  const agentRegistry = new AgentRegistry(cwd);
  const agent = agentRegistry.getBySlug(slug);

  if (!agent) {
    log.error(`Agent "${slug}" not found.`);
    process.exit(1);
  }

  if (!agent.menu || agent.menu.length === 0) {
    log.warn(`Agent "${slug}" has no menu entries.`);
    return;
  }

  const label = formatAgentLabel(agent);
  log.heading(`${label} — Menu`);
  console.log();

  for (const entry of agent.menu) {
    console.log(`  ${entry.trigger}`);
    log.dim(`    ${entry.description}`);
    log.dim(`    → ${entry.command}`);
    console.log();
  }
}

export function resolveMenuTrigger(
  slug: string,
  trigger: string,
  cwd: string = process.cwd(),
): MenuEntry | null {
  const agentRegistry = new AgentRegistry(cwd);
  const agent = agentRegistry.getBySlug(slug);

  if (!agent?.menu) return null;

  return agent.menu.find((m) => m.trigger === trigger) ?? null;
}

function formatAgentLabel(agent: AgentConfig): string {
  const parts: string[] = [];
  if (agent.persona?.icon) parts.push(agent.persona.icon);
  if (agent.persona?.displayName) {
    parts.push(agent.persona.displayName);
  } else {
    parts.push(agent.name || agent.slug);
  }
  return parts.join(" ");
}
