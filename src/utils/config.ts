import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { parse as parseYaml } from "yaml";
import { ProjectScale, type FamaConfig } from "../core/types.js";

const DEFAULT_CONFIG: FamaConfig = {
  model: "sonnet",
  maxTurns: 50,
  lang: "pt-BR",
  skillsDir: "./skills",
  workflow: {
    defaultScale: ProjectScale.MEDIUM,
    gates: {
      requirePlan: true,
      requireApproval: false,
    },
  },
};

/**
 * Loads configuration from .fama.yaml (project) and environment variables.
 * Priority: CLI flags > env vars > project config > defaults
 */
export function loadConfig(cwd: string = process.cwd()): FamaConfig {
  const config = { ...DEFAULT_CONFIG };

  // Load project config
  const configPath = resolve(cwd, ".fama.yaml");
  if (existsSync(configPath)) {
    try {
      const raw = readFileSync(configPath, "utf-8");
      const parsed = parseYaml(raw) as Partial<FamaConfig>;
      Object.assign(config, parsed);
    } catch {
      // Ignore invalid config
    }
  }

  // Environment overrides
  if (process.env["FAMA_MODEL"]) config.model = process.env["FAMA_MODEL"];
  if (process.env["FAMA_MAX_TURNS"])
    config.maxTurns = parseInt(process.env["FAMA_MAX_TURNS"], 10);
  if (process.env["FAMA_LANG"]) config.lang = process.env["FAMA_LANG"];
  if (process.env["FAMA_SKILLS_DIR"])
    config.skillsDir = process.env["FAMA_SKILLS_DIR"];

  return config;
}
