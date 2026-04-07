"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const database_1 = require("../config/database");
const ApplicationModels_1 = require("../models/ApplicationModels");
const validate_1 = require("../middleware/validate");
const auth_1 = require("../middleware/auth");
const file_upload_1 = require("../middleware/file-upload");
const ImageStorage_1 = require("../utils/ImageStorage");
const validation_schemas_1 = require("../utils/validation-schemas");
const errors_1 = require("../utils/errors");
const logger_1 = require("../utils/logger");
const router = express_1.default.Router();
/**
 * @route GET /api/categories
 * @desc Get all categories
 * @access Public
 */
router.get('/', async (_req, res, next) => {
    try {
        const db = await (0, database_1.getAppStoreDb)();
        const categories = await ApplicationModels_1.CategoryModel.getAll(db, false);
        res.set('Cache-Control', 'public, max-age=300');
        res.json({
            success: true,
            data: categories,
        });
    }
    catch (error) {
        // Handle database connection errors gracefully in development
        const errorMessage = error?.message || '';
        if (errorMessage?.includes('not available') ||
            errorMessage?.includes('connection') ||
            errorMessage?.includes('database') ||
            error?.name === 'ConnectionError') {
            // Return default categories when database is not available
            return res.json({
                success: true,
                data: [
                    {
                        id: 1,
                        name: 'Productivity',
                        icon: 'briefcase',
                        slug: 'productivity',
                        created_at: new Date(),
                        updated_at: new Date(),
                        is_active: true,
                    },
                    {
                        id: 2,
                        name: 'Utilities',
                        icon: 'wrench',
                        slug: 'utilities',
                        created_at: new Date(),
                        updated_at: new Date(),
                        is_active: true,
                    },
                    {
                        id: 3,
                        name: 'Communication',
                        icon: 'message-square',
                        slug: 'communication',
                        created_at: new Date(),
                        updated_at: new Date(),
                        is_active: true,
                    },
                    {
                        id: 4,
                        name: 'Analytics',
                        icon: 'bar-chart',
                        slug: 'analytics',
                        created_at: new Date(),
                        updated_at: new Date(),
                        is_active: true,
                    },
                    {
                        id: 5,
                        name: 'Development',
                        icon: 'code',
                        slug: 'development',
                        created_at: new Date(),
                        updated_at: new Date(),
                        is_active: true,
                    },
                ],
                skipped: true,
                reason: 'database_not_available',
            });
        }
        next(error);
    }
});
/**
 * @route GET /api/categories/:id
 * @desc Get single category by ID
 * @access Public
 */
