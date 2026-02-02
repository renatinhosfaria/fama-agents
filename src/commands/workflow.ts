import { WorkflowEngine } from "../core/workflow-engine.js";
import { parseScale } from "../workflow/scaling.js";
import { log } from "../utils/logger.js";

export function workflowInitCommand(
  name: string,
  opts: { scale?: string },
  cwd: string = process.cwd(),
) {
  const engine = new WorkflowEngine(cwd);

  if (engine.exists()) {
    log.warn("A workflow already exists. Use 'fama workflow status' to check.");
    return;
  }

  const scale = parseScale(opts.scale ?? "medium");
  const state = engine.init(name, scale);

  log.success(`Workflow "${name}" initialized.`);
  console.log(engine.getSummary());
  console.log();
  log.info(`Recommended agents: ${engine.getRecommendedAgents().join(", ")}`);
  log.info(`Recommended skills: ${engine.getRecommendedSkills().join(", ")}`);
}

export function workflowStatusCommand(cwd: string = process.cwd()) {
  const engine = new WorkflowEngine(cwd);

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

export function workflowAdvanceCommand(cwd: string = process.cwd()) {
  const engine = new WorkflowEngine(cwd);

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
