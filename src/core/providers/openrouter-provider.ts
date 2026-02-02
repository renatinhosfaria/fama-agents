import type { LLMProvider, LLMQueryOptions, LLMStreamEvent } from "../types.js";
import { ProviderError } from "../errors.js";
import { log } from "../../utils/logger.js";

/**
 * OpenRouter provider — multi-model gateway.
 * Follows OpenAI-compatible API at openrouter.ai.
 * Does NOT support subagents or MCP.
 */
export class OpenRouterProvider implements LLMProvider {
  readonly name = "openrouter";
  readonly supportsSubagents = false;
  readonly supportsMcp = false;

  constructor(private readonly apiKey?: string) {}

  async *query(prompt: string, options: LLMQueryOptions): AsyncIterable<LLMStreamEvent> {
    const key = this.apiKey ?? process.env["OPENROUTER_API_KEY"];
    if (!key) {
      throw new ProviderError("openrouter", "OPENROUTER_API_KEY environment variable is required.");
    }

    if (options.agents && Object.keys(options.agents).length > 0) {
      log.warn("OpenRouter provider does not support subagents. Subagents will be ignored.");
    }

    const model = options.model ?? "anthropic/claude-sonnet-4-20250514";
    const messages = [
      { role: "system" as const, content: options.systemPrompt },
      { role: "user" as const, content: prompt },
    ];

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
          "HTTP-Referer": "https://github.com/fama-agents",
          "X-Title": "fama-agents",
        },
        body: JSON.stringify({
          model,
          messages,
          max_tokens: 16384,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new ProviderError("openrouter", `API error ${response.status}: ${errorBody}`);
      }

      const data = (await response.json()) as {
        choices: Array<{ message: { content: string } }>;
        usage?: { total_tokens: number; prompt_tokens: number; completion_tokens: number };
      };

      const content = data.choices?.[0]?.message?.content ?? "";
      const usage = data.usage;

      // OpenRouter pricing varies by model — use Claude Sonnet defaults as estimate
      // $3/1M input, $15/1M output (Anthropic Sonnet pricing)
      const promptCost = (usage?.prompt_tokens ?? 0) * (3 / 1_000_000);
      const completionCost = (usage?.completion_tokens ?? 0) * (15 / 1_000_000);
      const totalCost = promptCost + completionCost;

      yield {
        type: "assistant",
        text: content,
      } as LLMStreamEvent;

      yield {
        type: "result",
        subtype: "success",
        result: content,
        costUSD: totalCost,
        numTurns: 1,
      } as LLMStreamEvent;
    } catch (err) {
      if (err instanceof ProviderError) throw err;
      throw new ProviderError(
        "openrouter",
        `Request failed: ${err instanceof Error ? err.message : String(err)}`,
        err instanceof Error ? err : undefined,
      );
    }
  }
}
