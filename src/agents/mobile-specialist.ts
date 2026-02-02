import type { AgentFactory, BuildPromptOptions } from "../core/types.js";
import { buildAgentPrompt } from "./build-prompt.js";

export const mobileSpecialistFactory: AgentFactory = {
  slug: "mobile-specialist",
  description:
    "Mobile engineer. Use when building mobile apps with React Native, Flutter, or native platforms.",
  phases: ["E", "V"],
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
