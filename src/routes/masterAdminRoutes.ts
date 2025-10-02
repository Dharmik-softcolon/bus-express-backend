import { Router } from 'express';
import { authenticate, masterAdminOnly } from '../middleware/auth';
import { validateRequest, paginationMiddleware } from '../middleware/validation';
import { getAllUsersValidation, getUserByIdValidation, updateUserByIdValidation, deleteUserValidation } from '../validations/authValidation';
import {
  getMasterAdminDashboard,
  getAllUsers,
  getUserById,
  updateUserById,
  deleteUser,
  createBusOwner,
  getBusOwners,
  getBusOwnerById,
  updateBusOwner,
  deleteBusOwner,
  toggleBusOwnerStatus
} from '../controllers/masterAdminController';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);
router.use(masterAdminOnly);

// Dashboard
router.get('/dashboard', getMasterAdminDashboard);

// User management
router.get('/users', paginationMiddleware, [...getAllUsersValidation, validateRequest], getAllUsers);
router.get('/users/:id', [...getUserByIdValidation, validateRequest], getUserById);
router.put('/users/:id', [...updateUserByIdValidation, validateRequest], updateUserById);
router.delete('/users/:id', [...deleteUserValidation, validateRequest], deleteUser);

// Bus owner management
router.post('/bus-owners', createBusOwner);
router.get('/bus-owners', paginationMiddleware, [...getAllUsersValidation, validateRequest], getBusOwners);
router.get('/bus-owners/:id', [...getUserByIdValidation, validateRequest], getBusOwnerById);
router.put('/bus-owners/:id', [...updateUserByIdValidation, validateRequest], updateBusOwner);
router.delete('/bus-owners/:id', [...deleteUserValidation, validateRequest], deleteBusOwner);
router.put('/bus-owners/:id/toggle-status', [...getUserByIdValidation, validateRequest], toggleBusOwnerStatus);

export default router;
