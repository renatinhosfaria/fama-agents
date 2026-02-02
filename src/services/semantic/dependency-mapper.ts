import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { DependencyInfo, ExportInfo } from "./types.js";

/**
 * Extracts dependency information from package.json.
 */
export function mapDependencies(projectDir: string): DependencyInfo[] {
  const pkgPath = resolve(projectDir, "package.json");
  if (!existsSync(pkgPath)) return [];

  try {
    const raw = readFileSync(pkgPath, "utf-8");
    const pkg = JSON.parse(raw) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
      peerDependencies?: Record<string, string>;
    };

    const deps: DependencyInfo[] = [];

    if (pkg.dependencies) {
      for (const [name, version] of Object.entries(pkg.dependencies)) {
        deps.push({ name, version, type: "runtime" });
      }
    }

    if (pkg.devDependencies) {
      for (const [name, version] of Object.entries(pkg.devDependencies)) {
        deps.push({ name, version, type: "dev" });
      }
    }

    if (pkg.peerDependencies) {
      for (const [name, version] of Object.entries(pkg.peerDependencies)) {
        deps.push({ name, version, type: "peer" });
      }
    }

    return deps;
  } catch {
    return [];
  }
}

/**
 * Extracts public API exports from an index file.
 */
export function extractPublicApi(indexPath: string): ExportInfo[] {
  if (!existsSync(indexPath)) return [];

  try {
    const content = readFileSync(indexPath, "utf-8");
    const exports: ExportInfo[] = [];

    // export { X } from "./module"
    const reExportRegex = /export\s+(?:type\s+)?\{([^}]+)\}\s+from\s+["']([^"']+)["']/g;
    let match: RegExpExecArray | null;
    while ((match = reExportRegex.exec(content)) !== null) {
      const file = match[2];
      const names = match[1].split(",").map((s) => s.trim().split(/\s+as\s+/));
      for (const parts of names) {
        const name = (parts[1] ?? parts[0]).trim();
        if (!name) continue;

        // Detect if it's a type export
        const isType = /export\s+type/.test(match[0]);

        exports.push({
          name,
          type: isType ? "type" : inferExportType(name),
          file,
        });
      }
    }

    // export function/class/const/enum/interface
    const directRegex =
      /export\s+(?:default\s+)?(?:async\s+)?(function|class|const|let|var|type|interface|enum)\s+([\w$]+)/g;
    while ((match = directRegex.exec(content)) !== null) {
      const kind = match[1];
      const name = match[2];
      const typeMap: Record<string, ExportInfo["type"]> = {
        function: "function",
        class: "class",
        const: "const",
        let: "const",
        var: "const",
        type: "type",
        interface: "interface",
        enum: "enum",
      };
      exports.push({
        name,
        type: typeMap[kind] ?? "unknown",
        file: indexPath,
      });
    }

    return exports;
  } catch {
    return [];
  }
}

function inferExportType(name: string): ExportInfo["type"] {
  // Heuristic: PascalCase with Schema suffix = class/const
  if (name.endsWith("Schema")) return "const";
  if (name.endsWith("Error")) return "class";
  // PascalCase = likely class or type
  if (/^[A-Z][a-zA-Z]+$/.test(name)) return "class";
  // camelCase = likely function
  if (/^[a-z][a-zA-Z]+$/.test(name)) return "function";
  // ALL_CAPS = enum/const
  if (/^[A-Z_]+$/.test(name)) return "enum";
  return "unknown";
}
