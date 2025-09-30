import { Request, Response, NextFunction } from 'express';
import config from '../config/config';
import { HTTP_STATUS, API_MESSAGES } from '../constants';

// Success response utility
export const sendSuccess = (
  res: Response,
  data: any = null,
  message: string = API_MESSAGES.SUCCESS,
  statusCode: number = HTTP_STATUS.OK
): Response => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
};

// Error response utility
export const sendError = (
  res: Response,
  message: string = API_MESSAGES.ERROR,
  statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
  error?: any
): Response => {
  return res.status(statusCode).json({
    success: false,
    message,
    error: config.common.NODE_ENV === 'development' ? error : undefined,
    timestamp: new Date().toISOString(),
  });
};

// Bad request response utility
export const sendBadRequest = (
  res: Response,
  message: string = API_MESSAGES.VALIDATION_ERROR,
  errors?: any
): Response => {
  return res.status(HTTP_STATUS.BAD_REQUEST).json({
    success: false,
    message,
    errors,
    timestamp: new Date().toISOString(),
  });
};

// Unauthorized response utility
export const sendUnauthorized = (
  res: Response,
  message: string = API_MESSAGES.UNAUTHORIZED
): Response => {
  return res.status(HTTP_STATUS.UNAUTHORIZED).json({
    success: false,
    message,
    timestamp: new Date().toISOString(),
  });
};

// Forbidden response utility
export const sendForbidden = (
  res: Response,
  message: string = API_MESSAGES.FORBIDDEN
): Response => {
  return res.status(HTTP_STATUS.FORBIDDEN).json({
    success: false,
    message,
    timestamp: new Date().toISOString(),
  });
};

// Not found response utility
export const sendNotFound = (
  res: Response,
  message: string = API_MESSAGES.NOT_FOUND
): Response => {
  return res.status(HTTP_STATUS.NOT_FOUND).json({
    success: false,
    message,
    timestamp: new Date().toISOString(),
  });
};

// Conflict response utility
export const sendConflict = (
  res: Response,
  message: string,
  data?: any
): Response => {
  return res.status(HTTP_STATUS.CONFLICT).json({
    success: false,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
};

// Created response utility
export const sendCreated = (
  res: Response,
  data: any,
  message: string = API_MESSAGES.SUCCESS
): Response => {
  return res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
};

// Generic response handler
export const sendResponse = (
  res: Response,
  statusCode: number,
  success: boolean,
  message: string,
  data: any = null
): Response => {
  return res.status(statusCode).json({
    success,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
};

// Async error handler wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Global error handler
export const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): Response => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  console.error(err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = { message, statusCode: HTTP_STATUS.NOT_FOUND };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = { message, statusCode: HTTP_STATUS.BAD_REQUEST };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((val: any) => val.message).join(', ');
    error = { message, statusCode: HTTP_STATUS.BAD_REQUEST };
  }

  return sendError(
    res,
    error.message || API_MESSAGES.INTERNAL_ERROR,
    error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR,
    err
  );
};
