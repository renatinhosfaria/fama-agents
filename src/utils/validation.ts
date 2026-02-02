import { z } from "zod";
import type { AgentConfig, WorkflowPhase } from "../core/types.js";
import { WorkflowPhaseSchema, AgentModelSchema } from "../core/schemas.js";
import { log } from "./logger.js";

export function normalizeOptionalString(
  value: unknown,
  field: string,
  context: string,
): string | undefined {
  if (value === undefined) return undefined;
  const result = z.string().safeParse(value);
  if (result.success) return result.data;
  log.warn(`${context}: invalid ${field} (expected string).`);
  return undefined;
}

export function normalizeOptionalStringArray(
  value: unknown,
  field: string,
  context: string,
): string[] | null {
  if (value === undefined) return null;
  const arrayResult = z.array(z.unknown()).safeParse(value);
  if (!arrayResult.success) {
    log.warn(`${context}: invalid ${field} (expected string array).`);
    return [];
  }

  const raw = arrayResult.data;
  const normalized = raw
    .filter((item): item is string => z.string().safeParse(item).success)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

  if (normalized.length !== raw.length) {
    log.warn(`${context}: some ${field} entries were invalid and ignored.`);
  }

  return normalized;
}

export function normalizeOptionalPhases(
  value: unknown,
  context: string,
): WorkflowPhase[] | null {
  if (value === undefined) return null;
  const arrayResult = z.array(z.unknown()).safeParse(value);
  if (!arrayResult.success) {
    log.warn(`${context}: invalid phases (expected array).`);
    return [];
  }

  const raw = arrayResult.data;
  const phases = raw.filter(
    (phase): phase is WorkflowPhase => WorkflowPhaseSchema.safeParse(phase).success,
  );

  if (phases.length !== raw.length) {
    log.warn(`${context}: some phases were invalid and ignored.`);
  }

  return phases;
}

export function normalizeOptionalModel(
  value: unknown,
  context: string,
): AgentConfig["model"] | undefined {
  if (value === undefined) return undefined;
  const result = AgentModelSchema.safeParse(value);
  if (result.success) return result.data;
  log.warn(`${context}: invalid model "${String(value)}" (using default).`);
  return undefined;
}
