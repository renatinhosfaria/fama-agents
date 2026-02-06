/**
 * Parallel Agent Executor
 *
 * Executes multiple agents in parallel for workflow phases that support it.
 * Primary use case: Validation phase with test-writer, code-reviewer, and security-auditor.
 */

import type { AgentRegistry } from "./agent-registry.js";
import type { SkillRegistry } from "./skill-registry.js";
import type { ProviderConfig, ProjectScale } from "./types.js";
import { runAgent } from "./agent-runner.js";
import { log } from "../utils/logger.js";

/** Task definition for parallel execution */
export interface ParallelAgentTask {
  agent: string;
  task: string;
  skills?: string[];
}

/** Result from a single agent execution */
export interface ParallelExecutionResult {
  agent: string;
  status: "success" | "error";
  result?: string;
  error?: string;
  durationMs: number;
  costUSD?: number;
}

/** Options for parallel execution */
export interface ParallelExecutionOptions {
  model?: string;
  maxTurns?: number;
  cwd: string;
  verbose?: boolean;
  scale?: ProjectScale;
  skillTokenBudget?: number;
  context?: string;
  structured?: boolean;
  phaseOverride?: "P" | "R" | "E" | "V" | "C";
}

/** Aggregated results from parallel execution */
export interface ParallelExecutionSummary {
  results: ParallelExecutionResult[];
  totalDurationMs: number;
  totalCostUSD: number;
  successCount: number;
  errorCount: number;
}

/**
 * Executes multiple agents in parallel using Promise.allSettled.
 *
 * This is resilient to individual agent failures - if one agent fails,
 * others will still complete and return their results.
 *
 * @param tasks - Array of agent tasks to execute
 * @param agentRegistry - Registry for agent definitions
 * @param skillRegistry - Registry for skill content
 * @param options - Execution options
 * @param providerConfig - Optional provider configuration
 * @returns Summary with all results
 */
export async function executeAgentsInParallel(
  tasks: ParallelAgentTask[],
  agentRegistry: AgentRegistry,
  skillRegistry: SkillRegistry,
  options: ParallelExecutionOptions,
  providerConfig?: ProviderConfig,
): Promise<ParallelExecutionSummary> {
  const startTime = Date.now();

  if (options.verbose) {
    log.info(`Starting parallel execution of ${tasks.length} agents...`);
    log.dim(`Agents: ${tasks.map((t) => t.agent).join(", ")}`);
  }

  // Execute all agents in parallel
  const promises = tasks.map(async (task): Promise<ParallelExecutionResult> => {
    const agentStartTime = Date.now();
    let costUSD: number | undefined;

    try {
      const result = await runAgent(
        {
          task: task.task,
          agent: task.agent,
          skills: task.skills,
          model: options.model,
          maxTurns: options.maxTurns,
          cwd: options.cwd,
          verbose: false, // Suppress individual output in parallel mode
          scale: options.scale,
          skillTokenBudget: options.skillTokenBudget,
          context: options.context,
          structured: options.structured,
          phaseOverride: options.phaseOverride,
          onEvent: (event) => {
            if (event.metrics.costUSD !== undefined) {
              costUSD = event.metrics.costUSD;
            }
          },
        },
        agentRegistry,
        skillRegistry,
        providerConfig,
      );

      return {
        agent: task.agent,
        status: "success",
        result,
        durationMs: Date.now() - agentStartTime,
        costUSD,
      };
    } catch (err) {
      return {
        agent: task.agent,
        status: "error",
        error: err instanceof Error ? err.message : String(err),
        durationMs: Date.now() - agentStartTime,
        costUSD,
      };
    }
  });

  // Wait for all to complete (settled, not rejected)
  const settledResults = await Promise.allSettled(promises);

  // Extract results, handling both fulfilled and rejected promises
  const results: ParallelExecutionResult[] = settledResults.map((settled, index) => {
    if (settled.status === "fulfilled") {
      return settled.value;
    }

    // Promise itself was rejected (shouldn't happen with try/catch, but safety first)
    return {
      agent: tasks[index].agent,
      status: "error" as const,
      error: settled.reason instanceof Error ? settled.reason.message : String(settled.reason),
      durationMs: 0,
    };
  });

  // Aggregate results
  const totalDurationMs = Date.now() - startTime;
  const totalCostUSD = results.reduce((sum, r) => sum + (r.costUSD ?? 0), 0);
  const successCount = results.filter((r) => r.status === "success").length;
  const errorCount = results.filter((r) => r.status === "error").length;

  if (options.verbose) {
    log.info(`Parallel execution complete in ${totalDurationMs}ms`);
    log.dim(`Results: ${successCount} succeeded, ${errorCount} failed`);
    log.dim(`Total cost: $${totalCostUSD.toFixed(4)}`);

    for (const result of results) {
      if (result.status === "success") {
        log.success(`  ✓ ${result.agent} (${result.durationMs}ms)`);
      } else {
        log.error(`  ✗ ${result.agent}: ${result.error}`);
      }
    }
  }

  return {
    results,
    totalDurationMs,
    totalCostUSD,
    successCount,
    errorCount,
  };
}

