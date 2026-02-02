import type { AgentFactory, BuildPromptOptions } from "../core/types.js";
import { buildAgentPrompt } from "./build-prompt.js";

export const frontendSpecialistFactory: AgentFactory = {
  slug: "frontend-specialist",
  description:
    "Frontend engineer. Use when building UI components, pages, and client-side interactions.",
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
