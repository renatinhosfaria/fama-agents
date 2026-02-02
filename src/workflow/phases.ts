import type { PhaseDefinition, WorkflowPhase } from "../core/types.js";

export const PHASE_DEFINITIONS: Record<WorkflowPhase, PhaseDefinition> = {
  P: {
    name: "Planning",
    description: "Descoberta, requisitos e especificações",
    agents: ["architect", "documentation-writer"],
    skills: ["brainstorming", "writing-plans", "feature-breakdown", "implementation-readiness"],
    optional: false,
    order: 1,
  },
  R: {
    name: "Review",
    description: "Arquitetura, decisões técnicas e revisão de design",
    agents: ["architect", "code-reviewer", "security-auditor"],
    skills: ["code-review", "security-audit", "implementation-readiness"],
    optional: true,
    order: 2,
  },
  E: {
    name: "Execution",
    description: "Implementação e desenvolvimento",
    agents: ["feature-developer", "bug-fixer", "test-writer", "refactoring-specialist"],
    skills: ["executing-plans", "test-driven-development", "systematic-debugging"],
    optional: false,
    order: 3,
  },
  V: {
    name: "Validation",
    description: "Testes, QA e revisão de código",
    agents: ["test-writer", "code-reviewer", "security-auditor", "performance-optimizer"],
    skills: ["verification", "test-driven-development", "code-review"],
    optional: false,
    order: 4,
  },
  C: {
    name: "Confirmation",
    description: "Documentação, deploy e handoff",
    agents: ["documentation-writer", "devops-specialist"],
    skills: ["verification", "deployment-checklist", "release-notes", "documentation-review"],
    optional: true,
    order: 5,
  },
};

export const ALL_PHASES: WorkflowPhase[] = ["P", "R", "E", "V", "C"];
