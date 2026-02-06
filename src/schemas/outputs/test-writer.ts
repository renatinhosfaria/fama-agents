/**
 * Output schema for the Test Writer agent.
 *
 * The Test Writer creates test cases, analyzes coverage,
 * and validates testing requirements.
 */

import { z } from "zod";
import {
  BaseOutputSchema,
  FileLocationSchema,
  CodeSnippetSchema,
} from "./common.js";

// ─── Test Type Schema ───

const TestTypeSchema = z.enum([
  "unit",
  "integration",
  "e2e",
  "snapshot",
  "performance",
  "smoke",
  "regression",
  "acceptance",
]);

// ─── Test Case Schema ───

const TestCaseSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: TestTypeSchema,
  description: z.string(),
  targetFunction: z.string().optional(),
  targetFile: z.string().optional(),
  code: CodeSnippetSchema,
  assertions: z.array(z.string()),
  setup: z.string().optional(),
  teardown: z.string().optional(),
  tags: z.array(z.string()).optional(),
  priority: z.enum(["critical", "high", "medium", "low"]),
  estimatedRuntime: z.string().optional(), // e.g., "< 1s", "~5s"
});

// ─── Test Suite Schema ───

const TestSuiteSchema = z.object({
  name: z.string(),
  file: z.string(),
  description: z.string(),
  testCases: z.array(TestCaseSchema),
  beforeAll: CodeSnippetSchema.optional(),
  afterAll: CodeSnippetSchema.optional(),
  beforeEach: CodeSnippetSchema.optional(),
  afterEach: CodeSnippetSchema.optional(),
});

// ─── Coverage Report Schema ───

const CoverageMetricsSchema = z.object({
  lines: z.object({
    total: z.number(),
    covered: z.number(),
    percentage: z.number(),
  }),
  branches: z.object({
    total: z.number(),
    covered: z.number(),
    percentage: z.number(),
  }),
  functions: z.object({
    total: z.number(),
    covered: z.number(),
    percentage: z.number(),
  }),
  statements: z.object({
    total: z.number(),
    covered: z.number(),
    percentage: z.number(),
  }),
});

const FileCoverageSchema = z.object({
  file: z.string(),
  metrics: CoverageMetricsSchema,
  uncoveredLines: z.array(z.number()),
  uncoveredBranches: z.array(z.number()),
});

const CoverageReportSchema = z.object({
  overall: CoverageMetricsSchema,
  byFile: z.array(FileCoverageSchema),
  thresholdMet: z.boolean(),
  threshold: z.object({
    lines: z.number(),
    branches: z.number(),
    functions: z.number(),
  }),
});

// ─── Test Gap Schema ───

const TestGapSchema = z.object({
  id: z.string(),
  type: z.enum([
    "untested-function",
    "missing-edge-case",
    "missing-error-handling",
    "missing-integration",
    "low-coverage",
  ]),
  description: z.string(),
  location: FileLocationSchema,
  suggestedTests: z.array(z.string()),
  priority: z.enum(["critical", "high", "medium", "low"]),
});

// ─── Test Writer Content Schema ───

const TestWriterContentSchema = z.object({
  summary: z.string(),
  testSuites: z.array(TestSuiteSchema),
  coverage: CoverageReportSchema.optional(),
  gaps: z.array(TestGapSchema),
  metrics: z.object({
    testsCreated: z.number(),
    testSuitesCreated: z.number(),
    coverageImprovement: z.number().optional(),
    estimatedTotalRuntime: z.string().optional(),
  }),
  recommendations: z.array(
    z.object({
      type: z.enum(["coverage", "quality", "organization", "performance"]),
      description: z.string(),
      priority: z.enum(["high", "medium", "low"]),
    }),
  ),
  runCommands: z.array(
    z.object({
      description: z.string(),
      command: z.string(),
    }),
  ),
});

// ─── Full Output Schema ───

export const TestWriterOutputSchema = BaseOutputSchema.extend({
  result: BaseOutputSchema.shape.result.extend({
    content: TestWriterContentSchema,
  }),
});

// ─── Type Exports ───

export type TestType = z.infer<typeof TestTypeSchema>;
export type TestCase = z.infer<typeof TestCaseSchema>;
export type TestSuite = z.infer<typeof TestSuiteSchema>;
export type CoverageMetrics = z.infer<typeof CoverageMetricsSchema>;
export type FileCoverage = z.infer<typeof FileCoverageSchema>;
export type CoverageReport = z.infer<typeof CoverageReportSchema>;
export type TestGap = z.infer<typeof TestGapSchema>;
export type TestWriterContent = z.infer<typeof TestWriterContentSchema>;
export type TestWriterOutput = z.infer<typeof TestWriterOutputSchema>;

// ─── Validation Helper ───

export function validateTestWriterOutput(data: unknown) {
  return TestWriterOutputSchema.safeParse(data);
}

// ─── Utility Functions ───

/**
 * Checks if coverage threshold is met.
 */
export function isCoverageThresholdMet(output: TestWriterOutput): boolean {
  return output.result.content.coverage?.thresholdMet ?? true;
}

/**
 * Gets all critical test gaps.
 */
export function getCriticalGaps(output: TestWriterOutput): TestGap[] {
  return output.result.content.gaps.filter((gap) => gap.priority === "critical");
}

/**
 * Counts tests by type.
 */
export function countByTestType(output: TestWriterOutput): Record<string, number> {
  const counts: Record<string, number> = {};

  for (const suite of output.result.content.testSuites) {
    for (const testCase of suite.testCases) {
      counts[testCase.type] = (counts[testCase.type] ?? 0) + 1;
    }
  }

  return counts;
}

/**
 * Gets the overall line coverage percentage.
 */
export function getLineCoverage(output: TestWriterOutput): number {
  return output.result.content.coverage?.overall.lines.percentage ?? 0;
}
