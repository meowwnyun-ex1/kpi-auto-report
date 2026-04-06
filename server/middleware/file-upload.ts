import multer from 'multer';
import { Request, Response, NextFunction } from 'express';

// Configure multer for memory storage (files are processed by ImageStorage)
const storage = multer.memoryStorage();

// Helper function to sanitize filename
const sanitizeFilename = (filename: string): string => {
  // Get extension
  const lastDot = filename.lastIndexOf('.');
  const extension = lastDot !== -1 ? filename.substring(lastDot).toLowerCase() : '';
  const baseName = lastDot !== -1 ? filename.substring(0, lastDot) : filename;

  // Replace spaces and special characters with underscores, keep only safe chars
  const sanitized = baseName
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace unsafe chars with underscore
    .replace(/_{2,}/g, '_') // Collapse multiple underscores
    .replace(/^_|_$/g, ''); // Remove leading/trailing underscores

  // Add timestamp to ensure uniqueness and prevent conflicts
  const timestamp = Date.now();
  return `${sanitized}_${timestamp}${extension}`;
};

// File filter for validation
const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];

  // Check MIME type
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error('File type not allowed'));
  }

  // Check file extension
  const extension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
  if (!allowedExtensions.includes(extension)) {
    return cb(new Error('File extension not allowed'));
  }

  // Sanitize filename instead of rejecting it
  file.originalname = sanitizeFilename(file.originalname);

  cb(null, true);
};

// Configure multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 1, // Only one file at a time
  },
});

// Error handling middleware for file uploads
export const handleFileUploadError = (
  err: Error,
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof multer.MulterError) {
    let message = 'File upload error';

    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        message = 'File size too large (max 10MB)';
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Too many files uploaded';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Unexpected file field';
        break;
      default:
        message = err.message;
    }

    return res.status(400).json({
      success: false,
      error: message,
    });
  }

  next(err);
};

export { upload };
