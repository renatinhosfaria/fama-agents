import type { GateContext, GateCheckResult } from "./types.js";

/**
 * Gate: Require phase to be completed (approval) before advancing.
 */
export function requireApprovalGate(context: GateContext): GateCheckResult {
  const status = context.state.phases[context.fromPhase];
  if (status.status !== "completed") {
    return {
      passed: false,
      reason: `Phase "${context.fromPhase}" must be completed before advancing to "${context.toPhase}".`,
      hints: [`Mark phase as complete with \`fama workflow complete\``],
    };
  }

  return { passed: true };
}
