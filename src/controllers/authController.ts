import { Request, Response } from 'express';
import { sendSuccess, sendError, sendBadRequest, sendNotFound, sendCreated, asyncHandler } from '../utils/responseHandler';
import { UserService } from '../services/userService';
import { BusService } from '../services/busService';
import { RouteService } from '../services/routeService';
import { BookingService } from '../services/bookingService';
import { RoleValidationService } from '../services/roleValidationService';
import { API_MESSAGES, USER_ROLES, HTTP_STATUS } from '../constants';
import { logError } from '../utils/logger';
import { AuthenticatedRequest } from '../types';

const userService = new UserService();
const busService = new BusService();
const routeService = new RouteService();
const bookingService = new BookingService();

// Register user
export const register = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { name, email, password, phone, role } = req.body;
    
    const result = await userService.createUser({ name, email, password, phone, role });
    
    return sendCreated(res, {
      user: {
        id: result.user._id,
        name: result.user.name,
        email: result.user.email,
        phone: result.user.phone,
        role: result.user.role,
      },
      token: result.token,
      refreshToken: result.refreshToken,
    }, API_MESSAGES.USER_CREATED);
  } catch (error) {
    logError('Registration error', error);
    return sendBadRequest(res, error instanceof Error ? error.message : 'Registration failed');
  }
});

// Login user
export const login = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    const result = await userService.loginUser({ email, password });
    
    return sendSuccess(res, {
      user: {
        id: result.user._id,
        name: result.user.name,
        email: result.user.email,
        phone: result.user.phone,
        role: result.user.role,
        lastLogin: result.user.lastLogin,
      },
      token: result.token,
      refreshToken: result.refreshToken,
    }, API_MESSAGES.LOGIN_SUCCESS);
  } catch (error) {
    logError('Login error', error);
    return sendBadRequest(res, error instanceof Error ? error.message : 'Login failed');
  }
});

// Get current user profile
export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const user = await userService.getUserById(authenticatedReq.user?.id || '');
    
    if (!user) {
      return sendNotFound(res, 'User not found');
    }

    return sendSuccess(res, {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
        isEmailVerified: user.isEmailVerified,
        profileImage: user.profileImage,
        address: user.address,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    logError('Get profile error', error);
    return sendError(res, 'Failed to get profile');
  }
});

// Update user profile
export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { name, phone, address } = req.body;
    const authenticatedReq = req as AuthenticatedRequest;
    const userId = authenticatedReq.user?.id || '';

    const updatedUser = await userService.updateUser(userId, { name, phone, address });

    return sendSuccess(res, {
      user: {
        id: updatedUser?._id,
        name: updatedUser?.name,
        email: updatedUser?.email,
        phone: updatedUser?.phone,
        role: updatedUser?.role,
        address: updatedUser?.address,
      },
    }, API_MESSAGES.USER_UPDATED);
  } catch (error) {
    logError('Update profile error', error);
    return sendBadRequest(res, error instanceof Error ? error.message : 'Update failed');
  }
});

// Change password
export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const authenticatedReq = req as AuthenticatedRequest;
    const userId = authenticatedReq.user?.id || '';

    await userService.changePassword(userId, currentPassword, newPassword);

    return sendSuccess(res, null, 'Password changed successfully');
  } catch (error) {
    logError('Change password error', error);
    return sendBadRequest(res, error instanceof Error ? error.message : 'Password change failed');
  }
});

// Get all users (Admin only)
export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const page = authenticatedReq.pagination?.page || 1;
    const limit = authenticatedReq.pagination?.limit || 10;
    const skip = authenticatedReq.pagination?.skip || 0;

    const { role, isActive, search } = req.query;

    // Convert isActive to boolean, but only if it's provided
    const isActiveFilter = isActive !== undefined ? isActive === 'true' : undefined;

    const result = await userService.getUsers(
      { role: role as string, isActive: isActiveFilter, search: search as string },
      { page, limit, skip }
    );

    return sendSuccess(res, {
      users: result.users,
      pagination: {
        page,
        limit,
        total: result.total,
        pages: Math.ceil(result.total / limit),
      },
    });
  } catch (error) {
    logError('Get all users error', error);
    return sendError(res, 'Failed to get users');
  }
});

