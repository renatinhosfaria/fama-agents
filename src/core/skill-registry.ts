import type { ParsedSkill, SkillSummary, SkillReference, WorkflowPhase } from "./types.js";
import { discoverSkillSummaries, loadSkill, loadSkillReferences } from "./skill-loader.js";
import { dirname } from "node:path";
import { LRUCache } from "../utils/lru-cache.js";

/** Default cache configuration */
const DEFAULT_CACHE_MAX_SIZE = 50;
const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Three-tier cached registry of all discovered skills.
 *
 * Level 1 (summaries): Loaded at startup, ~100 tokens per skill. Uses Map (small, no eviction needed).
 * Level 2 (full skills): Loaded on demand, cached with LRU eviction and TTL.
 * Level 3 (references): Loaded on demand from references/ subdirectories (not cached).
 */
export class SkillRegistry {
  private summaries: Map<string, SkillSummary> = new Map();
  private fullSkills: LRUCache<string, ParsedSkill>;
  private projectDir: string;
  private skillsDir?: string;

  constructor(
    projectDir: string,
    skillsDir?: string,
    cacheOptions?: { maxSize?: number; ttlMs?: number },
  ) {
    this.projectDir = projectDir;
    this.skillsDir = skillsDir;
    this.fullSkills = new LRUCache({
      maxSize: cacheOptions?.maxSize ?? DEFAULT_CACHE_MAX_SIZE,
      ttlMs: cacheOptions?.ttlMs ?? DEFAULT_CACHE_TTL_MS,
    });
    this.refresh();
  }

  /** Re-scan filesystem and rebuild Level 1 cache (summaries only). */
  refresh(): void {
    this.summaries.clear();
    this.fullSkills.clear();
    const all = discoverSkillSummaries(this.projectDir, this.skillsDir);
    for (const summary of all) {
      this.summaries.set(summary.slug, summary);
    }
  }

  /** Level 1: Get all skill summaries (lightweight, no body content). */
  getAll(): SkillSummary[] {
    return Array.from(this.summaries.values());
  }

  /** Level 2: Get a full skill by slug (lazy loaded and cached). */
  getBySlug(slug: string): ParsedSkill | null {
    const cached = this.fullSkills.get(slug);
    if (cached) return cached;

    // Lazy load Level 2
    const loaded = loadSkill(slug, this.projectDir, this.skillsDir);
    if (loaded) {
      this.fullSkills.set(loaded.slug, loaded);
    }
    return loaded;
  }

  /** Level 1: Get skill summaries applicable to a specific workflow phase. */
  getForPhase(phase: WorkflowPhase): SkillSummary[] {
    return this.getAll().filter((s) => s.phases.includes(phase));
  }

  /** Level 2: Get the markdown content of a skill (lazy loads if needed). */
  getContent(slug: string): string | null {
    const skill = this.getBySlug(slug);
    return skill?.content ?? null;
  }

  /** Level 2: Get content for multiple skills. */
  getContents(slugs: string[]): string[] {
    return slugs
      .map((slug) => this.getContent(slug))
      .filter((c): c is string => c !== null);
  }

  /** Level 3: Get reference files for a skill (loaded from references/ subdirectory). */
  getReferences(slug: string): SkillReference[] {
    const summary = this.summaries.get(slug);
    if (!summary) return [];
    const skillDir = dirname(summary.filePath);
    return loadSkillReferences(skillDir, slug);
  }
}
