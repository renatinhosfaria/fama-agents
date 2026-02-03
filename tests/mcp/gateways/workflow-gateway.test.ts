import { describe, it, expect, vi } from "vitest";
import { handleWorkflowGateway } from "../../../src/mcp/gateways/workflow-gateway.js";
import type { FamaConfig } from "../../../src/core/types.js";
import { ProjectScale } from "../../../src/core/types.js";

// Mock WorkflowEngine
function mockWorkflowEngine() {
  return {
    init: vi.fn(),
    getSummary: vi.fn().mockReturnValue("Workflow summary: phase P"),
    advance: vi.fn().mockResolvedValue(undefined),
    completeCurrent: vi.fn(),
  } as never;
}

const mockConfig: FamaConfig = {
  model: "sonnet",
  maxTurns: 50,
  lang: "pt-BR",
  skillsDir: "skills",
  workflow: {
    defaultScale: ProjectScale.MEDIUM,
    gates: {
      requirePlan: true,
      requireApproval: false,
    },
  },
};

describe("handleWorkflowGateway", () => {
  describe("init action", () => {
    it("should initialize workflow with name and scale", async () => {
      const engine = mockWorkflowEngine();
      const result = await handleWorkflowGateway(
        { action: "init", name: "my-feature", scale: "small" },
        engine,
        mockConfig,
      );
      expect(result).toContain("Workflow summary");
    });

    it("should use default scale when not provided", async () => {
      const engine = mockWorkflowEngine();
      const result = await handleWorkflowGateway(
        { action: "init", name: "my-feature" },
        engine,
        mockConfig,
      );
      expect(result).toBeTruthy();
    });

    it("should return error when name is missing", async () => {
      const engine = mockWorkflowEngine();
      const result = await handleWorkflowGateway(
        { action: "init" },
        engine,
        mockConfig,
      );
      expect(result).toContain("Error");
      expect(result).toContain("name");
    });
  });

  describe("status action", () => {
    it("should return workflow summary", async () => {
      const engine = mockWorkflowEngine();
      const result = await handleWorkflowGateway({ action: "status" }, engine, mockConfig);
      expect(result).toContain("Workflow summary");
    });
  });

  describe("advance action", () => {
    it("should advance workflow and return summary", async () => {
      const engine = mockWorkflowEngine();
      const result = await handleWorkflowGateway({ action: "advance" }, engine, mockConfig);
      expect(result).toContain("Workflow summary");
    });
  });

  describe("complete action", () => {
    it("should complete current phase and return summary", async () => {
      const engine = mockWorkflowEngine();
      const result = await handleWorkflowGateway({ action: "complete" }, engine, mockConfig);
      expect(result).toContain("Workflow summary");
    });
  });

  describe("unknown action", () => {
    it("should return error for unknown action", async () => {
      const engine = mockWorkflowEngine();
      const result = await handleWorkflowGateway(
        { action: "invalid" as never },
        engine,
        mockConfig,
      );
      expect(result).toContain("Unknown action");
    });
  });
});
