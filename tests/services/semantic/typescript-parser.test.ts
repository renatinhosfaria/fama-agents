import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseTypeScriptFile } from "../../../src/services/semantic/parsers/typescript-parser.js";

let tempDir: string;

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), "fama-parser-test-"));
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

describe("parseTypeScriptFile", () => {
  describe("imports", () => {
    it("should extract ES module imports", () => {
      const filePath = join(tempDir, "test.ts");
      writeFileSync(
        filePath,
        `import { useState, useEffect } from "react";\nimport { resolve } from "node:path";\n`,
      );
      const result = parseTypeScriptFile(filePath);
      expect(result.imports).toContain("react");
      expect(result.imports).toContain("node:path");
    });

    it("should extract type imports", () => {
      const filePath = join(tempDir, "test.ts");
      writeFileSync(filePath, `import type { Config } from "./types.js";\n`);
      const result = parseTypeScriptFile(filePath);
      expect(result.imports).toContain("./types.js");
    });

    it("should extract default imports", () => {
      const filePath = join(tempDir, "test.ts");
      writeFileSync(filePath, `import chalk from "chalk";\n`);
      const result = parseTypeScriptFile(filePath);
      expect(result.imports).toContain("chalk");
    });

    it("should extract side-effect imports", () => {
      const filePath = join(tempDir, "test.ts");
      writeFileSync(filePath, `import "dotenv/config";\n`);
      const result = parseTypeScriptFile(filePath);
      expect(result.imports).toContain("dotenv/config");
    });

    it("should extract require calls", () => {
      const filePath = join(tempDir, "test.js");
      writeFileSync(filePath, `const fs = require("node:fs");\n`);
      const result = parseTypeScriptFile(filePath);
      expect(result.imports).toContain("node:fs");
    });

    it("should not duplicate imports", () => {
      const filePath = join(tempDir, "test.ts");
      writeFileSync(
        filePath,
        `import { a } from "module";\nimport "module";\n`,
      );
      const result = parseTypeScriptFile(filePath);
      const moduleCount = result.imports.filter((i) => i === "module").length;
      expect(moduleCount).toBe(1);
    });
  });

  describe("exports", () => {
    it("should extract named function exports", () => {
      const filePath = join(tempDir, "test.ts");
      writeFileSync(filePath, `export function loadConfig() {}\nexport async function runAgent() {}\n`);
      const result = parseTypeScriptFile(filePath);
      expect(result.exports).toContain("loadConfig");
      expect(result.exports).toContain("runAgent");
    });

    it("should extract class exports", () => {
      const filePath = join(tempDir, "test.ts");
      writeFileSync(filePath, `export class SkillRegistry {}\n`);
      const result = parseTypeScriptFile(filePath);
      expect(result.exports).toContain("SkillRegistry");
    });

    it("should extract const exports", () => {
      const filePath = join(tempDir, "test.ts");
      writeFileSync(filePath, `export const MAX_TURNS = 50;\n`);
      const result = parseTypeScriptFile(filePath);
      expect(result.exports).toContain("MAX_TURNS");
    });

    it("should extract group exports", () => {
      const filePath = join(tempDir, "test.ts");
      writeFileSync(filePath, `export { UserService, AuthGuard };\n`);
      const result = parseTypeScriptFile(filePath);
      expect(result.exports).toContain("UserService");
      expect(result.exports).toContain("AuthGuard");
    });

    it("should extract type and interface exports", () => {
      const filePath = join(tempDir, "test.ts");
      writeFileSync(
        filePath,
        `export type WorkflowPhase = "P" | "R";\nexport interface Config {}\n`,
      );
      const result = parseTypeScriptFile(filePath);
      expect(result.exports).toContain("WorkflowPhase");
      expect(result.exports).toContain("Config");
    });

    it("should extract enum exports", () => {
      const filePath = join(tempDir, "test.ts");
      writeFileSync(filePath, `export enum ProjectScale { QUICK, SMALL }\n`);
      const result = parseTypeScriptFile(filePath);
      expect(result.exports).toContain("ProjectScale");
    });

    it("should deduplicate exports", () => {
      const filePath = join(tempDir, "test.ts");
      writeFileSync(
        filePath,
        `export class Foo {}\nexport { Foo };\n`,
      );
      const result = parseTypeScriptFile(filePath);
      const fooCount = result.exports.filter((e) => e === "Foo").length;
      expect(fooCount).toBe(1);
    });
  });

  describe("classes", () => {
    it("should extract class declarations", () => {
      const filePath = join(tempDir, "test.ts");
      writeFileSync(
        filePath,
        `export class SkillRegistry {}\nclass InternalHelper {}\n`,
      );
      const result = parseTypeScriptFile(filePath);
      expect(result.classes).toContain("SkillRegistry");
      expect(result.classes).toContain("InternalHelper");
    });
  });

  describe("functions", () => {
    it("should extract function declarations", () => {
      const filePath = join(tempDir, "test.ts");
      writeFileSync(
        filePath,
        `export function loadConfig() {}\nfunction helper() {}\nexport async function runAgent() {}\n`,
      );
      const result = parseTypeScriptFile(filePath);
      expect(result.functions).toContain("loadConfig");
      expect(result.functions).toContain("helper");
      expect(result.functions).toContain("runAgent");
    });
  });

  describe("error handling", () => {
    it("should return empty result for non-existent file", () => {
      const result = parseTypeScriptFile(join(tempDir, "nonexistent.ts"));
      expect(result.imports).toEqual([]);
      expect(result.exports).toEqual([]);
      expect(result.classes).toEqual([]);
      expect(result.functions).toEqual([]);
    });
  });
});
