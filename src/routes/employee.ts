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
import { authenticate, busAdminOnly } from '../middleware/auth';
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
router.post('/', busAdminOnly, [...createEmployeeValidation, validateRequest], createEmployee);

router.get('/', paginationMiddleware, [...getAllEmployeesValidation, validateRequest], getAllEmployees);

router.get('/statistics', busAdminOnly, [...getEmployeeStatisticsValidation, validateRequest], getEmployeeStatistics);

router.get('/:id', [...getEmployeeByIdValidation, validateRequest], getEmployeeById);

router.put('/:id', busAdminOnly, [...updateEmployeeValidation, validateRequest], updateEmployee);

router.put('/:id/status', busAdminOnly, [...updateEmployeeStatusValidation, validateRequest], updateEmployeeStatus);

router.delete('/:id', busAdminOnly, [...deleteEmployeeValidation, validateRequest], deleteEmployee);

// Get employees by role
router.get('/role/:role', paginationMiddleware, [...getAllEmployeesValidation, validateRequest], getAllEmployees);

export default router;
