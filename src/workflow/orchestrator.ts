import {
  ProjectScale,
  type WorkflowPhase,
  type WorkflowState,
  type PhaseStatus,
  type WorkflowGatesConfig,
} from "../core/types.js";
import { GateCheckError, WorkflowStateError } from "../core/errors.js";
import { PHASE_DEFINITIONS } from "./phases.js";
import { getPhasesForScale } from "./scaling.js";
import { checkGate } from "./gates.js";
import { GateRegistry } from "./gate-registry.js";
import { loadWorkflowState, saveWorkflowState } from "./status.js";

/**
 * Workflow orchestrator: manages phase transitions, agent recommendations, and state.
 */
export class WorkflowOrchestrator {
  private projectDir: string;
  private gates?: WorkflowGatesConfig;
  private gateRegistry: GateRegistry;

  constructor(projectDir: string, gates?: WorkflowGatesConfig) {
    this.projectDir = projectDir;
    this.gates = gates;
    this.gateRegistry = new GateRegistry();
  }

  /** Initialize a new workflow. */
  init(name: string, scale: ProjectScale): WorkflowState {
    const activePhases = getPhasesForScale(scale);
    const firstPhase = activePhases[0];
    if (!firstPhase) {
      throw new WorkflowStateError(`No active phases for scale ${scale}`);
    }

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
  async advance(): Promise<{ phase: WorkflowPhase; state: WorkflowState } | null> {
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

    const nextPhase = activePhases[currentIndex + 1];
    if (!nextPhase) {
      return null;
    }

    // Check built-in gates
    const gate = checkGate(state, state.currentPhase, nextPhase, this.gates);
    if (!gate.passed) {
      throw new GateCheckError(gate.reason ?? "Unknown gate failure");
    }

    // Check dynamic gates (from config)
    if (this.gates?.gates && this.gates.gates.length > 0) {
      const dynamicResult = await this.gateRegistry.check(
        this.gates.gates,
        state,
        state.currentPhase,
        nextPhase,
        this.projectDir,
      );
      if (!dynamicResult.passed) {
        const hints = dynamicResult.hints?.length ? ` Hints: ${dynamicResult.hints.join("; ")}` : "";
        throw new GateCheckError((dynamicResult.reason ?? "Dynamic gate check failed") + hints);
      }
    }

    // Complete current (if not already completed), start next
    const previousPhase = state.currentPhase;
    if (state.phases[previousPhase].status !== "completed") {
      state.phases[previousPhase] = {
        ...state.phases[previousPhase],
        status: "completed",
        completedAt: new Date().toISOString(),
      };
    }
    state.phases[nextPhase] = {
      status: "in_progress",
      startedAt: new Date().toISOString(),
    };
    state.currentPhase = nextPhase;

    const now = new Date().toISOString();
    state.history.push(
      { timestamp: now, phase: previousPhase, action: "completed" },
      { timestamp: now, phase: nextPhase, action: "started" },
    );

    saveWorkflowState(this.projectDir, state);
    return { phase: nextPhase, state };
  }

  /** Append an output reference to a phase. */
  appendOutput(phase: WorkflowPhase, output: string): WorkflowState | null {
    const state = this.getState();
    if (!state) return null;

    const current = state.phases[phase];
    const outputs = current.outputs ? [...current.outputs] : [];
    outputs.push(output);
    state.phases[phase] = { ...current, outputs };

    saveWorkflowState(this.projectDir, state);
    return state;
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
