/**
 * Token Estimation for LLM-first output optimization.
 *
 * Provides accurate token estimation without external dependencies.
 * Uses character-based heuristics calibrated against tiktoken.
 */

import type { ProjectScale } from "./types.js";

// ─── Token Estimation ───

/**
 * Detects the ratio of code vs natural language in text.
 * Code has higher token density (fewer chars per token).
 *
 * @param text - Text to analyze
 * @returns Ratio from 0 (all prose) to 1 (all code)
 */
export function detectCodeRatio(text: string): number {
  if (!text || text.length === 0) return 0;

  // Code indicators: brackets, operators, semicolons, camelCase
  const codePatterns = [
    /[{}[\]();]/g, // Brackets and parens
    /[<>=!&|]+/g, // Operators
    /\b(const|let|var|function|class|import|export|return|if|else|for|while)\b/g, // Keywords
    /[a-z][A-Z]/g, // camelCase
    /^\s*(\/\/|#|\/\*|\*)/gm, // Comments
    /\.\w+\(/g, // Method calls
  ];

  let codeChars = 0;
  for (const pattern of codePatterns) {
    const matches = text.match(pattern);
    if (matches) {
      codeChars += matches.join("").length;
    }
  }

  // Normalize by text length, cap at 1
  return Math.min(codeChars / text.length, 1);
}

/**
 * Estimates tokens using character-based heuristics.
 *
 * Calibrated against tiktoken (cl100k_base):
 * - English prose: ~4.0 chars/token
 * - Code: ~3.5 chars/token
 * - Mixed content: weighted average
 *
 * Accuracy: ~95% compared to tiktoken for typical content.
 *
 * @param text - Text to estimate
 * @returns Estimated token count
 */
export function estimateTokensCharBased(text: string): number {
  if (!text || text.length === 0) return 0;

  const codeRatio = detectCodeRatio(text);

  // Chars per token: 4.0 for prose, 3.5 for code
  const charsPerToken = 4.0 - codeRatio * 0.5;

  return Math.ceil(text.length / charsPerToken);
}

/**
 * Legacy word-based estimation (for backward compatibility).
 *
 * @deprecated Use estimateTokensCharBased for better accuracy
 */
export function estimateTokensWordBased(text: string): number {
  if (!text) return 0;
  const words = text.trim().split(/\s+/).filter(Boolean);
  return Math.ceil(words.length * 1.3);
}

// ─── Token Budget Allocation ───

/**
 * Token budget allocation for different prompt sections.
 * Total should fit within model context window with safety margin.
 */
export interface TokenBudgetAllocation {
  /** Base system prompt / playbook */
  systemPrompt: number;
  /** Active skills injected into prompt */
  skills: number;
  /** Previous phase context */
  context: number;
  /** User task description */
  userMessage: number;
  /** Reserved for model response */
  outputReserve: number;
}

/**
 * Calculates total budget from allocation.
 */
export function totalBudget(allocation: TokenBudgetAllocation): number {
  return (
    allocation.systemPrompt +
    allocation.skills +
    allocation.context +
    allocation.userMessage +
    allocation.outputReserve
  );
}

/**
 * Budget profiles for different project scales.
 * Optimized for Claude 3.5 Sonnet (200k context).
 */
export const BUDGET_PROFILES: Record<ProjectScale, TokenBudgetAllocation> = {
  // QUICK: Fast tasks, minimal context
  0: {
    systemPrompt: 2000,
    skills: 1000,
    context: 500,
    userMessage: 500,
    outputReserve: 2000,
  },
  // SMALL: Standard tasks, moderate context
  1: {
    systemPrompt: 3000,
    skills: 2000,
    context: 1500,
    userMessage: 1000,
    outputReserve: 4000,
  },
  // MEDIUM: Complex tasks, substantial context
  2: {
    systemPrompt: 4000,
    skills: 4000,
    context: 4000,
    userMessage: 2000,
    outputReserve: 8000,
  },
  // LARGE: Enterprise tasks, maximum context
  3: {
    systemPrompt: 5000,
    skills: 6000,
    context: 8000,
    userMessage: 3000,
    outputReserve: 16000,
  },
};

/**
 * Gets budget allocation for a project scale.
 */
export function getBudgetForScale(scale: ProjectScale): TokenBudgetAllocation {
  return BUDGET_PROFILES[scale];
}

/**
 * Creates a custom budget allocation with validation.
 */
export function createCustomBudget(
  partial: Partial<TokenBudgetAllocation>,
  base: ProjectScale = 2, // MEDIUM as default
): TokenBudgetAllocation {
  const baseBudget = BUDGET_PROFILES[base];
  return {
    systemPrompt: partial.systemPrompt ?? baseBudget.systemPrompt,
    skills: partial.skills ?? baseBudget.skills,
    context: partial.context ?? baseBudget.context,
    userMessage: partial.userMessage ?? baseBudget.userMessage,
    outputReserve: partial.outputReserve ?? baseBudget.outputReserve,
  };
}

// ─── Token Tracking ───

/**
 * Tracks token usage during prompt construction.
 */
export interface TokenUsageTracker {
  /** Tokens used in system prompt */
  systemPrompt: number;
  /** Tokens used in skills */
  skills: number;
  /** Tokens used in context */
  context: number;
  /** Tokens used in user message */
  userMessage: number;
  /** Skills that were skipped due to budget */
  skippedSkills: string[];
  /** Context entries that were truncated */
  truncatedContext: string[];
}

/**
 * Creates a new token usage tracker.
 */
export function createUsageTracker(): TokenUsageTracker {
  return {
    systemPrompt: 0,
    skills: 0,
    context: 0,
    userMessage: 0,
    skippedSkills: [],
    truncatedContext: [],
  };
}

/**
 * Calculates remaining budget after current usage.
 */
export function remainingBudget(
  allocation: TokenBudgetAllocation,
  usage: TokenUsageTracker,
): TokenBudgetAllocation {
  return {
    systemPrompt: Math.max(0, allocation.systemPrompt - usage.systemPrompt),
    skills: Math.max(0, allocation.skills - usage.skills),
    context: Math.max(0, allocation.context - usage.context),
    userMessage: Math.max(0, allocation.userMessage - usage.userMessage),
    outputReserve: allocation.outputReserve, // Never consumed
  };
}

/**
 * Checks if budget is exceeded.
 */
export function isBudgetExceeded(
  allocation: TokenBudgetAllocation,
  usage: TokenUsageTracker,
): boolean {
  return (
    usage.systemPrompt > allocation.systemPrompt ||
    usage.skills > allocation.skills ||
    usage.context > allocation.context ||
    usage.userMessage > allocation.userMessage
  );
}

// ─── Content Truncation ───

/**
 * Truncates text to fit within token budget.
 * Tries to break at sentence boundaries.
 *
 * @param text - Text to truncate
 * @param maxTokens - Maximum tokens allowed
 * @param estimator - Token estimation function
 * @returns Truncated text with ellipsis if truncated
 */
export function truncateToTokenBudget(
  text: string,
  maxTokens: number,
  estimator: (text: string) => number = estimateTokensCharBased,
): string {
  if (!text) return "";

  const currentTokens = estimator(text);
  if (currentTokens <= maxTokens) return text;

  // Estimate chars needed (with 10% safety margin)
  const charsPerToken = text.length / currentTokens;
  const targetChars = Math.floor(maxTokens * charsPerToken * 0.9);

  if (targetChars <= 0) return "";

  // Try to break at sentence boundary
  const truncated = text.slice(0, targetChars);
  const lastPeriod = truncated.lastIndexOf(".");
  const lastNewline = truncated.lastIndexOf("\n");
  const breakPoint = Math.max(lastPeriod, lastNewline);

  if (breakPoint > targetChars * 0.6) {
    return truncated.slice(0, breakPoint + 1).trim() + "...";
  }

  return truncated.trim() + "...";
}

/**
 * Splits text into chunks that fit within token budget.
 *
 * @param text - Text to split
 * @param chunkTokens - Max tokens per chunk
 * @param estimator - Token estimation function
 * @returns Array of text chunks
 */
export function splitIntoChunks(
  text: string,
  chunkTokens: number,
  estimator: (text: string) => number = estimateTokensCharBased,
): string[] {
  if (!text) return [];

  const totalTokens = estimator(text);
  if (totalTokens <= chunkTokens) return [text];

  const chunks: string[] = [];
  const lines = text.split("\n");
  let currentChunk = "";

  for (const line of lines) {
    const testChunk = currentChunk ? `${currentChunk}\n${line}` : line;
    const testTokens = estimator(testChunk);

    if (testTokens <= chunkTokens) {
      currentChunk = testChunk;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk);
      }
      currentChunk = line;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
}

// ─── Skill Token Cache ───

/**
 * Cached token counts for skills.
 * Computed once, reused across sessions.
 */
export interface SkillTokenCache {
  slug: string;
  /** L1 summary tokens */
  l1Tokens: number;
  /** L2 full content tokens */
  l2Tokens: number;
  /** Per-reference file tokens */
  l3Tokens: Record<string, number>;
  /** When cache was computed */
  computedAt: string;
}

/**
 * Creates a skill token cache entry.
 */
export function createSkillTokenCache(
  slug: string,
  summary: string,
  content: string,
  references: Record<string, string> = {},
): SkillTokenCache {
  const l3Tokens: Record<string, number> = {};
  for (const [name, refContent] of Object.entries(references)) {
    l3Tokens[name] = estimateTokensCharBased(refContent);
  }

  return {
    slug,
    l1Tokens: estimateTokensCharBased(summary),
    l2Tokens: estimateTokensCharBased(content),
    l3Tokens,
    computedAt: new Date().toISOString(),
  };
}

// ─── Export Default Estimator ───

/**
 * Default token estimator for the system.
 * Uses character-based estimation for best accuracy.
 */
export const estimateTokens = estimateTokensCharBased;
