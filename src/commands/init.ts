import { existsSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { stringify as stringifyYaml } from "yaml";
import { log } from "../utils/logger.js";

interface InitOptions {
  cwd?: string;
  force?: boolean;
}

export function initCommand(opts: InitOptions = {}) {
  const cwd = opts.cwd ?? process.cwd();
  const configPath = resolve(cwd, ".fama.yaml");

  if (existsSync(configPath) && !opts.force) {
    log.warn(".fama.yaml already exists. Use --force to overwrite.");
    return;
  }

  const config = {
    model: "sonnet",
    maxTurns: 50,
    lang: "pt-BR",
    skillsDir: "./skills",
    workflow: {
      defaultScale: "medium",
      gates: {
        requirePlan: true,
        requireApproval: false,
      },
    },
  };

  writeFileSync(configPath, stringifyYaml(config), "utf-8");
  mkdirSync(resolve(cwd, "skills"), { recursive: true });
  mkdirSync(resolve(cwd, "agents"), { recursive: true });

  log.success("Projeto fama inicializado:");
  log.dim("  .fama.yaml");
  log.dim("  skills/");
  log.dim("  agents/");
}
