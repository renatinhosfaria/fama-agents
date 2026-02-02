import { z } from "zod";
import { tool } from "@anthropic-ai/claude-agent-sdk";
import { SkillRegistry } from "../core/skill-registry.js";
import { AgentRegistry } from "../core/agent-registry.js";
import { WorkflowEngine } from "../core/workflow-engine.js";
import { parseScale } from "../workflow/scaling.js";
import { loadConfig } from "../utils/config.js";

const cwd = process.cwd();

function mcpError(message: string) {
  return {
    content: [{ type: "text" as const, text: message }],
    isError: true,
  };
}

export function createMcpTools() {
  const config = loadConfig(cwd);
  const skillRegistry = new SkillRegistry(cwd, config.skillsDir);
  const agentRegistry = new AgentRegistry(cwd);
  const workflowEngine = new WorkflowEngine(cwd, { gates: config.workflow.gates });

  return [
    tool(
      "fama_list_agents",
      "List all available coding agents with descriptions",
      {},
      async () => {
        try {
          const agents = agentRegistry.getAll();
          const text = agents
            .map((a) => `${a.slug}: ${a.description} (phases: ${a.phases.join(",")})`)
            .join("\n");
          return { content: [{ type: "text" as const, text }] };
        } catch (err) {
          return mcpError(`Error listing agents: ${err instanceof Error ? err.message : String(err)}`);
        }
      },
    ),

    tool(
      "fama_list_skills",
      "List all available coding skills",
      {},
      async () => {
        try {
          const skills = skillRegistry.getAll();
          const text = skills
            .map((s) => `${s.slug}: ${s.description} (phases: ${s.phases.join(",")})`)
            .join("\n");
          return { content: [{ type: "text" as const, text }] };
        } catch (err) {
          return mcpError(`Error listing skills: ${err instanceof Error ? err.message : String(err)}`);
        }
      },
    ),

    tool(
      "fama_get_skill",
      "Get the full content of a specific skill",
      { slug: z.string().describe("The skill slug to retrieve") },
      async ({ slug }) => {
        try {
          const content = skillRegistry.getContent(slug);
          if (!content) {
            return mcpError(`Skill "${slug}" not found.`);
          }
          return { content: [{ type: "text" as const, text: content }] };
        } catch (err) {
          return mcpError(`Error loading skill: ${err instanceof Error ? err.message : String(err)}`);
        }
      },
    ),

    tool(
      "fama_workflow_init",
      "Initialize a new PREVEC workflow",
      {
        name: z.string().describe("Workflow name"),
        scale: z.string().optional().describe("Scale: quick, small, medium, large"),
      },
      async ({ name, scale }) => {
        try {
          const s = scale ? parseScale(scale) : config.workflow.defaultScale;
          workflowEngine.init(name, s);
          return {
            content: [{ type: "text" as const, text: workflowEngine.getSummary() }],
          };
        } catch (err) {
          return mcpError(`Error initializing workflow: ${err instanceof Error ? err.message : String(err)}`);
        }
      },
    ),

    tool(
      "fama_workflow_status",
      "Get the current workflow status",
      {},
      async () => {
        try {
          const summary = workflowEngine.getSummary();
          return { content: [{ type: "text" as const, text: summary }] };
        } catch (err) {
          return mcpError(`Error getting status: ${err instanceof Error ? err.message : String(err)}`);
        }
      },
    ),

    tool(
      "fama_workflow_advance",
      "Advance the workflow to the next phase",
      {},
      async () => {
        try {
          workflowEngine.advance();
          const summary = workflowEngine.getSummary();
          return { content: [{ type: "text" as const, text: summary }] };
        } catch (err) {
          return mcpError(`Error advancing workflow: ${err instanceof Error ? err.message : String(err)}`);
        }
      },
    ),
  ];
}
