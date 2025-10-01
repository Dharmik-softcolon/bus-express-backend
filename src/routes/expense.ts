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
import { authenticate, busOwnerOrBusAdmin } from '../middleware/auth';
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
router.post('/', busOwnerOrBusAdmin, [...createExpenseValidation, validateRequest], createExpense);

router.get('/', paginationMiddleware, [...getAllExpensesValidation, validateRequest], getAllExpenses);

router.get('/analytics', busOwnerOrBusAdmin, [...getExpenseAnalyticsValidation, validateRequest], getExpenseAnalytics);

router.get('/:id', [...getExpenseByIdValidation, validateRequest], getExpenseById);

router.put('/:id', busOwnerOrBusAdmin, [...updateExpenseValidation, validateRequest], updateExpense);

router.put('/:id/approve', busOwnerOrBusAdmin, [...approveExpenseValidation, validateRequest], approveExpense);

router.put('/:id/reject', busOwnerOrBusAdmin, [...rejectExpenseValidation, validateRequest], rejectExpense);

router.delete('/:id', busOwnerOrBusAdmin, [...deleteExpenseValidation, validateRequest], deleteExpense);

export default router;
