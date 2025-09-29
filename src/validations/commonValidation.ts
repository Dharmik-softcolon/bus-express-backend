import { body, param, query } from 'express-validator';

// Common MongoDB ObjectId validation
export const mongoIdValidation = (fieldName: string = 'id') => [
  param(fieldName)
    .isMongoId()
    .withMessage(`${fieldName} must be a valid MongoDB ObjectId`),
];

// Common pagination validation
export const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];

// Common search validation
export const searchValidation = [
  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search term cannot exceed 100 characters'),
];

// Common date range validation
export const dateRangeValidation = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),

  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date'),
];

// Common status validation
export const statusValidation = (validStatuses: string[]) => [
  query('status')
    .optional()
    .isIn(validStatuses)
    .withMessage(`Status must be one of: ${validStatuses.join(', ')}`),
];

// Common boolean validation
export const booleanValidation = (fieldName: string) => [
  query(fieldName)
    .optional()
    .isBoolean()
    .withMessage(`${fieldName} must be a boolean value`),
];

// Common sort validation
export const sortValidation = (allowedFields: string[]) => [
  query('sortBy')
    .optional()
    .isIn(allowedFields)
    .withMessage(`Sort field must be one of: ${allowedFields.join(', ')}`),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
];

// Common file upload validation
export const fileUploadValidation = [
  body('file')
    .optional()
    .custom((value, { req }) => {
      if (req.file) {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(req.file.mimetype)) {
          throw new Error('File type must be JPEG, PNG, GIF, or WebP');
        }
        
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (req.file.size > maxSize) {
          throw new Error('File size must be less than 5MB');
        }
      }
      return true;
    }),
];

// Common coordinates validation
export const coordinatesValidation = (fieldName: string) => [
  body(`${fieldName}.latitude`)
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),

  body(`${fieldName}.longitude`)
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
];

// Common phone number validation
export const phoneValidation = (fieldName: string = 'phone') => [
  body(fieldName)
    .optional()
    .trim()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please provide a valid phone number'),
];

// Common email validation
export const emailValidation = (fieldName: string = 'email') => [
  body(fieldName)
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
];

// Common password validation
export const passwordValidation = (fieldName: string = 'password', required: boolean = true) => {
  const validation = [
    body(fieldName)
      .isLength({ min: 6, max: 128 })
      .withMessage('Password must be between 6 and 128 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  ];

  if (required) {
    validation[0] = validation[0].notEmpty().withMessage('Password is required');
  } else {
    validation[0] = validation[0].optional();
  }

  return validation;
};

// Common name validation
export const nameValidation = (fieldName: string = 'name', required: boolean = true) => {
  const validation = [
    body(fieldName)
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Name must be between 2 and 50 characters')
      .matches(/^[a-zA-Z\s]+$/)
      .withMessage('Name can only contain letters and spaces'),
  ];

  if (required) {
    validation[0] = validation[0].notEmpty().withMessage('Name is required');
  } else {
    validation[0] = validation[0].optional();
  }

  return validation;
};

// Common text validation
export const textValidation = (fieldName: string, maxLength: number = 500, required: boolean = true) => {
  const validation = [
    body(fieldName)
      .trim()
      .isLength({ max: maxLength })
      .withMessage(`${fieldName} cannot exceed ${maxLength} characters`),
  ];

  if (required) {
    validation[0] = validation[0].notEmpty().withMessage(`${fieldName} is required`);
  } else {
    validation[0] = validation[0].optional();
  }

  return validation;
};

// Common array validation
export const arrayValidation = (fieldName: string, required: boolean = true) => {
  const validation = [
    body(fieldName)
      .isArray()
      .withMessage(`${fieldName} must be an array`),
  ];

  if (required) {
    validation[0] = validation[0].notEmpty().withMessage(`${fieldName} is required`);
  } else {
    validation[0] = validation[0].optional();
  }

  return validation;
};

// Common object validation
export const objectValidation = (fieldName: string, required: boolean = true) => {
  const validation = [
    body(fieldName)
      .isObject()
      .withMessage(`${fieldName} must be an object`),
  ];

  if (required) {
    validation[0] = validation[0].notEmpty().withMessage(`${fieldName} is required`);
  } else {
    validation[0] = validation[0].optional();
  }

  return validation;
};

