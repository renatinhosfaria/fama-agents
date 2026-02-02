import { describe, it, expect, beforeEach } from "vitest";
import { StructuredLogger, LogLevel } from "../../src/utils/structured-logger.js";
import type { LogEntry } from "../../src/utils/structured-logger.js";

describe("StructuredLogger", () => {
  let logger: StructuredLogger;

  beforeEach(() => {
    logger = new StructuredLogger(LogLevel.DEBUG);
  });

  it("should emit entries at or above the current level", () => {
    const entries: LogEntry[] = [];
    logger.onLog((entry) => entries.push(entry));

    logger.debug("debug msg");
    logger.info("info msg");
    logger.warn("warn msg");
    logger.error("error msg");

    expect(entries).toHaveLength(4);
    expect(entries[0]!.levelName).toBe("debug");
    expect(entries[1]!.levelName).toBe("info");
    expect(entries[2]!.levelName).toBe("warn");
    expect(entries[3]!.levelName).toBe("error");
  });

  it("should filter entries below the current level", () => {
    logger.setLevel(LogLevel.WARN);
    const entries: LogEntry[] = [];
    logger.onLog((entry) => entries.push(entry));

    logger.debug("should be filtered");
    logger.info("should be filtered");
    logger.warn("should pass");
    logger.error("should pass");

    expect(entries).toHaveLength(2);
    expect(entries[0]!.levelName).toBe("warn");
    expect(entries[1]!.levelName).toBe("error");
  });

  it("should emit no entries when level is SILENT", () => {
    logger.setLevel(LogLevel.SILENT);
    const entries: LogEntry[] = [];
    logger.onLog((entry) => entries.push(entry));

    logger.debug("x");
    logger.info("x");
    logger.warn("x");
    logger.error("x");

    expect(entries).toHaveLength(0);
  });

  it("should include context in entries", () => {
    const entries: LogEntry[] = [];
    logger.onLog((entry) => entries.push(entry));

    logger.info("test", { agent: "architect", model: "opus" });

    expect(entries).toHaveLength(1);
    expect(entries[0]!.context).toEqual({ agent: "architect", model: "opus" });
  });

  it("should include timestamp in entries", () => {
    const entries: LogEntry[] = [];
    logger.onLog((entry) => entries.push(entry));

    logger.info("test");

    expect(entries[0]!.timestamp).toBeDefined();
    expect(new Date(entries[0]!.timestamp).getTime()).not.toBeNaN();
  });

  it("should support multiple listeners", () => {
    const entries1: LogEntry[] = [];
    const entries2: LogEntry[] = [];
    logger.onLog((entry) => entries1.push(entry));
    logger.onLog((entry) => entries2.push(entry));

    logger.info("test");

    expect(entries1).toHaveLength(1);
    expect(entries2).toHaveLength(1);
  });

  it("should support removing listeners", () => {
    const entries: LogEntry[] = [];
    const listener = (entry: LogEntry) => entries.push(entry);
    logger.onLog(listener);

    logger.info("first");
    logger.removeListener(listener);
    logger.info("second");

    expect(entries).toHaveLength(1);
    expect(entries[0]!.message).toBe("first");
  });

  it("should respect FAMA_LOG_LEVEL environment variable", () => {
    const original = process.env["FAMA_LOG_LEVEL"];
    process.env["FAMA_LOG_LEVEL"] = "error";

    const envLogger = new StructuredLogger();
    expect(envLogger.getLevel()).toBe(LogLevel.ERROR);

    if (original !== undefined) {
      process.env["FAMA_LOG_LEVEL"] = original;
    } else {
      delete process.env["FAMA_LOG_LEVEL"];
    }
  });

  it("should default to INFO when no env var or constructor param", () => {
    const original = process.env["FAMA_LOG_LEVEL"];
    delete process.env["FAMA_LOG_LEVEL"];

    const defaultLogger = new StructuredLogger();
    expect(defaultLogger.getLevel()).toBe(LogLevel.INFO);

    if (original !== undefined) {
      process.env["FAMA_LOG_LEVEL"] = original;
    }
  });
});
