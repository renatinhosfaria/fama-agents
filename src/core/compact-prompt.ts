/**
 * Compact Prompt Format (CPF) for LLM-first prompts.
 *
 * Reduces token usage by 40-60% compared to verbose markdown playbooks
 * while maintaining all necessary information for agent execution.
 */

// ─── Types ───

export interface CompactPromptSection {
  /** Role description (e.g., "Software Architect") */
  role: string;
  /** Single-line objective */
  objective: string;
  /** Numbered constraints */
  constraints: string[];
  /** Ordered process steps */
  process: string[];
  /** Output schema reference or description */
  outputSchema: string;
  /** Optional few-shot examples (keep minimal) */
  examples?: string[];
}

export interface CompactSkillSection {
  /** Skill name */
  name: string;
  /** One-line intent */
  intent: string;
  /** Max 5 checklist items */
  checklist: string[];
  /** Max 3 red flags to watch for */
  redFlags: string[];
  /** Output hint (format/structure) */
  outputHint: string;
}

export interface CompactContextSection {
  /** Project stack summary */
  stack?: string;
  /** Codebase structure summary */
  codebase?: string;
  /** Previous phase outputs (key: summary pairs) */
  previousPhases?: Record<string, string>;
  /** Active constraints */
  constraints?: string[];
}

export interface CompactPromptOptions {
  /** Main agent section */
  agent: CompactPromptSection;
  /** Active skills (compiled form) */
  skills?: CompactSkillSection[];
  /** Context from previous phases/environment */
  context?: CompactContextSection;
  /** Critical actions (must-do items) */
  criticalActions?: string[];
  /** Memory entries (key: value pairs) */
  memory?: Record<string, string>;
}

// ─── Builders ───

/**
 * Builds the agent role section.
 */
function buildRoleSection(agent: CompactPromptSection): string {
  const lines: string[] = [];

  lines.push(`[ROLE: ${agent.role}]`);
  lines.push(`OBJ: ${agent.objective}`);

  if (agent.constraints.length > 0) {
    lines.push("CONSTRAINTS:");
    agent.constraints.forEach((c, i) => {
      lines.push(`  C${i + 1}: ${c}`);
    });
  }

  if (agent.process.length > 0) {
    lines.push("PROCESS:");
    agent.process.forEach((s, i) => {
      lines.push(`  ${i + 1}. ${s}`);
    });
  }

  lines.push(`OUT: ${agent.outputSchema}`);

  if (agent.examples && agent.examples.length > 0) {
    lines.push("EXAMPLES:");
    agent.examples.forEach((e) => {
      lines.push(`  - ${e}`);
    });
  }

  return lines.join("\n");
}

/**
 * Builds a compiled skill section.
 */
function buildSkillSection(skill: CompactSkillSection): string {
  const lines: string[] = [];

  lines.push(`[SKILL: ${skill.name}]`);
  lines.push(`INTENT: ${skill.intent}`);

  if (skill.checklist.length > 0) {
    lines.push("CHECK:");
    skill.checklist.forEach((c) => {
      lines.push(`  □ ${c}`);
    });
  }

  if (skill.redFlags.length > 0) {
    lines.push("FLAGS:");
    skill.redFlags.forEach((f) => {
      lines.push(`  ⚠ ${f}`);
    });
  }

  lines.push(`OUT: ${skill.outputHint}`);

  return lines.join("\n");
}

/**
 * Builds the context section.
 */
function buildContextSection(context: CompactContextSection): string {
  const lines: string[] = [];

  lines.push("[CONTEXT]");

  if (context.stack) {
    lines.push(`STACK: ${context.stack}`);
  }

  if (context.codebase) {
    lines.push(`CODEBASE: ${context.codebase}`);
  }

  if (context.previousPhases && Object.keys(context.previousPhases).length > 0) {
    lines.push("PREV:");
    for (const [phase, summary] of Object.entries(context.previousPhases)) {
      lines.push(`  ${phase}: ${summary}`);
    }
  }

  if (context.constraints && context.constraints.length > 0) {
    lines.push("ACTIVE_CONSTRAINTS:");
    context.constraints.forEach((c) => {
      lines.push(`  - ${c}`);
    });
  }

  return lines.join("\n");
}

