import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  CircuitBreaker,
  CircuitState,
  getCircuitBreaker,
  resetAllCircuitBreakers,
  clearCircuitBreakerRegistry,
  getAllCircuitBreakers,
} from "../../src/core/circuit-breaker.js";

describe("CircuitBreaker", () => {
  describe("initial state", () => {
    it("should start in CLOSED state", () => {
      const breaker = new CircuitBreaker("test");
      expect(breaker.getState()).toBe(CircuitState.CLOSED);
    });

    it("should allow execution in CLOSED state", () => {
      const breaker = new CircuitBreaker("test");
      expect(breaker.canExecute()).toBe(true);
    });
  });

  describe("failure tracking", () => {
    it("should remain CLOSED below failure threshold", () => {
      const breaker = new CircuitBreaker("test", { failureThreshold: 5 });

      for (let i = 0; i < 4; i++) {
        breaker.recordFailure();
      }

      expect(breaker.getState()).toBe(CircuitState.CLOSED);
      expect(breaker.canExecute()).toBe(true);
    });

    it("should transition to OPEN at failure threshold", () => {
      const breaker = new CircuitBreaker("test", { failureThreshold: 5 });

      for (let i = 0; i < 5; i++) {
        breaker.recordFailure();
      }

      expect(breaker.getState()).toBe(CircuitState.OPEN);
      expect(breaker.canExecute()).toBe(false);
    });

    it("should reset failure count on success", () => {
      const breaker = new CircuitBreaker("test", { failureThreshold: 5 });

      breaker.recordFailure();
      breaker.recordFailure();
      breaker.recordSuccess();
      breaker.recordFailure();
      breaker.recordFailure();

      // Still CLOSED because success reset the counter
      expect(breaker.getState()).toBe(CircuitState.CLOSED);
    });
  });

  describe("OPEN state", () => {
    it("should block execution in OPEN state", () => {
      const breaker = new CircuitBreaker("test", { failureThreshold: 1 });
      breaker.recordFailure();

      expect(breaker.canExecute()).toBe(false);
    });

    it("should transition to HALF_OPEN after reset timeout", () => {
      vi.useFakeTimers();

      const breaker = new CircuitBreaker("test", {
        failureThreshold: 1,
        resetTimeoutMs: 1000,
      });

      breaker.recordFailure();
      expect(breaker.getState()).toBe(CircuitState.OPEN);

      vi.advanceTimersByTime(1001);

      expect(breaker.canExecute()).toBe(true);
      expect(breaker.getState()).toBe(CircuitState.HALF_OPEN);

      vi.useRealTimers();
    });

    it("should stay OPEN before reset timeout", () => {
      vi.useFakeTimers();

      const breaker = new CircuitBreaker("test", {
        failureThreshold: 1,
        resetTimeoutMs: 1000,
      });

      breaker.recordFailure();

      vi.advanceTimersByTime(500);

      expect(breaker.canExecute()).toBe(false);
      expect(breaker.getState()).toBe(CircuitState.OPEN);

      vi.useRealTimers();
    });
  });

  describe("HALF_OPEN state", () => {
    let breaker: CircuitBreaker;

    beforeEach(() => {
      vi.useFakeTimers();
      breaker = new CircuitBreaker("test", {
        failureThreshold: 1,
        resetTimeoutMs: 1000,
        halfOpenSuccessThreshold: 2,
      });

      // Get to HALF_OPEN state
      breaker.recordFailure();
      vi.advanceTimersByTime(1001);
      breaker.canExecute(); // Triggers transition
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should allow execution in HALF_OPEN state", () => {
      expect(breaker.canExecute()).toBe(true);
    });

    it("should transition to CLOSED after success threshold", () => {
      breaker.recordSuccess();
      expect(breaker.getState()).toBe(CircuitState.HALF_OPEN);

      breaker.recordSuccess();
      expect(breaker.getState()).toBe(CircuitState.CLOSED);
    });

    it("should transition to OPEN on failure in HALF_OPEN", () => {
      breaker.recordFailure();
      expect(breaker.getState()).toBe(CircuitState.OPEN);
    });
  });

  describe("reset", () => {
    it("should reset to CLOSED state", () => {
      const breaker = new CircuitBreaker("test", { failureThreshold: 1 });
      breaker.recordFailure();
      expect(breaker.getState()).toBe(CircuitState.OPEN);

      breaker.reset();

      expect(breaker.getState()).toBe(CircuitState.CLOSED);
      expect(breaker.canExecute()).toBe(true);
    });
  });

  describe("trip", () => {
    it("should manually open the circuit", () => {
      const breaker = new CircuitBreaker("test");
      expect(breaker.getState()).toBe(CircuitState.CLOSED);

      breaker.trip();

      expect(breaker.getState()).toBe(CircuitState.OPEN);
      expect(breaker.canExecute()).toBe(false);
    });
  });

  describe("getStatus", () => {
    it("should return detailed status", () => {
      vi.useFakeTimers();

      const breaker = new CircuitBreaker("test", {
        failureThreshold: 2,
        resetTimeoutMs: 5000,
      });

      breaker.recordFailure();

      const status = breaker.getStatus();

      expect(status.state).toBe(CircuitState.CLOSED);
      expect(status.failures).toBe(1);
      expect(status.successes).toBe(0);
      expect(status.lastFailureTime).toBeGreaterThan(0);

      vi.useRealTimers();
    });

    it("should calculate time until reset in OPEN state", () => {
      vi.useFakeTimers();

      const breaker = new CircuitBreaker("test", {
        failureThreshold: 1,
        resetTimeoutMs: 5000,
      });

      breaker.recordFailure();
      vi.advanceTimersByTime(2000);

      const status = breaker.getStatus();

      expect(status.state).toBe(CircuitState.OPEN);
      expect(status.timeUntilReset).toBeCloseTo(3000, -2);

      vi.useRealTimers();
    });
  });
});

