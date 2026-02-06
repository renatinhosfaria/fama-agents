import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
  createEmptyManifold,
  loadManifold,
  loadManifoldWithDetails,
  saveManifold,
  saveManifoldWithDetails,
  addOutputToManifold,
  selectContextForPhase,
  formatManifoldContext,
  updateStackInfo,
  updateCodebaseSummary,
  addConstraint,
  resolveIssue,
  getUnresolvedIssues,
  getAllDecisions,
  getArtifact,
  getFileArtifacts,
  convertLegacyOutput,
  computeHash,
  ManifoldError,
  MANIFOLD_VERSION,
  MANIFOLD_FILENAME,
  type ContextManifold,
} from "../../src/core/context-manifold.js";
import {
  createSuccessOutput,
  addDecision,
  addIssue,
  addArtifact,
} from "../../src/core/output-protocol.js";
import type { WorkflowState } from "../../src/core/types.js";

describe("context-manifold", () => {
  let testDir: string;

  const mockWorkflowState: WorkflowState = {
    id: "test-workflow",
    task: "Test task",
    startedAt: new Date().toISOString(),
    currentPhase: "P",
    phases: {
      P: { status: "pending", outputs: [], startedAt: null },
      R: { status: "pending", outputs: [], startedAt: null },
      E: { status: "pending", outputs: [], startedAt: null },
      V: { status: "pending", outputs: [], startedAt: null },
      C: { status: "pending", outputs: [], startedAt: null },
    },
  };

  beforeEach(() => {
    // Create unique directory for each test
    testDir = join(process.cwd(), ".test-manifold-" + Date.now() + "-" + Math.random().toString(36).slice(2));
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe("computeHash", () => {
    it("should compute consistent hash for same content", () => {
      const hash1 = computeHash("test content");
      const hash2 = computeHash("test content");

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(8);
    });

    it("should compute different hashes for different content", () => {
      const hash1 = computeHash("content A");
      const hash2 = computeHash("content B");

      expect(hash1).not.toBe(hash2);
    });
  });

  describe("createEmptyManifold", () => {
    it("should create manifold with correct structure", () => {
      const manifold = createEmptyManifold("test-workflow", mockWorkflowState);

      expect(manifold.version).toBe(MANIFOLD_VERSION);
      expect(manifold.workflowName).toBe("test-workflow");
      expect(manifold.phases.P).toEqual([]);
      expect(manifold.phases.R).toEqual([]);
      expect(manifold.phases.E).toEqual([]);
      expect(manifold.phases.V).toEqual([]);
      expect(manifold.phases.C).toEqual([]);
      expect(manifold.globals.workflowState).toBe(mockWorkflowState);
      expect(manifold.globals.activeConstraints).toEqual([]);
      expect(manifold.artifacts).toEqual({});
    });

    it("should set updatedAt timestamp", () => {
      const manifold = createEmptyManifold("test", mockWorkflowState);

      expect(manifold.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe("loadManifold / saveManifold", () => {
    it("should return null for non-existent manifold", () => {
      const manifold = loadManifold(testDir);

      expect(manifold).toBeNull();
    });

    it("should save and load manifold correctly", () => {
      const original = createEmptyManifold("test", mockWorkflowState);
      saveManifold(testDir, original);

      const loaded = loadManifold(testDir);

      expect(loaded).not.toBeNull();
      expect(loaded!.workflowName).toBe("test");
      expect(loaded!.version).toBe(MANIFOLD_VERSION);
    });

    it("should create .fama directory if needed", () => {
      const manifold = createEmptyManifold("test", mockWorkflowState);
      saveManifold(testDir, manifold);

      expect(existsSync(join(testDir, ".fama"))).toBe(true);
    });

    it("should update timestamp on save", () => {
      const manifold = createEmptyManifold("test", mockWorkflowState);
      const originalTimestamp = manifold.updatedAt;

      // Wait a tiny bit to ensure timestamp changes
      const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
      return delay(10).then(() => {
        saveManifold(testDir, manifold);
        const loaded = loadManifold(testDir);

        expect(loaded!.updatedAt).not.toBe(originalTimestamp);
      });
    });
  });

  describe("loadManifoldWithDetails", () => {
    it("should return FILE_NOT_FOUND for missing file", () => {
      const result = loadManifoldWithDetails(testDir);

      expect(result.manifold).toBeNull();
      expect(result.error?.code).toBe("FILE_NOT_FOUND");
    });

    it("should return PARSE_ERROR for invalid JSON", () => {
      mkdirSync(join(testDir, ".fama"), { recursive: true });
      writeFileSync(join(testDir, ".fama", MANIFOLD_FILENAME), "invalid json{");

      const result = loadManifoldWithDetails(testDir);

      expect(result.manifold).toBeNull();
      expect(result.error?.code).toBe("PARSE_ERROR");
    });

    it("should return VALIDATION_ERROR for missing required fields", () => {
      mkdirSync(join(testDir, ".fama"), { recursive: true });
      writeFileSync(
        join(testDir, ".fama", MANIFOLD_FILENAME),
        JSON.stringify({ version: "1.0.0" }), // Missing phases and globals
      );

      const result = loadManifoldWithDetails(testDir);

      expect(result.manifold).toBeNull();
      expect(result.error?.code).toBe("VALIDATION_ERROR");
    });

    it("should return success for valid manifold", () => {
      const manifold = createEmptyManifold("test", mockWorkflowState);
      saveManifold(testDir, manifold);

      const result = loadManifoldWithDetails(testDir);

      expect(result.success).toBe(true);
      expect(result.manifold).not.toBeNull();
      expect(result.error).toBeUndefined();
    });
  });

  describe("saveManifoldWithDetails", () => {
    it("should return success when saving", () => {
      const manifold = createEmptyManifold("test", mockWorkflowState);
      const result = saveManifoldWithDetails(testDir, manifold);

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  describe("addOutputToManifold", () => {
    it("should add entry to correct phase", () => {
      const manifold = createEmptyManifold("test", mockWorkflowState);
      const output = createSuccessOutput("architect", "P", "Designed system", {});

      const updated = addOutputToManifold(manifold, "P", output);

      expect(updated.phases.P).toHaveLength(1);
      expect(updated.phases.P[0].agent).toBe("architect");
      expect(updated.phases.P[0].summary).toBe("Designed system");
    });

    it("should convert decisions and issues", () => {
      const manifold = createEmptyManifold("test", mockWorkflowState);
      let output = createSuccessOutput("architect", "P", "Summary", {});
      output = addDecision(output, {
        id: "d1",
        decision: "Use PostgreSQL",
        rationale: "ACID compliance",
        alternativesConsidered: ["MongoDB"],
        reversibility: "hard",
      });
      output = addIssue(output, {
        id: "i1",
        description: "Missing tests",
        severity: "medium",
      });

      const updated = addOutputToManifold(manifold, "P", output);

      expect(updated.phases.P[0].decisions).toHaveLength(1);
      expect(updated.phases.P[0].decisions[0].id).toBe("d1");
      expect(updated.phases.P[0].issues).toHaveLength(1);
      expect(updated.phases.P[0].issues[0].id).toBe("i1");
      expect(updated.phases.P[0].issues[0].resolved).toBe(false);
    });

    it("should register artifacts with deduplication", () => {
      const manifold = createEmptyManifold("test", mockWorkflowState);
      let output = createSuccessOutput("architect", "P", "Summary", {});
      output = addArtifact(output, {
        type: "file",
        path: "src/index.ts",
        content: "export {}",
      });

      const updated = addOutputToManifold(manifold, "P", output);

      expect(Object.keys(updated.artifacts)).toHaveLength(1);
      expect(updated.phases.P[0].artifactKeys).toHaveLength(1);
    });

    it("should not duplicate artifacts with same hash", () => {
      let manifold = createEmptyManifold("test", mockWorkflowState);

      let output1 = createSuccessOutput("architect", "P", "Summary 1", {});
      output1 = addArtifact(output1, {
        type: "file",
        path: "src/index.ts",
        content: "same content",
        hash: "abc12345",
      });

      let output2 = createSuccessOutput("developer", "E", "Summary 2", {});
      output2 = addArtifact(output2, {
        type: "file",
        path: "src/other.ts",
        content: "same content",
        hash: "abc12345",
      });

      manifold = addOutputToManifold(manifold, "P", output1);
      manifold = addOutputToManifold(manifold, "E", output2);

      // Only one artifact due to deduplication
      expect(Object.keys(manifold.artifacts)).toHaveLength(1);
    });
  });

  describe("selectContextForPhase", () => {
    it("should return empty context for phase P", () => {
      const manifold = createEmptyManifold("test", mockWorkflowState);
      const selected = selectContextForPhase(manifold, "P", 10000);

      expect(selected.entries).toHaveLength(0);
      expect(selected.totalTokens).toBe(0);
    });

    it("should include previous phase entries", () => {
      let manifold = createEmptyManifold("test", mockWorkflowState);
      const output = createSuccessOutput("architect", "P", "Designed system", {});
      manifold = addOutputToManifold(manifold, "P", output);

      const selected = selectContextForPhase(manifold, "R", 10000);

      expect(selected.entries).toHaveLength(1);
      expect(selected.entries[0].agent).toBe("architect");
    });

    it("should skip entries over budget", () => {
      let manifold = createEmptyManifold("test", mockWorkflowState);

      // Add many entries
      for (let i = 0; i < 10; i++) {
        const output = createSuccessOutput("agent", "P", `Summary ${i} with more words`, {});
        manifold = addOutputToManifold(manifold, "P", output);
      }

      const selected = selectContextForPhase(manifold, "E", 50); // Very small budget

      expect(selected.entries.length).toBeLessThan(10);
      expect(selected.skippedCount).toBeGreaterThan(0);
    });

    it("should always include critical/high issues", () => {
      let manifold = createEmptyManifold("test", mockWorkflowState);
      let output = createSuccessOutput("reviewer", "R", "Found issues", {});
      output = addIssue(output, {
        id: "critical1",
        description: "Security vulnerability",
        severity: "critical",
      });
      manifold = addOutputToManifold(manifold, "R", output);

      const selected = selectContextForPhase(manifold, "V", 10000);

      expect(selected.blockingIssues).toHaveLength(1);
      expect(selected.blockingIssues[0].id).toBe("critical1");
    });

    it("should always include hard/irreversible decisions", () => {
      let manifold = createEmptyManifold("test", mockWorkflowState);
      let output = createSuccessOutput("architect", "P", "Made decisions", {});
      output = addDecision(output, {
        id: "d1",
        decision: "Database choice",
        rationale: "ACID needed",
        alternativesConsidered: [],
        reversibility: "irreversible",
      });
      manifold = addOutputToManifold(manifold, "P", output);

      const selected = selectContextForPhase(manifold, "E", 10000);

      expect(selected.keyDecisions).toHaveLength(1);
      expect(selected.keyDecisions[0].id).toBe("d1");
    });
  });

  describe("formatManifoldContext", () => {
    it("should format context for prompt", () => {
      let manifold = createEmptyManifold("test", mockWorkflowState);
      const output = createSuccessOutput("architect", "P", "Designed 3-layer architecture", {});
      manifold = addOutputToManifold(manifold, "P", output);

      const selected = selectContextForPhase(manifold, "E", 10000);
      const formatted = formatManifoldContext(selected, manifold);

      expect(formatted).toContain("[CONTEXT_MANIFOLD]");
      expect(formatted).toContain("PREV_OUTPUTS:");
      expect(formatted).toContain("architect");
    });

    it("should include blocking issues first", () => {
      let manifold = createEmptyManifold("test", mockWorkflowState);
      let output = createSuccessOutput("reviewer", "R", "Found issues", {});
      output = addIssue(output, {
        id: "critical1",
        description: "Critical security issue",
        severity: "critical",
      });
      manifold = addOutputToManifold(manifold, "R", output);

      const selected = selectContextForPhase(manifold, "V", 10000);
      const formatted = formatManifoldContext(selected, manifold);

      expect(formatted).toContain("BLOCKING:");
      expect(formatted).toContain("CRITICAL");
    });

    it("should show skipped count", () => {
      let manifold = createEmptyManifold("test", mockWorkflowState);
      for (let i = 0; i < 10; i++) {
        const output = createSuccessOutput("agent", "P", `Summary ${i} with more words here`, {});
        manifold = addOutputToManifold(manifold, "P", output);
      }

      const selected = selectContextForPhase(manifold, "E", 50);
      const formatted = formatManifoldContext(selected, manifold);

      expect(formatted).toContain("entries omitted due to token budget");
    });
  });

  describe("global context updates", () => {
    it("updateStackInfo should update stack", () => {
      const manifold = createEmptyManifold("test", mockWorkflowState);
      const updated = updateStackInfo(manifold, {
        languages: ["typescript"],
        frameworks: ["react"],
        databases: ["postgresql"],
        tools: ["vite"],
      });

      expect(updated.globals.projectStack).toBeDefined();
      expect(updated.globals.projectStack!.languages).toContain("typescript");
    });

    it("updateCodebaseSummary should update summary", () => {
      const manifold = createEmptyManifold("test", mockWorkflowState);
      const updated = updateCodebaseSummary(manifold, {
        architecture: "monolith",
        entryPoints: ["src/index.ts"],
        keyModules: ["core", "utils"],
      });

      expect(updated.globals.codebaseSummary).toBeDefined();
      expect(updated.globals.codebaseSummary!.architecture).toBe("monolith");
    });

    it("addConstraint should add unique constraints", () => {
      let manifold = createEmptyManifold("test", mockWorkflowState);
      manifold = addConstraint(manifold, "Must use TypeScript");
      manifold = addConstraint(manifold, "Must have 80% coverage");
      manifold = addConstraint(manifold, "Must use TypeScript"); // Duplicate

      expect(manifold.globals.activeConstraints).toHaveLength(2);
    });
  });

  describe("resolveIssue", () => {
    it("should mark issue as resolved across all phases", () => {
      let manifold = createEmptyManifold("test", mockWorkflowState);
      let output = createSuccessOutput("reviewer", "R", "Found issues", {});
      output = addIssue(output, {
        id: "issue1",
        description: "Test issue",
        severity: "medium",
      });
      manifold = addOutputToManifold(manifold, "R", output);

      const updated = resolveIssue(manifold, "issue1");

      expect(updated.phases.R[0].issues[0].resolved).toBe(true);
    });
  });

  describe("query utilities", () => {
    let manifold: ContextManifold;

    beforeEach(() => {
      manifold = createEmptyManifold("test", mockWorkflowState);

      let output1 = createSuccessOutput("reviewer", "R", "Review 1", {});
      output1 = addDecision(output1, {
        id: "d1",
        decision: "Decision 1",
        rationale: "Reason 1",
        alternativesConsidered: [],
        reversibility: "easy",
      });
      output1 = addIssue(output1, {
        id: "i1",
        description: "Issue 1",
        severity: "medium",
      });
      output1 = addArtifact(output1, {
        type: "file",
        path: "src/file1.ts",
        content: "code 1",
      });
      manifold = addOutputToManifold(manifold, "R", output1);

      let output2 = createSuccessOutput("developer", "E", "Dev 1", {});
      output2 = addIssue(output2, {
        id: "i2",
        description: "Issue 2",
        severity: "low",
      });
      manifold = addOutputToManifold(manifold, "E", output2);
    });

    it("getUnresolvedIssues should return all unresolved", () => {
      const issues = getUnresolvedIssues(manifold);

      expect(issues).toHaveLength(2);
      expect(issues.some((i) => i.id === "i1")).toBe(true);
      expect(issues.some((i) => i.id === "i2")).toBe(true);
    });

    it("getAllDecisions should return all decisions", () => {
      const decisions = getAllDecisions(manifold);

      expect(decisions).toHaveLength(1);
      expect(decisions[0].id).toBe("d1");
    });

    it("getArtifact should return artifact by hash", () => {
      const hash = Object.keys(manifold.artifacts)[0];
      const artifact = getArtifact(manifold, hash);

      expect(artifact).not.toBeNull();
      expect(artifact!.type).toBe("file");
    });

    it("getArtifact should return null for unknown hash", () => {
      const artifact = getArtifact(manifold, "unknown");

      expect(artifact).toBeNull();
    });

    it("getFileArtifacts should return only file artifacts", () => {
      const files = getFileArtifacts(manifold);

      expect(files.length).toBeGreaterThan(0);
      expect(files.every((a) => a.type === "file")).toBe(true);
    });
  });

  describe("convertLegacyOutput", () => {
    it("should convert legacy format to manifold entry", () => {
      const legacy = {
        agent: "architect",
        task: "Design system",
        resultSummary: "Designed a 3-layer architecture with REST API",
        artifacts: ["docs/arch.md"],
        timestamp: "2024-01-15T10:00:00Z",
      };

      const entry = convertLegacyOutput(legacy, "P");

      expect(entry.agent).toBe("architect");
      expect(entry.summary.length).toBeLessThanOrEqual(100);
      expect(entry.decisions).toEqual([]);
      expect(entry.issues).toEqual([]);
    });

    it("should truncate long summaries to 100 chars", () => {
      const legacy = {
        agent: "architect",
        task: "Design system",
        resultSummary: "A".repeat(200),
        artifacts: [],
        timestamp: "2024-01-15T10:00:00Z",
      };

      const entry = convertLegacyOutput(legacy, "P");

      expect(entry.summary).toHaveLength(100);
    });
  });

  describe("ManifoldError", () => {
    it("should create error with all properties", () => {
      const error = new ManifoldError("Test error", "PARSE_ERROR", "/path/to/file", new Error("cause"));

      expect(error.message).toBe("Test error");
      expect(error.code).toBe("PARSE_ERROR");
      expect(error.filePath).toBe("/path/to/file");
      expect(error.cause).toBeDefined();
      expect(error.name).toBe("ManifoldError");
    });
  });
});
