import { AgentRegistry } from "../core/agent-registry.js";
import { log } from "../utils/logger.js";

export function agentsListCommand(cwd: string = process.cwd(), options?: { json?: boolean }) {
  const agentRegistry = new AgentRegistry(cwd);
  const agents = agentRegistry.getAll();

  if (options?.json) {
    console.log(JSON.stringify(agents.map((a) => ({
      slug: a.slug,
      name: a.name,
      description: a.description,
      tools: a.tools,
      phases: a.phases,
      defaultSkills: a.defaultSkills,
      model: a.model,
      persona: a.persona,
      criticalActions: a.criticalActions,
      menu: a.menu,
    })), null, 2));
    return;
  }

  log.heading("Available Agents");

  for (const agent of agents) {
    const icon = agent.persona?.icon ? `${agent.persona.icon} ` : "";
    const displayName = agent.persona?.displayName ?? "";
    const nameLabel = displayName ? ` (${displayName})` : "";
    console.log(`  ${icon}${agent.slug}${nameLabel}`);
    log.dim(`    ${agent.description}`);
    log.dim(`    Phases: ${agent.phases.join(", ")}`);
    if (agent.persona?.role) {
      log.dim(`    Role: ${agent.persona.role}`);
    }
    console.log();
  }

  log.dim(`Total: ${agents.length} agents`);
}

export function agentsShowCommand(slug: string, cwd: string = process.cwd()) {
  const agentRegistry = new AgentRegistry(cwd);
  const agent = agentRegistry.getBySlug(slug);

  if (!agent) {
    log.error(`Agent "${slug}" not found.`);
    process.exit(1);
  }

  const icon = agent.persona?.icon ? `${agent.persona.icon} ` : "";
  const displayName = agent.persona?.displayName ?? agent.name ?? agent.slug;
  log.heading(`${icon}${displayName}`);
  console.log(agent.description);
  console.log();
  log.dim(`Tools: ${agent.tools.join(", ")}`);
  log.dim(`Phases: ${agent.phases.join(", ")}`);
  log.dim(`Skills: ${agent.defaultSkills.join(", ")}`);
  log.dim(`Model: ${agent.model}`);

  if (agent.persona) {
    console.log("\n--- Persona ---\n");
    if (agent.persona.role) console.log(`  Role: ${agent.persona.role}`);
    if (agent.persona.identity) console.log(`  Identity: ${agent.persona.identity}`);
    if (agent.persona.communicationStyle)
      console.log(`  Style: ${agent.persona.communicationStyle}`);
    if (agent.persona.principles && agent.persona.principles.length > 0) {
      console.log("  Principles:");
      for (const p of agent.persona.principles) {
        console.log(`    - ${p}`);
      }
    }
  }

  if (agent.criticalActions && agent.criticalActions.length > 0) {
    console.log("\n--- Critical Actions ---\n");
    for (const action of agent.criticalActions) {
      console.log(`  ⚠️  ${action}`);
    }
  }

  if (agent.menu && agent.menu.length > 0) {
    console.log("\n--- Menu ---\n");
    for (const entry of agent.menu) {
      console.log(`  ${entry.trigger} — ${entry.description}`);
      log.dim(`    → ${entry.command}`);
    }
  }

  if (agent.prompt) {
    console.log("\n--- Playbook ---\n");
    console.log(agent.prompt);
  }
}
