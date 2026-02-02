import type { ExportContext, ExportPreset, ExportResult } from "../types.js";

/**
 * Generates MCP server configuration snippet for Claude Desktop.
 */
export const claudeDesktopPreset: ExportPreset = {
  name: "claude-desktop",
  description: "Export MCP config for Claude Desktop",

  generate(context: ExportContext): ExportResult {
    // Use npx for cross-platform compatibility (Windows + Unix)
    const mcpConfig = {
      mcpServers: {
        "fama-agents": {
          command: "npx",
          args: ["fama-agents", "mcp"],
          cwd: context.projectDir,
          env: {
            ANTHROPIC_API_KEY: "${ANTHROPIC_API_KEY}",
          },
        },
      },
    };

    const instructions = [
      "# Claude Desktop MCP Configuration",
      "",
      "Add this to your `claude_desktop_config.json`:",
      "",
      "```json",
      JSON.stringify(mcpConfig, null, 2),
      "```",
      "",
      `Available agents: ${context.agents.map((a) => a.slug).join(", ")}`,
      `Available skills: ${context.skills.map((s) => s.slug).join(", ")}`,
    ].join("\n");

    return {
      files: [
        {
          path: ".fama/claude-desktop-config.json",
          content: JSON.stringify(mcpConfig, null, 2) + "\n",
        },
        {
          path: ".fama/claude-desktop-instructions.md",
          content: instructions + "\n",
        },
      ],
      summary: "Generated Claude Desktop MCP config in .fama/",
    };
  },
};
