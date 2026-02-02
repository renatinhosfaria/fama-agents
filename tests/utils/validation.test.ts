import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  normalizeOptionalString,
  normalizeOptionalStringArray,
  normalizeOptionalPhases,
  normalizeOptionalModel,
} from "../../src/utils/validation.js";

// Mock logger to capture warnings
vi.mock("../../src/utils/logger.js", () => ({
  log: {
    info: vi.fn(),
    success: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    dim: vi.fn(),
    heading: vi.fn(),
    table: vi.fn(),
  },
}));

import { log } from "../../src/utils/logger.js";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("normalizeOptionalString", () => {
  it("should return undefined for undefined", () => {
    expect(normalizeOptionalString(undefined, "name", "test")).toBeUndefined();
  });

  it("should return the string for valid string", () => {
    expect(normalizeOptionalString("hello", "name", "test")).toBe("hello");
  });

  it("should return undefined and warn for non-string", () => {
    expect(normalizeOptionalString(42, "name", "test")).toBeUndefined();
    expect(log.warn).toHaveBeenCalledOnce();
  });
});

describe("normalizeOptionalStringArray", () => {
  it("should return null for undefined", () => {
    expect(normalizeOptionalStringArray(undefined, "tools", "test")).toBeNull();
  });

  it("should return valid string array", () => {
    expect(normalizeOptionalStringArray(["a", "b"], "tools", "test")).toEqual(["a", "b"]);
  });

  it("should filter non-string items and warn", () => {
    const result = normalizeOptionalStringArray(["a", 42, "b"], "tools", "test");
    expect(result).toEqual(["a", "b"]);
    expect(log.warn).toHaveBeenCalled();
  });

  it("should return empty array and warn for non-array", () => {
    expect(normalizeOptionalStringArray("not-array", "tools", "test")).toEqual([]);
    expect(log.warn).toHaveBeenCalled();
  });

  it("should filter empty strings after trimming", () => {
    const result = normalizeOptionalStringArray(["a", "  ", "b"], "tools", "test");
    expect(result).toEqual(["a", "b"]);
  });
});

describe("normalizeOptionalPhases", () => {
  it("should return null for undefined", () => {
    expect(normalizeOptionalPhases(undefined, "test")).toBeNull();
  });

  it("should return valid phases", () => {
    expect(normalizeOptionalPhases(["P", "R", "E"], "test")).toEqual(["P", "R", "E"]);
  });

  it("should filter invalid phases and warn", () => {
    const result = normalizeOptionalPhases(["P", "X", "E"], "test");
    expect(result).toEqual(["P", "E"]);
    expect(log.warn).toHaveBeenCalled();
  });

  it("should return empty array and warn for non-array", () => {
    expect(normalizeOptionalPhases("not-array", "test")).toEqual([]);
    expect(log.warn).toHaveBeenCalled();
  });
});

describe("normalizeOptionalModel", () => {
  it("should return undefined for undefined", () => {
    expect(normalizeOptionalModel(undefined, "test")).toBeUndefined();
  });

  it.each(["sonnet", "opus", "haiku", "inherit"] as const)("should accept valid model: %s", (model) => {
    expect(normalizeOptionalModel(model, "test")).toBe(model);
  });

  it("should return undefined and warn for invalid model", () => {
    expect(normalizeOptionalModel("gpt-4", "test")).toBeUndefined();
    expect(log.warn).toHaveBeenCalled();
  });
});
