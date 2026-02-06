/**
 * Context Manifold for LLM-First Architecture
 *
 * Replaces prose-based context loading with a structured key-value
 * manifold that can be precisely queried and filtered. Enables:
 * - Exact context selection by relevance
 * - Deduplication of artifacts by hash
 * - Structured decisions and issues tracking
 * - Token-aware context budgeting
 */

import { createHash } from "node:crypto";
import { readFileSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import type { WorkflowPhase, WorkflowState } from "./types.js";
import type { StructuredAgentOutput, Artifact } from "./output-protocol.js";
import { estimateTokensCharBased } from "./token-estimator.js";

// ─── Types ───

/** Entry for a single phase output in the manifold */
export interface PhaseManifoldEntry {
  /** Agent that produced this output */
  agent: string;
  /** Timestamp of execution */
  timestamp: string;
  /** One-sentence summary (~100 chars) */
  summary: string;
  /** Keys to artifact registry */
  artifactKeys: string[];
  /** Decisions made during this execution */
  decisions: ManifoldDecision[];
  /** Issues found or raised */
  issues: ManifoldIssue[];
  /** Estimated tokens for this entry */
  estimatedTokens: number;
}

/** Simplified decision for manifold storage */
export interface ManifoldDecision {
  id: string;
  decision: string;
  rationale: string;
  reversibility: "easy" | "moderate" | "hard" | "irreversible";
}

/** Simplified issue for manifold storage */
export interface ManifoldIssue {
  id: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  resolved: boolean;
}

/** Artifact entry in the manifold registry */
export interface ArtifactEntry {
  /** Content hash (SHA-256 first 8 chars) */
  hash: string;
  /** Artifact type */
  type: "file" | "decision" | "task" | "issue" | "reference";
  /** File path if applicable */
  path?: string;
  /** Inline content if small */
  content?: string;
  /** Phase that produced this artifact */
  sourcePhase: WorkflowPhase;
  /** Agent that produced this artifact */
  sourceAgent: string;
  /** Timestamp of creation */
  createdAt: string;
}

/** Stack information summary */
export interface StackInfo {
  languages: string[];
  frameworks: string[];
  databases: string[];
  tools: string[];
}

/** Codebase summary */
export interface CodebaseSummary {
  architecture: string;
  entryPoints: string[];
  keyModules: string[];
  testFramework?: string;
}

/** Global context across all phases */
export interface GlobalContext {
  projectStack?: StackInfo;
  codebaseSummary?: CodebaseSummary;
  workflowState: WorkflowState;
  activeConstraints: string[];
}

/** The complete Context Manifold */
export interface ContextManifold {
  /** Version for migration support */
  version: string;
  /** Workflow name */
  workflowName: string;
  /** Phase outputs indexed by phase */
  phases: Record<WorkflowPhase, PhaseManifoldEntry[]>;
  /** Cross-cutting global context */
  globals: GlobalContext;
  /** Artifact registry (keyed by hash) */
  artifacts: Record<string, ArtifactEntry>;
  /** Last updated timestamp */
  updatedAt: string;
}

/** Selected context for injection into prompt */
export interface SelectedContext {
  /** Entries selected for inclusion */
  entries: PhaseManifoldEntry[];
  /** Artifact keys included */
  artifactKeys: string[];
  /** Unresolved blocking issues */
  blockingIssues: ManifoldIssue[];
  /** Key decisions to maintain consistency */
  keyDecisions: ManifoldDecision[];
  /** Total estimated tokens */
  totalTokens: number;
  /** Entries that were skipped due to budget */
  skippedCount: number;
}

// ─── Constants ───

export const MANIFOLD_VERSION = "1.0.0";
export const MANIFOLD_FILENAME = "context-manifold.json";
const PHASE_ORDER: WorkflowPhase[] = ["P", "R", "E", "V", "C"];

// ─── Hash Utilities ───

/**
 * Computes a short hash for content deduplication.
 */
export function computeHash(content: string): string {
  return createHash("sha256").update(content).digest("hex").slice(0, 8);
}

// ─── Manifold Creation ───

/**
 * Creates an empty context manifold.
 */
export function createEmptyManifold(
  workflowName: string,
  workflowState: WorkflowState,
): ContextManifold {
  return {
    version: MANIFOLD_VERSION,
    workflowName,
    phases: {
      P: [],
      R: [],
      E: [],
      V: [],
      C: [],
    },
    globals: {
      workflowState,
      activeConstraints: [],
    },
    artifacts: {},
    updatedAt: new Date().toISOString(),
  };
}

// ─── Error Types ───

/**
 * Error thrown when manifold operations fail.
 */
export class ManifoldError extends Error {
  constructor(
    message: string,
    public readonly code: ManifoldErrorCode,
    public readonly filePath?: string,
    public readonly cause?: Error,
  ) {
    super(message);
    this.name = "ManifoldError";
  }
}

export type ManifoldErrorCode =
  | "FILE_NOT_FOUND"
  | "READ_ERROR"
  | "PARSE_ERROR"
  | "WRITE_ERROR"
  | "MKDIR_ERROR"
  | "VALIDATION_ERROR";

/**
 * Result of loading a manifold.
 */
export interface LoadManifoldResult {
  /** Whether loading was successful */
  success: boolean;
  /** The loaded manifold (null if failed) */
  manifold: ContextManifold | null;
  /** Error details if loading failed */
  error?: ManifoldError;
}

// ─── Manifold Persistence ───

/**
 * Loads manifold from disk.
 *
 * @returns null if file doesn't exist, throws ManifoldError on other failures
 */
export function loadManifold(projectDir: string): ContextManifold | null {
  const result = loadManifoldWithDetails(projectDir);

  if (result.error) {
    // Only throw for actual errors, not "file not found"
    if (result.error.code !== "FILE_NOT_FOUND") {
      throw result.error;
    }
  }

  return result.manifold;
}

/**
 * Loads manifold with detailed error information.
 *
 * @returns Result object with manifold and/or error details
 */
export function loadManifoldWithDetails(projectDir: string): LoadManifoldResult {
  const filePath = join(projectDir, ".fama", MANIFOLD_FILENAME);

  if (!existsSync(filePath)) {
    return {
      success: false,
      manifold: null,
      error: new ManifoldError(
        `Manifold file not found: ${filePath}`,
        "FILE_NOT_FOUND",
        filePath,
      ),
    };
  }

  let content: string;
  try {
    content = readFileSync(filePath, "utf-8");
  } catch (e) {
    return {
      success: false,
      manifold: null,
      error: new ManifoldError(
        `Failed to read manifold file: ${e instanceof Error ? e.message : String(e)}`,
        "READ_ERROR",
        filePath,
        e instanceof Error ? e : undefined,
      ),
    };
  }

  try {
    const parsed = JSON.parse(content) as ContextManifold;

    // Basic validation
    if (!parsed.version || !parsed.phases || !parsed.globals) {
      return {
        success: false,
        manifold: null,
        error: new ManifoldError(
          "Manifold file is missing required fields (version, phases, globals)",
          "VALIDATION_ERROR",
          filePath,
        ),
      };
    }

    return { success: true, manifold: parsed };
  } catch (e) {
    return {
      success: false,
      manifold: null,
      error: new ManifoldError(
        `Failed to parse manifold JSON: ${e instanceof Error ? e.message : String(e)}`,
        "PARSE_ERROR",
        filePath,
        e instanceof Error ? e : undefined,
      ),
    };
  }
}

/**
 * Result of saving a manifold.
 */
export interface SaveManifoldResult {
  success: boolean;
  error?: ManifoldError;
}

/**
 * Saves manifold to disk.
 *
 * @throws ManifoldError on failure
 */
export function saveManifold(projectDir: string, manifold: ContextManifold): void {
  const result = saveManifoldWithDetails(projectDir, manifold);

  if (!result.success && result.error) {
    throw result.error;
  }
}

/**
 * Saves manifold with detailed error information.
 *
 * @returns Result object indicating success or failure with details
 */
export function saveManifoldWithDetails(
  projectDir: string,
  manifold: ContextManifold,
): SaveManifoldResult {
  const dirPath = join(projectDir, ".fama");
  const filePath = join(dirPath, MANIFOLD_FILENAME);

  // Create directory if needed
  if (!existsSync(dirPath)) {
    try {
      mkdirSync(dirPath, { recursive: true });
    } catch (e) {
      return {
        success: false,
        error: new ManifoldError(
          `Failed to create directory: ${e instanceof Error ? e.message : String(e)}`,
          "MKDIR_ERROR",
          dirPath,
          e instanceof Error ? e : undefined,
        ),
      };
    }
  }

  // Update timestamp and write
  manifold.updatedAt = new Date().toISOString();

  try {
    writeFileSync(filePath, JSON.stringify(manifold, null, 2), "utf-8");
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: new ManifoldError(
        `Failed to write manifold file: ${e instanceof Error ? e.message : String(e)}`,
        "WRITE_ERROR",
        filePath,
        e instanceof Error ? e : undefined,
      ),
    };
  }
}

