import { describe, it, expect, vi, beforeEach } from "vitest";
import { resolve } from "node:path";

vi.mock("../../src/core/agent-runner.js", () => ({
  runAgent: vi.fn().mockResolvedValue("Review result"),
}));

import { runAgent } from "../../src/core/agent-runner.js";
import { reviewCommand } from "../../src/commands/review.js";

const PROJECT_DIR = resolve(import.meta.dirname, "..", "..");
const mockedRunAgent = vi.mocked(runAgent);

beforeEach(() => {
  vi.clearAllMocks();
  mockedRunAgent.mockResolvedValue("Review result");
});

describe("reviewCommand", () => {
  it("should use code-reviewer agent", async () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    await reviewCommand("src/", { cwd: PROJECT_DIR });

    expect(mockedRunAgent).toHaveBeenCalledOnce();
    const callArgs = mockedRunAgent.mock.calls[0]![0];
    expect(callArgs.agent).toBe("code-reviewer");
    expect(callArgs.skills).toContain("code-review");
    expect(callArgs.task).toContain("src/");
    consoleSpy.mockRestore();
  });

  it("should default path to '.'", async () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    await reviewCommand(undefined, { cwd: PROJECT_DIR });

    const callArgs = mockedRunAgent.mock.calls[0]![0];
    expect(callArgs.task).toContain(".");
    consoleSpy.mockRestore();
  });

  it("should use adversarial-review skill in validate mode", async () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    await reviewCommand("src/", { validate: true, cwd: PROJECT_DIR });

    const callArgs = mockedRunAgent.mock.calls[0]![0];
    expect(callArgs.skills).toContain("adversarial-review");
    expect(callArgs.skills).toContain("verification");
    expect(callArgs.skills).not.toContain("code-review");
    expect(callArgs.task).toContain("adversarial");
    consoleSpy.mockRestore();
  });

  it("should include checklist content in validate task", async () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const checklistPath = resolve(PROJECT_DIR, "skills", "verification", "SKILL.md");

    await reviewCommand("src/", { validate: true, checklist: checklistPath, cwd: PROJECT_DIR });

    const callArgs = mockedRunAgent.mock.calls[0]![0];
    expect(callArgs.task).toContain("CHECKLIST");
    expect(callArgs.skills).toContain("adversarial-review");
    consoleSpy.mockRestore();
  });
});
