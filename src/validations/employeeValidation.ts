import { body, param, query } from 'express-validator';

export const createEmployeeValidation = [
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('phone')
    .matches(/^(\+91|91)?[6-9]\d{9}$/)
    .withMessage('Valid phone number is required'),
  body('role')
    .isIn(['BUS_OWNER', 'BUS_ADMIN', 'BUS_EMPLOYEE', 'BOOKING_MAN'])
    .withMessage('Invalid role - must be BUS_OWNER, BUS_ADMIN, BUS_EMPLOYEE, or BOOKING_MAN'),
  body('subrole')
    .optional()
    .isIn(['DRIVER', 'HELPER'])
    .withMessage('Invalid subrole - must be DRIVER or HELPER')
    .custom((value, { req }) => {
      if (req.body.role === 'BUS_EMPLOYEE' && !value) {
        throw new Error('Subrole is required for BUS_EMPLOYEE');
      }
      if (['BUS_ADMIN', 'BUS_OWNER', 'BOOKING_MAN'].includes(req.body.role) && value) {
        throw new Error(`Subrole should not be provided for ${req.body.role}`);
      }
      return true;
    }),
  body('license')
    .optional()
    .custom((value, { req }) => {
      if (req.body.role === 'BUS_EMPLOYEE' && req.body.subrole === 'DRIVER' && !value) {
        throw new Error('License number is required for drivers');
      }
      return true;
    }),
  body('aadhaarCard')
    .optional()
    .notEmpty()
    .withMessage('Aadhaar card is required'),
  body('address')
    .notEmpty()
    .withMessage('Address is required'),
  body('assignedBus')
    .optional()
    .custom((value, { req }) => {
      // Only require assignedBus for BUS_EMPLOYEE with DRIVER subrole
      if (req.body.role === 'BUS_EMPLOYEE' && req.body.subrole === 'DRIVER' && !value) {
        throw new Error('Assigned bus is required for drivers');
      }
      return true;
    }),
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be active or inactive'),
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
