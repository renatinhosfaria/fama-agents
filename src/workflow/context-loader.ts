/**
 * Context Loader for Workflow Phase Transitions
 *
 * Loads and formats outputs from previous workflow phases to provide
 * context for the next phase. This enables intelligent handoff between
 * Planning → Review → Execution → Validation → Confirmation.
 */

import { readFileSync, existsSync } from "node:fs";
import type { WorkflowPhase, WorkflowState } from "../core/types.js";
import { PHASE_DEFINITIONS } from "./phases.js";

/** Summary of a single phase output */
export interface PhaseOutputSummary {
  agent: string;
  task: string;
  resultSummary: string;
  artifacts: string[];
  timestamp: string;
}

/** Aggregated context from previous phases */
export interface PhaseContext {
  phase: WorkflowPhase;
  phaseName: string;
  outputs: PhaseOutputSummary[];
}

/** Run record format (stored in .fama/runs/*.json) */
interface RunRecord {
  agent: string;
  task: string;
  result?: string;
  timestamp: string;
  costUSD?: number;
  durationMs?: number;
}

/** Phase order for determining "previous" phases */
const PHASE_ORDER: WorkflowPhase[] = ["P", "R", "E", "V", "C"];

/**
 * Gets phases that come before the target phase and are completed.
 */
function getPreviousCompletedPhases(
  state: WorkflowState,
  targetPhase: WorkflowPhase,
): WorkflowPhase[] {
  const targetIndex = PHASE_ORDER.indexOf(targetPhase);
  if (targetIndex <= 0) return [];

  return PHASE_ORDER.slice(0, targetIndex).filter(
    (phase) => state.phases[phase]?.status === "completed",
  );
}

/**
 * Extracts a summary from a result string.
 * Tries to break at sentence boundaries.
 */
export function extractSummary(result: string, maxLength: number = 500): string {
  if (!result) return "";

  const trimmed = result.trim();
  if (trimmed.length <= maxLength) return trimmed;

  // Try to break at last sentence within limit
  const cut = trimmed.slice(0, maxLength);
  const lastPeriod = cut.lastIndexOf(".");
  const lastNewline = cut.lastIndexOf("\n");
  const breakPoint = Math.max(lastPeriod, lastNewline);

  if (breakPoint > maxLength * 0.6) {
    return trimmed.slice(0, breakPoint + 1).trim();
  }

  return cut.trim() + "...";
}

/**
 * Extracts file paths mentioned in a result as artifacts.
 * Looks for patterns like "wrote file.ts", "created src/index.ts", etc.
 */
export function extractArtifacts(result: string): string[] {
  if (!result) return [];

  const patterns = [
    // "wrote/created/updated/saved filename.ext"
    /(?:wrote|created|updated|saved|modified|generated)\s+[`"']?([^\s`"']+\.[a-z]{1,5})[`"']?/gi,
    // "file: filename.ext"
    /(?:file|path|output):\s*[`"']?([^\s`"']+\.[a-z]{1,5})[`"']?/gi,
    // Markdown code block file paths
    /```[a-z]*\s*\n?(?:\/\/|#|<!--)\s*([^\s]+\.[a-z]{1,5})/gi,
  ];

  const artifacts = new Set<string>();

  for (const pattern of patterns) {
    const matches = result.matchAll(pattern);
    for (const match of matches) {
      if (match[1]) {
        // Filter out common false positives
        const path = match[1];
        if (!path.startsWith("http") && !path.includes("...") && path.length < 200) {
          artifacts.add(path);
        }
      }
    }
  }

  return Array.from(artifacts);
}

/**
 * Loads a run record from disk.
 */
function loadRunRecord(filePath: string): RunRecord | null {
  try {
    if (!existsSync(filePath)) return null;
    const content = readFileSync(filePath, "utf-8");
    return JSON.parse(content) as RunRecord;
  } catch {
    return null;
  }
}

/**
 * Loads context from previous completed phases.
 *
 * @param projectDir - Project directory containing .fama/runs/
 * @param state - Current workflow state
 * @param targetPhase - The phase we're loading context for
 * @returns Phase context or null if no previous outputs
 */
export function loadPhaseContext(
  projectDir: string,
  state: WorkflowState,
  targetPhase: WorkflowPhase,
): PhaseContext | null {
  const previousPhases = getPreviousCompletedPhases(state, targetPhase);
  if (previousPhases.length === 0) return null;

  const outputs: PhaseOutputSummary[] = [];

  for (const phase of previousPhases) {
    const phaseStatus = state.phases[phase];
    if (!phaseStatus?.outputs || phaseStatus.outputs.length === 0) continue;

    for (const outputPath of phaseStatus.outputs) {
      const record = loadRunRecord(outputPath);
      if (!record) continue;

      outputs.push({
        agent: record.agent,
        task: record.task,
        resultSummary: extractSummary(record.result ?? "", 500),
        artifacts: extractArtifacts(record.result ?? ""),
        timestamp: record.timestamp,
      });
    }
  }

  if (outputs.length === 0) return null;

  const phaseDef = PHASE_DEFINITIONS[targetPhase];

  return {
    phase: targetPhase,
    phaseName: phaseDef?.name ?? targetPhase,
    outputs,
  };
}

/**
 * Formats phase context as a prompt section.
 */
export function formatPhaseContextForPrompt(context: PhaseContext): string {
  if (!context.outputs.length) return "";

  const lines: string[] = [
    "## Previous Phase Outputs\n",
    `Context from completed phases before ${context.phaseName}:\n`,
  ];

  for (const output of context.outputs) {
    lines.push(`### ${output.agent} (${output.timestamp})`);
    lines.push(`**Task:** ${output.task}`);

    if (output.resultSummary) {
      lines.push(`**Summary:**\n${output.resultSummary}`);
    }

    if (output.artifacts.length > 0) {
      lines.push(`**Artifacts:** ${output.artifacts.join(", ")}`);
    }

    lines.push("");
  }

  return lines.join("\n");
}

/**
 * Gets the most recent planning output for adaptive configuration.
 */
export function getPlanningOutput(
  projectDir: string,
  state: WorkflowState,
): PhaseOutputSummary | null {
  const planningStatus = state.phases.P;
  if (planningStatus?.status !== "completed" || !planningStatus.outputs?.length) {
    return null;
  }

  // Get the last planning output
  const lastOutputPath = planningStatus.outputs[planningStatus.outputs.length - 1];
  const record = loadRunRecord(lastOutputPath);
  if (!record) return null;

  return {
    agent: record.agent,
    task: record.task,
    resultSummary: record.result ?? "",
    artifacts: extractArtifacts(record.result ?? ""),
    timestamp: record.timestamp,
  };
}
