import { existsSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getTemplates } from "./templates.js";
import type { ScaffoldFile, ScaffoldStatus } from "./types.js";

export type { ScaffoldFile, ScaffoldStatus, ScaffoldTemplate } from "./types.js";
export { getTemplates, getTemplateNames } from "./templates.js";

const DOCS_DIR = ".fama/docs";

/**
 * Scaffold the .fama/docs directory with template documentation files.
 * Only writes files that don't already exist.
 */
export function scaffoldDocs(
  projectDir: string,
  options: { force?: boolean } = {},
): string[] {
  const docsDir = resolve(projectDir, DOCS_DIR);

  if (!existsSync(docsDir)) {
    mkdirSync(docsDir, { recursive: true });
  }

  const templates = getTemplates();
  const written: string[] = [];

  for (const template of templates) {
    const filePath = resolve(docsDir, template.filename);

    if (existsSync(filePath) && !options.force) {
      continue;
    }

    writeFileSync(filePath, template.content, "utf-8");
    written.push(template.filename);
  }

  return written;
}

/**
 * Get the status of all scaffold documentation files.
 */
export function getScaffoldStatus(projectDir: string): ScaffoldFile[] {
  const docsDir = resolve(projectDir, DOCS_DIR);
  const templates = getTemplates();
  const result: ScaffoldFile[] = [];

  for (const template of templates) {
    const filePath = resolve(docsDir, template.filename);

    if (!existsSync(filePath)) {
      result.push({
        path: `${DOCS_DIR}/${template.filename}`,
        title: template.title,
        status: "unfilled",
      });
      continue;
    }

    const content = readFileSync(filePath, "utf-8");
    const status = detectStatus(content);

    result.push({
      path: `${DOCS_DIR}/${template.filename}`,
      title: template.title,
      status,
    });
  }

  return result;
}

/**
 * Get list of unfilled documentation files.
 */
export function getUnfilledDocs(projectDir: string): ScaffoldFile[] {
  return getScaffoldStatus(projectDir).filter((f) => f.status === "unfilled");
}

/**
 * Detect whether a scaffold file has been filled or not.
 */
function detectStatus(content: string): ScaffoldStatus {
  // Check YAML frontmatter for explicit status (authoritative)
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (frontmatterMatch) {
    const frontmatter = frontmatterMatch[1];
    if (frontmatter.includes("status: filled")) return "filled";
    if (frontmatter.includes("status: unfilled")) return "unfilled";
  }

  // Presence of TODO markers strongly indicates unfilled
  if (content.includes("<!-- TODO:")) return "unfilled";

  // Strip frontmatter and count substantive content lines
  // (not headings, not blockquotes, not empty, not HTML comments)
  const bodyContent = content.replace(/^---[\s\S]*?---/, "").trim();
  const substantiveLines = bodyContent
    .split("\n")
    .filter(
      (l) =>
        l.trim() &&
        !l.startsWith("#") &&
        !l.startsWith(">") &&
        !l.startsWith("<!--") &&
        !l.startsWith("- [ ]"), // Checklist placeholders
    );

  // Require more than 10 substantive lines to consider filled
  // (templates typically have 3-5 placeholder lines)
  return substantiveLines.length > 10 ? "filled" : "unfilled";
}