// Get user by ID (Admin only)
export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await userService.getUserById(id);

    if (!user) {
      return sendNotFound(res, 'User not found');
    }

    return sendSuccess(res, { user });
  } catch (error) {
    logError('Get user by ID error', error);
    return sendError(res, 'Failed to get user');
  }
});

// Update user by ID (Admin only)
export const updateUserById = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, phone, role, isActive, address } = req.body;

    const updatedUser = await userService.updateUser(id, { name, phone, address });

    if (!updatedUser) {
      return sendNotFound(res, 'User not found');
    }

    return sendSuccess(res, { user: updatedUser }, API_MESSAGES.USER_UPDATED);
  } catch (error) {
    logError('Update user by ID error', error);
    return sendBadRequest(res, error instanceof Error ? error.message : 'Update failed');
  }
});

// Delete user (Admin only)
export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await userService.deleteUser(id);

    return sendSuccess(res, null, API_MESSAGES.USER_DELETED);
  } catch (error) {
    logError('Delete user error', error);
    return sendBadRequest(res, error instanceof Error ? error.message : 'Delete failed');
  }
});

// Refresh token
export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return sendBadRequest(res, 'Refresh token is required');
    }

    const result = await userService.refreshToken(refreshToken);

    return sendSuccess(res, {
      token: result.token,
      refreshToken: result.refreshToken,
    }, 'Token refreshed successfully');
  } catch (error) {
    logError('Refresh token error', error);
    return sendBadRequest(res, error instanceof Error ? error.message : 'Token refresh failed');
  }
});

// Create master admin
export const createMasterAdmin = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { name, email, password, phone, company, aadhaarCard, position, address } = req.body;
    
    // Check if any master admin already exists
    const existingMasterAdmin = await userService.getUserByRole(USER_ROLES.MASTER_ADMIN);
    if (existingMasterAdmin) {
      return sendBadRequest(res, 'Master admin already exists. Only one master admin is allowed.');
    }
    
    // Create master admin user
    const result = await userService.createUser({ 
      name, 
      email, 
      password, 
      phone, 
      role: USER_ROLES.MASTER_ADMIN,
      company,
      aadhaarCard,
      position,
      address
    });
    
    return sendCreated(res, {
      user: {
        id: result.user._id,
        name: result.user.name,
        email: result.user.email,
        phone: result.user.phone,
        role: result.user.role,
        company: result.user.company,
        aadhaarCard: result.user.aadhaarCard,
        position: result.user.position,
        address: result.user.address,
        isActive: result.user.isActive,
        isEmailVerified: result.user.isEmailVerified,
        createdAt: result.user.createdAt,
      },
      token: result.token,
      refreshToken: result.refreshToken,
    }, API_MESSAGES.MASTER_ADMIN_CREATED);
  } catch (error) {
    logError('Master admin creation error', error);
    return sendBadRequest(res, error instanceof Error ? error.message : 'Master admin creation failed');
  }
});

// Create bus owner
export const createBusOwner = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { name, email, password, phone, company, aadhaarCard, position, address } = req.body;
    const authenticatedReq = req as AuthenticatedRequest;
    const creatorId = authenticatedReq.user?.id;
    
    // Create bus owner user
    const result = await userService.createUser({ 
      name, 
      email, 
      password, 
      phone, 
      role: USER_ROLES.BUS_OWNER,
      createdBy: creatorId,
      company,
      aadhaarCard,
      position,
      address
    });
    
    return sendCreated(res, {
      user: {
        id: result.user._id,
        name: result.user.name,
        email: result.user.email,
        phone: result.user.phone,
        role: result.user.role,
        company: result.user.company,
        aadhaarCard: result.user.aadhaarCard,
        position: result.user.position,
        address: result.user.address,
        isActive: result.user.isActive,
        isEmailVerified: result.user.isEmailVerified,
        createdAt: result.user.createdAt,
      },
      token: result.token,
      refreshToken: result.refreshToken,
    }, 'Bus owner created successfully');
  } catch (error) {
    logError('Bus owner creation error', error);
    return sendBadRequest(res, error instanceof Error ? error.message : 'Bus owner creation failed');
  }
});

