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
}

export interface AgentFactory {
  slug: string;
  phases: WorkflowPhase[];
  defaultSkills: string[];
  tools: string[];
  model: "sonnet" | "opus" | "haiku" | "inherit";
  build(
    playbookContent: string,
    skillContent: string[],
  ): AgentDefinition;
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
  permissionMode?: "default" | "acceptEdits" | "bypassPermissions";
}

// ─── Config ───
export interface FamaConfig {
  model: string;
  maxTurns: number;
  lang: string;
  skillsDir: string;
  workflow: {
    defaultScale: ProjectScale;
    gates: {
      requirePlan: boolean;
      requireApproval: boolean;
    };
  };
}

// ─── Gate ───
export interface GateResult {
  passed: boolean;
  reason?: string;
}
