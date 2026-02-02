import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { stringify as yamlStringify, parse as yamlParse } from "yaml";
import type {
  StepfileWorkflow,
  StepDefinition,
  StepExecutionState,
} from "../core/types.js";
import { AgentRegistry } from "../core/agent-registry.js";
import { SkillRegistry } from "../core/skill-registry.js";
import { runAgent } from "../core/agent-runner.js";
import { log } from "../utils/logger.js";

const STATE_FILE = ".fama/workflow/steps-state.yaml";

function getStatePath(cwd: string): string {
  return resolve(cwd, STATE_FILE);
}

export function loadStepState(cwd: string): StepExecutionState | null {
  const statePath = getStatePath(cwd);
  if (!existsSync(statePath)) return null;
  try {
    const raw = readFileSync(statePath, "utf-8");
    return yamlParse(raw) as StepExecutionState;
  } catch {
    return null;
  }
}

function saveStepState(cwd: string, state: StepExecutionState): void {
  const statePath = getStatePath(cwd);
  mkdirSync(dirname(statePath), { recursive: true });
  writeFileSync(statePath, yamlStringify(state), "utf-8");
}

function createInitialState(workflowName: string): StepExecutionState {
  return {
    workflowName,
    currentStep: 1,
    completedSteps: [],
    results: {},
    startedAt: new Date().toISOString(),
  };
}

export interface StepExecutorOptions {
  cwd: string;
  model?: string;
  maxTurns?: number;
  verbose?: boolean;
  skillsDir?: string;
}

/**
 * Executa um único step de um workflow.
 */
export async function executeStep(
  step: StepDefinition,
  context: string,
  opts: StepExecutorOptions,
): Promise<string | undefined> {
  const agentRegistry = new AgentRegistry(opts.cwd);
  const skillRegistry = new SkillRegistry(opts.cwd, opts.skillsDir ?? "./skills");

  const task = context
    ? `${step.prompt}\n\n--- CONTEXT FROM PREVIOUS STEP ---\n${context}`
    : step.prompt;

  return runAgent(
    {
      task,
      agent: step.agent,
      skills: step.skills ?? [],
      model: opts.model ?? "sonnet",
      maxTurns: opts.maxTurns ?? 50,
      verbose: opts.verbose ?? false,
      cwd: opts.cwd,
    },
    agentRegistry,
    skillRegistry,
  );
}

/**
 * Executa um workflow completo (sequencial, com resumibilidade).
 */
export async function executeWorkflow(
  workflow: StepfileWorkflow,
  opts: StepExecutorOptions,
): Promise<void> {
  let state = loadStepState(opts.cwd);

  if (state && state.workflowName === workflow.name) {
    const remaining = workflow.steps.length - state.completedSteps.length;
    log.info(`Resumindo workflow "${workflow.name}" — ${remaining} steps restantes`);
  } else {
    state = createInitialState(workflow.name);
    saveStepState(opts.cwd, state);
  }

  for (const step of workflow.steps) {
    if (state.completedSteps.includes(step.order)) {
      log.dim(`  ✓ Step ${step.order}: ${step.name} (já concluído)`);
      continue;
    }

    state.currentStep = step.order;
    saveStepState(opts.cwd, state);

    log.heading(`Step ${step.order}/${workflow.steps.length}: ${step.name}`);
    log.dim(`  Agente: ${step.agent}`);
    if (step.description) log.dim(`  ${step.description}`);

    const previousResult = state.results[step.order - 1] ?? "";

    try {
      const result = await executeStep(step, previousResult, opts);
      const resultText = result ?? "";

      state.results[step.order] = resultText;
      state.completedSteps.push(step.order);
      saveStepState(opts.cwd, state);

      log.success(`Step ${step.order} concluído.`);
      if (resultText) {
        console.log("\n" + resultText.slice(0, 500) + (resultText.length > 500 ? "\n..." : ""));
      }
    } catch (err) {
      saveStepState(opts.cwd, state);
      log.error(
        `Step ${step.order} falhou: ${err instanceof Error ? err.message : String(err)}`,
      );
      throw err;
    }
  }

  log.success(`Workflow "${workflow.name}" concluído — ${workflow.steps.length} steps executados.`);
}
