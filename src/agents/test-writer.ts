import type { AgentDefinition } from "@anthropic-ai/claude-agent-sdk";
import type { AgentFactory } from "../core/types.js";

export const testWriterFactory: AgentFactory = {
  slug: "test-writer",
  phases: ["E", "V"],
  defaultSkills: ["test-driven-development"],
  tools: ["Read", "Grep", "Glob", "Edit", "Write", "Bash"],
  model: "sonnet",

  build(playbookContent: string, skillContents: string[]): AgentDefinition {
    const parts = [playbookContent];
    for (const skill of skillContents) {
      parts.push(`\n---\n## Active Skill\n${skill}`);
    }

    return {
      description:
        "Test writing specialist. Use when creating comprehensive test suites.",
      prompt: parts.join("\n"),
      tools: ["Read", "Grep", "Glob", "Edit", "Write", "Bash"],
      model: "sonnet",
    };
  },
};
