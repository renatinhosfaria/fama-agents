// Public API exports for fama-agents
export { runAgent } from "./core/agent-runner.js";
export { SkillRegistry } from "./core/skill-registry.js";
export { AgentRegistry } from "./core/agent-registry.js";
export { WorkflowEngine } from "./core/workflow-engine.js";
export { detectScale, autoSelectAgent } from "./core/scale-detector.js";
export { loadConfig } from "./utils/config.js";
export { createCli } from "./cli.js";

export type {
  RunAgentOptions,
  FamaConfig,
  ParsedSkill,
  AgentConfig,
  AgentFactory,
  WorkflowPhase,
  WorkflowState,
  ProjectScale,
} from "./core/types.js";
