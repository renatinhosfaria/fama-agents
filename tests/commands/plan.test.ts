import { describe, it, expect, vi, beforeEach } from "vitest";
import { resolve } from "node:path";

vi.mock("../../src/core/agent-runner.js", () => ({
  runAgent: vi.fn().mockResolvedValue("Plan result"),
}));

import { runAgent } from "../../src/core/agent-runner.js";
import { planCommand } from "../../src/commands/plan.js";

const PROJECT_DIR = resolve(import.meta.dirname, "..", "..");
const mockedRunAgent = vi.mocked(runAgent);

beforeEach(() => {
  vi.clearAllMocks();
  mockedRunAgent.mockResolvedValue("Plan result");
});

describe("planCommand", () => {
  it("should use architect agent when creating a plan", async () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    await planCommand("Add user authentication", { cwd: PROJECT_DIR });

    expect(mockedRunAgent).toHaveBeenCalledOnce();
    const callArgs = mockedRunAgent.mock.calls[0]![0];
    expect(callArgs.agent).toBe("architect");
    expect(callArgs.skills).toContain("brainstorming");
    expect(callArgs.skills).toContain("writing-plans");
    consoleSpy.mockRestore();
  });

  it("should use feature-developer when executing a plan", async () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    await planCommand("Execute plan", {
      execute: "docs/plans/auth-plan.md",
      cwd: PROJECT_DIR,
    });

    expect(mockedRunAgent).toHaveBeenCalledOnce();
    const callArgs = mockedRunAgent.mock.calls[0]![0];
    expect(callArgs.agent).toBe("feature-developer");
    expect(callArgs.skills).toContain("executing-plans");
    consoleSpy.mockRestore();
  });

  it("should exit on failure", async () => {
    const mockExit = vi.spyOn(process, "exit").mockImplementation((() => {
      throw new Error("process.exit called");
    }) as never);
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    mockedRunAgent.mockRejectedValue(new Error("SDK error"));

    await expect(
      planCommand("test", { cwd: PROJECT_DIR }),
    ).rejects.toThrow("process.exit called");

    expect(mockExit).toHaveBeenCalledWith(1);
    consoleSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    mockExit.mockRestore();
  });
});
