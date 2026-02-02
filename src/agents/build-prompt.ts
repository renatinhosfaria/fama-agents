import type { AgentMemory, BuildPromptOptions, PersonaConfig } from "../core/types.js";

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
 * Shared prompt builder for agent factories.
 * Composes: Persona → Critical Actions → Memory → Stack → Playbook → Skills
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

  for (let i = 0; i < opts.skillContents.length; i++) {
    parts.push(`\n---\n## Active Skill ${i + 1}\n${opts.skillContents[i]}`);
  }

  return parts.join("\n");
}