/**
 * Creates tasks for the Validation phase based on phase configuration.
 *
 * @param baseTask - The validation task description
 * @param parallelAgents - Agents to run in parallel (from phase config)
 * @param skillOverrides - Optional skill overrides per agent
 */
export function createValidationTasks(
  baseTask: string,
  parallelAgents: string[],
  skillOverrides?: Record<string, string[]>,
): ParallelAgentTask[] {
  return parallelAgents.map((agent) => ({
    agent,
    task: `[${agent.toUpperCase()}] ${baseTask}`,
    skills: skillOverrides?.[agent],
  }));
}

// ─── Phase-Based Parallel Execution ───

/** Configuration for parallel execution by phase */
export interface PhaseParallelConfig {
  /** Phase identifier */
  phase: "P" | "R" | "E" | "V" | "C";
  /** Agents to run in parallel */
  agents: string[];
  /** Barrier strategy: wait for all, any, or quorum */
  barrier: "all" | "any" | "quorum";
  /** Number of agents required for quorum (only if barrier = "quorum") */
  quorumCount?: number;
  /** Timeout in milliseconds per agent */
  timeoutMs?: number;
  /** Whether phase supports parallel execution */
  parallelEnabled: boolean;
}

/** Default parallel configurations by phase */
export const DEFAULT_PHASE_PARALLEL_CONFIG: Record<string, PhaseParallelConfig> = {
  P: {
    phase: "P",
    agents: ["architect"],
    barrier: "all",
    parallelEnabled: false, // Planning is usually sequential
  },
  R: {
    phase: "R",
    agents: ["security-auditor", "code-reviewer", "architect"],
    barrier: "all",
    parallelEnabled: true, // Review can run multiple reviewers in parallel
  },
  E: {
    phase: "E",
    agents: ["feature-developer"],
    barrier: "all",
    parallelEnabled: false, // Execution is usually sequential
  },
  V: {
    phase: "V",
    agents: ["test-writer", "code-reviewer", "security-auditor", "performance-optimizer"],
    barrier: "all",
    parallelEnabled: true, // Validation runs all validators in parallel
  },
  C: {
    phase: "C",
    agents: ["documentation-writer", "devops-specialist"],
    barrier: "all",
    parallelEnabled: false, // Confirmation is usually sequential
  },
};

/**
 * Gets the parallel configuration for a phase.
 */
export function getPhaseParallelConfig(
  phase: "P" | "R" | "E" | "V" | "C",
  customConfig?: Partial<PhaseParallelConfig>,
): PhaseParallelConfig {
  const defaultConfig = DEFAULT_PHASE_PARALLEL_CONFIG[phase];
  if (!customConfig) return defaultConfig;

  return {
    ...defaultConfig,
    ...customConfig,
    phase, // Ensure phase is not overridden
  };
}

/**
 * Checks if a phase supports parallel execution.
 */
export function isPhaseParallelizable(phase: "P" | "R" | "E" | "V" | "C"): boolean {
  return DEFAULT_PHASE_PARALLEL_CONFIG[phase]?.parallelEnabled ?? false;
}

/**
 * Creates tasks for any phase based on configuration.
 */
export function createPhaseTasks(
  baseTask: string,
  config: PhaseParallelConfig,
  skillOverrides?: Record<string, string[]>,
): ParallelAgentTask[] {
  return config.agents.map((agent) => ({
    agent,
    task: `[${config.phase}:${agent.toUpperCase()}] ${baseTask}`,
    skills: skillOverrides?.[agent],
  }));
}

/**
 * Creates tasks for the Review (R) phase.
 */
export function createReviewTasks(
  baseTask: string,
  customAgents?: string[],
  skillOverrides?: Record<string, string[]>,
): ParallelAgentTask[] {
  const config = getPhaseParallelConfig("R");
  const agents = customAgents ?? config.agents;

  return agents.map((agent) => ({
    agent,
    task: `[REVIEW:${agent.toUpperCase()}] ${baseTask}`,
    skills: skillOverrides?.[agent],
  }));
}

/** Execution plan with multiple stages */
export interface ParallelExecutionPlan {
  /** Unique identifier for the plan */
  id: string;
  /** Plan name */
  name: string;
  /** Ordered stages to execute */
  stages: ExecutionStage[];
}

