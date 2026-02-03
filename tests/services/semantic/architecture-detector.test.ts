import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { detectArchitecture, discoverLayers } from "../../../src/services/semantic/architecture-detector.js";

let tempDir: string;

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), "fama-arch-test-"));
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

describe("detectArchitecture", () => {
  it("should detect monorepo with workspace config + packages dir (95% confidence)", () => {
    writeFileSync(join(tempDir, "pnpm-workspace.yaml"), "packages:\n  - packages/*");
    mkdirSync(join(tempDir, "packages"));
    const result = detectArchitecture(tempDir);
    expect(result.type).toBe("monorepo");
    expect(result.confidence).toBe(95);
    expect(result.evidence.length).toBeGreaterThan(0);
  });

  it("should detect monorepo with workspace config + apps dir", () => {
    writeFileSync(join(tempDir, "lerna.json"), "{}");
    mkdirSync(join(tempDir, "apps"));
    const result = detectArchitecture(tempDir);
    expect(result.type).toBe("monorepo");
    expect(result.confidence).toBe(95);
  });

  it("should detect monorepo with workspace config only (80% confidence)", () => {
    writeFileSync(join(tempDir, "nx.json"), "{}");
    const result = detectArchitecture(tempDir);
    expect(result.type).toBe("monorepo");
    expect(result.confidence).toBe(80);
  });

  it("should detect microservices with docker-compose + services/", () => {
    writeFileSync(join(tempDir, "docker-compose.yml"), "");
    mkdirSync(join(tempDir, "services"));
    const result = detectArchitecture(tempDir);
    expect(result.type).toBe("microservices");
    expect(result.confidence).toBe(70);
  });

  it("should detect layered architecture with 3+ layer dirs in src/", () => {
    const srcDir = join(tempDir, "src");
    mkdirSync(srcDir);
    mkdirSync(join(srcDir, "core"));
    mkdirSync(join(srcDir, "services"));
    mkdirSync(join(srcDir, "utils"));
    mkdirSync(join(srcDir, "commands"));
    const result = detectArchitecture(tempDir);
    expect(result.type).toBe("layered");
    expect(result.confidence).toBe(75);
  });

  it("should detect modular with 3+ generic dirs in src/", () => {
    const srcDir = join(tempDir, "src");
    mkdirSync(srcDir);
    mkdirSync(join(srcDir, "auth"));
    mkdirSync(join(srcDir, "users"));
    mkdirSync(join(srcDir, "products"));
    const result = detectArchitecture(tempDir);
    expect(result.type).toBe("modular");
    expect(result.confidence).toBe(60);
  });

  it("should default to monolith for empty project", () => {
    const result = detectArchitecture(tempDir);
    expect(result.type).toBe("monolith");
    expect(result.confidence).toBe(40);
  });

  it("should prioritize monorepo over layered", () => {
    writeFileSync(join(tempDir, "pnpm-workspace.yaml"), "");
    mkdirSync(join(tempDir, "packages"));
    const srcDir = join(tempDir, "src");
    mkdirSync(srcDir);
    mkdirSync(join(srcDir, "core"));
    mkdirSync(join(srcDir, "services"));
    mkdirSync(join(srcDir, "utils"));
    const result = detectArchitecture(tempDir);
    expect(result.type).toBe("monorepo");
  });
});

describe("discoverLayers", () => {
  it("should return empty array if no src/ directory", () => {
    const layers = discoverLayers(tempDir);
    expect(layers).toEqual([]);
  });

  it("should discover directories in src/ as layers", () => {
    const srcDir = join(tempDir, "src");
    mkdirSync(srcDir);
    mkdirSync(join(srcDir, "core"));
    mkdirSync(join(srcDir, "services"));
    mkdirSync(join(srcDir, "utils"));
    writeFileSync(join(srcDir, "core", "index.ts"), "export {};");
    writeFileSync(join(srcDir, "services", "a.ts"), "");
    writeFileSync(join(srcDir, "services", "b.ts"), "");

    const layers = discoverLayers(tempDir);
    expect(layers.length).toBe(3);

    const names = layers.map((l) => l.name);
    expect(names).toContain("core");
    expect(names).toContain("services");
    expect(names).toContain("utils");
  });

  it("should classify layers correctly", () => {
    const srcDir = join(tempDir, "src");
    mkdirSync(srcDir);
    mkdirSync(join(srcDir, "core"));
    mkdirSync(join(srcDir, "api"));
    mkdirSync(join(srcDir, "components"));
    mkdirSync(join(srcDir, "services"));
    mkdirSync(join(srcDir, "utils"));
    mkdirSync(join(srcDir, "config"));
    mkdirSync(join(srcDir, "tests"));
    mkdirSync(join(srcDir, "custom"));

    // Add a file to each so they show up
    for (const dir of ["core", "api", "components", "services", "utils", "config", "tests", "custom"]) {
      writeFileSync(join(srcDir, dir, "index.ts"), "");
    }

    const layers = discoverLayers(tempDir);
    const byName = Object.fromEntries(layers.map((l) => [l.name, l]));

    expect(byName["core"].type).toBe("core");
    expect(byName["api"].type).toBe("api");
    expect(byName["components"].type).toBe("ui");
    expect(byName["services"].type).toBe("service");
    expect(byName["utils"].type).toBe("util");
    expect(byName["config"].type).toBe("config");
    expect(byName["tests"].type).toBe("test");
    expect(byName["custom"].type).toBe("other");
  });

  it("should sort layers by file count descending", () => {
    const srcDir = join(tempDir, "src");
    mkdirSync(srcDir);
    mkdirSync(join(srcDir, "small"));
    mkdirSync(join(srcDir, "big"));
    writeFileSync(join(srcDir, "small", "a.ts"), "");
    writeFileSync(join(srcDir, "big", "a.ts"), "");
    writeFileSync(join(srcDir, "big", "b.ts"), "");
    writeFileSync(join(srcDir, "big", "c.ts"), "");

    const layers = discoverLayers(tempDir);
    expect(layers[0].name).toBe("big");
    expect(layers[0].fileCount).toBe(3);
    expect(layers[1].name).toBe("small");
    expect(layers[1].fileCount).toBe(1);
  });

  it("should ignore node_modules and .git directories inside src/", () => {
    const srcDir = join(tempDir, "src");
    mkdirSync(srcDir);
    mkdirSync(join(srcDir, "node_modules"));
    mkdirSync(join(srcDir, "core"));
    writeFileSync(join(srcDir, "core", "index.ts"), "");

    const layers = discoverLayers(tempDir);
    const names = layers.map((l) => l.name);
    expect(names).not.toContain("node_modules");
    expect(names).toContain("core");
  });
});
