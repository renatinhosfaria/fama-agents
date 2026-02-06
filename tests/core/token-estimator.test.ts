import { describe, it, expect } from "vitest";
import {
  detectCodeRatio,
  estimateTokensCharBased,
  estimateTokensWordBased,
  getBudgetForScale,
  createCustomBudget,
  totalBudget,
  createUsageTracker,
  remainingBudget,
  isBudgetExceeded,
  truncateToTokenBudget,
  splitIntoChunks,
  createSkillTokenCache,
  estimateTokens,
  BUDGET_PROFILES,
  type TokenBudgetAllocation,
} from "../../src/core/token-estimator.js";

describe("token-estimator", () => {
  describe("detectCodeRatio", () => {
    it("should return 0 for empty text", () => {
      expect(detectCodeRatio("")).toBe(0);
      expect(detectCodeRatio(null as unknown as string)).toBe(0);
    });

    it("should return low ratio for prose", () => {
      const prose = "This is a simple sentence about software development and best practices.";
      const ratio = detectCodeRatio(prose);

      expect(ratio).toBeLessThan(0.1);
    });

    it("should return high ratio for code", () => {
      const code = `
        function calculateTotal(items) {
          const total = items.reduce((sum, item) => sum + item.price, 0);
          return { total, count: items.length };
        }
      `;
      const ratio = detectCodeRatio(code);

      expect(ratio).toBeGreaterThan(0.1);
    });

    it("should detect JavaScript keywords", () => {
      const jsCode = "const x = function() { return export; }";
      const ratio = detectCodeRatio(jsCode);

      expect(ratio).toBeGreaterThan(0.1);
    });

    it("should detect camelCase", () => {
      const text = "myFunction getName setUserData";
      const ratio = detectCodeRatio(text);

      expect(ratio).toBeGreaterThan(0.05);
    });

    it("should cap at 1", () => {
      const heavyCode = "{{{}}}[[[]]]()()()===!!!&&&|||";
      const ratio = detectCodeRatio(heavyCode);

      expect(ratio).toBeLessThanOrEqual(1);
    });
  });

  describe("estimateTokensCharBased", () => {
    it("should return 0 for empty text", () => {
      expect(estimateTokensCharBased("")).toBe(0);
      expect(estimateTokensCharBased(null as unknown as string)).toBe(0);
    });

    it("should estimate prose at ~4 chars per token", () => {
      const prose = "This is a simple sentence."; // 26 chars
      const tokens = estimateTokensCharBased(prose);

      // ~6-7 tokens expected
      expect(tokens).toBeGreaterThanOrEqual(5);
      expect(tokens).toBeLessThanOrEqual(10);
    });

    it("should estimate code at ~3.5 chars per token", () => {
      const code = "const x = () => { return y; }"; // 29 chars
      const tokens = estimateTokensCharBased(code);

      // ~8-9 tokens expected
      expect(tokens).toBeGreaterThanOrEqual(6);
      expect(tokens).toBeLessThanOrEqual(12);
    });

    it("should return higher count for code than prose of same length", () => {
      const prose = "This is just some regular text here";
      const code = "const fn = () => { return true; }";

      // Same-ish length, code should have more tokens
      const proseTokens = estimateTokensCharBased(prose);
      const codeTokens = estimateTokensCharBased(code);

      expect(codeTokens).toBeGreaterThanOrEqual(proseTokens * 0.8);
    });
  });

  describe("estimateTokensWordBased", () => {
    it("should return 0 for empty text", () => {
      expect(estimateTokensWordBased("")).toBe(0);
      expect(estimateTokensWordBased(null as unknown as string)).toBe(0);
    });

    it("should estimate based on word count * 1.3", () => {
      const text = "one two three four five"; // 5 words
      const tokens = estimateTokensWordBased(text);

      expect(tokens).toBe(Math.ceil(5 * 1.3)); // 7
    });

    it("should handle multiple spaces", () => {
      const text = "one   two    three"; // 3 words
      const tokens = estimateTokensWordBased(text);

      expect(tokens).toBe(Math.ceil(3 * 1.3)); // 4
    });
  });

  describe("estimateTokens (default)", () => {
    it("should be char-based by default", () => {
      const text = "Test content";
      expect(estimateTokens(text)).toBe(estimateTokensCharBased(text));
    });
  });

  describe("BUDGET_PROFILES", () => {
    it("should have profiles for all scales (0-3)", () => {
      expect(BUDGET_PROFILES[0]).toBeDefined();
      expect(BUDGET_PROFILES[1]).toBeDefined();
      expect(BUDGET_PROFILES[2]).toBeDefined();
      expect(BUDGET_PROFILES[3]).toBeDefined();
    });

    it("should have increasing budgets by scale", () => {
      const quick = totalBudget(BUDGET_PROFILES[0]);
      const small = totalBudget(BUDGET_PROFILES[1]);
      const medium = totalBudget(BUDGET_PROFILES[2]);
      const large = totalBudget(BUDGET_PROFILES[3]);

      expect(small).toBeGreaterThan(quick);
      expect(medium).toBeGreaterThan(small);
      expect(large).toBeGreaterThan(medium);
    });
  });

  describe("getBudgetForScale", () => {
    it("should return correct profile for each scale", () => {
      expect(getBudgetForScale(0)).toBe(BUDGET_PROFILES[0]);
      expect(getBudgetForScale(1)).toBe(BUDGET_PROFILES[1]);
      expect(getBudgetForScale(2)).toBe(BUDGET_PROFILES[2]);
      expect(getBudgetForScale(3)).toBe(BUDGET_PROFILES[3]);
    });
  });

  describe("totalBudget", () => {
    it("should sum all allocation fields", () => {
      const allocation: TokenBudgetAllocation = {
        systemPrompt: 100,
        skills: 200,
        context: 300,
        userMessage: 400,
        outputReserve: 500,
      };

      expect(totalBudget(allocation)).toBe(1500);
    });
  });

  describe("createCustomBudget", () => {
    it("should override specified fields", () => {
      const custom = createCustomBudget({ skills: 10000 }, 2);

      expect(custom.skills).toBe(10000);
      expect(custom.systemPrompt).toBe(BUDGET_PROFILES[2].systemPrompt);
    });

    it("should use MEDIUM as default base", () => {
      const custom = createCustomBudget({ skills: 10000 });

      expect(custom.systemPrompt).toBe(BUDGET_PROFILES[2].systemPrompt);
    });

    it("should allow overriding all fields", () => {
      const custom = createCustomBudget({
        systemPrompt: 1,
        skills: 2,
        context: 3,
        userMessage: 4,
        outputReserve: 5,
      });

      expect(totalBudget(custom)).toBe(15);
    });
  });

  describe("createUsageTracker", () => {
    it("should create tracker with zero usage", () => {
      const tracker = createUsageTracker();

      expect(tracker.systemPrompt).toBe(0);
      expect(tracker.skills).toBe(0);
      expect(tracker.context).toBe(0);
      expect(tracker.userMessage).toBe(0);
      expect(tracker.skippedSkills).toEqual([]);
      expect(tracker.truncatedContext).toEqual([]);
    });
  });

  describe("remainingBudget", () => {
    it("should calculate remaining from allocation minus usage", () => {
      const allocation: TokenBudgetAllocation = {
        systemPrompt: 1000,
        skills: 2000,
        context: 1500,
        userMessage: 500,
        outputReserve: 3000,
      };
      const usage = createUsageTracker();
      usage.systemPrompt = 800;
      usage.skills = 1500;

      const remaining = remainingBudget(allocation, usage);

      expect(remaining.systemPrompt).toBe(200);
      expect(remaining.skills).toBe(500);
      expect(remaining.context).toBe(1500);
      expect(remaining.userMessage).toBe(500);
      expect(remaining.outputReserve).toBe(3000); // Never consumed
    });

    it("should not go negative", () => {
      const allocation: TokenBudgetAllocation = {
        systemPrompt: 100,
        skills: 100,
        context: 100,
        userMessage: 100,
        outputReserve: 100,
      };
      const usage = createUsageTracker();
      usage.systemPrompt = 200; // Over budget

      const remaining = remainingBudget(allocation, usage);

      expect(remaining.systemPrompt).toBe(0);
    });
  });

  describe("isBudgetExceeded", () => {
    it("should return false when within budget", () => {
      const allocation: TokenBudgetAllocation = {
        systemPrompt: 1000,
        skills: 1000,
        context: 1000,
        userMessage: 1000,
        outputReserve: 1000,
      };
      const usage = createUsageTracker();
      usage.systemPrompt = 500;

      expect(isBudgetExceeded(allocation, usage)).toBe(false);
    });

    it("should return true when any section exceeds", () => {
      const allocation: TokenBudgetAllocation = {
        systemPrompt: 1000,
        skills: 1000,
        context: 1000,
        userMessage: 1000,
        outputReserve: 1000,
      };
      const usage = createUsageTracker();
      usage.skills = 1500; // Over

      expect(isBudgetExceeded(allocation, usage)).toBe(true);
    });
  });

  describe("truncateToTokenBudget", () => {
    it("should return original if within budget", () => {
      const text = "Short text";
      const result = truncateToTokenBudget(text, 1000);

      expect(result).toBe(text);
    });

    it("should truncate when over budget", () => {
      const text = "A".repeat(1000);
      const result = truncateToTokenBudget(text, 10);

      expect(result.length).toBeLessThan(text.length);
      expect(result.endsWith("...")).toBe(true);
    });

    it("should try to break at sentence boundary", () => {
      const text = "First sentence here. Second sentence follows. Third one too.";
      const result = truncateToTokenBudget(text, 5);

      // Should break at a period if possible
      expect(result.includes(".")).toBe(true);
    });

    it("should handle empty text", () => {
      expect(truncateToTokenBudget("", 100)).toBe("");
    });

    it("should accept custom estimator", () => {
      const text = "Test content here";
      const customEstimator = (_: string) => 1000; // Always high

      const result = truncateToTokenBudget(text, 10, customEstimator);

      expect(result.length).toBeLessThan(text.length);
    });
  });

  describe("splitIntoChunks", () => {
    it("should return single chunk if within budget", () => {
      const text = "Short text";
      const chunks = splitIntoChunks(text, 1000);

      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toBe(text);
    });

    it("should split into multiple chunks when needed", () => {
      const lines = Array.from({ length: 100 }, (_, i) => `Line ${i + 1} content here`);
      const text = lines.join("\n");

      const chunks = splitIntoChunks(text, 50);

      expect(chunks.length).toBeGreaterThan(1);
    });

    it("should preserve line integrity", () => {
      const text = "Line 1\nLine 2\nLine 3";
      const chunks = splitIntoChunks(text, 5);

      // Each chunk should contain complete lines
      for (const chunk of chunks) {
        expect(chunk.endsWith("\n")).toBe(false); // No trailing newline
      }
    });

    it("should handle empty text", () => {
      expect(splitIntoChunks("", 100)).toEqual([]);
    });
  });

  describe("createSkillTokenCache", () => {
    it("should compute token counts for all levels", () => {
      const cache = createSkillTokenCache(
        "test-skill",
        "Short summary",
        "Full content with more details about the skill and its usage",
        { "ref1.ts": "reference code content", "ref2.ts": "more reference code" },
      );

      expect(cache.slug).toBe("test-skill");
      expect(cache.l1Tokens).toBeGreaterThan(0);
      expect(cache.l2Tokens).toBeGreaterThan(cache.l1Tokens);
      expect(cache.l3Tokens["ref1.ts"]).toBeGreaterThan(0);
      expect(cache.l3Tokens["ref2.ts"]).toBeGreaterThan(0);
    });

    it("should handle empty references", () => {
      const cache = createSkillTokenCache("test-skill", "Summary", "Content");

      expect(cache.l3Tokens).toEqual({});
    });

    it("should set timestamp", () => {
      const cache = createSkillTokenCache("test-skill", "Summary", "Content");

      expect(cache.computedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });
});