// ─── Adding Entries ───

/**
 * Adds a structured agent output to the manifold.
 */
export function addOutputToManifold(
  manifold: ContextManifold,
  phase: WorkflowPhase,
  output: StructuredAgentOutput,
): ContextManifold {
  const updated = { ...manifold };

  // Process artifacts
  const artifactKeys: string[] = [];
  for (const artifact of output.artifacts) {
    const key = registerArtifact(updated, artifact, phase, output.meta.agent);
    artifactKeys.push(key);
  }

  // Convert decisions
  const decisions: ManifoldDecision[] = output.decisions.map((d) => ({
    id: d.id,
    decision: d.decision,
    rationale: d.rationale,
    reversibility: d.reversibility,
  }));

  // Convert issues
  const issues: ManifoldIssue[] = output.issues.map((i) => ({
    id: i.id,
    description: i.description,
    severity: i.severity,
    resolved: false,
  }));

  // Create entry
  const entry: PhaseManifoldEntry = {
    agent: output.meta.agent,
    timestamp: output.meta.timestamp,
    summary: output.result.summary,
    artifactKeys,
    decisions,
    issues,
    estimatedTokens: estimateEntryTokens(output),
  };

  // Add to phase
  updated.phases = {
    ...updated.phases,
    [phase]: [...updated.phases[phase], entry],
  };

  updated.updatedAt = new Date().toISOString();
  return updated;
}

