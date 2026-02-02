/**
 * Types for the scaffolding system.
 */

export interface ScaffoldTemplate {
  /** File name (e.g. "overview.md") */
  filename: string;
  /** Display name */
  title: string;
  /** Description of what this doc covers */
  description: string;
  /** Template content with YAML frontmatter */
  content: string;
}

export type ScaffoldStatus = "unfilled" | "filled";

export interface ScaffoldFile {
  path: string;
  title: string;
  status: ScaffoldStatus;
}
