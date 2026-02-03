import { describe, it, expect } from "vitest";
import { handleAgentGateway } from "../../../src/mcp/gateways/agent-gateway.js";
import type { AgentConfig } from "../../../src/core/types.js";

// Minimal mock for AgentRegistry
function mockAgentRegistry(agents: AgentConfig[]) {
  return {
    getAll: () => agents,
    getBySlug: (slug: string) => agents.find((a) => a.slug === slug) ?? null,
    refresh: () => {},
    buildDefinition: () => null,
  } as never;
}

// Minimal mock for StackDetector
function mockStackDetector(recommended: string[] = []) {
  return {
    detect: () => ({
      languages: [],
      frameworks: [],
      buildTools: [],
      testFrameworks: [],
      packageManagers: [],
      isMonorepo: false,
      monorepoTools: [],
      databases: [],
      ciTools: [],
      detectedAt: new Date().toISOString(),
    }),
    recommendAgents: () => recommended,
    formatSummary: () => "",
  } as never;
}

const sampleAgent: AgentConfig = {
  slug: "architect",
  name: "Architect",
  description: "Designs system architecture",
  prompt: "You are an architect agent.",
  tools: ["Read", "Grep", "Glob"],
  model: "sonnet",
  phases: ["P", "R"],
  defaultSkills: ["brainstorming"],
  filePath: "/fake/path/architect.md",
  persona: {
    displayName: "The Architect",
    icon: "🏛️",
    role: "System Architect",
    identity: "Expert in software design",
  },
  criticalActions: ["Always verify feasibility", "Document decisions"],
};

describe("handleAgentGateway", () => {
  const registry = mockAgentRegistry([sampleAgent]);

  describe("list action", () => {
    it("should list all agents with icon, slug, description, and phases", () => {
      const result = handleAgentGateway({ action: "list" }, registry);
      expect(result).toContain("architect");
      expect(result).toContain("Designs system architecture");
      expect(result).toContain("P,R");
      expect(result).toContain("🏛️");
    });

    it("should return empty string for no agents", () => {
      const emptyRegistry = mockAgentRegistry([]);
      const result = handleAgentGateway({ action: "list" }, emptyRegistry);
      expect(result).toBe("");
    });
  });

  describe("show action", () => {
    it("should return agent details for valid slug", () => {
      const result = handleAgentGateway({ action: "show", slug: "architect" }, registry);
      expect(result).toContain("# Architect");
      expect(result).toContain("**Description:**");
      expect(result).toContain("**Model:** sonnet");
      expect(result).toContain("**Phases:** P, R");
      expect(result).toContain("**Tools:** Read, Grep, Glob");
      expect(result).toContain("**Skills:** brainstorming");
      expect(result).toContain("## Persona");
      expect(result).toContain("The Architect");
      expect(result).toContain("## Critical Actions");
      expect(result).toContain("Always verify feasibility");
    });

    it("should return error when slug is missing", () => {
      const result = handleAgentGateway({ action: "show" }, registry);
      expect(result).toContain("Error");
      expect(result).toContain("slug");
    });

    it("should return not found for invalid slug", () => {
      const result = handleAgentGateway({ action: "show", slug: "nonexistent" }, registry);
      expect(result).toContain("not found");
    });
  });

  describe("prompt action", () => {
    it("should return agent prompt for valid slug", () => {
      const result = handleAgentGateway({ action: "prompt", slug: "architect" }, registry);
      expect(result).toBe("You are an architect agent.");
    });

    it("should return error when slug is missing", () => {
      const result = handleAgentGateway({ action: "prompt" }, registry);
      expect(result).toContain("Error");
    });

    it("should return not found for invalid slug", () => {
      const result = handleAgentGateway({ action: "prompt", slug: "bad" }, registry);
      expect(result).toContain("not found");
    });
  });

  describe("recommend action", () => {
    it("should return recommended agents from stack detector", () => {
      const detector = mockStackDetector(["feature-developer", "backend-specialist"]);
      const result = handleAgentGateway({ action: "recommend" }, registry, detector);
      expect(result).toContain("feature-developer");
      expect(result).toContain("backend-specialist");
    });

    it("should return message when stack detector is not available", () => {
      const result = handleAgentGateway({ action: "recommend" }, registry);
      expect(result).toContain("not available");
    });
  });

  describe("unknown action", () => {
    it("should return error for unknown action", () => {
      const result = handleAgentGateway({ action: "invalid" as never }, registry);
      expect(result).toContain("Unknown action");
    });
  });
});
