/**
 * Structured Output Protocol (SOP) for LLM-first agent responses.
 *
 * Provides machine-parseable output format that LLMs can reliably parse
 * and downstream systems can validate with Zod schemas.
 */

import type { WorkflowPhase } from "./types.js";
import { BaseOutputSchema } from "../schemas/outputs/common.js";

// ─── Artifact Types ───

export type ArtifactType = "file" | "decision" | "task" | "issue" | "reference";

export interface Artifact {
  /** Type of artifact produced */
  type: ArtifactType;
  /** File path for file artifacts */
  path?: string;
  /** Inline content when small enough */
  content?: string;
  /** Content hash for deduplication (SHA-256 first 8 chars) */
  hash?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

// ─── Decision Tracking ───

export type Reversibility = "easy" | "moderate" | "hard" | "irreversible";

export interface Decision {
  /** Unique identifier for referencing */
  id: string;
  /** What was decided */
  decision: string;
  /** Why this option was chosen */
  rationale: string;
  /** Other options that were considered */
  alternativesConsidered: string[];
  /** How hard is it to undo this decision */
  reversibility: Reversibility;
}

// ─── Issue Tracking ───

export type IssueSeverity = "critical" | "high" | "medium" | "low" | "info";

export interface Issue {
  /** Unique identifier */
  id: string;
  /** Issue description */
  description: string;
  /** Severity level */
  severity: IssueSeverity;
  /** File location if applicable */
  location?: string;
  /** Suggested fix */
  suggestedFix?: string;
}

// ─── Result Status ───

export type ResultStatus = "success" | "partial" | "blocked" | "error";

export interface ResultPayload {
  /** Overall execution status */
  status: ResultStatus;
  /** One-sentence summary for context loading (max ~100 chars) */
  summary: string;
  /** Schema-specific content - validated by per-agent Zod schema */
  content: unknown;
}

// ─── Handoff Information ───

export interface HandoffInfo {
  /** Suggested next phase (null if workflow complete) */
  nextPhase: WorkflowPhase | null;
  /** Keys from this output required by next phase */
  requiredContext: string[];
  /** Issues that must be resolved before proceeding */
  blockingIssues: string[];
  /** Suggested agents for next phase */
  suggestedAgents: string[];
}

// ─── Output Metadata ───

export interface OutputMeta {
  /** Agent slug that produced this output */
  agent: string;
  /** Skill used (if any) */
  skill: string | null;
  /** Workflow phase during execution */
  phase: WorkflowPhase;
  /** ISO timestamp of completion */
  timestamp: string;
  /** Estimated tokens consumed */
  tokensUsed: number;
  /** Model used for generation */
  model?: string;
  /** Execution duration in milliseconds */
  durationMs?: number;
}

// ─── Main Output Interface ───

/**
 * Structured output from an agent execution.
 *
 * This format is designed for LLM consumption:
 * - Machine-parseable JSON structure
 * - Explicit artifact tracking (files, decisions, tasks)
 * - Clear handoff information for workflow orchestration
 * - One-sentence summaries for context loading
 *
 * @example
 * ```typescript
 * const output: StructuredAgentOutput = {
 *   schemaVersion: "1.0.0",
 *   meta: {
 *     agent: "architect",
 *     skill: "feature-breakdown",
 *     phase: "P",
 *     timestamp: "2024-01-15T10:30:00Z",
 *     tokensUsed: 2500,
 *   },
 *   result: {
 *     status: "success",
 *     summary: "Designed 3-layer architecture with REST API and PostgreSQL.",
 *     content: { layers: [...], dataFlow: [...] },
 *   },
 *   artifacts: [
 *     { type: "file", path: "docs/architecture.md", hash: "a1b2c3d4" },
 *     { type: "decision", content: "Using PostgreSQL over MongoDB for ACID compliance" },
 *   ],
 *   decisions: [...],
 *   issues: [],
 *   handoff: {
 *     nextPhase: "E",
 *     requiredContext: ["layers", "dataFlow"],
 *     blockingIssues: [],
 *     suggestedAgents: ["feature-developer"],
 *   },
 * };
 * ```
 */
export interface StructuredAgentOutput {
  /** Schema version for forward compatibility */
  schemaVersion: string;
  /** Execution metadata */
  meta: OutputMeta;
  /** Primary result payload */
  result: ResultPayload;
  /** Produced artifacts (files, inline content) */
  artifacts: Artifact[];
  /** Key decisions made during execution */
  decisions: Decision[];
  /** Issues found or raised */
  issues: Issue[];
  /** Handoff information for workflow orchestration */
  handoff: HandoffInfo;
}

// ─── Schema Version ───

export const CURRENT_SCHEMA_VERSION = "1.0.0";

// ─── Constants ───

/** Maximum length for summary field (enforced by Zod schema) */
const MAX_SUMMARY_LENGTH = 200;

/**
 * Truncates summary to max length, preserving word boundaries when possible.
 */
function truncateSummary(summary: string): string {
  if (summary.length <= MAX_SUMMARY_LENGTH) {
    return summary;
  }

  // Try to break at last space within limit
  const truncated = summary.slice(0, MAX_SUMMARY_LENGTH);
  const lastSpace = truncated.lastIndexOf(" ");

  if (lastSpace > MAX_SUMMARY_LENGTH * 0.7) {
    return truncated.slice(0, lastSpace) + "...";
  }

  return truncated.slice(0, MAX_SUMMARY_LENGTH - 3) + "...";
}

// ─── Factory Functions ───

/**
 * Creates a minimal successful output structure.
 * Summary is automatically truncated to 200 characters.
 */
export function createSuccessOutput(
  agent: string,
  phase: WorkflowPhase,
  summary: string,
  content: unknown,
): StructuredAgentOutput {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    meta: {
      agent,
      skill: null,
      phase,
      timestamp: new Date().toISOString(),
      tokensUsed: 0,
    },
    result: {
      status: "success",
      summary: truncateSummary(summary),
      content,
    },
    artifacts: [],
    decisions: [],
    issues: [],
    handoff: {
      nextPhase: null,
      requiredContext: [],
      blockingIssues: [],
      suggestedAgents: [],
    },
  };
}

