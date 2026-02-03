import { parse as parseYaml } from "yaml";
import type { WorkflowPhase, PersonaConfig, MenuEntry } from "../core/types.js";

export interface SkillFrontmatter {
  name?: string;
  description?: string;
  phases?: WorkflowPhase[];
  // Agent Skills Specification optional fields:
  license?: string;
  compatibility?: string;
  metadata?: Record<string, string>;
  "allowed-tools"?: string[];
}

export interface AgentFrontmatter {
  name?: string;
  description?: string;
  model?: string;
  tools?: string[];
  phases?: WorkflowPhase[];
  skills?: string[];
  persona?: PersonaConfig;
  critical_actions?: string[];
  menu?: MenuEntry[];
  hasSidecar?: boolean;
}

/**
 * Extracts YAML frontmatter from a markdown file content.
 * Frontmatter is delimited by --- at the start and end.
 * Uses the `yaml` library for robust parsing.
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

  const frontmatterRaw = lines.slice(1, endIndex).join("\n");
  const body = lines.slice(endIndex + 1).join("\n").trimStart();

  try {
    const parsed = parseYaml(frontmatterRaw);
    const frontmatter = (parsed && typeof parsed === "object" ? parsed : {}) as T;
    return { frontmatter, body };
  } catch {
    return { frontmatter: {} as T, body };
  }
}

/**
 * Strips frontmatter from markdown content, returning only the body.
 */
export function stripFrontmatter(content: string): string {
  const { body } = extractFrontmatter(content);
  return body;
}
