import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import config from '../config/config.js';
import { sendBadRequest } from '../utils/responseHandler.js';

// Validation middleware
export const validateRequest = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.type === 'field' ? error.path : 'unknown',
      message: error.msg,
      value: error.type === 'field' ? error.value : undefined,
    }));
    
    sendBadRequest(res, 'Validation failed', formattedErrors);
    return;
  }
  
  next();
};

// Rate limiting middleware
export const rateLimitMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // This is a basic implementation. In production, use express-rate-limit
  const clientId = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  
  // Simple in-memory rate limiting (use Redis in production)
  if (!global.rateLimitStore) {
    global.rateLimitStore = new Map();
  }
  
  const clientData = global.rateLimitStore.get(clientId) || { count: 0, resetTime: now + 15 * 60 * 1000 };
  
  if (now > clientData.resetTime) {
    clientData.count = 0;
    clientData.resetTime = now + 15 * 60 * 1000;
  }
  
  if (clientData.count >= 100) {
    res.status(429).json({
      success: false,
      message: 'Too many requests. Please try again later.',
      timestamp: new Date().toISOString(),
    });
    return;
  }
  
  clientData.count++;
  global.rateLimitStore.set(clientId, clientData);
  
  next();
};

// CORS middleware
export const corsMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  res.header('Access-Control-Allow-Origin', config.cors.ORIGIN || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  
  next();
};

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
  });
  
  next();
};

// Security headers middleware
export const securityHeaders = (req: Request, res: Response, next: NextFunction): void => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  
  next();
};

// File upload validation middleware
export const validateFileUpload = (allowedTypes: string[], maxSize: number) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.file) {
      next();
      return;
    }
    
    if (!allowedTypes.includes(req.file.mimetype)) {
      res.status(400).json({
        success: false,
        message: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
        timestamp: new Date().toISOString(),
      });
      return;
    }
    
    if (req.file.size > maxSize) {
      res.status(400).json({
        success: false,
        message: `File too large. Maximum size: ${maxSize / 1024 / 1024}MB`,
        timestamp: new Date().toISOString(),
      });
      return;
    }
    
    next();
  };
};

// Pagination middleware
export const paginationMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;
  
  req.pagination = {
    page: Math.max(1, page),
    limit: Math.min(100, Math.max(1, limit)),
    skip,
  };
  
  next();
};

// Extend Request interface for pagination
declare global {
  namespace Express {
    interface Request {
      pagination?: {
        page: number;
        limit: number;
        skip: number;
      };
    }
  }
}

// Extend global namespace for rate limiting
declare global {
  var rateLimitStore: Map<string, { count: number; resetTime: number }>;
}
