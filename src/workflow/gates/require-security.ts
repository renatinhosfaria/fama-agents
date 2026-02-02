import type { GateContext, GateCheckResult } from "./types.js";

/**
 * Gate: Require a security audit note before moving to Completion.
 * Checks that validation phase has outputs (indicating review was done).
 */
export function requireSecurityGate(
  context: GateContext,
  config?: Record<string, unknown>,
): GateCheckResult {
  const severity = (config?.severity as string) ?? "high";

  const vStatus = context.state.phases.V;

  if (vStatus.status !== "completed") {
    return {
      passed: false,
      reason: "Validation phase must be completed before Completion.",
      hints: [
        `Run a security audit with \`fama run "security review" --agent security-auditor\``,
        `Minimum severity level: ${severity}`,
      ],
    };
  }

  return { passed: true };
}
