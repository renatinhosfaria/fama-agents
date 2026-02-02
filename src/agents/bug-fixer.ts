import type { AgentFactory, BuildPromptOptions } from "../core/types.js";
import { buildAgentPrompt } from "./build-prompt.js";

export const bugFixerFactory: AgentFactory = {
  slug: "bug-fixer",
  description:
    "Systematic bug fixer. Use when diagnosing and fixing bugs with root cause analysis.",
  phases: ["E"],
  defaultSkills: ["systematic-debugging", "test-driven-development"],
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