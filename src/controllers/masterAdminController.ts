import { Request, Response } from 'express';
import { sendSuccess, sendError, sendBadRequest, sendNotFound, sendCreated, asyncHandler } from '../utils/responseHandler';
import { User, IUser } from '../models/User';
import { hashPassword, generateToken, generateRefreshToken } from '../utils/auth';
import { USER_ROLES, HTTP_STATUS } from '../constants';
import { logError } from '../utils/logger';
import { AuthenticatedRequest } from '../types';

// Master Admin Dashboard
export const getMasterAdminDashboard = asyncHandler(async (req: Request, res: Response) => {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const userId = authenticatedReq.user?.id || '';

    // Get dashboard statistics using direct MongoDB queries
    const [
      totalBusOwners
    ] = await Promise.all([
      User.countDocuments({ role: 'BUS_OWNER' })
      // Add other model imports as needed
      // Bus.countDocuments(),
      // Route.countDocuments(),
      // Booking.countDocuments(),
      // Booking.aggregate([...])
    ]);

    const dashboardData = {
      user: {
        id: authenticatedReq.user?.id,
        name: authenticatedReq.user?.name,
        email: authenticatedReq.user?.email,
        role: authenticatedReq.user?.role,
        company: authenticatedReq.user?.company
      },
      statistics: {
        totalBusOwners,
        totalBuses: 0, // Will be implemented when models are available
        totalRoutes: 0,
        totalBookings: 0,
        totalRevenue: 0
      },
      features: [
        'Manage bus owners',
        'View system analytics',
        'User management',
        'System configuration'
      ],
      recentActivities: [
        { type: 'user_created', message: 'New bus owner created', timestamp: new Date() },
        { type: 'system_update', message: 'System updated successfully', timestamp: new Date() }
      ]
    };

    return sendSuccess(res, dashboardData, 'Master Admin Dashboard data retrieved successfully');
  } catch (error) {
    logError('Master Admin Dashboard error', error);
    return sendError(res, 'Failed to get Master Admin Dashboard data');
  }
});

// Get all users
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

// Get user by ID
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

// Update user by ID
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

// Delete user
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

// Create bus owner
export const createBusOwner = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { name, email, password, phone, company, aadhaarCard, position, address } = req.body;
    
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
