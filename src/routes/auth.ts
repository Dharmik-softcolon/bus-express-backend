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
  getBusAdmins,
  getBusOwnerById,
  updateBusOwner,
  deleteBusOwner,
  toggleBusOwnerStatus,
  createBusAdmin,
  updateBusAdmin,
  deleteBusAdmin,
  createBookingMan,
  createBusEmployee,
  getBusEmployees,
  getBusEmployeeById,
  updateBusEmployee,
  deleteBusEmployee,
  toggleBusEmployeeStatus,
  getRoleHierarchy,
  getCreatableRoles,
  getUserByIdForDebug,
} from '../controllers/authController';
import { authenticate, authorize, busAdminOnly, masterAdminOnly, busOwnerOrBusAdmin } from '../middleware/auth';
import { validateRequest, paginationMiddleware } from '../middleware/validation';
import {
  registerValidation,
  updateUserValidation,
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

// Bus Admin only routes
router.get('/users', busAdminOnly, paginationMiddleware, [...getAllUsersValidation, validateRequest], getAllUsers);

router.get('/users/:id', busAdminOnly, [...getUserByIdValidation, validateRequest], getUserById);

router.put('/users/:id', busAdminOnly, [...updateUserByIdValidation, validateRequest], updateUserById);

router.delete('/users/:id', busAdminOnly, [...deleteUserValidation, validateRequest], deleteUser);

// Bus owner management routes (Master admin only)
router.post('/bus-owners', masterAdminOnly, [...registerValidation, validateRequest], createBusOwner);

router.get('/bus-owners', masterAdminOnly, paginationMiddleware, [...getAllUsersValidation, validateRequest], getBusOwners);
router.get('/bus-admins', busOwnerOrBusAdmin, paginationMiddleware, [...getAllUsersValidation, validateRequest], getBusAdmins);

router.get('/bus-owners/:id', masterAdminOnly, [...getUserByIdValidation, validateRequest], getBusOwnerById);

router.put('/bus-owners/:id', masterAdminOnly, [...updateUserByIdValidation, validateRequest], updateBusOwner);

router.delete('/bus-owners/:id', masterAdminOnly, [...deleteUserValidation, validateRequest], deleteBusOwner);

router.put('/bus-owners/:id/toggle-status', masterAdminOnly, [...getUserByIdValidation, validateRequest], toggleBusOwnerStatus);

// Bus admin management routes (Bus owner only)
router.post('/bus-admins', busOwnerOrBusAdmin, [...registerValidation, validateRequest], createBusAdmin);
router.put('/bus-admins/:id', busOwnerOrBusAdmin, [...updateUserValidation, validateRequest], updateBusAdmin);
router.delete('/bus-admins/:id', busOwnerOrBusAdmin, deleteBusAdmin);

// Debug route to check user details
router.get('/debug/user/:id', authenticate, getUserByIdForDebug);

// Booking man and bus employee management routes (Bus admin only)
router.post('/booking-men', busAdminOnly, [...registerValidation, validateRequest], createBookingMan);

// Bus employee CRUD routes (Bus admin only)
router.post('/bus-employees', busAdminOnly, [...registerValidation, validateRequest], createBusEmployee);
router.get('/bus-employees', busAdminOnly, paginationMiddleware, [...getAllUsersValidation, validateRequest], getBusEmployees);
router.get('/bus-employees/:id', busAdminOnly, [...getUserByIdValidation, validateRequest], getBusEmployeeById);
router.put('/bus-employees/:id', busAdminOnly, [...updateUserValidation, validateRequest], updateBusEmployee);
router.delete('/bus-employees/:id', busAdminOnly, [...getUserByIdValidation, validateRequest], deleteBusEmployee);
router.put('/bus-employees/:id/toggle-status', busAdminOnly, [...getUserByIdValidation, validateRequest], toggleBusEmployeeStatus);

// Role hierarchy and management routes
router.get('/role-hierarchy', authenticate, getRoleHierarchy);

router.get('/creatable-roles', authenticate, getCreatableRoles);

// Role-based dashboard routes
router.get('/dashboard/master-admin', masterAdminOnly, (req, res) => {
  res.json({ 
    success: true, 
    message: 'Master Admin Dashboard', 
    role: 'MASTER_ADMIN',
    dashboard: 'master-admin'
  });
});

router.get('/dashboard/bus-owner', busOwnerOrBusAdmin, (req, res) => {
  res.json({ 
    success: true, 
    message: 'Bus Owner Dashboard', 
    role: 'BUS_OWNER',
    dashboard: 'bus-owner'
  });
});

router.get('/dashboard/bus-admin', busAdminOnly, (req, res) => {
  res.json({ 
    success: true, 
    message: 'Bus Admin Dashboard', 
    role: 'BUS_ADMIN',
    dashboard: 'bus-admin'
  });
});

router.get('/dashboard/booking-man', (req: any, res: any) => {
  const authenticatedReq = req as any;
  if (authenticatedReq.user?.role !== 'BOOKING_MAN') {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }
  res.json({ 
    success: true, 
    message: 'Booking Manager Dashboard', 
    role: 'BOOKING_MAN',
    dashboard: 'booking-man'
  });
});

router.get('/dashboard/bus-employee', (req: any, res: any) => {
  const authenticatedReq = req as any;
  if (authenticatedReq.user?.role !== 'BUS_EMPLOYEE') {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }
  res.json({ 
    success: true, 
    message: 'Bus Employee Dashboard', 
    role: 'BUS_EMPLOYEE',
    dashboard: 'bus-employee'
  });
});


export default router;
