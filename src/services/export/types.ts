import type { AgentConfig, FamaConfig, ParsedSkill } from "../../core/types.js";
import type { DetectedStack } from "../stack/types.js";

/**
 * Context provided to export presets for generating output files.
 */
export interface ExportContext {
  agents: AgentConfig[];
  skills: ParsedSkill[];
  config: FamaConfig;
  stack?: DetectedStack;
  projectDir: string;
}

/**
 * A single file to be written by an export preset.
 */
export interface ExportFile {
  /** Relative path from project root */
  path: string;
  content: string;
}

/**
 * Result returned by an export preset.
 */
export interface ExportResult {
  files: ExportFile[];
  summary: string;
}

/**
 * An export preset generates files for a specific target tool.
 */
export interface ExportPreset {
  name: string;
  description: string;
  generate(context: ExportContext): ExportResult;
}
