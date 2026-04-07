"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = __importDefault(require("crypto"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const app_config_1 = require("./config/app-config");
const security_1 = require("./middleware/security");
const request_logger_1 = require("./middleware/request-logger");
const database_1 = require("./config/database");
const logger_1 = require("./utils/logger");
const errors_1 = require("./utils/errors");
// Import routes
const auth_1 = __importDefault(require("./routes/auth"));
const stats_1 = __importDefault(require("./routes/stats"));
// import visitorTrackingRoutes from './routes/visitor-tracking'; // Temporarily disabled
const kpi_1 = __importDefault(require("./routes/kpi"));
const delivery_1 = __importDefault(require("./routes/delivery"));
const compliance_1 = __importDefault(require("./routes/compliance"));
const hr_1 = __importDefault(require("./routes/hr"));
const attractive_1 = __importDefault(require("./routes/attractive"));
const environment_1 = __importDefault(require("./routes/environment"));
const cost_1 = __importDefault(require("./routes/cost"));
const safety_1 = __importDefault(require("./routes/safety"));
const quality_1 = __importDefault(require("./routes/quality"));
const app = (0, express_1.default)();
const PORT = parseInt(process.env.API_PORT);
// ============================================
// Security Headers (helmet)
// ============================================
app.use((0, helmet_1.default)({
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
}));
// ============================================
// Request ID (for tracing)
// ============================================
app.use((req, _res, next) => {
    req.headers['x-request-id'] = req.headers['x-request-id'] || crypto_1.default.randomUUID();
    next();
});
// ============================================
// Compression
// ============================================
app.use((0, compression_1.default)());
// ============================================
// Request Logging
// ============================================
app.use(request_logger_1.requestLogger);
// ============================================
// CORS
// ============================================
app.use((0, cors_1.default)({
    origin: (0, app_config_1.getCorsOrigins)(),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
}));
// ============================================
// Rate Limiting
// ============================================
const rateLimitConfig = (0, app_config_1.getRateLimitConfig)();
app.use((0, express_rate_limit_1.default)({
    ...rateLimitConfig,
    standardHeaders: true,
    legacyHeaders: false,
}));
// Stricter rate limit for all auth endpoints
const isDev = process.env.NODE_ENV === 'development';
const authRateLimit = (0, express_rate_limit_1.default)({
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
const writeRateLimit = (0, express_rate_limit_1.default)({
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
// KPI write rate limit will be added here
// app.use('/api/kpi', writeRateLimit);
// ============================================
// Body Parsing (MUST be before sanitization)
// ============================================
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// ============================================
// Input Sanitization (after body parsing so req.body is populated)
// ============================================
app.use(security_1.sanitizeMiddleware);
// ============================================
// Static Files
// ============================================
app.use('/uploads', express_1.default.static('uploads', {
    maxAge: '1d',
    etag: true,
    lastModified: true,
    dotfiles: 'deny',
}));
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
                        kpi: 'skipped_development',
                    },
                    message: 'Development mode - database connection skipped',
                },
            });
        }
        const dbStatus = await (0, database_1.testConnections)();
        const isHealthy = dbStatus.appStore || dbStatus.kpi; // Require at least one DB
        res.status(isHealthy ? 200 : 503).json({
            success: isHealthy,
            data: {
                status: isHealthy ? 'OK' : 'DEGRADED',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                environment: process.env.NODE_ENV,
                databases: {
                    appStore: dbStatus.appStore ? 'connected' : 'disconnected',
                    kpi: dbStatus.kpi ? 'connected' : 'disconnected',
                },
                ...(dbStatus.errors.length > 0 && process.env.NODE_ENV === 'development'
                    ? { errors: dbStatus.errors }
                    : {}),
            },
        });
    }
    catch (error) {
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
app.use('/api/auth', auth_1.default);
app.use('/api/stats', stats_1.default);
app.use('/api/kpi', kpi_1.default);
app.use('/api/delivery', delivery_1.default);
app.use('/api/compliance', compliance_1.default);
app.use('/api/hr', hr_1.default);
app.use('/api/attractive', attractive_1.default);
app.use('/api/environment', environment_1.default);
app.use('/api/cost', cost_1.default);
app.use('/api/safety', safety_1.default);
app.use('/api/quality', quality_1.default);
// app.use('/api/visitor-tracking', visitorTrackingRoutes); // Temporarily disabled
// ============================================
// 404 Handler (MUST be before error handler)
// ============================================
app.use('*', (req, _res, next) => {
    next(new errors_1.NotFoundError('Route', req.originalUrl));
});
// ============================================
// Global Error Handler
// ============================================
app.use((err, req, res, _next) => {
    const requestId = req.headers['x-request-id'];
    // Handle known operational errors
    if (err instanceof errors_1.AppError) {
        logger_1.logger.warn(`Operational error: ${err.message}`, {
            code: err.code,
            statusCode: err.statusCode,
            requestId,
        });
        const response = {
            success: false,
            error: err.code,
            message: err.message,
            ...(requestId ? { requestId } : {}),
        };
        // Include validation details if present
        if (err instanceof errors_1.ValidationError && err.details) {
            response.details = err.details;
        }
        return res.status(err.statusCode).json(response);
    }
    // Handle unknown/unexpected errors
    logger_1.logger.error('Unexpected error', err, { requestId });
    res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: process.env.NODE_ENV === 'development'
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
let server;
const startServer = async () => {
    try {
        // Import and validate environment variables after dotenv loads
        const { validateEnvironment } = await Promise.resolve().then(() => __importStar(require('./utils/env-validation')));
        validateEnvironment();
        await (0, database_1.initializeDatabase)();
        server = app.listen(PORT, () => {
            logger_1.logger.info(`API Server running on port ${PORT}`);
            logger_1.logger.info(`Health check: http://${process.env.SERVER_IP}:${PORT}/api/health`);
            logger_1.logger.info(`Environment: ${process.env.NODE_ENV}`);
            // Notify PM2 that app is ready (for zero-downtime deployment)
            if (process.send) {
                process.send('ready');
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to start server', error);
        process.exit(1);
    }
};
// ============================================
// Graceful Shutdown
// ============================================
const gracefulShutdown = async (signal) => {
    logger_1.logger.info(`${signal} received, shutting down gracefully...`);
    // Stop accepting new connections
    server.close(() => {
        logger_1.logger.info('HTTP server closed');
    });
    try {
        await (0, database_1.closeDatabase)();
        logger_1.logger.info('Database connections closed');
    }
    catch (error) {
        logger_1.logger.error('Error during shutdown', error);
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
    logger_1.logger.error('Unhandled Promise Rejection', reason);
});
process.on('uncaughtException', (error) => {
    logger_1.logger.error('Uncaught Exception', error);
    process.exit(1);
});
startServer();
exports.default = app;
