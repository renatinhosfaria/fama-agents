import { describe, it, expect } from "vitest";
import {
  FamaError,
  ApiKeyMissingError,
  AgentNotFoundError,
  SkillNotFoundError,
  AgentExecutionError,
  AgentBuildError,
  WorkflowStateError,
  GateCheckError,
  ConfigParseError,
} from "../../src/core/errors.js";

describe("FamaError", () => {
  it("should have correct name, code, and message", () => {
    const err = new FamaError("test message", "TEST_CODE");
    expect(err.name).toBe("FamaError");
    expect(err.code).toBe("TEST_CODE");
    expect(err.message).toBe("test message");
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(FamaError);
  });

  it("should preserve cause chain", () => {
    const cause = new Error("root cause");
    const err = new FamaError("wrapped", "WRAP", { cause });
    expect(err.cause).toBe(cause);
  });
});

describe("ApiKeyMissingError", () => {
  it("should have correct name and code", () => {
    const err = new ApiKeyMissingError();
    expect(err.name).toBe("ApiKeyMissingError");
    expect(err.code).toBe("API_KEY_MISSING");
    expect(err.message).toContain("ANTHROPIC_API_KEY");
    expect(err).toBeInstanceOf(FamaError);
  });
});

describe("AgentNotFoundError", () => {
  it("should include agent slug in message", () => {
    const err = new AgentNotFoundError("my-agent");
    expect(err.name).toBe("AgentNotFoundError");
    expect(err.code).toBe("AGENT_NOT_FOUND");
    expect(err.message).toContain("my-agent");
    expect(err).toBeInstanceOf(FamaError);
  });
});

describe("SkillNotFoundError", () => {
  it("should include skill slug in message", () => {
    const err = new SkillNotFoundError("my-skill");
    expect(err.name).toBe("SkillNotFoundError");
    expect(err.code).toBe("SKILL_NOT_FOUND");
    expect(err.message).toContain("my-skill");
    expect(err).toBeInstanceOf(FamaError);
  });
});

describe("AgentExecutionError", () => {
  it("should include agent slug and preserve cause", () => {
    const cause = new Error("SDK failure");
    const err = new AgentExecutionError("architect", cause);
    expect(err.name).toBe("AgentExecutionError");
    expect(err.code).toBe("AGENT_EXECUTION_ERROR");
    expect(err.message).toContain("architect");
    expect(err.message).toContain("SDK failure");
    expect(err.cause).toBe(cause);
    expect(err).toBeInstanceOf(FamaError);
  });

  it("should handle missing cause gracefully", () => {
    const err = new AgentExecutionError("test");
    expect(err.message).toContain("unknown error");
  });
});

describe("AgentBuildError", () => {
  it("should include agent slug in message", () => {
    const err = new AgentBuildError("broken-agent");
    expect(err.name).toBe("AgentBuildError");
    expect(err.code).toBe("AGENT_BUILD_ERROR");
    expect(err.message).toContain("broken-agent");
    expect(err).toBeInstanceOf(FamaError);
  });
});

describe("WorkflowStateError", () => {
  it("should have correct name and code", () => {
    const err = new WorkflowStateError("invalid state");
    expect(err.name).toBe("WorkflowStateError");
    expect(err.code).toBe("WORKFLOW_STATE_ERROR");
    expect(err.message).toBe("invalid state");
    expect(err).toBeInstanceOf(FamaError);
  });
});

describe("GateCheckError", () => {
  it("should include reason in message", () => {
    const err = new GateCheckError("plan not approved");
    expect(err.name).toBe("GateCheckError");
    expect(err.code).toBe("GATE_CHECK_ERROR");
    expect(err.message).toContain("plan not approved");
    expect(err).toBeInstanceOf(FamaError);
  });
});

describe("ConfigParseError", () => {
  it("should preserve cause and have correct code", () => {
    const cause = new Error("YAML syntax");
    const err = new ConfigParseError("Failed to parse config", cause);
    expect(err.name).toBe("ConfigParseError");
    expect(err.code).toBe("CONFIG_PARSE_ERROR");
    expect(err.cause).toBe(cause);
    expect(err).toBeInstanceOf(FamaError);
  });
});
