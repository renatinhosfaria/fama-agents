import type { WorkflowPhase } from "../core/types.js";

export interface SkillFrontmatter {
  name: string;
  description: string;
  phases?: WorkflowPhase[];
}

export interface AgentFrontmatter {
  name: string;
  description: string;
  model?: string;
  tools?: string[];
  phases?: WorkflowPhase[];
  skills?: string[];
}

/**
 * Extracts YAML frontmatter from a markdown file content.
 * Frontmatter is delimited by --- at the start and end.
 */
export function extractFrontmatter<T>(
  content: string,
): { frontmatter: T; body: string } {
  const lines = content.split("\n");

  if (lines[0]?.trim() !== "---") {
    return { frontmatter: {} as T, body: content };
  }

  let endIndex = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i]?.trim() === "---") {
      endIndex = i;
      break;
    }
  }

  if (endIndex === -1) {
    return { frontmatter: {} as T, body: content };
  }

  const frontmatterLines = lines.slice(1, endIndex);
  const body = lines.slice(endIndex + 1).join("\n").trimStart();
  const frontmatter: Record<string, unknown> = {};

  for (const line of frontmatterLines) {
    const colonIndex = line.indexOf(":");
    if (colonIndex === -1) continue;

    const key = line.slice(0, colonIndex).trim();
    let value: unknown = line.slice(colonIndex + 1).trim();

    // Parse arrays like [E, V]
    if (typeof value === "string" && value.startsWith("[") && value.endsWith("]")) {
      value = value
        .slice(1, -1)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }

    frontmatter[key] = value;
  }

  return { frontmatter: frontmatter as T, body };
}

/**
 * Strips frontmatter from markdown content, returning only the body.
 */
export function stripFrontmatter(content: string): string {
  const { body } = extractFrontmatter(content);
  return body;
}
