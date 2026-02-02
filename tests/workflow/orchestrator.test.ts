import { describe, it, expect, beforeEach, afterEach, afterAll } from "vitest";
import { resolve } from "node:path";
import { mkdirSync, rmSync, existsSync } from "node:fs";
import { WorkflowOrchestrator } from "../../src/workflow/orchestrator.js";
import { ProjectScale } from "../../src/core/types.js";

const BASE_TEST_DIR = resolve(
  import.meta.dirname,
  "..",
  "fixtures",
  "orchestrator-test",
);
let TEST_DIR: string;
let testCounter = 0;

describe("WorkflowOrchestrator", () => {
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

  it("should initialize workflow with correct phases for MEDIUM scale", () => {
    const orch = new WorkflowOrchestrator(TEST_DIR);
    const state = orch.init("test-feature", ProjectScale.MEDIUM);

    expect(state.name).toBe("test-feature");
    expect(state.scale).toBe(ProjectScale.MEDIUM);
    expect(state.currentPhase).toBe("P");
    expect(state.phases["P"].status).toBe("in_progress");
    expect(state.phases["R"].status).toBe("pending");
    expect(state.phases["E"].status).toBe("pending");
    expect(state.phases["V"].status).toBe("pending");
    expect(state.phases["C"].status).toBe("skipped");
  });

  it("should initialize QUICK scale with only E and V", () => {
    const orch = new WorkflowOrchestrator(TEST_DIR);
    const state = orch.init("hotfix", ProjectScale.QUICK);

    expect(state.currentPhase).toBe("E");
    expect(state.phases["P"].status).toBe("skipped");
    expect(state.phases["R"].status).toBe("skipped");
    expect(state.phases["E"].status).toBe("in_progress");
    expect(state.phases["V"].status).toBe("pending");
    expect(state.phases["C"].status).toBe("skipped");
  });

  it("should return null from getState when no workflow exists", () => {
    const orch = new WorkflowOrchestrator(TEST_DIR);
    expect(orch.getState()).toBeNull();
  });

  it("should advance to next phase", async () => {
    const orch = new WorkflowOrchestrator(TEST_DIR);
    orch.init("test", ProjectScale.SMALL);

    // SMALL: P → E → V
    const result = await orch.advance();
    expect(result).not.toBeNull();
    expect(result!.phase).toBe("E");
    expect(result!.state.phases["P"].status).toBe("completed");
    expect(result!.state.phases["E"].status).toBe("in_progress");
  });

  it("should advance after completing current phase with requirePlan gate", async () => {
    const orch = new WorkflowOrchestrator(TEST_DIR, { requirePlan: true, requireApproval: false });
    orch.init("test", ProjectScale.MEDIUM);

    // MEDIUM: P → R → E → V
    // Complete P first so the gate passes
    orch.completeCurrentPhase();
    const result = await orch.advance();
    expect(result).not.toBeNull();
    expect(result!.phase).toBe("R");
  });

  it("should complete current phase without advancing", () => {
    const orch = new WorkflowOrchestrator(TEST_DIR);
    orch.init("test", ProjectScale.MEDIUM);

    const state = orch.completeCurrentPhase();
    expect(state).not.toBeNull();
    expect(state!.phases["P"].status).toBe("completed");
    expect(state!.phases["P"].completedAt).toBeDefined();
    expect(state!.currentPhase).toBe("P"); // Still on P, not advanced
  });

  it("should append output to a phase", () => {
    const orch = new WorkflowOrchestrator(TEST_DIR);
    orch.init("test", ProjectScale.MEDIUM);

    const state = orch.appendOutput("P", "/path/to/run-record.json");
    expect(state).not.toBeNull();
    expect(state!.phases["P"].outputs).toContain("/path/to/run-record.json");
  });

  it("should return recommended agents for current phase", () => {
    const orch = new WorkflowOrchestrator(TEST_DIR);
    orch.init("test", ProjectScale.MEDIUM);

    const agents = orch.getRecommendedAgents();
    expect(agents.length).toBeGreaterThan(0);
    expect(agents).toContain("architect");
  });

  it("should detect workflow completion", async () => {
    const orch = new WorkflowOrchestrator(TEST_DIR);
    orch.init("test", ProjectScale.QUICK); // E → V

    expect(orch.isComplete()).toBe(false);
    orch.completeCurrentPhase(); // Complete E
    await orch.advance(); // E → V (starts V)
    expect(orch.isComplete()).toBe(false);
    orch.completeCurrentPhase(); // Complete V
    const last = await orch.advance(); // Should return null (last phase, auto-completes)
    expect(last).toBeNull();
    expect(orch.isComplete()).toBe(true);
  });
});
