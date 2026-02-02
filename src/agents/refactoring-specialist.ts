import type { AgentDefinition } from "@anthropic-ai/claude-agent-sdk";
import type { AgentFactory } from "../core/types.js";

export const refactoringSpecialistFactory: AgentFactory = {
  slug: "refactoring-specialist",
  phases: ["E"],
  defaultSkills: ["refactoring", "verification"],
  tools: ["Read", "Grep", "Glob", "Edit", "Write", "Bash"],
  model: "sonnet",

  build(playbookContent: string, skillContents: string[]): AgentDefinition {
    const parts = [playbookContent];
    for (const skill of skillContents) {
      parts.push(`\n---\n## Active Skill\n${skill}`);
    }

    return {
      description:
        "Code refactoring specialist. Use when improving code structure without changing behavior.",
      prompt: parts.join("\n"),
      tools: ["Read", "Grep", "Glob", "Edit", "Write", "Bash"],
      model: "sonnet",
    };
  },
};
