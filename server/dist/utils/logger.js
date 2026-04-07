"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const LOG_LEVELS = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
};
const getConfiguredLevel = () => {
    const level = (process.env.LOG_LEVEL || 'info').toLowerCase();
    return LOG_LEVELS[level] !== undefined ? level : 'info';
};
const isProduction = () => process.env.NODE_ENV === 'production';
const formatTimestamp = () => {
    return new Date().toISOString();
};
const maskSensitiveData = (data) => {
    const sensitiveKeys = ['password', 'password_hash', 'token', 'secret', 'authorization', 'cookie'];
    const masked = {};
    for (const [key, value] of Object.entries(data)) {
        if (sensitiveKeys.some((sk) => key.toLowerCase().includes(sk))) {
            masked[key] = '***REDACTED***';
        }
        else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            masked[key] = maskSensitiveData(value);
        }
        else {
            masked[key] = value;
        }
    }
    return masked;
};
const shouldLog = (level) => {
    const configuredLevel = getConfiguredLevel();
    return LOG_LEVELS[level] >= LOG_LEVELS[configuredLevel];
};
const formatMessage = (level, message, meta) => {
    const timestamp = formatTimestamp();
    const metaStr = meta ? ` ${JSON.stringify(maskSensitiveData(meta))}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
};
exports.logger = {
    debug(message, meta) {
        if (shouldLog('debug')) {
            console.debug(formatMessage('debug', message, meta));
        }
    },
    info(message, meta) {
        if (shouldLog('info')) {
            console.info(formatMessage('info', message, meta));
        }
    },
    warn(message, meta) {
        if (shouldLog('warn')) {
            console.warn(formatMessage('warn', message, meta));
        }
    },
    error(message, error, meta) {
        if (shouldLog('error')) {
            const errorMeta = { ...meta };
            if (error instanceof Error) {
                errorMeta.errorMessage = error.message;
                if (!isProduction()) {
                    errorMeta.stack = error.stack;
                }
            }
            else if (error !== undefined) {
                errorMeta.errorMessage = String(error);
            }
            console.error(formatMessage('error', message, errorMeta));
        }
    },
    /** Log HTTP request (for middleware use) */
    request(method, url, statusCode, durationMs, requestId) {
        if (shouldLog('info')) {
            const meta = { method, url, statusCode, durationMs };
            if (requestId)
                meta.requestId = requestId;
            const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
            if (shouldLog(level)) {
                console[level](formatMessage(level, `${method} ${url} ${statusCode} ${durationMs}ms`, meta));
            }
        }
    },
};
exports.default = exports.logger;
