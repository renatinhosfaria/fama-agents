import { loadConfig } from "../utils/config.js";
import { log } from "../utils/logger.js";
import { discoverWorkflows, loadStepfileWorkflow } from "../workflow/workflow-loader.js";
import { executeWorkflow } from "../workflow/step-executor.js";

interface WorkflowExecOptions {
  model?: string;
  maxTurns?: string;
  verbose?: boolean;
  cwd?: string;
}

export async function workflowExecCommand(name: string, opts: WorkflowExecOptions) {
  const cwd = opts.cwd ?? process.cwd();
  const config = loadConfig(cwd);

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

  log.heading(`Executando workflow: ${workflow.name}`);
  if (workflow.description) log.dim(`  ${workflow.description}`);
  log.info(`  ${workflow.steps.length} steps`);
  console.log();

  const parsedTurns = opts.maxTurns ? parseInt(opts.maxTurns, 10) : NaN;
  const maxTurns = !Number.isNaN(parsedTurns) ? parsedTurns : config.maxTurns;

  try {
    await executeWorkflow(workflow, {
      cwd,
      model: opts.model ?? config.model,
      maxTurns,
      verbose: opts.verbose ?? false,
      skillsDir: config.skillsDir,
    });
  } catch (err) {
    log.error(`Workflow falhou: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
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
