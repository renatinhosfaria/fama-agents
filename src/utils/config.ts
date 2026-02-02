import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { parse as parseYaml } from "yaml";
import { ProjectScale, type FamaConfig } from "../core/types.js";
import { FamaConfigSchema } from "../core/schemas.js";
import { log } from "./logger.js";
import { initI18n } from "./i18n/index.js";

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
 * Deep merges source into target (mutates target).
 * Only merges plain objects; arrays and primitives are overwritten.
 */
function deepMerge(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
): Record<string, unknown> {
  for (const key of Object.keys(source)) {
    const srcVal = source[key];
    const tgtVal = target[key];
    if (
      srcVal !== null &&
      typeof srcVal === "object" &&
      !Array.isArray(srcVal) &&
      tgtVal !== null &&
      typeof tgtVal === "object" &&
      !Array.isArray(tgtVal)
    ) {
      deepMerge(tgtVal as Record<string, unknown>, srcVal as Record<string, unknown>);
    } else {
      target[key] = srcVal;
    }
  }
  return target;
}

/**
 * Loads configuration from .fama.yaml (project) and environment variables.
 * Priority: CLI flags > env vars > project config > defaults
 */
export function loadConfig(cwd: string = process.cwd()): FamaConfig {
  const config = structuredClone(DEFAULT_CONFIG);

  // Load project config
  const configPath = resolve(cwd, ".fama.yaml");
  if (existsSync(configPath)) {
    try {
      const raw = readFileSync(configPath, "utf-8");
      const parsed = parseYaml(raw);
      if (parsed && typeof parsed === "object") {
        deepMerge(config as unknown as Record<string, unknown>, parsed as Record<string, unknown>);
      }
    } catch (err) {
      log.warn(`Failed to parse .fama.yaml: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // Validate merged config with Zod (fills defaults for missing fields)
  const validated = FamaConfigSchema.safeParse(config);
  if (!validated.success) {
    log.warn(
      `Config validation issues: ${validated.error.issues.map((i) => i.message).join(", ")}`,
    );
  }

  // Environment overrides
  if (process.env["FAMA_MODEL"]) {
    const allowedModels = ["sonnet", "opus", "haiku"];
    const model = process.env["FAMA_MODEL"];
    if (allowedModels.includes(model)) {
      config.model = model;
    } else {
      log.warn(`Invalid FAMA_MODEL "${model}", using default "${config.model}"`);
    }
  }
  if (process.env["FAMA_MAX_TURNS"]) {
    const parsed = parseInt(process.env["FAMA_MAX_TURNS"], 10);
    if (!Number.isNaN(parsed) && parsed > 0) config.maxTurns = parsed;
  }
  if (process.env["FAMA_LANG"]) config.lang = process.env["FAMA_LANG"];
  if (process.env["FAMA_SKILLS_DIR"]) config.skillsDir = process.env["FAMA_SKILLS_DIR"];
  if (process.env["FAMA_PROVIDER"]) {
    const allowed = ["claude", "anthropic", "openai", "openrouter"];
    const prov = process.env["FAMA_PROVIDER"];
    if (allowed.includes(prov)) {
      config.provider = { ...config.provider, default: prov };
    } else {
      log.warn(`Invalid FAMA_PROVIDER "${prov}", using default.`);
    }
  }

  // Initialize i18n with resolved language
  initI18n(config.lang);

  return config;
}
