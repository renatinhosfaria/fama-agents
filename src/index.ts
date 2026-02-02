// Public API exports for fama-agents
export { runAgent } from "./core/agent-runner.js";
export { SkillRegistry } from "./core/skill-registry.js";
export { AgentRegistry } from "./core/agent-registry.js";
export { WorkflowEngine } from "./core/workflow-engine.js";
export { detectScale, autoSelectAgent } from "./core/scale-detector.js";
export { loadConfig } from "./utils/config.js";
export { createCli } from "./cli.js";
export { ProjectScale } from "./core/types.js";
export {
  FamaError,
  ApiKeyMissingError,
  AgentNotFoundError,
  SkillNotFoundError,
  AgentExecutionError,
  AgentBuildError,
  WorkflowStateError,
  GateCheckError,
  ConfigParseError,
} from "./core/errors.js";
export {
  FamaConfigSchema,
  WorkflowStateSchema,
  AgentFrontmatterSchema,
  SkillFrontmatterSchema,
  WorkflowPhaseSchema,
  AgentModelSchema,
  RunAgentOptionsSchema,
  PersonaConfigSchema,
  MenuEntrySchema,
  StepfileWorkflowConfigSchema,
  StepExecutionStateSchema,
  AgentMemorySchema,
  MemoryEntrySchema,
  TeamConfigSchema,
  ModuleManifestSchema,
} from "./core/schemas.js";
export { StructuredLogger, LogLevel } from "./utils/structured-logger.js";
export { startSpan, endSpan } from "./utils/observability.js";
export type { Span } from "./utils/observability.js";

export type {
  RunAgentOptions,
  RunAgentEvent,
  RunAgentMetrics,
  FamaConfig,
  ParsedSkill,
  AgentConfig,
  AgentFactory,
  BuildPromptOptions,
  PersonaConfig,
  MenuEntry,
  WorkflowGatesConfig,
  WorkflowPhase,
  WorkflowState,
  StepDefinition,
  StepfileWorkflow,
  StepExecutionState,
  AgentMemory,
  MemoryEntry,
  TeamConfig,
  ModuleManifest,
} from "./core/types.js";
export { loadStepfileWorkflow, discoverWorkflows } from "./workflow/workflow-loader.js";
export { executeStep, executeWorkflow, loadStepState } from "./workflow/step-executor.js";
export { loadMemory, saveMemory, appendEntry, clearMemory } from "./core/agent-memory.js";
export { ModuleRegistry } from "./core/module-registry.js";
export { loadModule, installModule, uninstallModule } from "./core/module-loader.js";
export { selectAgents, synthesize } from "./core/party-orchestrator.js";
