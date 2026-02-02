import type { RunAgentEvent } from "../core/types.js";
import { AgentRegistry } from "../core/agent-registry.js";
import { runAgent } from "../core/agent-runner.js";
import { autoSelectAgent } from "../core/scale-detector.js";
import { SkillRegistry } from "../core/skill-registry.js";
import { WorkflowEngine } from "../core/workflow-engine.js";
import { loadConfig } from "../utils/config.js";
import { log } from "../utils/logger.js";
import { writeRunRecord } from "../utils/observability.js";
import { PHASE_DEFINITIONS } from "../workflow/phases.js";
import { parseScale } from "../workflow/scaling.js";

interface WorkflowInitOptions {
  scale?: string;
  cwd?: string;
}

interface WorkflowStatusOptions {
  cwd?: string;
}

interface WorkflowAdvanceOptions {
  cwd?: string;
}

interface WorkflowCompleteOptions {
  cwd?: string;
}

interface WorkflowRunOptions {
  agent?: string;
  skills?: string;
  model?: string;
  maxTurns?: string;
  verbose?: boolean;
  cwd?: string;
  complete?: boolean;
  advance?: boolean;
}

function resolveMaxTurns(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) || parsed <= 0 ? fallback : parsed;
}

export function workflowInitCommand(
  name: string,
  opts: WorkflowInitOptions = {},
) {
  const cwd = opts.cwd ?? process.cwd();
  const config = loadConfig(cwd);
  const engine = new WorkflowEngine(cwd, { gates: config.workflow.gates });

  if (engine.exists()) {
    log.warn("A workflow already exists. Use 'fama workflow status' to check.");
    return;
  }

  const scale = opts.scale ? parseScale(opts.scale) : config.workflow.defaultScale;
  engine.init(name, scale);

  log.success(`Workflow "${name}" initialized.`);
  console.log(engine.getSummary());
  console.log();
  log.info(`Recommended agents: ${engine.getRecommendedAgents().join(", ")}`);
  log.info(`Recommended skills: ${engine.getRecommendedSkills().join(", ")}`);
}

export function workflowStatusCommand(opts: WorkflowStatusOptions = {}) {
  const cwd = opts.cwd ?? process.cwd();
  const config = loadConfig(cwd);
  const engine = new WorkflowEngine(cwd, { gates: config.workflow.gates });

  if (!engine.exists()) {
    log.warn("No active workflow. Use 'fama workflow init <name>' to create one.");
    return;
  }

  console.log(engine.getSummary());

  if (engine.isComplete()) {
    log.success("\nWorkflow is complete!");
  } else {
    console.log();
    log.info(`Recommended agents: ${engine.getRecommendedAgents().join(", ")}`);
    log.info(`Recommended skills: ${engine.getRecommendedSkills().join(", ")}`);
  }
}

