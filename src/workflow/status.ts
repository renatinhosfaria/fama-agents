import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";
import type { WorkflowState } from "../core/types.js";

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
    return parseYaml(raw) as WorkflowState;
  } catch {
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

  writeFileSync(path, stringifyYaml(state), "utf-8");
}

/**
 * Checks if a workflow exists for the project.
 */
export function hasWorkflow(projectDir: string): boolean {
  return existsSync(getStatusPath(projectDir));
}
