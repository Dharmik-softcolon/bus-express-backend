import { body, param, query } from 'express-validator';

export const createEmployeeValidation = [
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('phone')
    .matches(/^(\+91|91)?[6-9]\d{9}$/)
    .withMessage('Valid phone number is required'),
  body('role')
    .isIn(['driver', 'helper', 'mechanic', 'admin'])
    .withMessage('Invalid role'),
  body('licenseNumber')
    .optional()
    .notEmpty()
    .withMessage('License number is required for drivers'),
  body('licenseExpiry')
    .optional()
    .isISO8601()
    .withMessage('Valid license expiry date is required'),
  body('address.street')
    .notEmpty()
    .withMessage('Street address is required'),
  body('address.city')
    .notEmpty()
    .withMessage('City is required'),
  body('address.state')
    .notEmpty()
    .withMessage('State is required'),
  body('address.pincode')
    .matches(/^\d{6}$/)
    .withMessage('Valid 6-digit pincode is required'),
  body('emergencyContact.name')
    .notEmpty()
    .withMessage('Emergency contact name is required'),
  body('emergencyContact.phone')
    .matches(/^(\+91|91)?[6-9]\d{9}$/)
    .withMessage('Valid emergency contact phone is required'),
  body('emergencyContact.relationship')
    .notEmpty()
    .withMessage('Emergency contact relationship is required'),
  body('salary')
    .optional()
    .isNumeric()
    .isFloat({ min: 0 })
    .withMessage('Valid salary amount is required'),
];

export const getAllEmployeesValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('role')
    .optional()
    .isIn(['driver', 'helper', 'mechanic', 'admin'])
    .withMessage('Invalid role'),
  query('status')
    .optional()
    .isIn(['active', 'inactive', 'on_leave', 'terminated'])
    .withMessage('Invalid status'),
  query('search')
    .optional()
    .isLength({ min: 2 })
    .withMessage('Search term must be at least 2 characters'),
];

export const getEmployeeByIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Valid employee ID is required'),
];

export const updateEmployeeValidation = [
  param('id')
    .isMongoId()
    .withMessage('Valid employee ID is required'),
  body('name')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('phone')
    .optional()
    .matches(/^(\+91|91)?[6-9]\d{9}$/)
    .withMessage('Valid phone number is required'),
  body('licenseNumber')
    .optional()
    .notEmpty()
    .withMessage('License number cannot be empty'),
  body('licenseExpiry')
    .optional()
    .isISO8601()
    .withMessage('Valid license expiry date is required'),
  body('salary')
    .optional()
    .isNumeric()
    .isFloat({ min: 0 })
    .withMessage('Valid salary amount is required'),
];

export const deleteEmployeeValidation = [
  param('id')
    .isMongoId()
    .withMessage('Valid employee ID is required'),
];

export const updateEmployeeStatusValidation = [
  param('id')
    .isMongoId()
    .withMessage('Valid employee ID is required'),
  body('status')
    .isIn(['active', 'inactive', 'on_leave', 'terminated'])
    .withMessage('Invalid status'),
];

export const getEmployeeStatisticsValidation = [
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
