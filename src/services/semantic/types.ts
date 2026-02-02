/**
 * Types for semantic codebase analysis.
 */

export interface CodebaseAnalysis {
  summary: string;
  architecture: ArchitecturePattern;
  layers: LayerInfo[];
  entryPoints: string[];
  dependencies: DependencyInfo[];
  publicApi: ExportInfo[];
  fileCount: number;
  analyzedAt: string;
}

export interface ArchitecturePattern {
  type: "monolith" | "monorepo" | "microservices" | "modular" | "layered" | "unknown";
  confidence: number;
  evidence: string[];
}

export interface LayerInfo {
  name: string;
  path: string;
  type: "api" | "core" | "ui" | "service" | "util" | "config" | "test" | "other";
  fileCount: number;
}

export interface DependencyInfo {
  name: string;
  version?: string;
  type: "runtime" | "dev" | "peer";
}

export interface ExportInfo {
  name: string;
  type: "function" | "class" | "type" | "const" | "enum" | "interface" | "unknown";
  file: string;
}

export interface FileAnalysis {
  path: string;
  imports: string[];
  exports: string[];
  classes: string[];
  functions: string[];
}
