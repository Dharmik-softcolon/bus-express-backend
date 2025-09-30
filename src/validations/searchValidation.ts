import { param, query } from 'express-validator';

export const searchBusesValidation = [
  query('from')
    .notEmpty()
    .withMessage('From location is required'),
  query('to')
    .notEmpty()
    .withMessage('To location is required'),
  query('departureDate')
    .isISO8601()
    .withMessage('Valid departure date is required'),
  query('passengers')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Passengers must be between 1 and 10'),
  query('busType')
    .optional()
    .isIn(['AC', 'Non-AC', 'Sleeper', 'Semi-Sleeper', 'Volvo', 'Luxury'])
    .withMessage('Invalid bus type'),
  query('sortBy')
    .optional()
    .isIn(['price', 'departure', 'duration', 'arrival'])
    .withMessage('Invalid sort option'),
  query('minPrice')
    .optional()
    .isNumeric()
    .isFloat({ min: 0 })
    .withMessage('Valid minimum price is required'),
  query('maxPrice')
    .optional()
    .isNumeric()
    .isFloat({ min: 0 })
    .withMessage('Valid maximum price is required'),
  query('amenities')
    .optional()
    .isString()
    .withMessage('Amenities must be a string'),
];

export const getPopularRoutesValidation = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
];

export const getAvailableSeatsValidation = [
  param('tripId')
    .isMongoId()
    .withMessage('Valid trip ID is required'),
];

export const getTripDetailsValidation = [
  param('tripId')
    .isMongoId()
    .withMessage('Valid trip ID is required'),
];

export const getSearchSuggestionsValidation = [
  query('query')
    .notEmpty()
    .withMessage('Search query is required')
    .isLength({ min: 2 })
    .withMessage('Search query must be at least 2 characters'),
  query('type')
    .optional()
    .isIn(['all', 'cities', 'routes'])
    .withMessage('Invalid suggestion type'),
];
