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
import { authenticate, busAdminOnly, busOwnerOrBusAdmin } from '../middleware/auth';
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
router.post('/', busOwnerOrBusAdmin, [...createEmployeeValidation, validateRequest], createEmployee);

router.get('/', paginationMiddleware, [...getAllEmployeesValidation, validateRequest], getAllEmployees);

router.get('/statistics', busOwnerOrBusAdmin, [...getEmployeeStatisticsValidation, validateRequest], getEmployeeStatistics);

router.get('/:id', [...getEmployeeByIdValidation, validateRequest], getEmployeeById);

router.put('/:id', busOwnerOrBusAdmin, [...updateEmployeeValidation, validateRequest], updateEmployee);

router.put('/:id/status', busOwnerOrBusAdmin, [...updateEmployeeStatusValidation, validateRequest], updateEmployeeStatus);

router.delete('/:id', busOwnerOrBusAdmin, [...deleteEmployeeValidation, validateRequest], deleteEmployee);

// Get employees by role
router.get('/role/:role', paginationMiddleware, [...getAllEmployeesValidation, validateRequest], getAllEmployees);

export default router;
