/**
 * Base error class for all fama-agents errors.
 * Provides a structured error with code for programmatic handling.
 */
export class FamaError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    options?: { cause?: Error },
  ) {
    super(message, options);
    this.name = "FamaError";
  }
}

export class ApiKeyMissingError extends FamaError {
  constructor() {
    super(
      "ANTHROPIC_API_KEY environment variable is required.\n" +
        "Set it in your .env file or run: export ANTHROPIC_API_KEY=your_key\n" +
        "Get your key at: https://console.anthropic.com/",
      "API_KEY_MISSING",
    );
    this.name = "ApiKeyMissingError";
  }
}

export class AgentNotFoundError extends FamaError {
  constructor(slug: string) {
    super(
      `Agent "${slug}" not found. Use "fama agents" to list available agents.`,
      "AGENT_NOT_FOUND",
    );
    this.name = "AgentNotFoundError";
  }
}

export class SkillNotFoundError extends FamaError {
  constructor(slug: string) {
    super(
      `Skill "${slug}" not found. Use "fama skills" to list available skills.`,
      "SKILL_NOT_FOUND",
    );
    this.name = "SkillNotFoundError";
  }
}

export class AgentExecutionError extends FamaError {
  constructor(agentSlug: string, cause?: Error) {
    super(
      `Agent "${agentSlug}" execution failed: ${cause?.message ?? "unknown error"}`,
      "AGENT_EXECUTION_ERROR",
      { cause },
    );
    this.name = "AgentExecutionError";
  }
}

export class AgentBuildError extends FamaError {
  constructor(slug: string) {
    super(`Failed to build agent definition for "${slug}".`, "AGENT_BUILD_ERROR");
    this.name = "AgentBuildError";
  }
}

export class WorkflowStateError extends FamaError {
  constructor(message: string) {
    super(message, "WORKFLOW_STATE_ERROR");
    this.name = "WorkflowStateError";
  }
}

export class GateCheckError extends FamaError {
  constructor(reason: string) {
    super(`Gate check failed: ${reason}`, "GATE_CHECK_ERROR");
    this.name = "GateCheckError";
  }
}

export class ProviderError extends FamaError {
  constructor(provider: string, message: string, cause?: Error) {
    super(`Provider "${provider}" error: ${message}`, "PROVIDER_ERROR", { cause });
    this.name = "ProviderError";
  }
}

export class ProviderNotFoundError extends FamaError {
  constructor(provider: string) {
    super(
      `Provider "${provider}" not found. Available: claude, openai, openrouter.`,
      "PROVIDER_NOT_FOUND",
    );
    this.name = "ProviderNotFoundError";
  }
}

export class ConfigParseError extends FamaError {
  constructor(message: string, cause?: Error) {
    super(message, "CONFIG_PARSE_ERROR", { cause });
    this.name = "ConfigParseError";
  }
}
