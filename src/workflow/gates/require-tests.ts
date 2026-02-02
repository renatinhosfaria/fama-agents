import { existsSync } from "node:fs";
import { resolve } from "node:path";
import type { GateContext, GateCheckResult } from "./types.js";

/**
 * Gate: Require a test runner config to exist (proxy for "tests should pass").
 * This is a lightweight check — actual test execution is left to the user.
 */
export function requireTestsGate(
  context: GateContext,
  config?: Record<string, unknown>,
): GateCheckResult {
  const checkFiles = (config?.checkFiles as string[]) ?? [
    "vitest.config.ts",
    "vitest.config.js",
    "jest.config.ts",
    "jest.config.js",
    "jest.config.mjs",
    "package.json",
  ];

  const hasTestConfig = checkFiles.some((f) =>
    existsSync(resolve(context.projectDir, f)),
  );

  if (!hasTestConfig) {
    return {
      passed: false,
      reason: "No test configuration found. Tests must be configured before validation.",
      hints: [
        "Add a test framework (vitest, jest, etc.)",
        "Ensure tests pass before advancing to validation",
      ],
    };
  }

  // Check if execution phase is complete
  const eStatus = context.state.phases.E;
  if (eStatus.status !== "completed") {
    return {
      passed: false,
      reason: "Execution phase must be completed before validation.",
      hints: ["Complete all implementation tasks first"],
    };
  }

  return { passed: true };
}
