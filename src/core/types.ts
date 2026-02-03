import type { AgentDefinition } from "@anthropic-ai/claude-agent-sdk";

// Re-export SDK type for backward compat
export type { AgentDefinition };

// Internal agent definition (looser model type for multi-provider support)
export interface FamaAgentDefinition {
  description: string;
  prompt: string;
  tools?: string[];
  model?: string;
}

// ─── Workflow Phases ───
export type WorkflowPhase = "P" | "R" | "E" | "V" | "C";

export enum ProjectScale {
  QUICK = 0,
  SMALL = 1,
  MEDIUM = 2,
  LARGE = 3,
}

export type PhaseStatusValue = "pending" | "in_progress" | "completed" | "skipped";

export interface PhaseStatus {
  status: PhaseStatusValue;
  startedAt?: string;
  completedAt?: string;
  outputs?: string[];
}

export interface WorkflowState {
  name: string;
  scale: ProjectScale;
  currentPhase: WorkflowPhase;
  phases: Record<WorkflowPhase, PhaseStatus>;
  history: HistoryEntry[];
  startedAt: string;
}

export interface HistoryEntry {
  timestamp: string;
  phase: WorkflowPhase;
  action: "started" | "completed" | "skipped";
  notes?: string;
}

export interface PhaseDefinition {
  name: string;
  description: string;
  agents: string[];
  skills: string[];
  optional: boolean;
  order: number;
}

// ─── Skills ───

/** Level 1: ~100 tokens, loaded at startup for all skills. */
export interface SkillSummary {
  slug: string;
  name: string;
  description: string;
  phases: WorkflowPhase[];
  source: "built-in" | "project" | "user";
  filePath: string;
  // Agent Skills Specification optional fields:
  license?: string;
  compatibility?: string;
  metadata?: Record<string, string>;
  allowedTools?: string[];
}

/** Level 2: Full SKILL.md body, loaded on demand. Extends SkillSummary. */
export interface ParsedSkill extends SkillSummary {
  content: string;
}

/** Level 3: Reference files from skills/<name>/references/, loaded on demand. */
export interface SkillReference {
  slug: string;
  fileName: string;
  content: string;
}

// ─── Persona ───
export interface PersonaConfig {
  displayName?: string;
  icon?: string;
  role?: string;
  identity?: string;
  communicationStyle?: string;
  principles?: string[];
}

// ─── Menu ───
export interface MenuEntry {
  trigger: string;
  command: string;
  description: string;
}

// ─── Agents ───
export interface AgentConfig {
  slug: string;
  name: string;
  description: string;
  prompt: string;
  tools: string[];
  model: string;
  phases: WorkflowPhase[];
  defaultSkills: string[];
  filePath: string;
  persona?: PersonaConfig;
  criticalActions?: string[];
  menu?: MenuEntry[];
  hasSidecar?: boolean;
}

/** Skill metadata for ranking purposes */
export interface SkillForRanking {
  slug: string;
  name: string;
  description: string;
  content: string;
}

export interface BuildPromptOptions {
  playbookContent: string;
  skillContents: string[];
  persona?: PersonaConfig;
  criticalActions?: string[];
  memory?: AgentMemory;
  stackContext?: string;
  codebaseContext?: string;
  /** Max estimated tokens for all skills combined. Skills beyond budget are skipped. */
  skillTokenBudget?: number;
  /** Task description for skill relevance ranking */
  task?: string;
  /** Skills with metadata for ranking (alternative to skillContents) */
  skillsForRanking?: SkillForRanking[];
}

export interface AgentFactory {
  slug: string;
  description: string;
  phases: WorkflowPhase[];
  defaultSkills: string[];
  tools: string[];
  model: string;
  build(opts: BuildPromptOptions): FamaAgentDefinition;
}

// ─── Runner ───
export interface RunAgentOptions {
  task: string;
  agent?: string;
  skills?: string[];
  model?: string;
  maxTurns?: number;
  cwd?: string;
  verbose?: boolean;
  dryRun?: boolean;
  /** Max estimated tokens for all skills combined. Skills beyond budget are skipped. */
  skillTokenBudget?: number;
  /** Extra context injected into system prompt (e.g., Context Manifold). */
  context?: string;
  permissionMode?: "default" | "acceptEdits" | "bypassPermissions";
  onEvent?: (event: RunAgentEvent) => void;
  /** Project scale for model routing (auto-detected if not provided) */
  scale?: ProjectScale;
  /** Enable structured output mode (JSON with schema validation) */
  structured?: boolean;
  /** Override workflow phase used in structured output meta. */
  phaseOverride?: WorkflowPhase;
}

export interface RunAgentMetrics {
  agent: string;
  model?: string;
  maxTurns?: number;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  costUSD?: number;
  turns?: number;
}

export interface RunAgentEvent {
  status: "success" | "error";
  result?: string;
  error?: string;
  metrics: RunAgentMetrics;
}

// ─── Config ───
export interface GateDefinition {
  type: string;
  phases: string[];
  config?: Record<string, unknown>;
}

