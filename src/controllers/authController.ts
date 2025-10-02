import { Request, Response } from 'express';
import { sendSuccess, sendError, sendBadRequest, sendNotFound, sendCreated, asyncHandler } from '../utils/responseHandler';
import { User, IUser } from '../models/User';
import { hashPassword, comparePassword, generateToken, generateRefreshToken } from '../utils/auth';
import { API_MESSAGES, USER_ROLES, HTTP_STATUS } from '../constants';
import { logError } from '../utils/logger';
import { AuthenticatedRequest } from '../types';

// Register user
export const register = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { name, email, password, phone, role } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { phone }]
    });

    if (existingUser) {
      return sendBadRequest(res, 'User with this email or phone already exists');
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      role: role || USER_ROLES.CUSTOMER,
    });

    // Generate tokens
    const token = generateToken({ id: user._id, email: user.email, role: user.role, name: user.name });
    const refreshToken = generateRefreshToken({ id: user._id });
    
    return sendCreated(res, {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
      token,
      refreshToken,
    }, 'User registered successfully');
  } catch (error) {
    logError('Registration error', error);
    return sendBadRequest(res, error instanceof Error ? error.message : 'Registration failed');
  }
});

// Login user
export const login = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    // Find user by email (include password field for comparison)
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return sendBadRequest(res, 'Invalid email or password');
    }

    // Check if user is active
    if (!user.isActive) {
      return sendBadRequest(res, 'Account is deactivated. Please contact support.');
    }

    // Verify password
    console.log('Password comparison:', {
      providedPassword: password,
      hashedPassword: user.password,
      passwordType: typeof user.password,
      passwordLength: user.password?.length
    });
    
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return sendBadRequest(res, 'Invalid email or password');
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate tokens
    const token = generateToken({ id: user._id, email: user.email, role: user.role, name: user.name });
    const refreshToken = generateRefreshToken({ id: user._id });
    
    return sendSuccess(res, {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        lastLogin: user.lastLogin,
      },
      token,
      refreshToken,
    }, 'Login successful');
  } catch (error) {
    logError('Login error', error);
    return sendBadRequest(res, error instanceof Error ? error.message : 'Login failed');
  }
});

// Get current user profile
export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const userId = authenticatedReq.user?.id;
    
    if (!userId) {
      return sendBadRequest(res, 'User ID not found in token');
    }

    const user = await User.findById(userId);
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
    }, 'Profile retrieved successfully');
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
    const userId = authenticatedReq.user?.id;

    if (!userId) {
      return sendBadRequest(res, 'User ID not found in token');
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { name, phone, address },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return sendNotFound(res, 'User not found');
    }

    return sendSuccess(res, {
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
        address: updatedUser.address,
      },
    }, 'Profile updated successfully');
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
    const userId = authenticatedReq.user?.id;

    if (!userId) {
      return sendBadRequest(res, 'User ID not found in token');
    }

    // Find user (include password field for comparison)
    const user = await User.findById(userId).select('+password');
    if (!user) {
      return sendNotFound(res, 'User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await comparePassword(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return sendBadRequest(res, 'Current password is incorrect');
    }

    // Hash new password
    const hashedNewPassword = await hashPassword(newPassword);

    // Update password
    user.password = hashedNewPassword;
    await user.save();

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

    // Build filter
    const filter: any = {};
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(filter);

    return sendSuccess(res, {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    }, 'Users retrieved successfully');
  } catch (error) {
    logError('Get all users error', error);
    return sendError(res, 'Failed to get users');
  }
});

// Get user by ID (Admin only)
export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select('-password');

    if (!user) {
      return sendNotFound(res, 'User not found');
    }

    return sendSuccess(res, { user }, 'User retrieved successfully');
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

    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (role) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (address) updateData.address = address;

    const updatedUser = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return sendNotFound(res, 'User not found');
    }

    return sendSuccess(res, { user: updatedUser }, 'User updated successfully');
  } catch (error) {
    logError('Update user by ID error', error);
    return sendBadRequest(res, error instanceof Error ? error.message : 'Update failed');
  }
});

