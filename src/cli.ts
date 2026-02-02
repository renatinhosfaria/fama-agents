import { Command } from "commander";
import { runCommand } from "./commands/run.js";
import { planCommand } from "./commands/plan.js";
import { reviewCommand } from "./commands/review.js";
import { debugCommand } from "./commands/debug.js";
import { quickCommand } from "./commands/quick.js";
import { initCommand } from "./commands/init.js";
import { completionsCommand } from "./commands/completions.js";

export function createCli() {
  const program = new Command();

  program
    .name("fama")
    .description("Sistema de agentes de codificação com Claude Agent SDK")
    .version("0.1.0")
    .option("--json", "Output results as JSON");

  // fama run <task>
  program
    .command("run")
    .description("Run an agent on a task (auto-selects agent if not specified)")
    .argument("<task>", "Task description")
    .option("--agent <slug>", "Agent to use")
    .option("--skills <list>", "Additional skills (comma-separated)")
    .option("--model <model>", "Model to use")
    .option("--max-turns <n>", "Maximum turns")
    .option("--verbose", "Show agent tool calls")
    .option("--dry-run", "Preview execution without running")
    .option("--trigger <trigger>", "Execute a menu trigger from the agent")
    .option("--cwd <path>", "Working directory")
    .action(runCommand);

  // fama quick <task>
  program
    .command("quick")
    .description("Run a quick task (QUICK/SMALL scale, minimal ceremony)")
    .argument("<task>", "Task description")
    .option("--agent <slug>", "Agent to use")
    .option("--model <model>", "Model to use")
    .option("--verbose", "Show agent tool calls")
    .option("--cwd <path>", "Working directory")
    .action(quickCommand);

  // fama plan <description>
  program
    .command("plan")
    .description("Create or execute an implementation plan")
    .argument("<description>", "Feature description")
    .option("--execute <file>", "Execute an existing plan file")
    .option("--model <model>", "Model to use")
    .option("--verbose", "Show agent tool calls")
    .option("--cwd <path>", "Working directory")
    .action(planCommand);

  // fama review [path]
  program
    .command("review")
    .description("Run code review on a path")
    .argument("[path]", "Path to review")
    .option("--model <model>", "Model to use")
    .option("--verbose", "Show agent tool calls")
    .option("--validate", "Use adversarial review mode (zero findings triggers re-analysis)")
    .option("--checklist <path>", "Validate against a checklist file (implies --validate)")
    .option("--cwd <path>", "Working directory")
    .action(reviewCommand);

  // fama debug <description>
  program
    .command("debug")
    .description("Start a systematic debugging session")
    .argument("<description>", "Bug description")
    .option("--model <model>", "Model to use")
    .option("--verbose", "Show agent tool calls")
    .option("--cwd <path>", "Working directory")
    .action(debugCommand);

  registerWorkflowCommands(program);
  registerSkillsCommands(program);
  registerAgentsCommands(program);
  registerTeamsCommands(program);
  registerPartyCommand(program);
  registerModuleCommands(program);

  // fama init
  program
    .command("init")
    .description("Initialize a new fama project")
    .option("--force", "Overwrite existing config")
    .option("--cwd <path>", "Working directory")
    .action((opts: { force?: boolean; cwd?: string }) => initCommand(opts));

  // fama completions <shell>
  program
    .command("completions")
    .description("Generate shell completion script")
    .argument("<shell>", "Shell type: bash, zsh, fish")
    .action((shell: string) => completionsCommand(shell));

  // fama mcp
  program
    .command("mcp")
    .description("Start as MCP server")
    .action(async () => {
      const { startMcpServer } = await import("./mcp/server.js");
      await startMcpServer();
    });

  return program;
}

function registerWorkflowCommands(program: Command): void {
  const workflow = program
    .command("workflow")
    .description("Manage PREVEC workflow");

  workflow
    .command("init")
    .description("Initialize a new workflow")
    .argument("<name>", "Workflow name")
    .option("--scale <scale>", "Scale: quick, small, medium, large")
    .option("--cwd <path>", "Working directory")
    .action(async (name: string, opts: { scale?: string; cwd?: string }) => {
      const { workflowInitCommand } = await import("./commands/workflow.js");
      workflowInitCommand(name, opts);
    });

  workflow
    .command("status")
    .description("Show workflow status")
    .option("--cwd <path>", "Working directory")
    .action(async (opts: { cwd?: string }) => {
      const { workflowStatusCommand } = await import("./commands/workflow.js");
      workflowStatusCommand(opts);
    });

  workflow
    .command("advance")
    .description("Advance to the next workflow phase")
    .option("--cwd <path>", "Working directory")
    .action(async (opts: { cwd?: string }) => {
      const { workflowAdvanceCommand } = await import("./commands/workflow.js");
      workflowAdvanceCommand(opts);
    });

  workflow
    .command("complete")
    .description("Mark current workflow phase as completed")
    .option("--cwd <path>", "Working directory")
    .action(async (opts: { cwd?: string }) => {
      const { workflowCompleteCommand } = await import("./commands/workflow.js");
      workflowCompleteCommand(opts);
    });

  workflow
    .command("run")
    .description("Run the recommended agent for the current workflow phase")
    .argument("<task>", "Task description")
    .option("--agent <slug>", "Agent to use")
    .option("--skills <list>", "Additional skills (comma-separated)")
    .option("--model <model>", "Model to use")
    .option("--max-turns <n>", "Maximum turns")
    .option("--complete", "Mark phase as completed after run")
    .option("--advance", "Advance to next phase after run")
    .option("--verbose", "Show agent tool calls")
    .option("--cwd <path>", "Working directory")
    .action(async (task: string, opts) => {
      const { workflowRunCommand } = await import("./commands/workflow.js");
      workflowRunCommand(task, opts);
    });

  workflow
    .command("exec")
    .description("Execute a step-file workflow")
    .argument("<name>", "Workflow name")
    .option("--model <model>", "Model to use")
    .option("--max-turns <n>", "Maximum turns")
    .option("--verbose", "Show agent tool calls")
    .option("--cwd <path>", "Working directory")
    .action(async (name: string, opts: { model?: string; maxTurns?: string; verbose?: boolean; cwd?: string }) => {
      const { workflowExecCommand } = await import("./commands/workflow-exec.js");
      await workflowExecCommand(name, opts);
    });

  workflow
    .command("list-templates")
    .description("List available step-file workflow templates")
    .option("--cwd <path>", "Working directory")
    .action(async (opts: { cwd?: string }) => {
      const { workflowListTemplatesCommand } = await import("./commands/workflow-exec.js");
      workflowListTemplatesCommand(opts);
    });
}

