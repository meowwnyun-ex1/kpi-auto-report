"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateFile = exports.sanitizeMiddleware = exports.sanitizeNumber = exports.sanitizeUrl = exports.sanitizeEmail = exports.sanitizeString = exports.sanitizeHtml = void 0;
const validator_1 = __importDefault(require("validator"));
// Sanitize HTML content to prevent XSS (simplified for KPI - no rich text needed)
const sanitizeHtml = (content) => {
    if (!content || typeof content !== 'string')
        return '';
    // KPI system doesn't need rich HTML - just escape all HTML
    return validator_1.default.escape(content);
};
exports.sanitizeHtml = sanitizeHtml;
// Sanitize string input
const sanitizeString = (input, options = {}) => {
    if (!input || typeof input !== 'string')
        return '';
    const { maxLength = 1000, allowHtml = false, trim = true } = options;
    let sanitized = input;
    if (trim) {
        sanitized = sanitized.trim();
    }
    if (!allowHtml) {
        sanitized = validator_1.default.escape(sanitized);
    }
    if (maxLength && sanitized.length > maxLength) {
        sanitized = sanitized.substring(0, maxLength);
    }
    return sanitized;
};
exports.sanitizeString = sanitizeString;
// Validate and sanitize email
const sanitizeEmail = (email) => {
    if (!email || typeof email !== 'string')
        return '';
    const sanitized = email.trim().toLowerCase();
    return validator_1.default.isEmail(sanitized) ? sanitized : '';
};
exports.sanitizeEmail = sanitizeEmail;
// Validate and sanitize URL
const sanitizeUrl = (url) => {
    if (!url || typeof url !== 'string')
        return '';
    const sanitized = url.trim();
    // Allow valid http/https URLs through; for other values, strip dangerous chars but preserve the value
    // (Zod schema handles strict validation; sanitizer only prevents injection)
    if (validator_1.default.isURL(sanitized, { protocols: ['http', 'https'], require_protocol: false })) {
        return sanitized;
    }
    // Fallback: escape the value rather than silently dropping it
    return validator_1.default.escape(sanitized);
};
exports.sanitizeUrl = sanitizeUrl;
// Validate and sanitize numeric input
const sanitizeNumber = (input, options = {}) => {
    const { min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER, integer = false } = options;
    let num = parseFloat(String(input));
    if (isNaN(num))
        return null;
    if (integer)
        num = Math.floor(num);
    if (num < min || num > max)
        return null;
    return num;
};
exports.sanitizeNumber = sanitizeNumber;
// Middleware to sanitize request body
const sanitizeMiddleware = (req, _res, next) => {
    try {
        if (req.body) {
            // Recursively sanitize object
            const sanitizeObject = (obj) => {
                if (typeof obj !== 'object' || obj === null)
                    return obj;
                if (Array.isArray(obj)) {
                    return obj.map((item) => sanitizeObject(item));
                }
                const sanitized = {};
                const skipFields = ['password', 'password_hash', 'token', 'authorization'];
                for (const [key, value] of Object.entries(obj)) {
                    if (typeof value === 'string') {
                        // Never sanitize sensitive fields - they need exact values
                        if (skipFields.includes(key.toLowerCase())) {
                            sanitized[key] = value;
                        }
                        else if (key.includes('email')) {
                            sanitized[key] = (0, exports.sanitizeEmail)(value);
                        }
                        else if (key === 'url' || key.endsWith('_url')) {
                            sanitized[key] = (0, exports.sanitizeUrl)(value);
                        }
                        else if (key.includes('description') || key.includes('content')) {
                            sanitized[key] = (0, exports.sanitizeHtml)(value);
                        }
                        else {
                            sanitized[key] = (0, exports.sanitizeString)(value, { maxLength: 5000 });
                        }
                    }
                    else if (typeof value === 'object') {
                        sanitized[key] = sanitizeObject(value);
                    }
                    else {
                        sanitized[key] = value;
                    }
                }
                return sanitized;
            };
            req.body = sanitizeObject(req.body);
        }
        next();
    }
    catch (error) {
        next(new Error('Invalid input data'));
    }
};
exports.sanitizeMiddleware = sanitizeMiddleware;
// Validate file upload
const validateFile = (file, options = {}) => {
    const { maxSize = 5 * 1024 * 1024, // 5MB
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/ico'], allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.ico'], } = options;
    if (!file)
        return { valid: false, error: 'No file provided' };
    // Check file size
    if (file.size > maxSize) {
        return { valid: false, error: `File size exceeds ${maxSize / 1024 / 1024}MB limit` };
    }
    // Check MIME type
    if (!allowedTypes.includes(file.mimetype)) {
        return { valid: false, error: 'File type not allowed' };
    }
    // Check file extension
    const extension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
    if (!allowedExtensions.includes(extension)) {
        return { valid: false, error: 'File extension not allowed' };
    }
    // Check filename for suspicious characters
    const filename = file.originalname;
    if (!/^[a-zA-Z0-9._-]+$/.test(filename)) {
        return { valid: false, error: 'Filename contains invalid characters' };
    }
    return { valid: true };
};
exports.validateFile = validateFile;
exports.default = {
    sanitizeHtml: exports.sanitizeHtml,
    sanitizeString: exports.sanitizeString,
    sanitizeEmail: exports.sanitizeEmail,
    sanitizeUrl: exports.sanitizeUrl,
    sanitizeNumber: exports.sanitizeNumber,
    sanitizeMiddleware: exports.sanitizeMiddleware,
    validateFile: exports.validateFile,
};
