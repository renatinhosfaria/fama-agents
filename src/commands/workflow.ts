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
import {
  executeAgentsInParallel,
  isPhaseParallelizable,
} from "../core/parallel-executor.js";
import { parseStructuredOutputWithDetails } from "../core/output-protocol.js";
import {
  applyLogMode,
  buildStructuredOutputFromResult,
  ensureManifold,
  formatCliOutput,
  recordOutputToManifold,
  resolveLlmFirstRuntime,
  selectManifoldContext,
} from "../utils/llm-first.js";

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
  structured?: boolean;
  output?: string;
  quiet?: boolean;
  human?: boolean;
  skillBudget?: string;
  contextBudget?: string;
  parallel?: boolean;
}

function resolveMaxTurns(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) || parsed <= 0 ? fallback : parsed;
}

function parseIntOption(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? undefined : parsed;
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

export async function workflowAdvanceCommand(opts: WorkflowAdvanceOptions = {}) {
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
    const result = await engine.advance();
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

  const runtime = resolveLlmFirstRuntime(config, {
    structured: opts.structured,
    output: opts.output,
    quiet: opts.quiet,
    human: opts.human,
    skillBudget: parseIntOption(opts.skillBudget),
    contextBudget: parseIntOption(opts.contextBudget),
    parallel: opts.parallel,
    scale: state.scale,
  });

  applyLogMode(runtime.quiet);

  const recommendedAgents = engine.getRecommendedAgents();
  const selectedAgents = opts.agent
    ? [opts.agent]
    : recommendedAgents.length > 0
      ? recommendedAgents
      : [autoSelectAgent(task)];

  for (const agentSlug of selectedAgents) {
    const agentConfig = agentRegistry.getBySlug(agentSlug);
    if (!agentConfig) {
      log.error(`Agent "${agentSlug}" not found.`);
      log.info("Available agents:");
      for (const a of agentRegistry.getAll()) {
        log.dim(`  ${a.slug} - ${a.description}`);
      }
      process.exit(1);
    }
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
  log.info(`Agents: ${selectedAgents.join(", ")}`);
  log.info(`Skills: ${skills.join(", ") || "(none)"}`);

  const manifoldEnabled = runtime.enabled && config.llmFirst.manifold.enabled;
  let manifold = null as ReturnType<typeof ensureManifold> | null;
  let context: string | undefined;

  if (manifoldEnabled && runtime.contextBudget !== undefined) {
    manifold = ensureManifold(cwd, state);
    const selected = selectManifoldContext(manifold, phase, runtime.contextBudget);
    context = selected.context;
  }

  const parallelAllowed =
    runtime.parallel &&
    config.llmFirst.parallel.phases.includes(phase) &&
    isPhaseParallelizable(phase);

  if (parallelAllowed && selectedAgents.length > 1) {
    const tasks = selectedAgents.map((agent) => ({
      agent,
      task: `[${phase}:${agent.toUpperCase()}] ${contextualTask}`,
      skills,
    }));

    const summary = await executeAgentsInParallel(tasks, agentRegistry, skillRegistry, {
      model,
      maxTurns,
      cwd,
      verbose: opts.verbose ?? false,
      scale: state.scale,
      skillTokenBudget: runtime.skillBudget,
      context,
      structured: runtime.structured,
      phaseOverride: phase,
    });

    const results = summary.results.map((result) => {
      const raw = result.result ?? result.error ?? "";
      const parsed = parseStructuredOutputWithDetails(raw);
      if (parsed.output) {
        parsed.output.meta.phase = phase;
      }
      return {
        agent: result.agent,
        status: result.status,
        durationMs: result.durationMs,
        costUSD: result.costUSD,
        output: parsed.output ?? undefined,
        parseError: parsed.output ? undefined : parsed.error ?? undefined,
        raw: parsed.output ? undefined : raw,
        error: result.status === "error" ? result.error : undefined,
      };
    });

    let parseErrors = 0;
    for (const r of results) {
      if (r.parseError) parseErrors++;
    }

    // Write run records and update manifold
    for (const result of summary.results) {
      const raw = result.result ?? result.error;
      const finishedAt = new Date();
      const startedAt = new Date(finishedAt.getTime() - result.durationMs);

      const recordPath = writeRunRecord(cwd, {
        status: result.status,
        workflowName: state.name,
        phase,
        task: contextualTask,
        taskOriginal: task,
        agent: result.agent,
        skills,
        model,
        maxTurns,
        cwd,
        startedAt: startedAt.toISOString(),
        finishedAt: finishedAt.toISOString(),
        durationMs: result.durationMs,
        costUSD: result.costUSD,
        result: result.status === "success" ? result.result : undefined,
        error: result.status === "error" ? result.error : undefined,
      });

      engine.appendOutput(phase, recordPath);

      if (manifoldEnabled && manifold) {
        const { output } = buildStructuredOutputFromResult(
          raw,
          phase,
          result.agent,
          config.llmFirst.manifold.policy,
          phase,
        );
        if (output) {
          manifold = recordOutputToManifold(cwd, manifold, phase, output);
        }
      }
    }

    if (runtime.outputFormat === "raw") {
      for (const result of summary.results) {
        const header = `=== ${result.agent} (${result.status}) ===`;
        const body = result.result ?? result.error ?? "";
        console.log(`${header}\n${body}\n`);
      }
    } else {
      const payload = {
        phase,
        workflow: state.name,
        summary: {
          totalDurationMs: summary.totalDurationMs,
          totalCostUSD: summary.totalCostUSD,
          successCount: summary.successCount,
          errorCount: summary.errorCount,
        },
        results,
        parseErrors,
      };
      const text =
        runtime.outputFormat === "pretty"
          ? JSON.stringify(payload, null, 2)
          : JSON.stringify(payload);
      console.log(text);
    }

    if (opts.complete || opts.advance) {
      engine.completeCurrent();
    }

    if (opts.advance) {
      try {
        const advanced = await engine.advance();
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

    return;
  }

  const agentSlug = selectedAgents[0] ?? autoSelectAgent(task);

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
        structured: runtime.structured,
        skillTokenBudget: runtime.skillBudget,
        context,
        scale: state.scale,
        phaseOverride: phase,
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
    if (runtime.outputFormat !== "raw") {
      const payload = {
        ok: false,
        error: { message: err instanceof Error ? err.message : String(err) },
        meta: { agent: agentSlug, phase },
      };
      const text =
        runtime.outputFormat === "pretty"
          ? JSON.stringify(payload, null, 2)
          : JSON.stringify(payload);
      console.log(text);
    } else {
      log.error(err instanceof Error ? err.message : String(err));
    }
    process.exit(1);
  }

  writeRecord("success");

  if (manifoldEnabled && manifold) {
    const { output } = buildStructuredOutputFromResult(
      result,
      phase,
      agentSlug,
      config.llmFirst.manifold.policy,
      phase,
    );
    if (output) {
      manifold = recordOutputToManifold(cwd, manifold, phase, output);
    }
  }

  const formatted = formatCliOutput(result, {
    outputFormat: runtime.outputFormat,
    agent: agentSlug,
    phase,
    phaseOverride: phase,
  });
  console.log(formatted.text);

  if (recordPath) {
    log.success(`Run recorded at ${recordPath}`);
  }

  if (opts.complete || opts.advance) {
    engine.completeCurrent();
  }

  if (opts.advance) {
    try {
      const advanced = await engine.advance();
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
