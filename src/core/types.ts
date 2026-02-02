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
export interface ParsedSkill {
  slug: string;
  name: string;
  description: string;
  content: string;
  phases: WorkflowPhase[];
  source: "built-in" | "project" | "user";
  filePath: string;
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

export interface BuildPromptOptions {
  playbookContent: string;
  skillContents: string[];
  persona?: PersonaConfig;
  criticalActions?: string[];
  memory?: AgentMemory;
  stackContext?: string;
  codebaseContext?: string;
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
  permissionMode?: "default" | "acceptEdits" | "bypassPermissions";
  onEvent?: (event: RunAgentEvent) => void;
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

export interface ProviderConfig {
  default: string;
  fallback?: string[];
  apiKeys?: Record<string, string>;
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
