import { describe, it, expect } from "vitest";
import { resolve } from "node:path";
import { selectAgents, synthesize } from "../../src/core/party-orchestrator.js";
import { AgentRegistry } from "../../src/core/agent-registry.js";

const PROJECT_DIR = resolve(import.meta.dirname, "..", "..");

describe("party-orchestrator", () => {
  describe("selectAgents", () => {
    it("deve selecionar agentes específicos por slug", () => {
      const registry = new AgentRegistry(PROJECT_DIR);
      const agents = selectAgents(registry, ["architect", "test-writer"]);
      expect(agents).toHaveLength(2);
      expect(agents[0]?.slug).toBe("architect");
      expect(agents[1]?.slug).toBe("test-writer");
    });

    it("deve ignorar agentes inexistentes", () => {
      const registry = new AgentRegistry(PROJECT_DIR);
      const agents = selectAgents(registry, ["architect", "nonexistent"]);
      expect(agents).toHaveLength(1);
      expect(agents[0]?.slug).toBe("architect");
    });

    it("deve auto-selecionar quando sem slugs específicos", () => {
      const registry = new AgentRegistry(PROJECT_DIR);
      const agents = selectAgents(registry, undefined, 3);
      expect(agents.length).toBeGreaterThan(0);
      expect(agents.length).toBeLessThanOrEqual(3);
    });

    it("deve priorizar agentes com persona na auto-seleção", () => {
      const registry = new AgentRegistry(PROJECT_DIR);
      const agents = selectAgents(registry, undefined, 2);
      // architect and feature-developer have personas
      const withPersona = agents.filter((a) => a.persona?.displayName);
      expect(withPersona.length).toBeGreaterThan(0);
    });
  });

  describe("synthesize", () => {
    it("deve gerar síntese com participantes e rounds", () => {
      const rounds = [
        { round: 1, agentSlug: "architect", displayLabel: "🏗️ Winston", response: "Devemos usar microservices." },
        { round: 2, agentSlug: "test-writer", displayLabel: "test-writer", response: "Precisamos de testes E2E." },
      ];
      const result = synthesize(rounds);
      expect(result).toContain("Síntese da Discussão");
      expect(result).toContain("🏗️ Winston");
      expect(result).toContain("test-writer");
      expect(result).toContain("**Rounds:** 2");
    });

    it("não deve adicionar '...' para respostas curtas", () => {
      const rounds = [
        { round: 1, agentSlug: "a", displayLabel: "Agent A", response: "Short reply" },
      ];
      const result = synthesize(rounds);
      expect(result).toContain("Short reply");
      expect(result).not.toContain("Short reply...");
    });

    it("deve truncar e adicionar '...' para respostas longas", () => {
      const longResponse = "A".repeat(200);
      const rounds = [
        { round: 1, agentSlug: "a", displayLabel: "Agent A", response: longResponse },
      ];
      const result = synthesize(rounds);
      expect(result).toContain("A".repeat(150) + "...");
    });

    it("deve listar participantes únicos", () => {
      const rounds = [
        { round: 1, agentSlug: "a", displayLabel: "Agent A", response: "R1" },
        { round: 2, agentSlug: "b", displayLabel: "Agent B", response: "R2" },
        { round: 3, agentSlug: "a", displayLabel: "Agent A", response: "R3" },
      ];
      const result = synthesize(rounds);
      const participantsLine = result.split("\n").find((l) => l.includes("Participantes"));
      expect(participantsLine).toBeDefined();
      // Agent A should appear only once in participants
      const matches = participantsLine!.match(/Agent A/g);
      expect(matches).toHaveLength(1);
    });
  });
});
