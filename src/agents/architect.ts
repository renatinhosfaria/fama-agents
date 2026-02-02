import type { AgentFactory, BuildPromptOptions } from "../core/types.js";
import { buildAgentPrompt } from "./build-prompt.js";

export const architectFactory: AgentFactory = {
  slug: "architect",
  description:
    "Software architect. Use when designing system architecture and breaking down features.",
  phases: ["P", "R"],
  defaultSkills: ["brainstorming", "feature-breakdown"],
  tools: ["Read", "Grep", "Glob"],
  model: "inherit",

  build(opts: BuildPromptOptions) {
    return {
      description: this.description,
      prompt: buildAgentPrompt(opts),
      tools: this.tools,
      model: this.model === "inherit" ? undefined : this.model,
    };
  },
};