import { describe, it, expect } from "vitest";
import { ProviderError, ProviderNotFoundError, FamaError } from "../../../src/core/errors.js";

describe("ProviderError", () => {
  it("should have correct name and code", () => {
    const err = new ProviderError("openai", "connection failed");
    expect(err.name).toBe("ProviderError");
    expect(err.code).toBe("PROVIDER_ERROR");
    expect(err.message).toContain("openai");
    expect(err.message).toContain("connection failed");
    expect(err).toBeInstanceOf(FamaError);
    expect(err).toBeInstanceOf(Error);
  });

  it("should preserve cause chain", () => {
    const cause = new Error("network timeout");
    const err = new ProviderError("claude", "query failed", cause);
    expect(err.cause).toBe(cause);
  });

  it("should include provider name in message", () => {
    const err = new ProviderError("openrouter", "rate limited");
    expect(err.message).toContain("openrouter");
  });
});

describe("ProviderNotFoundError", () => {
  it("should have correct name and code", () => {
    const err = new ProviderNotFoundError("gemini");
    expect(err.name).toBe("ProviderNotFoundError");
    expect(err.code).toBe("PROVIDER_NOT_FOUND");
    expect(err.message).toContain("gemini");
    expect(err).toBeInstanceOf(FamaError);
  });

  it("should list available providers", () => {
    const err = new ProviderNotFoundError("bad");
    expect(err.message).toContain("claude");
    expect(err.message).toContain("openai");
    expect(err.message).toContain("openrouter");
  });
});
