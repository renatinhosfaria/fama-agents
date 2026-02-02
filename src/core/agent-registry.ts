import { readFileSync, readdirSync, existsSync } from "node:fs";
import { resolve, basename, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { extractFrontmatter, type AgentFrontmatter } from "../utils/frontmatter.js";
import type {
  AgentConfig,
  AgentFactory,
  AgentMemory,
  FamaAgentDefinition,
  WorkflowPhase,
} from "./types.js";
import { agentFactories } from "../agents/index.js";
import { buildAgentPrompt } from "../agents/build-prompt.js";
import { log } from "../utils/logger.js";
import {
  normalizeOptionalModel,
  normalizeOptionalPhases,
  normalizeOptionalString,
  normalizeOptionalStringArray,
} from "../utils/validation.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Gets the built-in agents directory (package root /agents).
 */
function getBuiltInAgentsDir(): string {
  return resolve(__dirname, "..", "..", "agents");
}

/**
 * Gets the project agents directory (<project>/agents).
 */
function getProjectAgentsDir(projectDir: string): string {
  return resolve(projectDir, "agents");
}

function pathsEqual(pathA: string, pathB: string): boolean {
  return resolve(pathA).toLowerCase() === resolve(pathB).toLowerCase();
}

/**
 * Loads agent playbook from a markdown file.
 */
function loadAgentPlaybook(filePath: string): AgentConfig | null {
  try {
    const raw = readFileSync(filePath, "utf-8");
    const { frontmatter, body } = extractFrontmatter<AgentFrontmatter>(raw);
    const slug = basename(filePath, ".md");
    const context = `Agent "${slug}" (${filePath})`;
    const name = normalizeOptionalString(frontmatter.name, "name", context) ?? slug;
    const description =
      normalizeOptionalString(frontmatter.description, "description", context) ?? "";
    const tools = normalizeOptionalStringArray(frontmatter.tools, "tools", context) ?? [
      "Read",
      "Grep",
      "Glob",
    ];
    const phases = normalizeOptionalPhases(frontmatter.phases, context) ?? [];
    const defaultSkills = normalizeOptionalStringArray(frontmatter.skills, "skills", context) ?? [];
    const model = normalizeOptionalModel(frontmatter.model, context) ?? "sonnet";

    return {
      slug,
      name,
      description,
      prompt: body,
      tools,
      model,
      phases,
      defaultSkills,
      filePath,
      persona: frontmatter.persona,
      criticalActions: frontmatter.critical_actions,
      menu: frontmatter.menu,
      hasSidecar: frontmatter.hasSidecar ?? false,
    };
  } catch (err) {
    log.warn(
      `Failed to load agent playbook "${filePath}": ${err instanceof Error ? err.message : String(err)}`,
    );
    return null;
  }
}

/**
 * Registry for all agent definitions.
 * Combines markdown playbooks with TypeScript factories.
 */
export class AgentRegistry {
  private agents: Map<string, AgentConfig> = new Map();
  private factories: Map<string, AgentFactory> = new Map();
  private projectDir: string;

  constructor(projectDir: string) {
    this.projectDir = projectDir;
    this.loadFactories();
    this.refresh();
  }

  private loadFactories(): void {
    for (const factory of agentFactories) {
      this.factories.set(factory.slug, factory);
    }
  }

  /** Re-scan filesystem and rebuild cache. */
  refresh(): void {
    this.agents.clear();

    const mergeFactory = (config: AgentConfig) => {
      const factory = this.factories.get(config.slug);
      if (factory) {
        config.tools = factory.tools;
        config.model = factory.model;
        config.phases = factory.phases;
        config.defaultSkills = factory.defaultSkills;
      }
      this.agents.set(config.slug, config);
    };

    // Load built-in playbooks
    const builtInDir = getBuiltInAgentsDir();
    if (existsSync(builtInDir)) {
      for (const file of readdirSync(builtInDir)) {
        if (!file.endsWith(".md")) continue;
        const config = loadAgentPlaybook(resolve(builtInDir, file));
        if (config) mergeFactory(config);
      }
    }

    // Load project playbooks (shadow built-in)
    const projectAgentsDir = getProjectAgentsDir(this.projectDir);
    if (existsSync(projectAgentsDir) && !pathsEqual(projectAgentsDir, builtInDir)) {
      for (const file of readdirSync(projectAgentsDir)) {
        if (!file.endsWith(".md")) continue;
        const config = loadAgentPlaybook(resolve(projectAgentsDir, file));
        if (config) mergeFactory(config);
      }
    }

    // Register factories that don't have playbooks yet
    for (const [slug, factory] of this.factories) {
      if (!this.agents.has(slug)) {
        this.agents.set(slug, {
          slug,
          name: slug,
          description: factory.description,
          prompt: "",
          tools: factory.tools,
          model: factory.model,
          phases: factory.phases,
          defaultSkills: factory.defaultSkills,
          filePath: "",
        });
      }
    }
  }

  /** Get all agents. */
  getAll(): AgentConfig[] {
    return Array.from(this.agents.values());
  }

  /** Get an agent by slug. */
  getBySlug(slug: string): AgentConfig | null {
    return this.agents.get(slug) ?? null;
  }

  /** Get agents for a specific workflow phase. */
  getForPhase(phase: WorkflowPhase): AgentConfig[] {
    return this.getAll().filter((a) => a.phases.includes(phase));
  }

  /**
   * Builds an AgentDefinition for the Claude SDK.
   * Combines the playbook prompt with injected skill content.
   */
  buildDefinition(
    slug: string,
    skillContents: string[],
    memory?: AgentMemory,
  ): FamaAgentDefinition | null {
    const config = this.getBySlug(slug);
    if (!config) return null;

    const promptOpts = {
      playbookContent: config.prompt,
      skillContents,
      persona: config.persona,
      criticalActions: config.criticalActions,
      memory,
    };

    const factory = this.factories.get(slug);
    if (factory) {
      return factory.build(promptOpts);
    }

    // Fallback: compose prompt manually using buildAgentPrompt
    return {
      description: config.description,
      prompt: buildAgentPrompt(promptOpts),
      tools: config.tools,
      model: config.model === "inherit" ? undefined : config.model,
    };
  }
}
