import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { resolve } from "node:path";

// Mock the Claude Agent SDK
vi.mock("@anthropic-ai/claude-agent-sdk", () => ({
  query: vi.fn(),
}));

import { query } from "@anthropic-ai/claude-agent-sdk";
import { runAgent } from "../../src/core/agent-runner.js";
import { AgentRegistry } from "../../src/core/agent-registry.js";
import { SkillRegistry } from "../../src/core/skill-registry.js";

const PROJECT_DIR = resolve(import.meta.dirname, "..", "..");
const mockedQuery = vi.mocked(query);

function mockQueryIterator(messages: unknown[]) {
  return {
    async *[Symbol.asyncIterator]() {
      for (const msg of messages) yield msg;
    },
  };
}

describe("runAgent", () => {
  let agentRegistry: AgentRegistry;
  let skillRegistry: SkillRegistry;
  let originalApiKey: string | undefined;

  beforeEach(() => {
    vi.clearAllMocks();
    agentRegistry = new AgentRegistry(PROJECT_DIR);
    skillRegistry = new SkillRegistry(PROJECT_DIR);
    originalApiKey = process.env["ANTHROPIC_API_KEY"];
    process.env["ANTHROPIC_API_KEY"] = "test-key-123";
  });

  afterEach(() => {
    if (originalApiKey !== undefined) {
      process.env["ANTHROPIC_API_KEY"] = originalApiKey;
    } else {
      delete process.env["ANTHROPIC_API_KEY"];
    }
  });

  it("should throw when ANTHROPIC_API_KEY is missing", async () => {
    delete process.env["ANTHROPIC_API_KEY"];

    await expect(
      runAgent(
        { task: "test", agent: "architect", cwd: PROJECT_DIR },
        agentRegistry,
        skillRegistry,
      ),
    ).rejects.toThrow("ANTHROPIC_API_KEY");
  });

  it("should throw when agent slug is undefined", async () => {
    await expect(
      runAgent(
        { task: "test", agent: undefined as unknown as string, cwd: PROJECT_DIR },
        agentRegistry,
        skillRegistry,
      ),
    ).rejects.toThrow("not found");
  });

  it("should throw when agent slug is not found", async () => {
    await expect(
      runAgent(
        { task: "test", agent: "nonexistent-agent", cwd: PROJECT_DIR },
        agentRegistry,
        skillRegistry,
      ),
    ).rejects.toThrow('Agent "nonexistent-agent" not found');
  });

  it("should call query with correct parameters", async () => {
    mockedQuery.mockReturnValue(
      mockQueryIterator([
        {
          type: "result",
          subtype: "success",
          result: "Done!",
          total_cost_usd: 0.01,
          num_turns: 2,
        },
      ]) as ReturnType<typeof query>,
    );

    await runAgent(
      {
        task: "Build something",
        agent: "architect",
        model: "sonnet",
        maxTurns: 10,
        cwd: PROJECT_DIR,
      },
      agentRegistry,
      skillRegistry,
    );

    expect(mockedQuery).toHaveBeenCalledOnce();
    const callArgs = mockedQuery.mock.calls[0]![0];
    expect(callArgs.prompt).toBe("Build something");
    expect(callArgs.options.model).toBe("sonnet");
    expect(callArgs.options.maxTurns).toBe(10);
    expect(callArgs.options.systemPrompt).toBeTruthy();
    expect(callArgs.options.allowedTools).toBeDefined();
  });

  it("should return result on success", async () => {
    mockedQuery.mockReturnValue(
      mockQueryIterator([
        {
          type: "result",
          subtype: "success",
          result: "Task completed successfully",
          total_cost_usd: 0.005,
          num_turns: 1,
        },
      ]) as ReturnType<typeof query>,
    );

    const result = await runAgent(
      { task: "test", agent: "architect", cwd: PROJECT_DIR },
      agentRegistry,
      skillRegistry,
    );

    expect(result).toBe("Task completed successfully");
  });

  it("should call onEvent with success metrics", async () => {
    mockedQuery.mockReturnValue(
      mockQueryIterator([
        {
          type: "result",
          subtype: "success",
          result: "Done",
          total_cost_usd: 0.02,
          num_turns: 3,
        },
      ]) as ReturnType<typeof query>,
    );

    const onEvent = vi.fn();

    await runAgent(
      { task: "test", agent: "architect", cwd: PROJECT_DIR, onEvent },
      agentRegistry,
      skillRegistry,
    );

    expect(onEvent).toHaveBeenCalledOnce();
    expect(onEvent.mock.calls[0]![0].status).toBe("success");
    expect(onEvent.mock.calls[0]![0].metrics.agent).toBe("architect");
    expect(onEvent.mock.calls[0]![0].metrics.costUSD).toBe(0.02);
    expect(onEvent.mock.calls[0]![0].metrics.turns).toBe(3);
  });

  it("should throw on error result and call onEvent with error", async () => {
    mockedQuery.mockReturnValue(
      mockQueryIterator([
        {
          type: "result",
          subtype: "error",
          errors: ["Something went wrong"],
        },
      ]) as ReturnType<typeof query>,
    );

    const onEvent = vi.fn();

    await expect(
      runAgent(
        { task: "test", agent: "architect", cwd: PROJECT_DIR, onEvent },
        agentRegistry,
        skillRegistry,
      ),
    ).rejects.toThrow("execution failed");

    expect(onEvent).toHaveBeenCalledOnce();
    expect(onEvent.mock.calls[0]![0].status).toBe("error");
  });

  it("should process assistant messages in verbose mode", async () => {
    const stdoutWrite = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    mockedQuery.mockReturnValue(
      mockQueryIterator([
        {
          type: "assistant",
          message: { content: [{ text: "Hello world" }] },
        },
        {
          type: "result",
          subtype: "success",
          result: "Done",
          total_cost_usd: 0.01,
          num_turns: 1,
        },
      ]) as ReturnType<typeof query>,
    );

    await runAgent(
      { task: "test", agent: "architect", cwd: PROJECT_DIR, verbose: true },
      agentRegistry,
      skillRegistry,
    );

    expect(stdoutWrite).toHaveBeenCalledWith("Hello world");
    stdoutWrite.mockRestore();
  });

  it("should warn about missing skills but continue", async () => {
    const warnSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    mockedQuery.mockReturnValue(
      mockQueryIterator([
        {
          type: "result",
          subtype: "success",
          result: "Done",
          total_cost_usd: 0.01,
          num_turns: 1,
        },
      ]) as ReturnType<typeof query>,
    );

    const result = await runAgent(
      {
        task: "test",
        agent: "architect",
        skills: ["nonexistent-skill-xyz"],
        cwd: PROJECT_DIR,
      },
      agentRegistry,
      skillRegistry,
    );

    expect(result).toBe("Done");
    warnSpy.mockRestore();
  });
});
