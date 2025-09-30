import { body, param, query } from 'express-validator';

// Create booking validation
export const createBookingValidation = [
  body('trip')
    .notEmpty()
    .withMessage('Trip ID is required')
    .isMongoId()
    .withMessage('Trip ID must be a valid MongoDB ObjectId'),

  body('seats')
    .isArray({ min: 1 })
    .withMessage('At least one seat is required'),

  body('seats.*.seatNumber')
    .isInt({ min: 1 })
    .withMessage('Valid seat number is required'),

  body('seats.*.passengerName')
    .notEmpty()
    .withMessage('Passenger name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Passenger name must be between 2 and 50 characters'),

  body('seats.*.passengerAge')
    .isInt({ min: 1, max: 120 })
    .withMessage('Valid passenger age is required'),

  body('seats.*.passengerGender')
    .isIn(['Male', 'Female', 'Other'])
    .withMessage('Valid passenger gender is required'),

  body('seats.*.passengerPhone')
    .matches(/^(\+91|91)?[6-9]\d{9}$/)
    .withMessage('Valid passenger phone number is required'),

  body('boardingPoint')
    .notEmpty()
    .withMessage('Boarding point is required')
    .isLength({ max: 200 })
    .withMessage('Boarding point cannot exceed 200 characters'),

  body('droppingPoint')
    .notEmpty()
    .withMessage('Dropping point is required')
    .isLength({ max: 200 })
    .withMessage('Dropping point cannot exceed 200 characters'),

  body('paymentMethod')
    .optional()
    .isIn(['Credit Card', 'Debit Card', 'UPI', 'Net Banking', 'Wallet', 'Cash'])
    .withMessage('Invalid payment method'),
];

// Get all bookings validation
export const getAllBookingsValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('status')
    .optional()
    .isIn(['pending', 'confirmed', 'cancelled', 'completed'])
    .withMessage('Invalid booking status'),

  query('paymentStatus')
    .optional()
    .isIn(['pending', 'completed', 'failed', 'refunded'])
    .withMessage('Invalid payment status'),

  query('userId')
    .optional()
    .isMongoId()
    .withMessage('Valid user ID is required'),

  query('busId')
    .optional()
    .isMongoId()
    .withMessage('Valid bus ID is required'),

  query('routeId')
    .optional()
    .isMongoId()
    .withMessage('Valid route ID is required'),

  query('tripId')
    .optional()
    .isMongoId()
    .withMessage('Valid trip ID is required'),
];

// Get booking by ID validation
export const getBookingByIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Valid booking ID is required'),
];

// Get booking by reference validation
export const getBookingByReferenceValidation = [
  param('reference')
    .notEmpty()
    .withMessage('Booking reference is required')
    .isLength({ min: 6, max: 10 })
    .withMessage('Booking reference must be between 6 and 10 characters'),
];

// Update booking status validation
export const updateBookingStatusValidation = [
  param('id')
    .isMongoId()
    .withMessage('Valid booking ID is required'),

  body('status')
    .isIn(['pending', 'confirmed', 'cancelled', 'completed'])
    .withMessage('Invalid booking status'),
];

// Cancel booking validation
export const cancelBookingValidation = [
  param('id')
    .isMongoId()
    .withMessage('Valid booking ID is required'),

  body('cancellationReason')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Cancellation reason cannot exceed 500 characters'),
];

// Get booking statistics validation
export const getBookingStatisticsValidation = [
  query('period')
    .optional()
    .isIn(['daily', 'weekly', 'monthly', 'yearly'])
    .withMessage('Invalid period'),

  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Valid start date is required'),

  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Valid end date is required'),
];