import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { logger } from './logger';

/**
 * Image Configuration
 */
export interface ImageConfig {
  maxWidth: number;
  maxHeight: number;
  quality: number;
  format: 'webp' | 'jpeg' | 'png';
  thumbnailWidth: number;
  thumbnailHeight: number;
  thumbnailQuality: number;
  maxSizeKB: number; // Max size for database storage (switch to disk if larger)
}

/**
 * Image Variants
 */
export interface ImageVariants {
  thumbnail: string; // Base64 thumbnail (< 10KB)
  small?: string; // Base64 small (< 50KB)
  medium?: string; // Disk path or base64
  original?: string; // Disk path only
  metadata: ImageMetadata;
}

/**
 * Image Metadata
 */
export interface ImageMetadata {
  format: string;
  width: number;
  height: number;
  size: number;
  thumbnailSize: number;
  hasOriginal: boolean;
  originalPath?: string;
}

/**
 * Image Storage Configuration
 * Using WebP for optimal performance:
 * - 25-35% smaller file sizes than PNG
 * - Excellent quality at 85-90% compression
 * - Universal browser support
 * - Faster loading times
 */
const IMAGE_CONFIGS: Record<string, ImageConfig> = {
  app: {
    maxWidth: 512,
    maxHeight: 512,
    quality: 85, // WebP quality - excellent balance
    format: 'webp', // WebP for better compression
    thumbnailWidth: 128,
    thumbnailHeight: 128,
    thumbnailQuality: 80, // Thumbnails can use slightly lower quality
    maxSizeKB: 50, // Store in DB if < 50KB
  },
  banner: {
    maxWidth: 1920,
    maxHeight: 400,
    quality: 90, // Higher quality for banners
    format: 'webp', // WebP for better compression
    thumbnailWidth: 1920,
    thumbnailHeight: 200,
    thumbnailQuality: 85,
    maxSizeKB: 500, // Store in DB if < 500KB
  },
  trip: {
    maxWidth: 1600,
    maxHeight: 1200,
    quality: 90, // Higher quality for trip photos
    format: 'webp', // WebP for better compression
    thumbnailWidth: 800,
    thumbnailHeight: 600,
    thumbnailQuality: 85,
    maxSizeKB: 500, // Store in DB if < 500KB
  },
  category: {
    maxWidth: 256,
    maxHeight: 256,
    quality: 85,
    format: 'webp', // WebP for better compression
    thumbnailWidth: 64,
    thumbnailHeight: 64,
    thumbnailQuality: 80,
    maxSizeKB: 30, // Store in DB if < 30KB
  },
};

/**
 * Map type to directory name
 */
const TYPE_TO_DIR: Record<string, string> = {
  app: 'apps',
  banner: 'banners',
  trip: 'trips',
  category: 'categories',
};

/**
 * Upload directory for large images
 */
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

/**
 * Ensure upload directory exists
 */
