/**
 * TF-IDF-lite skill ranking without external dependencies.
 *
 * Ranks skills by semantic similarity to a task description using
 * term frequency and cosine similarity.
 */

export interface SkillForRanking {
  slug: string;
  name: string;
  description: string;
  content: string;
}

export interface RankedSkill {
  slug: string;
  content: string;
  score: number;
}

// Common stopwords to filter out
const STOPWORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "has",
  "he",
  "in",
  "is",
  "it",
  "its",
  "of",
  "on",
  "or",
  "that",
  "the",
  "to",
  "was",
  "were",
  "will",
  "with",
  "you",
  "your",
  // Portuguese stopwords
  "um",
  "uma",
  "e",
  "ou",
  "de",
  "da",
  "do",
  "para",
  "com",
  "no",
  "na",
  "em",
  "que",
  "se",
  "por",
  "ao",
  "os",
  "as",
  "mais",
  "quando",
  "use",
  "when",
]);

/**
 * Tokenizes text into lowercase alphanumeric words, filtering stopwords.
 */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOPWORDS.has(t));
}

/**
 * Computes normalized term frequency map.
 */
export function computeTf(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>();

  for (const token of tokens) {
    tf.set(token, (tf.get(token) ?? 0) + 1);
  }

  // Normalize by total tokens
  const total = tokens.length || 1;
  for (const [k, v] of tf) {
    tf.set(k, v / total);
  }

  return tf;
}

/**
 * Computes cosine similarity between two TF vectors.
 */
export function computeCosineSimilarity(
  a: Map<string, number>,
  b: Map<string, number>,
): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (const [k, v] of a) {
    normA += v * v;
    const bVal = b.get(k);
    if (bVal !== undefined) {
      dot += v * bVal;
    }
  }

  for (const [, v] of b) {
    normB += v * v;
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;

  return dot / denominator;
}

/**
 * Ranks skills by relevance to the task description.
 *
 * Uses TF-based cosine similarity between task and skill metadata.
 * Skills with higher scores are more relevant to the task.
 *
 * @param task - The task description to match against
 * @param skills - Array of skills with metadata and content
 * @returns Skills sorted by relevance score (descending)
 */
export function rankSkillsByRelevance(
  task: string,
  skills: SkillForRanking[],
): RankedSkill[] {
  if (!task || skills.length === 0) {
    // No task = return skills in original order with score 0
    return skills.map((s) => ({ slug: s.slug, content: s.content, score: 0 }));
  }

  const taskTokens = tokenize(task);
  if (taskTokens.length === 0) {
    return skills.map((s) => ({ slug: s.slug, content: s.content, score: 0 }));
  }

  const taskTf = computeTf(taskTokens);

  const ranked = skills.map((skill) => {
    // Combine name and description for matching (not full content - too noisy)
    const skillText = `${skill.name} ${skill.description}`;
    const skillTokens = tokenize(skillText);
    const skillTf = computeTf(skillTokens);

    const score = computeCosineSimilarity(taskTf, skillTf);

    return {
      slug: skill.slug,
      content: skill.content,
      score,
    };
  });

  // Sort by score descending, then by original order for ties
  return ranked.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    // Preserve original order for same scores
    const aIndex = skills.findIndex((s) => s.slug === a.slug);
    const bIndex = skills.findIndex((s) => s.slug === b.slug);
    return aIndex - bIndex;
  });
}

/**
 * Selects top N skills within a token budget.
 *
 * @param rankedSkills - Skills already ranked by relevance
 * @param tokenBudget - Maximum tokens to include
 * @param estimateTokens - Function to estimate tokens (default: words * 1.3)
 * @returns Selected skills and count of skipped skills
 */
export function selectSkillsWithinBudget(
  rankedSkills: RankedSkill[],
  tokenBudget: number,
  estimateTokens: (content: string) => number = defaultTokenEstimate,
): { selected: RankedSkill[]; skippedCount: number } {
  const selected: RankedSkill[] = [];
  let totalTokens = 0;
  let skippedCount = 0;

  for (const skill of rankedSkills) {
    const tokens = estimateTokens(skill.content);

    if (totalTokens + tokens <= tokenBudget) {
      selected.push(skill);
      totalTokens += tokens;
    } else {
      skippedCount++;
    }
  }

  return { selected, skippedCount };
}

/**
 * Default token estimation: words * 1.3
 */
function defaultTokenEstimate(content: string): number {
  const words = content.trim().split(/\s+/).filter(Boolean);
  return Math.ceil(words.length * 1.3);
}
