import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import type { AgentMemory, MemoryEntry } from "./types.js";

function getMemoryPath(slug: string, projectDir: string): string {
  return resolve(projectDir, ".fama", "memory", slug, "memory.json");
}

function createEmptyMemory(slug: string): AgentMemory {
  return { agentSlug: slug, preferences: {}, entries: [] };
}

export function loadMemory(slug: string, projectDir: string): AgentMemory {
  const memPath = getMemoryPath(slug, projectDir);
  if (!existsSync(memPath)) return createEmptyMemory(slug);

  try {
    const raw = readFileSync(memPath, "utf-8");
    return JSON.parse(raw) as AgentMemory;
  } catch {
    return createEmptyMemory(slug);
  }
}

export function saveMemory(slug: string, projectDir: string, memory: AgentMemory): void {
  const memPath = getMemoryPath(slug, projectDir);
  mkdirSync(dirname(memPath), { recursive: true });
  writeFileSync(memPath, JSON.stringify(memory, null, 2), "utf-8");
}

export function appendEntry(
  slug: string,
  projectDir: string,
  entry: Omit<MemoryEntry, "timestamp">,
): void {
  const memory = loadMemory(slug, projectDir);
  memory.entries.push({ ...entry, timestamp: new Date().toISOString() });
  saveMemory(slug, projectDir, memory);
}

export function clearMemory(slug: string, projectDir: string): void {
  saveMemory(slug, projectDir, createEmptyMemory(slug));
}
