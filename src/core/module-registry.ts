import { readdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { loadModule } from "./module-loader.js";
import type { ModuleManifest } from "./types.js";

interface ResolvedModule {
  manifest: ModuleManifest;
  basePath: string;
}

/**
 * Registry for installed modules.
 * Discovers modules from .fama/modules/ and provides paths for agents, skills, and workflows.
 */
export class ModuleRegistry {
  private modules: Map<string, ResolvedModule> = new Map();
  private projectDir: string;

  constructor(projectDir: string) {
    this.projectDir = projectDir;
    this.refresh();
  }

  refresh(): void {
    this.modules.clear();
    const modulesDir = resolve(this.projectDir, ".fama", "modules");
    if (!existsSync(modulesDir)) return;

    for (const entry of readdirSync(modulesDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const modulePath = resolve(modulesDir, entry.name);
      const manifest = loadModule(modulePath);
      if (manifest) {
        this.modules.set(manifest.name, { manifest, basePath: modulePath });
      }
    }
  }

  /** Get all installed modules. */
  getAll(): ModuleManifest[] {
    return Array.from(this.modules.values()).map((m) => m.manifest);
  }

  /** Get a module by name. */
  getByName(name: string): ModuleManifest | null {
    return this.modules.get(name)?.manifest ?? null;
  }

  /** Get absolute paths to all agent directories from modules. */
  getAgentPaths(): string[] {
    const paths: string[] = [];
    for (const { manifest, basePath } of this.modules.values()) {
      if (manifest.agents) {
        for (const agentPath of manifest.agents) {
          paths.push(resolve(basePath, agentPath));
        }
      }
    }
    return paths;
  }

  /** Get absolute paths to all skill directories from modules. */
  getSkillPaths(): string[] {
    const paths: string[] = [];
    for (const { manifest, basePath } of this.modules.values()) {
      if (manifest.skills) {
        for (const skillPath of manifest.skills) {
          paths.push(resolve(basePath, skillPath));
        }
      }
    }
    return paths;
  }

  /** Get absolute paths to all workflow directories from modules. */
  getWorkflowPaths(): string[] {
    const paths: string[] = [];
    for (const { manifest, basePath } of this.modules.values()) {
      if (manifest.workflows) {
        for (const workflowPath of manifest.workflows) {
          paths.push(resolve(basePath, workflowPath));
        }
      }
    }
    return paths;
  }
}