function ensureUploadDir(): void {
  const dirs = ['apps', 'banners', 'trips', 'categories'];
  dirs.forEach((dir) => {
    const dirPath = path.join(UPLOAD_DIR, dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  });
}

/**
 * Generate unique filename
 */
function generateFilename(originalName: string, type: string): string {
  const hash = crypto.createHash('md5').update(`${Date.now()}-${originalName}`).digest('hex');
  const ext = type === 'webp' ? 'webp' : type;
  return `${hash}.${ext}`;
}

/**
 * Clean old files (keep last 100 files per type)
 */
function cleanupOldFiles(type: string): void {
  try {
    const dir = path.join(UPLOAD_DIR, type);
    if (!fs.existsSync(dir)) return;

    const files = fs
      .readdirSync(dir)
      .map((file) => ({
        file,
        path: path.join(dir, file),
        time: fs.statSync(path.join(dir, file)).mtime.getTime(),
      }))
      .sort((a, b) => b.time - a.time);

    // Keep only last 100 files
    if (files.length > 100) {
      files.slice(100).forEach(({ path }) => {
        try {
          fs.unlinkSync(path);
          logger.info(`Cleaned up old file: ${path}`);
        } catch (err: unknown) {
          logger.warn(`Failed to cleanup file: ${path}`, err as Record<string, unknown>);
        }
      });
    }
  } catch (err: unknown) {
    logger.warn('Cleanup failed:', err as Record<string, unknown>);
  }
}

/**
 * ImageStorage - Optimized image processing and storage
 */
export class ImageStorage {
  /**
   * Process and store image with multiple variants
   */
  static async processImage(
    buffer: Buffer,
    type: 'app' | 'banner' | 'trip' | 'category',
    originalName?: string
  ): Promise<ImageVariants> {
    const config = IMAGE_CONFIGS[type];
    ensureUploadDir();

    try {
      // Get original metadata
      const metadata = await sharp(buffer).metadata();

      // 1. Create thumbnail (always stored in DB as base64)
      const thumbnailBuffer = await sharp(buffer)
        .resize(config.thumbnailWidth, config.thumbnailHeight, {
          fit: 'cover',
          position: 'center',
        })
        .webp({ quality: config.thumbnailQuality })
        .toBuffer();

      const thumbnailBase64 = `data:image/webp;base64,${thumbnailBuffer.toString('base64')}`;
      const thumbnailSize = thumbnailBuffer.length;

      // 2. Create optimized version
      let optimizedBuffer = await sharp(buffer)
        .resize(config.maxWidth, config.maxHeight, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: config.quality })
        .toBuffer();

      const optimizedSize = optimizedBuffer.length;
      const optimizedSizeKB = optimizedSize / 1024;

      // 3. Decide storage strategy based on size
      let small: string | undefined;
      let medium: string | undefined;
      let original: string | undefined;
      let originalPath: string | undefined;
      let hasOriginal = false;

      if (optimizedSizeKB <= config.maxSizeKB) {
        // Small enough for database storage
        small = `data:image/webp;base64,${optimizedBuffer.toString('base64')}`;
      } else {
        // Too large, store on disk
        hasOriginal = true;
        const filename = generateFilename(originalName || 'image', 'webp');
        const dirName = TYPE_TO_DIR[type] || 'apps';
        const filePath = path.join(UPLOAD_DIR, dirName, filename);

        fs.writeFileSync(filePath, optimizedBuffer);
        originalPath = filePath;
        original = `/uploads/${dirName}/${filename}`;

        // Cleanup old files
        cleanupOldFiles(dirName);
      }

      return {
        thumbnail: thumbnailBase64,
        small,
        medium,
        original,
        metadata: {
          format: 'webp',
          width: metadata.width || 0,
          height: metadata.height || 0,
          size: optimizedSize,
          thumbnailSize,
          hasOriginal,
          originalPath,
        },
      };
    } catch (error) {
      logger.error('Image processing failed:', error);
      throw new Error('Failed to process image');
    }
  }

  /**
   * Create thumbnail only (for quick display)
   */
  static async createThumbnail(
    buffer: Buffer,
    type: 'app' | 'banner' | 'trip' | 'category'
  ): Promise<string> {
    const config = IMAGE_CONFIGS[type];

    try {
      const thumbnailBuffer = await sharp(buffer)
        .resize(config.thumbnailWidth, config.thumbnailHeight, {
          fit: 'cover',
          position: 'center',
        })
        .png({ quality: config.thumbnailQuality })
        .toBuffer();

      return `data:image/png;base64,${thumbnailBuffer.toString('base64')}`;
    } catch (error) {
      logger.error('Thumbnail creation failed:', error);
      throw new Error('Failed to create thumbnail');
    }
  }

  /**
   * Validate image file
   */
  static validateImage(buffer: Buffer, maxSizeMB: number = 10): { valid: boolean; error?: string } {
    // Check file size
    const sizeMB = buffer.length / (1024 * 1024);
    if (sizeMB > maxSizeMB) {
      return {
        valid: false,
        error: `File size (${sizeMB.toFixed(2)}MB) exceeds limit (${maxSizeMB}MB)`,
      };
    }

    // Check if valid image
    const validSignatures = [
      Buffer.from([0xff, 0xd8, 0xff]), // JPEG
      Buffer.from([0x89, 0x50, 0x4e, 0x47]), // PNG
      Buffer.from([0x47, 0x49, 0x46]), // GIF
      Buffer.from([0x52, 0x49, 0x46, 0x46]), // WebP
    ];

    const isValid = validSignatures.some(
      (sig) => buffer.length >= sig.length && sig.equals(buffer.slice(0, sig.length))
    );

    if (!isValid) {
      return { valid: false, error: 'Invalid image format. Supported: JPEG, PNG, GIF, WebP' };
    }

    return { valid: true };
  }

  /**
   * Delete image file from disk
   */
  static deleteImage(filePath: string): boolean {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        logger.info(`Deleted image: ${filePath}`);
        return true;
      }
      return false;
    } catch (error) {
      logger.error(`Failed to delete image: ${filePath}`, error);
      return false;
    }
  }

  /**
   * Get image from disk
   */
  static getImage(filePath: string): Buffer | null {
    try {
      if (fs.existsSync(filePath)) {
        return fs.readFileSync(filePath);
      }
      return null;
    } catch (error) {
      logger.error(`Failed to read image: ${filePath}`, error);
      return null;
    }
  }

  /**
   * Calculate storage statistics
   */
  static getStorageStats(): {
    totalSize: number;
    fileCount: number;
    byType: Record<string, { size: number; count: number }>;
  } {
    const stats = {
      totalSize: 0,
      fileCount: 0,
      byType: {} as Record<string, { size: number; count: number }>,
    };

    try {
      ['apps', 'banners', 'trips', 'categories'].forEach((type) => {
        const dir = path.join(UPLOAD_DIR, type);
        if (fs.existsSync(dir)) {
          const files = fs.readdirSync(dir);
          let typeSize = 0;

          files.forEach((file) => {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);
            typeSize += stat.size;
            stats.totalSize += stat.size;
            stats.fileCount++;
          });

          stats.byType[type] = {
            size: typeSize,
            count: files.length,
          };
        }
      });
    } catch (error) {
      logger.error('Failed to calculate storage stats:', error);
    }

    return stats;
  }

  /**
   * Clean all old files (run periodically)
   */
  static cleanupAll(): void {
    ['apps', 'banners', 'trips', 'categories'].forEach((type) => {
      cleanupOldFiles(type);
    });
    logger.info('Completed cleanup of all image types');
  }
}

export default ImageStorage;
