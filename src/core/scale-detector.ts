import { ProjectScale } from "./types.js";

// ─── Keywords for Scale Detection ───

const QUICK_KEYWORDS = [
  "fix typo", "rename", "update comment", "small fix", "one-line",
  "corrigir typo", "renomear", "atualizar comentário", "correção simples",
];

const SMALL_KEYWORDS = [
  "add function", "create helper", "simple feature", "basic",
  "adicionar função", "criar helper", "feature simples", "básico",
];

const LARGE_KEYWORDS = [
  "system", "architecture", "redesign", "migration", "full",
  "complete", "comprehensive", "overhaul",
  "sistema", "arquitetura", "redesenhar", "migração", "completo",
  "abrangente",
];

// ─── Enhanced Scale Detection with Scoring ───

/** Signal contribution to scale detection */
export interface ScaleSignal {
  name: string;
  weight: number;
  score: number; // 0 = QUICK, 0.33 = SMALL, 0.66 = MEDIUM, 1 = LARGE
  contribution: number; // weight * score (normalized)
}

/** Result from enhanced scale detection */
export interface ScaleDetectionResult {
  scale: ProjectScale;
  confidence: number; // 0-1, how confident we are in this scale
  signals: ScaleSignal[];
}

/** Optional inputs for enhanced detection */
export interface ScaleDetectionOptions {
  fileCount?: number;
  gitDiffStats?: {
    additions: number;
    deletions: number;
    filesChanged: number;
  };
}

/**
 * Analyzes task description keywords and returns a score.
 * Score: 0 = QUICK, 0.33 = SMALL, 0.66 = MEDIUM, 1 = LARGE
 */
function analyzeKeywords(description: string): { score: number } {
  const lower = description.toLowerCase();

  // Quick indicators
  if (QUICK_KEYWORDS.some((k) => lower.includes(k))) {
    return { score: 0 };
  }

  // Large indicators
  if (LARGE_KEYWORDS.some((k) => lower.includes(k))) {
    return { score: 1 };
  }

  // Small indicators
  if (SMALL_KEYWORDS.some((k) => lower.includes(k))) {
    return { score: 0.33 };
  }

  // Default to medium
  return { score: 0.5 };
}

/**
 * Analyzes file count and returns a score.
 */
function analyzeFileCount(fileCount: number): { score: number } {
  if (fileCount <= 1) return { score: 0 };
  if (fileCount <= 3) return { score: 0.33 };
  if (fileCount <= 8) return { score: 0.66 };
  return { score: 1 };
}

/**
 * Analyzes task complexity based on linguistic patterns.
 */
function analyzeComplexity(description: string): { score: number } {
  const high = /\b(integrat|migrat|refactor|redesign|overhaul|multiple|across|all|entire|whole)\b/i;
  const medium = /\b(add|create|implement|update|modify|change|extend)\b/i;
  const low = /\b(fix|rename|update|tweak|adjust|minor)\b/i;

  if (high.test(description)) return { score: 0.9 };
  if (low.test(description)) return { score: 0.2 };
  if (medium.test(description)) return { score: 0.5 };
  return { score: 0.5 };
}

/**
 * Analyzes git diff stats and returns a score.
 */
function analyzeGitDiff(stats: { additions: number; deletions: number; filesChanged: number }): { score: number } {
  const totalChanges = stats.additions + stats.deletions;

  // Score based on total changes
  if (totalChanges <= 10) return { score: 0 };
  if (totalChanges <= 50) return { score: 0.33 };
  if (totalChanges <= 200) return { score: 0.66 };
  return { score: 1 };
}

/**
 * Calculates confidence based on signal agreement.
 * Higher confidence when signals agree, lower when they disagree.
 */
function calculateConfidence(signals: ScaleSignal[]): number {
  if (signals.length < 2) return 0.5;

  const scores = signals.map((s) => s.score);
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  const variance = scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length;
  const stdDev = Math.sqrt(variance);

  // High stdDev = low agreement = low confidence
  // Max stdDev for 0-1 range is 0.5
  const normalizedStdDev = stdDev / 0.5;
  return Math.max(0.2, 1 - normalizedStdDev);
}

/**
 * Enhanced scale detection with multi-signal scoring.
 *
 * Uses weighted signals from keywords, file count, complexity analysis,
 * and optionally git diff stats to determine project scale with confidence.
 *
 * @param description - Task description
 * @param options - Optional additional signals
 * @returns Scale detection result with confidence and signal breakdown
 */
