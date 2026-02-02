import {
  ProjectScale,
  type WorkflowPhase,
  type WorkflowState,
  type HistoryEntry,
  type PhaseStatus,
} from "../core/types.js";
import { PHASE_DEFINITIONS } from "./phases.js";
import { getPhasesForScale } from "./scaling.js";
import { checkGate } from "./gates.js";
import { loadWorkflowState, saveWorkflowState } from "./status.js";

/**
 * Workflow orchestrator: manages phase transitions, agent recommendations, and state.
 */
export class WorkflowOrchestrator {
  private projectDir: string;

  constructor(projectDir: string) {
    this.projectDir = projectDir;
  }

  /** Initialize a new workflow. */
  init(name: string, scale: ProjectScale): WorkflowState {
    const activePhases = getPhasesForScale(scale);
    const firstPhase = activePhases[0]!;

    const phases = {} as Record<WorkflowPhase, PhaseStatus>;
    const allPhases: WorkflowPhase[] = ["P", "R", "E", "V", "C"];

    for (const phase of allPhases) {
      if (activePhases.includes(phase)) {
        phases[phase] = {
          status: phase === firstPhase ? "in_progress" : "pending",
          ...(phase === firstPhase ? { startedAt: new Date().toISOString() } : {}),
        };
      } else {
        phases[phase] = { status: "skipped" };
      }
    }

    const state: WorkflowState = {
      name,
      scale,
      currentPhase: firstPhase,
      phases,
      history: [
        {
          timestamp: new Date().toISOString(),
          phase: firstPhase,
          action: "started",
        },
      ],
      startedAt: new Date().toISOString(),
    };

    saveWorkflowState(this.projectDir, state);
    return state;
  }

  /** Get current workflow state. */
  getState(): WorkflowState | null {
    return loadWorkflowState(this.projectDir);
  }

  /** Advance to the next phase. Returns the new phase or null if complete. */
  advance(): { phase: WorkflowPhase; state: WorkflowState } | null {
    const state = this.getState();
    if (!state) return null;

    const activePhases = getPhasesForScale(state.scale);
    const currentIndex = activePhases.indexOf(state.currentPhase);

    if (currentIndex === -1 || currentIndex >= activePhases.length - 1) {
      // Complete current phase and mark workflow as done
      state.phases[state.currentPhase] = {
        ...state.phases[state.currentPhase],
        status: "completed",
        completedAt: new Date().toISOString(),
      };
      state.history.push({
        timestamp: new Date().toISOString(),
        phase: state.currentPhase,
        action: "completed",
      });
      saveWorkflowState(this.projectDir, state);
      return null;
    }

    const nextPhase = activePhases[currentIndex + 1]!;

    // Check gate
    const gate = checkGate(state, state.currentPhase, nextPhase);
    if (!gate.passed) {
      throw new Error(`Gate check failed: ${gate.reason}`);
    }

    // Complete current, start next
    state.phases[state.currentPhase] = {
      ...state.phases[state.currentPhase],
      status: "completed",
      completedAt: new Date().toISOString(),
    };
    state.phases[nextPhase] = {
      status: "in_progress",
      startedAt: new Date().toISOString(),
    };
    state.currentPhase = nextPhase;

    const now = new Date().toISOString();
    state.history.push(
      { timestamp: now, phase: activePhases[currentIndex]!, action: "completed" },
      { timestamp: now, phase: nextPhase, action: "started" },
    );

    saveWorkflowState(this.projectDir, state);
    return { phase: nextPhase, state };
  }

  /** Complete the current phase without advancing. */
  completeCurrentPhase(): WorkflowState | null {
    const state = this.getState();
    if (!state) return null;

    state.phases[state.currentPhase] = {
      ...state.phases[state.currentPhase],
      status: "completed",
      completedAt: new Date().toISOString(),
    };
    state.history.push({
      timestamp: new Date().toISOString(),
      phase: state.currentPhase,
      action: "completed",
    });

    saveWorkflowState(this.projectDir, state);
    return state;
  }

  /** Get recommended agents for the current phase. */
  getRecommendedAgents(): string[] {
    const state = this.getState();
    if (!state) return [];
    const phaseDef = PHASE_DEFINITIONS[state.currentPhase];
    return phaseDef?.agents ?? [];
  }

  /** Get recommended skills for the current phase. */
  getRecommendedSkills(): string[] {
    const state = this.getState();
    if (!state) return [];
    const phaseDef = PHASE_DEFINITIONS[state.currentPhase];
    return phaseDef?.skills ?? [];
  }

  /** Check if the workflow is complete (all active phases done). */
  isComplete(): boolean {
    const state = this.getState();
    if (!state) return false;
    const activePhases = getPhasesForScale(state.scale);
    return activePhases.every(
      (p) =>
        state.phases[p].status === "completed" ||
        state.phases[p].status === "skipped",
    );
  }
}
