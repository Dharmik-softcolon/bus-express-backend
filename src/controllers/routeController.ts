import { Request, Response } from 'express';
import { Route, IRoute } from '../models/Route';
import { sendSuccess, sendError, sendBadRequest, sendNotFound, sendCreated, asyncHandler } from '../utils/responseHandler';
import { API_MESSAGES } from '../constants';
import { calculateDistance } from '../utils/auth';
import { AuthenticatedRequest } from '../types';
import { logError } from '../utils/logger';

// Create route (Admin only)
export const createRoute = asyncHandler(async (req: Request, res: Response) => {
  try {
    const {
      routeName,
      from,
      to,
      distance,
      time,
      pickupPoints,
      dropPoints,
      fare,
    } = req.body;

    // Check if route already exists
    const existingRoute = await Route.findOne({
      'from.city': from.city,
      'to.city': to.city,
    });

    if (existingRoute) {
      return sendBadRequest(res, 'Route between these cities already exists');
    }

    const route = await Route.create({
      routeName,
      from,
      to,
      distance,
      time,
      pickupPoints: pickupPoints || [],
      dropPoints: dropPoints || [],
      fare,
    });

    return sendCreated(res, { route }, 'Route created successfully');
  } catch (error) {
    logError('Create route error', error);
    return sendBadRequest(res, error instanceof Error ? error.message : 'Route creation failed');
  }
});

// Get all routes
export const getAllRoutes = asyncHandler(async (req: Request, res: Response) => {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const page = authenticatedReq.pagination?.page || 1;
    const limit = authenticatedReq.pagination?.limit || 10;
    const skip = authenticatedReq.pagination?.skip || 0;

    const { startCity, endCity, search } = req.query;

    // Build filter
    const filter: any = {};
    
    if (startCity || endCity) {
      filter.$and = [];
      if (startCity) {
        filter.$and.push({ 'from.city': { $regex: startCity, $options: 'i' } });
      }
      if (endCity) {
        filter.$and.push({ 'to.city': { $regex: endCity, $options: 'i' } });
      }
    }

    if (search) {
      filter.$or = [
        { routeName: { $regex: search, $options: 'i' } },
        { 'from.city': { $regex: search, $options: 'i' } },
        { 'to.city': { $regex: search, $options: 'i' } },
        { 'from.state': { $regex: search, $options: 'i' } },
        { 'to.state': { $regex: search, $options: 'i' } },
      ];
    }

    const routes = await Route.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Route.countDocuments(filter);

    return sendSuccess(res, {
      routes,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    }, 'Routes retrieved successfully');
  } catch (error) {
    logError('Get all routes error', error);
    return sendError(res, 'Failed to get routes');
  }
});

// Get route by ID
export const getRouteById = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const route = await Route.findById(id);

    if (!route) {
      return sendNotFound(res, 'Route not found');
    }

    return sendSuccess(res, { route }, 'Route retrieved successfully');
  } catch (error) {
    logError('Get route by ID error', error);
    return sendError(res, 'Failed to get route');
  }
});

// Update route (Admin only)
export const updateRoute = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const route = await Route.findById(id);

    if (!route) {
      return sendNotFound(res, 'Route not found');
    }

    const updatedRoute = await Route.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    return sendSuccess(res, { route: updatedRoute }, 'Route updated successfully');
  } catch (error) {
    logError('Update route error', error);
    return sendBadRequest(res, error instanceof Error ? error.message : 'Route update failed');
  }
});

// Delete route (Admin only)
export const deleteRoute = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const route = await Route.findById(id);

    if (!route) {
      return sendNotFound(res, 'Route not found');
    }

    await Route.findByIdAndDelete(id);

    return sendSuccess(res, null, 'Route deleted successfully');
  } catch (error) {
    logError('Delete route error', error);
    return sendBadRequest(res, error instanceof Error ? error.message : 'Route deletion failed');
  }
});

// Search routes by cities
export const searchRoutes = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { startCity, endCity } = req.query;

    if (!startCity || !endCity) {
      return sendBadRequest(res, 'Both startCity and endCity are required');
    }

    const routes = await Route.find({
      $and: [
        { 'from.city': { $regex: startCity, $options: 'i' } },
        { 'to.city': { $regex: endCity, $options: 'i' } },
      ],
    });

    return sendSuccess(res, { routes }, 'Routes found successfully');
  } catch (error) {
    logError('Search routes error', error);
    return sendError(res, 'Failed to search routes');
  }
});

// Get popular routes
export const getPopularRoutes = asyncHandler(async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;

    // This is a simplified version. In a real application, you would
    // calculate popularity based on booking frequency
    const routes = await Route.find({})
      .sort({ createdAt: -1 })
      .limit(limit);

    return sendSuccess(res, { routes }, 'Popular routes retrieved successfully');
  } catch (error) {
    logError('Get popular routes error', error);
    return sendError(res, 'Failed to get popular routes');
  }
});

// Add pickup point to route (Admin only)
export const addPickupPoint = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const route = await Route.findById(id);

    if (!route) {
      return sendNotFound(res, 'Route not found');
    }

    route.pickupPoints.push({ name });
    await route.save();

    return sendSuccess(res, { route }, 'Pickup point added to route successfully');
  } catch (error) {
    logError('Add pickup point error', error);
    return sendBadRequest(res, error instanceof Error ? error.message : 'Failed to add pickup point');
  }
});

// Remove pickup point from route (Admin only)
export const removePickupPoint = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { index } = req.body;

    const route = await Route.findById(id);

    if (!route) {
      return sendNotFound(res, 'Route not found');
    }

    if (index < 0 || index >= route.pickupPoints.length) {
      return sendBadRequest(res, 'Invalid pickup point index');
    }

    route.pickupPoints.splice(index, 1);
    await route.save();

    return sendSuccess(res, { route }, 'Pickup point removed from route successfully');
  } catch (error) {
    logError('Remove pickup point error', error);
    return sendBadRequest(res, error instanceof Error ? error.message : 'Failed to remove pickup point');
  }
});

// Add drop point to route (Admin only)
export const addDropPoint = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const route = await Route.findById(id);

    if (!route) {
      return sendNotFound(res, 'Route not found');
    }

    route.dropPoints.push({ name });
    await route.save();

    return sendSuccess(res, { route }, 'Drop point added to route successfully');
  } catch (error) {
    logError('Add drop point error', error);
    return sendBadRequest(res, error instanceof Error ? error.message : 'Failed to add drop point');
  }
});

// Remove drop point from route (Admin only)
export const removeDropPoint = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { index } = req.body;

    const route = await Route.findById(id);

    if (!route) {
      return sendNotFound(res, 'Route not found');
    }

    if (index < 0 || index >= route.dropPoints.length) {
      return sendBadRequest(res, 'Invalid drop point index');
    }

    route.dropPoints.splice(index, 1);
    await route.save();

    return sendSuccess(res, { route }, 'Drop point removed from route successfully');
  } catch (error) {
    logError('Remove drop point error', error);
    return sendBadRequest(res, error instanceof Error ? error.message : 'Failed to remove drop point');
  }
});