export function detectScaleWithConfidence(
  description: string,
  options?: ScaleDetectionOptions,
): ScaleDetectionResult {
  const signals: ScaleSignal[] = [];

  // Signal 1: Keyword analysis (weight: 0.4)
  const keywordResult = analyzeKeywords(description);
  signals.push({
    name: "keywords",
    weight: 0.4,
    score: keywordResult.score,
    contribution: 0, // Calculated after normalization
  });

  // Signal 2: Complexity analysis (weight: 0.3)
  const complexityResult = analyzeComplexity(description);
  signals.push({
    name: "complexity",
    weight: 0.3,
    score: complexityResult.score,
    contribution: 0,
  });

  // Signal 3: File count heuristic (weight: 0.15)
  if (options?.fileCount !== undefined) {
    const fileResult = analyzeFileCount(options.fileCount);
    signals.push({
      name: "fileCount",
      weight: 0.15,
      score: fileResult.score,
      contribution: 0,
    });
  }

  // Signal 4: Git diff stats (weight: 0.15)
  if (options?.gitDiffStats) {
    const diffResult = analyzeGitDiff(options.gitDiffStats);
    signals.push({
      name: "gitDiff",
      weight: 0.15,
      score: diffResult.score,
      contribution: 0,
    });
  }

  // Normalize weights and calculate contributions
  const totalWeight = signals.reduce((sum, s) => sum + s.weight, 0);
  for (const signal of signals) {
    signal.contribution = (signal.weight / totalWeight) * signal.score;
  }

  // Calculate weighted score (0-1 range, maps to QUICK-LARGE)
  const weightedScore = signals.reduce((sum, s) => sum + s.contribution, 0);

  // Map score to scale
  let scale: ProjectScale;
  if (weightedScore < 0.25) {
    scale = ProjectScale.QUICK;
  } else if (weightedScore < 0.5) {
    scale = ProjectScale.SMALL;
  } else if (weightedScore < 0.75) {
    scale = ProjectScale.MEDIUM;
  } else {
    scale = ProjectScale.LARGE;
  }

  // Calculate confidence based on signal agreement
  const confidence = calculateConfidence(signals);

  return { scale, confidence, signals };
}

/**
 * Detects project scale from task description using keyword analysis.
 * Supports PT-BR keywords.
 *
 * This is the original simple detection function for backward compatibility.
 * For enhanced detection with confidence, use detectScaleWithConfidence().
 */
export function detectScale(
  description: string,
  fileCount?: number,
): ProjectScale {
  const lower = description.toLowerCase();

  // Check for explicit scale hints (highest priority)
  if (lower.includes("--scale quick") || lower.includes("--scale rapido"))
    return ProjectScale.QUICK;
  if (lower.includes("--scale small") || lower.includes("--scale pequeno"))
    return ProjectScale.SMALL;
  if (lower.includes("--scale medium") || lower.includes("--scale medio"))
    return ProjectScale.MEDIUM;
  if (lower.includes("--scale large") || lower.includes("--scale grande"))
    return ProjectScale.LARGE;

  // Keyword-based detection (high priority for exact matches)
  if (QUICK_KEYWORDS.some((k) => lower.includes(k))) return ProjectScale.QUICK;
  if (LARGE_KEYWORDS.some((k) => lower.includes(k))) return ProjectScale.LARGE;
  if (SMALL_KEYWORDS.some((k) => lower.includes(k))) return ProjectScale.SMALL;

  // File count heuristic (when no keywords match, file count is authoritative)
  if (fileCount !== undefined) {
    if (fileCount <= 1) return ProjectScale.QUICK;
    if (fileCount <= 3) return ProjectScale.SMALL;
    if (fileCount <= 8) return ProjectScale.MEDIUM;
    return ProjectScale.LARGE;
  }

  // Use enhanced detection for ambiguous cases without file count
  const result = detectScaleWithConfidence(description);
  return result.scale;
}

/**
 * Selects the best agent for a given task description.
 */
export function autoSelectAgent(description: string): string {
  const lower = description.toLowerCase();

  // Bug/fix keywords
  if (/\b(fix|bug|error|crash|broken|issue|falha|erro|quebr)/i.test(lower))
    return "bug-fixer";

  // Review keywords
  if (/\b(review|revis|analys|analis|audit|qualit)/i.test(lower))
    return "code-reviewer";

  // Test keywords
  if (/\b(test|spec|coverage|cobertura|teste)/i.test(lower))
    return "test-writer";

  // Debug keywords
  if (/\b(debug|investigat|diagnos|root.?cause)/i.test(lower))
    return "bug-fixer";

  // Security keywords
  if (/\b(secur|vulnerab|injection|xss|csrf|seguranç)/i.test(lower))
    return "security-auditor";

  // Refactor keywords
  if (/\b(refactor|clean|simplif|extract|refator)/i.test(lower))
    return "refactoring-specialist";

  // Architecture/design keywords
  if (/\b(architect|design|plan|break.?down|arquitet|projet)/i.test(lower))
    return "architect";

  // Documentation keywords
  if (/\b(doc|readme|comment|documentaç)/i.test(lower))
    return "documentation-writer";

  // Performance keywords
  if (/\b(perf|optimi|slow|fast|bench|desempenh|lent)/i.test(lower))
    return "performance-optimizer";

  // DevOps keywords
  if (/\b(deploy|docker|ci.?cd|pipeline|infra|devops)/i.test(lower))
    return "devops-specialist";

  // Backend keywords
  if (/\b(api|endpoint|rest|graphql|controller|middleware|backend|servidor|rota)/i.test(lower))
    return "backend-specialist";

  // Frontend keywords
  if (/\b(component|ui|ux|frontend|css|tailwind|react|vue|angular|svelte|tela|interface)/i.test(lower))
    return "frontend-specialist";

  // Database keywords
  if (/\b(database|schema|migration|query|sql|index|tabela|banco|modelo)/i.test(lower))
    return "database-specialist";

  // Mobile keywords
  if (/\b(mobile|react.?native|flutter|ios|android|app|celular)/i.test(lower))
    return "mobile-specialist";

  // Default: feature developer
  return "feature-developer";
}
