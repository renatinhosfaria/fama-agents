/**
 * Output schema for the Code Reviewer agent.
 *
 * The Code Reviewer analyzes code for issues, suggests improvements,
 * and provides approval decisions.
 */

import { z } from "zod";
import {
  BaseOutputSchema,
  SeveritySchema,
  FileLocationSchema,
  CodeSnippetSchema,
} from "./common.js";

// ─── Review Issue Schema ───

const IssueCategorySchema = z.enum([
  "bug",
  "security",
  "performance",
  "maintainability",
  "style",
  "logic",
  "testing",
  "documentation",
  "architecture",
  "other",
]);

const ReviewIssueSchema = z.object({
  id: z.string(),
  category: IssueCategorySchema,
  severity: SeveritySchema,
  title: z.string(),
  description: z.string(),
  location: FileLocationSchema,
  codeSnippet: CodeSnippetSchema.optional(),
  suggestedFix: z.string().optional(),
  fixSnippet: CodeSnippetSchema.optional(),
  effort: z.enum(["trivial", "small", "medium", "large"]).optional(),
  references: z.array(z.string()).optional(),
});

// ─── Suggestion Schema ───

const SuggestionSchema = z.object({
  id: z.string(),
  type: z.enum(["refactor", "optimization", "simplification", "pattern"]),
  title: z.string(),
  description: z.string(),
  location: FileLocationSchema.optional(),
  before: CodeSnippetSchema.optional(),
  after: CodeSnippetSchema.optional(),
  benefit: z.string(),
  effort: z.enum(["trivial", "small", "medium", "large"]),
});

// ─── File Summary Schema ───

const FileSummarySchema = z.object({
  file: z.string(),
  issueCount: z.number(),
  criticalCount: z.number(),
  highCount: z.number(),
  mediumCount: z.number(),
  lowCount: z.number(),
  verdict: z.enum(["clean", "minor-issues", "needs-work", "critical"]),
});

// ─── Review Verdict Schema ───

const ReviewVerdictSchema = z.enum([
  "approved",
  "approved-with-suggestions",
  "changes-requested",
  "blocked",
]);

// ─── Code Review Content Schema ───

const CodeReviewContentSchema = z.object({
  verdict: ReviewVerdictSchema,
  summary: z.string(),
  issues: z.array(ReviewIssueSchema),
  suggestions: z.array(SuggestionSchema),
  fileSummaries: z.array(FileSummarySchema),
  metrics: z
    .object({
      filesReviewed: z.number(),
      linesReviewed: z.number(),
      issuesFound: z.number(),
      criticalIssues: z.number(),
      suggestionsProvided: z.number(),
    })
    .optional(),
  blockers: z.array(z.string()),
  mustFix: z.array(z.string()),
  niceToHave: z.array(z.string()),
});

// ─── Full Output Schema ───

export const CodeReviewOutputSchema = BaseOutputSchema.extend({
  result: BaseOutputSchema.shape.result.extend({
    content: CodeReviewContentSchema,
  }),
});

// ─── Type Exports ───

export type IssueCategory = z.infer<typeof IssueCategorySchema>;
export type ReviewIssue = z.infer<typeof ReviewIssueSchema>;
export type Suggestion = z.infer<typeof SuggestionSchema>;
export type FileSummary = z.infer<typeof FileSummarySchema>;
export type ReviewVerdict = z.infer<typeof ReviewVerdictSchema>;
export type CodeReviewContent = z.infer<typeof CodeReviewContentSchema>;
export type CodeReviewOutput = z.infer<typeof CodeReviewOutputSchema>;

// ─── Validation Helper ───

export function validateCodeReviewOutput(data: unknown) {
  return CodeReviewOutputSchema.safeParse(data);
}

// ─── Utility Functions ───

/**
 * Checks if the review is blocking (requires changes before merge).
 */
export function isBlocking(output: CodeReviewOutput): boolean {
  const verdict = output.result.content.verdict;
  return verdict === "blocked" || verdict === "changes-requested";
}

/**
 * Gets all critical issues from the review.
 */
export function getCriticalIssues(output: CodeReviewOutput): ReviewIssue[] {
  return output.result.content.issues.filter(
    (issue) => issue.severity === "critical",
  );
}

/**
 * Counts issues by severity.
 */
export function countBySeverity(
  output: CodeReviewOutput,
): Record<string, number> {
  const counts: Record<string, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0,
  };

  for (const issue of output.result.content.issues) {
    counts[issue.severity]++;
  }

  return counts;
}
