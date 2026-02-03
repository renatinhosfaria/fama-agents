import { z } from "zod";
import { ProjectScale } from "./types.js";

// ─── Atomic schemas ───

export const WorkflowPhaseSchema = z.enum(["P", "R", "E", "V", "C"]);

export const AgentModelSchema = z.union([
  z.enum(["sonnet", "opus", "haiku", "inherit"]),
  z.string().regex(/^[a-z][a-z0-9]*\/[\w.-]+$/, "Provider/model format, e.g. 'openai/gpt-4o'"),
]);

export const PhaseStatusValueSchema = z.enum(["pending", "in_progress", "completed", "skipped"]);

// ─── Composite schemas ───

export const PhaseStatusSchema = z.object({
  status: PhaseStatusValueSchema,
  startedAt: z.string().optional(),
  completedAt: z.string().optional(),
  outputs: z.array(z.string()).optional(),
});

export const HistoryEntrySchema = z.object({
  timestamp: z.string(),
  phase: WorkflowPhaseSchema,
  action: z.enum(["started", "completed", "skipped"]),
  notes: z.string().optional(),
});

export const WorkflowStateSchema = z.object({
  name: z.string().min(1),
  scale: z.nativeEnum(ProjectScale),
  currentPhase: WorkflowPhaseSchema,
  phases: z.record(WorkflowPhaseSchema, PhaseStatusSchema),
  history: z.array(HistoryEntrySchema),
  startedAt: z.string(),
});

// ─── Team schemas ───

export const TeamConfigSchema = z.object({
  name: z.string().min(1),
  description: z.string().default(""),
  agents: z.array(z.string().min(1)).min(1),
  defaultSkills: z.array(z.string()).optional(),
});

// ─── Config schemas ───

export const GateDefinitionSchema = z.object({
  type: z.string().min(1),
  phases: z.array(z.string().regex(/^[PREVC]->[PREVC]$/)),
  config: z.record(z.string(), z.unknown()).optional(),
});

export const WorkflowGatesConfigSchema = z.object({
  requirePlan: z.boolean().default(true),
  requireApproval: z.boolean().default(false),
  gates: z.array(GateDefinitionSchema).optional(),
});

export const WorkflowConfigSchema = z.object({
  defaultScale: z.nativeEnum(ProjectScale).default(ProjectScale.MEDIUM),
  gates: WorkflowGatesConfigSchema.default({ requirePlan: true, requireApproval: false }),
});

export const ProviderConfigSchema = z.object({
  default: z.string().default("claude"),
  fallback: z.array(z.string()).optional(),
  apiKeys: z.record(z.string(), z.string()).optional(),
});

const BudgetConfigSchema = z.union([
  z.number().int().positive(),
  z.object({
    quick: z.number().int().positive().optional(),
    small: z.number().int().positive().optional(),
    medium: z.number().int().positive().optional(),
    large: z.number().int().positive().optional(),
  }),
]);

const LlmFirstConfigSchema = z.object({
  enabled: z.boolean().default(true),
  output: z
    .object({
      structured: z.boolean().default(true),
      format: z.enum(["compact", "pretty", "raw"]).default("compact"),
      quiet: z.boolean().default(true),
    })
    .default({ structured: true, format: "compact", quiet: true }),
  budgets: z
    .object({
      skills: BudgetConfigSchema.optional(),
      context: BudgetConfigSchema.optional(),
    })
    .default({}),
  manifold: z
    .object({
      enabled: z.boolean().default(true),
      policy: z.enum(["always", "structuredOnly"]).default("always"),
    })
    .default({ enabled: true, policy: "always" }),
  parallel: z
    .object({
      enabled: z.boolean().default(true),
      phases: z.array(WorkflowPhaseSchema).default(["R", "V"]),
    })
    .default({ enabled: true, phases: ["R", "V"] }),
});

