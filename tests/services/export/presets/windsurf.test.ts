import { describe, it, expect } from "vitest";
import { windsurfPreset } from "../../../../src/services/export/presets/windsurf.js";
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

describe("windsurfPreset", () => {
  it("should have correct name", () => {
    expect(windsurfPreset.name).toBe("windsurf");
  });

  it("should generate a single .windsurfrules file", () => {
    const result = windsurfPreset.generate(makeContext());
    expect(result.files.length).toBe(1);
    expect(result.files[0].path).toBe(".windsurfrules");
  });

  it("should include header", () => {
    const result = windsurfPreset.generate(makeContext());
    expect(result.files[0].content).toContain("# Windsurf Rules");
    expect(result.files[0].content).toContain("fama-agents");
  });

  it("should include tech stack when provided", () => {
    const ctx = makeContext({
      stack: {
        languages: ["typescript"],
        frameworks: ["react"],
        buildTools: [],
        testFrameworks: [],
        packageManagers: [],
        isMonorepo: false,
        monorepoTools: [],
        databases: [],
        ciTools: [],
        detectedAt: "",
      },
    });
    const result = windsurfPreset.generate(ctx);
    expect(result.files[0].content).toContain("## Tech Stack");
    expect(result.files[0].content).toContain("typescript");
  });

  it("should include agents section", () => {
    const ctx = makeContext({
      agents: [
        {
          slug: "architect",
          name: "Architect",
          description: "System design",
          prompt: "",
          tools: [],
          model: "sonnet",
          phases: ["P"],
          defaultSkills: [],
          filePath: "",
          persona: { icon: "🏛️" },
          criticalActions: ["Verify feasibility"],
        },
      ],
    });
    const result = windsurfPreset.generate(ctx);
    const content = result.files[0].content;
    expect(content).toContain("## Agents");
    expect(content).toContain("🏛️ Architect");
    expect(content).toContain("Verify feasibility");
  });

  it("should include skills section", () => {
    const ctx = makeContext({
      skills: [
        {
          slug: "verification",
          name: "verification",
          description: "Use when verifying",
          phases: ["V"],
          source: "built-in",
          filePath: "",
        },
      ],
    });
    const result = windsurfPreset.generate(ctx);
    expect(result.files[0].content).toContain("## Skills");
    expect(result.files[0].content).toContain("verification");
  });
});
