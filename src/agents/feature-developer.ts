import type { AgentFactory, BuildPromptOptions } from "../core/types.js";
import { buildAgentPrompt } from "./build-prompt.js";

export const featureDeveloperFactory: AgentFactory = {
  slug: "feature-developer",
  description:
    "Expert feature developer. Use when implementing new features with TDD discipline.",
  phases: ["E"],
  defaultSkills: ["test-driven-development", "verification"],
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