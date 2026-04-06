import crypto from 'crypto';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { getCorsOrigins, getRateLimitConfig } from './config/app-config';
import { sanitizeMiddleware } from './middleware/security';
import { requestLogger } from './middleware/request-logger';
import { initializeDatabase, closeDatabase, testConnections } from './config/database';
import { logger } from './utils/logger';
import { AppError, ValidationError as AppValidationError, NotFoundError } from './utils/errors';

// Import routes
import appsRoutes from './routes/apps';
import authRoutes from './routes/auth';
import categoriesRoutes from './routes/categories';
import statsRoutes from './routes/stats';
// import visitorTrackingRoutes from './routes/visitor-tracking'; // Temporarily disabled
import bannersRoutes from './routes/banners';
import tripsRoutes from './routes/trips';
import filesRoutes from './routes/files';

const app = express();
const PORT = parseInt(process.env.API_PORT!);

// ============================================
// Security Headers (helmet)
// ============================================
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'blob:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
    },
  })
);

// ============================================
// Request ID (for tracing)
// ============================================
app.use((req, _res, next) => {
  req.headers['x-request-id'] = req.headers['x-request-id'] || crypto.randomUUID();
  next();
});

// ============================================
// Compression
// ============================================
app.use(compression());

// ============================================
// Request Logging
// ============================================
app.use(requestLogger);

// ============================================
// CORS
// ============================================
app.use(
  cors({
    origin: getCorsOrigins(),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
  })
);

// ============================================
// Rate Limiting
// ============================================
const rateLimitConfig = getRateLimitConfig();
app.use(
  rateLimit({
    ...rateLimitConfig,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// Stricter rate limit for all auth endpoints
const isDev = process.env.NODE_ENV === 'development';
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 500 : 20,
  message: {
    success: false,
    error: 'TOO_MANY_REQUESTS',
    message: 'Too many authentication attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth', authRateLimit);

// Stricter rate limit for write operations
const writeRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 500 : 50,
  message: {
    success: false,
    error: 'TOO_MANY_REQUESTS',
    message: 'Too many write requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/apps', writeRateLimit);
app.use('/api/categories', writeRateLimit);

// ============================================
// Body Parsing (MUST be before sanitization)
// ============================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================
// Input Sanitization (after body parsing so req.body is populated)
// ============================================
app.use(sanitizeMiddleware);

// ============================================
// Static Files
// ============================================
app.use(
  '/uploads',
  express.static('uploads', {
    maxAge: '1d',
    etag: true,
    lastModified: true,
    dotfiles: 'deny',
  })
);

// ============================================
// Health Check (with DB connectivity)
// ============================================
app.get('/api/health', async (_req, res) => {
  try {
    // In development mode, return healthy status even without database
    if (process.env.NODE_ENV === 'development') {
      return res.status(200).json({
        success: true,
        data: {
          status: 'OK',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          environment: process.env.NODE_ENV,
          databases: {
            appStore: 'skipped_development',
          },
          message: 'Development mode - database connection skipped',
        },
      });
    }

    const dbStatus = await testConnections();
    const isHealthy = dbStatus.appStore; // Only require appStore DB in production

    res.status(isHealthy ? 200 : 503).json({
      success: isHealthy,
      data: {
        status: isHealthy ? 'OK' : 'DEGRADED',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
        databases: {
          appStore: dbStatus.appStore ? 'connected' : 'disconnected',
        },
        ...(dbStatus.errors.length > 0 && process.env.NODE_ENV === 'development'
          ? { errors: dbStatus.errors }
          : {}),
      },
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      data: {
        status: 'ERROR',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
});

// ============================================
// API Routes
// ============================================
app.use('/api/apps', appsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/banners', bannersRoutes);
app.use('/api/trips', tripsRoutes);
app.use('/api/files', filesRoutes);
// app.use('/api/visitor-tracking', visitorTrackingRoutes); // Temporarily disabled

// ============================================
// 404 Handler (MUST be before error handler)
// ============================================
app.use('*', (req, _res, next) => {
  next(new NotFoundError('Route', req.originalUrl));
});

// ============================================
// Global Error Handler
// ============================================
app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const requestId = req.headers['x-request-id'] as string;

  // Handle known operational errors
  if (err instanceof AppError) {
    logger.warn(`Operational error: ${err.message}`, {
      code: err.code,
      statusCode: err.statusCode,
      requestId,
    });

    const response: Record<string, unknown> = {
      success: false,
      error: err.code,
      message: err.message,
      ...(requestId ? { requestId } : {}),
    };

    // Include validation details if present
    if (err instanceof AppValidationError && err.details) {
      response.details = err.details;
    }

    return res.status(err.statusCode).json(response);
  }

  // Handle unknown/unexpected errors
  logger.error('Unexpected error', err, { requestId });

  res.status(500).json({
    success: false,
    error: 'INTERNAL_ERROR',
    message:
      process.env.NODE_ENV === 'development'
        ? err instanceof Error
          ? err.message
          : 'Something went wrong'
        : 'An unexpected error occurred',
    ...(requestId ? { requestId } : {}),
  });
});

// ============================================
// Server Startup
// ============================================
let server: ReturnType<typeof app.listen>;

const startServer = async () => {
  try {
    // Import and validate environment variables after dotenv loads
    const { validateEnvironment } = await import('./utils/env-validation');
    validateEnvironment();

    await initializeDatabase();

    server = app.listen(PORT, () => {
      logger.info(`API Server running on port ${PORT}`);
      logger.info(`Health check: http://${process.env.SERVER_IP}:${PORT}/api/health`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);

      // Notify PM2 that app is ready (for zero-downtime deployment)
      if (process.send) {
        process.send('ready');
      }
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
};

// ============================================
// Graceful Shutdown
// ============================================
const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received, shutting down gracefully...`);

  // Stop accepting new connections
  server.close(() => {
    logger.info('HTTP server closed');
  });

  try {
    await closeDatabase();
    logger.info('Database connections closed');
  } catch (error) {
    logger.error('Error during shutdown', error);
  }
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Notify PM2 that app is ready (for zero-downtime deployment)
process.on('message', (msg) => {
  if (msg === 'shutdown') {
    gracefulShutdown('PM2_SHUTDOWN');
  }
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Promise Rejection', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', error);
  process.exit(1);
});

startServer();

export default app;
