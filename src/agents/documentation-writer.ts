import type { AgentDefinition } from "@anthropic-ai/claude-agent-sdk";
import type { AgentFactory } from "../core/types.js";

export const documentationWriterFactory: AgentFactory = {
  slug: "documentation-writer",
  phases: ["C"],
  defaultSkills: ["verification"],
  tools: ["Read", "Grep", "Glob", "Edit", "Write"],
  model: "sonnet",

  build(playbookContent: string, skillContents: string[]): AgentDefinition {
    const parts = [playbookContent];
    for (const skill of skillContents) {
      parts.push(`\n---\n## Active Skill\n${skill}`);
    }

    return {
      description:
        "Documentation writer. Use when creating or updating project documentation.",
      prompt: parts.join("\n"),
      tools: ["Read", "Grep", "Glob", "Edit", "Write"],
      model: "sonnet",
    };
  },
};
