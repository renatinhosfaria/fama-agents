import { SkillRegistry } from "../core/skill-registry.js";
import { log } from "../utils/logger.js";

export function skillsListCommand(cwd: string = process.cwd()) {
  const registry = new SkillRegistry(cwd);
  const skills = registry.getAll();

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
  const registry = new SkillRegistry(cwd);
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
