import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { mapDependencies, extractPublicApi } from "../../../src/services/semantic/dependency-mapper.js";

let tempDir: string;

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), "fama-dep-test-"));
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

describe("mapDependencies", () => {
  it("should extract runtime dependencies", () => {
    writeFileSync(
      join(tempDir, "package.json"),
      JSON.stringify({
        dependencies: { react: "^18.0.0", next: "^14.0.0" },
      }),
    );
    const deps = mapDependencies(tempDir);
    expect(deps.filter((d) => d.type === "runtime")).toHaveLength(2);
    expect(deps.find((d) => d.name === "react")).toEqual({
      name: "react",
      version: "^18.0.0",
      type: "runtime",
    });
  });

  it("should extract dev dependencies", () => {
    writeFileSync(
      join(tempDir, "package.json"),
      JSON.stringify({
        devDependencies: { vitest: "^4.0.0", typescript: "^5.0.0" },
      }),
    );
    const deps = mapDependencies(tempDir);
    expect(deps.filter((d) => d.type === "dev")).toHaveLength(2);
  });

  it("should extract peer dependencies", () => {
    writeFileSync(
      join(tempDir, "package.json"),
      JSON.stringify({
        peerDependencies: { react: "^18.0.0" },
      }),
    );
    const deps = mapDependencies(tempDir);
    expect(deps.filter((d) => d.type === "peer")).toHaveLength(1);
  });

  it("should combine all dependency types", () => {
    writeFileSync(
      join(tempDir, "package.json"),
      JSON.stringify({
        dependencies: { a: "1.0.0" },
        devDependencies: { b: "2.0.0" },
        peerDependencies: { c: "3.0.0" },
      }),
    );
    const deps = mapDependencies(tempDir);
    expect(deps).toHaveLength(3);
  });

  it("should return empty array when no package.json exists", () => {
    const deps = mapDependencies(tempDir);
    expect(deps).toEqual([]);
  });

  it("should return empty array for invalid package.json", () => {
    writeFileSync(join(tempDir, "package.json"), "not valid json{{{");
    const deps = mapDependencies(tempDir);
    expect(deps).toEqual([]);
  });

  it("should return empty array for package.json without dependencies", () => {
    writeFileSync(join(tempDir, "package.json"), JSON.stringify({ name: "test" }));
    const deps = mapDependencies(tempDir);
    expect(deps).toEqual([]);
  });
});

describe("extractPublicApi", () => {
  it("should extract re-exports with from clause", () => {
    const filePath = join(tempDir, "index.ts");
    writeFileSync(
      filePath,
      `export { UserService, AuthGuard } from "./services/auth.js";\n`,
    );
    const api = extractPublicApi(filePath);
    expect(api.length).toBe(2);
    expect(api.map((e) => e.name)).toContain("UserService");
    expect(api.map((e) => e.name)).toContain("AuthGuard");
  });

  it("should extract type re-exports", () => {
    const filePath = join(tempDir, "index.ts");
    writeFileSync(
      filePath,
      `export type { FamaConfig, WorkflowState } from "./types.js";\n`,
    );
    const api = extractPublicApi(filePath);
    expect(api.length).toBe(2);
    for (const exp of api) {
      expect(exp.type).toBe("type");
    }
  });

  it("should extract direct function exports", () => {
    const filePath = join(tempDir, "index.ts");
    writeFileSync(
      filePath,
      `export function loadConfig(dir: string) { return {}; }\nexport async function runAgent() {}\n`,
    );
    const api = extractPublicApi(filePath);
    expect(api.length).toBe(2);
    expect(api.map((e) => e.name)).toContain("loadConfig");
    expect(api.map((e) => e.name)).toContain("runAgent");
  });

  it("should extract class exports", () => {
    const filePath = join(tempDir, "index.ts");
    writeFileSync(filePath, `export class SkillRegistry {}\n`);
    const api = extractPublicApi(filePath);
    expect(api.length).toBe(1);
    expect(api[0].name).toBe("SkillRegistry");
    expect(api[0].type).toBe("class");
  });

  it("should extract const exports", () => {
    const filePath = join(tempDir, "index.ts");
    writeFileSync(filePath, `export const DEFAULT_MODEL = "sonnet";\n`);
    const api = extractPublicApi(filePath);
    expect(api.length).toBe(1);
    expect(api[0].type).toBe("const");
  });

  it("should handle aliases with 'as' keyword", () => {
    const filePath = join(tempDir, "index.ts");
    writeFileSync(
      filePath,
      `export { InternalName as PublicName } from "./module.js";\n`,
    );
    const api = extractPublicApi(filePath);
    expect(api.length).toBe(1);
    expect(api[0].name).toBe("PublicName");
  });

  it("should return empty array for non-existent file", () => {
    const api = extractPublicApi(join(tempDir, "nonexistent.ts"));
    expect(api).toEqual([]);
  });

  it("should infer export types from naming convention", () => {
    const filePath = join(tempDir, "index.ts");
    writeFileSync(
      filePath,
      [
        'export { MySchema } from "./schemas.js";',
        'export { MyError } from "./errors.js";',
        'export { UserService } from "./services.js";',
        'export { loadConfig } from "./config.js";',
      ].join("\n"),
    );
    const api = extractPublicApi(filePath);
    const byName = Object.fromEntries(api.map((e) => [e.name, e]));
    expect(byName["MySchema"].type).toBe("const");
    expect(byName["MyError"].type).toBe("class");
    expect(byName["UserService"].type).toBe("class");
    expect(byName["loadConfig"].type).toBe("function");
  });
});
