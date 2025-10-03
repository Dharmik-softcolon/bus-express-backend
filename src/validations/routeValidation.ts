import { body } from 'express-validator';

// Create route validation
export const createRouteValidation = [
  body('routeName')
    .trim()
    .notEmpty()
    .withMessage('Route name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Route name must be between 2 and 100 characters'),

  body('from')
    .notEmpty()
    .withMessage('From location is required')
    .isObject()
    .withMessage('From must be an object'),

  body('from.city')
    .trim()
    .notEmpty()
    .withMessage('From city is required'),

  body('from.state')
    .trim()
    .notEmpty()
    .withMessage('From state is required'),

  body('to')
    .notEmpty()
    .withMessage('To location is required')
    .isObject()
    .withMessage('To must be an object'),

  body('to.city')
    .trim()
    .notEmpty()
    .withMessage('To city is required'),

  body('to.state')
    .trim()
    .notEmpty()
    .withMessage('To state is required'),

  body('distance')
    .notEmpty()
    .withMessage('Distance is required')
    .isFloat({ min: 0 })
    .withMessage('Distance must be a positive number'),

  body('time')
    .notEmpty()
    .withMessage('Time is required')
    .isInt({ min: 0 })
    .withMessage('Time must be a non-negative integer'),

  body('pickupPoints')
    .optional()
    .isArray()
    .withMessage('Pickup points must be an array')
    .custom((pickupPoints) => {
      if (pickupPoints && pickupPoints.length > 0) {
        for (const point of pickupPoints) {
          if (!point.name || typeof point.name !== 'string') {
            throw new Error('Each pickup point must have a name');
          }
        }
      }
      return true;
    }),

  body('dropPoints')
    .optional()
    .isArray()
    .withMessage('Drop points must be an array')
    .custom((dropPoints) => {
      if (dropPoints && dropPoints.length > 0) {
        for (const point of dropPoints) {
          if (!point.name || typeof point.name !== 'string') {
            throw new Error('Each drop point must have a name');
          }
        }
      }
      return true;
    }),

  body('fare')
    .notEmpty()
    .withMessage('Fare is required')
    .isFloat({ min: 0 })
    .withMessage('Fare must be a positive number'),
];

// Get all routes validation (query parameters)
export const getAllRoutesValidation = [
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

  body('startCity')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Start city cannot exceed 50 characters'),

  body('endCity')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('End city cannot exceed 50 characters'),
];

// Get route by ID validation (no body validation needed for GET)
export const getRouteByIdValidation = [];

// Update route validation
export const updateRouteValidation = [
  body('routeName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Route name must be between 2 and 100 characters'),

  body('from')
    .optional()
    .isObject()
    .withMessage('From must be an object'),

  body('from.city')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('From city cannot be empty'),

  body('from.state')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('From state cannot be empty'),

  body('to')
    .optional()
    .isObject()
    .withMessage('To must be an object'),

  body('to.city')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('To city cannot be empty'),

  body('to.state')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('To state cannot be empty'),

  body('distance')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Distance must be a positive number'),

  body('time')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Time must be a non-negative integer'),

  body('pickupPoints')
    .optional()
    .isArray()
    .withMessage('Pickup points must be an array')
    .custom((pickupPoints) => {
      if (pickupPoints && pickupPoints.length > 0) {
        for (const point of pickupPoints) {
          if (!point.name || typeof point.name !== 'string') {
            throw new Error('Each pickup point must have a name');
          }
        }
      }
      return true;
    }),

  body('dropPoints')
    .optional()
    .isArray()
    .withMessage('Drop points must be an array')
    .custom((dropPoints) => {
      if (dropPoints && dropPoints.length > 0) {
        for (const point of dropPoints) {
          if (!point.name || typeof point.name !== 'string') {
            throw new Error('Each drop point must have a name');
          }
        }
      }
      return true;
    }),

  body('fare')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Fare must be a positive number'),
];

// Delete route validation (no body validation needed for DELETE)
export const deleteRouteValidation = [];

// Search routes validation
export const searchRoutesValidation = [
  body('startCity')
    .trim()
    .notEmpty()
    .withMessage('Start city is required')
    .isLength({ max: 50 })
    .withMessage('Start city cannot exceed 50 characters'),

  body('endCity')
    .trim()
    .notEmpty()
    .withMessage('End city is required')
    .isLength({ max: 50 })
    .withMessage('End city cannot exceed 50 characters'),

  body('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be a valid ISO 8601 date'),

  body('passengers')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Passengers must be between 1 and 10'),
];

// Get popular routes validation (query parameters)
export const getPopularRoutesValidation = [
  body('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),

  body('period')
    .optional()
    .isIn(['week', 'month', 'year'])
    .withMessage('Period must be week, month, or year'),
];

// Add pickup point validation
export const addPickupPointValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Pickup point name is required')
    .isLength({ max: 100 })
    .withMessage('Pickup point name cannot exceed 100 characters'),
];

// Remove pickup point validation
export const removePickupPointValidation = [
  body('index')
    .notEmpty()
    .withMessage('Index is required')
    .isInt({ min: 0 })
    .withMessage('Index must be a non-negative integer'),
];

// Add drop point validation
export const addDropPointValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Drop point name is required')
    .isLength({ max: 100 })
    .withMessage('Drop point name cannot exceed 100 characters'),
];

// Remove drop point validation
export const removeDropPointValidation = [
  body('index')
    .notEmpty()
    .withMessage('Index is required')
    .isInt({ min: 0 })
    .withMessage('Index must be a non-negative integer'),
];

