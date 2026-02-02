import { SkillRegistry } from "../core/skill-registry.js";
import { AgentRegistry } from "../core/agent-registry.js";
import { runAgent } from "../core/agent-runner.js";
import { loadConfig } from "../utils/config.js";
import { log } from "../utils/logger.js";

interface DebugOptions {
  model?: string;
  verbose?: boolean;
  cwd?: string;
}

export async function debugCommand(description: string, opts: DebugOptions) {
  const cwd = opts.cwd ?? process.cwd();
  const config = loadConfig(cwd);
  const skillRegistry = new SkillRegistry(cwd);
  const agentRegistry = new AgentRegistry(cwd);

  log.heading("Systematic debugging session");

  try {
    const result = await runAgent(
      {
        task: `Debug the following issue: ${description}. Use systematic debugging: investigate root cause first, gather evidence, then propose and test a fix.`,
        agent: "bug-fixer",
        skills: ["systematic-debugging", "test-driven-development", "verification"],
        model: opts.model ?? config.model,
        maxTurns: config.maxTurns,
        verbose: opts.verbose ?? false,
        cwd,
      },
      agentRegistry,
      skillRegistry,
    );

    if (result) console.log("\n" + result);
    log.success("Debug session completed.");
  } catch (err) {
    log.error(`Debug failed: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}
