import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { resolve } from "node:path";
import { mkdirSync, rmSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import {
  loadMemory,
  saveMemory,
  appendEntry,
  clearMemory,
} from "../../src/core/agent-memory.js";

const BASE_TEST_DIR = resolve(
  import.meta.dirname,
  "..",
  "fixtures",
  "agent-memory-test",
);
let TEST_DIR: string;
let testCounter = 0;

describe("agent-memory", () => {
  beforeEach(() => {
    testCounter++;
    TEST_DIR = resolve(BASE_TEST_DIR, `run-${testCounter}-${Date.now()}`);
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true, force: true });
  });

  describe("loadMemory", () => {
    it("deve retornar memory vazia quando não existe arquivo", () => {
      const memory = loadMemory("test-agent", TEST_DIR);
      expect(memory.agentSlug).toBe("test-agent");
      expect(memory.preferences).toEqual({});
      expect(memory.entries).toEqual([]);
    });

    it("deve carregar memory existente do disco", () => {
      const memDir = resolve(TEST_DIR, ".fama", "memory", "test-agent");
      mkdirSync(memDir, { recursive: true });
      const data = {
        agentSlug: "test-agent",
        preferences: { style: "verbose" },
        entries: [
          { timestamp: "2026-01-01T00:00:00Z", key: "note", value: "hello" },
        ],
      };
      writeFileSync(resolve(memDir, "memory.json"), JSON.stringify(data), "utf-8");

      const memory = loadMemory("test-agent", TEST_DIR);
      expect(memory.agentSlug).toBe("test-agent");
      expect(memory.preferences).toEqual({ style: "verbose" });
      expect(memory.entries).toHaveLength(1);
      expect(memory.entries[0]?.key).toBe("note");
    });

    it("deve retornar memory vazia quando arquivo é inválido", () => {
      const memDir = resolve(TEST_DIR, ".fama", "memory", "test-agent");
      mkdirSync(memDir, { recursive: true });
      writeFileSync(resolve(memDir, "memory.json"), "invalid json{{{", "utf-8");

      const memory = loadMemory("test-agent", TEST_DIR);
      expect(memory.agentSlug).toBe("test-agent");
      expect(memory.preferences).toEqual({});
      expect(memory.entries).toEqual([]);
    });
  });

  describe("saveMemory", () => {
    it("deve criar diretório e salvar arquivo", () => {
      const data = {
        agentSlug: "my-agent",
        preferences: { lang: "pt" },
        entries: [],
      };
      saveMemory("my-agent", TEST_DIR, data);

      const memPath = resolve(TEST_DIR, ".fama", "memory", "my-agent", "memory.json");
      expect(existsSync(memPath)).toBe(true);

      const raw = readFileSync(memPath, "utf-8");
      const parsed = JSON.parse(raw);
      expect(parsed.agentSlug).toBe("my-agent");
      expect(parsed.preferences.lang).toBe("pt");
    });
  });

  describe("appendEntry", () => {
    it("deve adicionar entry com timestamp automático", () => {
      appendEntry("test-agent", TEST_DIR, {
        key: "decision",
        value: "use REST",
        context: "architecture review",
      });

      const memory = loadMemory("test-agent", TEST_DIR);
      expect(memory.entries).toHaveLength(1);
      expect(memory.entries[0]?.key).toBe("decision");
      expect(memory.entries[0]?.value).toBe("use REST");
      expect(memory.entries[0]?.context).toBe("architecture review");
      expect(memory.entries[0]?.timestamp).toBeTruthy();
    });

    it("deve acumular entries", () => {
      appendEntry("test-agent", TEST_DIR, { key: "a", value: 1 });
      appendEntry("test-agent", TEST_DIR, { key: "b", value: 2 });
      appendEntry("test-agent", TEST_DIR, { key: "c", value: 3 });

      const memory = loadMemory("test-agent", TEST_DIR);
      expect(memory.entries).toHaveLength(3);
    });
  });

  describe("clearMemory", () => {
    it("deve limpar preferences e entries", () => {
      saveMemory("test-agent", TEST_DIR, {
        agentSlug: "test-agent",
        preferences: { x: 1 },
        entries: [{ timestamp: "2026-01-01T00:00:00Z", key: "k", value: "v" }],
      });

      clearMemory("test-agent", TEST_DIR);

      const memory = loadMemory("test-agent", TEST_DIR);
      expect(memory.agentSlug).toBe("test-agent");
      expect(memory.preferences).toEqual({});
      expect(memory.entries).toEqual([]);
    });
  });
});
