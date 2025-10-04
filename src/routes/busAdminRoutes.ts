import { Router } from 'express';
import { authenticate, busAdminOnly } from '../middleware/auth';
import { validateRequest, paginationMiddleware } from '../middleware/validation';
import { getAllUsersValidation, getUserByIdValidation, updateUserByIdValidation, deleteUserValidation, createBusEmployeeValidation, createBookingManagerValidation } from '../validations/authValidation';
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
router.post('/bus-employees', [...createBusEmployeeValidation, validateRequest], createBusEmployee);
router.put('/bus-employees/:id', [...updateUserByIdValidation, validateRequest], updateBusEmployee);
router.delete('/bus-employees/:id', [...getUserByIdValidation, validateRequest], deleteBusEmployee);
router.put('/bus-employees/:id/toggle-status', [...getUserByIdValidation, validateRequest], toggleBusEmployeeStatus);

// Booking man management
router.post('/booking-men', [...createBookingManagerValidation, validateRequest], createBookingManager);
router.get('/booking-men', paginationMiddleware, [...getAllUsersValidation, validateRequest], getBookingManagers);
router.put('/booking-men/:id', [...updateUserByIdValidation, validateRequest], updateBookingManager);
router.delete('/booking-men/:id', [...getUserByIdValidation, validateRequest], deleteBookingManager);

export default router;
