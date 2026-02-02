import type { AgentFactory, BuildPromptOptions } from "../core/types.js";
import { buildAgentPrompt } from "./build-prompt.js";

export const testWriterFactory: AgentFactory = {
  slug: "test-writer",
  description:
    "Test writing specialist. Use when creating comprehensive test suites.",
  phases: ["E", "V"],
  defaultSkills: ["test-driven-development"],
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