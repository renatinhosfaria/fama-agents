import { describe, it, expect, beforeEach, afterEach, afterAll } from "vitest";
import { resolve } from "node:path";
import { mkdirSync, rmSync, existsSync } from "node:fs";
import { WorkflowEngine } from "../../src/core/workflow-engine.js";
import { ProjectScale } from "../../src/core/types.js";

const BASE_TEST_DIR = resolve(import.meta.dirname, "..", "fixtures", "workflow-test");
let TEST_DIR: string;
let testCounter = 0;

describe("WorkflowEngine", () => {
  beforeEach(() => {
    testCounter++;
    TEST_DIR = resolve(BASE_TEST_DIR, `run-${testCounter}-${Date.now()}`);
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true, force: true, maxRetries: 3 });
  });

  afterAll(() => {
    if (existsSync(BASE_TEST_DIR)) rmSync(BASE_TEST_DIR, { recursive: true, force: true, maxRetries: 3 });
  });

  it("should initialize a workflow", () => {
    const engine = new WorkflowEngine(TEST_DIR);
    const state = engine.init("test-feature", ProjectScale.MEDIUM);

    expect(state.name).toBe("test-feature");
    expect(state.scale).toBe(ProjectScale.MEDIUM);
    expect(state.currentPhase).toBe("P");
    expect(state.phases.P.status).toBe("in_progress");
    expect(state.phases.C.status).toBe("skipped"); // MEDIUM skips C
  });

  it("should check if workflow exists", () => {
    const engine = new WorkflowEngine(TEST_DIR);
    // beforeEach cleans TEST_DIR, so no workflow should exist yet
    expect(engine.exists()).toBe(false);

    engine.init("test", ProjectScale.SMALL);
    expect(engine.exists()).toBe(true);
  });

  it("should advance phases for SMALL scale", async () => {
    const engine = new WorkflowEngine(TEST_DIR);
    engine.init("test", ProjectScale.SMALL);

    // SMALL: P → E → V
    expect(engine.getStatus()?.currentPhase).toBe("P");

    // Complete P and advance to E
    engine.completeCurrent();
    const result1 = await engine.advance();
    expect(result1?.phase).toBe("E");

    // Complete E and advance to V
    engine.completeCurrent();
    const result2 = await engine.advance();
    expect(result2?.phase).toBe("V");

    // Complete V - workflow done
    engine.completeCurrent();
    const result3 = await engine.advance();
    expect(result3).toBeNull();
    expect(engine.isComplete()).toBe(true);
  });

  it("should get recommended agents for current phase", () => {
    const engine = new WorkflowEngine(TEST_DIR);
    engine.init("test", ProjectScale.MEDIUM);

    const agents = engine.getRecommendedAgents();
    expect(agents).toContain("architect");
  });

  it("should generate a summary", () => {
    const engine = new WorkflowEngine(TEST_DIR);
    engine.init("test", ProjectScale.MEDIUM);

    const summary = engine.getSummary();
    expect(summary).toContain("test");
    expect(summary).toContain("MEDIUM");
    expect(summary).toContain("Planning");
  });

  it("should handle QUICK scale (E → V only)", async () => {
    const engine = new WorkflowEngine(TEST_DIR);
    engine.init("quick-fix", ProjectScale.QUICK);

    expect(engine.getStatus()?.currentPhase).toBe("E");
    expect(engine.getStatus()?.phases.P.status).toBe("skipped");

    engine.completeCurrent();
    const result = await engine.advance();
    expect(result?.phase).toBe("V");
  });
});
