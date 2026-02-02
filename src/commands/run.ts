import { SkillRegistry } from "../core/skill-registry.js";
import { AgentRegistry } from "../core/agent-registry.js";
import { runAgent } from "../core/agent-runner.js";
import { autoSelectAgent } from "../core/scale-detector.js";
import { loadConfig } from "../utils/config.js";
import { log } from "../utils/logger.js";

interface RunOptions {
  agent?: string;
  skills?: string;
  model?: string;
  maxTurns?: string;
  verbose?: boolean;
  cwd?: string;
}

export async function runCommand(task: string, opts: RunOptions) {
  const cwd = opts.cwd ?? process.cwd();
  const config = loadConfig(cwd);
  const skillRegistry = new SkillRegistry(cwd);
  const agentRegistry = new AgentRegistry(cwd);

  // Auto-select agent if not specified
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

  log.heading(`Running agent: ${agentSlug}`);

  const extraSkills = opts.skills?.split(",").map((s) => s.trim()) ?? [];

  try {
    const result = await runAgent(
      {
        task,
        agent: agentSlug,
        skills: extraSkills,
        model: opts.model ?? config.model,
        maxTurns: opts.maxTurns ? parseInt(opts.maxTurns, 10) : config.maxTurns,
        verbose: opts.verbose ?? false,
        cwd,
      },
      agentRegistry,
      skillRegistry,
    );

    if (result) {
      console.log("\n" + result);
    }

    log.success("Agent completed.");
  } catch (err) {
    log.error(`Agent failed: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}
