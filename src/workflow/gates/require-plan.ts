import { ProjectScale } from "../../core/types.js";
import type { GateContext, GateCheckResult } from "./types.js";

/**
 * Gate: Require a plan to exist before moving past Planning phase.
 * Only enforced for MEDIUM+ scale.
 */
export function requirePlanGate(
  context: GateContext,
  config?: Record<string, unknown>,
): GateCheckResult {
  const minScale = (config?.minScale as number) ?? ProjectScale.MEDIUM;

  if (context.fromPhase !== "P" || context.toPhase !== "R") {
    return { passed: true };
  }

  if (context.state.scale < minScale) {
    return { passed: true };
  }

  const pStatus = context.state.phases.P;
  if (pStatus.status !== "completed") {
    return {
      passed: false,
      reason: "Planning phase must be completed before Review.",
      hints: [
        "Create a plan using `fama plan <description>`",
        "Or mark planning as complete with `fama workflow complete`",
      ],
    };
  }

  return { passed: true };
}
