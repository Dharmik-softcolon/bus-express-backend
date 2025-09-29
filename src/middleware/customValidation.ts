import { Request, Response, NextFunction } from 'express';
import { sendBadRequest } from '../utils/responseHandler';

// Validation middleware for common patterns
export const validateObjectId = (paramName: string = 'id') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const id = req.params[paramName];
    
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      sendBadRequest(res, `Invalid ${paramName}`);
      return;
    }
    
    next();
  };
};

// Validate pagination parameters
export const validatePagination = (req: Request, res: Response, next: NextFunction): void => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  
  if (page < 1) {
    sendBadRequest(res, 'Page must be greater than 0');
    return;
  }
  
  if (limit < 1 || limit > 100) {
    sendBadRequest(res, 'Limit must be between 1 and 100');
    return;
  }
  
  next();
};

// Validate date range
export const validateDateRange = (req: Request, res: Response, next: NextFunction): void => {
  const { startDate, endDate } = req.query;
  
  if (startDate && isNaN(Date.parse(startDate as string))) {
    sendBadRequest(res, 'Invalid start date format');
    return;
  }
  
  if (endDate && isNaN(Date.parse(endDate as string))) {
    sendBadRequest(res, 'Invalid end date format');
    return;
  }
  
  if (startDate && endDate) {
    const start = new Date(startDate as string);
    const end = new Date(endDate as string);
    
    if (start > end) {
      sendBadRequest(res, 'Start date must be before end date');
      return;
    }
  }
  
  next();
};

// Validate search query
export const validateSearchQuery = (req: Request, res: Response, next: NextFunction): void => {
  const { search } = req.query;
  
  if (search && typeof search === 'string' && search.length < 2) {
    sendBadRequest(res, 'Search query must be at least 2 characters');
    return;
  }
  
  next();
};

// Validate file upload
export const validateFileUpload = (allowedTypes: string[], maxSize: number) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.file) {
      next();
      return;
    }
    
    if (!allowedTypes.includes(req.file.mimetype)) {
      sendBadRequest(res, `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`);
      return;
    }
    
    if (req.file.size > maxSize) {
      sendBadRequest(res, `File too large. Maximum size: ${maxSize / 1024 / 1024}MB`);
      return;
    }
    
    next();
  };
};

// Validate coordinates
export const validateCoordinates = (req: Request, res: Response, next: NextFunction): void => {
  const { latitude, longitude } = req.body;
  
  if (latitude !== undefined) {
    if (typeof latitude !== 'number' || latitude < -90 || latitude > 90) {
      sendBadRequest(res, 'Invalid latitude. Must be a number between -90 and 90');
      return;
    }
  }
  
  if (longitude !== undefined) {
    if (typeof longitude !== 'number' || longitude < -180 || longitude > 180) {
      sendBadRequest(res, 'Invalid longitude. Must be a number between -180 and 180');
      return;
    }
  }
  
  next();
};

// Validate time format
export const validateTimeFormat = (req: Request, res: Response, next: NextFunction): void => {
  const { time } = req.body;
  
  if (time && !time.match(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)) {
    sendBadRequest(res, 'Invalid time format. Use HH:MM format');
    return;
  }
  
  next();
};

// Validate phone number
export const validatePhoneNumber = (req: Request, res: Response, next: NextFunction): void => {
  const { phone } = req.body;
  
  if (phone && !phone.match(/^(\+91|91)?[6-9]\d{9}$/)) {
    sendBadRequest(res, 'Invalid phone number format');
    return;
  }
  
  next();
};

// Validate email format
export const validateEmailFormat = (req: Request, res: Response, next: NextFunction): void => {
  const { email } = req.body;
  
  if (email && !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    sendBadRequest(res, 'Invalid email format');
    return;
  }
  
  next();
};
