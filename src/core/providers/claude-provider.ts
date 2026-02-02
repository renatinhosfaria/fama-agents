import { query } from "@anthropic-ai/claude-agent-sdk";
import type { LLMProvider, LLMQueryOptions, LLMStreamEvent } from "../types.js";
import { ProviderError } from "../errors.js";

/**
 * Claude provider using the official Claude Agent SDK.
 * Supports subagents and MCP — the full-featured default provider.
 */
export class ClaudeProvider implements LLMProvider {
  readonly name = "claude";
  readonly supportsSubagents = true;
  readonly supportsMcp = true;

  constructor(private readonly apiKey?: string) {}

  async *query(prompt: string, options: LLMQueryOptions): AsyncIterable<LLMStreamEvent> {
    const key = this.apiKey ?? process.env["ANTHROPIC_API_KEY"];
    if (!key) {
      throw new ProviderError(
        "claude",
        "ANTHROPIC_API_KEY environment variable is required.\n" +
          "Set it in your .env file or run: export ANTHROPIC_API_KEY=your_key",
      );
    }

    const queryIterator = query({
      prompt,
      options: {
        systemPrompt: options.systemPrompt,
        allowedTools: options.tools,
        agents: options.agents as
          | Record<string, import("@anthropic-ai/claude-agent-sdk").AgentDefinition>
          | undefined,
        model: options.model as "sonnet" | "opus" | "haiku" | undefined,
        maxTurns: options.maxTurns,
        cwd: options.cwd ?? process.cwd(),
        permissionMode: (options.permissionMode ?? "default") as
          | "default"
          | "acceptEdits"
          | "bypassPermissions",
        settingSources: (options.settingSources ?? ["project"]) as ["project"],
      },
    });

    for await (const message of queryIterator) {
      if (message.type === "assistant") {
        const content = message.message.content;
        if (Array.isArray(content)) {
          for (const block of content) {
            if ("text" in block && block.text) {
              yield {
                type: "assistant",
                text: block.text,
                message: message.message,
              } as LLMStreamEvent;
            }
          }
        }
      }

      if (message.type === "result") {
        if (message.subtype === "success") {
          yield {
            type: "result",
            subtype: "success",
            result: message.result,
            costUSD: message.total_cost_usd,
            numTurns: message.num_turns,
          } as LLMStreamEvent;
        } else {
          const rawErrors =
            "errors" in message && Array.isArray(message.errors) ? message.errors : [];
          yield {
            type: "result",
            subtype: "error",
            errors: rawErrors,
          } as LLMStreamEvent;
        }
      }
    }
  }
}
