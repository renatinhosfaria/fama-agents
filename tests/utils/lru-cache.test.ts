import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { LRUCache } from "../../src/utils/lru-cache.js";

describe("LRUCache", () => {
  describe("constructor", () => {
    it("should create cache with valid options", () => {
      const cache = new LRUCache<string, number>({ maxSize: 10, ttlMs: 1000 });
      expect(cache.size()).toBe(0);
    });

    it("should throw error for maxSize < 1", () => {
      expect(() => new LRUCache<string, number>({ maxSize: 0, ttlMs: 1000 })).toThrow(
        "maxSize must be at least 1",
      );
    });
  });

  describe("get/set", () => {
    it("should store and retrieve values", () => {
      const cache = new LRUCache<string, string>({ maxSize: 10, ttlMs: 0 });
      cache.set("key1", "value1");
      expect(cache.get("key1")).toBe("value1");
    });

    it("should return undefined for missing keys", () => {
      const cache = new LRUCache<string, string>({ maxSize: 10, ttlMs: 0 });
      expect(cache.get("nonexistent")).toBeUndefined();
    });

    it("should overwrite existing values", () => {
      const cache = new LRUCache<string, string>({ maxSize: 10, ttlMs: 0 });
      cache.set("key1", "value1");
      cache.set("key1", "value2");
      expect(cache.get("key1")).toBe("value2");
    });

    it("should work with various key/value types", () => {
      const cache = new LRUCache<number, { name: string }>({ maxSize: 10, ttlMs: 0 });
      cache.set(123, { name: "test" });
      expect(cache.get(123)).toEqual({ name: "test" });
    });
  });

  describe("LRU eviction", () => {
    it("should evict least recently used when at capacity", () => {
      const cache = new LRUCache<string, string>({ maxSize: 3, ttlMs: 0 });

      cache.set("a", "1");
      cache.set("b", "2");
      cache.set("c", "3");
      cache.set("d", "4"); // Should evict "a"

      expect(cache.get("a")).toBeUndefined();
      expect(cache.get("b")).toBe("2");
      expect(cache.get("c")).toBe("3");
      expect(cache.get("d")).toBe("4");
    });

    it("should refresh position on get", () => {
      const cache = new LRUCache<string, string>({ maxSize: 3, ttlMs: 0 });

      cache.set("a", "1");
      cache.set("b", "2");
      cache.set("c", "3");

      // Access "a" to make it most recently used
      cache.get("a");

      cache.set("d", "4"); // Should evict "b" (now least recently used)

      expect(cache.get("a")).toBe("1");
      expect(cache.get("b")).toBeUndefined();
      expect(cache.get("c")).toBe("3");
      expect(cache.get("d")).toBe("4");
    });

    it("should refresh position on set (update)", () => {
      const cache = new LRUCache<string, string>({ maxSize: 3, ttlMs: 0 });

      cache.set("a", "1");
      cache.set("b", "2");
      cache.set("c", "3");

      // Update "a" to make it most recently used
      cache.set("a", "updated");

      cache.set("d", "4"); // Should evict "b"

      expect(cache.get("a")).toBe("updated");
      expect(cache.get("b")).toBeUndefined();
    });

    it("should handle single-item cache", () => {
      const cache = new LRUCache<string, string>({ maxSize: 1, ttlMs: 0 });

      cache.set("a", "1");
      expect(cache.get("a")).toBe("1");

      cache.set("b", "2");
      expect(cache.get("a")).toBeUndefined();
      expect(cache.get("b")).toBe("2");
    });
  });

  describe("TTL expiration", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should expire entries after TTL", () => {
      const cache = new LRUCache<string, string>({ maxSize: 10, ttlMs: 1000 });

      cache.set("key1", "value1");
      expect(cache.get("key1")).toBe("value1");

      // Advance time past TTL
      vi.advanceTimersByTime(1001);

      expect(cache.get("key1")).toBeUndefined();
    });

    it("should not expire entries before TTL", () => {
      const cache = new LRUCache<string, string>({ maxSize: 10, ttlMs: 1000 });

      cache.set("key1", "value1");

      // Advance time but not past TTL
      vi.advanceTimersByTime(500);

      expect(cache.get("key1")).toBe("value1");
    });

    it("should not expire entries when ttlMs is 0", () => {
      const cache = new LRUCache<string, string>({ maxSize: 10, ttlMs: 0 });

      cache.set("key1", "value1");

      // Advance time significantly
      vi.advanceTimersByTime(999999);

      expect(cache.get("key1")).toBe("value1");
    });

    it("should remove expired entry from cache on access", () => {
      const cache = new LRUCache<string, string>({ maxSize: 10, ttlMs: 1000 });

      cache.set("key1", "value1");
      expect(cache.size()).toBe(1);

      vi.advanceTimersByTime(1001);

      cache.get("key1"); // This should remove the expired entry
      expect(cache.size()).toBe(0);
    });
  });

  describe("has", () => {
    it("should return true for existing non-expired keys", () => {
      const cache = new LRUCache<string, string>({ maxSize: 10, ttlMs: 0 });
      cache.set("key1", "value1");
      expect(cache.has("key1")).toBe(true);
    });

    it("should return false for missing keys", () => {
      const cache = new LRUCache<string, string>({ maxSize: 10, ttlMs: 0 });
      expect(cache.has("nonexistent")).toBe(false);
    });

    it("should return false for expired keys", () => {
      vi.useFakeTimers();
      const cache = new LRUCache<string, string>({ maxSize: 10, ttlMs: 1000 });
      cache.set("key1", "value1");

      vi.advanceTimersByTime(1001);

      expect(cache.has("key1")).toBe(false);
      vi.useRealTimers();
    });
  });

  describe("delete", () => {
    it("should remove existing key", () => {
      const cache = new LRUCache<string, string>({ maxSize: 10, ttlMs: 0 });
      cache.set("key1", "value1");

      const deleted = cache.delete("key1");

      expect(deleted).toBe(true);
      expect(cache.get("key1")).toBeUndefined();
    });

    it("should return false for non-existent key", () => {
      const cache = new LRUCache<string, string>({ maxSize: 10, ttlMs: 0 });
      expect(cache.delete("nonexistent")).toBe(false);
    });
  });

  describe("clear", () => {
    it("should remove all entries", () => {
      const cache = new LRUCache<string, string>({ maxSize: 10, ttlMs: 0 });
      cache.set("a", "1");
      cache.set("b", "2");
      cache.set("c", "3");

      cache.clear();

      expect(cache.size()).toBe(0);
      expect(cache.get("a")).toBeUndefined();
      expect(cache.get("b")).toBeUndefined();
      expect(cache.get("c")).toBeUndefined();
    });
  });

  describe("size", () => {
    it("should return current entry count", () => {
      const cache = new LRUCache<string, string>({ maxSize: 10, ttlMs: 0 });

      expect(cache.size()).toBe(0);

      cache.set("a", "1");
      expect(cache.size()).toBe(1);

      cache.set("b", "2");
      expect(cache.size()).toBe(2);

      cache.delete("a");
      expect(cache.size()).toBe(1);
    });

    it("should not exceed maxSize", () => {
      const cache = new LRUCache<string, string>({ maxSize: 3, ttlMs: 0 });

      for (let i = 0; i < 10; i++) {
        cache.set(`key${i}`, `value${i}`);
      }

      expect(cache.size()).toBe(3);
    });
  });

  describe("prune", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should remove expired entries", () => {
      const cache = new LRUCache<string, string>({ maxSize: 10, ttlMs: 1000 });

      cache.set("old", "1");

      vi.advanceTimersByTime(500);

      cache.set("new", "2");

      vi.advanceTimersByTime(600); // "old" is now expired, "new" is not

      const pruned = cache.prune();

      expect(pruned).toBe(1);
      expect(cache.get("old")).toBeUndefined();
      expect(cache.get("new")).toBe("2");
    });

    it("should return 0 when nothing to prune", () => {
      const cache = new LRUCache<string, string>({ maxSize: 10, ttlMs: 1000 });
      cache.set("key", "value");

      const pruned = cache.prune();

      expect(pruned).toBe(0);
    });

    it("should do nothing when ttlMs is 0", () => {
      const cache = new LRUCache<string, string>({ maxSize: 10, ttlMs: 0 });
      cache.set("key", "value");

      vi.advanceTimersByTime(999999);

      const pruned = cache.prune();

      expect(pruned).toBe(0);
      expect(cache.get("key")).toBe("value");
    });
  });

  describe("stats", () => {
    it("should return cache statistics", () => {
      const cache = new LRUCache<string, string>({ maxSize: 50, ttlMs: 5000 });
      cache.set("a", "1");
      cache.set("b", "2");

      const stats = cache.stats();

      expect(stats).toEqual({
        size: 2,
        maxSize: 50,
        ttlMs: 5000,
      });
    });
  });

  describe("keys", () => {
    it("should return all keys", () => {
      const cache = new LRUCache<string, string>({ maxSize: 10, ttlMs: 0 });
      cache.set("a", "1");
      cache.set("b", "2");
      cache.set("c", "3");

      const keys = Array.from(cache.keys());

      expect(keys).toHaveLength(3);
      expect(keys).toContain("a");
      expect(keys).toContain("b");
      expect(keys).toContain("c");
    });
  });
});