describe("Circuit Breaker Registry", () => {
  beforeEach(() => {
    clearCircuitBreakerRegistry();
  });

  it("should create breaker on first access", () => {
    const breaker = getCircuitBreaker("claude");
    expect(breaker.name).toBe("claude");
    expect(breaker.getState()).toBe(CircuitState.CLOSED);
  });

  it("should return same breaker for same provider", () => {
    const breaker1 = getCircuitBreaker("claude");
    const breaker2 = getCircuitBreaker("claude");
    expect(breaker1).toBe(breaker2);
  });

  it("should create different breakers for different providers", () => {
    const claudeBreaker = getCircuitBreaker("claude");
    const openaiBreaker = getCircuitBreaker("openai");

    expect(claudeBreaker).not.toBe(openaiBreaker);
    expect(claudeBreaker.name).toBe("claude");
    expect(openaiBreaker.name).toBe("openai");
  });

  it("should reset all breakers", () => {
    const breaker1 = getCircuitBreaker("claude", { failureThreshold: 1 });
    const breaker2 = getCircuitBreaker("openai", { failureThreshold: 1 });

    breaker1.recordFailure();
    breaker2.recordFailure();

    expect(breaker1.getState()).toBe(CircuitState.OPEN);
    expect(breaker2.getState()).toBe(CircuitState.OPEN);

    resetAllCircuitBreakers();

    expect(breaker1.getState()).toBe(CircuitState.CLOSED);
    expect(breaker2.getState()).toBe(CircuitState.CLOSED);
  });

  it("should get all registered breakers", () => {
    getCircuitBreaker("claude");
    getCircuitBreaker("openai");
    getCircuitBreaker("openrouter");

    const all = getAllCircuitBreakers();

    expect(all.size).toBe(3);
    expect(all.has("claude")).toBe(true);
    expect(all.has("openai")).toBe(true);
    expect(all.has("openrouter")).toBe(true);
  });

  it("should clear registry", () => {
    getCircuitBreaker("claude");
    getCircuitBreaker("openai");

    clearCircuitBreakerRegistry();

    const all = getAllCircuitBreakers();
    expect(all.size).toBe(0);
  });
});
