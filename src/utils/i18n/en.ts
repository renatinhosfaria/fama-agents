import type { TranslationKeys } from "./types.js";

export const en: TranslationKeys = {
  // CLI - General
  "cli.heading": "fama-agents",
  "cli.version": "Version {version}",
  "cli.done": "Done.",
  "cli.cancelled": "Cancelled.",
  "cli.noResults": "No results found.",

  // CLI - Init
  "cli.init.success": "Project initialized successfully.",
  "cli.init.alreadyExists": "Config already exists. Use --force to overwrite.",
  "cli.init.createdConfig": "Created {path}",
  "cli.init.createdDir": "Created directory {path}",

  // CLI - Run
  "cli.run.heading": "Running Agent",
  "cli.run.agent": "Agent: {agent}",
  "cli.run.model": "Model: {model}",
  "cli.run.provider": "Provider: {provider}",
  "cli.run.scale": "Scale: {scale}",
  "cli.run.task": "Task: {task}",
  "cli.run.dryRun": "[DRY RUN] Would execute with the above configuration.",
  "cli.run.starting": "Starting agent execution...",
  "cli.run.complete": "Agent execution complete.",
  "cli.run.turns": "Turns: {turns}",
  "cli.run.cost": "Cost: ${cost}",
  "cli.run.duration": "Duration: {duration}s",

  // CLI - Quick
  "cli.quick.heading": "Quick Task",
  "cli.quick.running": "Running quick task...",

  // CLI - Plan
  "cli.plan.heading": "Implementation Plan",
  "cli.plan.generating": "Generating plan...",
  "cli.plan.executing": "Executing plan...",
  "cli.plan.saved": "Plan saved to {path}",

  // CLI - Review
  "cli.review.heading": "Code Review",
  "cli.review.running": "Running code review...",
  "cli.review.noFindings": "No issues found.",
  "cli.review.findings": "{count} issue(s) found.",

  // CLI - Debug
  "cli.debug.heading": "Debug Session",
  "cli.debug.starting": "Starting debug session...",

  // CLI - Stack
  "cli.stack.heading": "Stack Detection",
  "cli.stack.detecting": "Detecting project stack...",
  "cli.stack.noStack": "No technology stack detected.",

  // CLI - Export
  "cli.export.heading": "Export",
  "cli.export.generating": "Generating {preset} export...",
  "cli.export.written": "Written: {path}",
  "cli.export.complete": "Export complete. {count} file(s) written.",

  // CLI - Workflow
  "cli.workflow.heading": "Workflow",
  "cli.workflow.initialized": "Workflow '{name}' initialized with scale {scale}.",
  "cli.workflow.advanced": "Advanced to phase: {phase}",
  "cli.workflow.completed": "Phase '{phase}' marked as completed.",
  "cli.workflow.currentPhase": "Current phase: {phase}",
  "cli.workflow.noActive": "No active workflow. Run `fama workflow init` first.",

  // CLI - Agents
  "cli.agents.heading": "Agents",
  "cli.agents.list": "Available agents:",
  "cli.agents.notFound": "Agent '{slug}' not found.",
  "cli.agents.available": "{count} agent(s) available.",

  // CLI - Skills
  "cli.skills.heading": "Skills",
  "cli.skills.list": "Available skills:",
  "cli.skills.notFound": "Skill '{slug}' not found.",

  // CLI - Teams
  "cli.teams.heading": "Teams",
  "cli.teams.list": "Configured teams:",
  "cli.teams.notFound": "Team '{name}' not found.",

  // CLI - Party
  "cli.party.heading": "Multi-Agent Discussion",
  "cli.party.round": "Round {n}/{total}",
  "cli.party.synthesis": "Synthesizing discussion...",

  // CLI - Module
  "cli.module.heading": "Modules",
  "cli.module.installed": "Module '{name}' installed.",
  "cli.module.uninstalled": "Module '{name}' uninstalled.",
  "cli.module.list": "Installed modules:",

  // Errors
  "error.apiKeyMissing": "API key for {provider} is not configured. Set {envVar} environment variable.",
  "error.agentNotFound": "Agent '{slug}' not found. Run `fama agents list` to see available agents.",
  "error.skillNotFound": "Skill '{slug}' not found. Run `fama skills list` to see available skills.",
  "error.agentExecution": "Agent execution failed: {message}",
  "error.agentBuild": "Failed to build agent '{slug}': {message}",
  "error.workflowState": "Workflow state error: {message}",
  "error.gateCheck": "Gate check failed: {gate} — {message}",
  "error.configParse": "Failed to parse configuration: {message}",
  "error.providerError": "Provider '{provider}' error: {message}",
  "error.providerNotFound": "Provider '{provider}' not found. Available: claude, openai, openrouter.",
  "error.unknown": "An unexpected error occurred: {message}",

  // Workflow phases
  "workflow.phase.planning": "Planning",
  "workflow.phase.review": "Review",
  "workflow.phase.execution": "Execution",
  "workflow.phase.validation": "Validation",
  "workflow.phase.completion": "Completion",

  // Scale
  "scale.quick": "Quick",
  "scale.small": "Small",
  "scale.medium": "Medium",
  "scale.large": "Large",

  // Provider
  "provider.usingDefault": "Using default provider: {provider}",
  "provider.fallback": "Provider '{provider}' failed, falling back to '{fallback}'.",
  "provider.noSubagents": "Provider '{provider}' does not support subagents. Subagents will be ignored.",
  "provider.noMcp": "Provider '{provider}' does not support MCP. MCP tools will be unavailable.",

  // Stack detection
  "stack.languages": "Languages",
  "stack.frameworks": "Frameworks",
  "stack.buildTools": "Build Tools",
  "stack.testFrameworks": "Test Frameworks",
  "stack.packageManagers": "Package Managers",
  "stack.databases": "Databases",
  "stack.ciTools": "CI/CD",
  "stack.monorepo": "Monorepo",
  "stack.detected": "Detected Stack",

  // General labels
  "label.yes": "Yes",
  "label.no": "No",
  "label.none": "None",
  "label.unknown": "Unknown",
  "label.success": "Success",
  "label.failure": "Failure",
  "label.warning": "Warning",
  "label.info": "Info",
};
