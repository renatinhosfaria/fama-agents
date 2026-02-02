import { describe, it, expect, beforeEach, afterEach, afterAll } from "vitest";
import { resolve } from "node:path";
import { mkdirSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { AgentRegistry } from "../../src/core/agent-registry.js";

const PROJECT_DIR = resolve(import.meta.dirname, "..", "..");
const BASE_TEST_DIR = resolve(
  import.meta.dirname,
  "..",
  "fixtures",
  "agent-registry-test",
);
let TEST_DIR: string;
let testCounter = 0;

describe("AgentRegistry", () => {
  beforeEach(() => {
    testCounter++;
    TEST_DIR = resolve(BASE_TEST_DIR, `run-${testCounter}-${Date.now()}`);
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true, force: true });
  });

  afterAll(() => {
    if (existsSync(BASE_TEST_DIR)) rmSync(BASE_TEST_DIR, { recursive: true, force: true });
  });

  it("should discover agents from factories", () => {
    const registry = new AgentRegistry(PROJECT_DIR);
    const agents = registry.getAll();
    expect(agents.length).toBeGreaterThan(0);
  });

  it("should find code-reviewer agent", () => {
    const registry = new AgentRegistry(PROJECT_DIR);
    const agent = registry.getBySlug("code-reviewer");
    expect(agent).toBeDefined();
    expect(agent?.tools).toContain("Read");
    expect(agent?.phases).toContain("R");
  });

  it("should build agent definition", () => {
    const registry = new AgentRegistry(PROJECT_DIR);
    const def = registry.buildDefinition("code-reviewer", ["test skill content"]);
    expect(def).toBeDefined();
    expect(def?.description).toBeTruthy();
    expect(def?.prompt).toBeTruthy();
    expect(def?.tools).toContain("Read");
  });

  it("should get agents for a specific phase", () => {
    const registry = new AgentRegistry(PROJECT_DIR);
    const reviewAgents = registry.getForPhase("R");
    expect(reviewAgents.length).toBeGreaterThan(0);
    expect(reviewAgents.some((a) => a.slug === "code-reviewer")).toBe(true);
  });

  it("should load project agents and allow overrides", () => {
    const agentsDir = resolve(TEST_DIR, "agents");
    mkdirSync(agentsDir, { recursive: true });
    writeFileSync(
      resolve(agentsDir, "code-reviewer.md"),
      `---
name: code-reviewer
description: Project override
phases: [R]
skills: [code-review]
---

# Project Playbook
`,
      "utf-8",
    );

    const registry = new AgentRegistry(TEST_DIR);
    const agent = registry.getBySlug("code-reviewer");
    expect(agent?.description).toBe("Project override");
    expect(agent?.prompt).toContain("Project Playbook");
  });

  it("should extract persona from playbook frontmatter", () => {
    const agentsDir = resolve(TEST_DIR, "agents");
    mkdirSync(agentsDir, { recursive: true });
    writeFileSync(
      resolve(agentsDir, "persona-agent.md"),
      `---
name: persona-agent
description: Agent with persona
persona:
  displayName: Winston
  role: System Architect
  principles:
    - Simplicity first
---

# Persona Agent Playbook
`,
      "utf-8",
    );

    const registry = new AgentRegistry(TEST_DIR);
    const agent = registry.getBySlug("persona-agent");
    expect(agent?.persona).toBeDefined();
    expect(agent?.persona?.displayName).toBe("Winston");
    expect(agent?.persona?.role).toBe("System Architect");
    expect(agent?.persona?.principles).toContain("Simplicity first");
  });

  it("should extract critical_actions from playbook frontmatter", () => {
    const agentsDir = resolve(TEST_DIR, "agents");
    mkdirSync(agentsDir, { recursive: true });
    writeFileSync(
      resolve(agentsDir, "critical-agent.md"),
      `---
name: critical-agent
description: Agent with critical actions
critical_actions:
  - Write tests first
  - Never skip verification
---

# Critical Agent Playbook
`,
      "utf-8",
    );

    const registry = new AgentRegistry(TEST_DIR);
    const agent = registry.getBySlug("critical-agent");
    expect(agent?.criticalActions).toBeDefined();
    expect(agent?.criticalActions).toHaveLength(2);
    expect(agent?.criticalActions).toContain("Write tests first");
  });

  it("should extract menu from playbook frontmatter", () => {
    const agentsDir = resolve(TEST_DIR, "agents");
    mkdirSync(agentsDir, { recursive: true });
    writeFileSync(
      resolve(agentsDir, "menu-agent.md"),
      `---
name: menu-agent
description: Agent with menu
menu:
  - trigger: plan
    command: fama plan
    description: Create a plan
  - trigger: review
    command: fama review
    description: Review code
---

# Menu Agent Playbook
`,
      "utf-8",
    );

    const registry = new AgentRegistry(TEST_DIR);
    const agent = registry.getBySlug("menu-agent");
    expect(agent?.menu).toBeDefined();
    expect(agent?.menu).toHaveLength(2);
    expect(agent?.menu?.[0]?.trigger).toBe("plan");
    expect(agent?.menu?.[1]?.command).toBe("fama review");
  });

  it("should inject persona into built definition prompt", () => {
    const agentsDir = resolve(TEST_DIR, "agents");
    mkdirSync(agentsDir, { recursive: true });
    writeFileSync(
      resolve(agentsDir, "injected-agent.md"),
      `---
name: injected-agent
description: Agent with persona injection
persona:
  displayName: TestBot
  role: Test Agent
critical_actions:
  - Always verify
---

# Injected Agent Content
`,
      "utf-8",
    );

    const registry = new AgentRegistry(TEST_DIR);
    const def = registry.buildDefinition("injected-agent", []);
    expect(def).toBeDefined();
    expect(def?.prompt).toContain("## Persona");
    expect(def?.prompt).toContain("TestBot");
    expect(def?.prompt).toContain("CRITICAL ACTIONS");
    expect(def?.prompt).toContain("Always verify");
    expect(def?.prompt).toContain("# Injected Agent Content");
  });

  it("should preserve persona/criticalActions/menu when merging with factory", () => {
    const registry = new AgentRegistry(PROJECT_DIR);
    const architect = registry.getBySlug("architect");
    expect(architect?.persona).toBeDefined();
    expect(architect?.persona?.displayName).toBe("Winston");
  });
});
