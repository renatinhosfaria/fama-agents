import { describe, it, expect } from "vitest";
import {
  WorkflowPhaseSchema,
  AgentModelSchema,
  PhaseStatusSchema,
  WorkflowStateSchema,
  FamaConfigSchema,
  AgentFrontmatterSchema,
  SkillFrontmatterSchema,
  RunAgentOptionsSchema,
  PersonaConfigSchema,
  MenuEntrySchema,
} from "../../src/core/schemas.js";
import { ProjectScale } from "../../src/core/types.js";

describe("WorkflowPhaseSchema", () => {
  it("should accept valid phases", () => {
    for (const p of ["P", "R", "E", "V", "C"]) {
      expect(WorkflowPhaseSchema.safeParse(p).success).toBe(true);
    }
  });

  it("should reject invalid phases", () => {
    expect(WorkflowPhaseSchema.safeParse("X").success).toBe(false);
    expect(WorkflowPhaseSchema.safeParse(1).success).toBe(false);
  });
});

describe("AgentModelSchema", () => {
  it("should accept valid models", () => {
    for (const m of ["sonnet", "opus", "haiku", "inherit"]) {
      expect(AgentModelSchema.safeParse(m).success).toBe(true);
    }
  });

  it("should reject invalid models", () => {
    expect(AgentModelSchema.safeParse("gpt-4").success).toBe(false);
  });
});

