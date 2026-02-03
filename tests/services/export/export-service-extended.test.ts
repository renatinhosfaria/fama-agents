import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mkdtempSync, existsSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  sanitizeSlug,
  generateExport,
  generateExports,
  writeExportFiles,
} from "../../../src/services/export/export-service.js";
import type { ExportContext, ExportResult } from "../../../src/services/export/types.js";
import { ProjectScale } from "../../../src/core/types.js";

vi.mock("../../../src/utils/logger.js", () => ({
  log: { info: vi.fn(), success: vi.fn(), warn: vi.fn(), error: vi.fn(), dim: vi.fn() },
}));

let tempDir: string;

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), "fama-export-test-"));
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

describe("sanitizeSlug", () => {
  it("should pass through valid slugs", () => {
    expect(sanitizeSlug("architect")).toBe("architect");
    expect(sanitizeSlug("test-writer")).toBe("test-writer");
  });

  it("should strip path separators", () => {
    expect(sanitizeSlug("../../evil")).toBe("evil");
    expect(sanitizeSlug("path/to/agent")).toBe("agent");
  });

  it("should replace special characters with dashes", () => {
    expect(sanitizeSlug("my agent!@#")).toBe("my-agent---");
  });

  it("should handle empty string", () => {
    expect(sanitizeSlug("")).toBe("");
  });
});

describe("generateExport", () => {
  const context: ExportContext = {
    agents: [],
    skills: [],
    config: {
      model: "sonnet",
      maxTurns: 50,
      lang: "pt-BR",
      skillsDir: "skills",
      workflow: { defaultScale: ProjectScale.MEDIUM, gates: { requirePlan: true, requireApproval: false } },
    },
    projectDir: tempDir,
  };

  it("should generate export for known preset", () => {
    const result = generateExport("copilot", context);
    expect(result.files.length).toBeGreaterThan(0);
    expect(result.summary).toBeTruthy();
  });

  it("should throw for unknown preset", () => {
    expect(() => generateExport("nonexistent-preset", context)).toThrow("Unknown export preset");
  });
});

describe("generateExports", () => {
  const context: ExportContext = {
    agents: [],
    skills: [],
    config: {
      model: "sonnet",
      maxTurns: 50,
      lang: "pt-BR",
      skillsDir: "skills",
      workflow: { defaultScale: ProjectScale.MEDIUM, gates: { requirePlan: true, requireApproval: false } },
    },
    projectDir: tempDir,
  };

  it("should generate for multiple presets", () => {
    const result = generateExports(["copilot", "windsurf"], context);
    expect(result.files.length).toBeGreaterThanOrEqual(2);
  });

  it("should generate for all presets when 'all' is passed", () => {
    const result = generateExports(["all"], context);
    expect(result.files.length).toBeGreaterThanOrEqual(3);
  });

  it("should combine summaries", () => {
    const result = generateExports(["copilot", "windsurf"], context);
    expect(result.summary).toContain("copilot");
    expect(result.summary).toContain("windsurf");
  });
});

describe("writeExportFiles", () => {
  const result: ExportResult = {
    files: [
      { path: "output/test-file.md", content: "# Test Content" },
      { path: "another-file.txt", content: "Hello" },
    ],
    summary: "Test export",
  };

  it("should write files to disk", () => {
    const written = writeExportFiles(result, tempDir);
    expect(written).toHaveLength(2);
    expect(existsSync(join(tempDir, "output", "test-file.md"))).toBe(true);
    expect(readFileSync(join(tempDir, "output", "test-file.md"), "utf-8")).toBe("# Test Content");
    expect(existsSync(join(tempDir, "another-file.txt"))).toBe(true);
  });

  it("should create nested directories as needed", () => {
    const deepResult: ExportResult = {
      files: [{ path: "a/b/c/deep.md", content: "deep" }],
      summary: "",
    };
    writeExportFiles(deepResult, tempDir);
    expect(existsSync(join(tempDir, "a", "b", "c", "deep.md"))).toBe(true);
  });

  it("should not write files in dry run mode", () => {
    const written = writeExportFiles(result, tempDir, true);
    expect(written).toHaveLength(2);
    expect(existsSync(join(tempDir, "output", "test-file.md"))).toBe(false);
  });

  it("should prevent path traversal", () => {
    const evilResult: ExportResult = {
      files: [{ path: "../../etc/passwd", content: "evil" }],
      summary: "",
    };
    expect(() => writeExportFiles(evilResult, tempDir)).toThrow("escapes project directory");
  });
});
