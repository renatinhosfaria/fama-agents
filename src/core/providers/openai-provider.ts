import type { LLMProvider, LLMQueryOptions, LLMStreamEvent } from "../types.js";
import { ProviderError } from "../errors.js";
import { log } from "../../utils/logger.js";

/**
 * OpenAI provider for GPT models.
 * Does NOT support subagents or MCP — simple query/response only.
 */
export class OpenAIProvider implements LLMProvider {
  readonly name = "openai";
  readonly supportsSubagents = false;
  readonly supportsMcp = false;

  constructor(private readonly apiKey?: string) {}

  async *query(prompt: string, options: LLMQueryOptions): AsyncIterable<LLMStreamEvent> {
    const key = this.apiKey ?? process.env["OPENAI_API_KEY"];
    if (!key) {
      throw new ProviderError("openai", "OPENAI_API_KEY environment variable is required.");
    }

    if (options.agents && Object.keys(options.agents).length > 0) {
      log.warn("OpenAI provider does not support subagents. Subagents will be ignored.");
    }

    const model = options.model ?? "gpt-4o";
    const messages = [
      { role: "system" as const, content: options.systemPrompt },
      { role: "user" as const, content: prompt },
    ];

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model,
          messages,
          max_tokens: 16384,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new ProviderError("openai", `API error ${response.status}: ${errorBody}`);
      }

      const data = (await response.json()) as {
        choices: Array<{ message: { content: string } }>;
        usage?: { total_tokens: number; prompt_tokens: number; completion_tokens: number };
      };

      const content = data.choices?.[0]?.message?.content ?? "";
      const usage = data.usage;

      // Estimate cost — GPT-4o pricing (per-token, approximate)
      // $2.50/1M input, $10.00/1M output
      const promptCost = (usage?.prompt_tokens ?? 0) * (2.5 / 1_000_000);
      const completionCost = (usage?.completion_tokens ?? 0) * (10 / 1_000_000);
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
        "openai",
        `Request failed: ${err instanceof Error ? err.message : String(err)}`,
        err instanceof Error ? err : undefined,
      );
    }
  }
}
