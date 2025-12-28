// core/lib/resilience/circuit-breaker.ts
export enum CircuitState {
  CLOSED,
  OPEN,
  HALF_OPEN,
}

/**
 * Prevents cascading failures by stopping calls to a failing service.
 * - **Closed**: Normal operation.
 * - **Open**: Fails immediately without calling the service (after threshold exceeded).
 * - **Half-Open**: Allows a trial call to see if the service has recovered.
 */
export class CircuitBreaker {
  private state = CircuitState.CLOSED;
  private failures = 0;
  private lastFailureTime?: number;

  /**
   * @param {number} [threshold=5] - Number of consecutive failures before opening the circuit.
   * @param {number} [cooldown=30000] - Milliseconds to wait before trying again (Half-Open state).
   */
  constructor(
    private threshold: number = 5,
    private cooldown: number = 30000,
  ) {}

  /**
   * Executes the operation if the circuit is healthy.
   *
   * @template T
   * @param {() => Promise<T>} operation - The async task.
   * @returns {Promise<T>} The result of the operation.
   * @throws {Error} If the circuit is OPEN or the operation fails.
   */
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN && this.lastFailureTime) {
      if (Date.now() - this.lastFailureTime > this.cooldown) {
        this.state = CircuitState.HALF_OPEN;
      } else {
        throw new Error('CIRCUIT_OPEN: Service is temporarily unavailable.');
      }
    }

    try {
      const result = await operation();
      this.reset();
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  private reset() {
    this.failures = 0;
    this.state = CircuitState.CLOSED;
  }

  private recordFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();
    if (this.failures >= this.threshold) {
      this.state = CircuitState.OPEN;
    }
  }
}
