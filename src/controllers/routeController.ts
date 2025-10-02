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
      stops,
    } = req.body;

    // Check if route already exists
    const existingRoute = await Route.findOne({
      'from.city': from.city,
      'to.city': to.city,
    });

    if (existingRoute) {
      return sendBadRequest(res, 'Route between these cities already exists');
    }

    // Calculate distance and duration
    const distance = calculateDistance(
      from.coordinates.latitude,
      from.coordinates.longitude,
      to.coordinates.latitude,
      to.coordinates.longitude
    );

    // Estimate duration based on distance (assuming average speed of 60 km/h)
    const duration = Math.round(distance * 60 / 60); // Convert to minutes

    const route = await Route.create({
      routeName,
      from,
      to,
      distance,
      duration,
      stops: stops || [],
      isActive: true,
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

    const { fromCity, toCity, isActive, search } = req.query;

    // Build filter
    const filter: any = {};
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    
    if (fromCity || toCity) {
      filter.$and = [];
      if (fromCity) {
        filter.$and.push({ 'from.city': { $regex: fromCity, $options: 'i' } });
      }
      if (toCity) {
        filter.$and.push({ 'to.city': { $regex: toCity, $options: 'i' } });
      }
    }

    if (search) {
      filter.$or = [
        { routeName: { $regex: search, $options: 'i' } },
        { 'from.city': { $regex: search, $options: 'i' } },
        { 'to.city': { $regex: search, $options: 'i' } },
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

    // If coordinates are being updated, recalculate distance and duration
    if (updateData.from?.coordinates || updateData.to?.coordinates) {
      const fromCoords = updateData.from?.coordinates || route.from.coordinates;
      const toCoords = updateData.to?.coordinates || route.to.coordinates;
      
      updateData.distance = calculateDistance(
        fromCoords.latitude,
        fromCoords.longitude,
        toCoords.latitude,
        toCoords.longitude
      );
      
      updateData.duration = Math.round(updateData.distance * 60 / 60);
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
    const { fromCity, toCity } = req.query;

    if (!fromCity || !toCity) {
      return sendBadRequest(res, 'Both fromCity and toCity are required');
    }

    const routes = await Route.find({
      $and: [
        { 'from.city': { $regex: fromCity, $options: 'i' } },
        { 'to.city': { $regex: toCity, $options: 'i' } },
        { isActive: true },
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
    const routes = await Route.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(limit);

    return sendSuccess(res, { routes }, 'Popular routes retrieved successfully');
  } catch (error) {
    logError('Get popular routes error', error);
    return sendError(res, 'Failed to get popular routes');
  }
});

// Add stop to route (Admin only)
export const addStopToRoute = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { stop } = req.body;

    const route = await Route.findById(id);

    if (!route) {
      return sendNotFound(res, 'Route not found');
    }

    route.stops.push(stop);
    await route.save();

    return sendSuccess(res, { route }, 'Stop added to route successfully');
  } catch (error) {
    logError('Add stop to route error', error);
    return sendBadRequest(res, error instanceof Error ? error.message : 'Failed to add stop');
  }
});

// Remove stop from route (Admin only)
export const removeStopFromRoute = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { stopIndex } = req.body;

    const route = await Route.findById(id);

    if (!route) {
      return sendNotFound(res, 'Route not found');
    }

    if (stopIndex < 0 || stopIndex >= route.stops.length) {
      return sendBadRequest(res, 'Invalid stop index');
    }

    route.stops.splice(stopIndex, 1);
    await route.save();

    return sendSuccess(res, { route }, 'Stop removed from route successfully');
  } catch (error) {
    logError('Remove stop from route error', error);
    return sendBadRequest(res, error instanceof Error ? error.message : 'Failed to remove stop');
  }
});

// Update route status (Admin only)
export const updateRouteStatus = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const route = await Route.findById(id);

    if (!route) {
      return sendNotFound(res, 'Route not found');
    }

    const updatedRoute = await Route.findByIdAndUpdate(
      id,
      { isActive },
      { new: true, runValidators: true }
    );

    return sendSuccess(res, { route: updatedRoute }, 'Route status updated successfully');
  } catch (error) {
    logError('Update route status error', error);
    return sendBadRequest(res, error instanceof Error ? error.message : 'Failed to update route status');
  }
});
