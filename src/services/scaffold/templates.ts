import type { ScaffoldTemplate } from "./types.js";

function makeTemplate(
  filename: string,
  title: string,
  description: string,
  headings: string[],
): ScaffoldTemplate {
  const content = [
    "---",
    `title: "${title}"`,
    `description: "${description}"`,
    `status: unfilled`,
    `generated: "${new Date().toISOString()}"`,
    "---",
    "",
    `# ${title}`,
    "",
    `> ${description}`,
    "",
    ...headings.flatMap((h) => [`## ${h}`, "", "<!-- TODO: Fill this section -->", ""]),
  ].join("\n");

  return { filename, title, description, content };
}

/**
 * Returns all 11 scaffold templates.
 */
export function getTemplates(): ScaffoldTemplate[] {
  return [
    makeTemplate("overview.md", "Project Overview", "High-level vision and goals of the project", [
      "Vision",
      "Goals",
      "Key Features",
      "Target Users",
    ]),

    makeTemplate(
      "architecture.md",
      "Architecture Decisions",
      "Architectural decisions and trade-offs",
      ["Overview", "Key Decisions", "Trade-offs", "Diagrams"],
    ),

    makeTemplate("stack.md", "Tech Stack", "Technologies used and why they were chosen", [
      "Languages",
      "Frameworks",
      "Infrastructure",
      "Rationale",
    ]),

    makeTemplate("testing.md", "Testing Strategy", "Testing approach, tools, and conventions", [
      "Test Types",
      "Tools",
      "Conventions",
      "Coverage Goals",
    ]),

    makeTemplate(
      "workflow.md",
      "Development Workflow",
      "How the team works — branching, PRs, reviews",
      ["Branching Strategy", "PR Process", "Code Review", "CI/CD"],
    ),

    makeTemplate("deployment.md", "Deployment Guide", "How to deploy the project", [
      "Environments",
      "Deployment Steps",
      "Rollback",
      "Monitoring",
    ]),

    makeTemplate(
      "security.md",
      "Security Considerations",
      "Security practices and threat model",
      ["Authentication", "Authorization", "Data Protection", "Known Risks"],
    ),

    makeTemplate("api.md", "API Documentation", "Public API endpoints and contracts", [
      "Endpoints",
      "Authentication",
      "Error Handling",
      "Examples",
    ]),

    makeTemplate(
      "conventions.md",
      "Code Conventions",
      "Coding standards and naming conventions",
      ["Naming", "File Structure", "Patterns", "Linting"],
    ),

    makeTemplate(
      "onboarding.md",
      "Developer Onboarding",
      "Getting started guide for new developers",
      ["Prerequisites", "Setup", "First Task", "Resources"],
    ),

    makeTemplate("glossary.md", "Domain Glossary", "Key terms and domain concepts", [
      "Terms",
      "Abbreviations",
      "Domain Concepts",
    ]),
  ];
}

/**
 * Returns template filenames only.
 */
export function getTemplateNames(): string[] {
  return getTemplates().map((t) => t.filename);
}
