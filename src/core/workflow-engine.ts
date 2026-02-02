import {
  ProjectScale,
  type WorkflowPhase,
  type WorkflowState,
  type WorkflowGatesConfig,
} from "./types.js";
import { WorkflowOrchestrator } from "../workflow/orchestrator.js";
import { PHASE_DEFINITIONS } from "../workflow/phases.js";
import { getPhasesForScale, scaleLabel } from "../workflow/scaling.js";
import { hasWorkflow } from "../workflow/status.js";

/**
 * High-level workflow engine that provides the public API for workflow management.
 */
export class WorkflowEngine {
  private orchestrator: WorkflowOrchestrator;
  private projectDir: string;

  constructor(projectDir: string, options?: { gates?: WorkflowGatesConfig }) {
    this.projectDir = projectDir;
    this.orchestrator = new WorkflowOrchestrator(projectDir, options?.gates);
  }

  /** Check if a workflow exists. */
  exists(): boolean {
    return hasWorkflow(this.projectDir);
  }

  /** Initialize a new workflow. */
  init(name: string, scale: ProjectScale): WorkflowState {
    return this.orchestrator.init(name, scale);
  }

  /** Get current state. */
  getStatus(): WorkflowState | null {
    return this.orchestrator.getState();
  }

  /** Advance to next phase. */
  advance() {
    return this.orchestrator.advance();
  }

  /** Complete current phase. */
  completeCurrent(): WorkflowState | null {
    return this.orchestrator.completeCurrentPhase();
  }

  /** Append an output reference to a phase. */
  appendOutput(phase: WorkflowPhase, output: string): WorkflowState | null {
    return this.orchestrator.appendOutput(phase, output);
  }

  /** Get recommended agents. */
  getRecommendedAgents(): string[] {
    return this.orchestrator.getRecommendedAgents();
  }

  /** Get recommended skills. */
  getRecommendedSkills(): string[] {
    return this.orchestrator.getRecommendedSkills();
  }

  /** Check completion. */
  isComplete(): boolean {
    return this.orchestrator.isComplete();
  }

  /** Get a human-readable status summary. */
  getSummary(): string {
    const state = this.getStatus();
    if (!state) return "No active workflow.";

    const activePhases = getPhasesForScale(state.scale);
    const lines: string[] = [
      `Workflow: ${state.name}`,
      `Scale: ${scaleLabel(state.scale)}`,
      `Current Phase: ${state.currentPhase} (${PHASE_DEFINITIONS[state.currentPhase].name})`,
      `Started: ${state.startedAt}`,
      "",
      "Phases:",
    ];

    for (const phase of activePhases) {
      const status = state.phases[phase];
      const def = PHASE_DEFINITIONS[phase];
      const icon =
        status.status === "completed"
          ? "✓"
          : status.status === "in_progress"
            ? "→"
            : status.status === "skipped"
              ? "⊘"
              : "○";
      lines.push(`  ${icon} ${phase} (${def.name}): ${status.status}`);
    }

    return lines.join("\n");
  }
}
