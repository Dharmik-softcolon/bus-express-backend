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
} from '../validations/authValidation';

const router = Router();

// Public routes
router.post('/register', [...registerValidation, validateRequest], register);

router.post('/login', [...loginValidation, validateRequest], login);

router.post('/refresh-token', [...refreshTokenValidation, validateRequest], refreshToken);

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

export default router;
