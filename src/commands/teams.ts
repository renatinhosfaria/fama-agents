import { loadConfig } from "../utils/config.js";
import { AgentRegistry } from "../core/agent-registry.js";
import { log } from "../utils/logger.js";
import type { TeamConfig } from "../core/types.js";

/**
 * Lists all configured teams from .fama.yaml
 */
export function teamsListCommand(cwd: string = process.cwd()): void {
  const config = loadConfig(cwd);
  const teams = config.teams;

  if (!teams || Object.keys(teams).length === 0) {
    log.info("Nenhum team configurado em .fama.yaml");
    log.dim('  Adicione teams em .fama.yaml na chave "teams"');
    return;
  }

  log.heading("Teams");
  for (const [key, team] of Object.entries(teams)) {
    const agentCount = team.agents.length;
    const skillsLabel = team.defaultSkills?.length
      ? ` | Skills: ${team.defaultSkills.join(", ")}`
      : "";
    console.log(`  ${key}  ${team.name} (${agentCount} agents${skillsLabel})`);
    if (team.description) {
      log.dim(`    ${team.description}`);
    }
  }
}

/**
 * Shows detailed info about a specific team.
 */
export function teamsShowCommand(
  name: string,
  cwd: string = process.cwd(),
): void {
  const config = loadConfig(cwd);
  const teams = config.teams;

  if (!teams || !teams[name]) {
    console.error(`Team "${name}" não encontrado.`);
    process.exit(1);
  }

  const team = teams[name] as TeamConfig;
  const registry = new AgentRegistry(cwd);

  log.heading(`Team: ${team.name}`);
  if (team.description) {
    log.dim(`  ${team.description}`);
  }

  console.log("\n  Agentes:");
  for (const slug of team.agents) {
    const agent = registry.getBySlug(slug);
    if (agent) {
      const persona = agent.persona;
      const label = persona?.icon
        ? `${persona.icon} ${persona.displayName ?? slug}`
        : slug;
      console.log(`    - ${label} (${agent.description || "sem descrição"})`);
    } else {
      console.log(`    - ${slug} (⚠ não encontrado)`);
    }
  }

  if (team.defaultSkills && team.defaultSkills.length > 0) {
    console.log(`\n  Skills padrão: ${team.defaultSkills.join(", ")}`);
  }
}

/**
 * Resolves a team config by name.
 */
export function resolveTeam(
  name: string,
  cwd: string = process.cwd(),
): TeamConfig | null {
  const config = loadConfig(cwd);
  return config.teams?.[name] ?? null;
}
