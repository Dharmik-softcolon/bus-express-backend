import { body, param, query } from 'express-validator';

export const createExpenseValidation = [
  body('bus')
    .isMongoId()
    .withMessage('Valid bus ID is required'),
  body('type')
    .isIn(['fuel', 'maintenance', 'toll', 'parking', 'repair', 'insurance', 'other'])
    .withMessage('Invalid expense type'),
  body('amount')
    .isNumeric()
    .isFloat({ min: 0 })
    .withMessage('Valid amount is required'),
  body('description')
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Valid date is required'),
  body('category')
    .isIn(['Fuel', 'Maintenance', 'Toll', 'Parking', 'Repair', 'Insurance', 'Other'])
    .withMessage('Invalid category'),
];

export const getAllExpensesValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('bus')
    .optional()
    .isMongoId()
    .withMessage('Valid bus ID is required'),
  query('type')
    .optional()
    .isIn(['fuel', 'maintenance', 'toll', 'parking', 'repair', 'insurance', 'other'])
    .withMessage('Invalid expense type'),
  query('category')
    .optional()
    .isIn(['Fuel', 'Maintenance', 'Toll', 'Parking', 'Repair', 'Insurance', 'Other'])
    .withMessage('Invalid category'),
  query('status')
    .optional()
    .isIn(['pending', 'approved', 'rejected'])
    .withMessage('Invalid status'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Valid start date is required'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Valid end date is required'),
];

export const getExpenseByIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Valid expense ID is required'),
];

export const updateExpenseValidation = [
  param('id')
    .isMongoId()
    .withMessage('Valid expense ID is required'),
  body('type')
    .optional()
    .isIn(['fuel', 'maintenance', 'toll', 'parking', 'repair', 'insurance', 'other'])
    .withMessage('Invalid expense type'),
  body('amount')
    .optional()
    .isNumeric()
    .isFloat({ min: 0 })
    .withMessage('Valid amount is required'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('category')
    .optional()
    .isIn(['Fuel', 'Maintenance', 'Toll', 'Parking', 'Repair', 'Insurance', 'Other'])
    .withMessage('Invalid category'),
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters'),
];

export const deleteExpenseValidation = [
  param('id')
    .isMongoId()
    .withMessage('Valid expense ID is required'),
];

export const approveExpenseValidation = [
  param('id')
    .isMongoId()
    .withMessage('Valid expense ID is required'),
  body('approvedBy')
    .isMongoId()
    .withMessage('Valid approver ID is required'),
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters'),
];

export const rejectExpenseValidation = [
  param('id')
    .isMongoId()
    .withMessage('Valid expense ID is required'),
  body('notes')
    .notEmpty()
    .withMessage('Rejection reason is required')
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters'),
];

export const getExpenseAnalyticsValidation = [
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
  query('bus')
    .optional()
    .isMongoId()
    .withMessage('Valid bus ID is required'),
];