export const FamaConfigSchema = z.object({
  model: z.string().default("sonnet"),
  maxTurns: z.number().int().positive().default(50),
  lang: z.string().default("pt-BR"),
  skillsDir: z.string().default("./skills"),
  provider: ProviderConfigSchema.optional(),
  workflow: WorkflowConfigSchema.default({
    defaultScale: ProjectScale.MEDIUM,
    gates: { requirePlan: true, requireApproval: false },
  }),
  llmFirst: LlmFirstConfigSchema.default({
    enabled: true,
    output: { structured: true, format: "compact", quiet: true },
    budgets: {},
    manifold: { enabled: true, policy: "always" },
    parallel: { enabled: true, phases: ["R", "V"] },
  }),
  teams: z.record(z.string(), TeamConfigSchema).optional(),
});

// ─── Persona & Menu schemas ───

export const PersonaConfigSchema = z.object({
  displayName: z.string().optional(),
  icon: z.string().optional(),
  role: z.string().optional(),
  identity: z.string().optional(),
  communicationStyle: z.string().optional(),
  principles: z.array(z.string()).optional(),
});

export const MenuEntrySchema = z.object({
  trigger: z.string().min(1),
  command: z.string().min(1),
  description: z.string().min(1),
});

// ─── Frontmatter schemas ───

export const AgentFrontmatterSchema = z
  .object({
    name: z.string().optional(),
    description: z.string().optional(),
    tools: z.array(z.string()).optional(),
    phases: z.array(WorkflowPhaseSchema).optional(),
    skills: z.array(z.string()).optional(),
    model: AgentModelSchema.optional(),
    persona: PersonaConfigSchema.optional(),
    critical_actions: z.array(z.string()).optional(),
    menu: z.array(MenuEntrySchema).optional(),
    hasSidecar: z.boolean().optional(),
  })
  .passthrough();

export const SkillFrontmatterSchema = z
  .object({
    name: z.string().optional(),
    description: z.string().optional(),
    phases: z.array(WorkflowPhaseSchema).optional(),
  })
  .passthrough();

// ─── Module schemas ───

export const ModuleManifestSchema = z.object({
  name: z.string().min(1),
  version: z.string().default("0.1.0"),
  description: z.string().default(""),
  agents: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
  workflows: z.array(z.string()).optional(),
});

// ─── Agent Memory schemas ───

export const MemoryEntrySchema = z.object({
  timestamp: z.string(),
  key: z.string().min(1),
  value: z.unknown(),
  context: z.string().optional(),
});

export const AgentMemorySchema = z.object({
  agentSlug: z.string().min(1),
  preferences: z.record(z.string(), z.unknown()).default({}),
  entries: z.array(MemoryEntrySchema).default([]),
});

// ─── Step-file Workflow schemas ───

export const StepfileWorkflowConfigSchema = z.object({
  name: z.string().min(1),
  description: z.string().default(""),
  outputDir: z.string().default(".fama/workflow-output"),
  steps: z.array(
    z.object({
      name: z.string().min(1),
      description: z.string().default(""),
      agent: z.string().min(1),
      skills: z.array(z.string()).optional(),
    }),
  ),
});

export const StepExecutionStateSchema = z.object({
  workflowName: z.string().min(1),
  currentStep: z.number().int().min(0),
  completedSteps: z.array(z.number().int()),
  results: z.record(z.string(), z.string()),
  startedAt: z.string(),
});

// ─── RunAgent schemas ───

export const RunAgentOptionsSchema = z.object({
  task: z.string().min(1),
  agent: z.string().optional(),
  skills: z.array(z.string()).optional(),
  model: z.string().optional(),
  maxTurns: z.number().int().positive().optional(),
  cwd: z.string().optional(),
  verbose: z.boolean().optional(),
  permissionMode: z.enum(["default", "acceptEdits", "bypassPermissions"]).optional(),
  onEvent: z.function().optional(),
  skillTokenBudget: z.number().int().positive().optional(),
  context: z.string().optional(),
  structured: z.boolean().optional(),
  phaseOverride: WorkflowPhaseSchema.optional(),
});
