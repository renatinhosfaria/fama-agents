import type { AgentFactory, BuildPromptOptions } from "../core/types.js";
import { buildAgentPrompt } from "./build-prompt.js";

export const devopsSpecialistFactory: AgentFactory = {
  slug: "devops-specialist",
  description:
    "DevOps specialist. Use when setting up CI/CD, Docker, deployment, and infrastructure.",
  phases: ["C"],
  defaultSkills: ["verification"],
  tools: ["Read", "Grep", "Glob", "Edit", "Write", "Bash"],
  model: "sonnet",

  build(opts: BuildPromptOptions) {
    return {
      description: this.description,
      prompt: buildAgentPrompt(opts),
      tools: this.tools,
      model: this.model === "inherit" ? undefined : this.model,
    };
  },
};