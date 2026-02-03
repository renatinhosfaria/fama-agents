import { SkillRegistry } from "../core/skill-registry.js";
import { AgentRegistry } from "../core/agent-registry.js";
import { runAgent } from "../core/agent-runner.js";
import { detectScale } from "../core/scale-detector.js";
import { loadConfig } from "../utils/config.js";
import { log } from "../utils/logger.js";
import { ProjectScale } from "../core/types.js";
import {
  applyLogMode,
  buildStructuredOutputFromResult,
  createAdhocWorkflowState,
  ensureManifold,
  formatCliOutput,
  parsePhase,
  recordOutputToManifold,
  resolveLlmFirstRuntime,
  selectManifoldContext,
} from "../utils/llm-first.js";

interface PlanOptions {
  execute?: string;
  model?: string;
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

export async function planCommand(description: string, opts: PlanOptions) {
  const cwd = opts.cwd ?? process.cwd();
  const config = loadConfig(cwd);
  const skillRegistry = new SkillRegistry(cwd, config.skillsDir);
  const agentRegistry = new AgentRegistry(cwd);

  const scale = opts.execute ? ProjectScale.MEDIUM : detectScale(description);
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

  const defaultPhase = opts.execute ? "E" : "P";
  const phase = parsePhase(opts.phase, defaultPhase);

  const manifoldEnabled = runtime.enabled && config.llmFirst.manifold.enabled;
  let manifold = null as ReturnType<typeof ensureManifold> | null;
  let context: string | undefined;

  if (manifoldEnabled && runtime.contextBudget !== undefined) {
    const workflowState = createAdhocWorkflowState("adhoc-plan", phase, scale);
    manifold = ensureManifold(cwd, workflowState);
    const selected = selectManifoldContext(manifold, phase, runtime.contextBudget);
    context = selected.context;
  }

  if (opts.execute) {
    // Execute an existing plan
    log.heading("Executing plan...");

    try {
      const result = await runAgent(
        {
          task: `Execute the implementation plan at ${opts.execute}. Follow each task step by step using TDD. Report progress after each task.`,
          agent: "feature-developer",
          skills: ["executing-plans", "test-driven-development", "verification"],
          model: opts.model ?? config.model,
          maxTurns: config.maxTurns,
          verbose: opts.verbose ?? false,
          cwd,
          structured: runtime.structured,
          skillTokenBudget: runtime.skillBudget,
          context,
          scale,
          phaseOverride: phase,
        },
        agentRegistry,
        skillRegistry,
      );

      if (manifoldEnabled && manifold) {
        const { output } = buildStructuredOutputFromResult(
          result,
          phase,
          "feature-developer",
          config.llmFirst.manifold.policy,
          phase,
        );
        if (output) {
          manifold = recordOutputToManifold(cwd, manifold, phase, output);
        }
      }

      const formatted = formatCliOutput(result, {
        outputFormat: runtime.outputFormat,
        agent: "feature-developer",
        phase,
        phaseOverride: phase,
      });
      console.log(formatted.text);

      log.success("Plan execution completed.");
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (runtime.outputFormat !== "raw") {
        const payload = {
          ok: false,
          error: { message },
          meta: { agent: "feature-developer", phase },
        };
        const text =
          runtime.outputFormat === "pretty"
            ? JSON.stringify(payload, null, 2)
            : JSON.stringify(payload);
        console.log(text);
      } else {
        log.error(`Plan execution failed: ${message}`);
      }
      process.exit(1);
    }
    return;
  }

  // Create a new plan
  log.heading("Creating implementation plan...");

  try {
    const result = await runAgent(
      {
        task: `Create a detailed implementation plan for: ${description}. Break it into small, testable tasks. Save the plan to docs/plans/ directory.`,
        agent: "architect",
        skills: ["brainstorming", "writing-plans", "feature-breakdown"],
        model: opts.model ?? config.model,
        maxTurns: config.maxTurns,
        verbose: opts.verbose ?? false,
        cwd,
        structured: runtime.structured,
        skillTokenBudget: runtime.skillBudget,
        context,
        scale,
        phaseOverride: phase,
      },
      agentRegistry,
      skillRegistry,
    );

    if (manifoldEnabled && manifold) {
      const { output } = buildStructuredOutputFromResult(
        result,
        phase,
        "architect",
        config.llmFirst.manifold.policy,
        phase,
      );
      if (output) {
        manifold = recordOutputToManifold(cwd, manifold, phase, output);
      }
    }

    const formatted = formatCliOutput(result, {
      outputFormat: runtime.outputFormat,
      agent: "architect",
      phase,
      phaseOverride: phase,
    });
    console.log(formatted.text);

    log.success("Plan created.");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (runtime.outputFormat !== "raw") {
      const payload = {
        ok: false,
        error: { message },
        meta: { agent: "architect", phase },
      };
      const text =
        runtime.outputFormat === "pretty"
          ? JSON.stringify(payload, null, 2)
          : JSON.stringify(payload);
      console.log(text);
    } else {
      log.error(`Plan creation failed: ${message}`);
    }
    process.exit(1);
  }
}