/**
 * Builds the critical actions section.
 */
function buildCriticalActionsSection(actions: string[]): string {
  const lines: string[] = [];

  lines.push("[CRITICAL]");
  actions.forEach((a, i) => {
    lines.push(`  !${i + 1}: ${a}`);
  });

  return lines.join("\n");
}

/**
 * Builds the memory section.
 */
function buildMemorySection(memory: Record<string, string>): string {
  const lines: string[] = [];

  lines.push("[MEMORY]");
  for (const [key, value] of Object.entries(memory)) {
    lines.push(`  ${key}: ${value}`);
  }

  return lines.join("\n");
}

// ─── Main Builder ───

/**
 * Builds a complete compact prompt from options.
 *
 * Format overview:
 * ```
 * [ROLE: Software Architect]
 * OBJ: Design system architecture
 * CONSTRAINTS:
 *   C1: Use existing patterns
 *   C2: Minimize dependencies
 * PROCESS:
 *   1. Analyze requirements
 *   2. Map codebase
 *   3. Design components
 * OUT: ArchitectOutputSchema
 *
 * ---
 *
 * [SKILL: brainstorming]
 * INTENT: Explore design space before implementation
 * CHECK:
 *   □ Ask clarifying questions
 *   □ Present 2-3 approaches
 *   □ Document trade-offs
 * FLAGS:
 *   ⚠ Jumping to implementation
 *   ⚠ Single solution bias
 * OUT: Design document in docs/plans/
 *
 * ---
 *
 * [CONTEXT]
 * STACK: TypeScript, NestJS, PostgreSQL
 * PREV:
 *   P: Designed 3-layer architecture
 *
 * ---
 *
 * [CRITICAL]
 *   !1: Never commit secrets
 *   !2: Run tests before merge
 * ```
 *
 * @param options - Prompt construction options
 * @returns Compact prompt string
 */
export function buildCompactPrompt(options: CompactPromptOptions): string {
  const sections: string[] = [];

  // 1. Agent role (required)
  sections.push(buildRoleSection(options.agent));

  // 2. Critical actions (if any)
  if (options.criticalActions && options.criticalActions.length > 0) {
    sections.push(buildCriticalActionsSection(options.criticalActions));
  }

  // 3. Memory (if any)
  if (options.memory && Object.keys(options.memory).length > 0) {
    sections.push(buildMemorySection(options.memory));
  }

  // 4. Context (if any)
  if (options.context) {
    const hasContent =
      options.context.stack ||
      options.context.codebase ||
      (options.context.previousPhases &&
        Object.keys(options.context.previousPhases).length > 0) ||
      (options.context.constraints && options.context.constraints.length > 0);

    if (hasContent) {
      sections.push(buildContextSection(options.context));
    }
  }

  // 5. Skills (if any)
  if (options.skills && options.skills.length > 0) {
    for (const skill of options.skills) {
      sections.push(buildSkillSection(skill));
    }
  }

  return sections.join("\n\n---\n\n");
}

// ─── Conversion Utilities ───

/**
 * Converts a markdown playbook to compact format.
 * Extracts key sections and compresses them.
 *
 * @param markdown - Full markdown playbook content
 * @param agentName - Name of the agent
 * @returns Compact prompt section
 */
