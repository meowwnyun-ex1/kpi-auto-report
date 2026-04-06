import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { getAppStoreDb } from '../config/database';
import { ApplicationModel } from '../models/ApplicationModels';
import { upload } from '../middleware/file-upload';
import { ImageStorage } from '../utils/ImageStorage';
import { logger } from '../utils/logger';
import { sendApplicationSubmissionEmail } from '../utils/email';

const router = Router();

// Get all applications with optional filtering
router.get('/', async (req, res) => {
  try {
    const pool = await getAppStoreDb();

    const { status, category_id, limit = 100, offset = 0, sortBy, sortOrder } = req.query;

    // Only apply status filter if it's not 'all' and not empty
    const statusFilter =
      status && status !== 'all' && status !== '' ? (status as string) : undefined;

    const applications = await ApplicationModel.getAll(pool, {
      status: statusFilter,
      category_id: category_id ? parseInt(category_id as string, 10) : undefined,
      limit: parseInt(limit as string, 10),
      offset: parseInt(offset as string, 10),
      sortBy: typeof sortBy === 'string' ? sortBy : undefined,
      sortOrder: typeof sortOrder === 'string' ? sortOrder : undefined,
    });

    res.json({
      success: true,
      data: applications,
      // Backwards-compatible key for older frontend code
      applications,
      pagination: {
        limit: parseInt(limit as string, 10),
        offset: parseInt(offset as string, 10),
        total: applications.length,
      },
    });
  } catch (error) {
    logger.error('Error fetching applications', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch applications',
    });
  }
});

// Get application categories — MUST be defined before /:id to avoid route conflict
router.get('/categories', async (_req, res) => {
  try {
    const pool = await getAppStoreDb();

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
  } catch (error) {
    logger.error('Error fetching categories', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch categories',
    });
  }
});

// Get single application by ID
router.get('/:id', async (req, res) => {
  try {
    const pool = await getAppStoreDb();
    const { id } = req.params;

    const application = await ApplicationModel.getById(pool, parseInt(id, 10));

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
  } catch (error) {
    logger.error('Error fetching application', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch application',
    });
  }
});

// Create new application
router.post('/', upload.single('icon'), async (req, res) => {
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
        'app',
        req.file.originalname
      );

      image_thumbnail = variants.thumbnail;
      image_small = variants.small;
      image_path = variants.original;
      image_metadata = JSON.stringify(variants.metadata);
    }

    // Prepare create data
    const createData: any = {
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

    const application = await ApplicationModel.create(pool, createData);

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

      await sendApplicationSubmissionEmail({
        appName: application.name,
        appUrl: application.url,
        category: categoryName,
        submittedBy: (req as any).user?.username || 'Unknown',
        submittedAt: new Date(),
      });
    } catch (emailError) {
      // Log email error but don't fail the request
      logger.error('Failed to send application submission email', emailError);
    }

    res.status(201).json({
      success: true,
      data: application,
      message: 'Application created successfully',
    });
  } catch (error) {
    logger.error('Error creating application', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create application',
    });
  }
});

// Update application
router.put('/:id', upload.single('icon'), async (req, res) => {
  try {
    const pool = await getAppStoreDb();
    const { id } = req.params;

    console.log('Updating application:', id);
    console.log('Request body:', req.body);
    console.log('File uploaded:', req.file ? req.file.originalname : 'No file');

    let image_thumbnail: string | undefined;
    let image_small: string | undefined;
    let image_path: string | undefined;
    let image_metadata: string | undefined;

    if (req.file) {
      console.log('Processing new icon file...');

      // Get existing application to delete old image
      const existingApp = await ApplicationModel.getById(
        pool,
        parseInt(Array.isArray(id) ? id[0] : id, 10)
      );

      // Delete old image file if exists
      if (existingApp?.image_path) {
        const oldImagePath = existingApp.image_path;
        // Handle both relative and absolute paths
        const fullPath = oldImagePath.startsWith('/')
          ? path.join(process.cwd(), oldImagePath)
          : oldImagePath;

        try {
          if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
            console.log('Deleted old image file:', fullPath);
          }
        } catch (deleteError) {
          console.warn('Failed to delete old image file:', deleteError);
        }
      }

      try {
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
          'app',
          req.file.originalname
        );

        image_thumbnail = variants.thumbnail;
        image_small = variants.small;
        image_path = variants.original;
        image_metadata = JSON.stringify(variants.metadata);

        console.log('New icon processed successfully');
      } catch (imageError) {
        console.error('Error processing image:', imageError);
        return res.status(400).json({
          success: false,
          error: 'Failed to process image file',
        });
      }
    }

    // Prepare update data
    const updateData: any = {
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

    const application = await ApplicationModel.update(
      pool,
      parseInt(Array.isArray(id) ? id[0] : id, 10),
      updateData
    );

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
  } catch (error: unknown) {
    console.error('Error updating application:', error);
    logger.error('Error updating application', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update application',
      details:
        process.env.NODE_ENV === 'development' && error instanceof Error
          ? error.message
          : undefined,
    });
  }
});

// Delete application
router.delete('/:id', async (req, res) => {
  try {
    const pool = await getAppStoreDb();
    const { id } = req.params;

    const deleted = await ApplicationModel.delete(pool, parseInt(id, 10));

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
  } catch (error) {
    logger.error('Error deleting application', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete application',
    });
  }
});

// Update view count
router.post('/:id/view', async (req, res) => {
  try {
    const pool = await getAppStoreDb();
    const { id } = req.params;

    await ApplicationModel.updateViewCount(pool, parseInt(id, 10));

    res.json({
      success: true,
      message: 'View count updated',
    });
  } catch (error) {
    logger.error('Error updating view count', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update view count',
    });
  }
});

export default router;
