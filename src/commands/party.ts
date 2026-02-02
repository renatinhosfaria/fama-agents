import { AgentRegistry } from "../core/agent-registry.js";
import { SkillRegistry } from "../core/skill-registry.js";
import { loadConfig } from "../utils/config.js";
import { log } from "../utils/logger.js";
import {
  selectAgents,
  generateRound,
  synthesize,
  type PartyRound,
} from "../core/party-orchestrator.js";

interface PartyCommandOpts {
  rounds?: string;
  agents?: string;
  model?: string;
  maxTurns?: string;
  verbose?: boolean;
  cwd?: string;
}

export async function partyCommand(
  topic: string,
  opts: PartyCommandOpts,
): Promise<void> {
  const cwd = opts.cwd ?? process.cwd();
  const config = loadConfig(cwd);
  const numRounds = opts.rounds ? parseInt(opts.rounds, 10) : 3;
  const agentSlugs = opts.agents?.split(",").map((s) => s.trim());
  const model = opts.model ?? config.model;
  const maxTurns = opts.maxTurns ? parseInt(opts.maxTurns, 10) : 10;

  const registry = new AgentRegistry(cwd);
  const skillRegistry = new SkillRegistry(cwd, config.skillsDir);

  const participants = selectAgents(registry, agentSlugs, 3);
  if (participants.length === 0) {
    log.error("Nenhum agente disponível para o party.");
    process.exit(1);
  }

  const labels = participants.map((a) => {
    const p = a.persona;
    return p?.icon ? `${p.icon} ${p.displayName ?? a.slug}` : a.slug;
  });

  log.heading(`Party Mode: "${topic}"`);
  log.dim(`  Participantes: ${labels.join(", ")}`);
  log.dim(`  Rounds: ${numRounds}`);
  console.log("");

  const history: PartyRound[] = [];

  for (let r = 1; r <= numRounds; r++) {
    // Round-robin: pick agent for this round
    const agentIndex = (r - 1) % participants.length;
    const agent = participants[agentIndex]!;

    log.heading(`Round ${r}/${numRounds}`);

    const round = await generateRound(
      topic,
      history,
      agent,
      r,
      registry,
      skillRegistry,
      { rounds: numRounds, model, maxTurns, verbose: opts.verbose, cwd },
    );

    history.push(round);
    console.log(`\n${round.displayLabel}:`);
    console.log(round.response);
    console.log("");
  }

  // Final synthesis
  log.heading("Síntese");
  const summary = synthesize(history);
  console.log(summary);
}