// Delete user (Admin only)
export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return sendNotFound(res, 'User not found');
    }

    return sendSuccess(res, null, 'User deleted successfully');
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

    // Verify refresh token (you'll need to implement this in your auth utils)
    // For now, we'll return an error as this requires JWT verification logic
    return sendBadRequest(res, 'Refresh token functionality needs to be implemented');
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
    const existingMasterAdmin = await User.findOne({ role: USER_ROLES.MASTER_ADMIN });
    if (existingMasterAdmin) {
      return sendBadRequest(res, 'Master admin already exists. Only one master admin is allowed.');
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { phone }]
    });

    if (existingUser) {
      return sendBadRequest(res, 'User with this email or phone already exists');
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create master admin user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      role: USER_ROLES.MASTER_ADMIN,
      company,
      aadhaarCard,
      position,
      address,
      isActive: true,
      isEmailVerified: true,
    });

    // Generate tokens
    const token = generateToken({ id: user._id, email: user.email, role: user.role, name: user.name });
    const refreshToken = generateRefreshToken({ id: user._id });
    
    return sendCreated(res, {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        company: user.company,
        aadhaarCard: user.aadhaarCard,
        position: user.position,
        address: user.address,
        isActive: user.isActive,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt,
      },
      token,
      refreshToken,
    }, 'Master admin created successfully');
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
    
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { phone }]
    });

    if (existingUser) {
      return sendBadRequest(res, 'User with this email or phone already exists');
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create bus owner user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      role: USER_ROLES.BUS_OWNER,
      createdBy: creatorId,
      company,
      aadhaarCard,
      position,
      address,
      isActive: true,
      isEmailVerified: false,
    });

    // Generate tokens
    const token = generateToken({ id: user._id, email: user.email, role: user.role, name: user.name });
    const refreshToken = generateRefreshToken({ id: user._id });
    
    return sendCreated(res, {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        company: user.company,
        aadhaarCard: user.aadhaarCard,
        position: user.position,
        address: user.address,
        isActive: user.isActive,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt,
      },
      token,
      refreshToken,
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

    // Build filter
    const filter: any = { role: USER_ROLES.BUS_OWNER };
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
      ];
    }

    const busOwners = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(filter);

    return sendSuccess(res, {
      busOwners,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    }, 'Bus owners retrieved successfully');
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

    // Build filter
    const filter: any = { role: USER_ROLES.BUS_ADMIN };
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
      ];
    }

    const busAdmins = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(filter);

    return sendSuccess(res, {
      busAdmins,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    }, 'Bus admins retrieved successfully');
  } catch (error) {
    logError('Get bus admins error', error);
    return sendError(res, 'Failed to get bus admins');
  }
});

// Get bus owner by ID
export const getBusOwnerById = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await User.findOne({ _id: id, role: USER_ROLES.BUS_OWNER }).select('-password');

    if (!user) {
      return sendNotFound(res, 'Bus owner not found');
    }

    return sendSuccess(res, { busOwner: user }, 'Bus owner retrieved successfully');
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

    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (address) updateData.address = address;
    if (company) updateData.company = company;
    if (position) updateData.position = position;

    const updatedUser = await User.findOneAndUpdate(
      { _id: id, role: USER_ROLES.BUS_OWNER },
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

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

    const user = await User.findOneAndDelete({ _id: id, role: USER_ROLES.BUS_OWNER });
    if (!user) {
      return sendNotFound(res, 'Bus owner not found');
    }

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

    const user = await User.findOne({ _id: id, role: USER_ROLES.BUS_OWNER });
    if (!user) {
      return sendNotFound(res, 'Bus owner not found');
    }

    const updatedUser = await User.findOneAndUpdate(
      { _id: id, role: USER_ROLES.BUS_OWNER },
      { isActive: !user.isActive },
      { new: true, runValidators: true }
    ).select('-password');

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
    const { name, phone, company, aadhaarCard, position, address, salary, commission } = req.body;
    
    // First check if user exists
    const existingUser = await User.findById(id).select('-password');
    if (!existingUser) {
      return sendNotFound(res, 'User not found');
    }
    
    // Check if user has the right role
    if (existingUser.role !== USER_ROLES.BUS_ADMIN) {
      return sendBadRequest(res, `User is not a bus admin. Current role: ${existingUser.role}`);
    }
    
    const updateData: any = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (company) updateData.company = company;
    if (aadhaarCard) updateData.aadhaarCard = aadhaarCard;
    if (position) updateData.position = position;
    if (address) updateData.address = address;
    if (salary !== undefined) updateData.salary = salary;
    if (commission !== undefined) updateData.commission = commission;
    
    const result = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!result) {
      return sendNotFound(res, 'User not found');
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
        salary: result.salary,
        commission: result.commission,
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

// Get user by ID for debugging
export const getUserByIdForDebug = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id).select('-password');
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
        company: user.company,
        aadhaarCard: user.aadhaarCard,
        position: user.position,
        address: user.address,
        salary: user.salary,
        license: user.license,
        assignedBus: user.assignedBus,
        status: user.isActive ? 'active' : 'inactive',
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    }, 'User retrieved successfully');
  } catch (error) {
    logError('Error getting user by ID:', error);
    return sendError(res, 'Failed to get user', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
});