// Get all bus owners
export const getBusOwners = asyncHandler(async (req: Request, res: Response) => {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const page = authenticatedReq.pagination?.page || 1;
    const limit = authenticatedReq.pagination?.limit || 10;
    const skip = authenticatedReq.pagination?.skip || 0;

    const { isActive, search } = req.query;

    // Convert isActive to boolean, but only if it's provided
    const isActiveFilter = isActive !== undefined ? isActive === 'true' : undefined;

    console.log('Getting bus owners with filters:', { 
      role: USER_ROLES.BUS_OWNER, 
      isActive: isActiveFilter, 
      search: search as string 
    });

    const result = await userService.getUsers(
      { role: USER_ROLES.BUS_OWNER, isActive: isActiveFilter, search: search as string },
      { page, limit, skip }
    );

    console.log('Found bus owners:', result.users.length, 'total:', result.total);

    return sendSuccess(res, {
      busOwners: result.users,
      pagination: {
        page,
        limit,
        total: result.total,
        pages: Math.ceil(result.total / limit),
      },
    });
  } catch (error) {
    logError('Get bus owners error', error);
    return sendError(res, 'Failed to get bus owners');
  }
});

export const getBusAdmins = asyncHandler(async (req: Request, res: Response) => {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const page = authenticatedReq.pagination?.page || 1;
    const limit = authenticatedReq.pagination?.limit || 10;
    const skip = authenticatedReq.pagination?.skip || 0;

    const { isActive, search } = req.query;

    // Convert isActive to boolean, but only if it's provided
    const isActiveFilter = isActive !== undefined ? isActive === 'true' : undefined;

    console.log('Getting bus admins with filters:', { 
      role: USER_ROLES.BUS_ADMIN, 
      isActive: isActiveFilter, 
      search: search as string 
    });

    const result = await userService.getUsers(
      { role: USER_ROLES.BUS_ADMIN, isActive: isActiveFilter, search: search as string },
      { page, limit, skip }
    );

    console.log('Found bus admins:', result.users.length, 'total:', result.total);

    return sendSuccess(res, {
      busAdmins: result.users,
      pagination: {
        page,
        limit,
        total: result.total,
        pages: Math.ceil(result.total / limit),
      },
    });
  } catch (error) {
    logError('Get bus admins error', error);
    return sendError(res, 'Failed to get bus admins');
  }
});

// Get bus owner by ID
export const getBusOwnerById = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await userService.getUserById(id);

    if (!user || user.role !== USER_ROLES.BUS_OWNER) {
      return sendNotFound(res, 'Bus owner not found');
    }

    return sendSuccess(res, { busOwner: user });
  } catch (error) {
    logError('Get bus owner by ID error', error);
    return sendError(res, 'Failed to get bus owner');
  }
});

// Update bus owner
export const updateBusOwner = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, phone, isActive, address, company, position } = req.body;

    const user = await userService.getUserById(id);
    if (!user || user.role !== USER_ROLES.BUS_OWNER) {
      return sendNotFound(res, 'Bus owner not found');
    }

    const updatedUser = await userService.updateUser(id, { name, phone, address, company, position });

    if (!updatedUser) {
      return sendNotFound(res, 'Bus owner not found');
    }

    return sendSuccess(res, { busOwner: updatedUser }, 'Bus owner updated successfully');
  } catch (error) {
    logError('Update bus owner error', error);
    return sendBadRequest(res, error instanceof Error ? error.message : 'Update failed');
  }
});

