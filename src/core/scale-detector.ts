import { ProjectScale } from "./types.js";

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

/**
 * Detects project scale from task description using keyword analysis.
 * Supports PT-BR keywords.
 */
export function detectScale(
  description: string,
  fileCount?: number,
): ProjectScale {
  const lower = description.toLowerCase();

  // Check for explicit scale hints
  if (lower.includes("--scale quick") || lower.includes("--scale rapido"))
    return ProjectScale.QUICK;
  if (lower.includes("--scale small") || lower.includes("--scale pequeno"))
    return ProjectScale.SMALL;
  if (lower.includes("--scale medium") || lower.includes("--scale medio"))
    return ProjectScale.MEDIUM;
  if (lower.includes("--scale large") || lower.includes("--scale grande"))
    return ProjectScale.LARGE;

  // Keyword-based detection
  if (QUICK_KEYWORDS.some((k) => lower.includes(k))) return ProjectScale.QUICK;
  if (LARGE_KEYWORDS.some((k) => lower.includes(k))) return ProjectScale.LARGE;
  if (SMALL_KEYWORDS.some((k) => lower.includes(k))) return ProjectScale.SMALL;

  // File count heuristic
  if (fileCount !== undefined) {
    if (fileCount <= 1) return ProjectScale.QUICK;
    if (fileCount <= 3) return ProjectScale.SMALL;
    if (fileCount <= 8) return ProjectScale.MEDIUM;
    return ProjectScale.LARGE;
  }

  // Default: MEDIUM for ambiguous tasks
  return ProjectScale.MEDIUM;
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

  // Default: feature developer
  return "feature-developer";
}
