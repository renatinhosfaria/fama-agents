/**
 * Quality Gate System for Workflow Validation
 *
 * Provides quantitative quality scoring for workflow phases,
 * enabling automated loop-back when quality thresholds aren't met.
 */

import type { ParallelExecutionResult } from "../core/parallel-executor.js";

/** Individual quality factor in the scoring breakdown */
export interface QualityFactor {
  name: string;
  weight: number;
  score: number; // 0-100
  reason: string;
}

/** Quality assessment result */
export interface QualityScore {
  phase: string;
  score: number; // 0-100 weighted score
  breakdown: QualityFactor[];
  passed: boolean;
  recommendations: string[];
}

/** Configuration for quality thresholds */
export interface QualityConfig {
  /** Minimum score to pass (0-100), default: 70 */
  minimumScore: number;
  /** Whether to loop back on failure, default: true */
  loopBackOnFailure: boolean;
  /** Maximum loop-back iterations, default: 2 */
  maxLoops: number;
  /** Custom factor weights (optional) */
  weights?: {
    completion?: number;
    testing?: number;
    security?: number;
    review?: number;
  };
}

const DEFAULT_CONFIG: QualityConfig = {
  minimumScore: 70,
  loopBackOnFailure: true,
  maxLoops: 2,
  weights: {
    completion: 0.3,
    testing: 0.25,
    security: 0.25,
    review: 0.2,
  },
};

/**
 * Analyzes test-writer result for quality indicators.
 */
function analyzeTestResult(result: string): { score: number; reason: string } {
  if (!result) return { score: 0, reason: "No test output available" };

  const lower = result.toLowerCase();

  // Check for explicit success/failure indicators
  if (/100%\s*coverage|all\s*tests?\s*pass/i.test(result)) {
    return { score: 100, reason: "Full test coverage, all tests passing" };
  }

  if (/(\d+)%\s*coverage/i.test(result)) {
    const match = result.match(/(\d+)%\s*coverage/i);
    const coverage = match ? parseInt(match[1], 10) : 50;
    return { score: coverage, reason: `Test coverage: ${coverage}%` };
  }

  if (/tests?\s*(added|written|created)/i.test(lower)) {
    return { score: 75, reason: "Tests added" };
  }

  if (/fail|error|broken/i.test(lower)) {
    return { score: 30, reason: "Tests failing or errors detected" };
  }

  if (/no\s*tests?|skip/i.test(lower)) {
    return { score: 20, reason: "No tests or tests skipped" };
  }

  return { score: 60, reason: "Test execution status unclear" };
}

/**
 * Analyzes security-auditor result for quality indicators.
 */
function analyzeSecurityResult(result: string): { score: number; reason: string } {
  if (!result) return { score: 50, reason: "No security audit output available" };

  const lower = result.toLowerCase();

  // Check for vulnerability indicators
  if (/critical|high\s*severity/i.test(lower)) {
    return { score: 20, reason: "Critical or high severity issues found" };
  }

  if (/medium\s*severity/i.test(lower)) {
    return { score: 50, reason: "Medium severity issues found" };
  }

  if (/low\s*severity|informational/i.test(lower)) {
    return { score: 75, reason: "Only low severity or informational issues" };
  }

  if (/no\s*(vulnerabilit|issue|finding)|clean|secure/i.test(lower)) {
    return { score: 100, reason: "No security issues found" };
  }

  if (/audit\s*(complete|pass)/i.test(lower)) {
    return { score: 85, reason: "Security audit completed" };
  }

  return { score: 60, reason: "Security status unclear" };
}

/**
 * Analyzes code-reviewer result for quality indicators.
 */
function analyzeReviewResult(result: string): { score: number; reason: string } {
  if (!result) return { score: 50, reason: "No code review output available" };

  const lower = result.toLowerCase();

  // Check for approval/rejection indicators
  if (/lgtm|approv|looks\s*good/i.test(lower)) {
    return { score: 100, reason: "Code review approved" };
  }

  if (/major\s*(issue|concern|problem)|block/i.test(lower)) {
    return { score: 30, reason: "Major issues requiring attention" };
  }

  if (/minor\s*(issue|suggestion)|nit/i.test(lower)) {
    return { score: 75, reason: "Minor suggestions only" };
  }

  if (/review\s*complete/i.test(lower)) {
    return { score: 70, reason: "Review completed" };
  }

  return { score: 60, reason: "Review status unclear" };
}

/**
 * Assesses quality of parallel execution results from Validation phase.
 *
 * @param results - Results from parallel agent execution
 * @param config - Quality configuration
 * @returns Quality score with breakdown
 */
