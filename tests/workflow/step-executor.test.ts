import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { resolve } from "node:path";
import { mkdirSync, rmSync, existsSync, writeFileSync } from "node:fs";
import { stringify as yamlStringify } from "yaml";
import { loadStepState } from "../../src/workflow/step-executor.js";

const BASE_TEST_DIR = resolve(
  import.meta.dirname,
  "..",
  "fixtures",
  "step-executor-test",
);
let TEST_DIR: string;
let testCounter = 0;

describe("step-executor", () => {
  beforeEach(() => {
    testCounter++;
    TEST_DIR = resolve(BASE_TEST_DIR, `run-${testCounter}-${Date.now()}`);
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true, force: true });
  });

  describe("loadStepState", () => {
    it("deve retornar null quando não existe state file", () => {
      const state = loadStepState(TEST_DIR);
      expect(state).toBeNull();
    });

    it("deve carregar state file válido", () => {
      const stateDir = resolve(TEST_DIR, ".fama", "workflow");
      mkdirSync(stateDir, { recursive: true });
      const stateData = {
        workflowName: "test-workflow",
        currentStep: 2,
        completedSteps: [1],
        results: { 1: "Step 1 result" },
        startedAt: "2026-01-01T00:00:00Z",
      };
      writeFileSync(
        resolve(stateDir, "steps-state.yaml"),
        yamlStringify(stateData),
        "utf-8",
      );

      const state = loadStepState(TEST_DIR);
      expect(state).toBeDefined();
      expect(state?.workflowName).toBe("test-workflow");
      expect(state?.currentStep).toBe(2);
      expect(state?.completedSteps).toEqual([1]);
      expect(state?.results[1]).toBe("Step 1 result");
    });

    it("deve retornar null para state file inválido", () => {
      const stateDir = resolve(TEST_DIR, ".fama", "workflow");
      mkdirSync(stateDir, { recursive: true });
      writeFileSync(
        resolve(stateDir, "steps-state.yaml"),
        "invalid: {{{",
        "utf-8",
      );

      const state = loadStepState(TEST_DIR);
      expect(state).toBeNull();
    });
  });
});
