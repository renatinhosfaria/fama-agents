/**
 * Circuit Breaker Pattern Implementation
 *
 * Prevents cascading failures by stopping requests to failing providers.
 * After a cooldown period, allows limited requests to test recovery.
 *
 * States:
 * - CLOSED: Normal operation, all requests pass through
 * - OPEN: Provider is failing, requests are blocked
 * - HALF_OPEN: Testing recovery, limited requests allowed
 */

export enum CircuitState {
  CLOSED = "closed",
  OPEN = "open",
  HALF_OPEN = "half_open",
}

export interface CircuitBreakerOptions {
  /** Number of consecutive failures before opening circuit */
  failureThreshold: number;
  /** Time in ms to wait before trying half-open state */
  resetTimeoutMs: number;
  /** Number of successes in half-open needed to close circuit */
  halfOpenSuccessThreshold: number;
}

const DEFAULT_OPTIONS: CircuitBreakerOptions = {
  failureThreshold: 5,
  resetTimeoutMs: 30_000, // 30 seconds
  halfOpenSuccessThreshold: 2,
};

/**
 * Circuit breaker for a single provider.
 */
export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failures: number = 0;
  private successes: number = 0;
  private lastFailureTime: number = 0;
  private readonly options: CircuitBreakerOptions;

  constructor(
    public readonly name: string,
    options?: Partial<CircuitBreakerOptions>,
  ) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Checks if a request can be executed.
   *
   * - CLOSED: Always allows
   * - OPEN: Blocks until reset timeout, then transitions to HALF_OPEN
   * - HALF_OPEN: Allows limited requests for testing
   */
  canExecute(): boolean {
    switch (this.state) {
      case CircuitState.CLOSED:
        return true;

      case CircuitState.OPEN: {
        const timeSinceFailure = Date.now() - this.lastFailureTime;
        if (timeSinceFailure >= this.options.resetTimeoutMs) {
          // Transition to half-open to test recovery
          this.state = CircuitState.HALF_OPEN;
          this.successes = 0;
          return true;
        }
        return false;
      }

      case CircuitState.HALF_OPEN:
        // Allow limited requests in half-open state
        return true;

      default:
        return true;
    }
  }

  /**
   * Records a successful request.
   * Resets failure counter and may close circuit if in half-open.
   */
  recordSuccess(): void {
    this.failures = 0;

    if (this.state === CircuitState.HALF_OPEN) {
      this.successes++;
      if (this.successes >= this.options.halfOpenSuccessThreshold) {
        this.state = CircuitState.CLOSED;
        this.successes = 0;
      }
    }
  }

  /**
   * Records a failed request.
   * May open the circuit if failure threshold is reached.
   */
  recordFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.state === CircuitState.HALF_OPEN) {
      // Any failure in half-open immediately opens the circuit
      this.state = CircuitState.OPEN;
      return;
    }

    if (this.failures >= this.options.failureThreshold) {
      this.state = CircuitState.OPEN;
    }
  }

  /**
   * Gets the current circuit state.
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Gets detailed circuit status.
   */
  getStatus(): {
    state: CircuitState;
    failures: number;
    successes: number;
    lastFailureTime: number;
    timeUntilReset: number;
  } {
    const now = Date.now();
    const timeSinceFailure = now - this.lastFailureTime;
    const timeUntilReset =
      this.state === CircuitState.OPEN
        ? Math.max(0, this.options.resetTimeoutMs - timeSinceFailure)
        : 0;

    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      lastFailureTime: this.lastFailureTime,
      timeUntilReset,
    };
  }

  /**
   * Manually resets the circuit to closed state.
   */
  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failures = 0;
    this.successes = 0;
    this.lastFailureTime = 0;
  }

  /**
   * Manually opens the circuit.
   */
  trip(): void {
    this.state = CircuitState.OPEN;
    this.lastFailureTime = Date.now();
  }
}

// ─── Global Registry ───

const breakers = new Map<string, CircuitBreaker>();

/**
 * Gets or creates a circuit breaker for a provider.
 *
 * @param providerName - Name of the provider (e.g., "claude", "openai")
 * @param options - Optional configuration overrides
 */
export function getCircuitBreaker(
  providerName: string,
  options?: Partial<CircuitBreakerOptions>,
): CircuitBreaker {
  let breaker = breakers.get(providerName);
  if (!breaker) {
    breaker = new CircuitBreaker(providerName, options);
    breakers.set(providerName, breaker);
  }
  return breaker;
}

/**
 * Gets all registered circuit breakers.
 */
export function getAllCircuitBreakers(): Map<string, CircuitBreaker> {
  return new Map(breakers);
}

/**
 * Resets all circuit breakers to closed state.
 */
export function resetAllCircuitBreakers(): void {
  for (const breaker of breakers.values()) {
    breaker.reset();
  }
}

/**
 * Clears the global circuit breaker registry.
 * Useful for testing.
 */
export function clearCircuitBreakerRegistry(): void {
  breakers.clear();
}
