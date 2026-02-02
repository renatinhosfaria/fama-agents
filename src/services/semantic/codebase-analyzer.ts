import { existsSync, readdirSync, statSync } from "node:fs";
import { resolve, relative, extname } from "node:path";
import type { CodebaseAnalysis } from "./types.js";
import { detectArchitecture, discoverLayers } from "./architecture-detector.js";
import { mapDependencies, extractPublicApi } from "./dependency-mapper.js";
import { parseTypeScriptFile } from "./parsers/typescript-parser.js";

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

const CODE_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".py",
  ".go",
  ".rs",
  ".java",
  ".kt",
  ".swift",
  ".rb",
  ".php",
  ".cs",
  ".cpp",
  ".c",
  ".h",
]);

/**
 * Analyzes a codebase to produce a structured summary.
 * Uses regex-based parsing (no tree-sitter dependency).
 */
export class CodebaseAnalyzer {
  private projectDir: string;

  constructor(projectDir: string) {
    this.projectDir = projectDir;
  }

  analyze(): CodebaseAnalysis {
    const architecture = detectArchitecture(this.projectDir);
    const layers = discoverLayers(this.projectDir);
    const entryPoints = this.findEntryPoints();
    const dependencies = mapDependencies(this.projectDir);
    const publicApi = this.findPublicApi();
    const fileCount = this.countCodeFiles();

    const runtimeDeps = dependencies.filter((d) => d.type === "runtime");
    const topDeps = runtimeDeps.slice(0, 10).map((d) => d.name);

    const summary = [
      `Architecture: ${architecture.type} (${architecture.confidence}% confidence)`,
      `Layers: ${layers.map((l) => `${l.name} (${l.type})`).join(", ") || "none detected"}`,
      `Entry Points: ${entryPoints.join(", ") || "none detected"}`,
      `Dependencies: ${topDeps.join(", ")}${runtimeDeps.length > 10 ? ` (+${runtimeDeps.length - 10} more)` : ""}`,
      `Public API: ${publicApi.length} exports`,
      `Files: ${fileCount}`,
    ].join("\n");

    return {
      summary,
      architecture,
      layers,
      entryPoints,
      dependencies,
      publicApi,
      fileCount,
      analyzedAt: new Date().toISOString(),
    };
  }

  /**
   * Returns a formatted markdown summary for use in agent prompts.
   */
  formatForPrompt(analysis: CodebaseAnalysis): string {
    const lines: string[] = [];
    lines.push("## Codebase Context\n");
    lines.push(
      `**Architecture:** ${analysis.architecture.type} (${analysis.architecture.confidence}% confidence)`,
    );

    if (analysis.layers.length > 0) {
      const layerStr = analysis.layers.map((l) => `${l.name} (${l.type})`).join(", ");
      lines.push(`**Layers:** ${layerStr}`);
    }

    if (analysis.entryPoints.length > 0) {
      lines.push(`**Entry Points:** ${analysis.entryPoints.join(", ")}`);
    }

    const runtimeDeps = analysis.dependencies.filter((d) => d.type === "runtime");
    if (runtimeDeps.length > 0) {
      const topDeps = runtimeDeps.slice(0, 15).map((d) => d.name);
      lines.push(`**Dependencies:** ${topDeps.join(", ")}`);
    }

    if (analysis.publicApi.length > 0) {
      lines.push(`**Public API:** ${analysis.publicApi.length} exports`);
    }

    lines.push(`**Files:** ${analysis.fileCount}`);

    return lines.join("\n");
  }

  private findEntryPoints(): string[] {
    const candidates = [
      "src/index.ts",
      "src/index.js",
      "src/main.ts",
      "src/main.js",
      "src/cli.ts",
      "src/cli.js",
      "src/bin.ts",
      "src/app.ts",
      "src/server.ts",
      "index.ts",
      "index.js",
      "main.ts",
      "main.js",
    ];

    return candidates.filter((c) => existsSync(resolve(this.projectDir, c)));
  }

  private findPublicApi() {
    const indexCandidates = [
      "src/index.ts",
      "src/index.js",
      "index.ts",
      "index.js",
    ];

    for (const candidate of indexCandidates) {
      const fullPath = resolve(this.projectDir, candidate);
      if (existsSync(fullPath)) {
        return extractPublicApi(fullPath);
      }
    }
    return [];
  }

  private countCodeFiles(dir?: string): number {
    const targetDir = dir ?? resolve(this.projectDir, "src");
    if (!existsSync(targetDir)) return 0;

    let count = 0;
    try {
      for (const entry of readdirSync(targetDir)) {
        if (IGNORE_DIRS.has(entry)) continue;
        const full = resolve(targetDir, entry);
        try {
          const stat = statSync(full);
          if (stat.isFile() && CODE_EXTENSIONS.has(extname(entry))) {
            count++;
          } else if (stat.isDirectory()) {
            count += this.countCodeFiles(full);
          }
        } catch {
          // skip
        }
      }
    } catch {
      // skip
    }
    return count;
  }
}
