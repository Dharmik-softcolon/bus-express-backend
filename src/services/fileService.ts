import multer from 'multer';
import path from 'path';
import fs from 'fs';
import config from '../config/config.js';
import { logError, logInfo } from '../utils/logger.js';

// Ensure uploads directory exists
const uploadDir = config.fileUpload.UPLOAD_PATH || 'uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

// File filter
const fileFilter = (req: any, file: any, cb: any) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'), false);
  }
};

// Configure multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(config.fileUpload.MAX_SIZE || '5242880'), // 5MB default
  },
});

export class FileService {
  private uploadPath: string;

  constructor() {
    this.uploadPath = uploadDir;
  }

  // Upload single file
  async uploadSingleFile(req: any, res: any, next: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const uploadSingle = upload.single('file');
      
      uploadSingle(req, res, (err: any) => {
        if (err) {
          logError('File upload error', err);
          reject(err);
        } else {
          if (req.file) {
            logInfo('File uploaded successfully', {
              filename: req.file.filename,
              originalname: req.file.originalname,
              size: req.file.size,
            });
            resolve(req.file);
          } else {
            reject(new Error('No file uploaded'));
          }
        }
      });
    });
  }

  // Upload multiple files
  async uploadMultipleFiles(req: any, res: any, next: any, fieldName: string = 'files'): Promise<any> {
    return new Promise((resolve, reject) => {
      const uploadMultiple = upload.array(fieldName, 10); // Max 10 files
      
      uploadMultiple(req, res, (err: any) => {
        if (err) {
          logError('Multiple file upload error', err);
          reject(err);
        } else {
          if (req.files && req.files.length > 0) {
            logInfo('Multiple files uploaded successfully', {
              count: req.files.length,
              files: req.files.map((file: any) => ({
                filename: file.filename,
                originalname: file.originalname,
                size: file.size,
              })),
            });
            resolve(req.files);
          } else {
            reject(new Error('No files uploaded'));
          }
        }
      });
    });
  }

  // Delete file
  async deleteFile(filename: string): Promise<boolean> {
    try {
      const filePath = path.join(this.uploadPath, filename);
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        logInfo('File deleted successfully', { filename });
        return true;
      } else {
        logError('File not found for deletion', { filename });
        return false;
      }
    } catch (error) {
      logError('Error deleting file', error);
      return false;
    }
  }

  // Get file info
  async getFileInfo(filename: string): Promise<any> {
    try {
      const filePath = path.join(this.uploadPath, filename);
      
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        return {
          filename,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime,
          path: filePath,
        };
      } else {
        throw new Error('File not found');
      }
    } catch (error) {
      logError('Error getting file info', error);
      throw error;
    }
  }

  // Generate file URL
  generateFileUrl(filename: string): string {
    const baseUrl = config.app.BASE_URL || 'http://localhost:3000';
    return `${baseUrl}/uploads/${filename}`;
  }

  // Validate file type
  validateFileType(file: any, allowedTypes: string[]): boolean {
    return allowedTypes.includes(file.mimetype);
  }

  // Validate file size
  validateFileSize(file: any, maxSize: number): boolean {
    return file.size <= maxSize;
  }

  // Get file extension
  getFileExtension(filename: string): string {
    return path.extname(filename).toLowerCase();
  }

  // Clean up old files (utility function)
  async cleanupOldFiles(daysOld: number = 30): Promise<number> {
    try {
      const files = fs.readdirSync(this.uploadPath);
      let deletedCount = 0;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      for (const file of files) {
        const filePath = path.join(this.uploadPath, file);
        const stats = fs.statSync(filePath);
        
        if (stats.mtime < cutoffDate) {
          fs.unlinkSync(filePath);
          deletedCount++;
          logInfo('Cleaned up old file', { filename: file });
        }
      }

      logInfo('File cleanup completed', { deletedCount, daysOld });
      return deletedCount;
    } catch (error) {
      logError('Error during file cleanup', error);
      return 0;
    }
  }
}

export const fileService = new FileService();

// Middleware for single file upload
export const uploadSingle: any = upload.single('file');

// Middleware for multiple files upload
export const uploadMultiple: any = upload.array('files', 10);

// Middleware for specific field upload
export const uploadField = (fieldName: string): any => upload.single(fieldName);
