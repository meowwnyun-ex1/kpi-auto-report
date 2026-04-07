"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const database_1 = require("../config/database");
const ApplicationModels_1 = require("../models/ApplicationModels");
const file_upload_1 = require("../middleware/file-upload");
const ImageStorage_1 = require("../utils/ImageStorage");
const logger_1 = require("../utils/logger");
const email_1 = require("../utils/email");
const router = (0, express_1.Router)();
// Get all applications with optional filtering
router.get('/', async (req, res) => {
    try {
        const pool = await (0, database_1.getAppStoreDb)();
        const { status, category_id, limit = 100, offset = 0, sortBy, sortOrder } = req.query;
        // Only apply status filter if it's not 'all' and not empty
        const statusFilter = status && status !== 'all' && status !== '' ? status : undefined;
        const applications = await ApplicationModels_1.ApplicationModel.getAll(pool, {
            status: statusFilter,
            category_id: category_id ? parseInt(category_id, 10) : undefined,
            limit: parseInt(limit, 10),
            offset: parseInt(offset, 10),
            sortBy: typeof sortBy === 'string' ? sortBy : undefined,
            sortOrder: typeof sortOrder === 'string' ? sortOrder : undefined,
        });
        res.json({
            success: true,
            data: applications,
            // Backwards-compatible key for older frontend code
            applications,
            pagination: {
                limit: parseInt(limit, 10),
                offset: parseInt(offset, 10),
                total: applications.length,
            },
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching applications', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch applications',
        });
    }
});
// Get application categories — MUST be defined before /:id to avoid route conflict
router.get('/categories', async (_req, res) => {
    try {
        const pool = await (0, database_1.getAppStoreDb)();
        const result = await pool.request().query(`
        SELECT 
          c.id,
          c.name,
          c.icon,
          COUNT(a.id) as app_count
        FROM categories c
        LEFT JOIN applications a ON c.id = a.category_id AND a.is_active = 1
        WHERE c.is_active = 1
        GROUP BY c.id, c.name, c.icon
        ORDER BY c.name
      `);
        res.json({
            success: true,
            data: result.recordset,
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching categories', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch categories',
        });
    }
});
// Get single application by ID
router.get('/:id', async (req, res) => {
    try {
        const pool = await (0, database_1.getAppStoreDb)();
        const { id } = req.params;
        const application = await ApplicationModels_1.ApplicationModel.getById(pool, parseInt(id, 10));
        if (!application) {
            return res.status(404).json({
                success: false,
                error: 'Application not found',
            });
        }
        res.json({
            success: true,
            data: application,
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching application', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch application',
        });
    }
});
// Create new application
router.post('/', file_upload_1.upload.single('icon'), async (req, res) => {
    try {
        const pool = await (0, database_1.getAppStoreDb)();
        let image_thumbnail;
        let image_small;
        let image_path;
        let image_metadata;
        if (req.file) {
            // Validate image
            const validation = ImageStorage_1.ImageStorage.validateImage(req.file.buffer, 10);
            if (!validation.valid) {
                return res.status(400).json({
                    success: false,
                    error: validation.error,
                });
            }
            // Process image with new optimized system
            const variants = await ImageStorage_1.ImageStorage.processImage(req.file.buffer, 'app', req.file.originalname);
            image_thumbnail = variants.thumbnail;
            image_small = variants.small;
            image_path = variants.original;
            image_metadata = JSON.stringify(variants.metadata);
        }
        // Prepare create data
        const createData = {
            ...req.body,
            image_thumbnail,
            image_small,
            image_path,
            image_metadata,
        };
        // Handle category_id conversion (same as PUT route)
        if (createData.categoryId) {
            createData.category_id = parseInt(createData.categoryId, 10);
            delete createData.categoryId;
        }
        const application = await ApplicationModels_1.ApplicationModel.create(pool, createData);
        // Send email notification for new application submission
        try {
            // Get category name if available
            let categoryName = 'Uncategorized';
            if (createData.category_id) {
                const catResult = await pool
                    .request()
                    .input('categoryId', createData.category_id)
                    .query('SELECT name FROM categories WHERE id = @categoryId');
                if (catResult.recordset.length > 0) {
                    categoryName = catResult.recordset[0].name;
                }
            }
            await (0, email_1.sendApplicationSubmissionEmail)({
                appName: application.name,
                appUrl: application.url,
                category: categoryName,
                submittedBy: req.user?.username || 'Unknown',
                submittedAt: new Date(),
            });
        }
        catch (emailError) {
            // Log email error but don't fail the request
            logger_1.logger.error('Failed to send application submission email', emailError);
        }
        res.status(201).json({
            success: true,
            data: application,
            message: 'Application created successfully',
        });
    }
    catch (error) {
        logger_1.logger.error('Error creating application', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create application',
        });
    }
});
// Update application
router.put('/:id', file_upload_1.upload.single('icon'), async (req, res) => {
    try {
        const pool = await (0, database_1.getAppStoreDb)();
        const { id } = req.params;
        console.log('Updating application:', id);
        console.log('Request body:', req.body);
        console.log('File uploaded:', req.file ? req.file.originalname : 'No file');
        let image_thumbnail;
        let image_small;
        let image_path;
        let image_metadata;
        if (req.file) {
            console.log('Processing new icon file...');
            // Get existing application to delete old image
            const existingApp = await ApplicationModels_1.ApplicationModel.getById(pool, parseInt(Array.isArray(id) ? id[0] : id, 10));
            // Delete old image file if exists
            if (existingApp?.image_path) {
                const oldImagePath = existingApp.image_path;
                // Handle both relative and absolute paths
                const fullPath = oldImagePath.startsWith('/')
                    ? path_1.default.join(process.cwd(), oldImagePath)
                    : oldImagePath;
                try {
                    if (fs_1.default.existsSync(fullPath)) {
                        fs_1.default.unlinkSync(fullPath);
                        console.log('Deleted old image file:', fullPath);
                    }
                }
                catch (deleteError) {
                    console.warn('Failed to delete old image file:', deleteError);
                }
            }
            try {
                // Validate image
                const validation = ImageStorage_1.ImageStorage.validateImage(req.file.buffer, 10);
                if (!validation.valid) {
                    return res.status(400).json({
                        success: false,
                        error: validation.error,
                    });
                }
                // Process image with new optimized system
                const variants = await ImageStorage_1.ImageStorage.processImage(req.file.buffer, 'app', req.file.originalname);
                image_thumbnail = variants.thumbnail;
                image_small = variants.small;
                image_path = variants.original;
                image_metadata = JSON.stringify(variants.metadata);
                console.log('New icon processed successfully');
            }
            catch (imageError) {
                console.error('Error processing image:', imageError);
                return res.status(400).json({
                    success: false,
                    error: 'Failed to process image file',
                });
            }
        }
        // Prepare update data
        const updateData = {
            ...req.body,
            ...(image_thumbnail !== undefined ? { image_thumbnail } : {}),
            ...(image_small !== undefined ? { image_small } : {}),
            ...(image_path !== undefined ? { image_path } : {}),
            ...(image_metadata !== undefined ? { image_metadata } : {}),
        };
        // Handle category_id conversion
        if (updateData.categoryId) {
            updateData.category_id = parseInt(updateData.categoryId, 10);
            delete updateData.categoryId;
        }
        console.log('Final update data:', updateData);
        const application = await ApplicationModels_1.ApplicationModel.update(pool, parseInt(Array.isArray(id) ? id[0] : id, 10), updateData);
        if (!application) {
            return res.status(404).json({
                success: false,
                error: 'Application not found',
            });
        }
        res.json({
            success: true,
            data: application,
            message: 'Application updated successfully',
        });
    }
    catch (error) {
        console.error('Error updating application:', error);
        logger_1.logger.error('Error updating application', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update application',
            details: process.env.NODE_ENV === 'development' && error instanceof Error
                ? error.message
                : undefined,
        });
    }
});
// Delete application
router.delete('/:id', async (req, res) => {
    try {
        const pool = await (0, database_1.getAppStoreDb)();
        const { id } = req.params;
        const deleted = await ApplicationModels_1.ApplicationModel.delete(pool, parseInt(id, 10));
        if (!deleted) {
            return res.status(404).json({
                success: false,
                error: 'Application not found',
            });
        }
        res.json({
            success: true,
            message: 'Application deleted successfully',
        });
    }
    catch (error) {
        logger_1.logger.error('Error deleting application', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete application',
        });
    }
});
// Update view count
router.post('/:id/view', async (req, res) => {
    try {
        const pool = await (0, database_1.getAppStoreDb)();
        const { id } = req.params;
        await ApplicationModels_1.ApplicationModel.updateViewCount(pool, parseInt(id, 10));
        res.json({
            success: true,
            message: 'View count updated',
        });
    }
    catch (error) {
        logger_1.logger.error('Error updating view count', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update view count',
        });
    }
});
exports.default = router;
