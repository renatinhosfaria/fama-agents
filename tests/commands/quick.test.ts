import { describe, it, expect, vi, beforeEach } from "vitest";
import { resolve } from "node:path";

// Mock runAgent to avoid actual SDK calls
vi.mock("../../src/core/agent-runner.js", () => ({
  runAgent: vi.fn().mockResolvedValue("Quick result"),
}));

import { runAgent } from "../../src/core/agent-runner.js";
import { quickCommand } from "../../src/commands/quick.js";

const PROJECT_DIR = resolve(import.meta.dirname, "..", "..");
const mockedRunAgent = vi.mocked(runAgent);

const mockExit = vi.spyOn(process, "exit").mockImplementation((() => {
  throw new Error("process.exit called");
}) as never);

beforeEach(() => {
  vi.clearAllMocks();
  mockedRunAgent.mockResolvedValue("Quick result");
});

describe("quickCommand", () => {
  it("should auto-select agent and run for quick tasks", async () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    await quickCommand("fix typo in readme", { cwd: PROJECT_DIR });

    expect(mockedRunAgent).toHaveBeenCalledOnce();
    const callArgs = mockedRunAgent.mock.calls[0]![0];
    expect(callArgs.task).toBe("fix typo in readme");
    consoleSpy.mockRestore();
  });

  it("should use specified agent", async () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    await quickCommand("fix typo", { agent: "bug-fixer", cwd: PROJECT_DIR });

    const callArgs = mockedRunAgent.mock.calls[0]![0];
    expect(callArgs.agent).toBe("bug-fixer");
    consoleSpy.mockRestore();
  });

  it("should inject writing-plans skill for SMALL scale tasks", async () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    await quickCommand("add function to parse dates", { cwd: PROJECT_DIR });

    const callArgs = mockedRunAgent.mock.calls[0]![0];
    expect(callArgs.skills).toContain("writing-plans");
    consoleSpy.mockRestore();
  });

  it("should not inject extra skills for QUICK scale tasks", async () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    await quickCommand("fix typo in readme", { cwd: PROJECT_DIR });

    const callArgs = mockedRunAgent.mock.calls[0]![0];
    expect(callArgs.skills).toEqual([]);
    consoleSpy.mockRestore();
  });

  it("should still proceed for MEDIUM+ scale tasks", async () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    await quickCommand("redesign the full architecture system", { cwd: PROJECT_DIR });

    expect(mockedRunAgent).toHaveBeenCalledOnce();
    consoleSpy.mockRestore();
    warnSpy.mockRestore();
  });

  it("should exit with code 1 for nonexistent agent", async () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      quickCommand("test", { agent: "nonexistent-agent-xyz", cwd: PROJECT_DIR }),
    ).rejects.toThrow("process.exit called");

    expect(mockExit).toHaveBeenCalledWith(1);
    consoleSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });
});
