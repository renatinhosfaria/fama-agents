import { z } from "zod";
import { tool } from "@anthropic-ai/claude-agent-sdk";
import { SkillRegistry } from "../core/skill-registry.js";
import { AgentRegistry } from "../core/agent-registry.js";
import { WorkflowEngine } from "../core/workflow-engine.js";
import { StackDetector } from "../services/stack/stack-detector.js";
import { loadConfig } from "../utils/config.js";
import { handleAgentGateway } from "./gateways/agent-gateway.js";
import { handleSkillGateway } from "./gateways/skill-gateway.js";
import { handleWorkflowGateway } from "./gateways/workflow-gateway.js";
import { handleExploreGateway } from "./gateways/explore-gateway.js";

const cwd = process.cwd();

function mcpError(message: string) {
  return {
    content: [{ type: "text" as const, text: message }],
    isError: true,
  };
}

function mcpOk(text: string) {
  return { content: [{ type: "text" as const, text }] };
}

export function createMcpTools() {
  const config = loadConfig(cwd);
  const skillRegistry = new SkillRegistry(cwd, config.skillsDir);
  const agentRegistry = new AgentRegistry(cwd);
  const workflowEngine = new WorkflowEngine(cwd, { gates: config.workflow.gates });
  const stackDetector = new StackDetector(cwd);

  return [
    // ─── Gateway Tools ───────────────────────────────────────

    tool(
      "fama_agent",
      "Agent gateway — actions: list, show, prompt, recommend",
      {
        action: z.enum(["list", "show", "prompt", "recommend"]).describe("Action to perform"),
        slug: z.string().optional().describe("Agent slug (for show/prompt)"),
      },
      async ({ action, slug }) => {
        try {
          const result = handleAgentGateway({ action, slug }, agentRegistry, stackDetector);
          return mcpOk(result);
        } catch (err) {
          return mcpError(`Agent gateway error: ${err instanceof Error ? err.message : String(err)}`);
        }
      },
    ),

    tool(
      "fama_skill",
      "Skill gateway — actions: list, show, search, forPhase",
      {
        action: z.enum(["list", "show", "search", "forPhase"]).describe("Action to perform"),
        slug: z.string().optional().describe("Skill slug (for show)"),
        query: z.string().optional().describe("Search query (for search)"),
        phase: z.string().optional().describe("Workflow phase P/R/E/V/C (for forPhase)"),
      },
      async ({ action, slug, query, phase }) => {
        try {
          const result = handleSkillGateway({ action, slug, query, phase }, skillRegistry);
          return mcpOk(result);
        } catch (err) {
          return mcpError(`Skill gateway error: ${err instanceof Error ? err.message : String(err)}`);
        }
      },
    ),

    tool(
      "fama_workflow",
      "Workflow gateway — actions: init, status, advance, complete",
      {
        action: z.enum(["init", "status", "advance", "complete"]).describe("Action to perform"),
        name: z.string().optional().describe("Workflow name (for init)"),
        scale: z.string().optional().describe("Scale: quick, small, medium, large (for init)"),
      },
      async ({ action, name, scale }) => {
        try {
          const result = await handleWorkflowGateway({ action, name, scale }, workflowEngine, config);
          return mcpOk(result);
        } catch (err) {
          return mcpError(`Workflow gateway error: ${err instanceof Error ? err.message : String(err)}`);
        }
      },
    ),

    tool(
      "fama_explore",
      "Explore gateway — actions: stack, config, health",
      {
        action: z.enum(["stack", "config", "health"]).describe("Action to perform"),
      },
      async ({ action }) => {
        try {
          const result = handleExploreGateway({ action }, cwd, config);
          return mcpOk(result);
        } catch (err) {
          return mcpError(`Explore gateway error: ${err instanceof Error ? err.message : String(err)}`);
        }
      },
    ),

    // ─── Legacy Aliases (backward compatibility) ─────────────

    tool(
      "fama_list_agents",
      "[Alias] List all available coding agents — use fama_agent(action: 'list') instead",
      {},
      async () => {
        try {
          return mcpOk(handleAgentGateway({ action: "list" }, agentRegistry, stackDetector));
        } catch (err) {
          return mcpError(`Error listing agents: ${err instanceof Error ? err.message : String(err)}`);
        }
      },
    ),

    tool(
      "fama_list_skills",
      "[Alias] List all available skills — use fama_skill(action: 'list') instead",
      {},
      async () => {
        try {
          return mcpOk(handleSkillGateway({ action: "list" }, skillRegistry));
        } catch (err) {
          return mcpError(`Error listing skills: ${err instanceof Error ? err.message : String(err)}`);
        }
      },
    ),

    tool(
      "fama_get_skill",
      "[Alias] Get skill content — use fama_skill(action: 'show', slug) instead",
      { slug: z.string().describe("The skill slug to retrieve") },
      async ({ slug }) => {
        try {
          return mcpOk(handleSkillGateway({ action: "show", slug }, skillRegistry));
        } catch (err) {
          return mcpError(`Error loading skill: ${err instanceof Error ? err.message : String(err)}`);
        }
      },
    ),

    tool(
      "fama_workflow_init",
      "[Alias] Init workflow — use fama_workflow(action: 'init', name, scale) instead",
      {
        name: z.string().describe("Workflow name"),
        scale: z.string().optional().describe("Scale: quick, small, medium, large"),
      },
      async ({ name, scale }) => {
        try {
          return mcpOk(await handleWorkflowGateway({ action: "init", name, scale }, workflowEngine, config));
        } catch (err) {
          return mcpError(`Error initializing workflow: ${err instanceof Error ? err.message : String(err)}`);
        }
      },
    ),

    tool(
      "fama_workflow_status",
      "[Alias] Get workflow status — use fama_workflow(action: 'status') instead",
      {},
      async () => {
        try {
          return mcpOk(await handleWorkflowGateway({ action: "status" }, workflowEngine, config));
        } catch (err) {
          return mcpError(`Error getting status: ${err instanceof Error ? err.message : String(err)}`);
        }
      },
    ),

    tool(
      "fama_workflow_advance",
      "[Alias] Advance workflow — use fama_workflow(action: 'advance') instead",
      {},
      async () => {
        try {
          return mcpOk(await handleWorkflowGateway({ action: "advance" }, workflowEngine, config));
        } catch (err) {
          return mcpError(`Error advancing workflow: ${err instanceof Error ? err.message : String(err)}`);
        }
      },
    ),
  ];
}
