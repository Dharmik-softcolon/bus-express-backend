import { Router } from 'express';
import { authenticate, busAdminOnly } from '../middleware/auth';
import { validateRequest, paginationMiddleware } from '../middleware/validation';
import { getAllUsersValidation, getUserByIdValidation, updateUserByIdValidation, deleteUserValidation } from '../validations/authValidation';
import {
  getBusAdminDashboard,
  getBusEmployees,
  getBusEmployeeById,
  createBusEmployee,
  updateBusEmployee,
  deleteBusEmployee,
  toggleBusEmployeeStatus,
  createBookingManager,
  getBookingManagers,
  updateBookingManager,
  deleteBookingManager
} from '../controllers/busAdminController';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);
router.use(busAdminOnly);

// Dashboard
router.get('/dashboard', getBusAdminDashboard);

// Bus employee management
router.get('/bus-employees', paginationMiddleware, [...getAllUsersValidation, validateRequest], getBusEmployees);
router.get('/bus-employees/:id', [...getUserByIdValidation, validateRequest], getBusEmployeeById);
router.post('/bus-employees', createBusEmployee);
router.put('/bus-employees/:id', [...updateUserByIdValidation, validateRequest], updateBusEmployee);
router.delete('/bus-employees/:id', [...getUserByIdValidation, validateRequest], deleteBusEmployee);
router.put('/bus-employees/:id/toggle-status', [...getUserByIdValidation, validateRequest], toggleBusEmployeeStatus);

// Booking manager management
router.post('/booking-managers', createBookingManager);
router.get('/booking-managers', paginationMiddleware, [...getAllUsersValidation, validateRequest], getBookingManagers);
router.put('/booking-managers/:id', updateBookingManager);
router.delete('/booking-managers/:id', deleteBookingManager);

export default router;