router.get('/:id', (0, validate_1.validate)(validation_schemas_1.idParamSchema, 'params'), async (req, res, next) => {
    try {
        const db = await (0, database_1.getAppStoreDb)();
        const { id } = req.params;
        const category = await ApplicationModels_1.CategoryModel.getById(db, id);
        if (!category) {
            return next(new errors_1.NotFoundError('Category', id));
        }
        res.json({
            success: true,
            data: category,
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * @route POST /api/categories
 * @desc Create a new category
 * @access Private (admin only)
 */
router.post('/', auth_1.requireAuth, (0, auth_1.requireRole)('admin'), file_upload_1.upload.single('image'), async (req, res, next) => {
    try {
        const db = await (0, database_1.getAppStoreDb)();
        const { name, is_active } = req.body;
        const icon = req.body.icon || '';
        // Process image if uploaded
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
            const variants = await ImageStorage_1.ImageStorage.processImage(req.file.buffer, 'category', req.file.originalname);
            image_thumbnail = variants.thumbnail;
            image_small = variants.small;
            image_path = variants.original;
            image_metadata = JSON.stringify(variants.metadata);
        }
        const newCategory = await ApplicationModels_1.CategoryModel.create(db, {
            name,
            icon: image_thumbnail || icon,
            is_active: is_active === 'true' || is_active === true,
            image_thumbnail,
            image_small,
            image_path,
            image_metadata,
        });
        logger_1.logger.info('Category created', { categoryId: newCategory.id, name: newCategory.name });
        res.status(201).json({
            success: true,
            data: newCategory,
            message: 'Category created successfully',
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * @route PUT /api/categories/:id
 * @desc Update a category
 * @access Private (admin only)
 */
router.put('/:id', auth_1.requireAuth, (0, auth_1.requireRole)('admin'), (0, validate_1.validate)(validation_schemas_1.idParamSchema, 'params'), file_upload_1.upload.single('image'), async (req, res, next) => {
    try {
        const db = await (0, database_1.getAppStoreDb)();
        const { id } = req.params;
        const { name, is_active, keep_existing_image } = req.body;
        const icon = req.body.icon || '';
        logger_1.logger.info('Updating category', {
            categoryId: id,
            name,
            is_active,
            hasImage: !!req.file,
            keepExisting: keep_existing_image,
            iconLength: icon?.length || 0,
        });
        // Validate required fields
        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: 'VALIDATION_ERROR',
                message: 'Category name is required',
            });
        }
        const existingCategory = await ApplicationModels_1.CategoryModel.getById(db, id);
        if (!existingCategory) {
            return next(new errors_1.NotFoundError('Category', id));
        }
        // Process image if uploaded
        let image_thumbnail;
        let image_small;
        let image_path;
        let image_metadata;
        if (req.file) {
            // Delete old image file if exists
            if (existingCategory.image_path) {
                const oldImagePath = existingCategory.image_path;
                const fullPath = oldImagePath.startsWith('/')
                    ? path_1.default.join(process.cwd(), oldImagePath)
                    : oldImagePath;
                try {
                    if (fs_1.default.existsSync(fullPath)) {
                        fs_1.default.unlinkSync(fullPath);
                        console.log('Deleted old category image:', fullPath);
                    }
                }
                catch (deleteError) {
                    console.warn('Failed to delete old category image:', deleteError);
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
                const variants = await ImageStorage_1.ImageStorage.processImage(req.file.buffer, 'category', req.file.originalname);
                image_thumbnail = variants.thumbnail;
                image_small = variants.small;
                image_path = variants.original;
                image_metadata = JSON.stringify(variants.metadata);
                logger_1.logger.info('Category image processed', {
                    categoryId: id,
                    thumbnailSize: variants.metadata.thumbnailSize,
                    hasOriginal: variants.metadata.hasOriginal,
                });
            }
            catch (imgError) {
                logger_1.logger.error('Failed to process category image', { error: imgError.message });
                return res.status(400).json({
                    success: false,
                    error: 'IMAGE_PROCESSING_ERROR',
                    message: 'Failed to process image. Please try a different image.',
                });
            }
        }
        // Use existing image if no new image and keep_existing_image is set
        const finalIcon = image_thumbnail || (keep_existing_image ? existingCategory.icon : icon);
        const updateData = {
            name: name.trim(),
        };
        if (finalIcon !== undefined) {
            updateData.icon = finalIcon;
        }
        if (is_active !== undefined) {
            updateData.is_active = is_active === 'true' || is_active === true;
        }
        if (image_thumbnail !== undefined)
            updateData.image_thumbnail = image_thumbnail;
        if (image_small !== undefined)
            updateData.image_small = image_small;
        if (image_path !== undefined)
            updateData.image_path = image_path;
        if (image_metadata !== undefined)
            updateData.image_metadata = image_metadata;
        logger_1.logger.info('Calling CategoryModel.update', {
            categoryId: id,
            updateData: {
                ...updateData,
                icon: updateData.icon ? `[${updateData.icon.length} chars]` : undefined,
            },
        });
        const updatedCategory = await ApplicationModels_1.CategoryModel.update(db, id, updateData);
        logger_1.logger.info('Category updated', { categoryId: id, updatedBy: req.user?.username });
        res.json({
            success: true,
            data: updatedCategory,
            message: 'Category updated successfully',
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to update category', {
            error: error.message,
            stack: error.stack,
            categoryId: req.params.id,
            body: req.body,
        });
        next(error);
    }
});
/**
 * @route DELETE /api/categories/:id
 * @desc Delete a category (only if no applications are assigned)
 * @access Private (admin only)
 */
router.delete('/:id', auth_1.requireAuth, (0, auth_1.requireRole)('admin'), (0, validate_1.validate)(validation_schemas_1.idParamSchema, 'params'), async (req, res, next) => {
    try {
        const db = await (0, database_1.getAppStoreDb)();
        const { id } = req.params;
        const existingCategory = await ApplicationModels_1.CategoryModel.getById(db, id);
        if (!existingCategory) {
            return next(new errors_1.NotFoundError('Category', id));
        }
        await ApplicationModels_1.CategoryModel.delete(db, id);
        logger_1.logger.info('Category deleted', { categoryId: id, deletedBy: req.user?.username });
        res.json({
            success: true,
            message: 'Category deleted successfully',
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
