/**
 * Common Zod schemas shared across agent output schemas.
 */

import { z } from "zod";

// ─── Enums ───

export const ResultStatusSchema = z.enum([
  "success",
  "partial",
  "blocked",
  "error",
]);

export const SeveritySchema = z.enum([
  "critical",
  "high",
  "medium",
  "low",
  "info",
]);

export const ReversibilitySchema = z.enum([
  "easy",
  "moderate",
  "hard",
  "irreversible",
]);

export const ArtifactTypeSchema = z.enum([
  "file",
  "decision",
  "task",
  "issue",
  "reference",
]);

export const WorkflowPhaseSchema = z.enum(["P", "R", "E", "V", "C"]);

// ─── Common Building Blocks ───

export const ArtifactSchema = z.object({
  type: ArtifactTypeSchema,
  path: z.string().optional(),
  content: z.string().optional(),
  hash: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const DecisionSchema = z.object({
  id: z.string(),
  decision: z.string(),
  rationale: z.string(),
  alternativesConsidered: z.array(z.string()),
  reversibility: ReversibilitySchema,
});

export const IssueSchema = z.object({
  id: z.string(),
  description: z.string(),
  severity: SeveritySchema,
  location: z.string().optional(),
  suggestedFix: z.string().optional(),
});

export const HandoffSchema = z.object({
  nextPhase: WorkflowPhaseSchema.nullable(),
  requiredContext: z.array(z.string()),
  blockingIssues: z.array(z.string()),
  suggestedAgents: z.array(z.string()),
});

export const OutputMetaSchema = z.object({
  agent: z.string(),
  skill: z.string().nullable(),
  phase: WorkflowPhaseSchema,
  timestamp: z.string(),
  tokensUsed: z.number(),
  model: z.string().optional(),
  durationMs: z.number().optional(),
});

// ─── Base Output Schema ───

/**
 * Base schema that all agent outputs must conform to.
 * Agent-specific schemas extend the `result.content` field.
 */
export const BaseOutputSchema = z.object({
  schemaVersion: z.string(),
  meta: OutputMetaSchema,
  result: z.object({
    status: ResultStatusSchema,
    summary: z.string().refine((val) => val.length <= 200, {
      message: "Summary must be 200 characters or less",
    }),
    content: z.unknown(),
  }),
  artifacts: z.array(ArtifactSchema),
  decisions: z.array(DecisionSchema),
  issues: z.array(IssueSchema),
  handoff: HandoffSchema,
});

// ─── Reusable Component Schemas ───

export const FileLocationSchema = z.object({
  file: z.string(),
  line: z.number().optional(),
  column: z.number().optional(),
  endLine: z.number().optional(),
});

export const CodeSnippetSchema = z.object({
  language: z.string(),
  code: z.string(),
  location: FileLocationSchema.optional(),
});

export const TaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  complexity: z.enum(["small", "medium", "large"]),
  dependencies: z.array(z.string()),
  acceptanceCriteria: z.array(z.string()),
  suggestedAgent: z.string().optional(),
});

export const RiskSchema = z.object({
  description: z.string(),
  likelihood: z.enum(["low", "medium", "high"]),
  impact: z.enum(["low", "medium", "high"]),
  mitigation: z.string(),
});

// ─── Type Exports ───

export type ResultStatus = z.infer<typeof ResultStatusSchema>;
export type Severity = z.infer<typeof SeveritySchema>;
export type Reversibility = z.infer<typeof ReversibilitySchema>;
export type ArtifactType = z.infer<typeof ArtifactTypeSchema>;
export type WorkflowPhase = z.infer<typeof WorkflowPhaseSchema>;
export type Artifact = z.infer<typeof ArtifactSchema>;
export type Decision = z.infer<typeof DecisionSchema>;
export type Issue = z.infer<typeof IssueSchema>;
export type Handoff = z.infer<typeof HandoffSchema>;
export type OutputMeta = z.infer<typeof OutputMetaSchema>;
export type BaseOutput = z.infer<typeof BaseOutputSchema>;
export type FileLocation = z.infer<typeof FileLocationSchema>;
export type CodeSnippet = z.infer<typeof CodeSnippetSchema>;
export type Task = z.infer<typeof TaskSchema>;
export type Risk = z.infer<typeof RiskSchema>;
