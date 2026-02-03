import { BUDGET_PROFILES } from "../core/token-estimator.js";
import {
  addOutputToManifold,
  createEmptyManifold,
  formatManifoldContext,
  loadManifold,
  saveManifold,
  selectContextForPhase,
  type ContextManifold,
} from "../core/context-manifold.js";
import {
  addArtifact,
  createSuccessOutput,
  parseStructuredOutputWithDetails,
  serializeCompact,
  serializeReadable,
  type ParseResult,
  type StructuredAgentOutput,
} from "../core/output-protocol.js";
import type { BudgetConfig, FamaConfig, ProjectScale, WorkflowPhase, WorkflowState } from "../core/types.js";
import { extractArtifacts, extractSummary } from "../workflow/context-loader.js";
import { LogLevel, structuredLog } from "./logger.js";

export type OutputFormat = "compact" | "pretty" | "raw";

export interface LlmFirstRuntime {
  enabled: boolean;
  structured: boolean;
  outputFormat: OutputFormat;
  quiet: boolean;
  skillBudget?: number;
  contextBudget?: number;
  parallel: boolean;
}

const SCALE_KEYS: Record<ProjectScale, "quick" | "small" | "medium" | "large"> = {
  0: "quick",
  1: "small",
  2: "medium",
  3: "large",
};

export function parsePhase(value: string | undefined, fallback: WorkflowPhase): WorkflowPhase {
  if (!value) return fallback;
  const normalized = value.trim().toUpperCase();
  if (["P", "R", "E", "V", "C"].includes(normalized)) {
    return normalized as WorkflowPhase;
  }
  return fallback;
}

export function applyLogMode(quiet: boolean): void {
  if (process.env["FAMA_LOG_LEVEL"]) return;
  structuredLog.setLevel(quiet ? LogLevel.SILENT : LogLevel.INFO);
}

export function resolveBudget(
  config: BudgetConfig | undefined,
  scale: ProjectScale,
  fallback: number,
): number {
  if (typeof config === "number") return config;
  if (config && typeof config === "object") {
    const key = SCALE_KEYS[scale];
    const value = config[key];
    if (typeof value === "number") return value;
  }
  return fallback;
}

export function resolveOutputFormat(value: string | undefined, fallback: OutputFormat): OutputFormat {
  if (value === "compact" || value === "pretty" || value === "raw") return value;
  return fallback;
}

export function resolveLlmFirstRuntime(
  config: FamaConfig,
  options: {
    structured?: boolean;
    output?: string;
    quiet?: boolean;
    human?: boolean;
    skillBudget?: number;
    contextBudget?: number;
    parallel?: boolean;
    scale?: ProjectScale;
  },
): LlmFirstRuntime {
  const enabled = config.llmFirst?.enabled ?? false;
  const scale = options.scale ?? (config.workflow?.defaultScale ?? 2);

  const structured =
    options.structured ?? (enabled ? config.llmFirst.output.structured : false);
  const outputFormat = resolveOutputFormat(
    options.output,
    enabled ? config.llmFirst.output.format : "raw",
  );
  const quiet =
    options.human === true
      ? false
      : options.quiet ?? (enabled ? config.llmFirst.output.quiet : false);

  const defaultSkillBudget = BUDGET_PROFILES[scale].skills;
  const defaultContextBudget = BUDGET_PROFILES[scale].context;

  const skillBudget =
    options.skillBudget ??
    (enabled ? resolveBudget(config.llmFirst.budgets.skills, scale, defaultSkillBudget) : undefined);

  const contextBudget =
    options.contextBudget ??
    (enabled ? resolveBudget(config.llmFirst.budgets.context, scale, defaultContextBudget) : undefined);

  const parallel = options.parallel ?? (enabled ? config.llmFirst.parallel.enabled : false);

  return {
    enabled,
    structured,
    outputFormat,
    quiet,
    skillBudget,
    contextBudget,
    parallel,
  };
}

