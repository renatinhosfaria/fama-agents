import type { AgentFactory, BuildPromptOptions } from "../core/types.js";
import { buildAgentPrompt } from "./build-prompt.js";

export const securityAuditorFactory: AgentFactory = {
  slug: "security-auditor",
  description:
    "Security audit specialist. Use when reviewing code for vulnerabilities and security issues.",
  phases: ["R", "V"],
  defaultSkills: ["security-audit"],
  tools: ["Read", "Grep", "Glob"],
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