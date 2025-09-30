import { Router } from 'express';
import {
  createEmployee,
  getAllEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  updateEmployeeStatus,
  getEmployeeStatistics,
} from '../controllers/employeeController';
import { authenticate, adminOnly } from '../middleware/auth';
import { validateRequest, paginationMiddleware } from '../middleware/validation';
import {
  createEmployeeValidation,
  getAllEmployeesValidation,
  getEmployeeByIdValidation,
  updateEmployeeValidation,
  deleteEmployeeValidation,
  updateEmployeeStatusValidation,
  getEmployeeStatisticsValidation,
} from '../validations/employeeValidation';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Employee management routes
router.post('/', adminOnly, [...createEmployeeValidation, validateRequest], createEmployee);

router.get('/', paginationMiddleware, [...getAllEmployeesValidation, validateRequest], getAllEmployees);

router.get('/statistics', adminOnly, [...getEmployeeStatisticsValidation, validateRequest], getEmployeeStatistics);

router.get('/:id', [...getEmployeeByIdValidation, validateRequest], getEmployeeById);

router.put('/:id', adminOnly, [...updateEmployeeValidation, validateRequest], updateEmployee);

router.put('/:id/status', adminOnly, [...updateEmployeeStatusValidation, validateRequest], updateEmployeeStatus);

router.delete('/:id', adminOnly, [...deleteEmployeeValidation, validateRequest], deleteEmployee);

export default router;
