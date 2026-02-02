import { ProjectScale, type WorkflowPhase } from "../core/types.js";
import { log } from "../utils/logger.js";

/**
 * Returns the active phases for a given project scale.
 */
export function getPhasesForScale(scale: ProjectScale): WorkflowPhase[] {
  switch (scale) {
    case ProjectScale.QUICK:
      return ["E", "V"];
    case ProjectScale.SMALL:
      return ["P", "E", "V"];
    case ProjectScale.MEDIUM:
      return ["P", "R", "E", "V"];
    case ProjectScale.LARGE:
      return ["P", "R", "E", "V", "C"];
    default:
      return ["P", "R", "E", "V"];
  }
}

/**
 * Returns a human-readable label for a project scale.
 */
export function scaleLabel(scale: ProjectScale): string {
  switch (scale) {
    case ProjectScale.QUICK:
      return "QUICK";
    case ProjectScale.SMALL:
      return "SMALL";
    case ProjectScale.MEDIUM:
      return "MEDIUM";
    case ProjectScale.LARGE:
      return "LARGE";
    default:
      return "UNKNOWN";
  }
}

/**
 * Parses a scale string to ProjectScale enum.
 */
export function parseScale(value: string): ProjectScale {
  switch (value.toUpperCase()) {
    case "QUICK":
    case "RAPIDO":
      return ProjectScale.QUICK;
    case "SMALL":
    case "PEQUENO":
      return ProjectScale.SMALL;
    case "MEDIUM":
    case "MEDIO":
      return ProjectScale.MEDIUM;
    case "LARGE":
    case "GRANDE":
      return ProjectScale.LARGE;
    default:
      log.warn(`Unknown scale "${value}", defaulting to MEDIUM`);
      return ProjectScale.MEDIUM;
  }
}
