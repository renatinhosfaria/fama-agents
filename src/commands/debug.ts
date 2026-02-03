import { SkillRegistry } from "../core/skill-registry.js";
import { AgentRegistry } from "../core/agent-registry.js";
import { runAgent } from "../core/agent-runner.js";
import { detectScale } from "../core/scale-detector.js";
import { loadConfig } from "../utils/config.js";
import { log } from "../utils/logger.js";
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

interface DebugOptions {
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

export async function debugCommand(description: string, opts: DebugOptions) {
  const cwd = opts.cwd ?? process.cwd();
  const config = loadConfig(cwd);
  const skillRegistry = new SkillRegistry(cwd, config.skillsDir);
  const agentRegistry = new AgentRegistry(cwd);

  const scale = detectScale(description);
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

  const phase = parsePhase(opts.phase, "E");

  log.heading("Systematic debugging session");

  const manifoldEnabled = runtime.enabled && config.llmFirst.manifold.enabled;
  let manifold = null as ReturnType<typeof ensureManifold> | null;
  let context: string | undefined;

  if (manifoldEnabled && runtime.contextBudget !== undefined) {
    const workflowState = createAdhocWorkflowState("adhoc-debug", phase, scale);
    manifold = ensureManifold(cwd, workflowState);
    const selected = selectManifoldContext(manifold, phase, runtime.contextBudget);
    context = selected.context;
  }

  try {
    const result = await runAgent(
      {
        task: `Debug the following issue: ${description}. Use systematic debugging: investigate root cause first, gather evidence, then propose and test a fix.`,
        agent: "bug-fixer",
        skills: ["systematic-debugging", "test-driven-development", "verification"],
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
        "bug-fixer",
        config.llmFirst.manifold.policy,
        phase,
      );
      if (output) {
        manifold = recordOutputToManifold(cwd, manifold, phase, output);
      }
    }

    const formatted = formatCliOutput(result, {
      outputFormat: runtime.outputFormat,
      agent: "bug-fixer",
      phase,
      phaseOverride: phase,
    });
    console.log(formatted.text);

    log.success("Debug session completed.");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (runtime.outputFormat !== "raw") {
      const payload = {
        ok: false,
        error: { message },
        meta: { agent: "bug-fixer", phase },
      };
      const text =
        runtime.outputFormat === "pretty"
          ? JSON.stringify(payload, null, 2)
          : JSON.stringify(payload);
      console.log(text);
    } else {
      log.error(`Debug failed: ${message}`);
    }
    process.exit(1);
  }
}
