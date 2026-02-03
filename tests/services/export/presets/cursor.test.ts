import { describe, it, expect } from "vitest";
import { cursorPreset } from "../../../../src/services/export/presets/cursor.js";
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

describe("cursorPreset", () => {
  it("should have correct name", () => {
    expect(cursorPreset.name).toBe("cursor");
  });

  it("should generate one .mdc file per agent", () => {
    const ctx = makeContext({
      agents: [
        {
          slug: "architect",
          name: "Architect",
          description: "System architect",
          prompt: "You are an architect.",
          tools: ["Read"],
          model: "sonnet",
          phases: ["P"],
          defaultSkills: [],
          filePath: "",
        },
        {
          slug: "test-writer",
          name: "Test Writer",
          description: "Writes tests",
          prompt: "You write tests.",
          tools: ["Read", "Write"],
          model: "sonnet",
          phases: ["E"],
          defaultSkills: [],
          filePath: "",
        },
      ],
    });
    const result = cursorPreset.generate(ctx);
    expect(result.files.length).toBe(2);
    expect(result.files[0].path).toBe(".cursor/rules/architect.mdc");
    expect(result.files[1].path).toBe(".cursor/rules/test-writer.mdc");
  });

  it("should include frontmatter in .mdc files", () => {
    const ctx = makeContext({
      agents: [
        {
          slug: "architect",
          name: "Architect",
          description: "System architect",
          prompt: "You are an architect.",
          tools: [],
          model: "sonnet",
          phases: ["P"],
          defaultSkills: [],
          filePath: "",
        },
      ],
    });
    const result = cursorPreset.generate(ctx);
    const content = result.files[0].content;
    expect(content).toMatch(/^---\n/);
    expect(content).toContain("description:");
    expect(content).toContain("globs: []");
    expect(content).toContain("alwaysApply: false");
  });

  it("should include persona information when available", () => {
    const ctx = makeContext({
      agents: [
        {
          slug: "architect",
          name: "Architect",
          description: "System architect",
          prompt: "You are an architect.",
          tools: [],
          model: "sonnet",
          phases: ["P"],
          defaultSkills: [],
          filePath: "",
          persona: {
            displayName: "The Architect",
            role: "Senior Architect",
            identity: "Expert in design",
            principles: ["SOLID", "KISS"],
          },
        },
      ],
    });
    const result = cursorPreset.generate(ctx);
    const content = result.files[0].content;
    expect(content).toContain("The Architect");
    expect(content).toContain("Senior Architect");
    expect(content).toContain("Expert in design");
    expect(content).toContain("SOLID");
  });

  it("should include critical actions", () => {
    const ctx = makeContext({
      agents: [
        {
          slug: "architect",
          name: "Architect",
          description: "System architect",
          prompt: "prompt",
          tools: [],
          model: "sonnet",
          phases: ["P"],
          defaultSkills: [],
          filePath: "",
          criticalActions: ["Always validate", "Document decisions"],
        },
      ],
    });
    const result = cursorPreset.generate(ctx);
    const content = result.files[0].content;
    expect(content).toContain("## Critical Actions");
    expect(content).toContain("Always validate");
  });

  it("should include prompt section", () => {
    const ctx = makeContext({
      agents: [
        {
          slug: "test",
          name: "Test",
          description: "desc",
          prompt: "You are a specialized test agent.",
          tools: [],
          model: "sonnet",
          phases: ["E"],
          defaultSkills: [],
          filePath: "",
        },
      ],
    });
    const result = cursorPreset.generate(ctx);
    expect(result.files[0].content).toContain("## Prompt");
    expect(result.files[0].content).toContain("specialized test agent");
  });

  it("should return empty files for no agents", () => {
    const result = cursorPreset.generate(makeContext());
    expect(result.files).toEqual([]);
  });

  it("should sanitize slug for safe file paths", () => {
    const ctx = makeContext({
      agents: [
        {
          slug: "../../evil",
          name: "Evil",
          description: "desc",
          prompt: "prompt",
          tools: [],
          model: "sonnet",
          phases: ["E"],
          defaultSkills: [],
          filePath: "",
        },
      ],
    });
    const result = cursorPreset.generate(ctx);
    // Path should not contain ..
    expect(result.files[0].path).not.toContain("..");
  });
});
