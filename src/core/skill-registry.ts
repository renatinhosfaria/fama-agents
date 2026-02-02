import type { ParsedSkill, WorkflowPhase } from "./types.js";
import { discoverAllSkills, loadSkill } from "./skill-loader.js";

/**
 * Cached, queryable registry of all discovered skills.
 */
export class SkillRegistry {
  private skills: Map<string, ParsedSkill> = new Map();
  private projectDir: string;
  private skillsDir?: string;

  constructor(projectDir: string, skillsDir?: string) {
    this.projectDir = projectDir;
    this.skillsDir = skillsDir;
    this.refresh();
  }

  /** Re-scan filesystem and rebuild cache. */
  refresh(): void {
    this.skills.clear();
    const all = discoverAllSkills(this.projectDir, this.skillsDir);
    for (const skill of all) {
      this.skills.set(skill.slug, skill);
    }
  }

  /** Get all skills. */
  getAll(): ParsedSkill[] {
    return Array.from(this.skills.values());
  }

  /** Get a skill by slug. Falls back to disk and caches result. */
  getBySlug(slug: string): ParsedSkill | null {
    const cached = this.skills.get(slug);
    if (cached) return cached;

    // Fallback: try loading from disk and cache it
    const loaded = loadSkill(slug, this.projectDir, this.skillsDir);
    if (loaded) {
      this.skills.set(loaded.slug, loaded);
    }
    return loaded;
  }

  /** Get skills applicable to a specific workflow phase. */
  getForPhase(phase: WorkflowPhase): ParsedSkill[] {
    return this.getAll().filter((s) => s.phases.includes(phase));
  }

  /** Get the markdown content of a skill. */
  getContent(slug: string): string | null {
    const skill = this.getBySlug(slug);
    return skill?.content ?? null;
  }

  /** Get content for multiple skills. */
  getContents(slugs: string[]): string[] {
    return slugs
      .map((slug) => this.getContent(slug))
      .filter((c): c is string => c !== null);
  }
}
