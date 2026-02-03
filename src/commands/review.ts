import { readFileSync } from "node:fs";
import { SkillRegistry } from "../core/skill-registry.js";
import { AgentRegistry } from "../core/agent-registry.js";
import { runAgent } from "../core/agent-runner.js";
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

interface ReviewOptions {
  model?: string;
  verbose?: boolean;
  validate?: boolean;
  checklist?: string;
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

export async function reviewCommand(path: string | undefined, opts: ReviewOptions) {
  const cwd = opts.cwd ?? process.cwd();
  const config = loadConfig(cwd);
  const skillRegistry = new SkillRegistry(cwd, config.skillsDir);
  const agentRegistry = new AgentRegistry(cwd);

  const scale = ProjectScale.MEDIUM;
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

  const phase = parsePhase(opts.phase, "R");

  const target = path ?? ".";
  const isValidateMode = opts.validate === true;

  if (isValidateMode) {
    log.heading(`Adversarial validation: ${target}`);
  } else {
    log.heading(`Code review: ${target}`);
  }

  const skills = isValidateMode
    ? ["adversarial-review", "verification"]
    : ["code-review", "verification"];

  let task: string;

  if (isValidateMode) {
    let checklistContent = "";
    if (opts.checklist) {
      try {
        checklistContent = readFileSync(opts.checklist, "utf-8");
      } catch (err) {
        log.error(
          `Falha ao ler checklist "${opts.checklist}": ${err instanceof Error ? err.message : String(err)}`,
        );
        process.exit(1);
      }
    }

    task = checklistContent
      ? `Validate the code at ${target} against the following checklist. Use adversarial review — zero findings triggers mandatory re-analysis.\n\n--- CHECKLIST ---\n${checklistContent}\n--- END CHECKLIST ---`
      : `Validate the code at ${target} using adversarial review. Zero findings triggers mandatory re-analysis. Apply all lenses: Security, Edge Cases, Maintenance, Performance, Conformity.`;
  } else {
    task = `Review the code at ${target}. Check for quality, security, correctness, and adherence to best practices. Categorize issues as Critical, Important, or Suggestion.`;
  }

  const manifoldEnabled = runtime.enabled && config.llmFirst.manifold.enabled;
  let manifold = null as ReturnType<typeof ensureManifold> | null;
  let context: string | undefined;

  if (manifoldEnabled && runtime.contextBudget !== undefined) {
    const workflowState = createAdhocWorkflowState("adhoc-review", phase, scale);
    manifold = ensureManifold(cwd, workflowState);
    const selected = selectManifoldContext(manifold, phase, runtime.contextBudget);
    context = selected.context;
  }

  try {
    const result = await runAgent(
      {
        task,
        agent: "code-reviewer",
        skills,
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
        "code-reviewer",
        config.llmFirst.manifold.policy,
        phase,
      );
      if (output) {
        manifold = recordOutputToManifold(cwd, manifold, phase, output);
      }
    }

    const formatted = formatCliOutput(result, {
      outputFormat: runtime.outputFormat,
      agent: "code-reviewer",
      phase,
      phaseOverride: phase,
    });
    console.log(formatted.text);

    log.success(isValidateMode ? "Validation completed." : "Review completed.");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (runtime.outputFormat !== "raw") {
      const payload = {
        ok: false,
        error: { message },
        meta: { agent: "code-reviewer", phase },
      };
      const text =
        runtime.outputFormat === "pretty"
          ? JSON.stringify(payload, null, 2)
          : JSON.stringify(payload);
      console.log(text);
    } else {
      log.error(`Review failed: ${message}`);
    }
    process.exit(1);
  }
}
