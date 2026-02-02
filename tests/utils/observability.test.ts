import { describe, it, expect, beforeEach, afterEach, afterAll } from "vitest";
import { resolve } from "node:path";
import { mkdirSync, rmSync, existsSync, readFileSync } from "node:fs";
import { createRunId, writeRunRecord, type RunRecord } from "../../src/utils/observability.js";

const BASE_TEST_DIR = resolve(
  import.meta.dirname,
  "..",
  "fixtures",
  "observability-test",
);
let TEST_DIR: string;
let testCounter = 0;

describe("observability", () => {
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

  describe("createRunId", () => {
    it("should create an id with timestamp and agent", () => {
      const id = createRunId({ agent: "architect" });
      expect(id).toMatch(/^\d{4}-?\d{2}-?\d{2}T?\d+.*-architect-[a-f0-9]{8}$/);
    });

    it("should include workflow name and phase when provided", () => {
      const id = createRunId({
        agent: "architect",
        workflowName: "My Feature",
        phase: "P",
      });
      expect(id).toContain("my-feature");
      expect(id).toContain("p");
      expect(id).toContain("architect");
    });

    it("should omit empty segments", () => {
      const id = createRunId({ agent: "test-writer" });
      // Should NOT have double dashes from empty segments
      expect(id).not.toMatch(/--/);
    });
  });

  describe("writeRunRecord", () => {
    const makeRecord = (overrides?: Partial<RunRecord>): RunRecord => ({
      status: "success",
      task: "test task",
      agent: "architect",
      skills: ["brainstorming"],
      cwd: TEST_DIR,
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
      durationMs: 1000,
      ...overrides,
    });

    it("should create .fama/runs directory and write JSON", () => {
      const record = makeRecord();
      const filePath = writeRunRecord(TEST_DIR, record);

      expect(existsSync(filePath)).toBe(true);
      const content = JSON.parse(readFileSync(filePath, "utf-8"));
      expect(content.status).toBe("success");
      expect(content.agent).toBe("architect");
      expect(content.id).toBeDefined();
    });

    it("should use provided id if given", () => {
      const record = makeRecord({ id: "custom-run-id" });
      const filePath = writeRunRecord(TEST_DIR, record);

      expect(filePath).toContain("custom-run-id.json");
      const content = JSON.parse(readFileSync(filePath, "utf-8"));
      expect(content.id).toBe("custom-run-id");
    });
  });
});
