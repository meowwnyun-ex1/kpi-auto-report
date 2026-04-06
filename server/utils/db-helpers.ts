import { logger } from './logger';
import { DatabaseError } from './errors';

/**
 * Retry wrapper for database operations.
 * Retries transient failures (connection drops, timeouts) with exponential backoff.
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    baseDelayMs?: number;
    operationName?: string;
  } = {}
): Promise<T> {
  const { maxRetries = 3, baseDelayMs = 500, operationName = 'DB operation' } = options;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: unknown) {
      const isTransient = isTransientError(error);

      if (attempt === maxRetries || !isTransient) {
        logger.error(`${operationName} failed after ${attempt} attempt(s)`, error);
        throw error instanceof DatabaseError
          ? error
          : new DatabaseError(
              `${operationName} failed: ${error instanceof Error ? error.message : String(error)}`
            );
      }

      const delay = baseDelayMs * Math.pow(2, attempt - 1);
      logger.warn(
        `${operationName} failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms`,
        {
          error: error instanceof Error ? error.message : String(error),
        }
      );
      await sleep(delay);
    }
  }

  // Unreachable, but satisfies TypeScript
  throw new DatabaseError(`${operationName} failed after ${maxRetries} retries`);
}

/**
 * Check if a MSSQL error is transient (connection lost, timeout, etc.)
 */
function isTransientError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const transientCodes = [
    'ETIMEOUT',
    'ECONNRESET',
    'ECONNREFUSED',
    'ESOCKET',
    'EREQUEST',
    'ENOCONN',
    'ECONNCLOSED',
  ];

  const msg = error.message.toLowerCase();
  const code = (error as unknown as Record<string, unknown>).code as string | undefined;

  if (code && transientCodes.includes(code)) return true;
  if (msg.includes('connection') && (msg.includes('closed') || msg.includes('lost'))) return true;
  if (msg.includes('timeout')) return true;

  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
