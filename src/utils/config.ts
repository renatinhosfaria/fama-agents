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
  llmFirst: {
    enabled: true,
    output: {
      structured: true,
      format: "compact",
      quiet: true,
    },
    budgets: {},
    manifold: {
      enabled: true,
      policy: "always",
    },
    parallel: {
      enabled: true,
      phases: ["R", "V"],
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

  const parseBool = (value: string | undefined): boolean | undefined => {
    if (!value) return undefined;
    const normalized = value.toLowerCase();
    if (["1", "true", "yes", "y", "on"].includes(normalized)) return true;
    if (["0", "false", "no", "n", "off"].includes(normalized)) return false;
    return undefined;
  };

  const parseIntEnv = (value: string | undefined): number | undefined => {
    if (!value) return undefined;
    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? undefined : parsed;
  };

  const llmEnabled = parseBool(process.env["FAMA_LLM_FIRST"]);
  if (llmEnabled !== undefined) config.llmFirst.enabled = llmEnabled;

  const structured = parseBool(process.env["FAMA_LLM_FIRST_STRUCTURED"]);
  if (structured !== undefined) config.llmFirst.output.structured = structured;

  const quiet = parseBool(process.env["FAMA_LLM_FIRST_QUIET"]);
  if (quiet !== undefined) config.llmFirst.output.quiet = quiet;

  const format = process.env["FAMA_LLM_FIRST_FORMAT"];
  if (format && ["compact", "pretty", "raw"].includes(format)) {
    config.llmFirst.output.format = format as "compact" | "pretty" | "raw";
  }

  const skillBudget = parseIntEnv(process.env["FAMA_SKILL_BUDGET"]);
  if (skillBudget !== undefined) {
    config.llmFirst.budgets.skills = skillBudget;
  }

  const contextBudget = parseIntEnv(process.env["FAMA_CONTEXT_BUDGET"]);
  if (contextBudget !== undefined) {
    config.llmFirst.budgets.context = contextBudget;
  }

  const parallelEnabled = parseBool(process.env["FAMA_PARALLEL"]);
  if (parallelEnabled !== undefined) config.llmFirst.parallel.enabled = parallelEnabled;

  const parallelPhases = process.env["FAMA_PARALLEL_PHASES"];
  if (parallelPhases) {
    const phases = parallelPhases
      .split(",")
      .map((p) => p.trim().toUpperCase())
      .filter((p) => ["P", "R", "E", "V", "C"].includes(p));
    if (phases.length > 0) {
      config.llmFirst.parallel.phases = phases as ("P" | "R" | "E" | "V" | "C")[];
    }
  }

  const manifoldEnabled = parseBool(process.env["FAMA_MANIFOLD"]);
  if (manifoldEnabled !== undefined) config.llmFirst.manifold.enabled = manifoldEnabled;

  const manifoldPolicy = process.env["FAMA_MANIFOLD_POLICY"];
  if (manifoldPolicy && ["always", "structuredOnly"].includes(manifoldPolicy)) {
    config.llmFirst.manifold.policy = manifoldPolicy as "always" | "structuredOnly";
  }

  // Initialize i18n with resolved language
  initI18n(config.lang);

  return config;
}
