/**
 * Type-safe translation keys for the i18n system.
 * All keys must be defined here and implemented in every locale file.
 */
export interface TranslationKeys {
  // CLI - General
  "cli.heading": string;
  "cli.version": string;
  "cli.done": string;
  "cli.cancelled": string;
  "cli.noResults": string;

  // CLI - Init
  "cli.init.success": string;
  "cli.init.alreadyExists": string;
  "cli.init.createdConfig": string;
  "cli.init.createdDir": string;

  // CLI - Run
  "cli.run.heading": string;
  "cli.run.agent": string;
  "cli.run.model": string;
  "cli.run.provider": string;
  "cli.run.scale": string;
  "cli.run.task": string;
  "cli.run.dryRun": string;
  "cli.run.starting": string;
  "cli.run.complete": string;
  "cli.run.turns": string;
  "cli.run.cost": string;
  "cli.run.duration": string;

  // CLI - Quick
  "cli.quick.heading": string;
  "cli.quick.running": string;

  // CLI - Plan
  "cli.plan.heading": string;
  "cli.plan.generating": string;
  "cli.plan.executing": string;
  "cli.plan.saved": string;

  // CLI - Review
  "cli.review.heading": string;
  "cli.review.running": string;
  "cli.review.noFindings": string;
  "cli.review.findings": string;

  // CLI - Debug
  "cli.debug.heading": string;
  "cli.debug.starting": string;

  // CLI - Stack
  "cli.stack.heading": string;
  "cli.stack.detecting": string;
  "cli.stack.noStack": string;

  // CLI - Export
  "cli.export.heading": string;
  "cli.export.generating": string;
  "cli.export.written": string;
  "cli.export.complete": string;

  // CLI - Workflow
  "cli.workflow.heading": string;
  "cli.workflow.initialized": string;
  "cli.workflow.advanced": string;
  "cli.workflow.completed": string;
  "cli.workflow.currentPhase": string;
  "cli.workflow.noActive": string;

  // CLI - Agents
  "cli.agents.heading": string;
  "cli.agents.list": string;
  "cli.agents.notFound": string;
  "cli.agents.available": string;

  // CLI - Skills
  "cli.skills.heading": string;
  "cli.skills.list": string;
  "cli.skills.notFound": string;

  // CLI - Teams
  "cli.teams.heading": string;
  "cli.teams.list": string;
  "cli.teams.notFound": string;

  // CLI - Party
  "cli.party.heading": string;
  "cli.party.round": string;
  "cli.party.synthesis": string;

  // CLI - Module
  "cli.module.heading": string;
  "cli.module.installed": string;
  "cli.module.uninstalled": string;
  "cli.module.list": string;

  // Errors
  "error.apiKeyMissing": string;
  "error.agentNotFound": string;
  "error.skillNotFound": string;
  "error.agentExecution": string;
  "error.agentBuild": string;
  "error.workflowState": string;
  "error.gateCheck": string;
  "error.configParse": string;
  "error.providerError": string;
  "error.providerNotFound": string;
  "error.unknown": string;

  // Workflow phases
  "workflow.phase.planning": string;
  "workflow.phase.review": string;
  "workflow.phase.execution": string;
  "workflow.phase.validation": string;
  "workflow.phase.completion": string;

  // Scale
  "scale.quick": string;
  "scale.small": string;
  "scale.medium": string;
  "scale.large": string;

  // Provider
  "provider.usingDefault": string;
  "provider.fallback": string;
  "provider.noSubagents": string;
  "provider.noMcp": string;

  // Stack detection
  "stack.languages": string;
  "stack.frameworks": string;
  "stack.buildTools": string;
  "stack.testFrameworks": string;
  "stack.packageManagers": string;
  "stack.databases": string;
  "stack.ciTools": string;
  "stack.monorepo": string;
  "stack.detected": string;

  // General labels
  "label.yes": string;
  "label.no": string;
  "label.none": string;
  "label.unknown": string;
  "label.success": string;
  "label.failure": string;
  "label.warning": string;
  "label.info": string;
}

export type TranslationKey = keyof TranslationKeys;

export type TranslationParams = Record<string, string | number>;

export type Locale = "en" | "pt-BR";

export type TranslateFn = (key: TranslationKey, params?: TranslationParams) => string;
