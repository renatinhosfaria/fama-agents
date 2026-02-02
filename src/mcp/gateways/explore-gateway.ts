import { StackDetector } from "../../services/stack/stack-detector.js";
import type { FamaConfig } from "../../core/types.js";

type ExploreAction = "stack" | "config" | "health";

interface ExploreGatewayParams {
  action: ExploreAction;
}

/**
 * MCP Gateway for project exploration operations.
 */
export function handleExploreGateway(
  params: ExploreGatewayParams,
  projectDir: string,
  config: FamaConfig,
): string {
  switch (params.action) {
    case "stack": {
      const detector = new StackDetector(projectDir);
      const stack = detector.detect();
      return detector.formatSummary(stack);
    }

    case "config": {
      const lines: string[] = [];
      lines.push("## Current Configuration\n");
      lines.push(`**Model:** ${config.model}`);
      lines.push(`**Max Turns:** ${config.maxTurns}`);
      lines.push(`**Language:** ${config.lang}`);
      lines.push(`**Skills Dir:** ${config.skillsDir}`);
      lines.push(`**Workflow Scale:** ${config.workflow.defaultScale}`);
      lines.push(`**Require Plan:** ${config.workflow.gates.requirePlan}`);
      lines.push(`**Require Approval:** ${config.workflow.gates.requireApproval}`);
      if (config.provider) {
        lines.push(`**Provider:** ${config.provider.default ?? "claude"}`);
      }
      return lines.join("\n");
    }

    case "health": {
      const lines: string[] = [];
      lines.push("## Health Check\n");
      lines.push(`**Status:** OK`);
      lines.push(`**Project Dir:** ${projectDir}`);
      lines.push(`**Config Loaded:** true`);
      lines.push(`**Timestamp:** ${new Date().toISOString()}`);
      return lines.join("\n");
    }

    default:
      return `Unknown action "${params.action}". Available: stack, config, health`;
  }
}