export function convertMarkdownToCompact(
  markdown: string,
  agentName: string,
): CompactPromptSection {
  // Extract role from first heading or use agent name
  const roleMatch = markdown.match(/^#\s+(.+)$/m);
  const role = roleMatch ? roleMatch[1].trim() : agentName;

  // Extract objective from description or first paragraph
  const descMatch = markdown.match(/description:\s*["']?([^"'\n]+)/i);
  const objective = descMatch
    ? descMatch[1].trim()
    : extractFirstParagraph(markdown);

  // Extract constraints from lists or bullet points mentioning "must", "never", "always"
  const constraints = extractConstraints(markdown);

  // Extract process steps from numbered lists or "## Process" section
  const process = extractProcess(markdown);

  // Use default output schema reference
  const outputSchema = "StructuredAgentOutput (see schema)";

  return {
    role,
    objective,
    constraints,
    process,
    outputSchema,
  };
}

/**
 * Converts a skill markdown to compiled form.
 */
export function convertSkillToCompiled(
  markdown: string,
  skillName: string,
): CompactSkillSection {
  // Extract intent from description or first line
  const descMatch = markdown.match(/description:\s*["']?([^"'\n]+)/i);
  const intent = descMatch
    ? descMatch[1].trim()
    : extractFirstLine(markdown);

  // Extract checklist items (look for checkboxes or numbered steps)
  const checklist = extractChecklist(markdown).slice(0, 5);

  // Extract red flags (look for warnings, "don't", "avoid", "never")
  const redFlags = extractRedFlags(markdown).slice(0, 3);

  // Extract output hint
  const outputHint = extractOutputHint(markdown);

  return {
    name: skillName,
    intent,
    checklist,
    redFlags,
    outputHint,
  };
}

// ─── Helper Functions ───

function extractFirstParagraph(text: string): string {
  const lines = text.split("\n").filter((l) => l.trim() && !l.startsWith("#"));
  return lines[0]?.trim().slice(0, 100) ?? "Execute the assigned task";
}

function extractFirstLine(text: string): string {
  const lines = text.split("\n").filter((l) => l.trim() && !l.startsWith("#"));
  return lines[0]?.trim().slice(0, 80) ?? "Apply this skill";
}

function extractConstraints(markdown: string): string[] {
  const constraints: string[] = [];
  const constraintPatterns = [
    /must\s+(.{10,80})/gi,
    /never\s+(.{10,80})/gi,
    /always\s+(.{10,80})/gi,
    /avoid\s+(.{10,80})/gi,
  ];

  for (const pattern of constraintPatterns) {
    const matches = markdown.matchAll(pattern);
    for (const match of matches) {
      const constraint = match[1].trim().replace(/[.!]$/, "");
      if (constraint.length > 10 && constraints.length < 5) {
        constraints.push(constraint);
      }
    }
  }

  return constraints;
}

function extractProcess(markdown: string): string[] {
  const process: string[] = [];

  // Look for numbered list items
  const numberedPattern = /^\s*(\d+)[.)]\s+(.{5,100})/gm;
  const matches = markdown.matchAll(numberedPattern);

  for (const match of matches) {
    if (process.length < 8) {
      process.push(match[2].trim());
    }
  }

  return process;
}

function extractChecklist(markdown: string): string[] {
  const items: string[] = [];

  // Look for checkbox items or bullet points
  const checkboxPattern = /^[\s-]*\[[ x]\]\s+(.{5,80})/gim;
  const bulletPattern = /^[\s]*[-*]\s+(.{5,80})/gm;

  for (const pattern of [checkboxPattern, bulletPattern]) {
    const matches = markdown.matchAll(pattern);
    for (const match of matches) {
      if (items.length < 5) {
        items.push(match[1].trim());
      }
    }
  }

  return items;
}

function extractRedFlags(markdown: string): string[] {
  const flags: string[] = [];
  const warningPatterns = [
    /don't\s+(.{10,60})/gi,
    /avoid\s+(.{10,60})/gi,
    /⚠️?\s*(.{10,60})/g,
    /warning:?\s*(.{10,60})/gi,
  ];

  for (const pattern of warningPatterns) {
    const matches = markdown.matchAll(pattern);
    for (const match of matches) {
      if (flags.length < 3) {
        flags.push(match[1].trim());
      }
    }
  }

  return flags;
}

function extractOutputHint(markdown: string): string {
  // Look for output section
  const outputMatch = markdown.match(/output:?\s*(.{10,100})/i);
  if (outputMatch) {
    return outputMatch[1].trim();
  }

  // Look for "produces" or "generates"
  const producesMatch = markdown.match(/(?:produces?|generates?)\s+(.{10,60})/i);
  if (producesMatch) {
    return producesMatch[1].trim();
  }

  return "Structured output per schema";
}

// ─── Token Estimation ───

/**
 * Estimates tokens saved by using compact format vs markdown.
 */
export function estimateTokenSavings(
  markdownTokens: number,
  compactTokens: number,
): { saved: number; percentage: number } {
  const saved = markdownTokens - compactTokens;
  const percentage = markdownTokens > 0 ? (saved / markdownTokens) * 100 : 0;
  return { saved, percentage: Math.round(percentage) };
}
