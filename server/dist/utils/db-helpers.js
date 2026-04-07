"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withRetry = withRetry;
const logger_1 = require("./logger");
const errors_1 = require("./errors");
/**
 * Retry wrapper for database operations.
 * Retries transient failures (connection drops, timeouts) with exponential backoff.
 */
async function withRetry(operation, options = {}) {
    const { maxRetries = 3, baseDelayMs = 500, operationName = 'DB operation' } = options;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        }
        catch (error) {
            const isTransient = isTransientError(error);
            if (attempt === maxRetries || !isTransient) {
                logger_1.logger.error(`${operationName} failed after ${attempt} attempt(s)`, error);
                throw error instanceof errors_1.DatabaseError
                    ? error
                    : new errors_1.DatabaseError(`${operationName} failed: ${error instanceof Error ? error.message : String(error)}`);
            }
            const delay = baseDelayMs * Math.pow(2, attempt - 1);
            logger_1.logger.warn(`${operationName} failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms`, {
                error: error instanceof Error ? error.message : String(error),
            });
            await sleep(delay);
        }
    }
    // Unreachable, but satisfies TypeScript
    throw new errors_1.DatabaseError(`${operationName} failed after ${maxRetries} retries`);
}
/**
 * Check if a MSSQL error is transient (connection lost, timeout, etc.)
 */
function isTransientError(error) {
    if (!(error instanceof Error))
        return false;
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
    const code = error.code;
    if (code && transientCodes.includes(code))
        return true;
    if (msg.includes('connection') && (msg.includes('closed') || msg.includes('lost')))
        return true;
    if (msg.includes('timeout'))
        return true;
    return false;
}
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
