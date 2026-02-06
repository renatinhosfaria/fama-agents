// Public API exports for fama-agents
export { runAgent } from "./core/agent-runner.js";
export {
  createProvider,
  resolveProvider,
  resolveProviderWithFallback,
  parseModelString,
} from "./core/llm-provider.js";
export { ClaudeProvider } from "./core/providers/claude-provider.js";
export { OpenAIProvider } from "./core/providers/openai-provider.js";
export { OpenRouterProvider } from "./core/providers/openrouter-provider.js";
export { SkillRegistry } from "./core/skill-registry.js";
export { AgentRegistry } from "./core/agent-registry.js";
export { WorkflowEngine } from "./core/workflow-engine.js";
export { detectScale, autoSelectAgent, detectScaleWithConfidence } from "./core/scale-detector.js";
export { getModelForScale } from "./core/llm-provider.js";
export { rankSkillsByRelevance, selectSkillsWithinBudget } from "./core/skill-ranking.js";
export { LRUCache } from "./utils/lru-cache.js";
export {
  CircuitBreaker,
  CircuitState,
  getCircuitBreaker,
  getAllCircuitBreakers,
  resetAllCircuitBreakers,
  clearCircuitBreakerRegistry,
} from "./core/circuit-breaker.js";
export {
  executeAgentsInParallel,
  createValidationTasks,
  formatParallelResults,
  // Phase-based parallel execution
  getPhaseParallelConfig,
  isPhaseParallelizable,
  createPhaseTasks,
  createReviewTasks,
  executeParallelPlan,
  createReviewValidationPlan,
  DEFAULT_PHASE_PARALLEL_CONFIG,
} from "./core/parallel-executor.js";
export {
  loadPhaseContext,
  formatPhaseContextForPrompt,
  getPlanningOutput,
  extractSummary,
  extractArtifacts,
} from "./workflow/context-loader.js";
// Context Manifold
export {
  createEmptyManifold,
  loadManifold,
  loadManifoldWithDetails,
  saveManifold,
  saveManifoldWithDetails,
  addOutputToManifold,
  selectContextForPhase,
  formatManifoldContext,
  updateStackInfo,
  updateCodebaseSummary,
  addConstraint,
  resolveIssue,
  getUnresolvedIssues,
  getAllDecisions,
  getArtifact,
  getFileArtifacts,
  convertLegacyOutput,
  computeHash,
  ManifoldError,
  MANIFOLD_VERSION,
  MANIFOLD_FILENAME,
} from "./core/context-manifold.js";
export {
  assessValidationQuality,
  formatQualityScore,
  shouldLoopBack,
} from "./workflow/quality-gate.js";
export { StackDetector } from "./services/stack/stack-detector.js";
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
  ProviderError,
  ProviderNotFoundError,
} from "./core/errors.js";
export {
  FamaConfigSchema,
  WorkflowStateSchema,
  ProviderConfigSchema,
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
  GateDefinitionSchema,
} from "./core/schemas.js";
export { discoverSkillSummaries, loadSkillReferences } from "./core/skill-loader.js";
export { StructuredLogger, LogLevel } from "./utils/structured-logger.js";
export { startSpan, endSpan } from "./utils/observability.js";
export type { Span } from "./utils/observability.js";

