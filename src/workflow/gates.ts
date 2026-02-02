import { ProjectScale, type GateResult, type WorkflowPhase, type WorkflowState } from "../core/types.js";

/**
 * Checks if a phase transition is allowed based on gate conditions.
 */
export function checkGate(
  state: WorkflowState,
  fromPhase: WorkflowPhase,
  toPhase: WorkflowPhase,
): GateResult {
  // P → R: Plan must exist for MEDIUM+
  if (fromPhase === "P" && toPhase === "R") {
    if (state.scale >= ProjectScale.MEDIUM) {
      const pStatus = state.phases.P;
      if (pStatus.status !== "completed") {
        return { passed: false, reason: "Planning phase must be completed before Review." };
      }
    }
  }

  // R → E: Architecture review for LARGE
  if (fromPhase === "R" && toPhase === "E") {
    if (state.scale >= ProjectScale.LARGE) {
      const rStatus = state.phases.R;
      if (rStatus.status !== "completed") {
        return { passed: false, reason: "Review phase must be completed before Execution." };
      }
    }
  }

  // E → V: All tasks must be marked complete
  if (fromPhase === "E" && toPhase === "V") {
    const eStatus = state.phases.E;
    if (eStatus.status !== "completed") {
      return { passed: false, reason: "Execution phase must be completed before Validation." };
    }
  }

  // V → C: Tests passing, review approved
  if (fromPhase === "V" && toPhase === "C") {
    const vStatus = state.phases.V;
    if (vStatus.status !== "completed") {
      return { passed: false, reason: "Validation phase must be completed before Confirmation." };
    }
  }

  return { passed: true };
}
