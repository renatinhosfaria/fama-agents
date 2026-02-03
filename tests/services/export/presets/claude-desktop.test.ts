import { describe, it, expect } from "vitest";
import { claudeDesktopPreset } from "../../../../src/services/export/presets/claude-desktop.js";
import type { ExportContext } from "../../../../src/services/export/types.js";
import { ProjectScale } from "../../../../src/core/types.js";

function makeContext(overrides?: Partial<ExportContext>): ExportContext {
  return {
    agents: [],
    skills: [],
    config: {
      model: "sonnet",
      maxTurns: 50,
      lang: "pt-BR",
      skillsDir: "skills",
      workflow: { defaultScale: ProjectScale.MEDIUM, gates: { requirePlan: true, requireApproval: false } },
    },
    projectDir: "/fake/project",
    ...overrides,
  };
}

describe("claudeDesktopPreset", () => {
  it("should have correct name", () => {
    expect(claudeDesktopPreset.name).toBe("claude-desktop");
  });

  it("should generate two files", () => {
    const result = claudeDesktopPreset.generate(makeContext());
    expect(result.files.length).toBe(2);
  });

  it("should generate valid JSON config file", () => {
    const result = claudeDesktopPreset.generate(makeContext());
    const jsonFile = result.files.find((f) => f.path.endsWith(".json"));
    expect(jsonFile).toBeDefined();
    expect(jsonFile!.path).toBe(".fama/claude-desktop-config.json");

    const parsed = JSON.parse(jsonFile!.content);
    expect(parsed.mcpServers).toBeDefined();
    expect(parsed.mcpServers["fama-agents"]).toBeDefined();
    expect(parsed.mcpServers["fama-agents"].command).toBe("npx");
    expect(parsed.mcpServers["fama-agents"].args).toContain("fama-agents");
    expect(parsed.mcpServers["fama-agents"].args).toContain("mcp");
  });

  it("should include project directory in config", () => {
    const result = claudeDesktopPreset.generate(makeContext({ projectDir: "/my/project" }));
    const jsonFile = result.files.find((f) => f.path.endsWith(".json"))!;
    const parsed = JSON.parse(jsonFile.content);
    expect(parsed.mcpServers["fama-agents"].cwd).toBe("/my/project");
  });

  it("should generate instructions markdown file", () => {
    const result = claudeDesktopPreset.generate(makeContext());
    const mdFile = result.files.find((f) => f.path.endsWith(".md"));
    expect(mdFile).toBeDefined();
    expect(mdFile!.path).toBe(".fama/claude-desktop-instructions.md");
    expect(mdFile!.content).toContain("# Claude Desktop MCP Configuration");
    expect(mdFile!.content).toContain("claude_desktop_config.json");
  });

  it("should list agents and skills in instructions", () => {
    const ctx = makeContext({
      agents: [
        {
          slug: "architect",
          name: "Architect",
          description: "desc",
          prompt: "",
          tools: [],
          model: "sonnet",
          phases: ["P"],
          defaultSkills: [],
          filePath: "",
        },
      ],
      skills: [
        {
          slug: "brainstorming",
          name: "brainstorming",
          description: "desc",
          phases: ["P"],
          source: "built-in",
          filePath: "",
        },
      ],
    });
    const result = claudeDesktopPreset.generate(ctx);
    const mdFile = result.files.find((f) => f.path.endsWith(".md"))!;
    expect(mdFile.content).toContain("architect");
    expect(mdFile.content).toContain("brainstorming");
  });

  it("should include ANTHROPIC_API_KEY placeholder in env", () => {
    const result = claudeDesktopPreset.generate(makeContext());
    const jsonFile = result.files.find((f) => f.path.endsWith(".json"))!;
    const parsed = JSON.parse(jsonFile.content);
    expect(parsed.mcpServers["fama-agents"].env.ANTHROPIC_API_KEY).toBe("${ANTHROPIC_API_KEY}");
  });
});
