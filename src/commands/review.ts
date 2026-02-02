import { SkillRegistry } from "../core/skill-registry.js";
import { AgentRegistry } from "../core/agent-registry.js";
import { runAgent } from "../core/agent-runner.js";
import { loadConfig } from "../utils/config.js";
import { log } from "../utils/logger.js";

interface ReviewOptions {
  model?: string;
  verbose?: boolean;
  cwd?: string;
}

export async function reviewCommand(path: string | undefined, opts: ReviewOptions) {
  const cwd = opts.cwd ?? process.cwd();
  const config = loadConfig(cwd);
  const skillRegistry = new SkillRegistry(cwd);
  const agentRegistry = new AgentRegistry(cwd);

  const target = path ?? ".";

  log.heading(`Code review: ${target}`);

  try {
    const result = await runAgent(
      {
        task: `Review the code at ${target}. Check for quality, security, correctness, and adherence to best practices. Categorize issues as Critical, Important, or Suggestion.`,
        agent: "code-reviewer",
        skills: ["code-review", "verification"],
        model: opts.model ?? config.model,
        maxTurns: config.maxTurns,
        verbose: opts.verbose ?? false,
        cwd,
      },
      agentRegistry,
      skillRegistry,
    );

    if (result) console.log("\n" + result);
    log.success("Review completed.");
  } catch (err) {
    log.error(`Review failed: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}
