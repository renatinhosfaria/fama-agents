import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { resolve, join } from "node:path";
import { parse as yamlParse } from "yaml";
import type { ModuleManifest } from "./types.js";
import { ModuleManifestSchema } from "./schemas.js";
import { log } from "../utils/logger.js";

const MODULES_DIR = ".fama/modules";

function getModulesDir(projectDir: string): string {
  return resolve(projectDir, MODULES_DIR);
}

function getModulePath(projectDir: string, name: string): string {
  return resolve(getModulesDir(projectDir), name);
}

/**
 * Loads a module manifest from a directory.
 */
export function loadModule(modulePath: string): ModuleManifest | null {
  const manifestPath = resolve(modulePath, "module.yaml");
  if (!existsSync(manifestPath)) {
    log.warn(`module.yaml não encontrado em "${modulePath}"`);
    return null;
  }

  try {
    const raw = readFileSync(manifestPath, "utf-8");
    const parsed = yamlParse(raw);
    const result = ModuleManifestSchema.safeParse(parsed);
    if (!result.success) {
      log.warn(`Manifest inválido em "${modulePath}": ${result.error.issues.map((i) => i.message).join(", ")}`);
      return null;
    }
    return result.data as ModuleManifest;
  } catch (err) {
    log.warn(`Falha ao carregar módulo "${modulePath}": ${err instanceof Error ? err.message : String(err)}`);
    return null;
  }
}

function copyDirSync(src: string, dest: string): void {
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src, { withFileTypes: true })) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      writeFileSync(destPath, readFileSync(srcPath));
    }
  }
}

/**
 * Installs a module from a source directory to .fama/modules/<name>/.
 */
export function installModule(
  source: string,
  projectDir: string,
): ModuleManifest | null {
  const manifest = loadModule(source);
  if (!manifest) {
    log.error(`Não foi possível carregar módulo de "${source}"`);
    return null;
  }

  const targetDir = getModulePath(projectDir, manifest.name);

  if (existsSync(targetDir)) {
    log.warn(`Módulo "${manifest.name}" já existe. Sobrescrevendo...`);
    rmSync(targetDir, { recursive: true, force: true });
  }

  copyDirSync(source, targetDir);

  log.success(`Módulo "${manifest.name}" instalado em ${targetDir}`);
  return manifest;
}

/**
 * Uninstalls a module by name.
 */
export function uninstallModule(name: string, projectDir: string): boolean {
  const targetDir = getModulePath(projectDir, name);
  if (!existsSync(targetDir)) {
    log.error(`Módulo "${name}" não encontrado.`);
    return false;
  }

  rmSync(targetDir, { recursive: true, force: true });
  log.success(`Módulo "${name}" removido.`);
  return true;
}

/**
 * Gets the modules installation directory for a project.
 */
export function getModulesBasePath(projectDir: string): string {
  return getModulesDir(projectDir);
}
