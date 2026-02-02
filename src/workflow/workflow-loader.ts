import { readFileSync, readdirSync, existsSync } from "node:fs";
import { resolve, basename, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";
import { StepfileWorkflowConfigSchema } from "../core/schemas.js";
import { extractFrontmatter } from "../utils/frontmatter.js";
import type { StepDefinition, StepfileWorkflow } from "../core/types.js";
import { log } from "../utils/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function getBuiltInWorkflowsDir(): string {
  return resolve(__dirname, "..", "..", "workflows");
}

function getProjectWorkflowsDir(projectDir: string): string {
  return resolve(projectDir, "workflows");
}

/**
 * Carrega um step-file workflow a partir de um diretório.
 * Espera: workflow.yaml + steps/*.md
 */
export function loadStepfileWorkflow(workflowDir: string): StepfileWorkflow | null {
  const configPath = resolve(workflowDir, "workflow.yaml");
  if (!existsSync(configPath)) {
    log.warn(`workflow.yaml não encontrado em "${workflowDir}"`);
    return null;
  }

  try {
    const raw = readFileSync(configPath, "utf-8");
    const parsed = parseYaml(raw);
    const config = StepfileWorkflowConfigSchema.parse(parsed);

    const stepsDir = resolve(workflowDir, "steps");
    const steps: StepDefinition[] = [];

    if (existsSync(stepsDir)) {
      const stepFiles = readdirSync(stepsDir)
        .filter((f) => f.endsWith(".md"))
        .sort();

      // Validar prefixos duplicados (ex: dois arquivos 01-*.md)
      const prefixes = stepFiles.map((f) => f.split("-")[0]);
      const seen = new Set<string>();
      for (const prefix of prefixes) {
        if (prefix && seen.has(prefix)) {
          log.warn(`Prefixo de step duplicado "${prefix}" em "${stepsDir}". Steps podem ser executados fora de ordem.`);
          break;
        }
        if (prefix) seen.add(prefix);
      }

      for (let i = 0; i < stepFiles.length; i++) {
        const filePath = resolve(stepsDir, stepFiles[i]!);
        const content = readFileSync(filePath, "utf-8");
        const { body } = extractFrontmatter(content);

        const configStep = config.steps[i];
        const stepName = configStep?.name ?? basename(stepFiles[i]!, ".md");
        const stepDesc = configStep?.description ?? "";
        const stepAgent = configStep?.agent ?? "architect";
        const stepSkills = configStep?.skills;

        steps.push({
          order: i + 1,
          name: stepName,
          description: stepDesc,
          agent: stepAgent,
          skills: stepSkills,
          filePath,
          prompt: body,
        });
      }
    }

    return {
      name: config.name,
      description: config.description,
      outputDir: config.outputDir,
      steps,
    };
  } catch (err) {
    log.warn(
      `Falha ao carregar workflow "${workflowDir}": ${err instanceof Error ? err.message : String(err)}`,
    );
    return null;
  }
}

/**
 * Descobre todos os workflows disponíveis (built-in + projeto).
 */
export function discoverWorkflows(
  projectDir: string,
): { name: string; dir: string; source: "built-in" | "project" }[] {
  const results: { name: string; dir: string; source: "built-in" | "project" }[] = [];

  const scanDir = (dir: string, source: "built-in" | "project") => {
    if (!existsSync(dir)) return;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const workflowYaml = resolve(dir, entry.name, "workflow.yaml");
      if (existsSync(workflowYaml)) {
        results.push({ name: entry.name, dir: resolve(dir, entry.name), source });
      }
    }
  };

  scanDir(getBuiltInWorkflowsDir(), "built-in");
  scanDir(getProjectWorkflowsDir(projectDir), "project");

  return results;
}
