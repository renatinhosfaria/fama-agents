import { describe, it, expect } from "vitest";
import { resolve } from "node:path";
import { handleExploreGateway } from "../../../src/mcp/gateways/explore-gateway.js";
import type { FamaConfig } from "../../../src/core/types.js";
import { ProjectScale } from "../../../src/core/types.js";

const PROJECT_DIR = resolve(import.meta.dirname, "..", "..", "..");

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

describe("handleExploreGateway", () => {
  describe("stack action", () => {
    it("should return detected stack summary", () => {
      const result = handleExploreGateway({ action: "stack" }, PROJECT_DIR, mockConfig);
      expect(result).toContain("## Detected Stack");
    });
  });

  describe("config action", () => {
    it("should return formatted config", () => {
      const result = handleExploreGateway({ action: "config" }, PROJECT_DIR, mockConfig);
      expect(result).toContain("## Current Configuration");
      expect(result).toContain("**Model:** sonnet");
      expect(result).toContain("**Max Turns:** 50");
      expect(result).toContain("**Language:** pt-BR");
      expect(result).toContain("**Workflow Scale:**");
      expect(result).toContain("**Require Plan:** true");
      expect(result).toContain("**Require Approval:** false");
    });
  });

  describe("health action", () => {
    it("should return health check with OK status", () => {
      const result = handleExploreGateway({ action: "health" }, PROJECT_DIR, mockConfig);
      expect(result).toContain("## Health Check");
      expect(result).toContain("**Status:** OK");
      expect(result).toContain("**Config Loaded:** true");
      expect(result).toContain("**Timestamp:**");
    });
  });

  describe("unknown action", () => {
    it("should return error for unknown action", () => {
      const result = handleExploreGateway({ action: "invalid" as never }, PROJECT_DIR, mockConfig);
      expect(result).toContain("Unknown action");
    });
  });
});
