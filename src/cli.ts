import { Command } from "commander";
import { runCommand } from "./commands/run.js";
import { agentsListCommand, agentsShowCommand } from "./commands/agents.js";
import { skillsListCommand, skillsShowCommand } from "./commands/skills.js";
import {
  workflowInitCommand,
  workflowStatusCommand,
  workflowAdvanceCommand,
} from "./commands/workflow.js";
import { planCommand } from "./commands/plan.js";
import { reviewCommand } from "./commands/review.js";
import { debugCommand } from "./commands/debug.js";

export function createCli() {
  const program = new Command();

  program
    .name("fama")
    .description("Sistema de agentes de codificação com Claude Agent SDK")
    .version("0.1.0");

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
    .option("--cwd <path>", "Working directory")
    .action(runCommand);

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

  // fama workflow
  const workflow = program
    .command("workflow")
    .description("Manage PREVEC workflow");

  workflow
    .command("init")
    .description("Initialize a new workflow")
    .argument("<name>", "Workflow name")
    .option("--scale <scale>", "Scale: quick, small, medium, large", "medium")
    .action((name: string, opts: { scale?: string }) =>
      workflowInitCommand(name, opts),
    );

  workflow
    .command("status")
    .description("Show workflow status")
    .action(() => workflowStatusCommand());

  workflow
    .command("advance")
    .description("Advance to the next workflow phase")
    .action(() => workflowAdvanceCommand());

  // fama skills
  const skills = program
    .command("skills")
    .description("List and show skills");

  skills
    .command("list")
    .description("List all available skills")
    .action(() => skillsListCommand());

  skills
    .command("show")
    .description("Show a skill's content")
    .argument("<slug>", "Skill slug")
    .action((slug: string) => skillsShowCommand(slug));

  // Default: list skills
  skills.action(() => skillsListCommand());

  // fama agents
  const agents = program
    .command("agents")
    .description("List and show agents");

  agents
    .command("list")
    .description("List all available agents")
    .action(() => agentsListCommand());

  agents
    .command("show")
    .description("Show an agent's details")
    .argument("<slug>", "Agent slug")
    .action((slug: string) => agentsShowCommand(slug));

  // Default: list agents
  agents.action(() => agentsListCommand());

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