export interface WorkflowGatesConfig {
  requirePlan: boolean;
  requireApproval: boolean;
  gates?: GateDefinition[];
}

export type BudgetConfig =
  | number
  | {
      quick?: number;
      small?: number;
      medium?: number;
      large?: number;
    };

export interface LlmFirstConfig {
  enabled: boolean;
  output: {
    structured: boolean;
    format: "compact" | "pretty" | "raw";
    quiet: boolean;
  };
  budgets: {
    skills?: BudgetConfig;
    context?: BudgetConfig;
  };
  manifold: {
    enabled: boolean;
    policy: "always" | "structuredOnly";
  };
  parallel: {
    enabled: boolean;
    phases: WorkflowPhase[];
  };
}

export interface FamaConfig {
  model: string;
  maxTurns: number;
  lang: string;
  skillsDir: string;
  provider?: ProviderConfig;
  workflow: {
    defaultScale: ProjectScale;
    gates: WorkflowGatesConfig;
  };
  llmFirst: LlmFirstConfig;
  teams?: Record<string, TeamConfig>;
}

// ─── Gate ───
export interface GateResult {
  passed: boolean;
  reason?: string;
}

// ─── Step-file Workflows ───
export interface StepDefinition {
  order: number;
  name: string;
  description: string;
  agent: string;
  skills?: string[];
  filePath: string;
  prompt: string;
}

export interface StepfileWorkflow {
  name: string;
  description: string;
  outputDir: string;
  steps: StepDefinition[];
}

export interface StepExecutionState {
  workflowName: string;
  currentStep: number;
  completedSteps: number[];
  results: Record<number, string>;
  startedAt: string;
}

// ─── Teams ───
export interface TeamConfig {
  name: string;
  description: string;
  agents: string[];
  defaultSkills?: string[];
}

// ─── Modules ───
export interface ModuleManifest {
  name: string;
  version: string;
  description: string;
  agents?: string[];
  skills?: string[];
  workflows?: string[];
}

// ─── LLM Provider ───
export interface LLMQueryOptions {
  model?: string;
  maxTurns?: number;
  tools?: string[];
  cwd?: string;
  permissionMode?: string;
  agents?: Record<string, { description: string; prompt: string; tools?: string[] }>;
  systemPrompt: string;
  settingSources?: string[];
}

export interface LLMStreamEvent {
  type: "assistant" | "result";
  text?: string;
  result?: string;
  costUSD?: number;
  numTurns?: number;
  subtype?: "success" | "error";
  errors?: unknown[];
  message?: { content: unknown[] };
}

export interface LLMProvider {
  readonly name: string;
  readonly supportsSubagents: boolean;
  readonly supportsMcp: boolean;
  query(prompt: string, options: LLMQueryOptions): AsyncIterable<LLMStreamEvent>;
}

/** Model routing configuration for scale-based model selection */
export interface ModelRoutingConfig {
  quick: string;
  small: string;
  medium: string;
  large: string;
}

export interface ProviderConfig {
  default: string;
  fallback?: string[];
  apiKeys?: Record<string, string>;
  /** Model routing by project scale */
  routing?: ModelRoutingConfig;
}

// ─── Agent Memory (Sidecar) ───
export interface MemoryEntry {
  timestamp: string;
  key: string;
  value: unknown;
  context?: string;
}

export interface AgentMemory {
  agentSlug: string;
  preferences: Record<string, unknown>;
  entries: MemoryEntry[];
}

// ─── LLM-First Architecture (Re-exports) ───

// Structured Output Protocol
export type {
  StructuredAgentOutput,
  OutputMeta,
  ResultPayload,
  ResultStatus,
  Artifact,
  ArtifactType,
  Decision,
  Reversibility,
  Issue,
  IssueSeverity,
  HandoffInfo,
} from "./output-protocol.js";

export {
  CURRENT_SCHEMA_VERSION,
  createSuccessOutput,
  createErrorOutput,
  addArtifact,
  addDecision,
  addIssue,
  parseStructuredOutput,
  isStructuredOutput,
  serializeCompact,
  serializeReadable,
} from "./output-protocol.js";

// Token Estimation
export type {
  TokenBudgetAllocation,
  TokenUsageTracker,
  SkillTokenCache,
} from "./token-estimator.js";

export {
  estimateTokens,
  estimateTokensCharBased,
  estimateTokensWordBased,
  detectCodeRatio,
  getBudgetForScale,
  createCustomBudget,
  totalBudget,
  createUsageTracker,
  remainingBudget,
  isBudgetExceeded,
  truncateToTokenBudget,
  splitIntoChunks,
  createSkillTokenCache,
  BUDGET_PROFILES,
} from "./token-estimator.js";

// Compact Prompt Format
export type {
  CompactPromptSection,
  CompactSkillSection,
  CompactContextSection,
  CompactPromptOptions,
} from "./compact-prompt.js";

export {
  buildCompactPrompt,
  convertMarkdownToCompact,
  convertSkillToCompiled,
  estimateTokenSavings,
} from "./compact-prompt.js";
