import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { resolve } from "node:path";
import { mkdirSync, rmSync, existsSync, writeFileSync } from "node:fs";
import { stringify as yamlStringify } from "yaml";
import { teamsListCommand, teamsShowCommand, resolveTeam } from "../../src/commands/teams.js";

const BASE_TEST_DIR = resolve(
  import.meta.dirname,
  "..",
  "fixtures",
  "teams-test",
);
let TEST_DIR: string;
let testCounter = 0;

function writeConfig(dir: string, config: Record<string, unknown>): void {
  writeFileSync(resolve(dir, ".fama.yaml"), yamlStringify(config), "utf-8");
}

describe("teams", () => {
  beforeEach(() => {
    testCounter++;
    TEST_DIR = resolve(BASE_TEST_DIR, `run-${testCounter}-${Date.now()}`);
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true, force: true });
  });

  describe("teamsListCommand", () => {
    it("deve exibir mensagem quando não há teams", () => {
      writeConfig(TEST_DIR, {});
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      teamsListCommand(TEST_DIR);
      consoleSpy.mockRestore();
    });

    it("deve listar teams configurados", () => {
      writeConfig(TEST_DIR, {
        teams: {
          frontend: {
            name: "Frontend Team",
            description: "UI specialists",
            agents: ["feature-developer", "test-writer"],
          },
        },
      });
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      teamsListCommand(TEST_DIR);
      const output = consoleSpy.mock.calls.map((c) => c.join(" ")).join("\n");
      expect(output).toContain("frontend");
      expect(output).toContain("Frontend Team");
      expect(output).toContain("2 agents");
      consoleSpy.mockRestore();
    });
  });

  describe("teamsShowCommand", () => {
    it("deve exibir detalhes do team", () => {
      writeConfig(TEST_DIR, {
        teams: {
          backend: {
            name: "Backend Team",
            description: "API experts",
            agents: ["architect", "security-auditor"],
            defaultSkills: ["verification"],
          },
        },
      });
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      teamsShowCommand("backend", TEST_DIR);
      const output = consoleSpy.mock.calls.map((c) => c.join(" ")).join("\n");
      expect(output).toContain("Backend Team");
      expect(output).toContain("architect");
      expect(output).toContain("security-auditor");
      expect(output).toContain("verification");
      consoleSpy.mockRestore();
    });

    it("deve sair com erro para team inexistente", () => {
      writeConfig(TEST_DIR, {});
      const mockExit = vi.spyOn(process, "exit").mockImplementation((() => {
        throw new Error("process.exit called");
      }) as never);
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      expect(() => teamsShowCommand("nonexistent", TEST_DIR)).toThrow("process.exit called");
      expect(mockExit).toHaveBeenCalledWith(1);
      mockExit.mockRestore();
      consoleErrorSpy.mockRestore();
    });
  });

  describe("resolveTeam", () => {
    it("deve resolver team existente", () => {
      writeConfig(TEST_DIR, {
        teams: {
          qa: {
            name: "QA Team",
            description: "Quality assurance",
            agents: ["test-writer", "code-reviewer"],
          },
        },
      });
      const team = resolveTeam("qa", TEST_DIR);
      expect(team).toBeDefined();
      expect(team?.name).toBe("QA Team");
      expect(team?.agents).toEqual(["test-writer", "code-reviewer"]);
    });

    it("deve retornar null para team inexistente", () => {
      writeConfig(TEST_DIR, {});
      const team = resolveTeam("nonexistent", TEST_DIR);
      expect(team).toBeNull();
    });
  });
});
