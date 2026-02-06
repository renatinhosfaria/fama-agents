/**
 * Output schema for the Security Auditor agent.
 *
 * The Security Auditor identifies vulnerabilities, assesses risk,
 * and provides remediation guidance.
 */

import { z } from "zod";
import {
  BaseOutputSchema,
  SeveritySchema,
  FileLocationSchema,
  CodeSnippetSchema,
} from "./common.js";

// ─── Vulnerability Category Schema ───

const VulnerabilityCategorySchema = z.enum([
  "injection", // SQL, command, LDAP, XPath
  "xss", // Cross-site scripting
  "csrf", // Cross-site request forgery
  "auth", // Authentication issues
  "authz", // Authorization issues
  "crypto", // Cryptographic weaknesses
  "exposure", // Sensitive data exposure
  "xxe", // XML external entities
  "deserialization", // Insecure deserialization
  "components", // Vulnerable components
  "logging", // Logging and monitoring
  "ssrf", // Server-side request forgery
  "path-traversal", // Path/directory traversal
  "race-condition", // Race conditions
  "dos", // Denial of service
  "configuration", // Security misconfiguration
  "other",
]);

// ─── CVSS Schema (simplified) ───

const CvssSchema = z.object({
  score: z.number().min(0).max(10),
  vector: z.string().optional(),
  severity: z.enum(["none", "low", "medium", "high", "critical"]),
});

// ─── Vulnerability Schema ───

const VulnerabilitySchema = z.object({
  id: z.string(),
  category: VulnerabilityCategorySchema,
  severity: SeveritySchema,
  title: z.string(),
  description: z.string(),
  location: FileLocationSchema,
  codeSnippet: CodeSnippetSchema.optional(),
  cvss: CvssSchema.optional(),
  cwe: z.string().optional(), // CWE-XXX identifier
  owasp: z.string().optional(), // OWASP category
  exploitability: z.enum(["trivial", "easy", "moderate", "difficult"]),
  impact: z.string(),
  remediation: z.object({
    description: z.string(),
    fixSnippet: CodeSnippetSchema.optional(),
    effort: z.enum(["trivial", "small", "medium", "large"]),
    priority: z.enum(["immediate", "high", "medium", "low"]),
  }),
  references: z.array(z.string()).optional(),
  falsePositiveProbability: z.enum(["low", "medium", "high"]).optional(),
});

// ─── Dependency Vulnerability Schema ───

const DependencyVulnerabilitySchema = z.object({
  id: z.string(),
  package: z.string(),
  version: z.string(),
  vulnerableVersions: z.string(),
  fixedVersion: z.string().optional(),
  severity: SeveritySchema,
  cve: z.string().optional(),
  ghsa: z.string().optional(), // GitHub Security Advisory
  description: z.string(),
  recommendation: z.string(),
});

// ─── Security Recommendation Schema ───

const SecurityRecommendationSchema = z.object({
  id: z.string(),
  category: z.enum([
    "hardening",
    "best-practice",
    "defense-in-depth",
    "compliance",
  ]),
  title: z.string(),
  description: z.string(),
  rationale: z.string(),
  implementation: z.string(),
  effort: z.enum(["trivial", "small", "medium", "large"]),
  priority: z.enum(["high", "medium", "low"]),
});

// ─── Security Audit Content Schema ───

const SecurityAuditContentSchema = z.object({
  overallRisk: z.enum(["critical", "high", "medium", "low", "minimal"]),
  summary: z.string(),
  vulnerabilities: z.array(VulnerabilitySchema),
  dependencyVulnerabilities: z.array(DependencyVulnerabilitySchema),
  recommendations: z.array(SecurityRecommendationSchema),
  metrics: z.object({
    filesScanned: z.number(),
    vulnerabilitiesFound: z.number(),
    criticalCount: z.number(),
    highCount: z.number(),
    mediumCount: z.number(),
    lowCount: z.number(),
    dependencyIssues: z.number(),
  }),
  compliance: z
    .object({
      owasp: z
        .object({
          passedChecks: z.array(z.string()),
          failedChecks: z.array(z.string()),
        })
        .optional(),
      standards: z.array(z.string()).optional(),
    })
    .optional(),
  blockers: z.array(z.string()),
  immediateActions: z.array(z.string()),
});

// ─── Full Output Schema ───

export const SecurityAuditOutputSchema = BaseOutputSchema.extend({
  result: BaseOutputSchema.shape.result.extend({
    content: SecurityAuditContentSchema,
  }),
});

// ─── Type Exports ───

export type VulnerabilityCategory = z.infer<typeof VulnerabilityCategorySchema>;
export type Cvss = z.infer<typeof CvssSchema>;
export type Vulnerability = z.infer<typeof VulnerabilitySchema>;
export type DependencyVulnerability = z.infer<
  typeof DependencyVulnerabilitySchema
>;
export type SecurityRecommendation = z.infer<
  typeof SecurityRecommendationSchema
>;
export type SecurityAuditContent = z.infer<typeof SecurityAuditContentSchema>;
export type SecurityAuditOutput = z.infer<typeof SecurityAuditOutputSchema>;

// ─── Validation Helper ───

export function validateSecurityAuditOutput(data: unknown) {
  return SecurityAuditOutputSchema.safeParse(data);
}

// ─── Utility Functions ───

/**
 * Checks if the audit found critical vulnerabilities.
 */
export function hasCriticalVulnerabilities(
  output: SecurityAuditOutput,
): boolean {
  return output.result.content.vulnerabilities.some(
    (v) => v.severity === "critical",
  );
}

/**
 * Gets all vulnerabilities requiring immediate action.
 */
export function getImmediateActions(
  output: SecurityAuditOutput,
): Vulnerability[] {
  return output.result.content.vulnerabilities.filter(
    (v) => v.remediation.priority === "immediate",
  );
}

/**
 * Calculates risk score (0-100) based on findings.
 */
export function calculateRiskScore(output: SecurityAuditOutput): number {
  const { metrics } = output.result.content;

  // Weighted scoring
  const score =
    metrics.criticalCount * 25 +
    metrics.highCount * 15 +
    metrics.mediumCount * 5 +
    metrics.lowCount * 1 +
    metrics.dependencyIssues * 3;

  // Cap at 100
  return Math.min(score, 100);
}
