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
    .withMessage('From must be an object')
    .custom((from) => {
      if (!from.city || !from.state) {
        throw new Error('From location must have city and state');
      }
      if (!from.coordinates || !from.coordinates.latitude || !from.coordinates.longitude) {
        throw new Error('From location must have valid coordinates');
      }
      if (typeof from.coordinates.latitude !== 'number' || typeof from.coordinates.longitude !== 'number') {
        throw new Error('Coordinates must be numbers');
      }
      if (from.coordinates.latitude < -90 || from.coordinates.latitude > 90) {
        throw new Error('Latitude must be between -90 and 90');
      }
      if (from.coordinates.longitude < -180 || from.coordinates.longitude > 180) {
        throw new Error('Longitude must be between -180 and 180');
      }
      return true;
    }),

  body('to')
    .notEmpty()
    .withMessage('To location is required')
    .isObject()
    .withMessage('To must be an object')
    .custom((to) => {
      if (!to.city || !to.state) {
        throw new Error('To location must have city and state');
      }
      if (!to.coordinates || !to.coordinates.latitude || !to.coordinates.longitude) {
        throw new Error('To location must have valid coordinates');
      }
      if (typeof to.coordinates.latitude !== 'number' || typeof to.coordinates.longitude !== 'number') {
        throw new Error('Coordinates must be numbers');
      }
      if (to.coordinates.latitude < -90 || to.coordinates.latitude > 90) {
        throw new Error('Latitude must be between -90 and 90');
      }
      if (to.coordinates.longitude < -180 || to.coordinates.longitude > 180) {
        throw new Error('Longitude must be between -180 and 180');
      }
      return true;
    }),

  body('distance')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Distance must be a positive number'),

  body('duration')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Duration must be a non-negative integer'),

  body('stops')
    .optional()
    .isArray()
    .withMessage('Stops must be an array')
    .custom((stops) => {
      if (stops && stops.length > 0) {
        for (const stop of stops) {
          if (!stop.name || !stop.city) {
            throw new Error('Each stop must have name and city');
          }
          if (!stop.coordinates || !stop.coordinates.latitude || !stop.coordinates.longitude) {
            throw new Error('Each stop must have valid coordinates');
          }
          if (typeof stop.coordinates.latitude !== 'number' || typeof stop.coordinates.longitude !== 'number') {
            throw new Error('Stop coordinates must be numbers');
          }
        }
      }
      return true;
    }),

  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean value'),
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

  body('fromCity')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('From city cannot exceed 50 characters'),

  body('toCity')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('To city cannot exceed 50 characters'),

  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean value'),
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
    .withMessage('From must be an object')
    .custom((from) => {
      if (from) {
        if (!from.city || !from.state) {
          throw new Error('From location must have city and state');
        }
        if (!from.coordinates || !from.coordinates.latitude || !from.coordinates.longitude) {
          throw new Error('From location must have valid coordinates');
        }
        if (typeof from.coordinates.latitude !== 'number' || typeof from.coordinates.longitude !== 'number') {
          throw new Error('Coordinates must be numbers');
        }
        if (from.coordinates.latitude < -90 || from.coordinates.latitude > 90) {
          throw new Error('Latitude must be between -90 and 90');
        }
        if (from.coordinates.longitude < -180 || from.coordinates.longitude > 180) {
          throw new Error('Longitude must be between -180 and 180');
        }
      }
      return true;
    }),

  body('to')
    .optional()
    .isObject()
    .withMessage('To must be an object')
    .custom((to) => {
      if (to) {
        if (!to.city || !to.state) {
          throw new Error('To location must have city and state');
        }
        if (!to.coordinates || !to.coordinates.latitude || !to.coordinates.longitude) {
          throw new Error('To location must have valid coordinates');
        }
        if (typeof to.coordinates.latitude !== 'number' || typeof to.coordinates.longitude !== 'number') {
          throw new Error('Coordinates must be numbers');
        }
        if (to.coordinates.latitude < -90 || to.coordinates.latitude > 90) {
          throw new Error('Latitude must be between -90 and 90');
        }
        if (to.coordinates.longitude < -180 || to.coordinates.longitude > 180) {
          throw new Error('Longitude must be between -180 and 180');
        }
      }
      return true;
    }),

  body('distance')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Distance must be a positive number'),

  body('duration')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Duration must be a non-negative integer'),

  body('stops')
    .optional()
    .isArray()
    .withMessage('Stops must be an array')
    .custom((stops) => {
      if (stops && stops.length > 0) {
        for (const stop of stops) {
          if (!stop.name || !stop.city) {
            throw new Error('Each stop must have name and city');
          }
          if (!stop.coordinates || !stop.coordinates.latitude || !stop.coordinates.longitude) {
            throw new Error('Each stop must have valid coordinates');
          }
          if (typeof stop.coordinates.latitude !== 'number' || typeof stop.coordinates.longitude !== 'number') {
            throw new Error('Stop coordinates must be numbers');
          }
        }
      }
      return true;
    }),

  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean value'),
];

// Delete route validation (no body validation needed for DELETE)
export const deleteRouteValidation = [];

// Search routes validation
export const searchRoutesValidation = [
  body('fromCity')
    .trim()
    .notEmpty()
    .withMessage('From city is required')
    .isLength({ max: 50 })
    .withMessage('From city cannot exceed 50 characters'),

  body('toCity')
    .trim()
    .notEmpty()
    .withMessage('To city is required')
    .isLength({ max: 50 })
    .withMessage('To city cannot exceed 50 characters'),

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

// Add stop to route validation
export const addStopToRouteValidation = [
  body('stop')
    .notEmpty()
    .withMessage('Stop is required')
    .isObject()
    .withMessage('Stop must be an object')
    .custom((stop) => {
      if (!stop.name || !stop.city) {
        throw new Error('Stop must have name and city');
      }
      if (!stop.coordinates || !stop.coordinates.latitude || !stop.coordinates.longitude) {
        throw new Error('Stop must have valid coordinates');
      }
      if (typeof stop.coordinates.latitude !== 'number' || typeof stop.coordinates.longitude !== 'number') {
        throw new Error('Stop coordinates must be numbers');
      }
      return true;
    }),

  body('arrivalTime')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Arrival time must be in HH:MM format'),

  body('departureTime')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Departure time must be in HH:MM format'),
];

// Remove stop from route validation
export const removeStopFromRouteValidation = [
  body('stopName')
    .trim()
    .notEmpty()
    .withMessage('Stop name is required')
    .isLength({ max: 100 })
    .withMessage('Stop name cannot exceed 100 characters'),
];

// Update route status validation
export const updateRouteStatusValidation = [
  body('isActive')
    .notEmpty()
    .withMessage('isActive is required')
    .isBoolean()
    .withMessage('isActive must be a boolean value'),

  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Reason cannot exceed 500 characters'),
];

