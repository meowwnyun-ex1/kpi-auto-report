"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userIdParamSchema = exports.appIdParamSchema = exports.idParamSchema = exports.updateCategorySchema = exports.createCategorySchema = exports.appQuerySchema = exports.updateAppSchema = exports.createAppSchema = exports.loginSchema = void 0;
const v4_1 = require("zod/v4");
// ============================================
// Auth Schemas
// ============================================
exports.loginSchema = v4_1.z.object({
    username: v4_1.z.string().min(1, 'Username is required').max(100),
    password: v4_1.z.string().min(1, 'Password is required').max(200),
});
// ============================================
// Application Schemas
// ============================================
exports.createAppSchema = v4_1.z.object({
    name: v4_1.z.string().min(1, 'Name is required').max(200),
    category: v4_1.z.string().optional().nullable(),
    url: v4_1.z.string().url('Invalid URL format').optional().nullable(),
});
exports.updateAppSchema = v4_1.z.object({
    name: v4_1.z.string().min(1).max(200).optional(),
    category: v4_1.z.string().optional().nullable(),
    url: v4_1.z.string().max(2000).optional(),
    status: v4_1.z.enum(['pending', 'approved', 'rejected']).optional(),
    keep_existing_icon: v4_1.z.string().optional(),
});
exports.appQuerySchema = v4_1.z.object({
    page: v4_1.z.coerce.number().int().positive().default(1),
    limit: v4_1.z.coerce.number().int().positive().max(500).default(20),
    search: v4_1.z.string().max(200).optional().default(''),
    category: v4_1.z.string().max(50).optional().default(''),
    sortBy: v4_1.z
        .enum(['name', 'created_at', 'updated_at', 'view_count'])
        .optional()
        .default('created_at'),
    sortOrder: v4_1.z.enum(['ASC', 'DESC', 'asc', 'desc']).optional().default('DESC'),
    status: v4_1.z.string().max(20).optional().default('approved'),
});
// ============================================
// Category Schemas
// ============================================
exports.createCategorySchema = v4_1.z.object({
    name: v4_1.z.string().min(1, 'Category name is required').max(200),
    icon: v4_1.z.string().max(500).optional().nullable(),
});
exports.updateCategorySchema = v4_1.z.object({
    name: v4_1.z.string().min(1).max(200).optional(),
    icon: v4_1.z.string().max(500).optional().nullable(),
});
// ============================================
// Common Param Schemas
// ============================================
exports.idParamSchema = v4_1.z.object({
    id: v4_1.z.coerce.number().int().positive('Invalid ID'),
});
exports.appIdParamSchema = v4_1.z.object({
    appId: v4_1.z.coerce.number().int().positive('Invalid app ID'),
});
exports.userIdParamSchema = v4_1.z.object({
    userId: v4_1.z.coerce.number().int().positive('Invalid user ID'),
});
