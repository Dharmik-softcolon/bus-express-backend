import { body } from 'express-validator';

// Create bus validation
export const createBusValidation = [
  body('busNumber')
    .trim()
    .notEmpty()
    .withMessage('Bus number is required')
    .isLength({ min: 1, max: 20 })
    .withMessage('Bus number must be between 1 and 20 characters')
    .matches(/^[A-Z0-9\-\s]+$/)
    .withMessage('Bus number can only contain uppercase letters, numbers, hyphens, and spaces'),

  body('busName')
    .trim()
    .notEmpty()
    .withMessage('Bus name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Bus name must be between 2 and 100 characters'),

  body('type')
    .notEmpty()
    .withMessage('Bus type is required')
    .isIn(['AC', 'Non-AC', 'Sleeper', 'Semi-Sleeper', 'Volvo', 'Luxury'])
    .withMessage('Bus type must be one of: AC, Non-AC, Sleeper, Semi-Sleeper, Volvo, Luxury'),

  body('totalSeats')
    .notEmpty()
    .withMessage('Total seats is required')
    .isInt({ min: 1, max: 100 })
    .withMessage('Total seats must be between 1 and 100'),

  body('amenities')
    .optional()
    .isArray()
    .withMessage('Amenities must be an array')
    .custom((amenities) => {
      if (amenities && amenities.length > 0) {
        const validAmenities = ['WiFi', 'Charging', 'Blankets', 'Water', 'Snacks', 'TV', 'Music', 'Air Conditioning'];
        for (const amenity of amenities) {
          if (!validAmenities.includes(amenity)) {
            throw new Error(`Invalid amenity: ${amenity}. Valid amenities are: ${validAmenities.join(', ')}`);
          }
        }
      }
      return true;
    }),

  body('features')
    .optional()
    .isObject()
    .withMessage('Features must be an object')
    .custom((features) => {
      if (features) {
        const validFeatures = ['wifi', 'charging', 'blankets', 'water', 'snacks'];
        for (const key of Object.keys(features)) {
          if (!validFeatures.includes(key)) {
            throw new Error(`Invalid feature: ${key}. Valid features are: ${validFeatures.join(', ')}`);
          }
          if (typeof features[key] !== 'boolean') {
            throw new Error(`Feature ${key} must be a boolean value`);
          }
        }
      }
      return true;
    }),

  body('images')
    .optional()
    .isArray()
    .withMessage('Images must be an array')
    .custom((images) => {
      if (images && images.length > 0) {
        for (const image of images) {
          if (typeof image !== 'string') {
            throw new Error('Each image must be a string URL');
          }
        }
      }
      return true;
    }),
];

// Get all buses validation (query parameters)
export const getAllBusesValidation = [
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

  body('type')
    .optional()
    .isIn(['AC', 'Non-AC', 'Sleeper', 'Semi-Sleeper', 'Volvo', 'Luxury'])
    .withMessage('Bus type must be one of: AC, Non-AC, Sleeper, Semi-Sleeper, Volvo, Luxury'),

  body('status')
    .optional()
    .isIn(['active', 'inactive', 'maintenance'])
    .withMessage('Status must be active, inactive, or maintenance'),

  body('minSeats')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Minimum seats must be a positive integer'),

  body('maxSeats')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Maximum seats must be a positive integer'),
];

// Get bus by ID validation (no body validation needed for GET)
export const getBusByIdValidation = [];

// Update bus validation
export const updateBusValidation = [
  body('busNumber')
    .optional()
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage('Bus number must be between 1 and 20 characters')
    .matches(/^[A-Z0-9\-\s]+$/)
    .withMessage('Bus number can only contain uppercase letters, numbers, hyphens, and spaces'),

  body('busName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Bus name must be between 2 and 100 characters'),

  body('type')
    .optional()
    .isIn(['AC', 'Non-AC', 'Sleeper', 'Semi-Sleeper', 'Volvo', 'Luxury'])
    .withMessage('Bus type must be one of: AC, Non-AC, Sleeper, Semi-Sleeper, Volvo, Luxury'),

  body('totalSeats')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Total seats must be between 1 and 100'),

  body('availableSeats')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Available seats must be a non-negative integer'),

  body('amenities')
    .optional()
    .isArray()
    .withMessage('Amenities must be an array')
    .custom((amenities) => {
      if (amenities && amenities.length > 0) {
        const validAmenities = ['WiFi', 'Charging', 'Blankets', 'Water', 'Snacks', 'TV', 'Music', 'Air Conditioning'];
        for (const amenity of amenities) {
          if (!validAmenities.includes(amenity)) {
            throw new Error(`Invalid amenity: ${amenity}. Valid amenities are: ${validAmenities.join(', ')}`);
          }
        }
      }
      return true;
    }),

  body('features')
    .optional()
    .isObject()
    .withMessage('Features must be an object')
    .custom((features) => {
      if (features) {
        const validFeatures = ['wifi', 'charging', 'blankets', 'water', 'snacks'];
        for (const key of Object.keys(features)) {
          if (!validFeatures.includes(key)) {
            throw new Error(`Invalid feature: ${key}. Valid features are: ${validFeatures.join(', ')}`);
          }
          if (typeof features[key] !== 'boolean') {
            throw new Error(`Feature ${key} must be a boolean value`);
          }
        }
      }
      return true;
    }),

  body('images')
    .optional()
    .isArray()
    .withMessage('Images must be an array')
    .custom((images) => {
      if (images && images.length > 0) {
        for (const image of images) {
          if (typeof image !== 'string') {
            throw new Error('Each image must be a string URL');
          }
        }
      }
      return true;
    }),

  body('status')
    .optional()
    .isIn(['active', 'inactive', 'maintenance'])
    .withMessage('Status must be active, inactive, or maintenance'),
];

// Delete bus validation (no body validation needed for DELETE)
export const deleteBusValidation = [];

// Get buses by operator validation (query parameters)
export const getBusesByOperatorValidation = [
  body('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  body('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  body('status')
    .optional()
    .isIn(['active', 'inactive', 'maintenance'])
    .withMessage('Status must be active, inactive, or maintenance'),
];

// Update bus status validation
export const updateBusStatusValidation = [
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['active', 'inactive', 'maintenance'])
    .withMessage('Status must be active, inactive, or maintenance'),

  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Reason cannot exceed 500 characters'),
];

// Get bus statistics validation (no body validation needed for GET)
export const getBusStatisticsValidation = [];

