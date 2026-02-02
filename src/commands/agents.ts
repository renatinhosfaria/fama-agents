import { AgentRegistry } from "../core/agent-registry.js";
import { SkillRegistry } from "../core/skill-registry.js";
import { log } from "../utils/logger.js";

export function agentsListCommand(cwd: string = process.cwd()) {
  const skillRegistry = new SkillRegistry(cwd);
  const agentRegistry = new AgentRegistry(cwd);
  const agents = agentRegistry.getAll();

  log.heading("Available Agents");

  for (const agent of agents) {
    console.log(`  ${agent.slug}`);
    log.dim(`    ${agent.description}`);
    log.dim(`    Tools: ${agent.tools.join(", ")}`);
    log.dim(`    Phases: ${agent.phases.join(", ")}`);
    log.dim(`    Skills: ${agent.defaultSkills.join(", ")}`);
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

  log.heading(agent.name || agent.slug);
  console.log(agent.description);
  console.log();
  log.dim(`Tools: ${agent.tools.join(", ")}`);
  log.dim(`Phases: ${agent.phases.join(", ")}`);
  log.dim(`Skills: ${agent.defaultSkills.join(", ")}`);
  log.dim(`Model: ${agent.model}`);

  if (agent.prompt) {
    console.log("\n--- Playbook ---\n");
    console.log(agent.prompt);
  }
}
