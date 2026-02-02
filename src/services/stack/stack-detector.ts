import { existsSync, readFileSync, readdirSync, statSync, lstatSync } from "node:fs";
import { resolve } from "node:path";
import type { DetectedStack } from "./types.js";
import { DETECTION_RULES } from "./detection-rules.js";

/**
 * Detects the technology stack of a project by analyzing marker files and dependencies.
 */
export class StackDetector {
  private projectDir: string;
  private packageDeps: Set<string> = new Set();

  constructor(projectDir: string) {
    this.projectDir = projectDir;
    this.loadPackageDeps();
  }

  private loadPackageDeps(): void {
    const pkgPath = resolve(this.projectDir, "package.json");
    if (!existsSync(pkgPath)) return;

    try {
      const raw = readFileSync(pkgPath, "utf-8");
      const pkg = JSON.parse(raw) as {
        dependencies?: Record<string, string>;
        devDependencies?: Record<string, string>;
        peerDependencies?: Record<string, string>;
      };

      for (const deps of [pkg.dependencies, pkg.devDependencies, pkg.peerDependencies]) {
        if (deps) {
          for (const name of Object.keys(deps)) {
            this.packageDeps.add(name);
          }
        }
      }
    } catch {
      // Ignore parse errors
    }
  }

  private markerExists(marker: string): boolean {
    // Handle glob-like patterns (e.g., "*.csproj", "packages/*/package.json")
    if (marker.includes("*")) {
      const parts = marker.split("/");
      return this.matchGlob(this.projectDir, parts);
    }

    const fullPath = resolve(this.projectDir, marker);
    try {
      const stat = statSync(fullPath);
      return stat.isFile() || stat.isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * Recursively match a glob path split into parts.
   * Supports `*` as a single-segment wildcard.
   */
  /**
   * Recursively match a glob path split into parts.
   * Supports `*` as a single-segment wildcard.
   * Skips symlinked directories to avoid circular references.
   */
  private matchGlob(dir: string, parts: string[]): boolean {
    if (parts.length === 0) return true;
    const [segment, ...rest] = parts;

    if (segment === "*") {
      // Wildcard: match any entry in the current directory
      try {
        const entries = readdirSync(dir);
        return entries.some((entry) => {
          const entryPath = resolve(dir, entry);
          if (rest.length === 0) return true;
          try {
            // Skip symlinked directories to avoid circular references
            if (lstatSync(entryPath).isSymbolicLink()) return false;
            return statSync(entryPath).isDirectory() && this.matchGlob(entryPath, rest);
          } catch {
            return false;
          }
        });
      } catch {
        return false;
      }
    }

    if (segment!.includes("*")) {
      // Partial wildcard (e.g., "*.csproj")
      const suffix = segment!.replace("*", "");
      try {
        const entries = readdirSync(dir);
        return entries.some((entry) => {
          if (!entry.endsWith(suffix)) return false;
          if (rest.length === 0) return true;
          const entryPath = resolve(dir, entry);
          try {
            if (lstatSync(entryPath).isSymbolicLink()) return false;
            return statSync(entryPath).isDirectory() && this.matchGlob(entryPath, rest);
          } catch {
            return false;
          }
        });
      } catch {
        return false;
      }
    }

    // Literal segment
    const nextPath = resolve(dir, segment!);
    try {
      const stat = statSync(nextPath);
      if (rest.length === 0) return stat.isFile() || stat.isDirectory();
      return stat.isDirectory() && this.matchGlob(nextPath, rest);
    } catch {
      return false;
    }
  }

  private hasPackageDep(dep: string): boolean {
    return this.packageDeps.has(dep);
  }

  private matchesRule(rule: (typeof DETECTION_RULES)[number]): boolean {
    // Check file markers
    if (rule.markers.length > 0) {
      if (rule.markers.some((m) => this.markerExists(m))) return true;
    }

    // Check package.json dependencies
    if (rule.packageDeps && rule.packageDeps.length > 0) {
      if (rule.packageDeps.some((d) => this.hasPackageDep(d))) return true;
    }

    return false;
  }

  detect(): DetectedStack {
    const languages: string[] = [];
    const frameworks: string[] = [];
    const buildTools: string[] = [];
    const testFrameworks: string[] = [];
    const packageManagers: string[] = [];
    const databases: string[] = [];
    const ciTools: string[] = [];
    let isMonorepo = false;
    const monorepoTools: string[] = [];

    for (const rule of DETECTION_RULES) {
      if (!this.matchesRule(rule)) continue;

      switch (rule.category) {
        case "language":
          if (!languages.includes(rule.name)) languages.push(rule.name);
          break;
        case "framework":
          if (!frameworks.includes(rule.name)) frameworks.push(rule.name);
          break;
        case "build":
          if (!buildTools.includes(rule.name)) buildTools.push(rule.name);
          break;
        case "test":
          if (!testFrameworks.includes(rule.name)) testFrameworks.push(rule.name);
          break;
        case "package":
          if (!packageManagers.includes(rule.name)) packageManagers.push(rule.name);
          break;
        case "database":
          if (!databases.includes(rule.name)) databases.push(rule.name);
          break;
        case "ci":
          if (!ciTools.includes(rule.name)) ciTools.push(rule.name);
          break;
        case "monorepo":
          isMonorepo = true;
          if (!monorepoTools.includes(rule.name)) monorepoTools.push(rule.name);
          break;
      }
    }

    return {
      languages,
      frameworks,
      buildTools,
      testFrameworks,
      packageManagers,
      isMonorepo,
      monorepoTool: monorepoTools[0],
      monorepoTools,
      databases,
      ciTools,
      detectedAt: new Date().toISOString(),
    };
  }

  /**
   * Returns a formatted string summary of the detected stack.
   */
  formatSummary(stack: DetectedStack): string {
    const lines: string[] = [];
    lines.push("## Detected Stack\n");

    if (stack.languages.length > 0) lines.push(`**Languages:** ${stack.languages.join(", ")}`);
    if (stack.frameworks.length > 0) lines.push(`**Frameworks:** ${stack.frameworks.join(", ")}`);
    if (stack.buildTools.length > 0) lines.push(`**Build Tools:** ${stack.buildTools.join(", ")}`);
    if (stack.testFrameworks.length > 0)
      lines.push(`**Test Frameworks:** ${stack.testFrameworks.join(", ")}`);
    if (stack.packageManagers.length > 0)
      lines.push(`**Package Managers:** ${stack.packageManagers.join(", ")}`);
    if (stack.databases.length > 0) lines.push(`**Databases:** ${stack.databases.join(", ")}`);
    if (stack.ciTools.length > 0) lines.push(`**CI/CD:** ${stack.ciTools.join(", ")}`);
    if (stack.isMonorepo) {
      const tools = stack.monorepoTools.length > 0 ? stack.monorepoTools.join(", ") : "yes";
      lines.push(`**Monorepo:** ${tools}`);
    }

    return lines.join("\n");
  }

  /**
   * Recommends agents based on the detected stack.
   */
  recommendAgents(stack: DetectedStack): string[] {
    const agents: string[] = [];

    // Always recommend feature-developer
    agents.push("feature-developer");

    // Backend frameworks suggest backend work
    const backendFrameworks = ["nestjs", "express", "fastify", "django", "flask", "rails", "hono"];
    if (stack.frameworks.some((f) => backendFrameworks.includes(f))) {
      agents.push("backend-specialist");
    }

    // Frontend frameworks suggest frontend work
    const frontendFrameworks = ["react", "vue", "angular", "svelte", "next.js", "nuxt", "astro"];
    if (stack.frameworks.some((f) => frontendFrameworks.includes(f))) {
      agents.push("frontend-specialist");
    }

    // Database suggests database specialist
    if (
      stack.databases.length > 0 ||
      stack.frameworks.some((f) => ["prisma", "drizzle"].includes(f))
    ) {
      agents.push("database-specialist");
    }

    // CI tools suggest devops
    if (stack.ciTools.length > 0) {
      agents.push("devops-specialist");
    }

    // Test frameworks suggest test-writer
    if (stack.testFrameworks.length > 0) {
      agents.push("test-writer");
    }

    return [...new Set(agents)];
  }
}
