import { describe, it, expect, vi, beforeEach } from "vitest";
import { resolve } from "node:path";
import { agentsMenuCommand, resolveMenuTrigger } from "../../src/commands/menu.js";

const PROJECT_DIR = resolve(import.meta.dirname, "..", "..");

const mockExit = vi.spyOn(process, "exit").mockImplementation((() => {
  throw new Error("process.exit called");
}) as never);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("agentsMenuCommand", () => {
  it("should display menu for agent with menu entries", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    // architect has menu entries in its playbook
    expect(() => agentsMenuCommand("architect", PROJECT_DIR)).not.toThrow();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("should exit with code 1 for unknown agent", () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => agentsMenuCommand("nonexistent", PROJECT_DIR)).toThrow("process.exit called");
    expect(mockExit).toHaveBeenCalledWith(1);
    consoleErrorSpy.mockRestore();
  });
});

describe("resolveMenuTrigger", () => {
  it("should resolve a valid trigger", () => {
    const entry = resolveMenuTrigger("architect", "plan", PROJECT_DIR);
    expect(entry).toBeDefined();
    expect(entry?.trigger).toBe("plan");
    expect(entry?.command).toBeTruthy();
  });

  it("should return null for unknown trigger", () => {
    const entry = resolveMenuTrigger("architect", "nonexistent", PROJECT_DIR);
    expect(entry).toBeNull();
  });

  it("should return null for unknown agent", () => {
    const entry = resolveMenuTrigger("nonexistent", "plan", PROJECT_DIR);
    expect(entry).toBeNull();
  });
});
