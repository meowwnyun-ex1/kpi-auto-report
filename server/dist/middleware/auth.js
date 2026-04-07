"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.optionalAuth = exports.requireAuth = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const errors_1 = require("../utils/errors");
const logger_1 = require("../utils/logger");
/**
 * Middleware that requires a valid JWT token.
 * Attaches decoded payload to req.user.
 */
const requireAuth = (req, _res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new errors_1.AuthenticationError('No authentication token provided');
        }
        const token = authHeader.substring(7);
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            logger_1.logger.error('JWT_SECRET is not configured');
            throw new errors_1.AuthenticationError('Server authentication configuration error');
        }
        if (jwtSecret === 'CHANGE_ME_TO_A_STRONG_RANDOM_SECRET_MINIMUM_32_CHARACTERS') {
            logger_1.logger.error('JWT_SECRET is using the default placeholder value');
            throw new errors_1.AuthenticationError('Server authentication not properly configured');
        }
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        req.user = decoded;
        next();
    }
    catch (error) {
        if (error instanceof errors_1.AuthenticationError) {
            next(error);
        }
        else if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            next(new errors_1.AuthenticationError('Token has expired'));
        }
        else if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            next(new errors_1.AuthenticationError('Invalid token'));
        }
        else if (error instanceof jsonwebtoken_1.default.NotBeforeError) {
            next(new errors_1.AuthenticationError('Token not active'));
        }
        else {
            logger_1.logger.error('Unexpected authentication error:', error);
            next(new errors_1.AuthenticationError('Authentication failed'));
        }
    }
};
exports.requireAuth = requireAuth;
/**
 * Middleware that optionally attaches user if token is present.
 * Does NOT reject requests without a token.
 */
const optionalAuth = (req, _res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next();
        }
        const token = authHeader.substring(7);
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            return next();
        }
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        req.user = decoded;
        next();
    }
    catch {
        // Token invalid/expired — proceed without user
        next();
    }
};
exports.optionalAuth = optionalAuth;
/**
 * Middleware factory that requires a specific role.
 * Must be used AFTER requireAuth.
 */
const requireRole = (...roles) => {
    return (req, _res, next) => {
        if (!req.user) {
            return next(new errors_1.AuthenticationError('Authentication required'));
        }
        if (!roles.includes(req.user.role)) {
            return next(new errors_1.AuthorizationError(`Role '${req.user.role}' does not have access to this resource`));
        }
        next();
    };
};
exports.requireRole = requireRole;
