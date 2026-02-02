import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { basename, dirname, resolve, relative } from "node:path";
import type { ExportContext, ExportFile, ExportResult } from "./types.js";
import { getPreset, getAllPresets, getPresetNames } from "./presets/index.js";
import { log } from "../../utils/logger.js";

export { getPresetNames, getAllPresets } from "./presets/index.js";
export type { ExportContext, ExportFile, ExportResult, ExportPreset } from "./types.js";

/**
 * Sanitize a slug for safe use in file paths.
 * Strips path separators and ensures basename-only.
 */
export function sanitizeSlug(slug: string): string {
  return basename(slug).replace(/[^a-zA-Z0-9_.-]/g, "-");
}

/**
 * Run a single export preset and return the result (without writing files).
 */
export function generateExport(presetName: string, context: ExportContext): ExportResult {
  const preset = getPreset(presetName);
  if (!preset) {
    throw new Error(`Unknown export preset "${presetName}". Available: ${getPresetNames().join(", ")}`);
  }
  return preset.generate(context);
}

/**
 * Run multiple presets (or "all") and return combined results.
 */
export function generateExports(
  presetNames: string[],
  context: ExportContext,
): ExportResult {
  const names =
    presetNames.length === 1 && presetNames[0] === "all"
      ? getPresetNames()
      : presetNames;

  const allFiles: ExportFile[] = [];
  const summaries: string[] = [];

  for (const name of names) {
    const result = generateExport(name, context);
    allFiles.push(...result.files);
    summaries.push(result.summary);
  }

  return {
    files: allFiles,
    summary: summaries.join("\n"),
  };
}

/**
 * Write export result files to disk.
 */
export function writeExportFiles(
  result: ExportResult,
  projectDir: string,
  dryRun = false,
): string[] {
  const written: string[] = [];

  for (const file of result.files) {
    const fullPath = resolve(projectDir, file.path);

    // Prevent path traversal: ensure file stays within projectDir
    const rel = relative(projectDir, fullPath);
    if (rel.startsWith("..") || rel.startsWith("/") || rel.includes("..")) {
      throw new Error(`Export path escapes project directory: ${file.path}`);
    }

    if (dryRun) {
      log.dim(`  [dry-run] ${file.path}`);
      written.push(file.path);
      continue;
    }

    const dir = dirname(fullPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    writeFileSync(fullPath, file.content, "utf-8");
    written.push(file.path);
  }

  return written;
}

/**
 * Full export pipeline: generate + write.
 */
export function runExport(
  presetNames: string[],
  context: ExportContext,
  options: { dryRun?: boolean } = {},
): { result: ExportResult; writtenFiles: string[] } {
  const presets = getAllPresets();
  log.dim(
    `Available presets: ${presets.map((p) => p.name).join(", ")}`,
  );

  const result = generateExports(presetNames, context);
  const writtenFiles = writeExportFiles(result, context.projectDir, options.dryRun);

  return { result, writtenFiles };
}
