import { body, param, query } from 'express-validator';

export const createTripValidation = [
  body('route')
    .isMongoId()
    .withMessage('Valid route ID is required'),
  body('bus')
    .isMongoId()
    .withMessage('Valid bus ID is required'),
  body('driver')
    .isMongoId()
    .withMessage('Valid driver ID is required'),
  body('helper')
    .optional()
    .isMongoId()
    .withMessage('Valid helper ID is required'),
  body('departureTime')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Valid departure time is required (HH:MM)'),
  body('arrivalTime')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Valid arrival time is required (HH:MM)'),
  body('departureDate')
    .isISO8601()
    .withMessage('Valid departure date is required'),
  body('pickupPoints')
    .isArray({ min: 1 })
    .withMessage('At least one pickup point is required'),
  body('pickupPoints.*.name')
    .notEmpty()
    .withMessage('Pickup point name is required'),
  body('pickupPoints.*.address')
    .notEmpty()
    .withMessage('Pickup point address is required'),
  body('pickupPoints.*.time')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Valid pickup time is required (HH:MM)'),
  body('dropPoints')
    .isArray({ min: 1 })
    .withMessage('At least one drop point is required'),
  body('dropPoints.*.name')
    .notEmpty()
    .withMessage('Drop point name is required'),
  body('dropPoints.*.address')
    .notEmpty()
    .withMessage('Drop point address is required'),
  body('dropPoints.*.time')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Valid drop time is required (HH:MM)'),
  body('fare')
    .isNumeric()
    .isFloat({ min: 0 })
    .withMessage('Valid fare amount is required'),
];

export const getAllTripsValidation = [
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
    .isIn(['scheduled', 'in_progress', 'completed', 'cancelled', 'delayed'])
    .withMessage('Invalid status'),
  query('route')
    .optional()
    .isMongoId()
    .withMessage('Valid route ID is required'),
  query('bus')
    .optional()
    .isMongoId()
    .withMessage('Valid bus ID is required'),
  query('driver')
    .optional()
    .isMongoId()
    .withMessage('Valid driver ID is required'),
  query('departureDate')
    .optional()
    .isISO8601()
    .withMessage('Valid departure date is required'),
];

export const getTripByIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Valid trip ID is required'),
];

export const updateTripValidation = [
  param('id')
    .isMongoId()
    .withMessage('Valid trip ID is required'),
  body('departureTime')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Valid departure time is required (HH:MM)'),
  body('arrivalTime')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Valid arrival time is required (HH:MM)'),
  body('departureDate')
    .optional()
    .isISO8601()
    .withMessage('Valid departure date is required'),
  body('fare')
    .optional()
    .isNumeric()
    .isFloat({ min: 0 })
    .withMessage('Valid fare amount is required'),
];

export const deleteTripValidation = [
  param('id')
    .isMongoId()
    .withMessage('Valid trip ID is required'),
];

export const updateTripStatusValidation = [
  param('id')
    .isMongoId()
    .withMessage('Valid trip ID is required'),
  body('status')
    .isIn(['scheduled', 'in_progress', 'completed', 'cancelled', 'delayed'])
    .withMessage('Invalid status'),
];

export const getTripStatisticsValidation = [
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