/**
 * Registers an artifact in the manifold registry.
 * Returns the artifact key (hash).
 */
function registerArtifact(
  manifold: ContextManifold,
  artifact: Artifact,
  phase: WorkflowPhase,
  agent: string,
): string {
  // Compute hash from content or path
  const hashSource = artifact.content ?? artifact.path ?? "";
  const hash = artifact.hash ?? computeHash(hashSource);

  // Only add if not already present (deduplication)
  if (!manifold.artifacts[hash]) {
    manifold.artifacts[hash] = {
      hash,
      type: artifact.type,
      path: artifact.path,
      content: artifact.content,
      sourcePhase: phase,
      sourceAgent: agent,
      createdAt: new Date().toISOString(),
    };
  }

  return hash;
}

/**
 * Estimates tokens for a manifold entry.
 */
function estimateEntryTokens(output: StructuredAgentOutput): number {
  const parts = [
    output.result.summary,
    ...output.decisions.map((d) => `${d.decision} ${d.rationale}`),
    ...output.issues.map((i) => i.description),
  ];
  return estimateTokensCharBased(parts.join(" "));
}

// ─── Context Selection ───

/**
 * Selects context for a target phase within token budget.
 *
 * Prioritizes:
 * 1. Unresolved blocking issues (always included)
 * 2. Key decisions (for consistency)
 * 3. Recent outputs (recency bias)
 * 4. Relevant phase outputs (P for E, R for V, etc.)
 */
