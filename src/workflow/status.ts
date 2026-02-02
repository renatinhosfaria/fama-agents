import { readFileSync, writeFileSync, mkdirSync, existsSync, renameSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";
import type { WorkflowState } from "../core/types.js";
import { WorkflowStateSchema } from "../core/schemas.js";
import { log } from "../utils/logger.js";

const WORKFLOW_DIR = ".fama/workflow";
const STATUS_FILE = "status.yaml";

function getStatusPath(projectDir: string): string {
  return resolve(projectDir, WORKFLOW_DIR, STATUS_FILE);
}

/**
 * Loads workflow state from disk.
 */
export function loadWorkflowState(projectDir: string): WorkflowState | null {
  const path = getStatusPath(projectDir);
  if (!existsSync(path)) return null;

  try {
    const raw = readFileSync(path, "utf-8");
    const parsed = parseYaml(raw);
    const validated = WorkflowStateSchema.safeParse(parsed);
    if (!validated.success) {
      log.warn(`Workflow state validation failed: ${validated.error.issues.map((i) => i.message).join(", ")}`);
      return parsed as WorkflowState;
    }
    return validated.data as WorkflowState;
  } catch (err) {
    log.warn(`Failed to read workflow state: ${err instanceof Error ? err.message : String(err)}`);
    return null;
  }
}

/**
 * Saves workflow state to disk.
 */
export function saveWorkflowState(
  projectDir: string,
  state: WorkflowState,
): void {
  const path = getStatusPath(projectDir);
  const dir = dirname(path);

  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  const tmpPath = path + ".tmp";
  writeFileSync(tmpPath, stringifyYaml(state), "utf-8");
  renameSync(tmpPath, path);
}

/**
 * Checks if a workflow exists for the project.
 */
export function hasWorkflow(projectDir: string): boolean {
  return existsSync(getStatusPath(projectDir));
}
