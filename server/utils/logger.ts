type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const getConfiguredLevel = (): LogLevel => {
  const level = (process.env.LOG_LEVEL || 'info').toLowerCase() as LogLevel;
  return LOG_LEVELS[level] !== undefined ? level : 'info';
};

const isProduction = () => process.env.NODE_ENV === 'production';

const formatTimestamp = (): string => {
  return new Date().toISOString();
};

const maskSensitiveData = (data: Record<string, unknown>): Record<string, unknown> => {
  const sensitiveKeys = ['password', 'password_hash', 'token', 'secret', 'authorization', 'cookie'];
  const masked: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    if (sensitiveKeys.some((sk) => key.toLowerCase().includes(sk))) {
      masked[key] = '***REDACTED***';
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      masked[key] = maskSensitiveData(value as Record<string, unknown>);
    } else {
      masked[key] = value;
    }
  }

  return masked;
};

const shouldLog = (level: LogLevel): boolean => {
  const configuredLevel = getConfiguredLevel();
  return LOG_LEVELS[level] >= LOG_LEVELS[configuredLevel];
};

const formatMessage = (
  level: LogLevel,
  message: string,
  meta?: Record<string, unknown>
): string => {
  const timestamp = formatTimestamp();
  const metaStr = meta ? ` ${JSON.stringify(maskSensitiveData(meta))}` : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
};

export const logger = {
  debug(message: string, meta?: Record<string, unknown>): void {
    if (shouldLog('debug')) {
      console.debug(formatMessage('debug', message, meta));
    }
  },

  info(message: string, meta?: Record<string, unknown>): void {
    if (shouldLog('info')) {
      console.info(formatMessage('info', message, meta));
    }
  },

  warn(message: string, meta?: Record<string, unknown>): void {
    if (shouldLog('warn')) {
      console.warn(formatMessage('warn', message, meta));
    }
  },

  error(message: string, error?: unknown, meta?: Record<string, unknown>): void {
    if (shouldLog('error')) {
      const errorMeta: Record<string, unknown> = { ...meta };

      if (error instanceof Error) {
        errorMeta.errorMessage = error.message;
        if (!isProduction()) {
          errorMeta.stack = error.stack;
        }
      } else if (error !== undefined) {
        errorMeta.errorMessage = String(error);
      }

      console.error(formatMessage('error', message, errorMeta));
    }
  },

  /** Log HTTP request (for middleware use) */
  request(
    method: string,
    url: string,
    statusCode: number,
    durationMs: number,
    requestId?: string
  ): void {
    if (shouldLog('info')) {
      const meta: Record<string, unknown> = { method, url, statusCode, durationMs };
      if (requestId) meta.requestId = requestId;
      const level: LogLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
      if (shouldLog(level)) {
        console[level](
          formatMessage(level, `${method} ${url} ${statusCode} ${durationMs}ms`, meta)
        );
      }
    }
  },
};

export default logger;
