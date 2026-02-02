import { z } from "zod";
import { tool } from "@anthropic-ai/claude-agent-sdk";
import { SkillRegistry } from "../core/skill-registry.js";
import { AgentRegistry } from "../core/agent-registry.js";
import { WorkflowEngine } from "../core/workflow-engine.js";
import { parseScale } from "../workflow/scaling.js";

const cwd = process.cwd();

export function createMcpTools() {
  const skillRegistry = new SkillRegistry(cwd);
  const agentRegistry = new AgentRegistry(cwd);
  const workflowEngine = new WorkflowEngine(cwd);

  return [
    tool(
      "fama_list_agents",
      "List all available coding agents with descriptions",
      {},
      async () => {
        const agents = agentRegistry.getAll();
        const text = agents
          .map((a) => `${a.slug}: ${a.description} (phases: ${a.phases.join(",")})`  )
          .join("\n");
        return { content: [{ type: "text" as const, text }] };
      },
    ),

    tool(
      "fama_list_skills",
      "List all available coding skills",
      {},
      async () => {
        const skills = skillRegistry.getAll();
        const text = skills
          .map((s) => `${s.slug}: ${s.description} (phases: ${s.phases.join(",")})`)
          .join("\n");
        return { content: [{ type: "text" as const, text }] };
      },
    ),

    tool(
      "fama_get_skill",
      "Get the full content of a specific skill",
      { slug: z.string().describe("The skill slug to retrieve") },
      async ({ slug }) => {
        const content = skillRegistry.getContent(slug);
        if (!content) {
          return {
            content: [{ type: "text" as const, text: `Skill "${slug}" not found.` }],
            isError: true,
          };
        }
        return { content: [{ type: "text" as const, text: content }] };
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
        const s = parseScale(scale ?? "medium");
        const state = workflowEngine.init(name, s);
        return {
          content: [{ type: "text" as const, text: workflowEngine.getSummary() }],
        };
      },
    ),

    tool(
      "fama_workflow_status",
      "Get the current workflow status",
      {},
      async () => {
        const summary = workflowEngine.getSummary();
        return { content: [{ type: "text" as const, text: summary }] };
      },
    ),

    tool(
      "fama_workflow_advance",
      "Advance the workflow to the next phase",
      {},
      async () => {
        try {
          const result = workflowEngine.advance();
          const summary = workflowEngine.getSummary();
          return { content: [{ type: "text" as const, text: summary }] };
        } catch (err) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Gate check failed: ${err instanceof Error ? err.message : String(err)}`,
              },
            ],
            isError: true,
          };
        }
      },
    ),
  ];
}
