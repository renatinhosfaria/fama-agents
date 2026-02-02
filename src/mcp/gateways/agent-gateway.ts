import type { AgentRegistry } from "../../core/agent-registry.js";
import type { StackDetector } from "../../services/stack/stack-detector.js";

type AgentAction = "list" | "show" | "prompt" | "recommend";

interface AgentGatewayParams {
  action: AgentAction;
  slug?: string;
}

/**
 * MCP Gateway for agent-related operations.
 */
export function handleAgentGateway(
  params: AgentGatewayParams,
  agentRegistry: AgentRegistry,
  stackDetector?: StackDetector,
): string {
  switch (params.action) {
    case "list": {
      const agents = agentRegistry.getAll();
      return agents
        .map((a) => {
          const icon = a.persona?.icon ? `${a.persona.icon} ` : "";
          return `${icon}${a.slug}: ${a.description} (phases: ${a.phases.join(",")})`;
        })
        .join("\n");
    }

    case "show": {
      if (!params.slug) return "Error: slug is required for 'show' action.";
      const agent = agentRegistry.getBySlug(params.slug);
      if (!agent) return `Agent "${params.slug}" not found.`;

      const lines: string[] = [];
      lines.push(`# ${agent.name}`);
      lines.push(`**Description:** ${agent.description}`);
      lines.push(`**Model:** ${agent.model}`);
      lines.push(`**Phases:** ${agent.phases.join(", ")}`);
      lines.push(`**Tools:** ${agent.tools.join(", ")}`);
      lines.push(`**Skills:** ${agent.defaultSkills.join(", ")}`);

      if (agent.persona) {
        lines.push(`\n## Persona`);
        if (agent.persona.displayName) lines.push(`**Name:** ${agent.persona.displayName}`);
        if (agent.persona.role) lines.push(`**Role:** ${agent.persona.role}`);
        if (agent.persona.identity) lines.push(`**Identity:** ${agent.persona.identity}`);
      }

      if (agent.criticalActions && agent.criticalActions.length > 0) {
        lines.push(`\n## Critical Actions`);
        for (const action of agent.criticalActions) lines.push(`- ${action}`);
      }

      return lines.join("\n");
    }

    case "prompt": {
      if (!params.slug) return "Error: slug is required for 'prompt' action.";
      const agent = agentRegistry.getBySlug(params.slug);
      if (!agent) return `Agent "${params.slug}" not found.`;
      return agent.prompt;
    }

    case "recommend": {
      if (!stackDetector) return "Stack detection not available.";
      const stack = stackDetector.detect();
      const recommendations = stackDetector.recommendAgents(stack);
      return `Recommended agents based on detected stack:\n${recommendations.join("\n")}`;
    }

    default:
      return `Unknown action "${params.action}". Available: list, show, prompt, recommend`;
  }
}
