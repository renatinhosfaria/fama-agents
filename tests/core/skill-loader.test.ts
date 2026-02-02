import { describe, it, expect } from "vitest";
import { resolve } from "node:path";
import { discoverAllSkills, loadSkill } from "../../src/core/skill-loader.js";

const PROJECT_DIR = resolve(import.meta.dirname, "..", "..");

describe("skill-loader", () => {
  describe("discoverAllSkills", () => {
    it("should discover built-in skills", () => {
      const skills = discoverAllSkills(PROJECT_DIR);
      expect(skills.length).toBeGreaterThan(0);
    });

    it("should include verification skill", () => {
      const skills = discoverAllSkills(PROJECT_DIR);
      const verification = skills.find((s) => s.slug === "verification");
      expect(verification).toBeDefined();
      expect(verification?.name).toBe("verification");
      expect(verification?.phases).toContain("E");
    });

    it("should include test-driven-development skill", () => {
      const skills = discoverAllSkills(PROJECT_DIR);
      const tdd = skills.find((s) => s.slug === "test-driven-development");
      expect(tdd).toBeDefined();
      expect(tdd?.phases).toContain("E");
      expect(tdd?.phases).toContain("V");
    });

    it("should have non-empty content for all skills", () => {
      const skills = discoverAllSkills(PROJECT_DIR);
      for (const skill of skills) {
        expect(skill.content.length).toBeGreaterThan(0);
      }
    });
  });

  describe("loadSkill", () => {
    it("should load a specific skill by slug", () => {
      const skill = loadSkill("verification", PROJECT_DIR);
      expect(skill).toBeDefined();
      expect(skill?.slug).toBe("verification");
      expect(skill?.content).toContain("Verification");
    });

    it("should return null for non-existent skill", () => {
      const skill = loadSkill("non-existent-skill", PROJECT_DIR);
      expect(skill).toBeNull();
    });
  });
});
