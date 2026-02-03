import { describe, it, expect } from "vitest";
import { DETECTION_RULES } from "../../../src/services/stack/detection-rules.js";

describe("DETECTION_RULES", () => {
  const validCategories = new Set([
    "language",
    "framework",
    "build",
    "test",
    "package",
    "database",
    "ci",
    "monorepo",
  ]);

  it("should have at least 30 rules", () => {
    expect(DETECTION_RULES.length).toBeGreaterThanOrEqual(30);
  });

  it("should have valid category for every rule", () => {
    for (const rule of DETECTION_RULES) {
      expect(validCategories.has(rule.category)).toBe(true);
    }
  });

  it("should have a non-empty name for every rule", () => {
    for (const rule of DETECTION_RULES) {
      expect(rule.name).toBeTruthy();
      expect(typeof rule.name).toBe("string");
    }
  });

  it("should have markers as an array for every rule", () => {
    for (const rule of DETECTION_RULES) {
      expect(Array.isArray(rule.markers)).toBe(true);
    }
  });

  it("should have at least markers or packageDeps for each rule", () => {
    for (const rule of DETECTION_RULES) {
      const hasMarkers = rule.markers.length > 0;
      const hasDeps = rule.packageDeps !== undefined && rule.packageDeps.length > 0;
      expect(hasMarkers || hasDeps).toBe(true);
    }
  });

  it("should include key languages", () => {
    const names = DETECTION_RULES.filter((r) => r.category === "language").map((r) => r.name);
    expect(names).toContain("typescript");
    expect(names).toContain("javascript");
    expect(names).toContain("python");
    expect(names).toContain("go");
    expect(names).toContain("rust");
    expect(names).toContain("java");
  });

  it("should include key frameworks", () => {
    const names = DETECTION_RULES.filter((r) => r.category === "framework").map((r) => r.name);
    expect(names).toContain("react");
    expect(names).toContain("next.js");
    expect(names).toContain("nestjs");
    expect(names).toContain("express");
  });

  it("should include key test frameworks", () => {
    const names = DETECTION_RULES.filter((r) => r.category === "test").map((r) => r.name);
    expect(names).toContain("vitest");
    expect(names).toContain("jest");
    expect(names).toContain("playwright");
  });

  it("should include key package managers", () => {
    const names = DETECTION_RULES.filter((r) => r.category === "package").map((r) => r.name);
    expect(names).toContain("pnpm");
    expect(names).toContain("npm");
    expect(names).toContain("yarn");
  });

  it("should include monorepo tools", () => {
    const names = DETECTION_RULES.filter((r) => r.category === "monorepo").map((r) => r.name);
    expect(names).toContain("turborepo");
    expect(names).toContain("nx");
  });
});
