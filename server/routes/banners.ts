import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { getAppStoreDb } from '../config/database';
import { BannerModel } from '../models/ApplicationModels';
import { upload } from '../middleware/file-upload';
import { ImageStorage } from '../utils/ImageStorage';
import { logger } from '../utils/logger';

const router = Router();

// Get all banners
router.get('/', async (req, res) => {
  try {
    const pool = await getAppStoreDb();
    const { active = 'true' } = req.query;

    const banners = await BannerModel.getAll(pool, active === 'true');

    res.json({
      success: true,
      data: banners,
    });
  } catch (error) {
    logger.error('Error fetching banners', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch banners',
    });
  }
});

// Get single banner by ID
router.get('/:id', async (req, res) => {
  try {
    const pool = await getAppStoreDb();
    const { id } = req.params;

    const banner = await BannerModel.getById(pool, parseInt(id));

    if (!banner) {
      return res.status(404).json({
        success: false,
        error: 'Banner not found',
      });
    }

    res.json({
      success: true,
      data: banner,
    });
  } catch (error) {
    logger.error('Error fetching banner', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch banner',
    });
  }
});

// Create new banner
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const pool = await getAppStoreDb();

    let image_thumbnail: string | undefined;
    let image_small: string | undefined;
    let image_path: string | undefined;
    let image_metadata: string | undefined;

    if (req.file) {
      // Validate image
      const validation = ImageStorage.validateImage(req.file.buffer, 10);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: validation.error,
        });
      }

      // Process image with new optimized system
      const variants = await ImageStorage.processImage(
        req.file.buffer,
        'banner',
        req.file.originalname
      );

      image_thumbnail = variants.thumbnail;
      image_small = variants.small;
      image_path = variants.original;
      image_metadata = JSON.stringify(variants.metadata);
    }

    const banner = await BannerModel.create(pool, {
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
      data: banner,
      message: 'Banner created successfully',
    });
  } catch (error) {
    logger.error('Error creating banner', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create banner',
    });
  }
});

// Update banner
router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    const pool = await getAppStoreDb();
    const { id } = req.params;

    let image_thumbnail: string | undefined;
    let image_small: string | undefined;
    let image_path: string | undefined;
    let image_metadata: string | undefined;

    if (req.file) {
      // Get existing banner to delete old image
      const existingBanner = await BannerModel.getById(
        pool,
        parseInt(Array.isArray(id) ? id[0] : id, 10)
      );

      // Delete old image file if exists
      if (existingBanner?.image_path) {
        const oldImagePath = existingBanner.image_path;
        const fullPath = oldImagePath.startsWith('/')
          ? path.join(process.cwd(), oldImagePath)
          : oldImagePath;

        try {
          if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
            console.log('Deleted old banner image:', fullPath);
          }
        } catch (deleteError) {
          console.warn('Failed to delete old banner image:', deleteError);
        }
      }

      // Validate image
      const validation = ImageStorage.validateImage(req.file.buffer, 10);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: validation.error,
        });
      }

      // Process image with new optimized system
      const variants = await ImageStorage.processImage(
        req.file.buffer,
        'banner',
        req.file.originalname
      );

      image_thumbnail = variants.thumbnail;
      image_small = variants.small;
      image_path = variants.original;
      image_metadata = JSON.stringify(variants.metadata);
    }

    const updateData: Parameters<typeof BannerModel.update>[2] = {
      title: req.body.title,
      link_url: req.body.link_url,
      is_active: req.body.is_active === 'true' || req.body.is_active === true,
      sort_order: parseInt(req.body.sort_order, 10) || 0,
    };

    if (image_thumbnail !== undefined) updateData.image_thumbnail = image_thumbnail;
    if (image_small !== undefined) updateData.image_small = image_small;
    if (image_path !== undefined) updateData.image_path = image_path;
    if (image_metadata !== undefined) updateData.image_metadata = image_metadata;

    const banner = await BannerModel.update(
      pool,
      parseInt(Array.isArray(id) ? id[0] : id),
      updateData
    );

    if (!banner) {
      return res.status(404).json({
        success: false,
        error: 'Banner not found',
      });
    }

    res.json({
      success: true,
      data: banner,
      message: 'Banner updated successfully',
    });
  } catch (error) {
    logger.error('Error updating banner', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update banner',
    });
  }
});

// Delete banner
router.delete('/:id', async (req, res) => {
  try {
    const pool = await getAppStoreDb();
    const { id } = req.params;

    await BannerModel.delete(pool, parseInt(id));

    res.json({
      success: true,
      message: 'Banner deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting banner', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete banner',
    });
  }
});

export default router;