export function selectContextForPhase(
  manifold: ContextManifold,
  targetPhase: WorkflowPhase,
  tokenBudget: number,
): SelectedContext {
  const result: SelectedContext = {
    entries: [],
    artifactKeys: [],
    blockingIssues: [],
    keyDecisions: [],
    totalTokens: 0,
    skippedCount: 0,
  };

  // Get previous phases
  const targetIndex = PHASE_ORDER.indexOf(targetPhase);
  const previousPhases = PHASE_ORDER.slice(0, targetIndex);

  // Collect all entries from previous phases
  const allEntries: Array<{ entry: PhaseManifoldEntry; phase: WorkflowPhase }> = [];
  for (const phase of previousPhases) {
    for (const entry of manifold.phases[phase]) {
      allEntries.push({ entry, phase });
    }
  }

  // Always include blocking issues
  for (const { entry } of allEntries) {
    for (const issue of entry.issues) {
      if ((issue.severity === "critical" || issue.severity === "high") && !issue.resolved) {
        result.blockingIssues.push(issue);
      }
    }
  }

  // Always include key decisions (irreversible or hard to reverse)
  for (const { entry } of allEntries) {
    for (const decision of entry.decisions) {
      if (decision.reversibility === "irreversible" || decision.reversibility === "hard") {
        result.keyDecisions.push(decision);
      }
    }
  }

  // Score entries by relevance
  const scoredEntries = allEntries.map(({ entry, phase }) => ({
    entry,
    phase,
    score: scoreEntryRelevance(entry, phase, targetPhase),
  }));

  // Sort by score descending
  scoredEntries.sort((a, b) => b.score - a.score);

  // Add entries within budget
  for (const { entry } of scoredEntries) {
    if (result.totalTokens + entry.estimatedTokens <= tokenBudget) {
      result.entries.push(entry);
      result.artifactKeys.push(...entry.artifactKeys);
      result.totalTokens += entry.estimatedTokens;
    } else {
      result.skippedCount++;
    }
  }

  return result;
}

/**
 * Scores an entry's relevance to the target phase.
 */
function scoreEntryRelevance(
  entry: PhaseManifoldEntry,
  sourcePhase: WorkflowPhase,
  targetPhase: WorkflowPhase,
): number {
  let score = 0;

  // Recency bonus (newer = higher)
  const age = Date.now() - new Date(entry.timestamp).getTime();
  const hoursSince = age / (1000 * 60 * 60);
  score += Math.max(0, 10 - hoursSince); // Up to 10 points for recent entries

  // Phase relevance
  const relevanceMap: Record<WorkflowPhase, WorkflowPhase[]> = {
    P: [], // Planning needs no context
    R: ["P"], // Review needs planning output
    E: ["P", "R"], // Execution needs planning and review
    V: ["E", "R"], // Validation needs execution and review
    C: ["V", "E"], // Confirmation needs validation and execution
  };

  if (relevanceMap[targetPhase]?.includes(sourcePhase)) {
    score += 20; // High relevance bonus
  }

  // Issues penalty (entries with many issues may indicate problems)
  const unresolvedIssues = entry.issues.filter((i) => !i.resolved).length;
  score += unresolvedIssues * 5; // Prioritize entries with issues

  // Decisions bonus (entries with decisions are informative)
  score += entry.decisions.length * 3;

  return score;
}

// ─── Formatting for Prompt ───

/**
 * Formats selected context for injection into agent prompt.
 * Uses compact format for token efficiency.
 */
export function formatManifoldContext(
  selected: SelectedContext,
  manifold: ContextManifold,
): string {
  const lines: string[] = [];

  lines.push("[CONTEXT_MANIFOLD]");

  // Blocking issues first (critical)
  if (selected.blockingIssues.length > 0) {
    lines.push("BLOCKING:");
    for (const issue of selected.blockingIssues) {
      lines.push(`  !${issue.severity.toUpperCase()}: ${issue.description}`);
    }
  }

  // Key decisions
  if (selected.keyDecisions.length > 0) {
    lines.push("DECISIONS:");
    for (const decision of selected.keyDecisions) {
      lines.push(`  [${decision.id}] ${decision.decision}`);
      lines.push(`    → ${decision.rationale}`);
    }
  }

  // Phase outputs (summaries)
  if (selected.entries.length > 0) {
    lines.push("PREV_OUTPUTS:");
    for (const entry of selected.entries) {
      lines.push(`  ${entry.agent} (${entry.timestamp.split("T")[0]}): ${entry.summary}`);
    }
  }

  // Artifacts (paths only)
  const uniqueArtifacts = [...new Set(selected.artifactKeys)];
  if (uniqueArtifacts.length > 0) {
    const artifactPaths = uniqueArtifacts
      .map((key) => manifold.artifacts[key]?.path)
      .filter(Boolean);

    if (artifactPaths.length > 0) {
      lines.push(`ARTIFACTS: ${artifactPaths.join(", ")}`);
    }
  }

  // Budget info
  if (selected.skippedCount > 0) {
    lines.push(`<!-- ${selected.skippedCount} entries omitted due to token budget -->`);
  }

  return lines.join("\n");
}

