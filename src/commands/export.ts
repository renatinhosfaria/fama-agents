import { loadConfig } from "../utils/config.js";
import { AgentRegistry } from "../core/agent-registry.js";
import { SkillRegistry } from "../core/skill-registry.js";
import { StackDetector } from "../services/stack/stack-detector.js";
import {
  runExport,
  getPresetNames,
  type ExportContext,
} from "../services/export/export-service.js";
import { log } from "../utils/logger.js";

interface ExportOptions {
  preset?: string;
  dryRun?: boolean;
  cwd?: string;
}

export function exportCommand(opts: ExportOptions): void {
  const cwd = opts.cwd ?? process.cwd();
  const config = loadConfig(cwd);

  const presetInput = opts.preset ?? "all";
  const presetNames = presetInput === "all" ? ["all"] : presetInput.split(",").map((s) => s.trim());

  // Validate preset names
  const available = getPresetNames();
  for (const name of presetNames) {
    if (name !== "all" && !available.includes(name)) {
      log.error(`Unknown preset "${name}". Available: ${available.join(", ")}, all`);
      process.exit(1);
    }
  }

  const agentRegistry = new AgentRegistry(cwd);
  const skillRegistry = new SkillRegistry(cwd, config.skillsDir);

  // Detect stack (optional)
  const detector = new StackDetector(cwd);
  const stack = detector.detect();
  const hasStack = stack.languages.length > 0 || stack.frameworks.length > 0;

  const context: ExportContext = {
    agents: agentRegistry.getAll(),
    skills: skillRegistry.getAll(),
    config,
    stack: hasStack ? stack : undefined,
    projectDir: cwd,
  };

  log.heading("Export");
  log.dim(`Presets: ${presetNames.join(", ")}`);
  log.dim(`Agents: ${context.agents.length}, Skills: ${context.skills.length}`);

  if (opts.dryRun) {
    log.dim("[dry-run mode]");
  }

  const { result, writtenFiles } = runExport(presetNames, context, {
    dryRun: opts.dryRun,
  });

  for (const f of writtenFiles) {
    log.success(`  ${opts.dryRun ? "[dry-run] " : ""}${f}`);
  }

  console.log(`\n${result.summary}`);
  log.success(`\nExport complete. ${writtenFiles.length} file(s) ${opts.dryRun ? "would be " : ""}written.`);
}
