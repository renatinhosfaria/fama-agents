import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { resolve, basename, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { extractFrontmatter, type SkillFrontmatter } from "../utils/frontmatter.js";
import type { ParsedSkill, WorkflowPhase } from "./types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Gets the built-in skills directory (package root /skills).
 */
function getBuiltInSkillsDir(): string {
  return resolve(__dirname, "..", "..", "skills");
}

/**
 * Discovers all SKILL.md files in a directory (1 level deep).
 */
function discoverSkillsInDir(
  dir: string,
  source: ParsedSkill["source"],
): ParsedSkill[] {
  if (!existsSync(dir)) return [];

  const skills: ParsedSkill[] = [];
  const entries = readdirSync(dir);

  for (const entry of entries) {
    const entryPath = resolve(dir, entry);
    if (!statSync(entryPath).isDirectory()) continue;

    const skillFile = resolve(entryPath, "SKILL.md");
    if (!existsSync(skillFile)) continue;

    const skill = loadSkillFile(skillFile, entry, source);
    if (skill) skills.push(skill);
  }

  return skills;
}

/**
 * Loads and parses a single SKILL.md file.
 */
function loadSkillFile(
  filePath: string,
  slug: string,
  source: ParsedSkill["source"],
): ParsedSkill | null {
  try {
    const raw = readFileSync(filePath, "utf-8");
    const { frontmatter, body } = extractFrontmatter<SkillFrontmatter>(raw);

    return {
      slug,
      name: (frontmatter.name as string) || slug,
      description: (frontmatter.description as string) || "",
      content: body,
      phases: (frontmatter.phases as WorkflowPhase[]) || [],
      source,
      filePath,
    };
  } catch {
    return null;
  }
}

/**
 * Discovers all skills from built-in and project directories.
 * Project skills shadow built-in skills with the same slug.
 */
export function discoverAllSkills(projectDir: string): ParsedSkill[] {
  const builtInDir = getBuiltInSkillsDir();
  const projectSkillsDir = resolve(projectDir, "skills");

  const builtIn = discoverSkillsInDir(builtInDir, "built-in");
  const project = discoverSkillsInDir(projectSkillsDir, "project");

  // Project skills shadow built-in
  const slugMap = new Map<string, ParsedSkill>();
  for (const skill of builtIn) {
    slugMap.set(skill.slug, skill);
  }
  for (const skill of project) {
    slugMap.set(skill.slug, skill);
  }

  return Array.from(slugMap.values());
}

/**
 * Loads a single skill by slug.
 */
export function loadSkill(
  slug: string,
  projectDir: string,
): ParsedSkill | null {
  // Check project first (shadow)
  const projectPath = resolve(projectDir, "skills", slug, "SKILL.md");
  if (existsSync(projectPath)) {
    return loadSkillFile(projectPath, slug, "project");
  }

  // Check built-in
  const builtInPath = resolve(getBuiltInSkillsDir(), slug, "SKILL.md");
  if (existsSync(builtInPath)) {
    return loadSkillFile(builtInPath, slug, "built-in");
  }

  return null;
}