export function createAdhocWorkflowState(
  name: string,
  phase: WorkflowPhase,
  scale: ProjectScale,
): WorkflowState {
  const now = new Date().toISOString();
  return {
    name,
    scale,
    currentPhase: phase,
    phases: {
      P: { status: phase === "P" ? "in_progress" : "pending", startedAt: phase === "P" ? now : undefined },
      R: { status: phase === "R" ? "in_progress" : "pending", startedAt: phase === "R" ? now : undefined },
      E: { status: phase === "E" ? "in_progress" : "pending", startedAt: phase === "E" ? now : undefined },
      V: { status: phase === "V" ? "in_progress" : "pending", startedAt: phase === "V" ? now : undefined },
      C: { status: phase === "C" ? "in_progress" : "pending", startedAt: phase === "C" ? now : undefined },
    },
    history: [],
    startedAt: now,
  };
}

export function ensureManifold(
  cwd: string,
  workflowState: WorkflowState,
): ContextManifold {
  const existing = loadManifold(cwd);
  if (!existing) {
    const created = createEmptyManifold(workflowState.name, workflowState);
    saveManifold(cwd, created);
    return created;
  }

  const updated: ContextManifold = {
    ...existing,
    globals: {
      ...existing.globals,
      workflowState,
    },
  };
  saveManifold(cwd, updated);
  return updated;
}

export function recordOutputToManifold(
  cwd: string,
  manifold: ContextManifold,
  phase: WorkflowPhase,
  output: StructuredAgentOutput,
): ContextManifold {
  const updated = addOutputToManifold(manifold, phase, output);
  saveManifold(cwd, updated);
  return updated;
}

export function selectManifoldContext(
  manifold: ContextManifold,
  phase: WorkflowPhase,
  budget: number,
): { context: string; selectedCount: number } {
  const selected = selectContextForPhase(manifold, phase, budget);
  const context = formatManifoldContext(selected, manifold);
  return { context, selectedCount: selected.entries.length };
}

export function buildStructuredOutputFromResult(
  resultText: string | undefined,
  phase: WorkflowPhase,
  agent: string,
  policy: "always" | "structuredOnly",
  phaseOverride?: WorkflowPhase,
): { output: StructuredAgentOutput | null; parseError?: ParseResult["error"] } {
  const raw = resultText ?? "";
  const parsed = parseStructuredOutputWithDetails(raw);

  if (parsed.output) {
    if (phaseOverride) parsed.output.meta.phase = phaseOverride;
    return { output: parsed.output };
  }

  if (policy === "structuredOnly") {
    return { output: null, parseError: parsed.error };
  }

  const summary = raw ? extractSummary(raw, 200) : "No output produced.";
  let output = createSuccessOutput(agent, phase, summary, { note: "Unstructured output" });

  const artifacts = raw ? extractArtifacts(raw) : [];
  for (const path of artifacts) {
    output = addArtifact(output, { type: "file", path });
  }

  return { output, parseError: parsed.error };
}

export function formatCliOutput(
  resultText: string | undefined,
  options: {
    outputFormat: OutputFormat;
    agent?: string;
    phase?: WorkflowPhase;
    phaseOverride?: WorkflowPhase;
  },
): { text: string; output?: StructuredAgentOutput; parseError?: ParseResult["error"] } {
  const raw = resultText ?? "";

  if (options.outputFormat === "raw") {
    return { text: raw };
  }

  const parsed = parseStructuredOutputWithDetails(raw);
  if (parsed.output) {
    if (options.phaseOverride) parsed.output.meta.phase = options.phaseOverride;
    const text =
      options.outputFormat === "pretty"
        ? serializeReadable(parsed.output)
        : serializeCompact(parsed.output);
    return { text, output: parsed.output };
  }

  const payload = {
    ok: false,
    error: parsed.error ?? { type: "json", message: "Failed to parse structured output" },
    raw,
    meta: {
      agent: options.agent,
      phase: options.phase,
    },
  };

  const text =
    options.outputFormat === "pretty" ? JSON.stringify(payload, null, 2) : JSON.stringify(payload);

  return { text, parseError: parsed.error };
}
