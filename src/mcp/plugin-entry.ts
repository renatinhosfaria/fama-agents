#!/usr/bin/env node
/**
 * Claude Code Plugin MCP entry point.
 *
 * This is the standalone entry that Claude Code launches via plugin.json.
 * It sets FAMA_ROOT so that agent/skill registries resolve paths
 * relative to the plugin installation directory, then starts the MCP server.
 */
import "dotenv/config";
import { startMcpServer } from "./server.js";

// CLAUDE_PLUGIN_ROOT is set by Claude Code when launching plugin MCP servers.
// It points to the plugin's installation directory in the cache.
if (process.env.CLAUDE_PLUGIN_ROOT) {
  process.env.FAMA_ROOT = process.env.CLAUDE_PLUGIN_ROOT;
}

startMcpServer().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  process.stderr.write(`fama-agents MCP server error: ${message}\n`);
  process.exit(1);
});