/**
 * Creates an error output structure.
 * Summary is automatically truncated to 200 characters.
 */
export function createErrorOutput(
  agent: string,
  phase: WorkflowPhase,
  errorMessage: string,
): StructuredAgentOutput {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    meta: {
      agent,
      skill: null,
      phase,
      timestamp: new Date().toISOString(),
      tokensUsed: 0,
    },
    result: {
      status: "error",
      summary: truncateSummary(errorMessage),
      content: { error: errorMessage },
    },
    artifacts: [],
    decisions: [],
    issues: [
      {
        id: "execution-error",
        description: errorMessage,
        severity: "critical",
      },
    ],
    handoff: {
      nextPhase: null,
      requiredContext: [],
      blockingIssues: ["execution-error"],
      suggestedAgents: [],
    },
  };
}

/**
 * Adds an artifact to an existing output.
 */
export function addArtifact(
  output: StructuredAgentOutput,
  artifact: Artifact,
): StructuredAgentOutput {
  return {
    ...output,
    artifacts: [...output.artifacts, artifact],
  };
}

/**
 * Adds a decision to an existing output.
 */
export function addDecision(
  output: StructuredAgentOutput,
  decision: Decision,
): StructuredAgentOutput {
  return {
    ...output,
    decisions: [...output.decisions, decision],
  };
}

/**
 * Adds an issue to an existing output.
 */
export function addIssue(
  output: StructuredAgentOutput,
  issue: Issue,
): StructuredAgentOutput {
  const newOutput = {
    ...output,
    issues: [...output.issues, issue],
  };

  // Auto-add to blocking issues if critical or high severity
  if (issue.severity === "critical" || issue.severity === "high") {
    newOutput.handoff = {
      ...newOutput.handoff,
      blockingIssues: [...newOutput.handoff.blockingIssues, issue.id],
    };
  }

  return newOutput;
}

// ─── Parsing Utilities ───

/**
 * Result of parsing structured output with validation details.
 */
export interface ParseResult {
  /** Successfully parsed and validated output */
  output: StructuredAgentOutput | null;
  /** Whether parsing was successful */
  success: boolean;
  /** Error details if parsing failed */
  error?: {
    /** Error type: 'json' for parse errors, 'validation' for schema errors */
    type: "json" | "validation";
    /** Human-readable error message */
    message: string;
    /** Zod validation issues (if type is 'validation') */
    issues?: Array<{ path: string; message: string }>;
  };
}

/**
 * Attempts to extract and validate structured output from agent response text.
 * Uses Zod schema validation for type safety and enum validation.
 *
 * @param text - Raw agent response text
 * @returns Parsed output or null if not found/invalid
 */
export function parseStructuredOutput(
  text: string,
): StructuredAgentOutput | null {
  const result = parseStructuredOutputWithDetails(text);
  return result.output;
}

/**
 * Attempts to extract and validate structured output with detailed error information.
 * Looks for JSON blocks or structured sections.
 *
 * @param text - Raw agent response text
 * @returns ParseResult with output and error details
 */
export function parseStructuredOutputWithDetails(text: string): ParseResult {
  // Try to find JSON block
  const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    const result = parseAndValidate(jsonMatch[1]);
    if (result.success || result.error?.type === "validation") {
      return result;
    }
  }

  // Try to parse entire text as JSON
  return parseAndValidate(text);
}

/**
 * Internal helper: parses JSON and validates against BaseOutputSchema.
 */
function parseAndValidate(text: string): ParseResult {
  let parsed: unknown;

  try {
    parsed = JSON.parse(text);
  } catch (e) {
    return {
      output: null,
      success: false,
      error: {
        type: "json",
        message: e instanceof Error ? e.message : "Invalid JSON",
      },
    };
  }

  // Validate with Zod schema
  const validation = BaseOutputSchema.safeParse(parsed);

  if (!validation.success) {
    return {
      output: null,
      success: false,
      error: {
        type: "validation",
        message: "Output does not match StructuredAgentOutput schema",
        issues: validation.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
    };
  }

  // Cast to StructuredAgentOutput (validated by Zod)
  return {
    output: parsed as StructuredAgentOutput,
    success: true,
  };
}

/**
 * Type guard for StructuredAgentOutput.
 */
export function isStructuredOutput(obj: unknown): obj is StructuredAgentOutput {
  if (typeof obj !== "object" || obj === null) return false;

  const o = obj as Record<string, unknown>;

  return (
    typeof o.schemaVersion === "string" &&
    typeof o.meta === "object" &&
    o.meta !== null &&
    typeof o.result === "object" &&
    o.result !== null &&
    Array.isArray(o.artifacts) &&
    Array.isArray(o.decisions) &&
    Array.isArray(o.issues) &&
    typeof o.handoff === "object" &&
    o.handoff !== null
  );
}

// ─── Serialization ───

/**
 * Serializes structured output to compact JSON (no extra whitespace).
 */
export function serializeCompact(output: StructuredAgentOutput): string {
  return JSON.stringify(output);
}

/**
 * Serializes structured output to readable JSON (with indentation).
 */
export function serializeReadable(output: StructuredAgentOutput): string {
  return JSON.stringify(output, null, 2);
}
