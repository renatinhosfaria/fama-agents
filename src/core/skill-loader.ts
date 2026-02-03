import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { extractFrontmatter, type SkillFrontmatter } from "../utils/frontmatter.js";
import type { ParsedSkill, SkillSummary, SkillReference } from "./types.js";
import { log } from "../utils/logger.js";
import {
  normalizeOptionalPhases,
  normalizeOptionalString,
  validateSkillName,
  validateSkillDescription,
} from "../utils/validation.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Gets the built-in skills directory (package root /skills).
 */
function getBuiltInSkillsDir(): string {
  return resolve(__dirname, "..", "..", "skills");
}

/**
 * Loads only the frontmatter (summary) from a SKILL.md file.
 * Level 1: ~100 tokens per skill, no body content loaded.
 */
function loadSkillSummary(
  filePath: string,
  slug: string,
  source: SkillSummary["source"],
): SkillSummary | null {
  try {
    const raw = readFileSync(filePath, "utf-8");
    const { frontmatter } = extractFrontmatter<SkillFrontmatter>(raw);
    const context = `Skill "${slug}" (${filePath})`;
    const name = normalizeOptionalString(frontmatter.name, "name", context) ?? slug;
    const description =
      normalizeOptionalString(frontmatter.description, "description", context) ?? "";
    const phases = normalizeOptionalPhases(frontmatter.phases, context) ?? [];
    const license =
      normalizeOptionalString(frontmatter.license, "license", context) ?? undefined;
    const compatibility =
      normalizeOptionalString(frontmatter.compatibility, "compatibility", context) ?? undefined;
    const metadata =
      frontmatter.metadata && typeof frontmatter.metadata === "object"
        ? (frontmatter.metadata as Record<string, string>)
        : undefined;
    const allowedTools = Array.isArray(frontmatter["allowed-tools"])
      ? frontmatter["allowed-tools"]
      : undefined;

    return {
      slug,
      name,
      description,
      phases,
      source,
      filePath,
      license,
      compatibility,
      metadata,
      allowedTools,
    };
  } catch (err) {
    log.warn(`Failed to load skill summary "${slug}" from ${filePath}: ${err instanceof Error ? err.message : String(err)}`);
    return null;
  }
}

/**
 * Discovers skill summaries (frontmatter only) in a directory.
 */
function discoverSummariesInDir(
  dir: string,
  source: SkillSummary["source"],
): SkillSummary[] {
  if (!existsSync(dir)) return [];

  const summaries: SkillSummary[] = [];
  const entries = readdirSync(dir);

  for (const entry of entries) {
    const entryPath = resolve(dir, entry);
    if (!statSync(entryPath).isDirectory()) continue;

    const skillFile = resolve(entryPath, "SKILL.md");
    if (!existsSync(skillFile)) continue;

    const summary = loadSkillSummary(skillFile, entry, source);
    if (summary) summaries.push(summary);
  }

  return summaries;
}

/**
 * Discovers all skill summaries (Level 1: frontmatter only, no body).
 * Project skills shadow built-in skills with the same slug.
 */
export function discoverSkillSummaries(
  projectDir: string,
  skillsDir?: string,
): SkillSummary[] {
  const builtInDir = getBuiltInSkillsDir();
  const projectSkillsDir = resolve(projectDir, skillsDir ?? "skills");

  const builtIn = discoverSummariesInDir(builtInDir, "built-in");
  const project = discoverSummariesInDir(projectSkillsDir, "project");

  const slugMap = new Map<string, SkillSummary>();
  for (const s of builtIn) slugMap.set(s.slug, s);
  for (const s of project) slugMap.set(s.slug, s);

  return Array.from(slugMap.values());
}

/**
 * Loads reference files from a skill's references/ subdirectory (Level 3).
 */
export function loadSkillReferences(skillDir: string, slug: string): SkillReference[] {
  const refsDir = resolve(skillDir, "references");
  if (!existsSync(refsDir)) return [];

  const refs: SkillReference[] = [];
  const entries = readdirSync(refsDir);

  for (const entry of entries) {
    const filePath = resolve(refsDir, entry);
    if (statSync(filePath).isDirectory()) continue;
    if (!entry.endsWith(".md") && !entry.endsWith(".txt")) continue;

    try {
      const content = readFileSync(filePath, "utf-8");
      refs.push({ slug, fileName: entry, content });
    } catch (err) {
      log.warn(`Failed to load reference "${entry}" for skill "${slug}": ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return refs;
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
    const context = `Skill "${slug}" (${filePath})`;
    const name = normalizeOptionalString(frontmatter.name, "name", context) ?? slug;
    const description =
      normalizeOptionalString(frontmatter.description, "description", context) ?? "";
    const phases = normalizeOptionalPhases(frontmatter.phases, context) ?? [];

    // Agent Skills Specification validation (warnings only, graceful degradation)
    const nameWarnings = validateSkillName(name, slug);
    for (const w of nameWarnings) log.warn(`${context}: ${w}`);
    const descWarnings = validateSkillDescription(description);
    for (const w of descWarnings) log.warn(`${context}: ${w}`);

    // Extract optional spec fields
    const license =
      normalizeOptionalString(frontmatter.license, "license", context) ?? undefined;
    const compatibility =
      normalizeOptionalString(frontmatter.compatibility, "compatibility", context) ?? undefined;
    const metadata =
      frontmatter.metadata && typeof frontmatter.metadata === "object"
        ? (frontmatter.metadata as Record<string, string>)
        : undefined;
    const allowedTools = Array.isArray(frontmatter["allowed-tools"])
      ? frontmatter["allowed-tools"]
      : undefined;

    return {
      slug,
      name,
      description,
      content: body,
      phases,
      source,
      filePath,
      license,
      compatibility,
      metadata,
      allowedTools,
    };
  } catch (err) {
    log.warn(`Failed to load skill "${slug}" from ${filePath}: ${err instanceof Error ? err.message : String(err)}`);
    return null;
  }
}

/**
 * Discovers all skills from built-in and project directories.
 * Project skills shadow built-in skills with the same slug.
 */
export function discoverAllSkills(
  projectDir: string,
  skillsDir?: string,
): ParsedSkill[] {
  const builtInDir = getBuiltInSkillsDir();
  const projectSkillsDir = resolve(projectDir, skillsDir ?? "skills");

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
  skillsDir?: string,
): ParsedSkill | null {
  // Validate slug to prevent path traversal
  if (!/^[a-z0-9][a-z0-9-]*$/i.test(slug)) {
    log.warn(`Invalid skill slug: "${slug}"`);
    return null;
  }

  // Check project first (shadow)
  const projectPath = resolve(projectDir, skillsDir ?? "skills", slug, "SKILL.md");
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
