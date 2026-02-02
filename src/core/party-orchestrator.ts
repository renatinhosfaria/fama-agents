import type { AgentConfig } from "./types.js";
import type { AgentRegistry } from "./agent-registry.js";
import type { SkillRegistry } from "./skill-registry.js";
import { runAgent } from "./agent-runner.js";
import { log } from "../utils/logger.js";

export interface PartyRound {
  round: number;
  agentSlug: string;
  displayLabel: string;
  response: string;
}

export interface PartyOptions {
  rounds: number;
  agents?: string[];
  model?: string;
  maxTurns?: number;
  verbose?: boolean;
  cwd?: string;
}

/**
 * Selects agents for a party discussion.
 * If specific agents are provided, uses those; otherwise picks from registry.
 */
export function selectAgents(
  registry: AgentRegistry,
  agentSlugs?: string[],
  count: number = 3,
): AgentConfig[] {
  if (agentSlugs && agentSlugs.length > 0) {
    const selected: AgentConfig[] = [];
    for (const slug of agentSlugs) {
      const agent = registry.getBySlug(slug);
      if (agent) {
        selected.push(agent);
      } else {
        log.warn(`Agente "${slug}" não encontrado, ignorando.`);
      }
    }
    return selected;
  }

  // Auto-select: pick agents with personas first, then fill
  const all = registry.getAll();
  const withPersona = all.filter((a) => a.persona?.displayName);
  const rest = all.filter((a) => !a.persona?.displayName);
  const pool = [...withPersona, ...rest];
  return pool.slice(0, count);
}

function getAgentLabel(agent: AgentConfig): string {
  const persona = agent.persona;
  if (persona?.icon && persona?.displayName) {
    return `${persona.icon} ${persona.displayName}`;
  }
  if (persona?.displayName) {
    return persona.displayName;
  }
  return agent.slug;
}

function buildPartyContext(topic: string, history: PartyRound[]): string {
  const lines: string[] = [
    `You are participating in a multi-agent discussion about: "${topic}"`,
    "",
    "Respond in-character based on your persona and expertise.",
    "Build on previous contributions, offer your unique perspective, and constructively challenge ideas when appropriate.",
    "Keep your response focused and concise (200-400 words).",
  ];

  if (history.length > 0) {
    lines.push("", "--- DISCUSSION SO FAR ---", "");
    for (const round of history) {
      lines.push(`**${round.displayLabel}** (Round ${round.round}):`);
      lines.push(round.response);
      lines.push("");
    }
  }

  return lines.join("\n");
}

/**
 * Generates a single round of the party discussion.
 */
export async function generateRound(
  topic: string,
  history: PartyRound[],
  agent: AgentConfig,
  roundNumber: number,
  registry: AgentRegistry,
  skillRegistry: SkillRegistry,
  opts: PartyOptions,
): Promise<PartyRound> {
  const context = buildPartyContext(topic, history);
  const label = getAgentLabel(agent);

  log.dim(`  ${label} está pensando...`);

  const result = await runAgent(
    {
      task: context,
      agent: agent.slug,
      model: opts.model ?? "sonnet",
      maxTurns: opts.maxTurns ?? 10,
      verbose: opts.verbose ?? false,
      cwd: opts.cwd ?? process.cwd(),
    },
    registry,
    skillRegistry,
  );

  return {
    round: roundNumber,
    agentSlug: agent.slug,
    displayLabel: label,
    response: result ?? "(sem resposta)",
  };
}

/**
 * Generates a synthesis of all discussion rounds.
 */
export function synthesize(rounds: PartyRound[]): string {
  const lines: string[] = [
    "## Síntese da Discussão",
    "",
  ];

  const participants = [...new Set(rounds.map((r) => r.displayLabel))];
  lines.push(`**Participantes:** ${participants.join(", ")}`);
  lines.push(`**Rounds:** ${rounds.length}`);
  lines.push("");

  lines.push("### Contribuições");
  for (const round of rounds) {
    const summary = round.response.length > 150 ? `${round.response.slice(0, 150)}...` : round.response;
    lines.push(`- **${round.displayLabel}** (R${round.round}): ${summary}`);
  }

  return lines.join("\n");
}
