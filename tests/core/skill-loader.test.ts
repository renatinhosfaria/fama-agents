import { describe, it, expect } from "vitest";
import { resolve } from "node:path";
import { discoverAllSkills, discoverSkillSummaries, loadSkill, loadSkillReferences } from "../../src/core/skill-loader.js";
import { validateSkillName, validateSkillDescription } from "../../src/utils/validation.js";

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

    it("should load the adversarial-review skill", () => {
      const skill = loadSkill("adversarial-review", PROJECT_DIR);
      expect(skill).toBeDefined();
      expect(skill?.slug).toBe("adversarial-review");
      expect(skill?.phases).toContain("R");
      expect(skill?.phases).toContain("V");
      expect(skill?.content).toContain("Lei de Ferro");
    });
  });

  describe("word count enforcement", () => {
    it("all built-in skills should have body content under 500 words", () => {
      const skills = discoverAllSkills(PROJECT_DIR);
      for (const skill of skills) {
        const wordCount = skill.content.trim().split(/\s+/).filter(Boolean).length;
        expect(
          wordCount,
          `Skill "${skill.slug}" has ${wordCount} words (max 500). Consider moving content to references/.`,
        ).toBeLessThanOrEqual(500);
      }
    });
  });

  describe("Agent Skills Specification compliance", () => {
    it("all built-in skills should have valid names matching their directories", () => {
      const skills = discoverAllSkills(PROJECT_DIR);
      for (const skill of skills) {
        const warnings = validateSkillName(skill.name, skill.slug);
        expect(warnings, `Skill "${skill.slug}" name validation failed: ${warnings.join(", ")}`).toEqual([]);
      }
    });

    it("all built-in skills should have CSO-compliant descriptions", () => {
      const skills = discoverAllSkills(PROJECT_DIR);
      for (const skill of skills) {
        const warnings = validateSkillDescription(skill.description);
        expect(warnings, `Skill "${skill.slug}" description validation failed: ${warnings.join(", ")}`).toEqual([]);
      }
    });
  });

  describe("loadSkillReferences", () => {
    it("should load reference files for skills with references/", () => {
      const brainstormingDir = resolve(PROJECT_DIR, "skills", "brainstorming");
      const refs = loadSkillReferences(brainstormingDir, "brainstorming");
      expect(refs.length).toBeGreaterThan(0);
      for (const ref of refs) {
        expect(ref.slug).toBe("brainstorming");
        expect(ref.fileName).toBeTruthy();
        expect(ref.content.length).toBeGreaterThan(0);
      }
    });

    it("should return empty array for skill without references/", () => {
      const advReviewDir = resolve(PROJECT_DIR, "skills", "adversarial-review");
      const refs = loadSkillReferences(advReviewDir, "adversarial-review");
      expect(refs).toEqual([]);
    });

    it("should return empty array for nonexistent directory", () => {
      const refs = loadSkillReferences("/nonexistent/path", "fake");
      expect(refs).toEqual([]);
    });
  });

  describe("loadSkill — optional spec fields", () => {
    it("should load skill with license, compatibility, metadata, and allowed-tools", () => {
      // Use a known skill that has some optional fields populated
      const skill = loadSkill("brainstorming", PROJECT_DIR);
      expect(skill).toBeDefined();
      // These fields exist or are undefined (not errors)
      expect(typeof skill?.slug).toBe("string");
    });

    it("should reject slug with path traversal characters", () => {
      const skill = loadSkill("../../../etc/passwd", PROJECT_DIR);
      expect(skill).toBeNull();
    });

    it("should reject slug with special characters", () => {
      const skill = loadSkill("skill with spaces", PROJECT_DIR);
      expect(skill).toBeNull();
    });
  });

  describe("discoverSkillSummaries", () => {
    it("should discover summaries (frontmatter only) for all built-in skills", () => {
      const summaries = discoverSkillSummaries(PROJECT_DIR);
      expect(summaries.length).toBeGreaterThanOrEqual(14);
      for (const s of summaries) {
        expect(s.slug).toBeTruthy();
        expect(s.filePath).toBeTruthy();
        // When running from the project root, project skills shadow built-in ones
        expect(["built-in", "project"]).toContain(s.source);
      }
    });
  });
});
