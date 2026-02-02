import { SkillRegistry } from "../core/skill-registry.js";
import { AgentRegistry } from "../core/agent-registry.js";
import { runAgent } from "../core/agent-runner.js";
import { loadConfig } from "../utils/config.js";
import { log } from "../utils/logger.js";

interface PlanOptions {
  execute?: string;
  model?: string;
  verbose?: boolean;
  cwd?: string;
}

export async function planCommand(description: string, opts: PlanOptions) {
  const cwd = opts.cwd ?? process.cwd();
  const config = loadConfig(cwd);
  const skillRegistry = new SkillRegistry(cwd, config.skillsDir);
  const agentRegistry = new AgentRegistry(cwd);

  if (opts.execute) {
    // Execute an existing plan
    log.heading("Executing plan...");

    try {
      const result = await runAgent(
        {
          task: `Execute the implementation plan at ${opts.execute}. Follow each task step by step using TDD. Report progress after each task.`,
          agent: "feature-developer",
          skills: ["executing-plans", "test-driven-development", "verification"],
          model: opts.model ?? config.model,
          maxTurns: config.maxTurns,
          verbose: opts.verbose ?? false,
          cwd,
        },
        agentRegistry,
        skillRegistry,
      );

      if (result) console.log("\n" + result);
      log.success("Plan execution completed.");
    } catch (err) {
      log.error(`Plan execution failed: ${err instanceof Error ? err.message : String(err)}`);
      process.exit(1);
    }
  } else {
    // Create a new plan
    log.heading("Creating implementation plan...");

    try {
      const result = await runAgent(
        {
          task: `Create a detailed implementation plan for: ${description}. Break it into small, testable tasks. Save the plan to docs/plans/ directory.`,
          agent: "architect",
          skills: ["brainstorming", "writing-plans", "feature-breakdown"],
          model: opts.model ?? config.model,
          maxTurns: config.maxTurns,
          verbose: opts.verbose ?? false,
          cwd,
        },
        agentRegistry,
        skillRegistry,
      );

      if (result) console.log("\n" + result);
      log.success("Plan created.");
    } catch (err) {
      log.error(`Plan creation failed: ${err instanceof Error ? err.message : String(err)}`);
      process.exit(1);
    }
  }
}
