import type { AgentFactory, BuildPromptOptions } from "../core/types.js";
import { buildAgentPrompt } from "./build-prompt.js";

export const performanceOptimizerFactory: AgentFactory = {
  slug: "performance-optimizer",
  description:
    "Performance optimization specialist. Use when profiling and optimizing code performance.",
  phases: ["V"],
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