export function workflowAdvanceCommand(opts: WorkflowAdvanceOptions = {}) {
  const cwd = opts.cwd ?? process.cwd();
  const config = loadConfig(cwd);
  const engine = new WorkflowEngine(cwd, { gates: config.workflow.gates });

  if (!engine.exists()) {
    log.warn("No active workflow. Use 'fama workflow init <name>' to create one.");
    return;
  }

  if (engine.isComplete()) {
    log.success("Workflow is already complete!");
    return;
  }

  try {
    const result = engine.advance();
    if (result) {
      log.success(`Advanced to phase ${result.phase}.`);
      console.log(engine.getSummary());
    } else {
      log.success("Workflow completed!");
      console.log(engine.getSummary());
    }
  } catch (err) {
    log.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}

export function workflowCompleteCommand(opts: WorkflowCompleteOptions = {}) {
  const cwd = opts.cwd ?? process.cwd();
  const config = loadConfig(cwd);
  const engine = new WorkflowEngine(cwd, { gates: config.workflow.gates });

  if (!engine.exists()) {
    log.warn("No active workflow. Use 'fama workflow init <name>' to create one.");
    return;
  }

  const state = engine.completeCurrent();
  if (!state) {
    log.warn("No active workflow state found.");
    return;
  }

  log.success(`Phase ${state.currentPhase} marked as completed.`);
  console.log(engine.getSummary());
}

export async function workflowRunCommand(
  task: string,
  opts: WorkflowRunOptions,
) {
  const cwd = opts.cwd ?? process.cwd();
  const config = loadConfig(cwd);
  const engine = new WorkflowEngine(cwd, { gates: config.workflow.gates });

  if (!engine.exists()) {
    log.warn("No active workflow. Use 'fama workflow init <name>' to create one.");
    return;
  }

  const state = engine.getStatus();
  if (!state) {
    log.warn("No active workflow state found.");
    return;
  }

  const phase = state.currentPhase;
  const phaseDef = PHASE_DEFINITIONS[phase];
  const agentRegistry = new AgentRegistry(cwd);
  const skillRegistry = new SkillRegistry(cwd, config.skillsDir);

  const recommendedAgents = engine.getRecommendedAgents();
  const agentSlug = opts.agent ?? recommendedAgents[0] ?? autoSelectAgent(task);
  const agentConfig = agentRegistry.getBySlug(agentSlug);

  if (!agentConfig) {
    log.error(`Agent "${agentSlug}" not found.`);
    log.info("Available agents:");
    for (const a of agentRegistry.getAll()) {
      log.dim(`  ${a.slug} - ${a.description}`);
    }
    process.exit(1);
  }

  const phaseSkills = engine.getRecommendedSkills();
  const extraSkills =
    opts.skills
      ?.split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0) ?? [];
  const skills = [...phaseSkills, ...extraSkills];

  const maxTurns = resolveMaxTurns(opts.maxTurns, config.maxTurns);
  const model = opts.model ?? config.model;
  const contextualTask = `[Workflow: ${state.name}] [Phase: ${phase} - ${phaseDef.name}] ${task}`;

  log.heading(`Workflow run: ${state.name}`);
  log.info(`Phase: ${phase} (${phaseDef.name})`);
  log.info(`Agent: ${agentSlug}`);
  log.info(`Skills: ${skills.join(", ") || "(none)"}`);

  let event: RunAgentEvent | undefined;
  let result: string | undefined;
  let recordPath: string | undefined;

  const writeRecord = (status: "success" | "error", error?: string) => {
    const fallbackTimestamp = new Date().toISOString();
    const metrics = event?.metrics ?? {
      agent: agentSlug,
      model,
      maxTurns,
      startedAt: fallbackTimestamp,
      finishedAt: fallbackTimestamp,
      durationMs: 0,
    };

    recordPath = writeRunRecord(cwd, {
      status,
      workflowName: state.name,
      phase,
      task: contextualTask,
      taskOriginal: task,
      agent: metrics.agent,
      skills,
      model: metrics.model,
      maxTurns: metrics.maxTurns,
      cwd,
      startedAt: metrics.startedAt,
      finishedAt: metrics.finishedAt,
      durationMs: metrics.durationMs,
      costUSD: metrics.costUSD,
      turns: metrics.turns,
      result,
      error,
    });

    engine.appendOutput(phase, recordPath);
  };

  try {
    result = await runAgent(
      {
        task: contextualTask,
        agent: agentSlug,
        skills,
        model,
        maxTurns,
        verbose: opts.verbose ?? false,
        cwd,
        onEvent: (e) => {
          event = e;
        },
      },
      agentRegistry,
      skillRegistry,
    );
  } catch (err) {
    writeRecord(
      "error",
      err instanceof Error ? err.message : String(err),
    );
    if (recordPath) {
      log.warn(`Run recorded at ${recordPath}`);
    }
    log.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }

  writeRecord("success");

  if (result) {
    console.log("\n" + result);
  }

  if (recordPath) {
    log.success(`Run recorded at ${recordPath}`);
  }

  if (opts.complete || opts.advance) {
    engine.completeCurrent();
  }

  if (opts.advance) {
    try {
      const advanced = engine.advance();
      if (advanced) {
        log.success(`Advanced to phase ${advanced.phase}.`);
      } else {
        log.success("Workflow completed!");
      }
    } catch (err) {
      log.error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  }
}
