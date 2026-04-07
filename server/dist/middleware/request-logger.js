"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLogger = void 0;
const logger_1 = require("../utils/logger");
/**
 * Middleware that logs every HTTP request with method, URL, status code, duration, and request ID.
 */
const requestLogger = (req, res, next) => {
    const start = Date.now();
    const requestId = req.headers['x-request-id'];
    // Set request ID in response header for client-side tracing
    if (requestId) {
        res.setHeader('X-Request-ID', requestId);
    }
    // Log when response finishes
    res.on('finish', () => {
        const duration = Date.now() - start;
        logger_1.logger.request(req.method, req.originalUrl, res.statusCode, duration, requestId);
    });
    next();
};
exports.requestLogger = requestLogger;
