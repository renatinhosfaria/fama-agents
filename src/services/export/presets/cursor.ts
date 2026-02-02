import type { ExportContext, ExportPreset, ExportResult } from "../types.js";
import { sanitizeSlug } from "../export-service.js";

/**
 * Generates .cursor/rules/{agent-slug}.mdc files for Cursor IDE.
 */
export const cursorPreset: ExportPreset = {
  name: "cursor",
  description: "Export agents as Cursor rules (.cursor/rules/*.mdc)",

  generate(context: ExportContext): ExportResult {
    const files = context.agents.map((agent) => {
      const safeSlug = sanitizeSlug(agent.slug);
      const frontmatter = [
        "---",
        `description: "${agent.description.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, " ")}"`,
        `globs: []`,
        `alwaysApply: false`,
        "---",
      ].join("\n");

      const sections: string[] = [];

      if (agent.persona) {
        sections.push(`# ${agent.persona.displayName ?? agent.name}`);
        if (agent.persona.role) sections.push(`**Role:** ${agent.persona.role}`);
        if (agent.persona.identity) sections.push(`\n${agent.persona.identity}`);
        if (agent.persona.principles && agent.persona.principles.length > 0) {
          sections.push(`\n**Principles:**`);
          for (const p of agent.persona.principles) {
            sections.push(`- ${p}`);
          }
        }
      } else {
        sections.push(`# ${agent.name}`);
      }

      sections.push(`\n${agent.description}`);

      if (agent.criticalActions && agent.criticalActions.length > 0) {
        sections.push(`\n## Critical Actions\n`);
        for (const action of agent.criticalActions) {
          sections.push(`- ${action}`);
        }
      }

      sections.push(`\n## Prompt\n`);
      sections.push(agent.prompt);

      const content = `${frontmatter}\n\n${sections.join("\n")}\n`;

      return {
        path: `.cursor/rules/${safeSlug}.mdc`,
        content,
      };
    });

    return {
      files,
      summary: `Generated ${files.length} Cursor rule(s) in .cursor/rules/`,
    };
  },
};
