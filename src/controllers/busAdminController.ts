import { Request, Response } from 'express';
import { sendSuccess, sendError, sendBadRequest, sendNotFound, sendCreated, asyncHandler } from '../utils/responseHandler';
import { User, IUser } from '../models/User';
import { hashPassword, generateToken, generateRefreshToken } from '../utils/auth';
import { USER_ROLES, HTTP_STATUS } from '../constants';
import { logError } from '../utils/logger';
import { AuthenticatedRequest } from '../types';

// Bus Admin Dashboard
export const getBusAdminDashboard = asyncHandler(async (req: Request, res: Response) => {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const userId = authenticatedReq.user?.id || '';

    // Get dashboard statistics
    const [
      totalBusEmployees,
      totalBookingManagers
    ] = await Promise.all([
      User.countDocuments({ role: 'BUS_EMPLOYEE', createdBy: userId }),
      User.countDocuments({ role: 'BOOKING_MAN', createdBy: userId })
      // Add other model imports as needed
      // Bus.countDocuments({ admin: userId }),
      // Route.countDocuments({ admin: userId }),
      // Booking.countDocuments({ admin: userId }),
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
        totalBusEmployees,
        totalBookingManagers,
        totalBuses: 0, // Will be implemented when models are available
        totalRoutes: 0,
        totalBookings: 0,
        totalRevenue: 0
      },
      features: [
        'Manage bus employees',
        'Manage booking managers',
        'View bus analytics',
        'Route management',
        'Revenue tracking'
      ],
      recentActivities: [
        { type: 'employee_created', message: 'New bus employee created', timestamp: new Date() },
        { type: 'booking_manager_created', message: 'New booking manager created', timestamp: new Date() }
      ]
    };

    return sendSuccess(res, dashboardData, 'Bus Admin Dashboard data retrieved successfully');
  } catch (error) {
    logError('Bus Admin Dashboard error', error);
    return sendError(res, 'Failed to get Bus Admin Dashboard data');
  }
});

// Get all bus employees
export const getBusEmployees = asyncHandler(async (req: Request, res: Response) => {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const userId = authenticatedReq.user?.id || '';
    const page = authenticatedReq.pagination?.page || 1;
    const limit = authenticatedReq.pagination?.limit || 10;
    const skip = authenticatedReq.pagination?.skip || 0;

    const { isActive, search, subrole } = req.query;

    // Build filter
    const filter: any = { role: USER_ROLES.BUS_EMPLOYEE, createdBy: userId };
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (subrole) filter.subrole = subrole;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const busEmployees = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(filter);

    return sendSuccess(res, {
      busEmployees,
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
    const authenticatedReq = req as AuthenticatedRequest;
    const userId = authenticatedReq.user?.id || '';
    const { id } = req.params;

    const user = await User.findOne({ _id: id, role: USER_ROLES.BUS_EMPLOYEE, createdBy: userId }).select('-password');

    if (!user) {
      return sendNotFound(res, 'Bus employee not found');
    }

    return sendSuccess(res, { busEmployee: user }, 'Bus employee retrieved successfully');
  } catch (error) {
    logError('Get bus employee by ID error', error);
    return sendError(res, 'Failed to get bus employee');
  }
});

// Create bus employee
export const createBusEmployee = asyncHandler(async (req: Request, res: Response) => {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const userId = authenticatedReq.user?.id || '';
    const { name, email, password, phone, subrole, position, address } = req.body;
    
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
        subrole: user.subrole,
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

// Update bus employee
export const updateBusEmployee = asyncHandler(async (req: Request, res: Response) => {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const userId = authenticatedReq.user?.id || '';
    const { id } = req.params;
    const { name, email, phone, isActive, address, subrole, position } = req.body;

    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (address) updateData.address = address;
    if (subrole) updateData.subrole = subrole;
    if (position) updateData.position = position;

    const updatedUser = await User.findOneAndUpdate(
      { _id: id, role: USER_ROLES.BUS_EMPLOYEE, createdBy: userId },
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return sendNotFound(res, 'Bus employee not found');
    }

    return sendSuccess(res, { busEmployee: updatedUser }, 'Bus employee updated successfully');
  } catch (error) {
    logError('Update bus employee error', error);
    return sendBadRequest(res, error instanceof Error ? error.message : 'Update failed');
  }
});

// Delete bus employee
export const deleteBusEmployee = asyncHandler(async (req: Request, res: Response) => {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const userId = authenticatedReq.user?.id || '';
    const { id } = req.params;

    const user = await User.findOneAndDelete({ _id: id, role: USER_ROLES.BUS_EMPLOYEE, createdBy: userId });
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
    const authenticatedReq = req as AuthenticatedRequest;
    const userId = authenticatedReq.user?.id || '';
    const { id } = req.params;

    const user = await User.findOne({ _id: id, role: USER_ROLES.BUS_EMPLOYEE, createdBy: userId });
    if (!user) {
      return sendNotFound(res, 'Bus employee not found');
    }

    const updatedUser = await User.findOneAndUpdate(
      { _id: id, role: USER_ROLES.BUS_EMPLOYEE, createdBy: userId },
      { isActive: !user.isActive },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return sendNotFound(res, 'Bus employee not found');
    }

    return sendSuccess(res, { busEmployee: updatedUser }, 'Bus employee status updated successfully');
  } catch (error) {
    logError('Toggle bus employee status error', error);
    return sendBadRequest(res, error instanceof Error ? error.message : 'Status update failed');
  }
});

// Create booking manager
export const createBookingManager = asyncHandler(async (req: Request, res: Response) => {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const userId = authenticatedReq.user?.id || '';
    const { name, email, password, phone, position, address, commission } = req.body;
    
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
      position,
      address,
      commission: commission ? parseFloat(commission) : 0,
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

// Get all booking managers
export const getBookingManagers = asyncHandler(async (req: Request, res: Response) => {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const userId = authenticatedReq.user?.id || '';
    const page = authenticatedReq.pagination?.page || 1;
    const limit = authenticatedReq.pagination?.limit || 10;
    const skip = authenticatedReq.pagination?.skip || 0;

    const { isActive, search } = req.query;

    // Build filter
    const filter: any = { role: USER_ROLES.BOOKING_MAN, createdBy: userId };
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const bookingManagers = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(filter);

    return sendSuccess(res, {
      bookingManagers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    }, 'Booking managers retrieved successfully');
  } catch (error) {
    logError('Get booking managers error', error);
    return sendError(res, 'Failed to get booking managers');
  }
});

// Update booking manager
export const updateBookingManager = asyncHandler(async (req: Request, res: Response) => {
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
      { _id: id, role: USER_ROLES.BOOKING_MAN, createdBy: userId },
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return sendNotFound(res, 'Booking manager not found');
    }

    return sendSuccess(res, { bookingManager: updatedUser }, 'Booking manager updated successfully');
  } catch (error) {
    logError('Update booking manager error', error);
    return sendBadRequest(res, error instanceof Error ? error.message : 'Update failed');
  }
});

// Delete booking manager
export const deleteBookingManager = asyncHandler(async (req: Request, res: Response) => {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const userId = authenticatedReq.user?.id || '';
    const { id } = req.params;

    const user = await User.findOneAndDelete({ _id: id, role: USER_ROLES.BOOKING_MAN, createdBy: userId });
    if (!user) {
      return sendNotFound(res, 'Booking manager not found');
    }

    return sendSuccess(res, null, 'Booking manager deleted successfully');
  } catch (error) {
    logError('Delete booking manager error', error);
    return sendBadRequest(res, error instanceof Error ? error.message : 'Delete failed');
  }
});
