import { describe, it, expect, beforeEach, afterEach, afterAll } from "vitest";
import { resolve } from "node:path";
import { mkdirSync, rmSync, existsSync } from "node:fs";

// We need to mock process.cwd() before importing tools.ts since it captures cwd at module level
const BASE_TEST_DIR = resolve(
  import.meta.dirname,
  "..",
  "fixtures",
  "mcp-tools-test",
);
let TEST_DIR: string;
let testCounter = 0;

// Since tools.ts captures `process.cwd()` at module level,
// we test the registries and workflow engine directly instead
import { SkillRegistry } from "../../src/core/skill-registry.js";
import { AgentRegistry } from "../../src/core/agent-registry.js";
import { WorkflowEngine } from "../../src/core/workflow-engine.js";
import { ProjectScale } from "../../src/core/types.js";

const PROJECT_DIR = resolve(import.meta.dirname, "..", "..");

describe("MCP tools backing logic", () => {
  beforeEach(() => {
    testCounter++;
    TEST_DIR = resolve(BASE_TEST_DIR, `run-${testCounter}-${Date.now()}`);
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true, force: true });
  });

  afterAll(() => {
    if (existsSync(BASE_TEST_DIR)) rmSync(BASE_TEST_DIR, { recursive: true, force: true });
  });

  describe("fama_list_agents equivalent", () => {
    it("should list all agents", () => {
      const registry = new AgentRegistry(PROJECT_DIR);
      const agents = registry.getAll();
      expect(agents.length).toBeGreaterThan(0);

      const text = agents
        .map((a) => `${a.slug}: ${a.description} (phases: ${a.phases.join(",")})`)
        .join("\n");
      expect(text).toContain("architect");
      expect(text).toContain("code-reviewer");
    });
  });

  describe("fama_list_skills equivalent", () => {
    it("should list all skills", () => {
      const registry = new SkillRegistry(PROJECT_DIR);
      const skills = registry.getAll();
      expect(skills.length).toBeGreaterThan(0);

      const text = skills
        .map((s) => `${s.slug}: ${s.description} (phases: ${s.phases.join(",")})`)
        .join("\n");
      expect(text).toContain("brainstorming");
    });
  });

  describe("fama_get_skill equivalent", () => {
    it("should return content for valid slug", () => {
      const registry = new SkillRegistry(PROJECT_DIR);
      const content = registry.getContent("brainstorming");
      expect(content).toBeTruthy();
      expect(content!.length).toBeGreaterThan(0);
    });

    it("should return null for invalid slug", () => {
      const registry = new SkillRegistry(PROJECT_DIR);
      const content = registry.getContent("nonexistent-skill-xyz");
      expect(content).toBeNull();
    });
  });

  describe("fama_workflow_init equivalent", () => {
    it("should initialize workflow and return summary", () => {
      const engine = new WorkflowEngine(TEST_DIR);
      engine.init("test-feature", ProjectScale.MEDIUM);
      const summary = engine.getSummary();

      expect(summary).toContain("test-feature");
      expect(summary).toContain("MEDIUM");
    });
  });

  describe("fama_workflow_status equivalent", () => {
    it("should return summary for existing workflow", () => {
      const engine = new WorkflowEngine(TEST_DIR);
      engine.init("test", ProjectScale.SMALL);
      const summary = engine.getSummary();

      expect(summary).toContain("test");
      expect(summary).toContain("P");
    });
  });

  describe("fama_workflow_advance equivalent", () => {
    it("should advance workflow phase", async () => {
      const engine = new WorkflowEngine(TEST_DIR);
      engine.init("test", ProjectScale.SMALL);

      const result = await engine.advance();
      expect(result).not.toBeNull();

      const summary = engine.getSummary();
      expect(summary).toContain("E");
    });
  });
});
