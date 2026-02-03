import { describe, it, expect } from "vitest";
import {
  tokenize,
  computeTf,
  computeCosineSimilarity,
  rankSkillsByRelevance,
  selectSkillsWithinBudget,
  type SkillForRanking,
} from "../../src/core/skill-ranking.js";

describe("skill-ranking", () => {
  describe("tokenize", () => {
    it("should convert text to lowercase tokens", () => {
      const tokens = tokenize("Hello World TEST");
      expect(tokens).toContain("hello");
      expect(tokens).toContain("world");
      expect(tokens).toContain("test");
    });

    it("should remove short tokens (< 3 chars)", () => {
      const tokens = tokenize("I am a big test");
      expect(tokens).not.toContain("i");
      expect(tokens).not.toContain("am");
      expect(tokens).not.toContain("a");
      expect(tokens).toContain("big");
      expect(tokens).toContain("test");
    });

    it("should filter stopwords", () => {
      const tokens = tokenize("the quick brown fox and the lazy dog");
      expect(tokens).not.toContain("the");
      expect(tokens).not.toContain("and");
      expect(tokens).toContain("quick");
      expect(tokens).toContain("brown");
      expect(tokens).toContain("fox");
    });

    it("should filter Portuguese stopwords", () => {
      const tokens = tokenize("use when para fazer um teste de software");
      expect(tokens).not.toContain("use");
      expect(tokens).not.toContain("when");
      expect(tokens).not.toContain("para");
      expect(tokens).not.toContain("um");
      expect(tokens).toContain("fazer");
      expect(tokens).toContain("teste");
      expect(tokens).toContain("software");
    });

    it("should remove special characters", () => {
      const tokens = tokenize("hello-world test.case user@email");
      expect(tokens).toContain("hello");
      expect(tokens).toContain("world");
      expect(tokens).toContain("test");
      expect(tokens).toContain("case");
    });

    it("should handle empty input", () => {
      expect(tokenize("")).toEqual([]);
      expect(tokenize("   ")).toEqual([]);
    });
  });

  describe("computeTf", () => {
    it("should compute normalized term frequency", () => {
      const tf = computeTf(["test", "test", "code", "review"]);
      expect(tf.get("test")).toBe(0.5); // 2/4
      expect(tf.get("code")).toBe(0.25); // 1/4
      expect(tf.get("review")).toBe(0.25); // 1/4
    });

    it("should handle empty tokens", () => {
      const tf = computeTf([]);
      expect(tf.size).toBe(0);
    });

    it("should handle single token", () => {
      const tf = computeTf(["only"]);
      expect(tf.get("only")).toBe(1);
    });
  });

  describe("computeCosineSimilarity", () => {
    it("should return 1 for identical vectors", () => {
      const a = new Map([
        ["test", 0.5],
        ["code", 0.5],
      ]);
      const b = new Map([
        ["test", 0.5],
        ["code", 0.5],
      ]);
      expect(computeCosineSimilarity(a, b)).toBeCloseTo(1, 5);
    });

    it("should return 0 for orthogonal vectors", () => {
      const a = new Map([
        ["test", 0.5],
        ["code", 0.5],
      ]);
      const b = new Map([
        ["review", 0.5],
        ["debug", 0.5],
      ]);
      expect(computeCosineSimilarity(a, b)).toBe(0);
    });

    it("should return value between 0 and 1 for partial overlap", () => {
      const a = new Map([
        ["test", 0.5],
        ["code", 0.5],
      ]);
      const b = new Map([
        ["test", 0.5],
        ["review", 0.5],
      ]);
      const similarity = computeCosineSimilarity(a, b);
      expect(similarity).toBeGreaterThan(0);
      expect(similarity).toBeLessThan(1);
    });

    it("should handle empty vectors", () => {
      const empty = new Map<string, number>();
      const nonEmpty = new Map([["test", 1]]);
      expect(computeCosineSimilarity(empty, nonEmpty)).toBe(0);
      expect(computeCosineSimilarity(nonEmpty, empty)).toBe(0);
      expect(computeCosineSimilarity(empty, empty)).toBe(0);
    });
  });

  describe("rankSkillsByRelevance", () => {
    const skills: SkillForRanking[] = [
      {
        slug: "test-driven-development",
        name: "Test Driven Development",
        description: "Use when writing tests and implementing TDD workflow",
        content: "TDD content here",
      },
      {
        slug: "security-audit",
        name: "Security Audit",
        description: "Use when auditing code for security vulnerabilities",
        content: "Security audit content",
      },
      {
        slug: "code-review",
        name: "Code Review",
        description: "Use when reviewing code for quality and best practices",
        content: "Code review content",
      },
    ];

    it("should rank skills by relevance to task", () => {
      const ranked = rankSkillsByRelevance("write unit tests for the auth module", skills);

      // TDD should be first (mentions tests)
      expect(ranked[0].slug).toBe("test-driven-development");
    });

    it("should rank security skill higher for security tasks", () => {
      const ranked = rankSkillsByRelevance(
        "audit the code for security vulnerabilities",
        skills,
      );

      expect(ranked[0].slug).toBe("security-audit");
    });

    it("should rank code review skill higher for review tasks", () => {
      const ranked = rankSkillsByRelevance("review the pull request for quality", skills);

      expect(ranked[0].slug).toBe("code-review");
    });

    it("should preserve content in results", () => {
      const ranked = rankSkillsByRelevance("test task", skills);

      expect(ranked[0].content).toBe(skills.find((s) => s.slug === ranked[0].slug)?.content);
    });

    it("should return all skills with scores", () => {
      const ranked = rankSkillsByRelevance("any task", skills);

      expect(ranked).toHaveLength(skills.length);
      ranked.forEach((r) => {
        expect(r).toHaveProperty("score");
        expect(typeof r.score).toBe("number");
      });
    });

    it("should handle empty task", () => {
      const ranked = rankSkillsByRelevance("", skills);

      expect(ranked).toHaveLength(skills.length);
      ranked.forEach((r) => expect(r.score).toBe(0));
    });

    it("should handle empty skills array", () => {
      const ranked = rankSkillsByRelevance("some task", []);

      expect(ranked).toHaveLength(0);
    });

    it("should maintain stable order for equal scores", () => {
      const sameScoreSkills: SkillForRanking[] = [
        { slug: "a", name: "A", description: "desc", content: "content a" },
        { slug: "b", name: "B", description: "desc", content: "content b" },
        { slug: "c", name: "C", description: "desc", content: "content c" },
      ];

      const ranked = rankSkillsByRelevance("unrelated task xyz", sameScoreSkills);

      // When scores are equal, original order should be preserved
      expect(ranked.map((r) => r.slug)).toEqual(["a", "b", "c"]);
    });
  });

  describe("selectSkillsWithinBudget", () => {
    const rankedSkills = [
      { slug: "a", content: "short content", score: 0.9 },
      { slug: "b", content: "medium length content here", score: 0.7 },
      { slug: "c", content: "this is a longer piece of content with more words", score: 0.5 },
    ];

    it("should select skills within token budget", () => {
      // Budget for roughly 2 small skills
      const { selected, skippedCount } = selectSkillsWithinBudget(rankedSkills, 20);

      expect(selected.length).toBeGreaterThan(0);
      expect(selected.length).toBeLessThanOrEqual(rankedSkills.length);
    });

    it("should skip skills exceeding budget", () => {
      // Very small budget
      const { selected, skippedCount } = selectSkillsWithinBudget(rankedSkills, 5);

      expect(skippedCount).toBeGreaterThan(0);
      expect(selected.length + skippedCount).toBe(rankedSkills.length);
    });

    it("should include all skills when budget is large", () => {
      const { selected, skippedCount } = selectSkillsWithinBudget(rankedSkills, 10000);

      expect(selected.length).toBe(rankedSkills.length);
      expect(skippedCount).toBe(0);
    });

    it("should respect ordering (highest scores first)", () => {
      const { selected } = selectSkillsWithinBudget(rankedSkills, 10);

      // First skill should be the highest scored
      if (selected.length > 0) {
        expect(selected[0].slug).toBe("a");
      }
    });

    it("should handle empty input", () => {
      const { selected, skippedCount } = selectSkillsWithinBudget([], 100);

      expect(selected).toEqual([]);
      expect(skippedCount).toBe(0);
    });

    it("should accept custom token estimator", () => {
      const customEstimator = (content: string) => content.length; // chars instead of words

      const { selected } = selectSkillsWithinBudget(rankedSkills, 20, customEstimator);

      // With char-based estimation, only "short content" (13 chars) fits in 20
      expect(selected.length).toBe(1);
      expect(selected[0].slug).toBe("a");
    });
  });
});
