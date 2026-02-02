import { describe, it, expect, vi, beforeEach } from "vitest";
import { resolve } from "node:path";

vi.mock("../../src/core/agent-runner.js", () => ({
  runAgent: vi.fn().mockResolvedValue("Debug result"),
}));

import { runAgent } from "../../src/core/agent-runner.js";
import { debugCommand } from "../../src/commands/debug.js";

const PROJECT_DIR = resolve(import.meta.dirname, "..", "..");
const mockedRunAgent = vi.mocked(runAgent);

beforeEach(() => {
  vi.clearAllMocks();
  mockedRunAgent.mockResolvedValue("Debug result");
});

describe("debugCommand", () => {
  it("should use bug-fixer agent", async () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    await debugCommand("Login fails with 500 error", { cwd: PROJECT_DIR });

    expect(mockedRunAgent).toHaveBeenCalledOnce();
    const callArgs = mockedRunAgent.mock.calls[0]![0];
    expect(callArgs.agent).toBe("bug-fixer");
    expect(callArgs.skills).toContain("systematic-debugging");
    expect(callArgs.skills).toContain("test-driven-development");
    consoleSpy.mockRestore();
  });

  it("should include description in task", async () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    await debugCommand("Memory leak in worker", { cwd: PROJECT_DIR });

    const callArgs = mockedRunAgent.mock.calls[0]![0];
    expect(callArgs.task).toContain("Memory leak in worker");
    consoleSpy.mockRestore();
  });
});
