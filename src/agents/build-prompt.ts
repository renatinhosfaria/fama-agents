import type { AgentMemory, BuildPromptOptions, PersonaConfig } from "../core/types.js";
import { rankSkillsByRelevance, selectSkillsWithinBudget } from "../core/skill-ranking.js";

function buildPersonaSection(persona: PersonaConfig): string {
  const lines: string[] = ["## Persona\n"];

  if (persona.displayName || persona.icon) {
    const label = [persona.icon, persona.displayName].filter(Boolean).join(" ");
    lines.push(`**${label}**\n`);
  }
  if (persona.role) {
    lines.push(`**Role:** ${persona.role}\n`);
  }
  if (persona.identity) {
    lines.push(`**Identity:** ${persona.identity}\n`);
  }
  if (persona.communicationStyle) {
    lines.push(`**Communication Style:** ${persona.communicationStyle}\n`);
  }
  if (persona.principles && persona.principles.length > 0) {
    lines.push("**Principles:**");
    for (const p of persona.principles) {
      lines.push(`- ${p}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

function buildMemorySection(memory: AgentMemory): string {
  const lines: string[] = ["## 🧠 Agent Memory\n"];

  const prefKeys = Object.keys(memory.preferences);
  if (prefKeys.length > 0) {
    lines.push("**Preferences:**");
    for (const key of prefKeys) {
      lines.push(`- ${key}: ${JSON.stringify(memory.preferences[key])}`);
    }
    lines.push("");
  }

  if (memory.entries.length > 0) {
    const recent = memory.entries.slice(-10);
    lines.push("**Recent Entries:**");
    for (const entry of recent) {
      const ctx = entry.context ? ` (${entry.context})` : "";
      lines.push(`- [${entry.timestamp}] ${entry.key}: ${JSON.stringify(entry.value)}${ctx}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

function buildCriticalActionsSection(actions: string[]): string {
  const lines: string[] = ["## ⚠️ CRITICAL ACTIONS\n"];
  for (const action of actions) {
    lines.push(`- **${action}**`);
  }
  lines.push("");
  return lines.join("\n");
}

/**
 * Prepares skills for injection, optionally ranking by relevance to task.
 */
function prepareSkillsForInjection(opts: BuildPromptOptions): {
  contents: string[];
  skippedCount: number;
} {
  // If we have skills with metadata and a task, use relevance ranking
  if (opts.skillsForRanking && opts.skillsForRanking.length > 0 && opts.task) {
    const ranked = rankSkillsByRelevance(opts.task, opts.skillsForRanking);

    // Apply token budget if specified
    if (opts.skillTokenBudget !== undefined) {
      const { selected, skippedCount } = selectSkillsWithinBudget(ranked, opts.skillTokenBudget);
      return { contents: selected.map((s) => s.content), skippedCount };
    }

    return { contents: ranked.map((s) => s.content), skippedCount: 0 };
  }

  // Legacy path: use skillContents directly (no ranking)
  if (opts.skillTokenBudget !== undefined) {
    const contents: string[] = [];
    let tokenCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < opts.skillContents.length; i++) {
      const content = opts.skillContents[i];
      const words = content.trim().split(/\s+/).filter(Boolean);
      const estimatedTokens = Math.ceil(words.length * 1.3);

      if (tokenCount + estimatedTokens > opts.skillTokenBudget) {
        skippedCount = opts.skillContents.length - i;
        break;
      }

      tokenCount += estimatedTokens;
      contents.push(content);
    }

    return { contents, skippedCount };
  }

  return { contents: opts.skillContents, skippedCount: 0 };
}

/**
 * Shared prompt builder for agent factories.
 * Composes: Persona → Critical Actions → Memory → Stack → Playbook → Skills
 *
 * When task and skillsForRanking are provided, skills are ranked by
 * relevance to the task using TF-IDF cosine similarity.
 */
export function buildAgentPrompt(opts: BuildPromptOptions): string {
  const parts: string[] = [];

  if (opts.persona && Object.keys(opts.persona).length > 0) {
    parts.push(buildPersonaSection(opts.persona));
  }

  if (opts.criticalActions && opts.criticalActions.length > 0) {
    parts.push(buildCriticalActionsSection(opts.criticalActions));
  }

  if (
    opts.memory &&
    (Object.keys(opts.memory.preferences).length > 0 || opts.memory.entries.length > 0)
  ) {
    parts.push(buildMemorySection(opts.memory));
  }

  if (opts.stackContext) {
    parts.push(opts.stackContext);
  }

  if (opts.codebaseContext) {
    parts.push(opts.codebaseContext);
  }

  parts.push(opts.playbookContent);

  // Inject skills with relevance ranking and optional token budget
  const { contents, skippedCount } = prepareSkillsForInjection(opts);

  for (let i = 0; i < contents.length; i++) {
    parts.push(`\n---\n## Active Skill ${i + 1}\n${contents[i]}`);
  }

  if (skippedCount > 0) {
    parts.push(`\n<!-- ${skippedCount} skill(s) omitted due to token budget -->`);
  }

  return parts.join("\n");
}
