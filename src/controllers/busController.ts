import { Request, Response } from 'express';
import { sendSuccess, sendError, sendBadRequest, sendNotFound, sendCreated, asyncHandler } from '../utils/responseHandler.js';
import { BusService } from '../services/busService.js';
import { API_MESSAGES } from '../constants/index';
import { logError } from '../utils/logger.js';

const busService = new BusService();

// Create bus (Admin/Operator only)
export const createBus = asyncHandler(async (req: Request, res: Response) => {
  try {
    const busData = req.body;
    const operatorId = req.user?.id || '';

    const bus = await busService.createBus(busData, operatorId);

    return sendCreated(res, { bus }, API_MESSAGES.BUS_CREATED);
  } catch (error) {
    logError('Create bus error', error);
    return sendBadRequest(res, error instanceof Error ? error.message : 'Bus creation failed');
  }
});

// Get all buses
export const getAllBuses = asyncHandler(async (req: Request, res: Response) => {
  try {
    const page = req.pagination?.page || 1;
    const limit = req.pagination?.limit || 10;
    const skip = req.pagination?.skip || 0;

    const { type, status, operator, search } = req.query;

    const result = await busService.getBuses(
      { type: type as string, status: status as string, operator: operator as string, search: search as string },
      { page, limit, skip }
    );

    return sendSuccess(res, {
      buses: result.buses,
      pagination: {
        page,
        limit,
        total: result.total,
        pages: Math.ceil(result.total / limit),
      },
    });
  } catch (error) {
    logError('Get all buses error', error);
    return sendError(res, 'Failed to get buses');
  }
});

// Get bus by ID
export const getBusById = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const bus = await busService.getBusById(id);

    if (!bus) {
      return sendNotFound(res, 'Bus not found');
    }

    return sendSuccess(res, { bus });
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
    const userId = req.user?.id || '';
    const userRole = req.user?.role || '';

    const updatedBus = await busService.updateBus(id, updateData, userId, userRole);

    if (!updatedBus) {
      return sendNotFound(res, 'Bus not found');
    }

    return sendSuccess(res, { bus: updatedBus }, API_MESSAGES.BUS_UPDATED);
  } catch (error) {
    logError('Update bus error', error);
    return sendBadRequest(res, error instanceof Error ? error.message : 'Bus update failed');
  }
});

// Delete bus (Admin/Operator only)
export const deleteBus = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || '';
    const userRole = req.user?.role || '';

    await busService.deleteBus(id, userId, userRole);

    return sendSuccess(res, null, API_MESSAGES.BUS_DELETED);
  } catch (error) {
    logError('Delete bus error', error);
    return sendBadRequest(res, error instanceof Error ? error.message : 'Bus deletion failed');
  }
});

// Get buses by operator
export const getBusesByOperator = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { operatorId } = req.params;
    const page = req.pagination?.page || 1;
    const limit = req.pagination?.limit || 10;
    const skip = req.pagination?.skip || 0;

    const result = await busService.getBusesByOperator(operatorId, { page, limit, skip });

    return sendSuccess(res, {
      buses: result.buses,
      pagination: {
        page,
        limit,
        total: result.total,
        pages: Math.ceil(result.total / limit),
      },
    });
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
    const userId = req.user?.id || '';
    const userRole = req.user?.role || '';

    const updatedBus = await busService.updateBusStatus(id, status, userId, userRole);

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
    const userId = req.user?.id || '';
    const userRole = req.user?.role || '';

    const statistics = await busService.getBusStatistics(id, userId, userRole);

    return sendSuccess(res, statistics);
  } catch (error) {
    logError('Get bus statistics error', error);
    return sendBadRequest(res, error instanceof Error ? error.message : 'Failed to get statistics');
  }
});
