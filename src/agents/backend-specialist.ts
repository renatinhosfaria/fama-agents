import type { AgentFactory, BuildPromptOptions } from "../core/types.js";
import { buildAgentPrompt } from "./build-prompt.js";

export const backendSpecialistFactory: AgentFactory = {
  slug: "backend-specialist",
  description:
    "Backend engineer. Use when building APIs, services, database integrations, and server-side logic.",
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
