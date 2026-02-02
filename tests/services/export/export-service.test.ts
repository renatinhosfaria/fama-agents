import { describe, it, expect } from "vitest";
import {
  generateExport,
  generateExports,
  getPresetNames,
  getAllPresets,
} from "../../../src/services/export/export-service.js";
import type { ExportContext } from "../../../src/services/export/types.js";
import type { AgentConfig, ParsedSkill, FamaConfig } from "../../../src/core/types.js";
import { ProjectScale } from "../../../src/core/types.js";

function makeContext(overrides?: Partial<ExportContext>): ExportContext {
  const agent: AgentConfig = {
    slug: "feature-developer",
    name: "Feature Developer",
    description: "Implements features with TDD",
    prompt: "You are a feature developer.",
    tools: ["Read", "Write", "Bash"],
    model: "sonnet",
    phases: ["E"],
    defaultSkills: ["test-driven-development"],
    filePath: "/agents/feature-developer.md",
    persona: {
      displayName: "Amelia",
      icon: "💻",
      role: "Feature Developer",
      identity: "Expert developer",
      communicationStyle: "Direct",
      principles: ["Red-Green-Refactor", "Tests first"],
    },
    criticalActions: ["Write failing test BEFORE production code", "Run full test suite"],
  };

  const skill: ParsedSkill = {
    slug: "test-driven-development",
    name: "Test Driven Development",
    description: "TDD skill",
    content: "# TDD\nWrite tests first.",
    phases: ["E", "V"],
    source: "built-in",
    filePath: "/skills/test-driven-development/SKILL.md",
  };

  const config: FamaConfig = {
    model: "sonnet",
    maxTurns: 50,
    lang: "pt-BR",
    skillsDir: "./skills",
    workflow: {
      defaultScale: ProjectScale.MEDIUM,
      gates: { requirePlan: true, requireApproval: false },
    },
  };

  return {
    agents: [agent],
    skills: [skill],
    config,
    projectDir: "/tmp/test-project",
    ...overrides,
  };
}

describe("export-service", () => {
  describe("getPresetNames", () => {
    it("deve retornar todos os presets disponíveis", () => {
      const names = getPresetNames();
      expect(names).toContain("cursor");
      expect(names).toContain("windsurf");
      expect(names).toContain("copilot");
      expect(names).toContain("claude-desktop");
      expect(names).toContain("agents-md");
      expect(names.length).toBe(5);
    });
  });

  describe("getAllPresets", () => {
    it("deve retornar objetos com name, description, generate", () => {
      const presets = getAllPresets();
      for (const preset of presets) {
        expect(preset.name).toBeTruthy();
        expect(preset.description).toBeTruthy();
        expect(typeof preset.generate).toBe("function");
      }
    });
  });

  describe("generateExport", () => {
    it("deve lançar erro para preset desconhecido", () => {
      const ctx = makeContext();
      expect(() => generateExport("unknown", ctx)).toThrow("Unknown export preset");
    });

    it("cursor: deve gerar .cursor/rules/*.mdc", () => {
      const ctx = makeContext();
      const result = generateExport("cursor", ctx);
      expect(result.files.length).toBe(1);
      expect(result.files[0].path).toBe(".cursor/rules/feature-developer.mdc");
      expect(result.files[0].content).toContain("---");
      expect(result.files[0].content).toContain("Amelia");
      expect(result.files[0].content).toContain("Critical Actions");
    });

    it("windsurf: deve gerar .windsurfrules", () => {
      const ctx = makeContext();
      const result = generateExport("windsurf", ctx);
      expect(result.files.length).toBe(1);
      expect(result.files[0].path).toBe(".windsurfrules");
      expect(result.files[0].content).toContain("Feature Developer");
      expect(result.files[0].content).toContain("Skills");
    });

    it("copilot: deve gerar .github/copilot-instructions.md", () => {
      const ctx = makeContext();
      const result = generateExport("copilot", ctx);
      expect(result.files.length).toBe(1);
      expect(result.files[0].path).toBe(".github/copilot-instructions.md");
      expect(result.files[0].content).toContain("Critical Rules");
      expect(result.files[0].content).toContain("Development Principles");
    });

    it("claude-desktop: deve gerar config JSON e instruções", () => {
      const ctx = makeContext();
      const result = generateExport("claude-desktop", ctx);
      expect(result.files.length).toBe(2);
      expect(result.files[0].path).toBe(".fama/claude-desktop-config.json");
      expect(result.files[1].path).toBe(".fama/claude-desktop-instructions.md");
      const json = JSON.parse(result.files[0].content);
      expect(json.mcpServers["fama-agents"]).toBeTruthy();
    });

    it("agents-md: deve gerar AGENTS.md com tabela", () => {
      const ctx = makeContext();
      const result = generateExport("agents-md", ctx);
      expect(result.files.length).toBe(1);
      expect(result.files[0].path).toBe("AGENTS.md");
      expect(result.files[0].content).toContain("| Agent |");
      expect(result.files[0].content).toContain("feature-developer");
      expect(result.files[0].content).toContain("💻");
    });

    it("deve incluir stack info quando disponível", () => {
      const ctx = makeContext({
        stack: {
          languages: ["TypeScript"],
          frameworks: ["Next.js"],
          buildTools: [],
          testFrameworks: ["Vitest"],
          packageManagers: ["pnpm"],
          databases: [],
          ciTools: [],
          isMonorepo: false,
          detectedAt: new Date().toISOString(),
        },
      });
      const result = generateExport("agents-md", ctx);
      expect(result.files[0].content).toContain("TypeScript");
      expect(result.files[0].content).toContain("Next.js");
    });
  });

  describe("generateExports", () => {
    it("deve gerar múltiplos presets", () => {
      const ctx = makeContext();
      const result = generateExports(["cursor", "windsurf"], ctx);
      expect(result.files.length).toBe(2);
      expect(result.summary).toContain("Cursor");
      expect(result.summary).toContain("windsurfrules");
    });

    it("'all' deve gerar todos os presets", () => {
      const ctx = makeContext();
      const result = generateExports(["all"], ctx);
      // cursor (1) + windsurf (1) + copilot (1) + claude-desktop (2) + agents-md (1) = 6
      expect(result.files.length).toBe(6);
    });
  });
});