// Delete bus owner
export const deleteBusOwner = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await userService.getUserById(id);
    if (!user || user.role !== USER_ROLES.BUS_OWNER) {
      return sendNotFound(res, 'Bus owner not found');
    }

    await userService.deleteUser(id);

    return sendSuccess(res, null, 'Bus owner deleted successfully');
  } catch (error) {
    logError('Delete bus owner error', error);
    return sendBadRequest(res, error instanceof Error ? error.message : 'Delete failed');
  }
});

// Toggle bus owner status
export const toggleBusOwnerStatus = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await userService.getUserById(id);
    if (!user || user.role !== USER_ROLES.BUS_OWNER) {
      return sendNotFound(res, 'Bus owner not found');
    }

    const updatedUser = await userService.updateUser(id, { isActive: !user.isActive });

    if (!updatedUser) {
      return sendNotFound(res, 'Bus owner not found');
    }

    return sendSuccess(res, { busOwner: updatedUser }, 'Bus owner status updated successfully');
  } catch (error) {
    logError('Toggle bus owner status error', error);
    return sendBadRequest(res, error instanceof Error ? error.message : 'Status update failed');
  }
});

// Update bus admin
export const updateBusAdmin = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, phone, company, aadhaarCard, position, address } = req.body;
    const authenticatedReq = req as AuthenticatedRequest;
    const updaterId = authenticatedReq.user?.id;
    
    const result = await userService.updateUser(id, { 
      name, 
      phone, 
      company,
      aadhaarCard,
      position,
      address
    });
    
    if (!result) {
      return sendNotFound(res, 'Bus admin not found');
    }
    
    return sendSuccess(res, {
      user: {
        id: result._id,
        name: result.name,
        email: result.email,
        phone: result.phone,
        role: result.role,
        company: result.company,
        aadhaarCard: result.aadhaarCard,
        position: result.position,
        address: result.address,
        status: result.isActive ? 'active' : 'inactive',
        createdAt: result.createdAt,
        updatedAt: result.updatedAt
      }
    }, 'Bus admin updated successfully');
  } catch (error) {
    logError('Error updating bus admin:', error);
    return sendError(res, 'Failed to update bus admin', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
});

// Delete bus admin
export const deleteBusAdmin = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const authenticatedReq = req as AuthenticatedRequest;
    const deleterId = authenticatedReq.user?.id;
    
    await userService.deleteUser(id);
    
    return sendSuccess(res, null, 'Bus admin deleted successfully');
  } catch (error) {
    logError('Error deleting bus admin:', error);
    return sendError(res, 'Failed to delete bus admin', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
});

// Create bus admin
export const createBusAdmin = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { name, email, password, phone, company, aadhaarCard, position, address } = req.body;
    const authenticatedReq = req as AuthenticatedRequest;
    const creatorId = authenticatedReq.user?.id;
    
    const result = await userService.createUser({ 
      name, 
      email, 
      password, 
      phone, 
      role: USER_ROLES.BUS_ADMIN,
      createdBy: creatorId,
      company,
      aadhaarCard,
      position,
      address
    });
    
    return sendCreated(res, {
      user: {
        id: result.user._id,
        name: result.user.name,
        email: result.user.email,
        phone: result.user.phone,
        role: result.user.role,
        company: result.user.company,
        aadhaarCard: result.user.aadhaarCard,
        position: result.user.position,
        address: result.user.address,
        isActive: result.user.isActive,
        isEmailVerified: result.user.isEmailVerified,
        createdAt: result.user.createdAt,
      },
      token: result.token,
      refreshToken: result.refreshToken,
    }, 'Bus admin created successfully');
  } catch (error) {
    logError('Bus admin creation error', error);
    return sendBadRequest(res, error instanceof Error ? error.message : 'Bus admin creation failed');
  }
});

