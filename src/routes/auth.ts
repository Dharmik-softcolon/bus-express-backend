import { Router } from 'express';
import {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  getAllUsers,
  getUserById,
  updateUserById,
  deleteUser,
  refreshToken,
  createMasterAdmin,
  createBusOwner,
  getBusOwners,
  getBusOwnerById,
  updateBusOwner,
  deleteBusOwner,
  toggleBusOwnerStatus,
} from '../controllers/authController';
import { authenticate, authorize, adminOnly } from '../middleware/auth';
import { validateRequest, paginationMiddleware } from '../middleware/validation';
import {
  registerValidation,
  loginValidation,
  getProfileValidation,
  updateProfileValidation,
  changePasswordValidation,
  getAllUsersValidation,
  getUserByIdValidation,
  updateUserByIdValidation,
  deleteUserValidation,
  refreshTokenValidation,
  createMasterAdminValidation,
} from '../validations/authValidation';

const router = Router();

// Public routes
router.post('/register', [...registerValidation, validateRequest], register);

router.post('/login', [...loginValidation, validateRequest], login);

router.post('/refresh-token', [...refreshTokenValidation, validateRequest], refreshToken);

// Master admin creation (public route for initial setup)
router.post('/create-master-admin', [...createMasterAdminValidation, validateRequest], createMasterAdmin);

// Protected routes
router.use(authenticate);

// User profile routes
router.get('/profile', [...getProfileValidation, validateRequest], getProfile);

router.put('/profile', [...updateProfileValidation, validateRequest], updateProfile);

router.put('/change-password', [...changePasswordValidation, validateRequest], changePassword);

// Admin only routes
router.get('/users', adminOnly, paginationMiddleware, [...getAllUsersValidation, validateRequest], getAllUsers);

router.get('/users/:id', adminOnly, [...getUserByIdValidation, validateRequest], getUserById);

router.put('/users/:id', adminOnly, [...updateUserByIdValidation, validateRequest], updateUserById);

router.delete('/users/:id', adminOnly, [...deleteUserValidation, validateRequest], deleteUser);

// Bus owner management routes (Master admin only)
router.post('/bus-owners', adminOnly, [...registerValidation, validateRequest], createBusOwner);

router.get('/bus-owners', adminOnly, paginationMiddleware, [...getAllUsersValidation, validateRequest], getBusOwners);

router.get('/bus-owners/:id', adminOnly, [...getUserByIdValidation, validateRequest], getBusOwnerById);

router.put('/bus-owners/:id', adminOnly, [...updateUserByIdValidation, validateRequest], updateBusOwner);

router.delete('/bus-owners/:id', adminOnly, [...deleteUserValidation, validateRequest], deleteBusOwner);

router.put('/bus-owners/:id/toggle-status', adminOnly, [...getUserByIdValidation, validateRequest], toggleBusOwnerStatus);

export default router;
