import type { WorkflowPhase, WorkflowState } from "../../core/types.js";

/**
 * A gate definition describes a configurable check for phase transitions.
 */
export interface GateDefinition {
  /** Unique gate type identifier */
  type: string;
  /** Which transitions this gate applies to (e.g. "E->V", "V->C") */
  phases: string[];
  /** Optional configuration for the gate */
  config?: Record<string, unknown>;
}

/**
 * Context provided to gate handlers during evaluation.
 */
export interface GateContext {
  state: WorkflowState;
  fromPhase: WorkflowPhase;
  toPhase: WorkflowPhase;
  projectDir: string;
}

/**
 * Result of evaluating a gate.
 */
export interface GateCheckResult {
  passed: boolean;
  reason?: string;
  hints?: string[];
}

/**
 * A gate handler evaluates whether a transition is allowed.
 */
export type GateHandler = (
  context: GateContext,
  config?: Record<string, unknown>,
) => GateCheckResult | Promise<GateCheckResult>;
