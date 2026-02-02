import { readFileSync, readdirSync, existsSync } from "node:fs";
import { resolve, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { extractFrontmatter, type AgentFrontmatter } from "../utils/frontmatter.js";
import type { AgentConfig, AgentFactory, WorkflowPhase } from "./types.js";
import type { AgentDefinition } from "@anthropic-ai/claude-agent-sdk";
import { agentFactories } from "../agents/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Gets the built-in agents directory (package root /agents).
 */
function getBuiltInAgentsDir(): string {
  return resolve(__dirname, "..", "..", "agents");
}

/**
 * Loads agent playbook from a markdown file.
 */
function loadAgentPlaybook(filePath: string): AgentConfig | null {
  try {
    const raw = readFileSync(filePath, "utf-8");
    const { frontmatter, body } = extractFrontmatter<AgentFrontmatter>(raw);
    const slug = basename(filePath, ".md");

    return {
      slug,
      name: (frontmatter.name as string) || slug,
      description: (frontmatter.description as string) || "",
      prompt: body,
      tools: (frontmatter.tools as string[]) || ["Read", "Grep", "Glob"],
      model: ((frontmatter.model as string) || "sonnet") as AgentConfig["model"],
      phases: (frontmatter.phases as WorkflowPhase[]) || [],
      defaultSkills: (frontmatter.skills as string[]) || [],
      filePath,
    };
  } catch {
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

    // Load built-in playbooks
    const builtInDir = getBuiltInAgentsDir();
    if (existsSync(builtInDir)) {
      for (const file of readdirSync(builtInDir)) {
        if (!file.endsWith(".md")) continue;
        const config = loadAgentPlaybook(resolve(builtInDir, file));
        if (config) {
          // Merge with factory if exists
          const factory = this.factories.get(config.slug);
          if (factory) {
            config.tools = factory.tools;
            config.model = factory.model;
            config.phases = factory.phases;
            config.defaultSkills = factory.defaultSkills;
          }
          this.agents.set(config.slug, config);
        }
      }
    }

    // Register factories that don't have playbooks yet
    for (const [slug, factory] of this.factories) {
      if (!this.agents.has(slug)) {
        this.agents.set(slug, {
          slug,
          name: slug,
          description: factory.slug,
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
  ): AgentDefinition | null {
    const config = this.getBySlug(slug);
    if (!config) return null;

    const factory = this.factories.get(slug);
    if (factory) {
      return factory.build(config.prompt, skillContents);
    }

    // Fallback: compose prompt manually
    const parts = [config.prompt];
    for (const skill of skillContents) {
      parts.push(`\n---\n## Active Skill\n${skill}`);
    }

    return {
      description: config.description,
      prompt: parts.join("\n"),
      tools: config.tools,
      model: config.model === "inherit" ? undefined : config.model,
    };
  }
}