// Delete bus admin
export const deleteBusAdmin = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const user = await User.findOneAndDelete({ _id: id, role: USER_ROLES.BUS_ADMIN });
    if (!user) {
      return sendNotFound(res, 'Bus admin not found');
    }
    
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
    
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { phone }]
    });

    if (existingUser) {
      return sendBadRequest(res, 'User with this email or phone already exists');
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create bus admin user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      role: USER_ROLES.BUS_ADMIN,
      createdBy: creatorId,
      company,
      aadhaarCard,
      position,
      address,
      isActive: true,
      isEmailVerified: false,
    });

    // Generate tokens
    const token = generateToken({ id: user._id, email: user.email, role: user.role, name: user.name });
    const refreshToken = generateRefreshToken({ id: user._id });
    
    return sendCreated(res, {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        company: user.company,
        aadhaarCard: user.aadhaarCard,
        position: user.position,
        address: user.address,
        isActive: user.isActive,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt,
      },
      token,
      refreshToken,
    }, 'Bus admin created successfully');
  } catch (error) {
    logError('Bus admin creation error', error);
    return sendBadRequest(res, error instanceof Error ? error.message : 'Bus admin creation failed');
  }
});

// Create booking manager
export const createBookingManager = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { name, email, password, phone, company, aadhaarCard, position, address, commission } = req.body;
    const authenticatedReq = req as AuthenticatedRequest;
    const creatorId = authenticatedReq.user?.id;
    
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { phone }]
    });

    if (existingUser) {
      return sendBadRequest(res, 'User with this email or phone already exists');
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create booking manager user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      role: USER_ROLES.BOOKING_MAN,
      createdBy: creatorId,
      company,
      aadhaarCard,
      position,
      address,
      commission,
      isActive: true,
      isEmailVerified: false,
    });

    // Generate tokens
    const token = generateToken({ id: user._id, email: user.email, role: user.role, name: user.name });
    const refreshToken = generateRefreshToken({ id: user._id });
    
    return sendCreated(res, {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        company: user.company,
        aadhaarCard: user.aadhaarCard,
        position: user.position,
        address: user.address,
        commission: user.commission,
        isActive: user.isActive,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt,
      },
      token,
      refreshToken,
    }, 'Booking manager created successfully');
  } catch (error) {
    logError('Booking manager creation error', error);
    return sendBadRequest(res, error instanceof Error ? error.message : 'Booking manager creation failed');
  }
});

// Create bus employee
export const createBusEmployee = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { name, email, password, phone, company, aadhaarCard, position, address, subrole, salary, license, assignedBus } = req.body;
    const authenticatedReq = req as AuthenticatedRequest;
    const creatorId = authenticatedReq.user?.id;
    
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { phone }]
    });

    if (existingUser) {
      return sendBadRequest(res, 'User with this email or phone already exists');
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create bus employee user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      role: USER_ROLES.BUS_EMPLOYEE,
      subrole,
      createdBy: creatorId,
      company,
      aadhaarCard,
      position,
      address,
      salary,
      license,
      assignedBus,
      isActive: true,
      isEmailVerified: false,
    });

    // Generate tokens
    const token = generateToken({ id: user._id, email: user.email, role: user.role, name: user.name });
    const refreshToken = generateRefreshToken({ id: user._id });
    
    return sendCreated(res, {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        subrole: user.subrole,
        company: user.company,
        aadhaarCard: user.aadhaarCard,
        position: user.position,
        address: user.address,
        isActive: user.isActive,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt,
      },
      token,
      refreshToken,
    }, 'Bus employee created successfully');
  } catch (error) {
    logError('Bus employee creation error', error);
    return sendBadRequest(res, error instanceof Error ? error.message : 'Bus employee creation failed');
  }
});

// Get all bus employees
export const getBusEmployees = asyncHandler(async (req: Request, res: Response) => {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const page = authenticatedReq.pagination?.page || 1;
    const limit = authenticatedReq.pagination?.limit || 10;
    const skip = authenticatedReq.pagination?.skip || 0;

    const { isActive, search, subrole } = req.query;

    // Build filter
    const filter: any = { role: USER_ROLES.BUS_EMPLOYEE };
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (subrole) filter.subrole = subrole;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { license: { $regex: search, $options: 'i' } },
        { assignedBus: { $regex: search, $options: 'i' } },
      ];
    }

    const busEmployees = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(filter);

    return sendSuccess(res, {
      employees: busEmployees,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    }, 'Bus employees retrieved successfully');
  } catch (error) {
    logError('Get bus employees error', error);
    return sendError(res, 'Failed to get bus employees');
  }
});

