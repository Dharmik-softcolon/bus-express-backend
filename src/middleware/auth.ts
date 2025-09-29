import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config/config.js';
import { sendUnauthorized, sendForbidden } from '../utils/responseHandler.js';
import { USER_ROLES } from '../constants/index';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        name: string;
      };
    }
  }
}

// Authentication middleware
export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      sendUnauthorized(res, 'Access denied. No token provided.');
      return;
    }

    const decoded = jwt.verify(token, config.jwt.SECRET_KEY || 'fallback-secret') as any;
    req.user = decoded;
    next();
  } catch (error) {
    sendUnauthorized(res, 'Invalid token.');
  }
};

// Role-based authorization middleware
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendUnauthorized(res, 'Access denied. User not authenticated.');
      return;
    }

    if (!roles.includes(req.user.role)) {
      sendForbidden(res, 'Access denied. Insufficient permissions.');
      return;
    }

    next();
  };
};

// Admin only middleware
export const adminOnly = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    sendUnauthorized(res, 'Access denied. User not authenticated.');
    return;
  }

  if (req.user.role !== USER_ROLES.ADMIN) {
    sendForbidden(res, 'Access denied. Admin access required.');
    return;
  }

  next();
};

// Operator or Admin middleware
export const operatorOrAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    sendUnauthorized(res, 'Access denied. User not authenticated.');
    return;
  }

  if (req.user.role !== USER_ROLES.ADMIN && req.user.role !== USER_ROLES.OPERATOR) {
    sendForbidden(res, 'Access denied. Operator or Admin access required.');
    return;
  }

  next();
};

// Customer or Admin middleware
export const customerOrAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    sendUnauthorized(res, 'Access denied. User not authenticated.');
    return;
  }

  if (req.user.role !== USER_ROLES.ADMIN && req.user.role !== USER_ROLES.CUSTOMER) {
    sendForbidden(res, 'Access denied. Customer or Admin access required.');
    return;
  }

  next();
};

// Check if user can access resource (own resource or admin)
export const canAccessResource = (resourceUserId: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendUnauthorized(res, 'Access denied. User not authenticated.');
      return;
    }

    if (req.user.role === USER_ROLES.ADMIN || req.user.id === resourceUserId) {
      next();
    } else {
      sendForbidden(res, 'Access denied. You can only access your own resources.');
    }
  };
};

// Optional authentication middleware (doesn't fail if no token)
export const optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (token) {
      const decoded = jwt.verify(token, config.jwt.SECRET_KEY || 'fallback-secret') as any;
      req.user = decoded;
    }

    next();
  } catch (error) {
    // Continue without authentication if token is invalid
    next();
  }
};
