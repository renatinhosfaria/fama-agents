import { describe, it, expect } from "vitest";
import { buildAgentPrompt } from "../../src/agents/build-prompt.js";

describe("buildAgentPrompt", () => {
  it("should return only playbook content when no skills, persona, or criticalActions", () => {
    const result = buildAgentPrompt({
      playbookContent: "# My Agent\nDo stuff.",
      skillContents: [],
    });
    expect(result).toBe("# My Agent\nDo stuff.");
  });

  it("should append a single skill section", () => {
    const result = buildAgentPrompt({
      playbookContent: "# Agent",
      skillContents: ["# Skill A\nContent A"],
    });
    expect(result).toContain("# Agent");
    expect(result).toContain("## Active Skill 1");
    expect(result).toContain("# Skill A\nContent A");
    expect(result).toContain("---");
  });

  it("should append multiple skill sections with numbered headers", () => {
    const result = buildAgentPrompt({
      playbookContent: "Playbook",
      skillContents: ["Skill 1", "Skill 2", "Skill 3"],
    });
    expect(result).toContain("## Active Skill 1");
    expect(result).toContain("## Active Skill 2");
    expect(result).toContain("## Active Skill 3");
  });

  it("should handle empty playbook with skills", () => {
    const result = buildAgentPrompt({
      playbookContent: "",
      skillContents: ["Skill content"],
    });
    expect(result).toContain("## Active Skill 1");
    expect(result).toContain("Skill content");
  });

  it("should inject persona section before playbook", () => {
    const result = buildAgentPrompt({
      playbookContent: "# Playbook content",
      skillContents: [],
      persona: {
        displayName: "Winston",
        icon: "🏗️",
        role: "System Architect",
        identity: "Senior architect",
        communicationStyle: "Calm and pragmatic",
        principles: ["Simplicity first", "Evidence-based decisions"],
      },
    });
    expect(result).toContain("## Persona");
    expect(result).toContain("🏗️ Winston");
    expect(result).toContain("**Role:** System Architect");
    expect(result).toContain("**Identity:** Senior architect");
    expect(result).toContain("**Communication Style:** Calm and pragmatic");
    expect(result).toContain("- Simplicity first");
    expect(result).toContain("- Evidence-based decisions");
    // Persona comes before playbook
    const personaIdx = result.indexOf("## Persona");
    const playbookIdx = result.indexOf("# Playbook content");
    expect(personaIdx).toBeLessThan(playbookIdx);
  });

  it("should inject critical actions section before playbook", () => {
    const result = buildAgentPrompt({
      playbookContent: "# Playbook",
      skillContents: [],
      criticalActions: [
        "Write tests first",
        "Never skip verification",
      ],
    });
    expect(result).toContain("## ⚠️ CRITICAL ACTIONS");
    expect(result).toContain("- **Write tests first**");
    expect(result).toContain("- **Never skip verification**");
    // Critical actions come before playbook
    const critIdx = result.indexOf("CRITICAL ACTIONS");
    const playbookIdx = result.indexOf("# Playbook");
    expect(critIdx).toBeLessThan(playbookIdx);
  });

  it("should compose in correct order: Persona → Critical Actions → Playbook → Skills", () => {
    const result = buildAgentPrompt({
      playbookContent: "# Playbook Body",
      skillContents: ["Skill Data"],
      persona: { displayName: "Agent", role: "Test" },
      criticalActions: ["Action 1"],
    });
    const personaIdx = result.indexOf("## Persona");
    const critIdx = result.indexOf("CRITICAL ACTIONS");
    const playbookIdx = result.indexOf("# Playbook Body");
    const skillIdx = result.indexOf("## Active Skill 1");
    expect(personaIdx).toBeLessThan(critIdx);
    expect(critIdx).toBeLessThan(playbookIdx);
    expect(playbookIdx).toBeLessThan(skillIdx);
  });

  it("should skip empty persona object", () => {
    const result = buildAgentPrompt({
      playbookContent: "# Playbook",
      skillContents: [],
      persona: {},
    });
    expect(result).not.toContain("## Persona");
  });

  it("should skip empty criticalActions array", () => {
    const result = buildAgentPrompt({
      playbookContent: "# Playbook",
      skillContents: [],
      criticalActions: [],
    });
    expect(result).not.toContain("CRITICAL ACTIONS");
  });

  it("should inject memory section between critical actions and playbook", () => {
    const result = buildAgentPrompt({
      playbookContent: "# Playbook",
      skillContents: [],
      criticalActions: ["Action 1"],
      memory: {
        agentSlug: "test",
        preferences: { style: "concise" },
        entries: [
          { timestamp: "2026-01-01T00:00:00Z", key: "note", value: "test value" },
        ],
      },
    });
    expect(result).toContain("## 🧠 Agent Memory");
    expect(result).toContain("style: \"concise\"");
    expect(result).toContain("note: \"test value\"");
    const critIdx = result.indexOf("CRITICAL ACTIONS");
    const memIdx = result.indexOf("Agent Memory");
    const playbookIdx = result.indexOf("# Playbook");
    expect(critIdx).toBeLessThan(memIdx);
    expect(memIdx).toBeLessThan(playbookIdx);
  });

  it("should skip memory with no preferences and no entries", () => {
    const result = buildAgentPrompt({
      playbookContent: "# Playbook",
      skillContents: [],
      memory: { agentSlug: "test", preferences: {}, entries: [] },
    });
    expect(result).not.toContain("Agent Memory");
  });

  it("should only show last 10 memory entries", () => {
    const entries = Array.from({ length: 15 }, (_, i) => ({
      timestamp: `2026-01-${String(i + 1).padStart(2, "0")}T00:00:00Z`,
      key: `entry-${i}`,
      value: `value-${i}`,
    }));
    const result = buildAgentPrompt({
      playbookContent: "# Playbook",
      skillContents: [],
      memory: { agentSlug: "test", preferences: {}, entries },
    });
    expect(result).not.toContain("entry-4");
    expect(result).toContain("entry-5");
    expect(result).toContain("entry-14");
  });

  it("should include context field in memory entries", () => {
    const result = buildAgentPrompt({
      playbookContent: "# Playbook",
      skillContents: [],
      memory: {
        agentSlug: "test",
        preferences: {},
        entries: [
          { timestamp: "2026-01-01T00:00:00Z", key: "note", value: "hello", context: "review session" },
        ],
      },
    });
    expect(result).toContain("(review session)");
    expect(result).toContain("note: \"hello\"");
  });

  it("should compose full order: Persona → Critical Actions → Memory → Playbook → Skills", () => {
    const result = buildAgentPrompt({
      playbookContent: "# Playbook Body",
      skillContents: ["Skill Data"],
      persona: { displayName: "Agent", role: "Test" },
      criticalActions: ["Action 1"],
      memory: {
        agentSlug: "test",
        preferences: { lang: "pt" },
        entries: [],
      },
    });
    const personaIdx = result.indexOf("## Persona");
    const critIdx = result.indexOf("CRITICAL ACTIONS");
    const memIdx = result.indexOf("Agent Memory");
    const playbookIdx = result.indexOf("# Playbook Body");
    const skillIdx = result.indexOf("## Active Skill 1");
    expect(personaIdx).toBeLessThan(critIdx);
    expect(critIdx).toBeLessThan(memIdx);
    expect(memIdx).toBeLessThan(playbookIdx);
    expect(playbookIdx).toBeLessThan(skillIdx);
  });
});
