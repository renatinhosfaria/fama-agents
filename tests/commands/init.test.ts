import { describe, it, expect, vi, beforeEach, afterEach, afterAll } from "vitest";
import { resolve } from "node:path";
import { mkdirSync, rmSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { initCommand } from "../../src/commands/init.js";

const BASE_TEST_DIR = resolve(
  import.meta.dirname,
  "..",
  "fixtures",
  "init-test",
);
let TEST_DIR: string;
let testCounter = 0;

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

describe("initCommand", () => {
  it("should create .fama.yaml and directories", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    initCommand({ cwd: TEST_DIR });

    expect(existsSync(resolve(TEST_DIR, ".fama.yaml"))).toBe(true);
    expect(existsSync(resolve(TEST_DIR, "skills"))).toBe(true);
    expect(existsSync(resolve(TEST_DIR, "agents"))).toBe(true);

    const content = readFileSync(resolve(TEST_DIR, ".fama.yaml"), "utf-8");
    expect(content).toContain("model: sonnet");
    expect(content).toContain("maxTurns: 50");

    consoleSpy.mockRestore();
  });

  it("should warn and skip when config already exists", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    writeFileSync(resolve(TEST_DIR, ".fama.yaml"), "existing: true", "utf-8");

    initCommand({ cwd: TEST_DIR });

    const content = readFileSync(resolve(TEST_DIR, ".fama.yaml"), "utf-8");
    expect(content).toBe("existing: true");

    consoleSpy.mockRestore();
  });

  it("should overwrite with --force", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    writeFileSync(resolve(TEST_DIR, ".fama.yaml"), "existing: true", "utf-8");

    initCommand({ cwd: TEST_DIR, force: true });

    const content = readFileSync(resolve(TEST_DIR, ".fama.yaml"), "utf-8");
    expect(content).toContain("model: sonnet");
    expect(content).not.toContain("existing: true");

    consoleSpy.mockRestore();
  });
});
