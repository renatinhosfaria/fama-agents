import { readFileSync } from "node:fs";
import type { FileAnalysis } from "../types.js";

/**
 * Regex-based TypeScript/JavaScript file parser.
 * Extracts imports, exports, classes, and functions without external dependencies.
 */
export function parseTypeScriptFile(filePath: string): FileAnalysis {
  let content: string;
  try {
    content = readFileSync(filePath, "utf-8");
  } catch {
    return { path: filePath, imports: [], exports: [], classes: [], functions: [] };
  }

  const imports = extractImports(content);
  const exports = extractExports(content);
  const classes = extractClasses(content);
  const functions = extractFunctions(content);

  return { path: filePath, imports, exports, classes, functions };
}

function extractImports(content: string): string[] {
  const results: string[] = [];

  // import { X } from "module"
  const importRegex = /import\s+(?:type\s+)?(?:\{[^}]*\}|[\w*]+)\s+from\s+["']([^"']+)["']/g;
  let match: RegExpExecArray | null;
  while ((match = importRegex.exec(content)) !== null) {
    results.push(match[1]);
  }

  // import "module"
  const sideEffectRegex = /import\s+["']([^"']+)["']/g;
  while ((match = sideEffectRegex.exec(content)) !== null) {
    if (!results.includes(match[1])) {
      results.push(match[1]);
    }
  }

  // require("module")
  const requireRegex = /require\s*\(\s*["']([^"']+)["']\s*\)/g;
  while ((match = requireRegex.exec(content)) !== null) {
    if (!results.includes(match[1])) {
      results.push(match[1]);
    }
  }

  return results;
}

function extractExports(content: string): string[] {
  const results: string[] = [];

  // export function/class/const/type/interface/enum
  const namedRegex =
    /export\s+(?:default\s+)?(?:async\s+)?(?:function|class|const|let|var|type|interface|enum)\s+([\w$]+)/g;
  let match: RegExpExecArray | null;
  while ((match = namedRegex.exec(content)) !== null) {
    results.push(match[1]);
  }

  // export { X, Y }
  const groupRegex = /export\s+\{([^}]+)\}/g;
  while ((match = groupRegex.exec(content)) !== null) {
    const names = match[1].split(",").map((s) => s.trim().split(/\s+as\s+/)[0].trim());
    results.push(...names.filter(Boolean));
  }

  return [...new Set(results)];
}

function extractClasses(content: string): string[] {
  const regex = /(?:export\s+)?class\s+([\w$]+)/g;
  const results: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(content)) !== null) {
    results.push(match[1]);
  }
  return results;
}

function extractFunctions(content: string): string[] {
  const regex = /(?:export\s+)?(?:async\s+)?function\s+([\w$]+)/g;
  const results: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(content)) !== null) {
    results.push(match[1]);
  }
  return results;
}