// Get bus employee by ID
export const getBusEmployeeById = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await User.findOne({ _id: id, role: USER_ROLES.BUS_EMPLOYEE }).select('-password');

    if (!user) {
      return sendNotFound(res, 'Bus employee not found');
    }

    return sendSuccess(res, { employee: user }, 'Bus employee retrieved successfully');
  } catch (error) {
    logError('Get bus employee by ID error', error);
    return sendError(res, 'Failed to get bus employee');
  }
});

// Update bus employee
export const updateBusEmployee = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, phone, company, aadhaarCard, position, address, subrole, salary, license, assignedBus, isActive } = req.body;

    const updateData: any = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (company) updateData.company = company;
    if (aadhaarCard) updateData.aadhaarCard = aadhaarCard;
    if (position) updateData.position = position;
    if (address) updateData.address = address;
    if (subrole) updateData.subrole = subrole;
    if (salary !== undefined) updateData.salary = salary;
    if (license) updateData.license = license;
    if (assignedBus) updateData.assignedBus = assignedBus;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedUser = await User.findOneAndUpdate(
      { _id: id, role: USER_ROLES.BUS_EMPLOYEE },
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return sendNotFound(res, 'Bus employee not found');
    }

    return sendSuccess(res, { employee: updatedUser }, 'Bus employee updated successfully');
  } catch (error) {
    logError('Update bus employee error', error);
    return sendBadRequest(res, error instanceof Error ? error.message : 'Update failed');
  }
});

// Delete bus employee
export const deleteBusEmployee = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await User.findOneAndDelete({ _id: id, role: USER_ROLES.BUS_EMPLOYEE });
    if (!user) {
      return sendNotFound(res, 'Bus employee not found');
    }

    return sendSuccess(res, null, 'Bus employee deleted successfully');
  } catch (error) {
    logError('Delete bus employee error', error);
    return sendBadRequest(res, error instanceof Error ? error.message : 'Delete failed');
  }
});

// Toggle bus employee status
export const toggleBusEmployeeStatus = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await User.findOne({ _id: id, role: USER_ROLES.BUS_EMPLOYEE });
    if (!user) {
      return sendNotFound(res, 'Bus employee not found');
    }

    const updatedUser = await User.findOneAndUpdate(
      { _id: id, role: USER_ROLES.BUS_EMPLOYEE },
      { isActive: !user.isActive },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return sendNotFound(res, 'Bus employee not found');
    }

    return sendSuccess(res, { employee: updatedUser }, 'Bus employee status updated successfully');
  } catch (error) {
    logError('Toggle bus employee status error', error);
    return sendBadRequest(res, error instanceof Error ? error.message : 'Status update failed');
  }
});

// Get role hierarchy
export const getRoleHierarchy = asyncHandler(async (req: Request, res: Response) => {
  try {
    // Define role hierarchy
    const hierarchy = {
      'MASTER_ADMIN': ['BUS_OWNER'],
      'BUS_OWNER': ['BUS_ADMIN'],
      'BUS_ADMIN': ['BUS_EMPLOYEE', 'BOOKING_MAN']
    };
    
    const limits = {
      'MASTER_ADMIN': { maxBusOwners: -1 }, // unlimited
      'BUS_OWNER': { maxBusAdmins: 10 },
      'BUS_ADMIN': { maxEmployees: 50 }
    };
    
    return sendSuccess(res, {
      hierarchy,
      limits,
      roles: Object.values(USER_ROLES),
      subroles: {
        [USER_ROLES.BUS_EMPLOYEE]: ['driver', 'helper', 'conductor', 'cleaner']
      }
    }, 'Role hierarchy retrieved successfully');
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
    
    // Define creatable roles based on hierarchy
    const roleHierarchy: Record<string, string[]> = {
      'MASTER_ADMIN': ['BUS_OWNER'],
      'BUS_OWNER': ['BUS_ADMIN'],
      'BUS_ADMIN': ['BUS_EMPLOYEE', 'BOOKING_MAN']
    };
    
    const creatableRoles = roleHierarchy[userRole] || [];
    
    return sendSuccess(res, {
      creatableRoles,
      hasSubroles: creatableRoles.map(role => ({
        role,
        hasSubroles: role === 'BUS_EMPLOYEE',
        subroles: role === 'BUS_EMPLOYEE' ? ['driver', 'helper', 'conductor', 'cleaner'] : []
      }))
    }, 'Creatable roles retrieved successfully');
  } catch (error) {
    logError('Get creatable roles error', error);
    return sendError(res, 'Failed to get creatable roles');
  }
});
