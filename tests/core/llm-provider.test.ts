import { describe, it, expect, vi, beforeEach } from "vitest";
import { parseModelString, createProvider, resolveProvider, resolveProviderWithFallback, getModelForScale } from "../../src/core/llm-provider.js";
import { ProviderNotFoundError } from "../../src/core/errors.js";
import { ProjectScale } from "../../src/core/types.js";

vi.mock("../../src/utils/logger.js", () => ({
  log: { info: vi.fn(), success: vi.fn(), warn: vi.fn(), error: vi.fn(), dim: vi.fn() },
}));

describe("parseModelString", () => {
  it("should return model only for simple string", () => {
    const result = parseModelString("sonnet");
    expect(result).toEqual({ model: "sonnet" });
  });

  it("should extract provider and model from slash-separated string", () => {
    const result = parseModelString("openai/gpt-4o");
    expect(result).toEqual({ provider: "openai", model: "gpt-4o" });
  });

  it("should handle model strings with multiple slashes", () => {
    const result = parseModelString("openai/org/gpt-4o");
    expect(result).toEqual({ provider: "openai", model: "org/gpt-4o" });
  });

  it("should handle empty provider prefix", () => {
    const result = parseModelString("/gpt-4o");
    expect(result).toEqual({ provider: "", model: "gpt-4o" });
  });
});

describe("createProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create a ClaudeProvider for 'claude'", async () => {
    const provider = await createProvider("claude");
    expect(provider.name).toBe("claude");
  });

  it("should create a ClaudeProvider for 'anthropic' alias", async () => {
    const provider = await createProvider("anthropic");
    expect(provider.name).toBe("claude");
  });

  it("should create an OpenAIProvider for 'openai'", async () => {
    const provider = await createProvider("openai");
    expect(provider.name).toBe("openai");
  });

  it("should create an OpenRouterProvider for 'openrouter'", async () => {
    const provider = await createProvider("openrouter");
    expect(provider.name).toBe("openrouter");
  });

  it("should throw ProviderNotFoundError for unknown provider", async () => {
    await expect(createProvider("unknown-provider")).rejects.toThrow(ProviderNotFoundError);
  });

  it("should use API key from config if provided", async () => {
    const provider = await createProvider("claude", {
      default: "claude",
      apiKeys: { claude: "test-key-123" },
    });
    expect(provider.name).toBe("claude");
  });
});

describe("resolveProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should use default provider when no model specified", async () => {
    const { provider, resolvedModel } = await resolveProvider();
    expect(provider.name).toBe("claude");
    expect(resolvedModel).toBeUndefined();
  });

  it("should extract provider from model string with slash", async () => {
    const { provider, resolvedModel } = await resolveProvider("openai/gpt-4o");
    expect(provider.name).toBe("openai");
    expect(resolvedModel).toBe("gpt-4o");
  });

  it("should use default provider for model without slash", async () => {
    const { provider, resolvedModel } = await resolveProvider("sonnet");
    expect(provider.name).toBe("claude");
    expect(resolvedModel).toBe("sonnet");
  });

  it("should respect config default provider", async () => {
    const { provider } = await resolveProvider(undefined, { default: "openai" });
    expect(provider.name).toBe("openai");
  });
});

describe("resolveProviderWithFallback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return primary provider when it works", async () => {
    const { provider } = await resolveProviderWithFallback("sonnet");
    expect(provider.name).toBe("claude");
  });

  it("should try fallback when primary fails", async () => {
    const { provider } = await resolveProviderWithFallback("bad-provider/model", {
      default: "bad-provider",
      fallback: ["claude"],
    });
    // Should fallback to claude
    expect(provider.name).toBe("claude");
  });

  it("should rethrow if no fallback configured", async () => {
    await expect(
      resolveProviderWithFallback("unknown-xyz/model", { default: "unknown-xyz" }),
    ).rejects.toThrow();
  });

  it("should rethrow if all fallbacks also fail", async () => {
    await expect(
      resolveProviderWithFallback("unknown-xyz/model", {
        default: "unknown-xyz",
        fallback: ["also-unknown", "still-unknown"],
      }),
    ).rejects.toThrow();
  });
});

describe("getModelForScale", () => {
  it("should return haiku for QUICK scale", () => {
    expect(getModelForScale(ProjectScale.QUICK)).toBe("haiku");
  });

  it("should return sonnet for SMALL scale", () => {
    expect(getModelForScale(ProjectScale.SMALL)).toBe("sonnet");
  });

  it("should return sonnet for MEDIUM scale", () => {
    expect(getModelForScale(ProjectScale.MEDIUM)).toBe("sonnet");
  });

  it("should return opus for LARGE scale", () => {
    expect(getModelForScale(ProjectScale.LARGE)).toBe("opus");
  });

  it("should use custom routing config", () => {
    const customRouting = {
      quick: "custom-quick",
      small: "custom-small",
      medium: "custom-medium",
      large: "custom-large",
    };

    expect(getModelForScale(ProjectScale.QUICK, customRouting)).toBe("custom-quick");
    expect(getModelForScale(ProjectScale.SMALL, customRouting)).toBe("custom-small");
    expect(getModelForScale(ProjectScale.MEDIUM, customRouting)).toBe("custom-medium");
    expect(getModelForScale(ProjectScale.LARGE, customRouting)).toBe("custom-large");
  });

  it("should default to medium for unknown scale", () => {
    // @ts-expect-error Testing invalid input
    expect(getModelForScale(999)).toBe("sonnet");
  });
});
