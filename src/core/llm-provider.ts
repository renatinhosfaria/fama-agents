import type { LLMProvider, ProviderConfig } from "./types.js";
import { ProviderNotFoundError } from "./errors.js";
import { log } from "../utils/logger.js";

/**
 * Parses a model string into provider and model parts.
 * Supports: "sonnet" → {provider: undefined, model: "sonnet"}
 *           "openai/gpt-4o" → {provider: "openai", model: "gpt-4o"}
 */
export function parseModelString(model: string): { provider?: string; model: string } {
  if (model.includes("/")) {
    const [provider, ...rest] = model.split("/");
    return { provider, model: rest.join("/") };
  }
  return { model };
}

/**
 * Creates an LLM provider instance by name.
 */
export async function createProvider(name: string, config?: ProviderConfig): Promise<LLMProvider> {
  const apiKey = config?.apiKeys?.[name];

  const envKeyMap: Record<string, string> = {
    claude: "ANTHROPIC_API_KEY",
    anthropic: "ANTHROPIC_API_KEY",
    openai: "OPENAI_API_KEY",
    openrouter: "OPENROUTER_API_KEY",
  };

  // Warn early if no API key found (not a hard error — env may be set later)
  const envVar = envKeyMap[name];
  if (!apiKey && envVar && !process.env[envVar]) {
    log.warn(`No API key found for provider "${name}". Set ${envVar} or configure it in .fama.yaml providers.apiKeys.`);
  }

  switch (name) {
    case "claude":
    case "anthropic": {
      const { ClaudeProvider } = await import("./providers/claude-provider.js");
      return new ClaudeProvider(apiKey);
    }
    case "openai": {
      const { OpenAIProvider } = await import("./providers/openai-provider.js");
      return new OpenAIProvider(apiKey);
    }
    case "openrouter": {
      const { OpenRouterProvider } = await import("./providers/openrouter-provider.js");
      return new OpenRouterProvider(apiKey);
    }
    default:
      throw new ProviderNotFoundError(name);
  }
}

/**
 * Resolves the appropriate provider for a model string.
 * Falls back to the default provider from config.
 */
export async function resolveProvider(
  model?: string,
  config?: ProviderConfig,
): Promise<{ provider: LLMProvider; resolvedModel?: string }> {
  const defaultName = config?.default ?? "claude";

  if (model) {
    const parsed = parseModelString(model);
    if (parsed.provider) {
      const provider = await createProvider(parsed.provider, config);
      return { provider, resolvedModel: parsed.model };
    }
    // No provider prefix — use default provider with the model name
    const provider = await createProvider(defaultName, config);
    return { provider, resolvedModel: model };
  }

  // No model specified — use default provider
  const provider = await createProvider(defaultName, config);
  return { provider };
}

/**
 * Resolves a provider with fallback chain support.
 */
export async function resolveProviderWithFallback(
  model?: string,
  config?: ProviderConfig,
): Promise<{ provider: LLMProvider; resolvedModel?: string }> {
  try {
    return await resolveProvider(model, config);
  } catch (err) {
    if (config?.fallback && config.fallback.length > 0) {
      for (const fallbackName of config.fallback) {
        try {
          log.warn(`Primary provider failed, trying fallback: ${fallbackName}`);
          const provider = await createProvider(fallbackName, config);
          const parsed = model ? parseModelString(model) : { model: undefined };
          return { provider, resolvedModel: parsed.model };
        } catch {
          // Try next fallback
          continue;
        }
      }
    }
    throw err;
  }
}
