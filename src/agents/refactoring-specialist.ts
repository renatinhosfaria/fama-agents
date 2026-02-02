import type { AgentFactory, BuildPromptOptions } from "../core/types.js";
import { buildAgentPrompt } from "./build-prompt.js";

export const refactoringSpecialistFactory: AgentFactory = {
  slug: "refactoring-specialist",
  description:
    "Code refactoring specialist. Use when improving code structure without changing behavior.",
  phases: ["E"],
  defaultSkills: ["refactoring", "verification"],
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