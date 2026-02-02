import type { AgentFactory, BuildPromptOptions } from "../core/types.js";
import { buildAgentPrompt } from "./build-prompt.js";

export const codeReviewerFactory: AgentFactory = {
  slug: "code-reviewer",
  description:
    "Expert code reviewer for quality, security, and maintainability reviews. Use when code needs review against plan and standards.",
  phases: ["R", "V"],
  defaultSkills: ["code-review", "verification"],
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
