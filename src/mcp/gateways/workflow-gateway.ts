import type { WorkflowEngine } from "../../core/workflow-engine.js";
import type { FamaConfig } from "../../core/types.js";
import { parseScale } from "../../workflow/scaling.js";

type WorkflowAction = "init" | "status" | "advance" | "complete";

interface WorkflowGatewayParams {
  action: WorkflowAction;
  name?: string;
  scale?: string;
}

/**
 * MCP Gateway for workflow-related operations.
 */
export async function handleWorkflowGateway(
  params: WorkflowGatewayParams,
  workflowEngine: WorkflowEngine,
  config: FamaConfig,
): Promise<string> {
  switch (params.action) {
    case "init": {
      if (!params.name) return "Error: name is required for 'init' action.";
      const s = params.scale ? parseScale(params.scale) : config.workflow.defaultScale;
      workflowEngine.init(params.name, s);
      return workflowEngine.getSummary();
    }

    case "status": {
      return workflowEngine.getSummary();
    }

    case "advance": {
      await workflowEngine.advance();
      return workflowEngine.getSummary();
    }

    case "complete": {
      workflowEngine.completeCurrent();
      return workflowEngine.getSummary();
    }

    default:
      return `Unknown action "${params.action}". Available: init, status, advance, complete`;
  }
}
