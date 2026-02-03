/**
 * LRU (Least Recently Used) Cache with TTL support.
 *
 * Features:
 * - O(1) get/set operations
 * - Automatic eviction of least recently used items when capacity is reached
 * - Optional TTL (time-to-live) for entries
 * - No external dependencies
 */

export interface LRUCacheOptions {
  /** Maximum number of items in cache */
  maxSize: number;
  /** Time-to-live in milliseconds (0 = no TTL) */
  ttlMs: number;
}

interface CacheEntry<V> {
  value: V;
  createdAt: number;
}

/**
 * A simple LRU cache implementation using Map's insertion order.
 *
 * @example
 * ```typescript
 * const cache = new LRUCache<string, User>({ maxSize: 100, ttlMs: 5 * 60 * 1000 });
 * cache.set("user:123", user);
 * const user = cache.get("user:123");
 * ```
 */
export class LRUCache<K, V> {
  private cache: Map<K, CacheEntry<V>> = new Map();
  private readonly maxSize: number;
  private readonly ttlMs: number;

  constructor(options: LRUCacheOptions) {
    if (options.maxSize < 1) {
      throw new Error("LRUCache maxSize must be at least 1");
    }
    this.maxSize = options.maxSize;
    this.ttlMs = options.ttlMs;
  }

  /**
   * Gets a value from the cache.
   * Returns undefined if not found or expired.
   * Refreshes the entry's position (moves to most recently used).
   */
  get(key: K): V | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    // Check TTL expiration
    if (this.ttlMs > 0 && Date.now() - entry.createdAt > this.ttlMs) {
      this.cache.delete(key);
      return undefined;
    }

    // Move to end (most recently used) by re-inserting
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.value;
  }

  /**
   * Sets a value in the cache.
   * If key exists, updates the value and refreshes position.
   * If at capacity, evicts the least recently used item.
   */
  set(key: K, value: V): void {
    // Delete if exists (to update position)
    this.cache.delete(key);

    // Evict oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      value,
      createdAt: Date.now(),
    });
  }

  /**
   * Checks if a key exists and is not expired.
   */
  has(key: K): boolean {
    return this.get(key) !== undefined;
  }

  /**
   * Removes a key from the cache.
   * Returns true if the key was present.
   */
  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  /**
   * Removes all entries from the cache.
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Returns the current number of entries in the cache.
   * Note: May include expired entries that haven't been accessed yet.
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Returns all keys currently in the cache.
   * Does not check for expiration.
   */
  keys(): IterableIterator<K> {
    return this.cache.keys();
  }

  /**
   * Removes all expired entries from the cache.
   * Call periodically if you need accurate size() values.
   */
  prune(): number {
    if (this.ttlMs <= 0) return 0;

    const now = Date.now();
    let pruned = 0;

    for (const [key, entry] of this.cache) {
      if (now - entry.createdAt > this.ttlMs) {
        this.cache.delete(key);
        pruned++;
      }
    }

    return pruned;
  }

  /**
   * Returns cache statistics.
   */
  stats(): { size: number; maxSize: number; ttlMs: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      ttlMs: this.ttlMs,
    };
  }
}
