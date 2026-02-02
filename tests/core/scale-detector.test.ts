import { describe, it, expect } from "vitest";
import { detectScale, autoSelectAgent } from "../../src/core/scale-detector.js";
import { ProjectScale } from "../../src/core/types.js";

describe("detectScale", () => {
  it("should detect QUICK scale from keywords", () => {
    expect(detectScale("fix typo in readme")).toBe(ProjectScale.QUICK);
    expect(detectScale("rename variable")).toBe(ProjectScale.QUICK);
    expect(detectScale("corrigir typo")).toBe(ProjectScale.QUICK);
  });

  it("should detect SMALL scale from keywords", () => {
    expect(detectScale("add function to utils")).toBe(ProjectScale.SMALL);
    expect(detectScale("criar helper")).toBe(ProjectScale.SMALL);
  });

  it("should detect LARGE scale from keywords", () => {
    expect(detectScale("redesign the authentication system")).toBe(ProjectScale.LARGE);
    expect(detectScale("complete migration to new API")).toBe(ProjectScale.LARGE);
    expect(detectScale("arquitetura do sistema")).toBe(ProjectScale.LARGE);
  });

  it("should detect from explicit --scale flags", () => {
    expect(detectScale("do something --scale quick")).toBe(ProjectScale.QUICK);
    expect(detectScale("do something --scale large")).toBe(ProjectScale.LARGE);
    expect(detectScale("do something --scale rapido")).toBe(ProjectScale.QUICK);
  });

  it("should use file count heuristic", () => {
    expect(detectScale("do something", 1)).toBe(ProjectScale.QUICK);
    expect(detectScale("do something", 3)).toBe(ProjectScale.SMALL);
    expect(detectScale("do something", 5)).toBe(ProjectScale.MEDIUM);
    expect(detectScale("do something", 10)).toBe(ProjectScale.LARGE);
  });

  it("should default to MEDIUM for ambiguous tasks", () => {
    expect(detectScale("implement the feature")).toBe(ProjectScale.MEDIUM);
  });
});

describe("autoSelectAgent", () => {
  it("should select bug-fixer for bug keywords", () => {
    expect(autoSelectAgent("fix the login bug")).toBe("bug-fixer");
    expect(autoSelectAgent("error in payment")).toBe("bug-fixer");
  });

  it("should select code-reviewer for review keywords", () => {
    expect(autoSelectAgent("review the auth module")).toBe("code-reviewer");
    expect(autoSelectAgent("audit the code quality")).toBe("code-reviewer");
  });

  it("should select test-writer for test keywords", () => {
    expect(autoSelectAgent("write tests for utils")).toBe("test-writer");
    expect(autoSelectAgent("improve test coverage")).toBe("test-writer");
  });

  it("should select security-auditor for security keywords", () => {
    expect(autoSelectAgent("check for security vulnerabilities")).toBe("security-auditor");
    expect(autoSelectAgent("scan for XSS vulnerabilities")).toBe("security-auditor");
  });

  it("should select architect for design keywords", () => {
    expect(autoSelectAgent("design the API architecture")).toBe("architect");
    expect(autoSelectAgent("plan the feature breakdown")).toBe("architect");
  });

  it("should select performance-optimizer for perf keywords", () => {
    expect(autoSelectAgent("optimize the slow queries")).toBe("performance-optimizer");
  });

  it("should select devops-specialist for devops keywords", () => {
    expect(autoSelectAgent("setup infrastructure deploy")).toBe("devops-specialist");
    expect(autoSelectAgent("set up CI/CD pipeline")).toBe("devops-specialist");
  });

  it("should default to feature-developer", () => {
    expect(autoSelectAgent("implement user dashboard")).toBe("feature-developer");
  });
});
