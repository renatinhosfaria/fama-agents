/**
 * Output schemas for structured agent responses.
 *
 * Each agent has a specific output schema that defines the structure
 * of its response. These schemas enable:
 * - Type-safe output handling
 * - Validation of agent responses
 * - Machine-parseable structured data
 * - Consistent handoff between workflow phases
 */

// Common schemas and types
export * from "./common.js";

// Agent-specific schemas
export {
  ArchitectOutputSchema,
  validateArchitectOutput,
  type ArchitectOutput,
  type ArchitectContent,
  type Component,
  type ComponentType,
  type Interface,
  type DataFlow,
  type TradeOff,
} from "./architect.js";

export {
  CodeReviewOutputSchema,
  validateCodeReviewOutput,
  isBlocking,
  getCriticalIssues,
  countBySeverity,
  type CodeReviewOutput,
  type CodeReviewContent,
  type ReviewIssue,
  type IssueCategory,
  type Suggestion,
  type FileSummary,
  type ReviewVerdict,
} from "./code-reviewer.js";

export {
  SecurityAuditOutputSchema,
  validateSecurityAuditOutput,
  hasCriticalVulnerabilities,
  getImmediateActions,
  calculateRiskScore,
  type SecurityAuditOutput,
  type SecurityAuditContent,
  type Vulnerability,
  type VulnerabilityCategory,
  type DependencyVulnerability,
  type SecurityRecommendation,
  type Cvss,
} from "./security-auditor.js";

export {
  TestWriterOutputSchema,
  validateTestWriterOutput,
  isCoverageThresholdMet,
  getCriticalGaps,
  countByTestType,
  getLineCoverage,
  type TestWriterOutput,
  type TestWriterContent,
  type TestCase,
  type TestSuite,
  type TestType,
  type CoverageReport,
  type CoverageMetrics,
  type FileCoverage,
  type TestGap,
} from "./test-writer.js";

// ─── Schema Registry ───

import { ArchitectOutputSchema } from "./architect.js";
import { CodeReviewOutputSchema } from "./code-reviewer.js";
import { SecurityAuditOutputSchema } from "./security-auditor.js";
import { TestWriterOutputSchema } from "./test-writer.js";
import { BaseOutputSchema } from "./common.js";
import type { z } from "zod";

/**
 * Registry mapping agent slugs to their output schemas.
 */
export const OUTPUT_SCHEMA_REGISTRY: Record<string, z.ZodSchema> = {
  architect: ArchitectOutputSchema,
  "code-reviewer": CodeReviewOutputSchema,
  "security-auditor": SecurityAuditOutputSchema,
  "test-writer": TestWriterOutputSchema,
  // Agents without specific schemas use base schema
  default: BaseOutputSchema,
};

/**
 * Gets the output schema for an agent.
 * Falls back to BaseOutputSchema if no specific schema exists.
 */
export function getOutputSchema(agentSlug: string): z.ZodSchema {
  return OUTPUT_SCHEMA_REGISTRY[agentSlug] ?? OUTPUT_SCHEMA_REGISTRY.default;
}

/**
 * Validates agent output against its schema.
 */
export function validateAgentOutput(agentSlug: string, data: unknown) {
  const schema = getOutputSchema(agentSlug);
  return schema.safeParse(data);
}
