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
const router = (0, express_1.Router)();
// Get all trips
router.get('/', async (req, res) => {
    try {
        const pool = await (0, database_1.getAppStoreDb)();
        const { active = 'true' } = req.query;
        const trips = await ApplicationModels_1.TripModel.getAll(pool, active === 'true');
        res.json({
            success: true,
            data: trips,
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching trips', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch trips',
        });
    }
});
// Get single trip by ID
router.get('/:id', async (req, res) => {
    try {
        const pool = await (0, database_1.getAppStoreDb)();
        const { id } = req.params;
        const trip = await ApplicationModels_1.TripModel.getById(pool, parseInt(id));
        if (!trip) {
            return res.status(404).json({
                success: false,
                error: 'Trip not found',
            });
        }
        res.json({
            success: true,
            data: trip,
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching trip', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch trip',
        });
    }
});
// Create new trip
router.post('/', file_upload_1.upload.single('image'), async (req, res) => {
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
            const variants = await ImageStorage_1.ImageStorage.processImage(req.file.buffer, 'trip', req.file.originalname);
            image_thumbnail = variants.thumbnail;
            image_small = variants.small;
            image_path = variants.original;
            image_metadata = JSON.stringify(variants.metadata);
        }
        const trip = await ApplicationModels_1.TripModel.create(pool, {
            title: req.body.title,
            link_url: req.body.link_url || undefined,
            image_thumbnail,
            image_small,
            image_path,
            image_metadata,
            is_active: req.body.is_active === 'true' || req.body.is_active === true,
            sort_order: parseInt(req.body.sort_order, 10) || 0,
        });
        res.status(201).json({
            success: true,
            data: trip,
            message: 'Trip created successfully',
        });
    }
    catch (error) {
        logger_1.logger.error('Error creating trip', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create trip',
        });
    }
});
// Update trip
router.put('/:id', file_upload_1.upload.single('image'), async (req, res) => {
    try {
        const pool = await (0, database_1.getAppStoreDb)();
        const { id } = req.params;
        let image_thumbnail;
        let image_small;
        let image_path;
        let image_metadata;
        if (req.file) {
            // Get existing trip to delete old image
            const existingTrip = await ApplicationModels_1.TripModel.getById(pool, parseInt(Array.isArray(id) ? id[0] : id, 10));
            // Delete old image file if exists
            if (existingTrip?.image_path) {
                const oldImagePath = existingTrip.image_path;
                const fullPath = oldImagePath.startsWith('/')
                    ? path_1.default.join(process.cwd(), oldImagePath)
                    : oldImagePath;
                try {
                    if (fs_1.default.existsSync(fullPath)) {
                        fs_1.default.unlinkSync(fullPath);
                        console.log('Deleted old trip image:', fullPath);
                    }
                }
                catch (deleteError) {
                    console.warn('Failed to delete old trip image:', deleteError);
                }
            }
            // Validate image
            const validation = ImageStorage_1.ImageStorage.validateImage(req.file.buffer, 10);
            if (!validation.valid) {
                return res.status(400).json({
                    success: false,
                    error: validation.error,
                });
            }
            // Process image with new optimized system
            const variants = await ImageStorage_1.ImageStorage.processImage(req.file.buffer, 'trip', req.file.originalname);
            image_thumbnail = variants.thumbnail;
            image_small = variants.small;
            image_path = variants.original;
            image_metadata = JSON.stringify(variants.metadata);
        }
        const updateData = {
            title: req.body.title,
            link_url: req.body.link_url || undefined,
            is_active: req.body.is_active === 'true' || req.body.is_active === true,
            sort_order: parseInt(req.body.sort_order, 10) || 0,
        };
        if (image_thumbnail !== undefined)
            updateData.image_thumbnail = image_thumbnail;
        if (image_small !== undefined)
            updateData.image_small = image_small;
        if (image_path !== undefined)
            updateData.image_path = image_path;
        if (image_metadata !== undefined)
            updateData.image_metadata = image_metadata;
        const trip = await ApplicationModels_1.TripModel.update(pool, parseInt(Array.isArray(id) ? id[0] : id), updateData);
        if (!trip) {
            return res.status(404).json({
                success: false,
                error: 'Trip not found',
            });
        }
        res.json({
            success: true,
            data: trip,
            message: 'Trip updated successfully',
        });
    }
    catch (error) {
        logger_1.logger.error('Error updating trip', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update trip',
        });
    }
});
// Delete trip
router.delete('/:id', async (req, res) => {
    try {
        const pool = await (0, database_1.getAppStoreDb)();
        const { id } = req.params;
        await ApplicationModels_1.TripModel.delete(pool, parseInt(id));
        res.json({
            success: true,
            message: 'Trip deleted successfully',
        });
    }
    catch (error) {
        logger_1.logger.error('Error deleting trip', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete trip',
        });
    }
});
exports.default = router;
