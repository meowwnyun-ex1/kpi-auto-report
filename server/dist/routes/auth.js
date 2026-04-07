"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../config/database");
const validate_1 = require("../middleware/validate");
const auth_1 = require("../middleware/auth");
const validation_schemas_1 = require("../utils/validation-schemas");
const errors_1 = require("../utils/errors");
const logger_1 = require("../utils/logger");
const router = express_1.default.Router();
/**
 * @route POST /api/auth/login
 * @desc Authenticate user and return JWT token
 * @access Public
 */
router.post('/login', (0, validate_1.validate)(validation_schemas_1.loginSchema), async (req, res, next) => {
    try {
        const db = await (0, database_1.getAppStoreDb)();
        const { username, password } = req.body;
        const result = await db.request().input('username', username).query(`
        SELECT id, username, email, password_hash, full_name, role, is_active
        FROM users 
        WHERE username = @username AND is_active = 1
      `);
        if (result.recordset.length === 0) {
            logger_1.logger.warn('Login attempt with invalid username', { username });
            return next(new errors_1.AuthenticationError('Invalid credentials'));
        }
        const user = result.recordset[0];
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.password_hash || '');
        if (!isPasswordValid) {
            logger_1.logger.warn('Login attempt with invalid password', { username, userId: user.id });
            return next(new errors_1.AuthenticationError('Invalid credentials'));
        }
        // Update last login (non-critical, continue on error)
        try {
            await db.request().input('id', user.id).query(`
          UPDATE users 
          SET last_login = GETDATE() 
          WHERE id = @id
        `);
        }
        catch (updateError) {
            logger_1.logger.warn('Could not update last_login', { userId: user.id, error: updateError });
        }
        // JWT_SECRET must be configured in production
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            logger_1.logger.error('JWT_SECRET is not configured');
            return next(new errors_1.DatabaseError('Server authentication configuration error'));
        }
        if (jwtSecret === 'CHANGE_ME_TO_A_STRONG_RANDOM_SECRET_MINIMUM_32_CHARACTERS') {
            logger_1.logger.error('JWT_SECRET is using the default placeholder value');
            return next(new errors_1.DatabaseError('Server authentication not properly configured'));
        }
        const token = jsonwebtoken_1.default.sign({
            userId: user.id,
            username: user.username,
            role: user.role,
        }, jwtSecret, { expiresIn: process.env.JWT_EXPIRES_IN || '24h' });
        const { password_hash, ...userWithoutPassword } = user;
        logger_1.logger.info('User logged in', { userId: user.id, username: user.username });
        res.json({
            success: true,
            data: {
                user: userWithoutPassword,
                token,
            },
            message: 'Login successful',
        });
    }
    catch (error) {
        logger_1.logger.error('Auth login error', error);
        next(error);
    }
});
/**
 * @route POST /api/auth/logout
 * @desc Logout user (client-side token removal)
 * @access Public
 */
router.post('/logout', (_req, res) => {
    res.json({
        success: true,
        message: 'Logout successful',
    });
});
/**
 * @route GET /api/auth/me
 * @desc Get current authenticated user profile
 * @access Private
 */
router.get('/me', auth_1.requireAuth, async (req, res, next) => {
    try {
        const db = await (0, database_1.getAppStoreDb)();
        const result = await db.request().input('userId', req.user.userId).query(`
        SELECT id, username, email, full_name, role, is_active, created_at
        FROM users 
        WHERE id = @userId AND is_active = 1
      `);
        if (result.recordset.length === 0) {
            return next(new errors_1.AuthenticationError('User not found or inactive'));
        }
        const user = result.recordset[0];
        res.json({
            success: true,
            data: user,
        });
    }
    catch (error) {
        logger_1.logger.error('Auth me error', error);
        next(error);
    }
});
exports.default = router;
