import { Router } from 'express';
import { ImageStorage } from '../utils/ImageStorage';
import { logger } from '../utils/logger';
import { requireAuth, requireRole } from '../middleware/auth';
import { getAppStoreDb } from '../config/database';

const router = Router();

// Get all files from database and disk
router.get('/', requireAuth, requireRole('admin'), async (_req, res) => {
  try {
    const pool = await getAppStoreDb();
    const files: any[] = [];

    // Get applications with images
    const appsResult = await pool.request().query(`
      SELECT id, name, image_thumbnail, image_small, image_path, image_metadata, updated_at
      FROM applications
      WHERE image_thumbnail IS NOT NULL OR image_small IS NOT NULL OR image_path IS NOT NULL
    `);

    appsResult.recordset.forEach((app: any) => {
      if (app.image_thumbnail) {
        files.push({
          id: `app-thumb-${app.id}`,
          originalName: `${app.name} (thumbnail)`,
          filename: `app-${app.id}-thumbnail.webp`,
          mimeType: 'image/webp',
          size: app.image_thumbnail.length,
          path: `db://applications/${app.id}/thumbnail`,
          uploadedBy: 'system',
          createdAt: app.updated_at,
          updatedAt: app.updated_at,
          type: 'application',
        });
      }
      if (app.image_small) {
        files.push({
          id: `app-small-${app.id}`,
          originalName: `${app.name} (small)`,
          filename: `app-${app.id}-small.webp`,
          mimeType: 'image/webp',
          size: app.image_small.length,
          path: `db://applications/${app.id}/small`,
          uploadedBy: 'system',
          createdAt: app.updated_at,
          updatedAt: app.updated_at,
          type: 'application',
        });
      }
      if (app.image_path && !app.image_path.startsWith('data:')) {
        files.push({
          id: `app-disk-${app.id}`,
          originalName: `${app.name} (original)`,
          filename: app.image_path.split('/').pop(),
          mimeType: 'image/webp',
          size: 0, // Would need to check disk
          path: app.image_path,
          uploadedBy: 'system',
          createdAt: app.updated_at,
          updatedAt: app.updated_at,
          type: 'application',
        });
      }
    });

    // Get banners with images
    const bannersResult = await pool.request().query(`
      SELECT id, title, image_thumbnail, image_small, image_path, image_metadata, updated_at
      FROM banners
      WHERE image_thumbnail IS NOT NULL OR image_small IS NOT NULL OR image_path IS NOT NULL
    `);

    bannersResult.recordset.forEach((banner: any) => {
      if (banner.image_thumbnail) {
        files.push({
          id: `banner-thumb-${banner.id}`,
          originalName: `${banner.title} (thumbnail)`,
          filename: `banner-${banner.id}-thumbnail.webp`,
          mimeType: 'image/webp',
          size: banner.image_thumbnail.length,
          path: `db://banners/${banner.id}/thumbnail`,
          uploadedBy: 'system',
          createdAt: banner.updated_at,
          updatedAt: banner.updated_at,
          type: 'banner',
        });
      }
      if (banner.image_small) {
        files.push({
          id: `banner-small-${banner.id}`,
          originalName: `${banner.title} (small)`,
          filename: `banner-${banner.id}-small.webp`,
          mimeType: 'image/webp',
          size: banner.image_small.length,
          path: `db://banners/${banner.id}/small`,
          uploadedBy: 'system',
          createdAt: banner.updated_at,
          updatedAt: banner.updated_at,
          type: 'banner',
        });
      }
    });

    // Get trips with images
    const tripsResult = await pool.request().query(`
      SELECT id, title, image_thumbnail, image_small, image_path, image_metadata, updated_at
      FROM trips
      WHERE image_thumbnail IS NOT NULL OR image_small IS NOT NULL OR image_path IS NOT NULL
    `);

    tripsResult.recordset.forEach((trip: any) => {
      if (trip.image_thumbnail) {
        files.push({
          id: `trip-thumb-${trip.id}`,
          originalName: `${trip.title} (thumbnail)`,
          filename: `trip-${trip.id}-thumbnail.webp`,
          mimeType: 'image/webp',
          size: trip.image_thumbnail.length,
          path: `db://trips/${trip.id}/thumbnail`,
          uploadedBy: 'system',
          createdAt: trip.updated_at,
          updatedAt: trip.updated_at,
          type: 'trip',
        });
      }
      if (trip.image_small) {
        files.push({
          id: `trip-small-${trip.id}`,
          originalName: `${trip.title} (small)`,
          filename: `trip-${trip.id}-small.webp`,
          mimeType: 'image/webp',
          size: trip.image_small.length,
          path: `db://trips/${trip.id}/small`,
          uploadedBy: 'system',
          createdAt: trip.updated_at,
          updatedAt: trip.updated_at,
          type: 'trip',
        });
      }
    });

    res.json({
      success: true,
      data: files,
    });
  } catch (error) {
    logger.error('Failed to get files:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get files',
    });
  }
});

