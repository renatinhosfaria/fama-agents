import type { AgentDefinition } from "@anthropic-ai/claude-agent-sdk";

// ─── Workflow Phases ───
export type WorkflowPhase = "P" | "R" | "E" | "V" | "C";

export enum ProjectScale {
  QUICK = 0,
  SMALL = 1,
  MEDIUM = 2,
  LARGE = 3,
}

export type PhaseStatusValue =
  | "pending"
  | "in_progress"
  | "completed"
  | "skipped";

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
  model: "sonnet" | "opus" | "haiku" | "inherit";
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
}

export interface AgentFactory {
  slug: string;
  description: string;
  phases: WorkflowPhase[];
  defaultSkills: string[];
  tools: string[];
  model: "sonnet" | "opus" | "haiku" | "inherit";
  build(opts: BuildPromptOptions): AgentDefinition;
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
export interface WorkflowGatesConfig {
  requirePlan: boolean;
  requireApproval: boolean;
}

export interface FamaConfig {
  model: string;
  maxTurns: number;
  lang: string;
  skillsDir: string;
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
