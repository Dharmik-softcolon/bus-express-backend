import { Router } from 'express';
import { authenticate, busOwnerOrBusAdmin } from '../middleware/auth';
import { validateRequest, paginationMiddleware } from '../middleware/validation';
import { getAllUsersValidation, getUserByIdValidation, updateUserByIdValidation, deleteUserValidation } from '../validations/authValidation';
import {
  getBusOwnerDashboard,
  getBusAdmins,
  createBusAdmin,
  updateBusAdmin,
  deleteBusAdmin
} from '../controllers/busOwnerController';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);
router.use(busOwnerOrBusAdmin);

// Dashboard
router.get('/dashboard', getBusOwnerDashboard);

// Bus admin management
router.get('/bus-admins', paginationMiddleware, [...getAllUsersValidation, validateRequest], getBusAdmins);
router.post('/bus-admins', createBusAdmin);
router.put('/bus-admins/:id', updateBusAdmin);
router.delete('/bus-admins/:id', deleteBusAdmin);

export default router;
