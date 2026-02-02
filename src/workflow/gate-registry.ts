import type { WorkflowPhase, WorkflowState } from "../core/types.js";
import type {
  GateDefinition,
  GateCheckResult,
  GateContext,
  GateHandler,
} from "./gates/types.js";
import { requirePlanGate } from "./gates/require-plan.js";
import { requireApprovalGate } from "./gates/require-approval.js";
import { requireTestsGate } from "./gates/require-tests.js";
import { requireSecurityGate } from "./gates/require-security.js";

/**
 * Registry of gate handlers.
 * Built-in gates are registered by default; custom gates can be added.
 */
export class GateRegistry {
  private handlers = new Map<string, GateHandler>();

  constructor() {
    // Register built-in gates
    this.register("require_plan", requirePlanGate);
    this.register("require_approval", requireApprovalGate);
    this.register("require_tests", requireTestsGate);
    this.register("require_security_audit", requireSecurityGate);
  }

  /**
   * Register a gate handler by type name.
   */
  register(type: string, handler: GateHandler): void {
    this.handlers.set(type, handler);
  }

  /**
   * Get a registered handler.
   */
  getHandler(type: string): GateHandler | undefined {
    return this.handlers.get(type);
  }

  /**
   * List all registered gate types.
   */
  getTypes(): string[] {
    return [...this.handlers.keys()];
  }

  /**
   * Evaluate a list of gate definitions for a specific phase transition.
   * Returns all gate results (not just the first failure).
   */
  async evaluate(
    gates: GateDefinition[],
    state: WorkflowState,
    fromPhase: WorkflowPhase,
    toPhase: WorkflowPhase,
    projectDir: string,
  ): Promise<GateCheckResult[]> {
    const transition = `${fromPhase}->${toPhase}`;
    const context: GateContext = { state, fromPhase, toPhase, projectDir };

    const results: GateCheckResult[] = [];

    for (const gate of gates) {
      // Check if this gate applies to the current transition
      if (!gate.phases.includes(transition)) continue;

      const handler = this.handlers.get(gate.type);
      if (!handler) {
        results.push({
          passed: false,
          reason: `Unknown gate type "${gate.type}".`,
          hints: [`Available gate types: ${this.getTypes().join(", ")}`],
        });
        continue;
      }

      const result = await handler(context, gate.config);
      results.push(result);
    }

    return results;
  }

  /**
   * Convenience: evaluate and return a single combined result.
   */
  async check(
    gates: GateDefinition[],
    state: WorkflowState,
    fromPhase: WorkflowPhase,
    toPhase: WorkflowPhase,
    projectDir: string,
  ): Promise<GateCheckResult> {
    const results = await this.evaluate(gates, state, fromPhase, toPhase, projectDir);
    const failures = results.filter((r) => !r.passed);

    if (failures.length === 0) {
      return { passed: true };
    }

    return {
      passed: false,
      reason: failures.map((f) => f.reason).join("; "),
      hints: failures.flatMap((f) => f.hints ?? []),
    };
  }
}
