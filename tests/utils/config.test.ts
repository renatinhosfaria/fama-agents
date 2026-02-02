import { describe, it, expect, afterEach } from "vitest";
import { resolve } from "node:path";
import { mkdirSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { loadConfig } from "../../src/utils/config.js";
import { ProjectScale } from "../../src/core/types.js";

const TEST_DIR = resolve(import.meta.dirname, "..", "fixtures", "config-test");

describe("loadConfig", () => {
  afterEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true });
    delete process.env["FAMA_MODEL"];
    delete process.env["FAMA_MAX_TURNS"];
    delete process.env["FAMA_LANG"];
    delete process.env["FAMA_SKILLS_DIR"];
  });

  it("should return defaults when no config file exists", () => {
    mkdirSync(TEST_DIR, { recursive: true });
    const config = loadConfig(TEST_DIR);
    expect(config.model).toBe("sonnet");
    expect(config.maxTurns).toBe(50);
    expect(config.lang).toBe("pt-BR");
    expect(config.workflow.defaultScale).toBe(ProjectScale.MEDIUM);
    expect(config.workflow.gates.requirePlan).toBe(true);
  });

  it("should deep merge project config", () => {
    mkdirSync(TEST_DIR, { recursive: true });
    writeFileSync(
      resolve(TEST_DIR, ".fama.yaml"),
      "workflow:\n  gates:\n    requireApproval: true\n",
    );
    const config = loadConfig(TEST_DIR);
    // Deep merged: requireApproval changed, requirePlan preserved
    expect(config.workflow.gates.requireApproval).toBe(true);
    expect(config.workflow.gates.requirePlan).toBe(true);
    // Other defaults preserved
    expect(config.model).toBe("sonnet");
  });

  it("should override with environment variables", () => {
    mkdirSync(TEST_DIR, { recursive: true });
    process.env["FAMA_MODEL"] = "opus";
    process.env["FAMA_MAX_TURNS"] = "100";
    const config = loadConfig(TEST_DIR);
    expect(config.model).toBe("opus");
    expect(config.maxTurns).toBe(100);
  });

  it("should ignore invalid FAMA_MAX_TURNS", () => {
    mkdirSync(TEST_DIR, { recursive: true });
    process.env["FAMA_MAX_TURNS"] = "not-a-number";
    const config = loadConfig(TEST_DIR);
    expect(config.maxTurns).toBe(50); // default
  });

  it("should ignore negative FAMA_MAX_TURNS", () => {
    mkdirSync(TEST_DIR, { recursive: true });
    process.env["FAMA_MAX_TURNS"] = "-5";
    const config = loadConfig(TEST_DIR);
    expect(config.maxTurns).toBe(50); // default
  });

  it("should handle invalid YAML gracefully", () => {
    mkdirSync(TEST_DIR, { recursive: true });
    writeFileSync(resolve(TEST_DIR, ".fama.yaml"), ": invalid yaml [\n");
    const config = loadConfig(TEST_DIR);
    expect(config.model).toBe("sonnet"); // falls back to defaults
  });
});