// ─── Global Context Updates ───

/**
 * Updates stack info in the manifold.
 */
export function updateStackInfo(
  manifold: ContextManifold,
  stack: StackInfo,
): ContextManifold {
  return {
    ...manifold,
    globals: {
      ...manifold.globals,
      projectStack: stack,
    },
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Updates codebase summary in the manifold.
 */
export function updateCodebaseSummary(
  manifold: ContextManifold,
  summary: CodebaseSummary,
): ContextManifold {
  return {
    ...manifold,
    globals: {
      ...manifold.globals,
      codebaseSummary: summary,
    },
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Adds an active constraint.
 */
export function addConstraint(
  manifold: ContextManifold,
  constraint: string,
): ContextManifold {
  const existing = manifold.globals.activeConstraints;
  if (existing.includes(constraint)) return manifold;

  return {
    ...manifold,
    globals: {
      ...manifold.globals,
      activeConstraints: [...existing, constraint],
    },
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Marks an issue as resolved.
 */
export function resolveIssue(
  manifold: ContextManifold,
  issueId: string,
): ContextManifold {
  const updated = { ...manifold };

  for (const phase of PHASE_ORDER) {
    updated.phases[phase] = updated.phases[phase].map((entry) => ({
      ...entry,
      issues: entry.issues.map((issue) =>
        issue.id === issueId ? { ...issue, resolved: true } : issue,
      ),
    }));
  }

  updated.updatedAt = new Date().toISOString();
  return updated;
}

// ─── Query Utilities ───

/**
 * Gets all unresolved issues from the manifold.
 */
export function getUnresolvedIssues(manifold: ContextManifold): ManifoldIssue[] {
  const issues: ManifoldIssue[] = [];

  for (const phase of PHASE_ORDER) {
    for (const entry of manifold.phases[phase]) {
      issues.push(...entry.issues.filter((i) => !i.resolved));
    }
  }

  return issues;
}

/**
 * Gets all decisions from the manifold.
 */
export function getAllDecisions(manifold: ContextManifold): ManifoldDecision[] {
  const decisions: ManifoldDecision[] = [];

  for (const phase of PHASE_ORDER) {
    for (const entry of manifold.phases[phase]) {
      decisions.push(...entry.decisions);
    }
  }

  return decisions;
}

/**
 * Gets artifact by hash.
 */
export function getArtifact(manifold: ContextManifold, hash: string): ArtifactEntry | null {
  return manifold.artifacts[hash] ?? null;
}

/**
 * Gets all file artifacts.
 */
export function getFileArtifacts(manifold: ContextManifold): ArtifactEntry[] {
  return Object.values(manifold.artifacts).filter((a) => a.type === "file" && a.path);
}

// ─── Migration from Legacy Context Loader ───

/**
 * Converts legacy PhaseOutputSummary to manifold entry.
 * Used for migration from old context-loader format.
 */
export function convertLegacyOutput(
  legacy: { agent: string; task: string; resultSummary: string; artifacts: string[]; timestamp: string },
  _phase: WorkflowPhase,
): PhaseManifoldEntry {
  return {
    agent: legacy.agent,
    timestamp: legacy.timestamp,
    summary: legacy.resultSummary.slice(0, 100),
    artifactKeys: [], // Legacy artifacts are paths, not hashes
    decisions: [],
    issues: [],
    estimatedTokens: estimateTokensCharBased(legacy.resultSummary),
  };
}
