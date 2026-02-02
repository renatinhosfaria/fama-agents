import type { SkillRegistry } from "../../core/skill-registry.js";
import type { WorkflowPhase } from "../../core/types.js";

type SkillAction = "list" | "show" | "search" | "forPhase";

interface SkillGatewayParams {
  action: SkillAction;
  slug?: string;
  query?: string;
  phase?: string;
}

/**
 * MCP Gateway for skill-related operations.
 */
export function handleSkillGateway(
  params: SkillGatewayParams,
  skillRegistry: SkillRegistry,
): string {
  switch (params.action) {
    case "list": {
      const skills = skillRegistry.getAll();
      return skills
        .map((s) => `${s.slug}: ${s.description} (phases: ${s.phases.join(",")})`)
        .join("\n");
    }

    case "show": {
      if (!params.slug) return "Error: slug is required for 'show' action.";
      const content = skillRegistry.getContent(params.slug);
      if (!content) return `Skill "${params.slug}" not found.`;
      return content;
    }

    case "search": {
      if (!params.query) return "Error: query is required for 'search' action.";
      const skills = skillRegistry.getAll();
      const q = params.query.toLowerCase();
      const matches = skills.filter(
        (s) =>
          s.slug.includes(q) ||
          s.name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q),
      );
      if (matches.length === 0) return `No skills matching "${params.query}".`;
      return matches
        .map((s) => `${s.slug}: ${s.description}`)
        .join("\n");
    }

    case "forPhase": {
      if (!params.phase) return "Error: phase is required for 'forPhase' action.";
      const validPhases = ["P", "R", "E", "V", "C"];
      if (!validPhases.includes(params.phase)) {
        return `Invalid phase "${params.phase}". Valid: ${validPhases.join(", ")}`;
      }
      const skills = skillRegistry.getForPhase(params.phase as WorkflowPhase);
      if (skills.length === 0) return `No skills for phase "${params.phase}".`;
      return skills
        .map((s) => `${s.slug}: ${s.description}`)
        .join("\n");
    }

    default:
      return `Unknown action "${params.action}". Available: list, show, search, forPhase`;
  }
}
