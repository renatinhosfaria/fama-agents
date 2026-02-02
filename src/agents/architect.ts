import type { AgentDefinition } from "@anthropic-ai/claude-agent-sdk";
import type { AgentFactory } from "../core/types.js";

export const architectFactory: AgentFactory = {
  slug: "architect",
  phases: ["P", "R"],
  defaultSkills: ["brainstorming", "feature-breakdown"],
  tools: ["Read", "Grep", "Glob"],
  model: "sonnet",

  build(playbookContent: string, skillContents: string[]): AgentDefinition {
    const parts = [playbookContent];
    for (const skill of skillContents) {
      parts.push(`\n---\n## Active Skill\n${skill}`);
    }

    return {
      description:
        "Software architect. Use when designing system architecture and breaking down features.",
      prompt: parts.join("\n"),
      tools: ["Read", "Grep", "Glob"],
      model: "sonnet",
    };
  },
};
