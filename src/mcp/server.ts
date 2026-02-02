import { createSdkMcpServer } from "@anthropic-ai/claude-agent-sdk";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createMcpTools } from "./tools.js";
import { log } from "../utils/logger.js";

export async function startMcpServer() {
  log.info("Starting fama-agents MCP server...");

  const tools = createMcpTools();

  const serverConfig = createSdkMcpServer({
    name: "fama-agents",
    version: "0.1.0",
    tools,
  });

  const transport = new StdioServerTransport();
  await serverConfig.instance.connect(transport);

  log.info("MCP server connected via stdio.");

  // Clean shutdown on SIGINT
  process.on("SIGINT", async () => {
    await serverConfig.instance.close();
    process.exit(0);
  });

  return serverConfig;
}
