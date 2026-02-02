import type { AgentDefinition } from "@anthropic-ai/claude-agent-sdk";
import type { AgentFactory } from "../core/types.js";

export const codeReviewerFactory: AgentFactory = {
  slug: "code-reviewer",
  phases: ["R", "V"],
  defaultSkills: ["code-review", "verification"],
  tools: ["Read", "Grep", "Glob"],
  model: "sonnet",

  build(playbookContent: string, skillContents: string[]): AgentDefinition {
    const parts = [playbookContent];
    for (const skill of skillContents) {
      parts.push(`\n---\n## Active Skill\n${skill}`);
    }

    return {
      description:
        "Expert code reviewer for quality, security, and maintainability reviews. Use when code needs review against plan and standards.",
      prompt: parts.join("\n"),
      tools: ["Read", "Grep", "Glob"],
      model: "sonnet",
    };
  },
};