// Get storage statistics (admin only)
router.get('/stats/storage', requireAuth, requireRole('admin'), async (_req, res) => {
  try {
    const pool = await getAppStoreDb();

    // Calculate database storage
    let dbSize = 0;
    let appCount = 0;
    let bannerCount = 0;
    let tripCount = 0;

    // Applications
    const appsResult = await pool.request().query(`
      SELECT 
        SUM(DATALENGTH(image_thumbnail)) + SUM(DATALENGTH(image_small)) as total_size,
        COUNT(*) as count
      FROM applications
      WHERE image_thumbnail IS NOT NULL OR image_small IS NOT NULL
    `);
    if (appsResult.recordset[0]) {
      dbSize += appsResult.recordset[0].total_size || 0;
      appCount = appsResult.recordset[0].count || 0;
    }

    // Banners
    const bannersResult = await pool.request().query(`
      SELECT 
        SUM(DATALENGTH(image_thumbnail)) + SUM(DATALENGTH(image_small)) as total_size,
        COUNT(*) as count
      FROM banners
      WHERE image_thumbnail IS NOT NULL OR image_small IS NOT NULL
    `);
    if (bannersResult.recordset[0]) {
      dbSize += bannersResult.recordset[0].total_size || 0;
      bannerCount = bannersResult.recordset[0].count || 0;
    }

    // Trips
    const tripsResult = await pool.request().query(`
      SELECT 
        SUM(DATALENGTH(image_thumbnail)) + SUM(DATALENGTH(image_small)) as total_size,
        COUNT(*) as count
      FROM trips
      WHERE image_thumbnail IS NOT NULL OR image_small IS NOT NULL
    `);
    if (tripsResult.recordset[0]) {
      dbSize += tripsResult.recordset[0].total_size || 0;
      tripCount = tripsResult.recordset[0].count || 0;
    }

    // Get disk storage stats
    const diskStats = ImageStorage.getStorageStats();

    const totalSize = dbSize + diskStats.totalSize;
    const totalFiles = appCount + bannerCount + tripCount + diskStats.fileCount;

    res.json({
      success: true,
      data: {
        total_size_bytes: totalSize,
        total_size_kb: Math.round(totalSize / 1024),
        total_size_mb: Math.round((totalSize / (1024 * 1024)) * 100) / 100,
        db_size_kb: Math.round(dbSize / 1024),
        disk_size_kb: Math.round(diskStats.totalSize / 1024),
        total_files: totalFiles,
        app_icons_kb: Math.round(dbSize / 1024),
        apps_count: appCount,
        banners_count: bannerCount,
        trips_count: tripCount,
        disk_files_count: diskStats.fileCount,
        by_type: {
          applications: { count: appCount, size_kb: Math.round(dbSize / 1024) },
          banners: { count: bannerCount, size_kb: Math.round(bannerCount / 1024) },
          trips: { count: tripCount, size_kb: Math.round(tripCount / 1024) },
          disk: diskStats.byType,
        },
      },
    });
  } catch (error) {
    logger.error('Failed to get storage stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get storage statistics',
    });
  }
});

// Cleanup old files (admin only)
router.post('/cleanup', requireAuth, requireRole('admin'), async (_req, res) => {
  try {
    await ImageStorage.cleanupAll();

    res.json({
      success: true,
      message: 'Cleanup completed successfully',
    });
  } catch (error) {
    logger.error('Failed to cleanup files:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cleanup files',
    });
  }
});

export default router;
