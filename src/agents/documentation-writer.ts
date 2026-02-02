import type { AgentFactory, BuildPromptOptions } from "../core/types.js";
import { buildAgentPrompt } from "./build-prompt.js";

export const documentationWriterFactory: AgentFactory = {
  slug: "documentation-writer",
  description:
    "Documentation writer. Use when creating or updating project documentation.",
  phases: ["C"],
  defaultSkills: ["verification"],
  tools: ["Read", "Grep", "Glob", "Edit", "Write"],
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