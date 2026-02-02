import { createSdkMcpServer } from "@anthropic-ai/claude-agent-sdk";
import { createMcpTools } from "./tools.js";
import { log } from "../utils/logger.js";

export async function startMcpServer() {
  log.info("Starting fama-agents MCP server...");

  const tools = createMcpTools();

  const server = createSdkMcpServer({
    name: "fama-agents",
    version: "0.1.0",
    tools,
  });

  log.success("MCP server started. Listening for connections...");

  return server;
}
