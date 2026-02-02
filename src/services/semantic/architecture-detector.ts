import { existsSync, readdirSync, statSync } from "node:fs";
import { resolve, relative, basename } from "node:path";
import type { ArchitecturePattern, LayerInfo } from "./types.js";

const IGNORE_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  "coverage",
  ".next",
  ".nuxt",
  ".output",
  "__pycache__",
  ".fama",
]);

/**
 * Detects the architecture pattern of a project.
 */
export function detectArchitecture(projectDir: string): ArchitecturePattern {
  const evidence: string[] = [];
  let type: ArchitecturePattern["type"] = "unknown";
  let confidence = 0;

  // Check for monorepo indicators
  const hasWorkspaces =
    existsSync(resolve(projectDir, "pnpm-workspace.yaml")) ||
    existsSync(resolve(projectDir, "lerna.json")) ||
    existsSync(resolve(projectDir, "nx.json"));
  const hasPackagesDir =
    existsSync(resolve(projectDir, "packages")) ||
    existsSync(resolve(projectDir, "apps"));

  if (hasWorkspaces && hasPackagesDir) {
    type = "monorepo";
    confidence = 95;
    evidence.push("Workspace config file found");
    evidence.push("packages/ or apps/ directory exists");
    return { type, confidence, evidence };
  }

  if (hasWorkspaces) {
    type = "monorepo";
    confidence = 80;
    evidence.push("Workspace config file found");
    return { type, confidence, evidence };
  }

  // Check for microservices indicators
  const hasDockerCompose = existsSync(resolve(projectDir, "docker-compose.yml")) ||
    existsSync(resolve(projectDir, "docker-compose.yaml"));
  const servicesDir = existsSync(resolve(projectDir, "services"));

  if (hasDockerCompose && servicesDir) {
    type = "microservices";
    confidence = 70;
    evidence.push("docker-compose.yml found");
    evidence.push("services/ directory exists");
    return { type, confidence, evidence };
  }

  // Check for layered architecture (src with clear layers)
  const srcDir = resolve(projectDir, "src");
  if (existsSync(srcDir)) {
    const srcChildren = safeReaddir(srcDir);
    const layerDirs = ["core", "services", "utils", "commands", "api", "controllers", "models"];
    const foundLayers = srcChildren.filter((d) => layerDirs.includes(d));

    if (foundLayers.length >= 3) {
      type = "layered";
      confidence = 75;
      evidence.push(`Found ${foundLayers.length} layer dirs: ${foundLayers.join(", ")}`);
      return { type, confidence, evidence };
    }

    // Modular if has distinct top-level modules
    if (srcChildren.length >= 3) {
      type = "modular";
      confidence = 60;
      evidence.push(`${srcChildren.length} top-level source directories`);
      return { type, confidence, evidence };
    }
  }

  // Default: monolith
  type = "monolith";
  confidence = 40;
  evidence.push("No clear multi-module indicators found");
  return { type, confidence, evidence };
}

/**
 * Discovers layers/modules in the project.
 */
export function discoverLayers(projectDir: string): LayerInfo[] {
  const layers: LayerInfo[] = [];
  const srcDir = resolve(projectDir, "src");

  if (!existsSync(srcDir)) return layers;

  const dirs = safeReaddir(srcDir).filter((d) => {
    const full = resolve(srcDir, d);
    try {
      return statSync(full).isDirectory() && !IGNORE_DIRS.has(d);
    } catch {
      return false;
    }
  });

  for (const dir of dirs) {
    const dirPath = resolve(srcDir, dir);
    const fileCount = countFiles(dirPath);
    const layerType = classifyLayer(dir);

    layers.push({
      name: dir,
      path: relative(projectDir, dirPath),
      type: layerType,
      fileCount,
    });
  }

  return layers.sort((a, b) => b.fileCount - a.fileCount);
}

function classifyLayer(name: string): LayerInfo["type"] {
  const map: Record<string, LayerInfo["type"]> = {
    core: "core",
    lib: "core",
    api: "api",
    controllers: "api",
    routes: "api",
    services: "service",
    service: "service",
    ui: "ui",
    components: "ui",
    pages: "ui",
    views: "ui",
    utils: "util",
    helpers: "util",
    shared: "util",
    common: "util",
    config: "config",
    configs: "config",
    test: "test",
    tests: "test",
    __tests__: "test",
  };
  return map[name] ?? "other";
}

function countFiles(dir: string): number {
  let count = 0;
  try {
    for (const entry of readdirSync(dir)) {
      if (IGNORE_DIRS.has(entry)) continue;
      const full = resolve(dir, entry);
      try {
        const stat = statSync(full);
        if (stat.isFile()) count++;
        else if (stat.isDirectory()) count += countFiles(full);
      } catch {
        // skip inaccessible
      }
    }
  } catch {
    // skip inaccessible
  }
  return count;
}

function safeReaddir(dir: string): string[] {
  try {
    return readdirSync(dir).filter((e) => !IGNORE_DIRS.has(e));
  } catch {
    return [];
  }
}