function registerSkillsCommands(program: Command): void {
  const skills = program
    .command("skills")
    .description("List and show skills");

  skills
    .command("list")
    .description("List all available skills")
    .action(async () => {
      const { skillsListCommand } = await import("./commands/skills.js");
      skillsListCommand(process.cwd(), { json: program.opts().json });
    });

  skills
    .command("show")
    .description("Show a skill's content")
    .argument("<slug>", "Skill slug")
    .action(async (slug: string) => {
      const { skillsShowCommand } = await import("./commands/skills.js");
      skillsShowCommand(slug);
    });

  skills.action(async () => {
    const { skillsListCommand } = await import("./commands/skills.js");
    skillsListCommand(process.cwd(), { json: program.opts().json });
  });
}

function registerAgentsCommands(program: Command): void {
  const agents = program
    .command("agents")
    .description("List and show agents");

  agents
    .command("list")
    .description("List all available agents")
    .action(async () => {
      const { agentsListCommand } = await import("./commands/agents.js");
      agentsListCommand(process.cwd(), { json: program.opts().json });
    });

  agents
    .command("show")
    .description("Show an agent's details")
    .argument("<slug>", "Agent slug")
    .action(async (slug: string) => {
      const { agentsShowCommand } = await import("./commands/agents.js");
      agentsShowCommand(slug);
    });

  agents
    .command("menu")
    .description("Show an agent's menu commands")
    .argument("<slug>", "Agent slug")
    .action(async (slug: string) => {
      const { agentsMenuCommand } = await import("./commands/menu.js");
      agentsMenuCommand(slug);
    });

  agents.action(async () => {
    const { agentsListCommand } = await import("./commands/agents.js");
    agentsListCommand(process.cwd(), { json: program.opts().json });
  });
}

function registerTeamsCommands(program: Command): void {
  const teams = program
    .command("teams")
    .description("Manage team configurations");

  teams
    .command("list")
    .description("List all configured teams")
    .option("--cwd <path>", "Working directory")
    .action(async (opts: { cwd?: string }) => {
      const { teamsListCommand } = await import("./commands/teams.js");
      teamsListCommand(opts.cwd ?? process.cwd());
    });

  teams
    .command("show")
    .description("Show team details")
    .argument("<name>", "Team name")
    .option("--cwd <path>", "Working directory")
    .action(async (name: string, opts: { cwd?: string }) => {
      const { teamsShowCommand } = await import("./commands/teams.js");
      teamsShowCommand(name, opts.cwd ?? process.cwd());
    });

  teams.action(async (opts: { cwd?: string }) => {
    const { teamsListCommand } = await import("./commands/teams.js");
    teamsListCommand(opts.cwd ?? process.cwd());
  });
}

function registerPartyCommand(program: Command): void {
  program
    .command("party")
    .description("Multi-agent discussion on a topic")
    .argument("<topic>", "Discussion topic")
    .option("--rounds <n>", "Number of discussion rounds", "3")
    .option("--agents <list>", "Comma-separated agent slugs")
    .option("--model <model>", "Model to use")
    .option("--max-turns <n>", "Maximum turns per agent")
    .option("--verbose", "Show agent tool calls")
    .option("--cwd <path>", "Working directory")
    .action(async (topic: string, opts) => {
      const { partyCommand } = await import("./commands/party.js");
      await partyCommand(topic, opts);
    });
}

function registerModuleCommands(program: Command): void {
  const module = program
    .command("module")
    .description("Manage fama modules");

  module
    .command("list")
    .description("List installed modules")
    .option("--cwd <path>", "Working directory")
    .action(async (opts: { cwd?: string }) => {
      const { moduleListCommand } = await import("./commands/module.js");
      moduleListCommand(opts.cwd ?? process.cwd());
    });

  module
    .command("install")
    .description("Install a module from a directory")
    .argument("<source>", "Source directory")
    .option("--cwd <path>", "Working directory")
    .action(async (source: string, opts: { cwd?: string }) => {
      const { moduleInstallCommand } = await import("./commands/module.js");
      moduleInstallCommand(source, opts.cwd ?? process.cwd());
    });

  module
    .command("uninstall")
    .description("Uninstall a module")
    .argument("<name>", "Module name")
    .option("--cwd <path>", "Working directory")
    .action(async (name: string, opts: { cwd?: string }) => {
      const { moduleUninstallCommand } = await import("./commands/module.js");
      moduleUninstallCommand(name, opts.cwd ?? process.cwd());
    });

  module.action(async (opts: { cwd?: string }) => {
    const { moduleListCommand } = await import("./commands/module.js");
    moduleListCommand(opts.cwd ?? process.cwd());
  });
}
