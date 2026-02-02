import { SkillRegistry } from "../core/skill-registry.js";
import { AgentRegistry } from "../core/agent-registry.js";
import { runAgent } from "../core/agent-runner.js";
import { detectScale, autoSelectAgent } from "../core/scale-detector.js";
import { loadConfig } from "../utils/config.js";
import { log } from "../utils/logger.js";
import { ProjectScale } from "../core/types.js";
import { scaleLabel } from "../workflow/scaling.js";

interface QuickOptions {
  agent?: string;
  model?: string;
  verbose?: boolean;
  cwd?: string;
}

export async function quickCommand(task: string, opts: QuickOptions) {
  const cwd = opts.cwd ?? process.cwd();
  const config = loadConfig(cwd);
  const skillRegistry = new SkillRegistry(cwd, config.skillsDir);
  const agentRegistry = new AgentRegistry(cwd);

  const scale = detectScale(task);

  if (scale >= ProjectScale.MEDIUM) {
    log.warn(
      `Task detected as ${scaleLabel(scale)}. "fama quick" is designed for QUICK/SMALL tasks.`,
    );
    log.info(`Consider using: fama run "${task}"`);
    log.info("Proceeding anyway with reduced ceremony...");
  }

  const agentSlug = opts.agent ?? autoSelectAgent(task);
  const agentConfig = agentRegistry.getBySlug(agentSlug);

  if (!agentConfig) {
    log.error(`Agent "${agentSlug}" not found.`);
    log.info("Available agents:");
    for (const a of agentRegistry.getAll()) {
      log.dim(`  ${a.slug} - ${a.description}`);
    }
    process.exit(1);
  }

  log.heading(`[quick] Agent: ${agentSlug} | Scale: ${scaleLabel(scale)}`);

  const extraSkills: string[] = [];
  if (scale === ProjectScale.SMALL) {
    extraSkills.push("writing-plans");
  }

  try {
    const result = await runAgent(
      {
        task,
        agent: agentSlug,
        skills: extraSkills,
        model: opts.model ?? config.model,
        maxTurns: config.maxTurns,
        verbose: opts.verbose ?? false,
        cwd,
      },
      agentRegistry,
      skillRegistry,
    );

    if (result) {
      console.log("\n" + result);
    }

    log.success("Quick task completed.");
  } catch (err) {
    log.error(`Quick task failed: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}