// Create booking manager
export const createBookingManager = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { name, email, password, phone, company, aadhaarCard, position, address } = req.body;
    const authenticatedReq = req as AuthenticatedRequest;
    const creatorId = authenticatedReq.user?.id;
    
    const result = await userService.createUser({ 
      name, 
      email, 
      password, 
      phone, 
      role: USER_ROLES.BOOKING_MAN,
      createdBy: creatorId,
      company,
      aadhaarCard,
      position,
      address
    });
    
    return sendCreated(res, {
      user: {
        id: result.user._id,
        name: result.user.name,
        email: result.user.email,
        phone: result.user.phone,
        role: result.user.role,
        company: result.user.company,
        aadhaarCard: result.user.aadhaarCard,
        position: result.user.position,
        address: result.user.address,
        isActive: result.user.isActive,
        isEmailVerified: result.user.isEmailVerified,
        createdAt: result.user.createdAt,
      },
      token: result.token,
      refreshToken: result.refreshToken,
    }, 'Booking manager created successfully');
  } catch (error) {
    logError('Booking manager creation error', error);
    return sendBadRequest(res, error instanceof Error ? error.message : 'Booking manager creation failed');
  }
});

// Create bus employee
export const createBusEmployee = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { name, email, password, phone, company, aadhaarCard, position, address, subrole } = req.body;
    const authenticatedReq = req as AuthenticatedRequest;
    const creatorId = authenticatedReq.user?.id;
    
    const result = await userService.createUser({ 
      name, 
      email, 
      password, 
      phone, 
      role: USER_ROLES.BUS_EMPLOYEE,
      subrole,
      createdBy: creatorId,
      company,
      aadhaarCard,
      position,
      address
    });
    
    return sendCreated(res, {
      user: {
        id: result.user._id,
        name: result.user.name,
        email: result.user.email,
        phone: result.user.phone,
        role: result.user.role,
        subrole: result.user.subrole,
        company: result.user.company,
        aadhaarCard: result.user.aadhaarCard,
        position: result.user.position,
        address: result.user.address,
        isActive: result.user.isActive,
        isEmailVerified: result.user.isEmailVerified,
        createdAt: result.user.createdAt,
      },
      token: result.token,
      refreshToken: result.refreshToken,
    }, 'Bus employee created successfully');
  } catch (error) {
    logError('Bus employee creation error', error);
    return sendBadRequest(res, error instanceof Error ? error.message : 'Bus employee creation failed');
  }
});

// Get role hierarchy
export const getRoleHierarchy = asyncHandler(async (req: Request, res: Response) => {
  try {
    const hierarchy = RoleValidationService.getRoleHierarchy();
    const limits = RoleValidationService.getRoleLimits();
    
    return sendSuccess(res, {
      hierarchy,
      limits,
      roles: Object.values(USER_ROLES),
      subroles: {
        [USER_ROLES.BUS_EMPLOYEE]: RoleValidationService.getSubroles(USER_ROLES.BUS_EMPLOYEE)
      }
    });
  } catch (error) {
    logError('Get role hierarchy error', error);
    return sendError(res, 'Failed to get role hierarchy');
  }
});

// Get creatable roles for current user
export const getCreatableRoles = asyncHandler(async (req: Request, res: Response) => {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const userRole = authenticatedReq.user?.role;
    
    if (!userRole) {
      return sendBadRequest(res, 'User role not found');
    }
    
    const creatableRoles = RoleValidationService.getCreatableRoles(userRole);
    
    return sendSuccess(res, {
      creatableRoles,
      hasSubroles: creatableRoles.map(role => ({
        role,
        hasSubroles: RoleValidationService.hasSubroles(role),
        subroles: RoleValidationService.getSubroles(role)
      }))
    });
  } catch (error) {
    logError('Get creatable roles error', error);
    return sendError(res, 'Failed to get creatable roles');
  }
});
