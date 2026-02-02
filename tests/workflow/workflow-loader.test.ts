import { describe, it, expect } from "vitest";
import { resolve } from "node:path";
import { loadStepfileWorkflow, discoverWorkflows } from "../../src/workflow/workflow-loader.js";

const FIXTURE_DIR = resolve(import.meta.dirname, "..", "fixtures", "stepfile-workflow-test");
const PROJECT_DIR = resolve(import.meta.dirname, "..", "..");

describe("workflow-loader", () => {
  describe("loadStepfileWorkflow", () => {
    it("deve carregar workflow com config e steps", () => {
      const workflow = loadStepfileWorkflow(FIXTURE_DIR);
      expect(workflow).toBeDefined();
      expect(workflow!.name).toBe("test-workflow");
      expect(workflow!.description).toBe("Workflow de teste com 3 steps");
      expect(workflow!.steps).toHaveLength(3);
    });

    it("deve carregar steps na ordem correta", () => {
      const workflow = loadStepfileWorkflow(FIXTURE_DIR);
      expect(workflow!.steps[0]!.order).toBe(1);
      expect(workflow!.steps[0]!.name).toBe("Análise");
      expect(workflow!.steps[0]!.agent).toBe("architect");
      expect(workflow!.steps[1]!.order).toBe(2);
      expect(workflow!.steps[1]!.name).toBe("Implementação");
      expect(workflow!.steps[1]!.agent).toBe("feature-developer");
      expect(workflow!.steps[2]!.order).toBe(3);
      expect(workflow!.steps[2]!.name).toBe("Revisão");
    });

    it("deve preservar skills dos steps", () => {
      const workflow = loadStepfileWorkflow(FIXTURE_DIR);
      expect(workflow!.steps[1]!.skills).toContain("test-driven-development");
    });

    it("deve carregar conteúdo do prompt de cada step", () => {
      const workflow = loadStepfileWorkflow(FIXTURE_DIR);
      expect(workflow!.steps[0]!.prompt).toContain("requisitos");
      expect(workflow!.steps[1]!.prompt).toContain("TDD");
      expect(workflow!.steps[2]!.prompt).toContain("Revise");
    });

    it("deve retornar null para diretório inexistente", () => {
      const workflow = loadStepfileWorkflow("/nonexistent/path");
      expect(workflow).toBeNull();
    });
  });

  describe("discoverWorkflows", () => {
    it("deve retornar array (pode ser vazio se não houver workflows)", () => {
      const workflows = discoverWorkflows(PROJECT_DIR);
      expect(Array.isArray(workflows)).toBe(true);
    });

    it("cada workflow deve ter name, dir e source", () => {
      const workflows = discoverWorkflows(PROJECT_DIR);
      for (const w of workflows) {
        expect(w.name).toBeTruthy();
        expect(w.dir).toBeTruthy();
        expect(["built-in", "project"]).toContain(w.source);
      }
    });
  });
});
