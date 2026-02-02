import { describe, it, expect } from "vitest";
import { checkGate } from "../../src/workflow/gates.js";
import { ProjectScale, type WorkflowState, type PhaseStatus } from "../../src/core/types.js";

function defaultPhases(): WorkflowState["phases"] {
  return {
    P: { status: "completed" },
    R: { status: "completed" },
    E: { status: "completed" },
    V: { status: "completed" },
    C: { status: "pending" },
  };
}

function makeState(
  overrides: Omit<Partial<WorkflowState>, "phases"> & {
    phases?: Partial<Record<string, PhaseStatus>>;
  } = {},
): WorkflowState {
  const { phases: phaseOverrides, ...rest } = overrides;
  return {
    name: "test",
    scale: ProjectScale.LARGE,
    currentPhase: "E",
    phases: { ...defaultPhases(), ...phaseOverrides },
    history: [],
    startedAt: new Date().toISOString(),
    ...rest,
  };
}

describe("checkGate", () => {
  it("should pass P→R when P is completed (MEDIUM+)", () => {
    const state = makeState({ scale: ProjectScale.MEDIUM });
    const result = checkGate(state, "P", "R");
    expect(result.passed).toBe(true);
  });

  it("should fail P→R when P is not completed (MEDIUM+)", () => {
    const state = makeState({
      scale: ProjectScale.MEDIUM,
      phases: { P: { status: "in_progress" } },
    });
    const result = checkGate(state, "P", "R");
    expect(result.passed).toBe(false);
    expect(result.reason).toContain("Planning");
  });

  it("should pass R→E when R is completed (LARGE)", () => {
    const state = makeState({ scale: ProjectScale.LARGE });
    const result = checkGate(state, "R", "E");
    expect(result.passed).toBe(true);
  });

  it("should fail R→E when R is not completed (LARGE)", () => {
    const state = makeState({
      scale: ProjectScale.LARGE,
      phases: { R: { status: "in_progress" } },
    });
    const result = checkGate(state, "R", "E");
    expect(result.passed).toBe(false);
    expect(result.reason).toContain("Review");
  });

  it("should pass E→V when E is completed", () => {
    const state = makeState();
    const result = checkGate(state, "E", "V");
    expect(result.passed).toBe(true);
  });

  it("should fail E→V when E is not completed", () => {
    const state = makeState({
      phases: { E: { status: "in_progress" } },
    });
    const result = checkGate(state, "E", "V");
    expect(result.passed).toBe(false);
    expect(result.reason).toContain("Execution");
  });

  it("should pass V→C when V is completed", () => {
    const state = makeState();
    const result = checkGate(state, "V", "C");
    expect(result.passed).toBe(true);
  });

  it("should fail V→C when V is not completed", () => {
    const state = makeState({
      phases: { V: { status: "in_progress" } },
    });
    const result = checkGate(state, "V", "C");
    expect(result.passed).toBe(false);
    expect(result.reason).toContain("Validation");
  });

  it("should bypass plan gate when requirePlan is false", () => {
    const state = makeState({
      scale: ProjectScale.MEDIUM,
      phases: { P: { status: "in_progress" } },
    });
    const result = checkGate(state, "P", "R", {
      requirePlan: false,
      requireApproval: false,
    });
    expect(result.passed).toBe(true);
  });

  it("should require approval before advancing when enabled", () => {
    const state = makeState({
      phases: { E: { status: "in_progress" } },
    });
    const result = checkGate(state, "E", "V", {
      requirePlan: false,
      requireApproval: true,
    });
    expect(result.passed).toBe(false);
    expect(result.reason).toContain("completed");
  });
});
