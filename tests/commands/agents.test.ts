import { describe, it, expect, vi, beforeEach } from "vitest";
import { resolve } from "node:path";
import { agentsListCommand, agentsShowCommand } from "../../src/commands/agents.js";

const PROJECT_DIR = resolve(import.meta.dirname, "..", "..");

// Mock process.exit to prevent test runner from dying
const mockExit = vi.spyOn(process, "exit").mockImplementation((() => {
  throw new Error("process.exit called");
}) as never);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("agentsListCommand", () => {
  it("should list all agents without throwing", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    expect(() => agentsListCommand(PROJECT_DIR)).not.toThrow();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});

describe("agentsShowCommand", () => {
  it("should show a valid agent without throwing", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    expect(() => agentsShowCommand("architect", PROJECT_DIR)).not.toThrow();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("should exit with code 1 for unknown agent", () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => agentsShowCommand("nonexistent", PROJECT_DIR)).toThrow("process.exit called");
    expect(mockExit).toHaveBeenCalledWith(1);
    consoleErrorSpy.mockRestore();
  });
});
