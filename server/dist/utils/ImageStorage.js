"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageStorage = void 0;
const sharp_1 = __importDefault(require("sharp"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
const logger_1 = require("./logger");
/**
 * Image Storage Configuration
 * Using WebP for optimal performance:
 * - 25-35% smaller file sizes than PNG
 * - Excellent quality at 85-90% compression
 * - Universal browser support
 * - Faster loading times
 */
const IMAGE_CONFIGS = {
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
const TYPE_TO_DIR = {
    app: 'apps',
    banner: 'banners',
    trip: 'trips',
    category: 'categories',
};
/**
 * Upload directory for large images
 */
const UPLOAD_DIR = path_1.default.join(process.cwd(), 'uploads');
/**
 * Ensure upload directory exists
 */
function ensureUploadDir() {
    const dirs = ['apps', 'banners', 'trips', 'categories'];
    dirs.forEach((dir) => {
        const dirPath = path_1.default.join(UPLOAD_DIR, dir);
        if (!fs_1.default.existsSync(dirPath)) {
            fs_1.default.mkdirSync(dirPath, { recursive: true });
        }
    });
}
/**
 * Generate unique filename
 */
function generateFilename(originalName, type) {
    const hash = crypto_1.default.createHash('md5').update(`${Date.now()}-${originalName}`).digest('hex');
    const ext = type === 'webp' ? 'webp' : type;
    return `${hash}.${ext}`;
}
/**
 * Clean old files (keep last 100 files per type)
 */
function cleanupOldFiles(type) {
    try {
        const dir = path_1.default.join(UPLOAD_DIR, type);
        if (!fs_1.default.existsSync(dir))
            return;
        const files = fs_1.default
            .readdirSync(dir)
            .map((file) => ({
            file,
            path: path_1.default.join(dir, file),
            time: fs_1.default.statSync(path_1.default.join(dir, file)).mtime.getTime(),
        }))
            .sort((a, b) => b.time - a.time);
        // Keep only last 100 files
        if (files.length > 100) {
            files.slice(100).forEach(({ path }) => {
                try {
                    fs_1.default.unlinkSync(path);
                    logger_1.logger.info(`Cleaned up old file: ${path}`);
                }
                catch (err) {
                    logger_1.logger.warn(`Failed to cleanup file: ${path}`, err);
                }
            });
        }
    }
    catch (err) {
        logger_1.logger.warn('Cleanup failed:', err);
    }
}
/**
 * ImageStorage - Optimized image processing and storage
 */
class ImageStorage {
    /**
     * Process and store image with multiple variants
     */
    static async processImage(buffer, type, originalName) {
        const config = IMAGE_CONFIGS[type];
        ensureUploadDir();
        try {
            // Get original metadata
            const metadata = await (0, sharp_1.default)(buffer).metadata();
            // 1. Create thumbnail (always stored in DB as base64)
            const thumbnailBuffer = await (0, sharp_1.default)(buffer)
                .resize(config.thumbnailWidth, config.thumbnailHeight, {
                fit: 'cover',
                position: 'center',
            })
                .webp({ quality: config.thumbnailQuality })
                .toBuffer();
            const thumbnailBase64 = `data:image/webp;base64,${thumbnailBuffer.toString('base64')}`;
            const thumbnailSize = thumbnailBuffer.length;
            // 2. Create optimized version
            let optimizedBuffer = await (0, sharp_1.default)(buffer)
                .resize(config.maxWidth, config.maxHeight, {
                fit: 'inside',
                withoutEnlargement: true,
            })
                .webp({ quality: config.quality })
                .toBuffer();
            const optimizedSize = optimizedBuffer.length;
            const optimizedSizeKB = optimizedSize / 1024;
            // 3. Decide storage strategy based on size
            let small;
            let medium;
            let original;
            let originalPath;
            let hasOriginal = false;
            if (optimizedSizeKB <= config.maxSizeKB) {
                // Small enough for database storage
                small = `data:image/webp;base64,${optimizedBuffer.toString('base64')}`;
            }
            else {
                // Too large, store on disk
                hasOriginal = true;
                const filename = generateFilename(originalName || 'image', 'webp');
                const dirName = TYPE_TO_DIR[type] || 'apps';
                const filePath = path_1.default.join(UPLOAD_DIR, dirName, filename);
                fs_1.default.writeFileSync(filePath, optimizedBuffer);
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
        }
        catch (error) {
            logger_1.logger.error('Image processing failed:', error);
            throw new Error('Failed to process image');
        }
    }
    /**
     * Create thumbnail only (for quick display)
     */
    static async createThumbnail(buffer, type) {
        const config = IMAGE_CONFIGS[type];
        try {
            const thumbnailBuffer = await (0, sharp_1.default)(buffer)
                .resize(config.thumbnailWidth, config.thumbnailHeight, {
                fit: 'cover',
                position: 'center',
            })
                .png({ quality: config.thumbnailQuality })
                .toBuffer();
            return `data:image/png;base64,${thumbnailBuffer.toString('base64')}`;
        }
        catch (error) {
            logger_1.logger.error('Thumbnail creation failed:', error);
            throw new Error('Failed to create thumbnail');
        }
    }
    /**
     * Validate image file
     */
    static validateImage(buffer, maxSizeMB = 10) {
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
        const isValid = validSignatures.some((sig) => buffer.length >= sig.length && sig.equals(buffer.slice(0, sig.length)));
        if (!isValid) {
            return { valid: false, error: 'Invalid image format. Supported: JPEG, PNG, GIF, WebP' };
        }
        return { valid: true };
    }
    /**
     * Delete image file from disk
     */
    static deleteImage(filePath) {
        try {
            if (fs_1.default.existsSync(filePath)) {
                fs_1.default.unlinkSync(filePath);
                logger_1.logger.info(`Deleted image: ${filePath}`);
                return true;
            }
            return false;
        }
        catch (error) {
            logger_1.logger.error(`Failed to delete image: ${filePath}`, error);
            return false;
        }
    }
    /**
     * Get image from disk
     */
    static getImage(filePath) {
        try {
            if (fs_1.default.existsSync(filePath)) {
                return fs_1.default.readFileSync(filePath);
            }
            return null;
        }
        catch (error) {
            logger_1.logger.error(`Failed to read image: ${filePath}`, error);
            return null;
        }
    }
    /**
     * Calculate storage statistics
     */
    static getStorageStats() {
        const stats = {
            totalSize: 0,
            fileCount: 0,
            byType: {},
        };
        try {
            ['apps', 'banners', 'trips', 'categories'].forEach((type) => {
                const dir = path_1.default.join(UPLOAD_DIR, type);
                if (fs_1.default.existsSync(dir)) {
                    const files = fs_1.default.readdirSync(dir);
                    let typeSize = 0;
                    files.forEach((file) => {
                        const filePath = path_1.default.join(dir, file);
                        const stat = fs_1.default.statSync(filePath);
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
        }
        catch (error) {
            logger_1.logger.error('Failed to calculate storage stats:', error);
        }
        return stats;
    }
    /**
     * Clean all old files (run periodically)
     */
    static cleanupAll() {
        ['apps', 'banners', 'trips', 'categories'].forEach((type) => {
            cleanupOldFiles(type);
        });
        logger_1.logger.info('Completed cleanup of all image types');
    }
}
exports.ImageStorage = ImageStorage;
exports.default = ImageStorage;
