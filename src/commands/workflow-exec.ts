import { loadConfig } from "../utils/config.js";
import { log } from "../utils/logger.js";
import { discoverWorkflows, loadStepfileWorkflow } from "../workflow/workflow-loader.js";
import { executeWorkflow } from "../workflow/step-executor.js";
import { parseStructuredOutputWithDetails } from "../core/output-protocol.js";
import {
  applyLogMode,
  parsePhase,
  resolveLlmFirstRuntime,
} from "../utils/llm-first.js";

interface WorkflowExecOptions {
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

export async function workflowExecCommand(name: string, opts: WorkflowExecOptions) {
  const cwd = opts.cwd ?? process.cwd();
  const config = loadConfig(cwd);

  const runtime = resolveLlmFirstRuntime(config, {
    structured: opts.structured,
    output: opts.output,
    quiet: opts.quiet,
    human: opts.human,
    skillBudget: parseIntOption(opts.skillBudget),
    contextBudget: parseIntOption(opts.contextBudget),
    scale: config.workflow.defaultScale,
  });

  applyLogMode(runtime.quiet);

  const available = discoverWorkflows(cwd);
  const match = available.find((w) => w.name === name);

  if (!match) {
    log.error(`Workflow "${name}" não encontrado.`);
    if (available.length > 0) {
      log.info("Workflows disponíveis:");
      for (const w of available) {
        log.dim(`  ${w.name} (${w.source})`);
      }
    } else {
      log.info("Nenhum workflow template encontrado. Crie em workflows/<name>/workflow.yaml");
    }
    process.exit(1);
  }

  const workflow = loadStepfileWorkflow(match.dir);
  if (!workflow) {
    log.error(`Falha ao carregar workflow "${name}".`);
    process.exit(1);
  }

  if (runtime.outputFormat === "raw") {
    log.heading(`Executando workflow: ${workflow.name}`);
    if (workflow.description) log.dim(`  ${workflow.description}`);
    log.info(`  ${workflow.steps.length} steps`);
    console.log();
  }

  const parsedTurns = opts.maxTurns ? parseInt(opts.maxTurns, 10) : NaN;
  const maxTurns = !Number.isNaN(parsedTurns) ? parsedTurns : config.maxTurns;

  const phase = parsePhase(opts.phase, "E");
  const stepResults: Array<{ step: string; agent: string; result?: string; error?: string }> = [];

  try {
    await executeWorkflow(workflow, {
      cwd,
      model: opts.model ?? config.model,
      maxTurns,
      verbose: opts.verbose ?? false,
      skillsDir: config.skillsDir,
      structured: runtime.structured,
      skillTokenBudget: runtime.skillBudget,
      contextBudget: runtime.contextBudget,
      phaseOverride: phase,
      outputFormat: runtime.outputFormat,
      quiet: runtime.quiet,
      scale: config.workflow.defaultScale,
      llmFirst: {
        enabled: runtime.enabled,
        manifoldEnabled: runtime.enabled && config.llmFirst.manifold.enabled,
        manifoldPolicy: config.llmFirst.manifold.policy,
      },
      onStepResult: ({ step, result, error }) => {
        stepResults.push({
          step: step.name,
          agent: step.agent,
          result,
          error,
        });
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (runtime.outputFormat !== "raw") {
      const payload = { ok: false, error: { message }, meta: { workflow: workflow.name } };
      const text =
        runtime.outputFormat === "pretty"
          ? JSON.stringify(payload, null, 2)
          : JSON.stringify(payload);
      console.log(text);
    } else {
      log.error(`Workflow falhou: ${message}`);
    }
    process.exit(1);
  }

  if (runtime.outputFormat !== "raw") {
    const steps = stepResults.map((step) => {
      const raw = step.result ?? step.error ?? "";
      const parsed = parseStructuredOutputWithDetails(raw);
      if (parsed.output) {
        parsed.output.meta.phase = phase;
      }
      return {
        step: step.step,
        agent: step.agent,
        output: parsed.output ?? undefined,
        parseError: parsed.output ? undefined : parsed.error ?? undefined,
        raw: parsed.output ? undefined : raw,
        error: step.error,
      };
    });

    const payload = {
      workflow: workflow.name,
      steps,
    };

    const text =
      runtime.outputFormat === "pretty"
        ? JSON.stringify(payload, null, 2)
        : JSON.stringify(payload);
    console.log(text);
  }
}

interface WorkflowListOptions {
  cwd?: string;
}

export function workflowListTemplatesCommand(opts: WorkflowListOptions = {}) {
  const cwd = opts.cwd ?? process.cwd();
  const available = discoverWorkflows(cwd);

  if (available.length === 0) {
    log.warn("Nenhum workflow template encontrado.");
    log.info("Crie em workflows/<name>/workflow.yaml");
    return;
  }

  log.heading("Workflow Templates");
  for (const w of available) {
    const workflow = loadStepfileWorkflow(w.dir);
    const stepCount = workflow?.steps.length ?? 0;
    console.log(`  ${w.name} (${w.source})`);
    if (workflow?.description) log.dim(`    ${workflow.description}`);
    log.dim(`    ${stepCount} steps`);
    console.log();
  }
}
