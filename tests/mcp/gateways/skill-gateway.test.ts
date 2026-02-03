import { describe, it, expect } from "vitest";
import { handleSkillGateway } from "../../../src/mcp/gateways/skill-gateway.js";
import type { SkillSummary, WorkflowPhase } from "../../../src/core/types.js";

// Minimal mock for SkillRegistry
function mockSkillRegistry(skills: SkillSummary[], contents?: Record<string, string>) {
  return {
    getAll: () => skills,
    getContent: (slug: string) => contents?.[slug] ?? null,
    getForPhase: (phase: WorkflowPhase) => skills.filter((s) => s.phases.includes(phase)),
    getBySlug: (slug: string) => skills.find((s) => s.slug === slug) ?? null,
    getContents: () => [],
    getReferences: () => [],
    refresh: () => {},
  } as never;
}

const sampleSkills: SkillSummary[] = [
  {
    slug: "brainstorming",
    name: "brainstorming",
    description: "Use when exploring design options",
    phases: ["P"] as WorkflowPhase[],
    source: "built-in",
    filePath: "/skills/brainstorming/SKILL.md",
  },
  {
    slug: "verification",
    name: "verification",
    description: "Use when verifying implementation",
    phases: ["E", "V", "C"] as WorkflowPhase[],
    source: "built-in",
    filePath: "/skills/verification/SKILL.md",
  },
  {
    slug: "code-review",
    name: "code-review",
    description: "Use when reviewing code changes",
    phases: ["R", "V"] as WorkflowPhase[],
    source: "built-in",
    filePath: "/skills/code-review/SKILL.md",
  },
];

const sampleContents: Record<string, string> = {
  brainstorming: "# Brainstorming\n\nExplore design options.",
  verification: "# Verification\n\nVerify implementation.",
};

describe("handleSkillGateway", () => {
  const registry = mockSkillRegistry(sampleSkills, sampleContents);

  describe("list action", () => {
    it("should list all skills with slug, description, and phases", () => {
      const result = handleSkillGateway({ action: "list" }, registry);
      expect(result).toContain("brainstorming");
      expect(result).toContain("verification");
      expect(result).toContain("code-review");
      expect(result).toContain("Use when exploring");
    });
  });

  describe("show action", () => {
    it("should return skill content for valid slug", () => {
      const result = handleSkillGateway({ action: "show", slug: "brainstorming" }, registry);
      expect(result).toContain("# Brainstorming");
    });

    it("should return error when slug is missing", () => {
      const result = handleSkillGateway({ action: "show" }, registry);
      expect(result).toContain("Error");
      expect(result).toContain("slug");
    });

    it("should return not found for invalid slug", () => {
      const result = handleSkillGateway({ action: "show", slug: "nonexistent" }, registry);
      expect(result).toContain("not found");
    });
  });

  describe("search action", () => {
    it("should find skills matching query in slug", () => {
      const result = handleSkillGateway({ action: "search", query: "brain" }, registry);
      expect(result).toContain("brainstorming");
    });

    it("should find skills matching query in description", () => {
      const result = handleSkillGateway({ action: "search", query: "reviewing" }, registry);
      expect(result).toContain("code-review");
    });

    it("should be case-insensitive", () => {
      const result = handleSkillGateway({ action: "search", query: "VERIFY" }, registry);
      expect(result).toContain("verification");
    });

    it("should return no results message when nothing matches", () => {
      const result = handleSkillGateway({ action: "search", query: "xyznonexistent" }, registry);
      expect(result).toContain("No skills matching");
    });

    it("should return error when query is missing", () => {
      const result = handleSkillGateway({ action: "search" }, registry);
      expect(result).toContain("Error");
      expect(result).toContain("query");
    });
  });

  describe("forPhase action", () => {
    it("should return skills for planning phase", () => {
      const result = handleSkillGateway({ action: "forPhase", phase: "P" }, registry);
      expect(result).toContain("brainstorming");
      expect(result).not.toContain("verification");
    });

    it("should return skills for verification phase", () => {
      const result = handleSkillGateway({ action: "forPhase", phase: "V" }, registry);
      expect(result).toContain("verification");
      expect(result).toContain("code-review");
      expect(result).not.toContain("brainstorming");
    });

    it("should return error for invalid phase", () => {
      const result = handleSkillGateway({ action: "forPhase", phase: "X" }, registry);
      expect(result).toContain("Invalid phase");
    });

    it("should return error when phase is missing", () => {
      const result = handleSkillGateway({ action: "forPhase" }, registry);
      expect(result).toContain("Error");
      expect(result).toContain("phase");
    });

    it("should return no skills message for phase with no skills", () => {
      const emptyRegistry = mockSkillRegistry([]);
      const result = handleSkillGateway({ action: "forPhase", phase: "P" }, emptyRegistry);
      expect(result).toContain("No skills for phase");
    });
  });

  describe("unknown action", () => {
    it("should return error for unknown action", () => {
      const result = handleSkillGateway({ action: "invalid" as never }, registry);
      expect(result).toContain("Unknown action");
    });
  });
});
