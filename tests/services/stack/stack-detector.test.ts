import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { StackDetector } from "../../../src/services/stack/stack-detector.js";

let tempDir: string;

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), "fama-stack-test-"));
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

describe("StackDetector", () => {
  describe("detect — languages", () => {
    it("should detect TypeScript via tsconfig.json", () => {
      writeFileSync(join(tempDir, "tsconfig.json"), "{}");
      const stack = new StackDetector(tempDir).detect();
      expect(stack.languages).toContain("typescript");
    });

    it("should detect Python via pyproject.toml", () => {
      writeFileSync(join(tempDir, "pyproject.toml"), "");
      const stack = new StackDetector(tempDir).detect();
      expect(stack.languages).toContain("python");
    });

    it("should detect Go via go.mod", () => {
      writeFileSync(join(tempDir, "go.mod"), "module example");
      const stack = new StackDetector(tempDir).detect();
      expect(stack.languages).toContain("go");
    });

    it("should detect Rust via Cargo.toml", () => {
      writeFileSync(join(tempDir, "Cargo.toml"), "[package]");
      const stack = new StackDetector(tempDir).detect();
      expect(stack.languages).toContain("rust");
    });

    it("should detect JavaScript via package.json", () => {
      writeFileSync(join(tempDir, "package.json"), "{}");
      const stack = new StackDetector(tempDir).detect();
      expect(stack.languages).toContain("javascript");
    });
  });

  describe("detect — frameworks via packageDeps", () => {
    it("should detect React from dependencies", () => {
      writeFileSync(
        join(tempDir, "package.json"),
        JSON.stringify({ dependencies: { react: "^18.0.0" } }),
      );
      const stack = new StackDetector(tempDir).detect();
      expect(stack.frameworks).toContain("react");
    });

    it("should detect NestJS from dependencies", () => {
      writeFileSync(
        join(tempDir, "package.json"),
        JSON.stringify({ dependencies: { "@nestjs/core": "^10.0.0" } }),
      );
      const stack = new StackDetector(tempDir).detect();
      expect(stack.frameworks).toContain("nestjs");
    });

    it("should detect Vitest from devDependencies", () => {
      writeFileSync(
        join(tempDir, "package.json"),
        JSON.stringify({ devDependencies: { vitest: "^4.0.0" } }),
      );
      writeFileSync(join(tempDir, "vitest.config.ts"), "");
      const stack = new StackDetector(tempDir).detect();
      expect(stack.testFrameworks).toContain("vitest");
    });

    it("should detect dependencies from peerDependencies too", () => {
      writeFileSync(
        join(tempDir, "package.json"),
        JSON.stringify({ peerDependencies: { react: "^18.0.0" } }),
      );
      const stack = new StackDetector(tempDir).detect();
      expect(stack.frameworks).toContain("react");
    });
  });

  describe("detect — monorepo", () => {
    it("should detect Turborepo monorepo", () => {
      writeFileSync(join(tempDir, "turbo.json"), "{}");
      mkdirSync(join(tempDir, "packages"));
      const stack = new StackDetector(tempDir).detect();
      expect(stack.isMonorepo).toBe(true);
      expect(stack.monorepoTools).toContain("turborepo");
    });

    it("should detect pnpm workspaces monorepo", () => {
      writeFileSync(join(tempDir, "pnpm-workspace.yaml"), "packages:\n  - packages/*");
      const stack = new StackDetector(tempDir).detect();
      expect(stack.isMonorepo).toBe(true);
      expect(stack.monorepoTools).toContain("pnpm-workspaces");
    });
  });

  describe("detect — CI", () => {
    it("should detect GitHub Actions", () => {
      mkdirSync(join(tempDir, ".github", "workflows"), { recursive: true });
      const stack = new StackDetector(tempDir).detect();
      expect(stack.ciTools).toContain("github-actions");
    });
  });

  describe("detect — databases", () => {
    it("should detect PostgreSQL from pg dependency", () => {
      writeFileSync(
        join(tempDir, "package.json"),
        JSON.stringify({ dependencies: { pg: "^8.0.0" } }),
      );
      const stack = new StackDetector(tempDir).detect();
      expect(stack.databases).toContain("postgresql");
    });

    it("should detect Redis from ioredis dependency", () => {
      writeFileSync(
        join(tempDir, "package.json"),
        JSON.stringify({ dependencies: { ioredis: "^5.0.0" } }),
      );
      const stack = new StackDetector(tempDir).detect();
      expect(stack.databases).toContain("redis");
    });
  });

  describe("detect — empty project", () => {
    it("should return empty arrays for project with no markers", () => {
      const stack = new StackDetector(tempDir).detect();
      expect(stack.languages).toEqual([]);
      expect(stack.frameworks).toEqual([]);
      expect(stack.buildTools).toEqual([]);
      expect(stack.testFrameworks).toEqual([]);
      expect(stack.isMonorepo).toBe(false);
      expect(stack.detectedAt).toBeTruthy();
    });
  });

  describe("detect — glob markers", () => {
    it("should detect C# via *.csproj glob", () => {
      writeFileSync(join(tempDir, "MyProject.csproj"), "<Project />");
      const stack = new StackDetector(tempDir).detect();
      expect(stack.languages).toContain("csharp");
    });
  });

  describe("formatSummary", () => {
    it("should format a detected stack as markdown", () => {
      const stack = new StackDetector(tempDir).detect();
      // Add some data manually for formatting
      const fullStack = {
        ...stack,
        languages: ["typescript", "javascript"],
        frameworks: ["react", "next.js"],
        buildTools: ["vite"],
        testFrameworks: ["vitest"],
        packageManagers: ["pnpm"],
        databases: ["postgresql"],
        ciTools: ["github-actions"],
        isMonorepo: true,
        monorepoTools: ["turborepo"],
      };
      const summary = new StackDetector(tempDir).formatSummary(fullStack);
      expect(summary).toContain("## Detected Stack");
      expect(summary).toContain("**Languages:**");
      expect(summary).toContain("typescript");
      expect(summary).toContain("**Monorepo:**");
    });

    it("should format empty stack without extra lines", () => {
      const stack = new StackDetector(tempDir).detect();
      const summary = new StackDetector(tempDir).formatSummary(stack);
      expect(summary).toContain("## Detected Stack");
      expect(summary).not.toContain("**Languages:**");
    });
  });

  describe("recommendAgents", () => {
    it("should always include feature-developer", () => {
      const stack = new StackDetector(tempDir).detect();
      const agents = new StackDetector(tempDir).recommendAgents(stack);
      expect(agents).toContain("feature-developer");
    });

    it("should recommend backend-specialist for backend frameworks", () => {
      writeFileSync(
        join(tempDir, "package.json"),
        JSON.stringify({ dependencies: { "@nestjs/core": "^10.0.0" } }),
      );
      const detector = new StackDetector(tempDir);
      const stack = detector.detect();
      const agents = detector.recommendAgents(stack);
      expect(agents).toContain("backend-specialist");
    });

    it("should recommend frontend-specialist for frontend frameworks", () => {
      writeFileSync(
        join(tempDir, "package.json"),
        JSON.stringify({ dependencies: { react: "^18.0.0" } }),
      );
      const detector = new StackDetector(tempDir);
      const stack = detector.detect();
      const agents = detector.recommendAgents(stack);
      expect(agents).toContain("frontend-specialist");
    });

    it("should recommend database-specialist for database deps", () => {
      writeFileSync(
        join(tempDir, "package.json"),
        JSON.stringify({ dependencies: { pg: "^8.0.0" } }),
      );
      const detector = new StackDetector(tempDir);
      const stack = detector.detect();
      const agents = detector.recommendAgents(stack);
      expect(agents).toContain("database-specialist");
    });

    it("should recommend devops-specialist for CI tools", () => {
      mkdirSync(join(tempDir, ".github", "workflows"), { recursive: true });
      const detector = new StackDetector(tempDir);
      const stack = detector.detect();
      const agents = detector.recommendAgents(stack);
      expect(agents).toContain("devops-specialist");
    });

    it("should recommend test-writer for test frameworks", () => {
      writeFileSync(join(tempDir, "vitest.config.ts"), "");
      writeFileSync(
        join(tempDir, "package.json"),
        JSON.stringify({ devDependencies: { vitest: "^4.0.0" } }),
      );
      const detector = new StackDetector(tempDir);
      const stack = detector.detect();
      const agents = detector.recommendAgents(stack);
      expect(agents).toContain("test-writer");
    });

    it("should not have duplicate agents", () => {
      writeFileSync(
        join(tempDir, "package.json"),
        JSON.stringify({
          dependencies: { react: "^18.0.0", "@nestjs/core": "^10.0.0", pg: "^8.0.0" },
          devDependencies: { vitest: "^4.0.0" },
        }),
      );
      writeFileSync(join(tempDir, "vitest.config.ts"), "");
      mkdirSync(join(tempDir, ".github", "workflows"), { recursive: true });
      const detector = new StackDetector(tempDir);
      const stack = detector.detect();
      const agents = detector.recommendAgents(stack);
      const unique = [...new Set(agents)];
      expect(agents.length).toBe(unique.length);
    });
  });
});
