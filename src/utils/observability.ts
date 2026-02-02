import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";

// ─── Tracing ───

export interface Span {
  id: string;
  name: string;
  startedAt: number;
  endedAt?: number;
  durationMs?: number;
  attributes: Record<string, unknown>;
  children: Span[];
}

export function startSpan(
  name: string,
  attributes?: Record<string, unknown>,
): Span {
  return {
    id: randomUUID().slice(0, 12),
    name,
    startedAt: Date.now(),
    attributes: attributes ?? {},
    children: [],
  };
}

export function endSpan(span: Span): void {
  span.endedAt = Date.now();
  span.durationMs = span.endedAt - span.startedAt;
}

// ─── Run Records ───

export interface RunRecord {
  id?: string;
  status: "success" | "error";
  workflowName?: string;
  phase?: string;
  task: string;
  taskOriginal?: string;
  agent: string;
  skills: string[];
  model?: string;
  maxTurns?: number;
  cwd: string;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  costUSD?: number;
  turns?: number;
  result?: string;
  error?: string;
}

function sanitizeSegment(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export function createRunId(meta: {
  workflowName?: string;
  phase?: string;
  agent: string;
}): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "");
  const segments = [
    timestamp,
    meta.workflowName ? sanitizeSegment(meta.workflowName) : "",
    meta.phase ? sanitizeSegment(meta.phase) : "",
    sanitizeSegment(meta.agent),
    randomUUID().slice(0, 8),
  ].filter((segment) => segment.length > 0);

  return segments.join("-");
}

export function writeRunRecord(projectDir: string, record: RunRecord): string {
  const runsDir = resolve(projectDir, ".fama", "runs");
  mkdirSync(runsDir, { recursive: true });

  const id =
    record.id ??
    createRunId({
      workflowName: record.workflowName,
      phase: record.phase,
      agent: record.agent,
    });

  const filePath = resolve(runsDir, `${id}.json`);
  const payload = { ...record, id };
  writeFileSync(filePath, JSON.stringify(payload, null, 2), "utf-8");

  return filePath;
}
