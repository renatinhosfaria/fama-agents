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