export type {
  RunAgentOptions,
  RunAgentEvent,
  RunAgentMetrics,
  FamaConfig,
  ParsedSkill,
  SkillSummary,
  SkillReference,
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
  LLMProvider,
  LLMQueryOptions,
  LLMStreamEvent,
  ProviderConfig,
  GateDefinition,
  ModelRoutingConfig,
  SkillForRanking,
} from "./core/types.js";
export type { RankedSkill, SkillForRanking as SkillInput } from "./core/skill-ranking.js";
export type { LRUCacheOptions } from "./utils/lru-cache.js";
export type { CircuitBreakerOptions } from "./core/circuit-breaker.js";
export type {
  ParallelAgentTask,
  ParallelExecutionResult,
  ParallelExecutionOptions,
  ParallelExecutionSummary,
  // Phase-based parallel execution types
  PhaseParallelConfig,
  ParallelExecutionPlan,
  ExecutionStage,
  StageExecutionResult,
} from "./core/parallel-executor.js";
export type {
  PhaseContext,
  PhaseOutputSummary,
} from "./workflow/context-loader.js";
// Context Manifold types
export type {
  ContextManifold,
  PhaseManifoldEntry,
  ManifoldDecision,
  ManifoldIssue,
  ArtifactEntry,
  StackInfo,
  CodebaseSummary,
  GlobalContext,
  SelectedContext,
  ManifoldErrorCode,
  LoadManifoldResult,
  SaveManifoldResult,
} from "./core/context-manifold.js";
export type {
  ScaleSignal,
  ScaleDetectionResult,
  ScaleDetectionOptions,
} from "./core/scale-detector.js";
export type {
  QualityScore,
  QualityFactor,
  QualityConfig,
} from "./workflow/quality-gate.js";
export { loadStepfileWorkflow, discoverWorkflows } from "./workflow/workflow-loader.js";
export { executeStep, executeWorkflow, loadStepState } from "./workflow/step-executor.js";
export { loadMemory, saveMemory, appendEntry, clearMemory } from "./core/agent-memory.js";
export { ModuleRegistry } from "./core/module-registry.js";
export { loadModule, installModule, uninstallModule } from "./core/module-loader.js";
export { selectAgents, synthesize } from "./core/party-orchestrator.js";
export { t, initI18n, resetI18n, getLocale, getSupportedLocales } from "./utils/i18n/index.js";
export { GateRegistry } from "./workflow/gate-registry.js";
export { getPackageRoot } from "./utils/package-root.js";
export { CodebaseAnalyzer } from "./services/semantic/codebase-analyzer.js";
export {
  scaffoldDocs,
  getScaffoldStatus,
  getUnfilledDocs,
  getTemplates,
  getTemplateNames,
} from "./services/scaffold/scaffold-service.js";
export {
  generateExport,
  generateExports,
  writeExportFiles,
  runExport,
  getPresetNames,
  getAllPresets,
} from "./services/export/export-service.js";
export type { TranslationKey, TranslationKeys, Locale, TranslateFn } from "./utils/i18n/types.js";
export type {
  ExportContext,
  ExportFile,
  ExportResult,
  ExportPreset,
} from "./services/export/types.js";

// ─── LLM-First Architecture ───

// Structured Output Protocol
export {
  CURRENT_SCHEMA_VERSION,
  createSuccessOutput,
  createErrorOutput,
  addArtifact,
  addDecision,
  addIssue,
  parseStructuredOutput,
  parseStructuredOutputWithDetails,
  isStructuredOutput,
  serializeCompact,
  serializeReadable,
} from "./core/output-protocol.js";

export type {
  StructuredAgentOutput,
  OutputMeta,
  ResultPayload,
  ResultStatus,
  Artifact,
  ArtifactType,
  Decision,
  Reversibility,
  Issue,
  IssueSeverity,
  HandoffInfo,
  ParseResult,
} from "./core/output-protocol.js";

// Token Estimation
export {
  estimateTokens,
  estimateTokensCharBased,
  estimateTokensWordBased,
  detectCodeRatio,
  getBudgetForScale,
  createCustomBudget,
  totalBudget,
  createUsageTracker,
  remainingBudget,
  isBudgetExceeded,
  truncateToTokenBudget,
  splitIntoChunks,
  createSkillTokenCache,
  BUDGET_PROFILES,
} from "./core/token-estimator.js";

export type {
  TokenBudgetAllocation,
  TokenUsageTracker,
  SkillTokenCache,
} from "./core/token-estimator.js";

// Compact Prompt Format
export {
  buildCompactPrompt,
  convertMarkdownToCompact,
  convertSkillToCompiled,
  estimateTokenSavings,
} from "./core/compact-prompt.js";

export type {
  CompactPromptSection,
  CompactSkillSection,
  CompactContextSection,
  CompactPromptOptions,
} from "./core/compact-prompt.js";

// Output Schemas
export {
  OUTPUT_SCHEMA_REGISTRY,
  getOutputSchema,
  validateAgentOutput,
  ArchitectOutputSchema,
  validateArchitectOutput,
  CodeReviewOutputSchema,
  validateCodeReviewOutput,
  isBlocking,
  getCriticalIssues,
  countBySeverity,
  SecurityAuditOutputSchema,
  validateSecurityAuditOutput,
  hasCriticalVulnerabilities,
  getImmediateActions,
  calculateRiskScore,
  TestWriterOutputSchema,
  validateTestWriterOutput,
  isCoverageThresholdMet,
  getCriticalGaps,
  countByTestType,
  getLineCoverage,
} from "./schemas/outputs/index.js";

export type {
  ArchitectOutput,
  ArchitectContent,
  Component,
  ComponentType,
  Interface,
  DataFlow,
  TradeOff,
  CodeReviewOutput,
  CodeReviewContent,
  ReviewIssue,
  IssueCategory,
  Suggestion,
  FileSummary,
  ReviewVerdict,
  SecurityAuditOutput,
  SecurityAuditContent,
  Vulnerability,
  VulnerabilityCategory,
  DependencyVulnerability,
  SecurityRecommendation,
  Cvss,
  TestWriterOutput,
  TestWriterContent,
  TestCase,
  TestSuite,
  TestType,
  CoverageReport,
  CoverageMetrics,
  FileCoverage,
  TestGap,
} from "./schemas/outputs/index.js";
