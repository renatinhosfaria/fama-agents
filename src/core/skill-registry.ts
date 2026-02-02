import type { ParsedSkill, WorkflowPhase } from "./types.js";
import { discoverAllSkills, loadSkill } from "./skill-loader.js";

/**
 * Cached, queryable registry of all discovered skills.
 */
export class SkillRegistry {
  private skills: Map<string, ParsedSkill> = new Map();
  private projectDir: string;

  constructor(projectDir: string) {
    this.projectDir = projectDir;
    this.refresh();
  }

  /** Re-scan filesystem and rebuild cache. */
  refresh(): void {
    this.skills.clear();
    const all = discoverAllSkills(this.projectDir);
    for (const skill of all) {
      this.skills.set(skill.slug, skill);
    }
  }

  /** Get all skills. */
  getAll(): ParsedSkill[] {
    return Array.from(this.skills.values());
  }

  /** Get a skill by slug. */
  getBySlug(slug: string): ParsedSkill | null {
    return this.skills.get(slug) ?? loadSkill(slug, this.projectDir);
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
