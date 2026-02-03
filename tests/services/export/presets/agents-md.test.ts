import { describe, it, expect } from "vitest";
import { agentsMdPreset } from "../../../../src/services/export/presets/agents-md.js";
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

describe("agentsMdPreset", () => {
  it("should have correct name", () => {
    expect(agentsMdPreset.name).toBe("agents-md");
  });

  it("should generate AGENTS.md file", () => {
    const result = agentsMdPreset.generate(makeContext());
    expect(result.files.length).toBe(1);
    expect(result.files[0].path).toBe("AGENTS.md");
  });

  it("should include header and description", () => {
    const result = agentsMdPreset.generate(makeContext());
    expect(result.files[0].content).toContain("# AGENTS.md");
    expect(result.files[0].content).toContain("fama-agents");
  });

  it("should include agents table with correct columns", () => {
    const ctx = makeContext({
      agents: [
        {
          slug: "architect",
          name: "Architect",
          description: "Designs architecture",
          prompt: "prompt",
          tools: ["Read", "Glob"],
          model: "sonnet",
          phases: ["P", "R"],
          defaultSkills: ["brainstorming"],
          filePath: "",
        },
      ],
    });
    const result = agentsMdPreset.generate(ctx);
    const content = result.files[0].content;
    expect(content).toContain("| Agent | Description | Phases | Model |");
    expect(content).toContain("architect");
    expect(content).toContain("P,R");
    expect(content).toContain("sonnet");
  });

  it("should escape pipe characters in descriptions", () => {
    const ctx = makeContext({
      agents: [
        {
          slug: "test",
          name: "Test",
          description: "Uses | pipes | in description",
          prompt: "prompt",
          tools: [],
          model: "sonnet",
          phases: ["E"],
          defaultSkills: [],
          filePath: "",
        },
      ],
    });
    const result = agentsMdPreset.generate(ctx);
    // Pipes should be escaped
    expect(result.files[0].content).toContain("\\|");
  });

  it("should include agent details with persona", () => {
    const ctx = makeContext({
      agents: [
        {
          slug: "architect",
          name: "Architect",
          description: "Designs architecture",
          prompt: "prompt",
          tools: ["Read"],
          model: "sonnet",
          phases: ["P"],
          defaultSkills: ["brainstorming"],
          filePath: "",
          persona: {
            role: "Senior Architect",
            identity: "Expert in design",
            communicationStyle: "Technical and precise",
          },
          criticalActions: ["Verify feasibility"],
        },
      ],
    });
    const result = agentsMdPreset.generate(ctx);
    const content = result.files[0].content;
    expect(content).toContain("**Role:** Senior Architect");
    expect(content).toContain("**Identity:** Expert in design");
    expect(content).toContain("**Style:** Technical and precise");
    expect(content).toContain("Verify feasibility");
    expect(content).toContain("**Skills:** brainstorming");
    expect(content).toContain("**Tools:** Read");
  });

  it("should include skills table", () => {
    const ctx = makeContext({
      skills: [
        {
          slug: "brainstorming",
          name: "brainstorming",
          description: "Use when exploring",
          phases: ["P"],
          source: "built-in",
          filePath: "",
        },
      ],
    });
    const result = agentsMdPreset.generate(ctx);
    const content = result.files[0].content;
    expect(content).toContain("## Skills");
    expect(content).toContain("| Skill | Description | Phases |");
    expect(content).toContain("brainstorming");
  });

  it("should include tech stack section", () => {
    const ctx = makeContext({
      stack: {
        languages: ["typescript"],
        frameworks: ["react"],
        buildTools: ["vite"],
        testFrameworks: ["vitest"],
        packageManagers: ["pnpm"],
        isMonorepo: false,
        monorepoTools: [],
        databases: ["postgresql"],
        ciTools: [],
        detectedAt: "",
      },
    });
    const result = agentsMdPreset.generate(ctx);
    const content = result.files[0].content;
    expect(content).toContain("## Tech Stack");
    expect(content).toContain("typescript");
    expect(content).toContain("postgresql");
  });
});
