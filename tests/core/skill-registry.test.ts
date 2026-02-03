import { describe, it, expect } from "vitest";
import { resolve } from "node:path";
import { SkillRegistry } from "../../src/core/skill-registry.js";

const PROJECT_DIR = resolve(import.meta.dirname, "..", "..");

describe("SkillRegistry", () => {
  let registry: SkillRegistry;

  // Use a shared instance to avoid repeated filesystem scans
  registry = new SkillRegistry(PROJECT_DIR);

  describe("constructor and refresh", () => {
    it("should populate summaries on construction", () => {
      const reg = new SkillRegistry(PROJECT_DIR);
      expect(reg.getAll().length).toBeGreaterThan(0);
    });

    it("should clear caches on refresh", () => {
      const reg = new SkillRegistry(PROJECT_DIR);
      const before = reg.getAll().length;
      reg.refresh();
      expect(reg.getAll().length).toBe(before);
    });
  });

  describe("getAll", () => {
    it("should return all built-in skill summaries", () => {
      const all = registry.getAll();
      expect(all.length).toBeGreaterThanOrEqual(14);
      for (const s of all) {
        expect(s.slug).toBeTruthy();
        expect(s.name).toBeTruthy();
        expect(s.description).toBeTruthy();
        expect(s.phases.length).toBeGreaterThan(0);
      }
    });

    it("should include known skills", () => {
      const slugs = registry.getAll().map((s) => s.slug);
      expect(slugs).toContain("verification");
      expect(slugs).toContain("brainstorming");
      expect(slugs).toContain("code-review");
    });
  });

  describe("getBySlug", () => {
    it("should lazy load a full skill (Level 2)", () => {
      const skill = registry.getBySlug("verification");
      expect(skill).not.toBeNull();
      expect(skill!.slug).toBe("verification");
      expect(skill!.content).toBeTruthy();
      expect(skill!.content.length).toBeGreaterThan(0);
    });

    it("should cache the loaded skill on subsequent calls", () => {
      const first = registry.getBySlug("verification");
      const second = registry.getBySlug("verification");
      expect(first).toBe(second); // Same reference (cached)
    });

    it("should return null for unknown slug", () => {
      const result = registry.getBySlug("non-existent-skill-xyz");
      expect(result).toBeNull();
    });
  });

  describe("getForPhase", () => {
    it("should return skills for planning phase", () => {
      const planning = registry.getForPhase("P");
      expect(planning.length).toBeGreaterThan(0);
      for (const s of planning) {
        expect(s.phases).toContain("P");
      }
    });

    it("should return skills for execution phase", () => {
      const execution = registry.getForPhase("E");
      expect(execution.length).toBeGreaterThan(0);
      for (const s of execution) {
        expect(s.phases).toContain("E");
      }
    });

    it("should return skills for verification phase", () => {
      const verification = registry.getForPhase("V");
      expect(verification.length).toBeGreaterThan(0);
      for (const s of verification) {
        expect(s.phases).toContain("V");
      }
    });

    it("should not include skills from other phases", () => {
      const planning = registry.getForPhase("P");
      const execution = registry.getForPhase("E");

      // brainstorming is P-phase only, should not be in E
      const brainstormingInP = planning.find((s) => s.slug === "brainstorming");
      const brainstormingInE = execution.find((s) => s.slug === "brainstorming");
      expect(brainstormingInP).toBeDefined();
      expect(brainstormingInE).toBeUndefined();
    });
  });

  describe("getContent", () => {
    it("should return markdown content for valid slug", () => {
      const content = registry.getContent("verification");
      expect(content).not.toBeNull();
      expect(content!).toContain("#");
    });

    it("should return null for unknown slug", () => {
      const content = registry.getContent("does-not-exist");
      expect(content).toBeNull();
    });
  });

  describe("getContents", () => {
    it("should return array of contents for valid slugs", () => {
      const contents = registry.getContents(["verification", "brainstorming"]);
      expect(contents.length).toBe(2);
      for (const c of contents) {
        expect(c).toContain("#");
      }
    });

    it("should filter out null values for invalid slugs", () => {
      const contents = registry.getContents(["verification", "invalid-xyz", "brainstorming"]);
      expect(contents.length).toBe(2);
    });

    it("should return empty array for all invalid slugs", () => {
      const contents = registry.getContents(["invalid-a", "invalid-b"]);
      expect(contents.length).toBe(0);
    });
  });

  describe("getReferences", () => {
    it("should return reference files for skills with references", () => {
      const refs = registry.getReferences("brainstorming");
      expect(refs.length).toBeGreaterThan(0);
      for (const ref of refs) {
        expect(ref.slug).toBe("brainstorming");
        expect(ref.fileName).toBeTruthy();
        expect(ref.content).toBeTruthy();
      }
    });

    it("should return empty array for unknown slug", () => {
      const refs = registry.getReferences("does-not-exist-xyz");
      expect(refs).toEqual([]);
    });

    it("should return empty array for skill without references", () => {
      // adversarial-review has no references/ directory
      const refs = registry.getReferences("adversarial-review");
      expect(refs).toEqual([]);
    });
  });
});
