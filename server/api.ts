import crypto from 'crypto';
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { getCorsOrigins, getRateLimitConfig } from './config/app-config';
import { sanitizeMiddleware } from './middleware/security';
import { requestLogger } from './middleware/request-logger';
import auditMiddleware from './middleware/audit-logger';
import { initRealtime } from './realtime/realtime-hub';
import { initializeDatabase, closeDatabase, testConnections } from './config/database';
import { logger } from './utils/logger';
import { AppError, ValidationError as AppValidationError, NotFoundError } from './utils/errors';

// ============================================
// File Upload (multer)
// ============================================
const uploadsDir = path.join(process.cwd(), 'uploads', 'kpi');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
    cb(null, unique + path.extname(file.originalname));
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|pdf|doc|docx|xls|xlsx|ppt|pptx|txt|csv/i;
    const ok =
      allowed.test(path.extname(file.originalname)) &&
      allowed.test(file.mimetype.replace('application/', '').replace('image/', ''));
    cb(
      null,
      ok ||
        file.mimetype.includes('pdf') ||
        file.mimetype.includes('office') ||
        file.mimetype.includes('image')
    );
  },
});

// Import routes
import authRoutes from './routes/auth';
import statsRoutes from './routes/stats';
import departmentsRoutes from './routes/departments';
import kpiCategoriesRoutes from './routes/kpi-categories';
import kpiYearlyRoutes from './routes/kpi-yearly';
import kpiMonthlyRoutes from './routes/kpi-monthly';
import kpiActionPlansRoutes from './routes/kpi-action-plans';
import kpiOverviewRoutes from './routes/kpi-overview';
import adminUsersRoutes from './routes/admin-users';
import exportRoutes from './routes/export';
import measurementsRoutes from './routes/measurements';
import adminCategoriesRoutes from './routes/admin-categories';
import approvalRoutes from './routes/approval';
import kpiResultsRoutes from './routes/kpi-results';
import approvalComprehensiveRoutes from './routes/approval-comprehensive';
import dashboardRoutes from './routes/dashboard';
import employeesRoutes from './routes/employees';

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
// Apply stricter limits to write-heavy KPI endpoints
app.use('/api/kpi-forms', writeRateLimit);
app.use('/api/admin', writeRateLimit);
app.use('/api/approval', writeRateLimit);

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
    const dbStatus = await testConnections();
    const isHealthy = dbStatus.kpi; // Require KPI database

    res.status(isHealthy ? 200 : 503).json({
      success: isHealthy,
      data: {
        status: isHealthy ? 'OK' : 'DEGRADED',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
        databases: {
          kpi: dbStatus.kpi ? 'connected' : 'disconnected',
          cas: dbStatus.cas ? 'connected' : 'disconnected',
          spo: dbStatus.spo ? 'connected' : 'disconnected',
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
// Audit Logging (before routes)
// ============================================
app.use('/api', auditMiddleware);

// ============================================
// API Routes
// ============================================
app.use('/api/auth', authRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/departments', departmentsRoutes);
app.use('/api/kpi-forms', kpiCategoriesRoutes);
app.use('/api/kpi-forms/yearly', kpiYearlyRoutes);
app.use('/api/kpi-forms/monthly', kpiMonthlyRoutes);
app.use('/api/action-plans', kpiActionPlansRoutes);
app.use('/api/kpi-forms/overview', kpiOverviewRoutes);
app.use('/api/admin', adminUsersRoutes);

// File upload endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
  const url = `/uploads/kpi/${req.file.filename}`;
  res.json({
    success: true,
    url,
    originalName: req.file.originalname,
    size: req.file.size,
    mimetype: req.file.mimetype,
  });
});
app.use('/api/export', exportRoutes);
app.use('/api/measurements', measurementsRoutes);
app.use('/api/admin/categories', adminCategoriesRoutes);
app.use('/api/approval', approvalRoutes);
app.use('/api/kpi-results', kpiResultsRoutes);
app.use('/api/approvals', approvalComprehensiveRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/employees', employeesRoutes);
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
    // Ensure audit table exists before serving requests
    try {
      const { ensureAuditTable } = await import('./middleware/audit-logger');
      await ensureAuditTable();
    } catch (e) {
      logger.error('Failed to ensure audit table', e);
    }

    server = app.listen(PORT, () => {
      logger.info(`API Server running on port ${PORT}`);
      logger.info(`Health check: http://${process.env.SERVER_IP}:${PORT}/api/health`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);

      // Realtime WebSocket (authenticated via JWT token)
      try {
        initRealtime(server);
      } catch (e) {
        logger.error('Failed to initialize realtime WS', e);
      }

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
