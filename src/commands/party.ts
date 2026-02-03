import { AgentRegistry } from "../core/agent-registry.js";
import { SkillRegistry } from "../core/skill-registry.js";
import { detectScale } from "../core/scale-detector.js";
import { loadConfig } from "../utils/config.js";
import { log } from "../utils/logger.js";
import { parseStructuredOutputWithDetails } from "../core/output-protocol.js";
import {
  applyLogMode,
  buildStructuredOutputFromResult,
  createAdhocWorkflowState,
  ensureManifold,
  parsePhase,
  recordOutputToManifold,
  resolveLlmFirstRuntime,
  selectManifoldContext,
} from "../utils/llm-first.js";
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
  structured?: boolean;
  output?: string;
  quiet?: boolean;
  human?: boolean;
  skillBudget?: string;
  contextBudget?: string;
  phase?: string;
}

function parseIntOption(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? undefined : parsed;
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

  const scale = detectScale(topic);
  const runtime = resolveLlmFirstRuntime(config, {
    structured: opts.structured,
    output: opts.output,
    quiet: opts.quiet,
    human: opts.human,
    skillBudget: parseIntOption(opts.skillBudget),
    contextBudget: parseIntOption(opts.contextBudget),
    scale,
  });

  applyLogMode(runtime.quiet);

  const phase = parsePhase(opts.phase, "P");

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

  if (runtime.outputFormat === "raw") {
    log.heading(`Party Mode: "${topic}"`);
    log.dim(`  Participantes: ${labels.join(", ")}`);
    log.dim(`  Rounds: ${numRounds}`);
    console.log("");
  }

  const manifoldEnabled = runtime.enabled && config.llmFirst.manifold.enabled;
  let manifold = null as ReturnType<typeof ensureManifold> | null;
  let context: string | undefined;

  if (manifoldEnabled && runtime.contextBudget !== undefined) {
    const workflowState = createAdhocWorkflowState("adhoc-party", phase, scale);
    manifold = ensureManifold(cwd, workflowState);
    const selected = selectManifoldContext(manifold, phase, runtime.contextBudget);
    context = selected.context;
  }

  const history: PartyRound[] = [];

  for (let r = 1; r <= numRounds; r++) {
    // Round-robin: pick agent for this round
    const agentIndex = (r - 1) % participants.length;
    const agent = participants[agentIndex]!;

    if (runtime.outputFormat === "raw") {
      log.heading(`Round ${r}/${numRounds}`);
    }

    const round = await generateRound(
      topic,
      history,
      agent,
      r,
      registry,
      skillRegistry,
      {
        rounds: numRounds,
        model,
        maxTurns,
        verbose: opts.verbose,
        cwd,
        structured: runtime.structured,
        skillTokenBudget: runtime.skillBudget,
        context,
        phaseOverride: phase,
        scale,
      },
    );

    history.push(round);

    if (manifoldEnabled && manifold) {
      const { output } = buildStructuredOutputFromResult(
        round.response,
        phase,
        round.agentSlug,
        config.llmFirst.manifold.policy,
        phase,
      );
      if (output) {
        manifold = recordOutputToManifold(cwd, manifold, phase, output);
      }
    }

    if (runtime.outputFormat === "raw") {
      console.log(`\n${round.displayLabel}:`);
      console.log(round.response);
      console.log("");
    }
  }

  if (runtime.outputFormat === "raw") {
    log.heading("Síntese");
    const summary = synthesize(history);
    console.log(summary);
    return;
  }

  const rounds = history.map((round) => {
    const parsed = parseStructuredOutputWithDetails(round.response);
    if (parsed.output) {
      parsed.output.meta.phase = phase;
    }
    return {
      round: round.round,
      agent: round.agentSlug,
      output: parsed.output ?? undefined,
      parseError: parsed.output ? undefined : parsed.error ?? undefined,
      raw: parsed.output ? undefined : round.response,
    };
  });

  const summary = rounds.map((round) => {
    if (round.output) {
      return {
        agent: round.agent,
        summary: round.output.result.summary,
      };
    }
    return {
      agent: round.agent,
      summary: (round.raw ?? "").slice(0, 150),
    };
  });

  const payload = {
    topic,
    rounds,
    summary,
  };

  const text =
    runtime.outputFormat === "pretty"
      ? JSON.stringify(payload, null, 2)
      : JSON.stringify(payload);
  console.log(text);
}
