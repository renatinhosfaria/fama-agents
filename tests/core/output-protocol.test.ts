import { describe, it, expect } from "vitest";
import {
  createSuccessOutput,
  createErrorOutput,
  addArtifact,
  addDecision,
  addIssue,
  parseStructuredOutput,
  parseStructuredOutputWithDetails,
  isStructuredOutput,
  serializeCompact,
  serializeReadable,
  CURRENT_SCHEMA_VERSION,
  type StructuredAgentOutput,
} from "../../src/core/output-protocol.js";

describe("output-protocol", () => {
  describe("createSuccessOutput", () => {
    it("should create a valid structured output", () => {
      const output = createSuccessOutput("architect", "P", "Designed system", { design: "ok" });

      expect(output.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
      expect(output.meta.agent).toBe("architect");
      expect(output.meta.phase).toBe("P");
      expect(output.result.status).toBe("success");
      expect(output.result.summary).toBe("Designed system");
      expect(output.result.content).toEqual({ design: "ok" });
      expect(output.artifacts).toEqual([]);
      expect(output.decisions).toEqual([]);
      expect(output.issues).toEqual([]);
    });

    it("should truncate long summaries to 200 chars", () => {
      const longSummary = "A".repeat(300);
      const output = createSuccessOutput("architect", "P", longSummary, {});

      expect(output.result.summary.length).toBeLessThanOrEqual(203); // 200 + "..."
      expect(output.result.summary.endsWith("...")).toBe(true);
    });

    it("should preserve short summaries", () => {
      const shortSummary = "Short summary";
      const output = createSuccessOutput("architect", "P", shortSummary, {});

      expect(output.result.summary).toBe(shortSummary);
    });

    it("should set timestamp to ISO format", () => {
      const output = createSuccessOutput("architect", "P", "Summary", {});

      expect(output.meta.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe("createErrorOutput", () => {
    it("should create an error output with critical issue", () => {
      const output = createErrorOutput("architect", "P", "Something went wrong");

      expect(output.result.status).toBe("error");
      expect(output.result.content).toEqual({ error: "Something went wrong" });
      expect(output.issues).toHaveLength(1);
      expect(output.issues[0].severity).toBe("critical");
      expect(output.handoff.blockingIssues).toContain("execution-error");
    });

    it("should truncate long error messages in summary", () => {
      const longError = "E".repeat(300);
      const output = createErrorOutput("architect", "P", longError);

      expect(output.result.summary.length).toBeLessThanOrEqual(203);
    });
  });

  describe("addArtifact", () => {
    it("should add artifact to output immutably", () => {
      const original = createSuccessOutput("architect", "P", "Summary", {});
      const updated = addArtifact(original, {
        type: "file",
        path: "src/index.ts",
        hash: "abc12345",
      });

      expect(original.artifacts).toHaveLength(0);
      expect(updated.artifacts).toHaveLength(1);
      expect(updated.artifacts[0].path).toBe("src/index.ts");
    });
  });

  describe("addDecision", () => {
    it("should add decision to output immutably", () => {
      const original = createSuccessOutput("architect", "P", "Summary", {});
      const updated = addDecision(original, {
        id: "d1",
        decision: "Use PostgreSQL",
        rationale: "ACID compliance needed",
        alternativesConsidered: ["MongoDB", "MySQL"],
        reversibility: "moderate",
      });

      expect(original.decisions).toHaveLength(0);
      expect(updated.decisions).toHaveLength(1);
      expect(updated.decisions[0].id).toBe("d1");
    });
  });

  describe("addIssue", () => {
    it("should add issue to output immutably", () => {
      const original = createSuccessOutput("architect", "P", "Summary", {});
      const updated = addIssue(original, {
        id: "i1",
        description: "Missing tests",
        severity: "medium",
      });

      expect(original.issues).toHaveLength(0);
      expect(updated.issues).toHaveLength(1);
      expect(updated.issues[0].id).toBe("i1");
    });

    it("should auto-add critical issues to blocking list", () => {
      const original = createSuccessOutput("architect", "P", "Summary", {});
      const updated = addIssue(original, {
        id: "critical1",
        description: "Security vulnerability",
        severity: "critical",
      });

      expect(updated.handoff.blockingIssues).toContain("critical1");
    });

    it("should auto-add high severity issues to blocking list", () => {
      const original = createSuccessOutput("architect", "P", "Summary", {});
      const updated = addIssue(original, {
        id: "high1",
        description: "Performance issue",
        severity: "high",
      });

      expect(updated.handoff.blockingIssues).toContain("high1");
    });

    it("should not add medium/low severity to blocking list", () => {
      const original = createSuccessOutput("architect", "P", "Summary", {});
      const updated = addIssue(original, {
        id: "low1",
        description: "Code style issue",
        severity: "low",
      });

      expect(updated.handoff.blockingIssues).not.toContain("low1");
    });
  });

  describe("parseStructuredOutput", () => {
    it("should parse valid JSON with structured output", () => {
      const validOutput = createSuccessOutput("architect", "P", "Summary", {});
      const json = JSON.stringify(validOutput);

      const parsed = parseStructuredOutput(json);

      expect(parsed).not.toBeNull();
      expect(parsed?.meta.agent).toBe("architect");
    });

    it("should parse JSON block in markdown", () => {
      const validOutput = createSuccessOutput("architect", "P", "Summary", {});
      const markdown = `Here is the output:\n\n\`\`\`json\n${JSON.stringify(validOutput)}\n\`\`\`\n\nEnd.`;

      const parsed = parseStructuredOutput(markdown);

      expect(parsed).not.toBeNull();
      expect(parsed?.meta.agent).toBe("architect");
    });

    it("should return null for invalid JSON", () => {
      const parsed = parseStructuredOutput("not json at all");

      expect(parsed).toBeNull();
    });

    it("should return null for valid JSON that doesn't match schema", () => {
      const parsed = parseStructuredOutput(JSON.stringify({ foo: "bar" }));

      expect(parsed).toBeNull();
    });

    it("should return null for missing required fields", () => {
      const partial = {
        schemaVersion: "1.0.0",
        meta: { agent: "test" },
        // missing result, artifacts, decisions, issues, handoff
      };
      const parsed = parseStructuredOutput(JSON.stringify(partial));

      expect(parsed).toBeNull();
    });

    it("should return null for invalid enum values", () => {
      const invalidStatus = createSuccessOutput("architect", "P", "Summary", {});
      (invalidStatus.result as { status: string }).status = "invalid_status";

      const parsed = parseStructuredOutput(JSON.stringify(invalidStatus));

      expect(parsed).toBeNull();
    });
  });

  describe("parseStructuredOutputWithDetails", () => {
    it("should return success with valid output", () => {
      const validOutput = createSuccessOutput("architect", "P", "Summary", {});
      const result = parseStructuredOutputWithDetails(JSON.stringify(validOutput));

      expect(result.success).toBe(true);
      expect(result.output).not.toBeNull();
      expect(result.error).toBeUndefined();
    });

    it("should return JSON error for invalid JSON", () => {
      const result = parseStructuredOutputWithDetails("not json");

      expect(result.success).toBe(false);
      expect(result.output).toBeNull();
      expect(result.error?.type).toBe("json");
    });

    it("should return validation error with issues for invalid schema", () => {
      const invalid = { schemaVersion: "1.0.0", meta: {}, result: {} };
      const result = parseStructuredOutputWithDetails(JSON.stringify(invalid));

      expect(result.success).toBe(false);
      expect(result.output).toBeNull();
      expect(result.error?.type).toBe("validation");
      expect(result.error?.issues).toBeDefined();
      expect(result.error!.issues!.length).toBeGreaterThan(0);
    });

    it("should report specific validation paths", () => {
      const missing = {
        schemaVersion: "1.0.0",
        meta: { agent: "test", phase: "INVALID_PHASE", timestamp: "2024-01-01", tokensUsed: 0, skill: null },
        result: { status: "success", summary: "ok", content: {} },
        artifacts: [],
        decisions: [],
        issues: [],
        handoff: { nextPhase: null, requiredContext: [], blockingIssues: [], suggestedAgents: [] },
      };
      const result = parseStructuredOutputWithDetails(JSON.stringify(missing));

      expect(result.success).toBe(false);
      expect(result.error?.issues?.some((i) => i.path.includes("meta"))).toBe(true);
    });
  });

  describe("isStructuredOutput", () => {
    it("should return true for valid structured output", () => {
      const output = createSuccessOutput("architect", "P", "Summary", {});

      expect(isStructuredOutput(output)).toBe(true);
    });

    it("should return false for null", () => {
      expect(isStructuredOutput(null)).toBe(false);
    });

    it("should return false for non-object", () => {
      expect(isStructuredOutput("string")).toBe(false);
      expect(isStructuredOutput(123)).toBe(false);
      expect(isStructuredOutput([])).toBe(false);
    });

    it("should return false for missing required fields", () => {
      expect(isStructuredOutput({ schemaVersion: "1.0.0" })).toBe(false);
      expect(isStructuredOutput({ meta: {}, result: {} })).toBe(false);
    });
  });

  describe("serialization", () => {
    it("serializeCompact should produce minified JSON", () => {
      const output = createSuccessOutput("architect", "P", "Summary", {});
      const compact = serializeCompact(output);

      expect(compact).not.toContain("\n");
      expect(compact).not.toContain("  ");
    });

    it("serializeReadable should produce formatted JSON", () => {
      const output = createSuccessOutput("architect", "P", "Summary", {});
      const readable = serializeReadable(output);

      expect(readable).toContain("\n");
      expect(readable).toContain("  ");
    });

    it("should be round-trippable", () => {
      const output = createSuccessOutput("architect", "P", "Summary", { data: [1, 2, 3] });
      const compact = serializeCompact(output);
      const parsed = parseStructuredOutput(compact);

      expect(parsed).toEqual(output);
    });
  });
});
