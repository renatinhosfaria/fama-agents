import type { AgentDefinition } from "@anthropic-ai/claude-agent-sdk";
import type { AgentFactory } from "../core/types.js";

export const devopsSpecialistFactory: AgentFactory = {
  slug: "devops-specialist",
  phases: ["C"],
  defaultSkills: ["verification"],
  tools: ["Read", "Grep", "Glob", "Edit", "Write", "Bash"],
  model: "sonnet",

  build(playbookContent: string, skillContents: string[]): AgentDefinition {
    const parts = [playbookContent];
    for (const skill of skillContents) {
      parts.push(`\n---\n## Active Skill\n${skill}`);
    }

    return {
      description:
        "DevOps specialist. Use when setting up CI/CD, Docker, deployment, and infrastructure.",
      prompt: parts.join("\n"),
      tools: ["Read", "Grep", "Glob", "Edit", "Write", "Bash"],
      model: "sonnet",
    };
  },
};
