import type { AgentDefinition } from "@anthropic-ai/claude-agent-sdk";
import type { AgentFactory } from "../core/types.js";

export const bugFixerFactory: AgentFactory = {
  slug: "bug-fixer",
  phases: ["E"],
  defaultSkills: ["systematic-debugging", "test-driven-development"],
  tools: ["Read", "Grep", "Glob", "Edit", "Write", "Bash"],
  model: "sonnet",

  build(playbookContent: string, skillContents: string[]): AgentDefinition {
    const parts = [playbookContent];
    for (const skill of skillContents) {
      parts.push(`\n---\n## Active Skill\n${skill}`);
    }

    return {
      description:
        "Systematic bug fixer. Use when diagnosing and fixing bugs with root cause analysis.",
      prompt: parts.join("\n"),
      tools: ["Read", "Grep", "Glob", "Edit", "Write", "Bash"],
      model: "sonnet",
    };
  },
};
