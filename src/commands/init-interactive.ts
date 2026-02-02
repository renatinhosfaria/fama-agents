import { existsSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { stringify as yamlStringify } from "yaml";
import { askText, askSelect, askConfirm, askMultiSelect } from "../utils/interactive.js";
import { scaffoldDocs } from "../services/scaffold/scaffold-service.js";
import { log } from "../utils/logger.js";

/**
 * Interactive init wizard — guides user through .fama.yaml setup.
 */
export async function initInteractive(opts: { cwd?: string; force?: boolean }): Promise<void> {
  const cwd = opts.cwd ?? process.cwd();
  const configPath = resolve(cwd, ".fama.yaml");

  if (existsSync(configPath) && !opts.force) {
    const overwrite = await askConfirm(".fama.yaml already exists. Overwrite?", false);
    if (!overwrite) {
      log.dim("Cancelled.");
      return;
    }
  }

  log.heading("fama-agents — Interactive Setup");
  console.log();

  // 1. Language
  const lang = await askSelect("Select language:", [
    { label: "Português (PT-BR)", value: "pt-BR" },
    { label: "English", value: "en" },
  ]);

  // 2. Model
  const model = await askSelect("Default model:", [
    { label: "Sonnet (recommended)", value: "sonnet" },
    { label: "Opus (most capable)", value: "opus" },
    { label: "Haiku (fastest)", value: "haiku" },
  ]);

  // 3. Scale
  const scale = await askSelect("Default workflow scale:", [
    { label: "Medium (balanced)", value: "medium" },
    { label: "Quick (skip formality)", value: "quick" },
    { label: "Small (light process)", value: "small" },
    { label: "Large (full process)", value: "large" },
  ]);

  // 4. Gates
  const requirePlan = await askConfirm("Require planning phase for medium+ tasks?", true);
  const requireApproval = await askConfirm("Require explicit approval to advance phases?", false);

  // 5. Max turns
  const maxTurnsStr = await askText("Max turns per agent execution", "50");
  const maxTurns = parseInt(maxTurnsStr, 10) || 50;

  // 6. Provider
  const provider = await askSelect("Default LLM provider:", [
    { label: "Claude (Anthropic)", value: "claude" },
    { label: "OpenAI", value: "openai" },
    { label: "OpenRouter", value: "openrouter" },
  ]);

  // 7. Scaffold docs
  const scaffoldOption = await askConfirm("Scaffold documentation templates in .fama/docs/?", true);

  // Build config
  const scaleMap: Record<string, number> = {
    quick: 0,
    small: 1,
    medium: 2,
    large: 3,
  };

  const config: Record<string, unknown> = {
    model,
    maxTurns,
    lang,
    skillsDir: "./skills",
    workflow: {
      defaultScale: scaleMap[scale] ?? 2,
      gates: {
        requirePlan,
        requireApproval,
      },
    },
  };

  if (provider !== "claude") {
    config.provider = { default: provider };
  }

  // Preview
  console.log("\n--- Preview ---");
  console.log(yamlStringify(config));
  console.log("--- End ---\n");

  const confirm = await askConfirm("Save this configuration?", true);
  if (!confirm) {
    log.dim("Cancelled.");
    return;
  }

  // Write config
  writeFileSync(configPath, yamlStringify(config), "utf-8");
  log.success(`Created ${configPath}`);

  // Create base directories
  const dirs = [".fama", ".fama/plans", ".fama/agents"];
  for (const dir of dirs) {
    const fullPath = resolve(cwd, dir);
    if (!existsSync(fullPath)) {
      mkdirSync(fullPath, { recursive: true });
      log.dim(`  Created ${dir}/`);
    }
  }

  // Scaffold docs
  if (scaffoldOption) {
    const written = scaffoldDocs(cwd);
    if (written.length > 0) {
      log.success(`Scaffolded ${written.length} documentation templates in .fama/docs/`);
    }
  }

  log.success("\nProject initialized. Run `fama agents list` to see available agents.");
}