export function assessValidationQuality(
  results: ParallelExecutionResult[],
  config: QualityConfig = DEFAULT_CONFIG,
): QualityScore {
  const factors: QualityFactor[] = [];
  const recommendations: string[] = [];
  const weights = config.weights ?? DEFAULT_CONFIG.weights!;

  // Factor 1: Completion rate
  const successCount = results.filter((r) => r.status === "success").length;
  const completionRate = results.length > 0 ? (successCount / results.length) * 100 : 0;
  factors.push({
    name: "completion",
    weight: weights.completion ?? 0.3,
    score: completionRate,
    reason: `${successCount}/${results.length} agents completed successfully`,
  });

  if (completionRate < 100) {
    const failed = results.filter((r) => r.status === "error").map((r) => r.agent);
    recommendations.push(`Fix failed agents: ${failed.join(", ")}`);
  }

  // Factor 2: Test quality
  const testWriter = results.find((r) => r.agent === "test-writer");
  if (testWriter?.status === "success") {
    const testAnalysis = analyzeTestResult(testWriter.result ?? "");
    factors.push({
      name: "testing",
      weight: weights.testing ?? 0.25,
      score: testAnalysis.score,
      reason: testAnalysis.reason,
    });

    if (testAnalysis.score < 70) {
      recommendations.push("Improve test coverage and ensure all tests pass");
    }
  } else {
    factors.push({
      name: "testing",
      weight: weights.testing ?? 0.25,
      score: testWriter ? 0 : 50,
      reason: testWriter ? "Test writer failed" : "Test writer not executed",
    });
    recommendations.push("Run test writer agent");
  }

  // Factor 3: Security audit
  const securityAuditor = results.find((r) => r.agent === "security-auditor");
  if (securityAuditor?.status === "success") {
    const securityAnalysis = analyzeSecurityResult(securityAuditor.result ?? "");
    factors.push({
      name: "security",
      weight: weights.security ?? 0.25,
      score: securityAnalysis.score,
      reason: securityAnalysis.reason,
    });

    if (securityAnalysis.score < 70) {
      recommendations.push("Address security vulnerabilities before proceeding");
    }
  } else {
    factors.push({
      name: "security",
      weight: weights.security ?? 0.25,
      score: securityAuditor ? 0 : 50,
      reason: securityAuditor ? "Security auditor failed" : "Security auditor not executed",
    });
    recommendations.push("Run security audit");
  }

  // Factor 4: Code review
  const codeReviewer = results.find((r) => r.agent === "code-reviewer");
  if (codeReviewer?.status === "success") {
    const reviewAnalysis = analyzeReviewResult(codeReviewer.result ?? "");
    factors.push({
      name: "review",
      weight: weights.review ?? 0.2,
      score: reviewAnalysis.score,
      reason: reviewAnalysis.reason,
    });

    if (reviewAnalysis.score < 70) {
      recommendations.push("Address code review feedback");
    }
  } else {
    factors.push({
      name: "review",
      weight: weights.review ?? 0.2,
      score: codeReviewer ? 0 : 50,
      reason: codeReviewer ? "Code reviewer failed" : "Code reviewer not executed",
    });
    recommendations.push("Get code review");
  }

  // Calculate weighted score
  const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0);
  const weightedScore = factors.reduce((sum, f) => sum + (f.weight / totalWeight) * f.score, 0);
  const finalScore = Math.round(weightedScore);

  return {
    phase: "V",
    score: finalScore,
    breakdown: factors,
    passed: finalScore >= config.minimumScore,
    recommendations: finalScore < config.minimumScore ? recommendations : [],
  };
}

/**
 * Formats quality score for display.
 */
export function formatQualityScore(score: QualityScore): string {
  const lines: string[] = [
    "## Quality Assessment\n",
    `**Overall Score:** ${score.score}/100 ${score.passed ? "✓ PASSED" : "✗ FAILED"}`,
    "",
    "### Breakdown",
  ];

  for (const factor of score.breakdown) {
    const icon = factor.score >= 70 ? "✓" : factor.score >= 50 ? "⚠" : "✗";
    lines.push(
      `- ${icon} **${factor.name}** (${Math.round(factor.weight * 100)}%): ${factor.score}/100`,
    );
    lines.push(`  ${factor.reason}`);
  }

  if (score.recommendations.length > 0) {
    lines.push("");
    lines.push("### Recommendations");
    for (const rec of score.recommendations) {
      lines.push(`- ${rec}`);
    }
  }

  return lines.join("\n");
}

/**
 * Determines if a loop-back is needed based on quality score.
 *
 * @param score - Quality score from assessment
 * @param currentLoops - Number of loop-backs already performed
 * @param config - Quality configuration
 * @returns Whether to loop back to Execution phase
 */
export function shouldLoopBack(
  score: QualityScore,
  currentLoops: number,
  config: QualityConfig = DEFAULT_CONFIG,
): { loopBack: boolean; reason: string } {
  if (score.passed) {
    return { loopBack: false, reason: "Quality threshold met" };
  }

  if (!config.loopBackOnFailure) {
    return { loopBack: false, reason: "Loop-back disabled in configuration" };
  }

  if (currentLoops >= config.maxLoops) {
    return {
      loopBack: false,
      reason: `Maximum loop-backs (${config.maxLoops}) reached`,
    };
  }

  return {
    loopBack: true,
    reason: `Quality score ${score.score} below threshold ${config.minimumScore}`,
  };
}
