import { Request, Response } from 'express';
import { sendSuccess, sendError, sendBadRequest, sendNotFound, sendCreated, asyncHandler } from '../utils/responseHandler';
import { Bus, IBus } from '../models/Bus';
import { API_MESSAGES } from '../constants';
import { logError } from '../utils/logger';
import { AuthenticatedRequest } from '../types';

// Create bus (Admin/Operator only)
export const createBus = asyncHandler(async (req: Request, res: Response) => {
  try {
    const busData = req.body;
    const authenticatedReq = req as AuthenticatedRequest;
    const operatorId = authenticatedReq.user?.id;

    if (!operatorId) {
      return sendBadRequest(res, 'Operator ID not found');
    }

    // Check if bus number already exists
    const existingBus = await Bus.findOne({ busNumber: busData.busNumber });
    if (existingBus) {
      return sendBadRequest(res, 'Bus with this number already exists');
    }

    const bus = await Bus.create({
      ...busData,
      operator: operatorId,
      status: 'active',
    });

    return sendCreated(res, { bus }, 'Bus created successfully');
  } catch (error) {
    logError('Create bus error', error);
    return sendBadRequest(res, error instanceof Error ? error.message : 'Bus creation failed');
  }
});

// Get all buses
export const getAllBuses = asyncHandler(async (req: Request, res: Response) => {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const page = authenticatedReq.pagination?.page || 1;
    const limit = authenticatedReq.pagination?.limit || 10;
    const skip = authenticatedReq.pagination?.skip || 0;

    const { type, status, operator, search } = req.query;

    // Build filter
    const filter: any = {};
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (operator) filter.operator = operator;
    if (search) {
      filter.$or = [
        { busNumber: { $regex: search, $options: 'i' } },
        { busName: { $regex: search, $options: 'i' } },
        { manufacturer: { $regex: search, $options: 'i' } },
      ];
    }

    const buses = await Bus.find(filter)
      .populate('operator', 'name email')
      .populate('driver', 'name phone')
      .populate('helper', 'name phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Bus.countDocuments(filter);

    return sendSuccess(res, {
      buses,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    }, 'Buses retrieved successfully');
  } catch (error) {
    logError('Get all buses error', error);
    return sendError(res, 'Failed to get buses');
  }
});

// Get bus by ID
export const getBusById = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const bus = await Bus.findById(id)
      .populate('operator', 'name email phone')
      .populate('driver', 'name phone license')
      .populate('helper', 'name phone');

    if (!bus) {
      return sendNotFound(res, 'Bus not found');
    }

    return sendSuccess(res, { bus }, 'Bus retrieved successfully');
  } catch (error) {
    logError('Get bus by ID error', error);
    return sendError(res, 'Failed to get bus');
  }
});

// Update bus (Admin/Operator only)
export const updateBus = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const authenticatedReq = req as AuthenticatedRequest;
    const userId = authenticatedReq.user?.id;
    const userRole = authenticatedReq.user?.role;

    if (!userId) {
      return sendBadRequest(res, 'User ID not found');
    }

    // Check if bus exists and user has permission
    const bus = await Bus.findById(id);
    if (!bus) {
      return sendNotFound(res, 'Bus not found');
    }

    // Check permissions
    // MASTER_ADMIN can update any bus
    if (userRole === 'MASTER_ADMIN') {
      // Can update any bus
    } else if (userRole === 'BUS_OWNER') {
      // BUS_OWNER can only update their own buses
      if (bus.operator.toString() !== userId) {
        return sendBadRequest(res, 'You can only update your own buses');
      }
    } else if (userRole === 'BUS_ADMIN') {
      // For now, BUS_ADMIN cannot update buses
      // TODO: Add relationship check if BUS_ADMIN works for this BUS_OWNER
      return sendBadRequest(res, 'BUS_ADMIN cannot update buses directly. Contact BUS_OWNER or MASTER_ADMIN');
    } else {
      return sendBadRequest(res, 'You do not have permission to update buses');
    }

    const updatedBus = await Bus.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('operator', 'name email');

    if (!updatedBus) {
      return sendNotFound(res, 'Bus not found');
    }

    return sendSuccess(res, { bus: updatedBus }, 'Bus updated successfully');
  } catch (error) {
    logError('Update bus error', error);
    return sendBadRequest(res, error instanceof Error ? error.message : 'Bus update failed');
  }
});

