import { SkillRegistry } from "../core/skill-registry.js";
import { AgentRegistry } from "../core/agent-registry.js";
import { runAgent } from "../core/agent-runner.js";
import { detectScale, autoSelectAgent } from "../core/scale-detector.js";
import { loadConfig } from "../utils/config.js";
import { log } from "../utils/logger.js";
import { ProjectScale } from "../core/types.js";
import { scaleLabel } from "../workflow/scaling.js";
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

interface QuickOptions {
  agent?: string;
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

export async function quickCommand(task: string, opts: QuickOptions) {
  const cwd = opts.cwd ?? process.cwd();
  const config = loadConfig(cwd);
  const skillRegistry = new SkillRegistry(cwd, config.skillsDir);
  const agentRegistry = new AgentRegistry(cwd);

  const scale = detectScale(task);
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

  if (scale >= ProjectScale.MEDIUM) {
    log.warn(
      `Task detected as ${scaleLabel(scale)}. "fama quick" is designed for QUICK/SMALL tasks.`,
    );
    log.info(`Consider using: fama run "${task}"`);
    log.info("Proceeding anyway with reduced ceremony...");
  }

  const agentSlug = opts.agent ?? autoSelectAgent(task);
  const agentConfig = agentRegistry.getBySlug(agentSlug);

  if (!agentConfig) {
    log.error(`Agent "${agentSlug}" not found.`);
    log.info("Available agents:");
    for (const a of agentRegistry.getAll()) {
      log.dim(`  ${a.slug} - ${a.description}`);
    }
    process.exit(1);
  }

  log.heading(`[quick] Agent: ${agentSlug} | Scale: ${scaleLabel(scale)}`);

  const extraSkills: string[] = [];
  if (scale === ProjectScale.SMALL) {
    extraSkills.push("writing-plans");
  }

  const manifoldEnabled = runtime.enabled && config.llmFirst.manifold.enabled;
  let manifold = null as ReturnType<typeof ensureManifold> | null;
  let context: string | undefined;

  if (manifoldEnabled && runtime.contextBudget !== undefined) {
    const workflowState = createAdhocWorkflowState("adhoc-quick", phase, scale);
    manifold = ensureManifold(cwd, workflowState);
    const selected = selectManifoldContext(manifold, phase, runtime.contextBudget);
    context = selected.context;
  }

  try {
    const result = await runAgent(
      {
        task,
        agent: agentSlug,
        skills: extraSkills,
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

    log.success("Quick task completed.");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (runtime.outputFormat !== "raw") {
      const payload = {
        ok: false,
        error: { message },
        meta: { agent: agentSlug, phase },
      };
      const text =
        runtime.outputFormat === "pretty"
          ? JSON.stringify(payload, null, 2)
          : JSON.stringify(payload);
      console.log(text);
    } else {
      log.error(`Quick task failed: ${message}`);
    }
    process.exit(1);
  }
}
