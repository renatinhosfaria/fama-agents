import { describe, it, expect } from "vitest";
import { resolve } from "node:path";
import { AgentRegistry } from "../../src/core/agent-registry.js";

const PROJECT_DIR = resolve(import.meta.dirname, "..", "..");

describe("AgentRegistry", () => {
  it("should discover agents from factories", () => {
    const registry = new AgentRegistry(PROJECT_DIR);
    const agents = registry.getAll();
    expect(agents.length).toBeGreaterThan(0);
  });

  it("should find code-reviewer agent", () => {
    const registry = new AgentRegistry(PROJECT_DIR);
    const agent = registry.getBySlug("code-reviewer");
    expect(agent).toBeDefined();
    expect(agent?.tools).toContain("Read");
    expect(agent?.phases).toContain("R");
  });

  it("should build agent definition", () => {
    const registry = new AgentRegistry(PROJECT_DIR);
    const def = registry.buildDefinition("code-reviewer", ["test skill content"]);
    expect(def).toBeDefined();
    expect(def?.description).toBeTruthy();
    expect(def?.prompt).toBeTruthy();
    expect(def?.tools).toContain("Read");
  });

  it("should get agents for a specific phase", () => {
    const registry = new AgentRegistry(PROJECT_DIR);
    const reviewAgents = registry.getForPhase("R");
    expect(reviewAgents.length).toBeGreaterThan(0);
    expect(reviewAgents.some((a) => a.slug === "code-reviewer")).toBe(true);
  });
});