// Delete bus (Admin/Operator only)
export const deleteBus = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const authenticatedReq = req as AuthenticatedRequest;
    const userId = authenticatedReq.user?.id;
    const userRole = authenticatedReq.user?.role;

    if (!userId) {
      return sendBadRequest(res, 'User ID not found');
    }

    // Check if bus exists and user has permission
    const bus = await Bus.findById(id);
    if (!bus) {
      return sendNotFound(res, 'Bus not found');
    }

    // Check permissions
    // MASTER_ADMIN can delete any bus
    if (userRole === 'MASTER_ADMIN') {
      // Can delete any bus
    } else if (userRole === 'BUS_OWNER') {
      // BUS_OWNER can only delete their own buses
      if (bus.operator.toString() !== userId) {
        return sendBadRequest(res, 'You can only delete your own buses');
      }
    } else if (userRole === 'BUS_ADMIN') {
      // For now, BUS_ADMIN cannot delete buses
      // TODO: Add relationship check if BUS_ADMIN works for this BUS_OWNER
      return sendBadRequest(res, 'BUS_ADMIN cannot delete buses directly. Contact BUS_OWNER or MASTER_ADMIN');
    } else {
      return sendBadRequest(res, 'You do not have permission to delete buses');
    }

    await Bus.findByIdAndDelete(id);

    return sendSuccess(res, null, 'Bus deleted successfully');
  } catch (error) {
    logError('Delete bus error', error);
    return sendBadRequest(res, error instanceof Error ? error.message : 'Bus deletion failed');
  }
});

// Get buses by operator
export const getBusesByOperator = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { operatorId } = req.params;
    const authenticatedReq = req as AuthenticatedRequest;
    const page = authenticatedReq.pagination?.page || 1;
    const limit = authenticatedReq.pagination?.limit || 10;
    const skip = authenticatedReq.pagination?.skip || 0;

    const buses = await Bus.find({ operator: operatorId })
      .populate('operator', 'name email')
      .populate('driver', 'name phone')
      .populate('helper', 'name phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Bus.countDocuments({ operator: operatorId });

    return sendSuccess(res, {
      buses,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    }, 'Buses retrieved successfully');
  } catch (error) {
    logError('Get buses by operator error', error);
    return sendError(res, 'Failed to get buses');
  }
});

// Update bus status (Admin/Operator only)
export const updateBusStatus = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const authenticatedReq = req as AuthenticatedRequest;
    const userId = authenticatedReq.user?.id;
    const userRole = authenticatedReq.user?.role;

    if (!userId) {
      return sendBadRequest(res, 'User ID not found');
    }

    // Check if bus exists and user has permission
    const bus = await Bus.findById(id);
    if (!bus) {
      return sendNotFound(res, 'Bus not found');
    }

    // Check permissions
    if (userRole !== 'MASTER_ADMIN' && bus.operator.toString() !== userId) {
      return sendBadRequest(res, 'You do not have permission to update this bus status');
    }

    const updatedBus = await Bus.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    ).populate('operator', 'name email');

    if (!updatedBus) {
      return sendNotFound(res, 'Bus not found');
    }

    return sendSuccess(res, { bus: updatedBus }, 'Bus status updated successfully');
  } catch (error) {
    logError('Update bus status error', error);
    return sendBadRequest(res, error instanceof Error ? error.message : 'Status update failed');
  }
});

// Get bus statistics (Admin/Operator only)
export const getBusStatistics = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const authenticatedReq = req as AuthenticatedRequest;
    const userId = authenticatedReq.user?.id;
    const userRole = authenticatedReq.user?.role;

    if (!userId) {
      return sendBadRequest(res, 'User ID not found');
    }

    // Check if bus exists and user has permission
    const bus = await Bus.findById(id);
    if (!bus) {
      return sendNotFound(res, 'Bus not found');
    }

    // Check permissions
    if (userRole !== 'MASTER_ADMIN' && bus.operator.toString() !== userId) {
      return sendBadRequest(res, 'You do not have permission to view this bus statistics');
    }

    // Get basic bus statistics
    const statistics = {
      busId: bus._id,
      busNumber: bus.busNumber,
      busName: bus.busName,
      status: bus.status,
      totalSeats: bus.totalSeats,
      availableSeats: bus.availableSeats,
      createdAt: bus.createdAt,
      updatedAt: bus.updatedAt,
    };

    return sendSuccess(res, statistics, 'Bus statistics retrieved successfully');
  } catch (error) {
    logError('Get bus statistics error', error);
    return sendBadRequest(res, error instanceof Error ? error.message : 'Failed to get statistics');
  }
});
