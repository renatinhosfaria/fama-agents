import { describe, it, expect, vi, beforeEach, afterEach, afterAll } from "vitest";
import { resolve } from "node:path";
import { mkdirSync, rmSync, existsSync } from "node:fs";
import {
  workflowInitCommand,
  workflowStatusCommand,
  workflowAdvanceCommand,
  workflowCompleteCommand,
} from "../../src/commands/workflow.js";

// Mock runAgent for workflowRunCommand
vi.mock("../../src/core/agent-runner.js", () => ({
  runAgent: vi.fn().mockResolvedValue("Workflow run result"),
}));

const BASE_TEST_DIR = resolve(
  import.meta.dirname,
  "..",
  "fixtures",
  "workflow-cmd-test",
);
let TEST_DIR: string;
let testCounter = 0;

vi.spyOn(process, "exit").mockImplementation((() => {
  throw new Error("process.exit called");
}) as never);

describe("workflow commands", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    testCounter++;
    TEST_DIR = resolve(BASE_TEST_DIR, `run-${testCounter}-${Date.now()}`);
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true, force: true });
  });

  afterAll(() => {
    if (existsSync(BASE_TEST_DIR)) rmSync(BASE_TEST_DIR, { recursive: true, force: true });
  });

  describe("workflowInitCommand", () => {
    it("should initialize a workflow", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      workflowInitCommand("test-feature", { cwd: TEST_DIR, scale: "medium" });

      // Verify .fama/workflow/status.yaml was created
      expect(existsSync(resolve(TEST_DIR, ".fama", "workflow", "status.yaml"))).toBe(true);
      consoleSpy.mockRestore();
    });

    it("should warn if workflow already exists", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      workflowInitCommand("first", { cwd: TEST_DIR, scale: "small" });
      workflowInitCommand("second", { cwd: TEST_DIR, scale: "small" });

      // Second call should warn (not create a new one)
      const warnCalls = consoleSpy.mock.calls.filter((call) =>
        call.some((arg) => typeof arg === "string" && arg.includes("already exists")),
      );
      expect(warnCalls.length).toBeGreaterThan(0);
      consoleSpy.mockRestore();
    });
  });

  describe("workflowStatusCommand", () => {
    it("should warn when no workflow exists", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      workflowStatusCommand({ cwd: TEST_DIR });

      const warnCalls = consoleSpy.mock.calls.filter((call) =>
        call.some((arg) => typeof arg === "string" && arg.includes("No active workflow")),
      );
      expect(warnCalls.length).toBeGreaterThan(0);
      consoleSpy.mockRestore();
    });

    it("should show status when workflow exists", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      workflowInitCommand("test", { cwd: TEST_DIR, scale: "small" });
      vi.clearAllMocks();

      workflowStatusCommand({ cwd: TEST_DIR });
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe("workflowAdvanceCommand", () => {
    it("should advance to next phase", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      workflowInitCommand("test", { cwd: TEST_DIR, scale: "small" });

      workflowAdvanceCommand({ cwd: TEST_DIR });

      // Should have advanced from P to E
      const advanceCalls = consoleSpy.mock.calls.filter((call) =>
        call.some((arg) => typeof arg === "string" && arg.includes("Advanced")),
      );
      expect(advanceCalls.length).toBeGreaterThan(0);
      consoleSpy.mockRestore();
    });

    it("should warn when no workflow exists", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      workflowAdvanceCommand({ cwd: TEST_DIR });

      const warnCalls = consoleSpy.mock.calls.filter((call) =>
        call.some((arg) => typeof arg === "string" && arg.includes("No active workflow")),
      );
      expect(warnCalls.length).toBeGreaterThan(0);
      consoleSpy.mockRestore();
    });
  });

  describe("workflowCompleteCommand", () => {
    it("should mark current phase as completed", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      workflowInitCommand("test", { cwd: TEST_DIR, scale: "small" });

      workflowCompleteCommand({ cwd: TEST_DIR });

      const completeCalls = consoleSpy.mock.calls.filter((call) =>
        call.some((arg) => typeof arg === "string" && arg.includes("completed")),
      );
      expect(completeCalls.length).toBeGreaterThan(0);
      consoleSpy.mockRestore();
    });
  });
});
