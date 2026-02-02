export interface DetectedStack {
  languages: string[];
  frameworks: string[];
  buildTools: string[];
  testFrameworks: string[];
  packageManagers: string[];
  isMonorepo: boolean;
  monorepoTool?: string;
  monorepoTools: string[];
  databases: string[];
  ciTools: string[];
  detectedAt: string;
}

export interface DetectionRule {
  name: string;
  category:
    | "language"
    | "framework"
    | "build"
    | "test"
    | "package"
    | "database"
    | "ci"
    | "monorepo";
  markers: string[];
  packageDeps?: string[];
}
