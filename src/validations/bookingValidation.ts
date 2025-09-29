import { body } from 'express-validator';

// Create booking validation
export const createBookingValidation = [
  body('bus')
    .notEmpty()
    .withMessage('Bus ID is required')
    .isMongoId()
    .withMessage('Bus ID must be a valid MongoDB ObjectId'),

  body('route')
    .notEmpty()
    .withMessage('Route ID is required')
    .isMongoId()
    .withMessage('Route ID must be a valid MongoDB ObjectId'),

  body('journeyDate')
    .notEmpty()
    .withMessage('Journey date is required')
    .isISO8601()
    .withMessage('Journey date must be a valid ISO 8601 date')
    .custom((date) => {
      const journeyDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (journeyDate < today) {
        throw new Error('Journey date cannot be in the past');
      }
      
      const maxDate = new Date();
      maxDate.setDate(maxDate.getDate() + 90); // 90 days in advance
      
      if (journeyDate > maxDate) {
        throw new Error('Journey date cannot be more than 90 days in advance');
      }
      
      return true;
    }),

  body('seats')
    .notEmpty()
    .withMessage('Seats information is required')
    .isArray({ min: 1, max: 10 })
    .withMessage('At least 1 seat and maximum 10 seats can be booked')
    .custom((seats) => {
      for (const seat of seats) {
        if (!seat.seatNumber || typeof seat.seatNumber !== 'number') {
          throw new Error('Each seat must have a valid seat number');
        }
        if (!seat.passengerName || typeof seat.passengerName !== 'string') {
          throw new Error('Each seat must have a passenger name');
        }
        if (!seat.passengerAge || typeof seat.passengerAge !== 'number' || seat.passengerAge < 1 || seat.passengerAge > 120) {
          throw new Error('Each seat must have a valid passenger age (1-120)');
        }
        if (!seat.passengerGender || !['Male', 'Female', 'Other'].includes(seat.passengerGender)) {
          throw new Error('Each seat must have a valid passenger gender (Male, Female, Other)');
        }
        if (!seat.passengerPhone || typeof seat.passengerPhone !== 'string') {
          throw new Error('Each seat must have a passenger phone number');
        }
        
        // Validate phone number format
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        if (!phoneRegex.test(seat.passengerPhone.replace(/\s/g, ''))) {
          throw new Error('Invalid phone number format');
        }
        
        // Validate passenger name
        if (seat.passengerName.trim().length < 2 || seat.passengerName.trim().length > 50) {
          throw new Error('Passenger name must be between 2 and 50 characters');
        }
      }
      return true;
    }),

  body('boardingPoint')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Boarding point cannot exceed 200 characters'),

  body('droppingPoint')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Dropping point cannot exceed 200 characters'),

  body('paymentMethod')
    .optional()
    .isIn(['Credit Card', 'Debit Card', 'UPI', 'Net Banking', 'Wallet', 'Cash'])
    .withMessage('Payment method must be one of: Credit Card, Debit Card, UPI, Net Banking, Wallet, Cash'),

  body('specialRequests')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Special requests cannot exceed 500 characters'),
];

// Get all bookings validation (query parameters)
export const getAllBookingsValidation = [
  body('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  body('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  body('search')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search term cannot exceed 100 characters'),

  body('bookingStatus')
    .optional()
    .isIn(['pending', 'confirmed', 'cancelled', 'completed'])
    .withMessage('Booking status must be pending, confirmed, cancelled, or completed'),

  body('paymentStatus')
    .optional()
    .isIn(['pending', 'completed', 'failed', 'refunded'])
    .withMessage('Payment status must be pending, completed, failed, or refunded'),

  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),

  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date'),
];

// Get booking by ID validation (no body validation needed for GET)
export const getBookingByIdValidation = [];

// Get booking by reference validation (no body validation needed for GET)
export const getBookingByReferenceValidation = [];

// Update booking status validation
export const updateBookingStatusValidation = [
  body('bookingStatus')
    .optional()
    .isIn(['pending', 'confirmed', 'cancelled', 'completed'])
    .withMessage('Booking status must be pending, confirmed, cancelled, or completed'),

  body('paymentStatus')
    .optional()
    .isIn(['pending', 'completed', 'failed', 'refunded'])
    .withMessage('Payment status must be pending, completed, failed, or refunded'),

  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Reason cannot exceed 500 characters'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters'),
];

// Cancel booking validation
export const cancelBookingValidation = [
  body('cancellationReason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Cancellation reason cannot exceed 500 characters'),

  body('refundRequested')
    .optional()
    .isBoolean()
    .withMessage('Refund requested must be a boolean value'),

  body('refundMethod')
    .optional()
    .isIn(['original', 'wallet', 'bank'])
    .withMessage('Refund method must be original, wallet, or bank'),
];

// Get booking statistics validation (no body validation needed for GET)
export const getBookingStatisticsValidation = [
  body('period')
    .optional()
    .isIn(['day', 'week', 'month', 'year'])
    .withMessage('Period must be day, week, month, or year'),

  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),

  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date'),
];

// Reschedule booking validation
export const rescheduleBookingValidation = [
  body('newJourneyDate')
    .notEmpty()
    .withMessage('New journey date is required')
    .isISO8601()
    .withMessage('New journey date must be a valid ISO 8601 date')
    .custom((date) => {
      const journeyDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (journeyDate < today) {
        throw new Error('New journey date cannot be in the past');
      }
      
      const maxDate = new Date();
      maxDate.setDate(maxDate.getDate() + 90);
      
      if (journeyDate > maxDate) {
        throw new Error('New journey date cannot be more than 90 days in advance');
      }
      
      return true;
    }),

  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Reason cannot exceed 500 characters'),
];

// Add passenger to booking validation
export const addPassengerValidation = [
  body('seatNumber')
    .notEmpty()
    .withMessage('Seat number is required')
    .isInt({ min: 1 })
    .withMessage('Seat number must be a positive integer'),

  body('passengerName')
    .trim()
    .notEmpty()
    .withMessage('Passenger name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Passenger name must be between 2 and 50 characters'),

  body('passengerAge')
    .notEmpty()
    .withMessage('Passenger age is required')
    .isInt({ min: 1, max: 120 })
    .withMessage('Passenger age must be between 1 and 120'),

  body('passengerGender')
    .notEmpty()
    .withMessage('Passenger gender is required')
    .isIn(['Male', 'Female', 'Other'])
    .withMessage('Passenger gender must be Male, Female, or Other'),

  body('passengerPhone')
    .trim()
    .notEmpty()
    .withMessage('Passenger phone is required')
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Invalid phone number format'),
];

// Remove passenger from booking validation
export const removePassengerValidation = [
  body('seatNumber')
    .notEmpty()
    .withMessage('Seat number is required')
    .isInt({ min: 1 })
    .withMessage('Seat number must be a positive integer'),
];

