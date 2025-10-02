import { Request, Response } from 'express';
import { sendSuccess, sendError, sendBadRequest, sendNotFound, sendCreated, asyncHandler } from '../utils/responseHandler';
import { User, IUser } from '../models/User';
import { hashPassword, generateToken, generateRefreshToken } from '../utils/auth';
import { USER_ROLES, HTTP_STATUS } from '../constants';
import { logError } from '../utils/logger';
import { AuthenticatedRequest } from '../types';

// Bus Owner Dashboard
export const getBusOwnerDashboard = asyncHandler(async (req: Request, res: Response) => {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const userId = authenticatedReq.user?.id || '';

    // Get dashboard statistics
    const [
      totalBusAdmins
    ] = await Promise.all([
      User.countDocuments({ role: 'BUS_ADMIN', createdBy: userId })
      // Add other model imports as needed
      // Bus.countDocuments({ owner: userId }),
      // Route.countDocuments({ owner: userId }),
      // Booking.countDocuments({ owner: userId }),
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
        totalBusAdmins,
        totalBuses: 0, // Will be implemented when models are available
        totalRoutes: 0,
        totalBookings: 0,
        totalRevenue: 0
      },
      features: [
        'Manage bus admins',
        'View bus analytics',
        'Route management',
        'Revenue tracking'
      ],
      recentActivities: [
        { type: 'admin_created', message: 'New bus admin created', timestamp: new Date() },
        { type: 'route_added', message: 'New route added', timestamp: new Date() }
      ]
    };

    return sendSuccess(res, dashboardData, 'Bus Owner Dashboard data retrieved successfully');
  } catch (error) {
    logError('Bus Owner Dashboard error', error);
    return sendError(res, 'Failed to get Bus Owner Dashboard data');
  }
});

// Get all bus admins
export const getBusAdmins = asyncHandler(async (req: Request, res: Response) => {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const userId = authenticatedReq.user?.id || '';
    const page = authenticatedReq.pagination?.page || 1;
    const limit = authenticatedReq.pagination?.limit || 10;
    const skip = authenticatedReq.pagination?.skip || 0;

    const { isActive, search } = req.query;

    // Build filter
    const filter: any = { role: USER_ROLES.BUS_ADMIN, createdBy: userId };
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
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

// Create bus admin
export const createBusAdmin = asyncHandler(async (req: Request, res: Response) => {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const userId = authenticatedReq.user?.id || '';
    const { name, email, password, phone, position, address } = req.body;
    
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
      position,
      address,
      createdBy: userId,
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

// Update bus admin
export const updateBusAdmin = asyncHandler(async (req: Request, res: Response) => {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const userId = authenticatedReq.user?.id || '';
    const { id } = req.params;
    const { name, email, phone, isActive, address, position } = req.body;

    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (address) updateData.address = address;
    if (position) updateData.position = position;

    const updatedUser = await User.findOneAndUpdate(
      { _id: id, role: USER_ROLES.BUS_ADMIN, createdBy: userId },
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return sendNotFound(res, 'Bus admin not found');
    }

    return sendSuccess(res, { busAdmin: updatedUser }, 'Bus admin updated successfully');
  } catch (error) {
    logError('Update bus admin error', error);
    return sendBadRequest(res, error instanceof Error ? error.message : 'Update failed');
  }
});

// Delete bus admin
export const deleteBusAdmin = asyncHandler(async (req: Request, res: Response) => {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const userId = authenticatedReq.user?.id || '';
    const { id } = req.params;

    const user = await User.findOneAndDelete({ _id: id, role: USER_ROLES.BUS_ADMIN, createdBy: userId });
    if (!user) {
      return sendNotFound(res, 'Bus admin not found');
    }

    return sendSuccess(res, null, 'Bus admin deleted successfully');
  } catch (error) {
    logError('Delete bus admin error', error);
    return sendBadRequest(res, error instanceof Error ? error.message : 'Delete failed');
  }
});
