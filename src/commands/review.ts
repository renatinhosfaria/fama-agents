import { readFileSync } from "node:fs";
import { SkillRegistry } from "../core/skill-registry.js";
import { AgentRegistry } from "../core/agent-registry.js";
import { runAgent } from "../core/agent-runner.js";
import { loadConfig } from "../utils/config.js";
import { log } from "../utils/logger.js";

interface ReviewOptions {
  model?: string;
  verbose?: boolean;
  validate?: boolean;
  checklist?: string;
  cwd?: string;
}

export async function reviewCommand(path: string | undefined, opts: ReviewOptions) {
  const cwd = opts.cwd ?? process.cwd();
  const config = loadConfig(cwd);
  const skillRegistry = new SkillRegistry(cwd, config.skillsDir);
  const agentRegistry = new AgentRegistry(cwd);

  const target = path ?? ".";
  const isValidateMode = opts.validate === true;

  if (isValidateMode) {
    log.heading(`Adversarial validation: ${target}`);
  } else {
    log.heading(`Code review: ${target}`);
  }

  const skills = isValidateMode
    ? ["adversarial-review", "verification"]
    : ["code-review", "verification"];

  let task: string;

  if (isValidateMode) {
    let checklistContent = "";
    if (opts.checklist) {
      try {
        checklistContent = readFileSync(opts.checklist, "utf-8");
      } catch (err) {
        log.error(
          `Falha ao ler checklist "${opts.checklist}": ${err instanceof Error ? err.message : String(err)}`,
        );
        process.exit(1);
      }
    }

    task = checklistContent
      ? `Validate the code at ${target} against the following checklist. Use adversarial review — zero findings triggers mandatory re-analysis.\n\n--- CHECKLIST ---\n${checklistContent}\n--- END CHECKLIST ---`
      : `Validate the code at ${target} using adversarial review. Zero findings triggers mandatory re-analysis. Apply all lenses: Security, Edge Cases, Maintenance, Performance, Conformity.`;
  } else {
    task = `Review the code at ${target}. Check for quality, security, correctness, and adherence to best practices. Categorize issues as Critical, Important, or Suggestion.`;
  }

  try {
    const result = await runAgent(
      {
        task,
        agent: "code-reviewer",
        skills,
        model: opts.model ?? config.model,
        maxTurns: config.maxTurns,
        verbose: opts.verbose ?? false,
        cwd,
      },
      agentRegistry,
      skillRegistry,
    );

    if (result) console.log("\n" + result);
    log.success(isValidateMode ? "Validation completed." : "Review completed.");
  } catch (err) {
    log.error(`Review failed: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}
