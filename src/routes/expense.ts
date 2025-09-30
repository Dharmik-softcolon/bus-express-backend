import { Router } from 'express';
import {
  createExpense,
  getAllExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  approveExpense,
  rejectExpense,
  getExpenseAnalytics,
} from '../controllers/expenseController';
import { authenticate, operatorOrAdmin } from '../middleware/auth';
import { validateRequest, paginationMiddleware } from '../middleware/validation';
import {
  createExpenseValidation,
  getAllExpensesValidation,
  getExpenseByIdValidation,
  updateExpenseValidation,
  deleteExpenseValidation,
  approveExpenseValidation,
  rejectExpenseValidation,
  getExpenseAnalyticsValidation,
} from '../validations/expenseValidation';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Expense management routes
router.post('/', operatorOrAdmin, [...createExpenseValidation, validateRequest], createExpense);

router.get('/', paginationMiddleware, [...getAllExpensesValidation, validateRequest], getAllExpenses);

router.get('/analytics', operatorOrAdmin, [...getExpenseAnalyticsValidation, validateRequest], getExpenseAnalytics);

router.get('/:id', [...getExpenseByIdValidation, validateRequest], getExpenseById);

router.put('/:id', operatorOrAdmin, [...updateExpenseValidation, validateRequest], updateExpense);

router.put('/:id/approve', operatorOrAdmin, [...approveExpenseValidation, validateRequest], approveExpense);

router.put('/:id/reject', operatorOrAdmin, [...rejectExpenseValidation, validateRequest], rejectExpense);

router.delete('/:id', operatorOrAdmin, [...deleteExpenseValidation, validateRequest], deleteExpense);

export default router;
