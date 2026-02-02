import { describe, it, expect, vi, beforeEach } from "vitest";
import { resolve } from "node:path";
import { skillsListCommand, skillsShowCommand } from "../../src/commands/skills.js";

const PROJECT_DIR = resolve(import.meta.dirname, "..", "..");

const mockExit = vi.spyOn(process, "exit").mockImplementation((() => {
  throw new Error("process.exit called");
}) as never);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("skillsListCommand", () => {
  it("should list all skills without throwing", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    expect(() => skillsListCommand(PROJECT_DIR)).not.toThrow();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});

describe("skillsShowCommand", () => {
  it("should show a valid skill without throwing", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    expect(() => skillsShowCommand("brainstorming", PROJECT_DIR)).not.toThrow();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("should exit with code 1 for unknown skill", () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => skillsShowCommand("nonexistent", PROJECT_DIR)).toThrow("process.exit called");
    expect(mockExit).toHaveBeenCalledWith(1);
    consoleErrorSpy.mockRestore();
  });
});
