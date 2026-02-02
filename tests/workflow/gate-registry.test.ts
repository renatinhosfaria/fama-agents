import { describe, it, expect } from "vitest";
import { GateRegistry } from "../../src/workflow/gate-registry.js";
import { ProjectScale } from "../../src/core/types.js";
import type { WorkflowState, GateDefinition } from "../../src/core/types.js";

function makeState(overrides?: Partial<WorkflowState>): WorkflowState {
  return {
    name: "test",
    scale: ProjectScale.MEDIUM,
    currentPhase: "P",
    startedAt: new Date().toISOString(),
    phases: {
      P: { status: "pending" },
      R: { status: "pending" },
      E: { status: "pending" },
      V: { status: "pending" },
      C: { status: "pending" },
    },
    ...overrides,
  };
}

describe("GateRegistry", () => {
  it("deve ter 4 gates built-in registrados", () => {
    const registry = new GateRegistry();
    const types = registry.getTypes();
    expect(types).toContain("require_plan");
    expect(types).toContain("require_approval");
    expect(types).toContain("require_tests");
    expect(types).toContain("require_security_audit");
  });

  it("deve permitir registro de gate customizado", () => {
    const registry = new GateRegistry();
    registry.register("custom_gate", () => ({ passed: true }));
    expect(registry.getTypes()).toContain("custom_gate");
  });

  it("deve avaliar gate require_plan P->R quando incompleto", async () => {
    const registry = new GateRegistry();
    const gates: GateDefinition[] = [
      { type: "require_plan", phases: ["P->R"] },
    ];
    const state = makeState();
    const result = await registry.check(gates, state, "P", "R", "/tmp");
    expect(result.passed).toBe(false);
    expect(result.reason).toContain("Planning phase");
    expect(result.hints).toBeDefined();
    expect(result.hints!.length).toBeGreaterThan(0);
  });

  it("deve passar gate require_plan P->R quando completo", async () => {
    const registry = new GateRegistry();
    const gates: GateDefinition[] = [
      { type: "require_plan", phases: ["P->R"] },
    ];
    const state = makeState({
      phases: {
        P: { status: "completed" },
        R: { status: "pending" },
        E: { status: "pending" },
        V: { status: "pending" },
        C: { status: "pending" },
      },
    });
    const result = await registry.check(gates, state, "P", "R", "/tmp");
    expect(result.passed).toBe(true);
  });

  it("deve ignorar gate que não se aplica à transição", async () => {
    const registry = new GateRegistry();
    const gates: GateDefinition[] = [
      { type: "require_plan", phases: ["P->R"] },
    ];
    const state = makeState();
    // Transição E->V não é coberta pelo gate
    const result = await registry.check(gates, state, "E", "V", "/tmp");
    expect(result.passed).toBe(true);
  });

  it("deve falhar em gate type desconhecido", async () => {
    const registry = new GateRegistry();
    const gates: GateDefinition[] = [
      { type: "unknown_gate", phases: ["P->R"] },
    ];
    const state = makeState();
    const result = await registry.check(gates, state, "P", "R", "/tmp");
    expect(result.passed).toBe(false);
    expect(result.reason).toContain("Unknown gate type");
  });

  it("deve combinar múltiplos gates na mesma transição", async () => {
    const registry = new GateRegistry();
    const gates: GateDefinition[] = [
      { type: "require_plan", phases: ["P->R"] },
      { type: "require_approval", phases: ["P->R"] },
    ];
    const state = makeState();
    const results = await registry.evaluate(gates, state, "P", "R", "/tmp");
    expect(results.length).toBe(2);
    expect(results.every((r) => !r.passed)).toBe(true);
  });

  it("deve passar require_plan para scale QUICK", async () => {
    const registry = new GateRegistry();
    const gates: GateDefinition[] = [
      { type: "require_plan", phases: ["P->R"] },
    ];
    const state = makeState({ scale: ProjectScale.QUICK });
    const result = await registry.check(gates, state, "P", "R", "/tmp");
    expect(result.passed).toBe(true);
  });
});
