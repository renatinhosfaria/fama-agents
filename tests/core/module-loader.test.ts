import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { resolve } from "node:path";
import { mkdirSync, rmSync, existsSync, writeFileSync } from "node:fs";
import { stringify as yamlStringify } from "yaml";
import { loadModule, installModule, uninstallModule } from "../../src/core/module-loader.js";
import { ModuleRegistry } from "../../src/core/module-registry.js";

const BASE_TEST_DIR = resolve(
  import.meta.dirname,
  "..",
  "fixtures",
  "module-test",
);
let TEST_DIR: string;
let testCounter = 0;

function createModuleFixture(
  dir: string,
  manifest: Record<string, unknown>,
): void {
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    resolve(dir, "module.yaml"),
    yamlStringify(manifest),
    "utf-8",
  );
}

describe("module-loader", () => {
  beforeEach(() => {
    testCounter++;
    TEST_DIR = resolve(BASE_TEST_DIR, `run-${testCounter}-${Date.now()}`);
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(TEST_DIR))
      rmSync(TEST_DIR, { recursive: true, force: true });
  });

  describe("loadModule", () => {
    it("deve carregar manifest válido", () => {
      const modDir = resolve(TEST_DIR, "my-module");
      createModuleFixture(modDir, {
        name: "my-module",
        version: "1.0.0",
        description: "Test module",
        agents: ["agents/custom.md"],
        skills: ["skills/custom"],
      });
      const manifest = loadModule(modDir);
      expect(manifest).toBeDefined();
      expect(manifest?.name).toBe("my-module");
      expect(manifest?.version).toBe("1.0.0");
      expect(manifest?.agents).toEqual(["agents/custom.md"]);
    });

    it("deve retornar null para diretório sem manifest", () => {
      const modDir = resolve(TEST_DIR, "empty");
      mkdirSync(modDir, { recursive: true });
      const manifest = loadModule(modDir);
      expect(manifest).toBeNull();
    });

    it("deve retornar null para manifest inválido", () => {
      const modDir = resolve(TEST_DIR, "invalid");
      mkdirSync(modDir, { recursive: true });
      writeFileSync(resolve(modDir, "module.yaml"), "invalid: {{{", "utf-8");
      const manifest = loadModule(modDir);
      expect(manifest).toBeNull();
    });
  });

  describe("installModule", () => {
    it("deve instalar módulo no .fama/modules", () => {
      const sourceDir = resolve(TEST_DIR, "source-module");
      createModuleFixture(sourceDir, {
        name: "test-module",
        version: "0.1.0",
        description: "A test module",
      });

      const projectDir = resolve(TEST_DIR, "project");
      mkdirSync(projectDir, { recursive: true });

      const result = installModule(sourceDir, projectDir);
      expect(result).toBeDefined();
      expect(result?.name).toBe("test-module");

      const installed = resolve(
        projectDir,
        ".fama",
        "modules",
        "test-module",
        "module.yaml",
      );
      expect(existsSync(installed)).toBe(true);
    });
  });

  describe("uninstallModule", () => {
    it("deve retornar true ao remover módulo existente", () => {
      const projectDir = resolve(TEST_DIR, "project");
      const modDir = resolve(projectDir, ".fama", "modules", "to-remove");
      createModuleFixture(modDir, { name: "to-remove", version: "1.0.0" });

      const result = uninstallModule("to-remove", projectDir);
      expect(result).toBe(true);
    });

    it("deve retornar false para módulo inexistente", () => {
      const projectDir = resolve(TEST_DIR, "project");
      mkdirSync(projectDir, { recursive: true });
      const result = uninstallModule("nonexistent", projectDir);
      expect(result).toBe(false);
    });
  });
});

describe("ModuleRegistry", () => {
  let TEST_DIR_REG: string;

  beforeEach(() => {
    testCounter++;
    TEST_DIR_REG = resolve(BASE_TEST_DIR, `reg-${testCounter}-${Date.now()}`);
    mkdirSync(TEST_DIR_REG, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(TEST_DIR_REG))
      rmSync(TEST_DIR_REG, { recursive: true, force: true });
  });

  it("deve descobrir módulos instalados", () => {
    const modsDir = resolve(TEST_DIR_REG, ".fama", "modules");
    createModuleFixture(resolve(modsDir, "mod-a"), {
      name: "mod-a",
      version: "1.0.0",
      agents: ["agents/custom.md"],
    });
    createModuleFixture(resolve(modsDir, "mod-b"), {
      name: "mod-b",
      version: "2.0.0",
      skills: ["skills/custom"],
    });

    const registry = new ModuleRegistry(TEST_DIR_REG);
    const all = registry.getAll();
    expect(all).toHaveLength(2);
  });

  it("deve retornar agent paths de módulos", () => {
    const modsDir = resolve(TEST_DIR_REG, ".fama", "modules");
    createModuleFixture(resolve(modsDir, "mod-a"), {
      name: "mod-a",
      version: "1.0.0",
      agents: ["agents/custom.md"],
    });

    const registry = new ModuleRegistry(TEST_DIR_REG);
    const agentPaths = registry.getAgentPaths();
    expect(agentPaths).toHaveLength(1);
    expect(agentPaths[0]).toContain("agents");
  });

  it("deve retornar lista vazia sem módulos", () => {
    const registry = new ModuleRegistry(TEST_DIR_REG);
    expect(registry.getAll()).toHaveLength(0);
    expect(registry.getAgentPaths()).toHaveLength(0);
    expect(registry.getSkillPaths()).toHaveLength(0);
    expect(registry.getWorkflowPaths()).toHaveLength(0);
  });
});
