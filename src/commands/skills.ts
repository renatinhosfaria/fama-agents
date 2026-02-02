import { SkillRegistry } from "../core/skill-registry.js";
import { loadConfig } from "../utils/config.js";
import { log } from "../utils/logger.js";

export function skillsListCommand(cwd: string = process.cwd(), options?: { json?: boolean }) {
  const config = loadConfig(cwd);
  const registry = new SkillRegistry(cwd, config.skillsDir);
  const skills = registry.getAll();

  if (options?.json) {
    console.log(JSON.stringify(skills.map((s) => ({
      slug: s.slug,
      name: s.name,
      description: s.description,
      phases: s.phases,
      source: s.source,
    })), null, 2));
    return;
  }

  log.heading("Available Skills");

  for (const skill of skills) {
    console.log(`  ${skill.slug}`);
    log.dim(`    ${skill.description}`);
    log.dim(`    Phases: ${skill.phases.join(", ")}`);
    log.dim(`    Source: ${skill.source}`);
    console.log();
  }

  log.dim(`Total: ${skills.length} skills`);
}

export function skillsShowCommand(slug: string, cwd: string = process.cwd()) {
  const config = loadConfig(cwd);
  const registry = new SkillRegistry(cwd, config.skillsDir);
  const skill = registry.getBySlug(slug);

  if (!skill) {
    log.error(`Skill "${slug}" not found.`);
    process.exit(1);
  }

  log.heading(skill.name);
  console.log(skill.description);
  console.log();
  log.dim(`Phases: ${skill.phases.join(", ")}`);
  log.dim(`Source: ${skill.source}`);
  console.log("\n--- Content ---\n");
  console.log(skill.content);
}
