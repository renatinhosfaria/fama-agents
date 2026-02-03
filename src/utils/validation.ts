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

/**
 * Validates a skill name against the Agent Skills Specification.
 * Returns an array of warning messages (empty = valid).
 */
export function validateSkillName(name: string, dirName: string): string[] {
  const warnings: string[] = [];
  if (name.length > 64) {
    warnings.push(`Skill name "${name}" exceeds 64 characters (${name.length}).`);
  }
  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(name) && !/^[a-z0-9]$/.test(name)) {
    warnings.push(
      `Skill name "${name}" must be lowercase alphanumeric with hyphens, no leading/trailing hyphens.`,
    );
  }
  if (name.includes("--")) {
    warnings.push(`Skill name "${name}" must not contain consecutive hyphens.`);
  }
  if (name !== dirName) {
    warnings.push(`Skill name "${name}" does not match directory name "${dirName}".`);
  }
  return warnings;
}

/**
 * Validates a skill description against the Agent Skills Specification.
 * Returns an array of warning messages (empty = valid).
 */
export function validateSkillDescription(description: string): string[] {
  const warnings: string[] = [];
  if (description.length > 1024) {
    warnings.push(
      `Skill description exceeds 1024 characters (${description.length}).`,
    );
  }
  if (!description.toLowerCase().startsWith("use when")) {
    warnings.push(
      `Skill description should start with "Use when" for CSO discoverability.`,
    );
  }
  return warnings;
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