describe("PhaseStatusSchema", () => {
  it("should accept valid phase status", () => {
    const result = PhaseStatusSchema.safeParse({ status: "pending" });
    expect(result.success).toBe(true);
  });

  it("should accept status with optional fields", () => {
    const result = PhaseStatusSchema.safeParse({
      status: "completed",
      startedAt: "2026-01-01T00:00:00Z",
      completedAt: "2026-01-01T01:00:00Z",
      outputs: ["/path/to/file.json"],
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid status value", () => {
    expect(PhaseStatusSchema.safeParse({ status: "unknown" }).success).toBe(false);
  });
});

describe("WorkflowStateSchema", () => {
  const validState = {
    name: "test-workflow",
    scale: ProjectScale.MEDIUM,
    currentPhase: "P",
    phases: {
      P: { status: "in_progress" },
      R: { status: "pending" },
      E: { status: "pending" },
      V: { status: "pending" },
      C: { status: "skipped" },
    },
    history: [{ timestamp: "2026-01-01T00:00:00Z", phase: "P", action: "started" }],
    startedAt: "2026-01-01T00:00:00Z",
  };

  it("should accept valid workflow state", () => {
    const result = WorkflowStateSchema.safeParse(validState);
    expect(result.success).toBe(true);
  });

  it("should reject empty name", () => {
    const result = WorkflowStateSchema.safeParse({ ...validState, name: "" });
    expect(result.success).toBe(false);
  });

  it("should reject invalid phase in currentPhase", () => {
    const result = WorkflowStateSchema.safeParse({ ...validState, currentPhase: "X" });
    expect(result.success).toBe(false);
  });
});

describe("FamaConfigSchema", () => {
  it("should fill defaults for empty object", () => {
    const result = FamaConfigSchema.parse({});
    expect(result.model).toBe("sonnet");
    expect(result.maxTurns).toBe(50);
    expect(result.lang).toBe("pt-BR");
    expect(result.skillsDir).toBe("./skills");
    expect(result.workflow.defaultScale).toBe(ProjectScale.MEDIUM);
    expect(result.workflow.gates.requirePlan).toBe(true);
    expect(result.workflow.gates.requireApproval).toBe(false);
  });

  it("should accept valid config", () => {
    const result = FamaConfigSchema.safeParse({
      model: "opus",
      maxTurns: 100,
      lang: "en-US",
      skillsDir: "./my-skills",
    });
    expect(result.success).toBe(true);
    expect(result.data!.model).toBe("opus");
  });

  it("should reject negative maxTurns", () => {
    const result = FamaConfigSchema.safeParse({ maxTurns: -1 });
    expect(result.success).toBe(false);
  });
});

describe("AgentFrontmatterSchema", () => {
  it("should accept valid frontmatter", () => {
    const result = AgentFrontmatterSchema.safeParse({
      name: "Architect",
      description: "System architect",
      tools: ["Read", "Grep"],
      phases: ["P", "R"],
      model: "opus",
    });
    expect(result.success).toBe(true);
  });

  it("should accept empty object (all optional)", () => {
    expect(AgentFrontmatterSchema.safeParse({}).success).toBe(true);
  });

  it("should preserve unknown fields via passthrough", () => {
    const result = AgentFrontmatterSchema.parse({ customField: "value" });
    expect((result as Record<string, unknown>)["customField"]).toBe("value");
  });

  it("should reject invalid phase in phases array", () => {
    const result = AgentFrontmatterSchema.safeParse({ phases: ["X"] });
    expect(result.success).toBe(false);
  });
});

describe("SkillFrontmatterSchema", () => {
  it("should accept valid skill frontmatter", () => {
    const result = SkillFrontmatterSchema.safeParse({
      name: "Brainstorming",
      description: "Creative ideation",
      phases: ["P"],
    });
    expect(result.success).toBe(true);
  });

  it("should preserve unknown fields", () => {
    const result = SkillFrontmatterSchema.parse({ extra: true });
    expect((result as Record<string, unknown>)["extra"]).toBe(true);
  });
});

describe("RunAgentOptionsSchema", () => {
  it("should accept minimal options", () => {
    const result = RunAgentOptionsSchema.safeParse({ task: "test" });
    expect(result.success).toBe(true);
  });

  it("should reject empty task", () => {
    const result = RunAgentOptionsSchema.safeParse({ task: "" });
    expect(result.success).toBe(false);
  });

  it("should accept full options", () => {
    const result = RunAgentOptionsSchema.safeParse({
      task: "build feature",
      agent: "architect",
      skills: ["brainstorming"],
      model: "opus",
      maxTurns: 10,
      verbose: true,
      permissionMode: "acceptEdits",
    });
    expect(result.success).toBe(true);
  });
});

describe("PersonaConfigSchema", () => {
  it("should accept a complete persona", () => {
    const result = PersonaConfigSchema.safeParse({
      displayName: "Winston",
      icon: "🏗️",
      role: "System Architect",
      identity: "Senior architect",
      communicationStyle: "Calm",
      principles: ["Simplicity", "Evidence"],
    });
    expect(result.success).toBe(true);
  });

  it("should accept an empty persona (all optional)", () => {
    expect(PersonaConfigSchema.safeParse({}).success).toBe(true);
  });

  it("should accept partial persona", () => {
    const result = PersonaConfigSchema.safeParse({ role: "Tester" });
    expect(result.success).toBe(true);
    expect(result.data!.role).toBe("Tester");
  });
});

describe("MenuEntrySchema", () => {
  it("should accept a valid menu entry", () => {
    const result = MenuEntrySchema.safeParse({
      trigger: "plan",
      command: "fama plan",
      description: "Create a plan",
    });
    expect(result.success).toBe(true);
  });

  it("should reject empty trigger", () => {
    const result = MenuEntrySchema.safeParse({
      trigger: "",
      command: "fama plan",
      description: "Create a plan",
    });
    expect(result.success).toBe(false);
  });

  it("should reject missing command", () => {
    const result = MenuEntrySchema.safeParse({
      trigger: "plan",
      description: "Create a plan",
    });
    expect(result.success).toBe(false);
  });
});

describe("SkillFrontmatterSchema — Agent Skills Specification fields", () => {
  it("should accept license field", () => {
    const result = SkillFrontmatterSchema.safeParse({
      name: "test",
      license: "MIT",
    });
    expect(result.success).toBe(true);
  });

  it("should accept compatibility field", () => {
    const result = SkillFrontmatterSchema.safeParse({
      name: "test",
      compatibility: ">=1.0.0",
    });
    expect(result.success).toBe(true);
  });

  it("should accept metadata object", () => {
    const result = SkillFrontmatterSchema.safeParse({
      name: "test",
      metadata: { author: "team", version: "2.0" },
    });
    expect(result.success).toBe(true);
  });

  it("should accept allowed-tools array", () => {
    const result = SkillFrontmatterSchema.safeParse({
      name: "test",
      "allowed-tools": ["Read", "Write", "Bash"],
    });
    expect(result.success).toBe(true);
  });
});

describe("FamaConfigSchema — edge cases", () => {
  it("should accept maxTurns of 1", () => {
    const result = FamaConfigSchema.safeParse({ maxTurns: 1 });
    expect(result.success).toBe(true);
  });

  it("should reject maxTurns of 0", () => {
    const result = FamaConfigSchema.safeParse({ maxTurns: 0 });
    expect(result.success).toBe(false);
  });

  it("should accept very large maxTurns", () => {
    const result = FamaConfigSchema.safeParse({ maxTurns: 10000 });
    expect(result.success).toBe(true);
  });

  it("should accept custom workflow gates", () => {
    const result = FamaConfigSchema.safeParse({
      workflow: {
        gates: {
          requirePlan: false,
          requireApproval: true,
          gates: [{ type: "require_tests", phases: ["E->V"] }],
        },
      },
    });
    expect(result.success).toBe(true);
  });

  it("should accept teams configuration", () => {
    const result = FamaConfigSchema.safeParse({
      teams: {
        backend: {
          name: "Backend Team",
          description: "Backend specialists",
          agents: ["backend-specialist", "database-specialist"],
          defaultSkills: ["test-driven-development"],
        },
      },
    });
    expect(result.success).toBe(true);
  });

  it("should accept provider configuration", () => {
    const result = FamaConfigSchema.safeParse({
      provider: {
        default: "claude",
        fallback: ["openai"],
        apiKeys: { openai: "key-123" },
      },
    });
    expect(result.success).toBe(true);
  });
});

describe("RunAgentOptionsSchema — edge cases", () => {
  it("should accept dryRun flag", () => {
    const result = RunAgentOptionsSchema.safeParse({ task: "test", dryRun: true });
    expect(result.success).toBe(true);
  });

  it("should accept skillTokenBudget", () => {
    const result = RunAgentOptionsSchema.safeParse({ task: "test", skillTokenBudget: 5000 });
    expect(result.success).toBe(true);
  });

  it("should accept bypassPermissions mode", () => {
    const result = RunAgentOptionsSchema.safeParse({
      task: "test",
      permissionMode: "bypassPermissions",
    });
    expect(result.success).toBe(true);
  });
});

describe("AgentFrontmatterSchema — persona/menu/critical_actions", () => {
  it("should accept frontmatter with persona", () => {
    const result = AgentFrontmatterSchema.safeParse({
      name: "test",
      persona: { displayName: "Test Agent", role: "Tester" },
    });
    expect(result.success).toBe(true);
    expect(result.data!.persona?.displayName).toBe("Test Agent");
  });

  it("should accept frontmatter with critical_actions", () => {
    const result = AgentFrontmatterSchema.safeParse({
      name: "test",
      critical_actions: ["Write tests first", "Verify output"],
    });
    expect(result.success).toBe(true);
    expect(result.data!.critical_actions).toHaveLength(2);
  });

  it("should accept frontmatter with menu", () => {
    const result = AgentFrontmatterSchema.safeParse({
      name: "test",
      menu: [
        { trigger: "plan", command: "fama plan", description: "Create plan" },
      ],
    });
    expect(result.success).toBe(true);
    expect(result.data!.menu).toHaveLength(1);
  });

  it("should reject menu with invalid entry", () => {
    const result = AgentFrontmatterSchema.safeParse({
      menu: [{ trigger: "", command: "x", description: "y" }],
    });
    expect(result.success).toBe(false);
  });

  it("should accept frontmatter without new fields (backward compat)", () => {
    const result = AgentFrontmatterSchema.safeParse({
      name: "old-agent",
      description: "Old agent",
    });
    expect(result.success).toBe(true);
    expect(result.data!.persona).toBeUndefined();
    expect(result.data!.critical_actions).toBeUndefined();
    expect(result.data!.menu).toBeUndefined();
  });
});