/** A single stage in the execution plan */
export interface ExecutionStage {
  /** Stage identifier */
  stageId: string;
  /** Agent tasks to run in this stage */
  tasks: ParallelAgentTask[];
  /** Barrier strategy for this stage */
  barrier: "all" | "any" | "quorum";
  /** Quorum count if barrier is "quorum" */
  quorumCount?: number;
  /** Stage timeout in milliseconds */
  timeoutMs: number;
  /** Dependencies (stage IDs that must complete first) */
  dependsOn: string[];
}

/** Result from executing a stage */
export interface StageExecutionResult {
  stageId: string;
  results: ParallelExecutionResult[];
  status: "completed" | "partial" | "failed";
  durationMs: number;
}

/**
 * Executes a multi-stage parallel plan.
 *
 * Stages are executed in order, respecting dependencies.
 * Within each stage, agents run in parallel.
 */
export async function executeParallelPlan(
  plan: ParallelExecutionPlan,
  agentRegistry: AgentRegistry,
  skillRegistry: SkillRegistry,
  options: ParallelExecutionOptions,
  providerConfig?: ProviderConfig,
): Promise<Map<string, StageExecutionResult>> {
  const results = new Map<string, StageExecutionResult>();
  const completedStages = new Set<string>();

  if (options.verbose) {
    log.info(`Executing plan: ${plan.name} (${plan.stages.length} stages)`);
  }

  for (const stage of plan.stages) {
    // Check dependencies
    for (const dep of stage.dependsOn) {
      if (!completedStages.has(dep)) {
        throw new Error(`Stage ${stage.stageId} depends on ${dep} which hasn't completed`);
      }
    }

    if (options.verbose) {
      log.info(`Starting stage: ${stage.stageId} (${stage.tasks.length} agents)`);
    }

    const stageStartTime = Date.now();

    // Execute stage
    const summary = await executeAgentsInParallel(
      stage.tasks,
      agentRegistry,
      skillRegistry,
      { ...options, verbose: false },
      providerConfig,
    );

    // Determine stage status based on barrier
    let status: "completed" | "partial" | "failed" = "completed";

    switch (stage.barrier) {
      case "all":
        if (summary.errorCount > 0) {
          status = summary.successCount > 0 ? "partial" : "failed";
        }
        break;
      case "any":
        status = summary.successCount > 0 ? "completed" : "failed";
        break;
      case "quorum": {
        const quorum = stage.quorumCount ?? Math.ceil(stage.tasks.length / 2);
        status = summary.successCount >= quorum ? "completed" : "partial";
        break;
      }
    }

    const stageResult: StageExecutionResult = {
      stageId: stage.stageId,
      results: summary.results,
      status,
      durationMs: Date.now() - stageStartTime,
    };

    results.set(stage.stageId, stageResult);
    completedStages.add(stage.stageId);

    if (options.verbose) {
      log.info(`Stage ${stage.stageId} ${status} in ${stageResult.durationMs}ms`);
    }
  }

  return results;
}

/**
 * Creates a simple two-stage plan for Review + Validation.
 */
export function createReviewValidationPlan(
  baseTask: string,
  reviewAgents?: string[],
  validationAgents?: string[],
): ParallelExecutionPlan {
  const reviewConfig = getPhaseParallelConfig("R");
  const validationConfig = getPhaseParallelConfig("V");

  return {
    id: `rv-${Date.now()}`,
    name: "Review and Validation",
    stages: [
      {
        stageId: "review",
        tasks: createReviewTasks(baseTask, reviewAgents),
        barrier: reviewConfig.barrier,
        timeoutMs: 300000, // 5 minutes
        dependsOn: [],
      },
      {
        stageId: "validation",
        tasks: createValidationTasks(baseTask, validationAgents ?? validationConfig.agents),
        barrier: validationConfig.barrier,
        timeoutMs: 300000, // 5 minutes
        dependsOn: ["review"],
      },
    ],
  };
}

/**
 * Formats parallel execution results for display or logging.
 */
export function formatParallelResults(summary: ParallelExecutionSummary): string {
  const lines: string[] = [
    "## Parallel Execution Results\n",
    `Total Duration: ${summary.totalDurationMs}ms`,
    `Total Cost: $${summary.totalCostUSD.toFixed(4)}`,
    `Success: ${summary.successCount}/${summary.results.length}`,
    "",
  ];

  for (const result of summary.results) {
    const status = result.status === "success" ? "✓" : "✗";
    lines.push(`### ${status} ${result.agent}`);
    lines.push(`Duration: ${result.durationMs}ms`);

    if (result.costUSD !== undefined) {
      lines.push(`Cost: $${result.costUSD.toFixed(4)}`);
    }

    if (result.status === "success" && result.result) {
      // Truncate long results
      const summary = result.result.length > 500 ? result.result.slice(0, 500) + "..." : result.result;
      lines.push(`\n${summary}`);
    } else if (result.status === "error") {
      lines.push(`Error: ${result.error}`);
    }

    lines.push("");
  }

  return lines.join("\n");
}
