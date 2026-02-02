import type { AgentDefinition } from "@anthropic-ai/claude-agent-sdk";
import type { AgentFactory } from "../core/types.js";

export const featureDeveloperFactory: AgentFactory = {
  slug: "feature-developer",
  phases: ["E"],
  defaultSkills: ["test-driven-development", "verification"],
  tools: ["Read", "Grep", "Glob", "Edit", "Write", "Bash"],
  model: "sonnet",

  build(playbookContent: string, skillContents: string[]): AgentDefinition {
    const parts = [playbookContent];
    for (const skill of skillContents) {
      parts.push(`\n---\n## Active Skill\n${skill}`);
    }

    return {
      description:
        "Expert feature developer. Use when implementing new features with TDD discipline.",
      prompt: parts.join("\n"),
      tools: ["Read", "Grep", "Glob", "Edit", "Write", "Bash"],
      model: "sonnet",
    };
  },
};
