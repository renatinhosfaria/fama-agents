import { describe, it, expect } from "vitest";
import { validateSkillName, validateSkillDescription } from "../../src/utils/validation.js";

describe("validateSkillName", () => {
  it("should accept valid skill names matching dir", () => {
    expect(validateSkillName("brainstorming", "brainstorming")).toEqual([]);
    expect(validateSkillName("test-driven-development", "test-driven-development")).toEqual([]);
    expect(validateSkillName("a", "a")).toEqual([]);
  });

  it("should warn when name does not match directory", () => {
    const warnings = validateSkillName("brainstorming", "brain-storming");
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings[0]).toContain("does not match directory");
  });

  it("should warn when name exceeds 64 characters", () => {
    const longName = "a".repeat(65);
    const warnings = validateSkillName(longName, longName);
    expect(warnings.some((w) => w.includes("exceeds 64"))).toBe(true);
  });

  it("should warn on uppercase characters", () => {
    const warnings = validateSkillName("BrainStorming", "BrainStorming");
    expect(warnings.some((w) => w.includes("lowercase"))).toBe(true);
  });

  it("should warn on leading or trailing hyphens", () => {
    const warnings = validateSkillName("-brainstorming", "-brainstorming");
    expect(warnings.some((w) => w.includes("lowercase") || w.includes("hyphens"))).toBe(true);
  });

  it("should warn on consecutive hyphens", () => {
    const warnings = validateSkillName("brain--storming", "brain--storming");
    expect(warnings.some((w) => w.includes("consecutive"))).toBe(true);
  });
});

describe("validateSkillDescription", () => {
  it("should accept descriptions starting with 'Use when'", () => {
    expect(
      validateSkillDescription("Use when implementing any feature or bugfix."),
    ).toEqual([]);
  });

  it("should accept case-insensitive 'use when'", () => {
    expect(
      validateSkillDescription("use when something happens"),
    ).toEqual([]);
  });

  it("should warn when description does not start with 'Use when'", () => {
    const warnings = validateSkillDescription("This skill does something.");
    expect(warnings.some((w) => w.includes("Use when"))).toBe(true);
  });

  it("should warn when description exceeds 1024 characters", () => {
    const longDesc = "Use when " + "a".repeat(1020);
    const warnings = validateSkillDescription(longDesc);
    expect(warnings.some((w) => w.includes("1024"))).toBe(true);
  });

  it("should accept descriptions at exactly 1024 characters", () => {
    const desc = "Use when " + "a".repeat(1015);
    expect(desc.length).toBe(1024);
    expect(validateSkillDescription(desc)).toEqual([]);
  });
});
