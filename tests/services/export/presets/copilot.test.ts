import { describe, it, expect } from "vitest";
import { copilotPreset } from "../../../../src/services/export/presets/copilot.js";
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

describe("copilotPreset", () => {
  it("should have correct name and description", () => {
    expect(copilotPreset.name).toBe("copilot");
    expect(copilotPreset.description).toContain("copilot-instructions");
  });

  it("should generate .github/copilot-instructions.md file", () => {
    const result = copilotPreset.generate(makeContext());
    expect(result.files.length).toBe(1);
    expect(result.files[0].path).toBe(".github/copilot-instructions.md");
  });

  it("should include header", () => {
    const result = copilotPreset.generate(makeContext());
    expect(result.files[0].content).toContain("# Copilot Instructions");
    expect(result.files[0].content).toContain("fama-agents");
  });

  it("should include tech stack when provided", () => {
    const ctx = makeContext({
      stack: {
        languages: ["typescript"],
        frameworks: ["react", "next.js"],
        buildTools: ["vite"],
        testFrameworks: ["vitest"],
        packageManagers: ["pnpm"],
        isMonorepo: false,
        monorepoTools: [],
        databases: [],
        ciTools: [],
        detectedAt: new Date().toISOString(),
      },
    });
    const result = copilotPreset.generate(ctx);
    expect(result.files[0].content).toContain("## Tech Stack");
    expect(result.files[0].content).toContain("typescript");
    expect(result.files[0].content).toContain("react");
  });

  it("should include critical actions (deduplicated)", () => {
    const ctx = makeContext({
      agents: [
        {
          slug: "a1",
          name: "Agent1",
          description: "desc",
          prompt: "",
          tools: [],
          model: "sonnet",
          phases: ["E"],
          defaultSkills: [],
          filePath: "",
          criticalActions: ["Rule A", "Rule B"],
        },
        {
          slug: "a2",
          name: "Agent2",
          description: "desc",
          prompt: "",
          tools: [],
          model: "sonnet",
          phases: ["E"],
          defaultSkills: [],
          filePath: "",
          criticalActions: ["Rule A", "Rule C"], // "Rule A" is duplicate
        },
      ],
    });
    const result = copilotPreset.generate(ctx);
    const content = result.files[0].content;
    expect(content).toContain("## Critical Rules");
    expect(content).toContain("Rule A");
    expect(content).toContain("Rule B");
    expect(content).toContain("Rule C");
    // "Rule A" should appear only once
    const ruleACount = (content.match(/Rule A/g) || []).length;
    expect(ruleACount).toBe(1);
  });

  it("should include principles (deduplicated)", () => {
    const ctx = makeContext({
      agents: [
        {
          slug: "a1",
          name: "Agent1",
          description: "desc",
          prompt: "",
          tools: [],
          model: "sonnet",
          phases: ["E"],
          defaultSkills: [],
          filePath: "",
          persona: { principles: ["DRY", "KISS"] },
        },
        {
          slug: "a2",
          name: "Agent2",
          description: "desc",
          prompt: "",
          tools: [],
          model: "sonnet",
          phases: ["E"],
          defaultSkills: [],
          filePath: "",
          persona: { principles: ["DRY", "YAGNI"] },
        },
      ],
    });
    const result = copilotPreset.generate(ctx);
    const content = result.files[0].content;
    expect(content).toContain("## Development Principles");
    expect(content).toContain("DRY");
    expect(content).toContain("KISS");
    expect(content).toContain("YAGNI");
  });

  it("should include skills reference", () => {
    const ctx = makeContext({
      skills: [
        {
          slug: "brainstorming",
          name: "brainstorming",
          description: "Use when exploring design",
          phases: ["P"],
          source: "built-in",
          filePath: "",
        },
      ],
    });
    const result = copilotPreset.generate(ctx);
    expect(result.files[0].content).toContain("## Skills Reference");
    expect(result.files[0].content).toContain("brainstorming");
  });

  it("should return summary string", () => {
    const result = copilotPreset.generate(makeContext());
    expect(result.summary).toContain("copilot-instructions");
  });
});
