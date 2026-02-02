import { describe, it, expect, vi, beforeEach } from "vitest";
import { resolve } from "node:path";

// Mock runAgent to avoid actual SDK calls
vi.mock("../../src/core/agent-runner.js", () => ({
  runAgent: vi.fn().mockResolvedValue("Agent result"),
}));

import { runAgent } from "../../src/core/agent-runner.js";
import { runCommand } from "../../src/commands/run.js";

const PROJECT_DIR = resolve(import.meta.dirname, "..", "..");
const mockedRunAgent = vi.mocked(runAgent);

const mockExit = vi.spyOn(process, "exit").mockImplementation((() => {
  throw new Error("process.exit called");
}) as never);

beforeEach(() => {
  vi.clearAllMocks();
  mockedRunAgent.mockResolvedValue("Agent result");
});

describe("runCommand", () => {
  it("should call runAgent with specified agent", async () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    await runCommand("Build auth", {
      agent: "architect",
      cwd: PROJECT_DIR,
    });

    expect(mockedRunAgent).toHaveBeenCalledOnce();
    const callArgs = mockedRunAgent.mock.calls[0]![0];
    expect(callArgs.task).toBe("Build auth");
    expect(callArgs.agent).toBe("architect");
    consoleSpy.mockRestore();
  });

  it("should auto-select agent when not specified", async () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    await runCommand("Fix the login bug", { cwd: PROJECT_DIR });

    expect(mockedRunAgent).toHaveBeenCalledOnce();
    // auto-select should choose bug-fixer for "fix" keyword
    const callArgs = mockedRunAgent.mock.calls[0]![0];
    expect(callArgs.agent).toBeDefined();
    consoleSpy.mockRestore();
  });

  it("should exit with code 1 when agent is not found", async () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      runCommand("test", { agent: "nonexistent-agent-xyz", cwd: PROJECT_DIR }),
    ).rejects.toThrow("process.exit called");

    expect(mockExit).toHaveBeenCalledWith(1);
    consoleSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it("should parse skills from comma-separated string", async () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    await runCommand("test", {
      agent: "architect",
      skills: "brainstorming,code-review",
      cwd: PROJECT_DIR,
    });

    const callArgs = mockedRunAgent.mock.calls[0]![0];
    expect(callArgs.skills).toEqual(["brainstorming", "code-review"]);
    consoleSpy.mockRestore();
  });
});
