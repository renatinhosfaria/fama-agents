/**
 * Output schema for the Architect agent.
 *
 * The Architect produces system designs, component breakdowns,
 * and architectural decisions.
 */

import { z } from "zod";
import {
  BaseOutputSchema,
  TaskSchema,
  RiskSchema,
  FileLocationSchema,
} from "./common.js";

// ─── Component Schema ───

const ComponentTypeSchema = z.enum([
  "service",
  "module",
  "library",
  "api",
  "ui",
  "database",
  "queue",
  "cache",
  "gateway",
]);

const InterfaceSchema = z.object({
  name: z.string(),
  signature: z.string(),
  purpose: z.string(),
  parameters: z
    .array(
      z.object({
        name: z.string(),
        type: z.string(),
        description: z.string().optional(),
      }),
    )
    .optional(),
  returns: z.string().optional(),
});

const ComponentSchema = z.object({
  name: z.string(),
  type: ComponentTypeSchema,
  responsibility: z.string(),
  dependencies: z.array(z.string()),
  interfaces: z.array(InterfaceSchema),
  location: FileLocationSchema.optional(),
  notes: z.string().optional(),
});

// ─── Data Flow Schema ───

const DataFlowSchema = z.object({
  from: z.string(),
  to: z.string(),
  dataType: z.string(),
  protocol: z.string().optional(),
  isAsync: z.boolean().optional(),
  description: z.string().optional(),
});

// ─── Trade-off Schema ───

const TradeOffSchema = z.object({
  decision: z.string(),
  chosenOption: z.string(),
  alternatives: z.array(z.string()),
  rationale: z.string(),
  risks: z.array(z.string()),
  reversibility: z.enum(["easy", "moderate", "hard", "irreversible"]),
});

// ─── Architecture Content Schema ───

const ArchitectContentSchema = z.object({
  design: z.object({
    overview: z.string(),
    components: z.array(ComponentSchema),
    dataFlow: z.array(DataFlowSchema),
    tradeOffs: z.array(TradeOffSchema),
  }),
  tasks: z.array(TaskSchema),
  risks: z.array(RiskSchema),
  implementationOrder: z.array(z.string()).optional(),
  estimatedComplexity: z.enum(["small", "medium", "large"]).optional(),
});

// ─── Full Output Schema ───

export const ArchitectOutputSchema = BaseOutputSchema.extend({
  result: BaseOutputSchema.shape.result.extend({
    content: ArchitectContentSchema,
  }),
});

// ─── Type Exports ───

export type ComponentType = z.infer<typeof ComponentTypeSchema>;
export type Interface = z.infer<typeof InterfaceSchema>;
export type Component = z.infer<typeof ComponentSchema>;
export type DataFlow = z.infer<typeof DataFlowSchema>;
export type TradeOff = z.infer<typeof TradeOffSchema>;
export type ArchitectContent = z.infer<typeof ArchitectContentSchema>;
export type ArchitectOutput = z.infer<typeof ArchitectOutputSchema>;

// ─── Validation Helper ───

export function validateArchitectOutput(data: unknown) {
  return ArchitectOutputSchema.safeParse(data);
}
