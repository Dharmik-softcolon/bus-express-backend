import { Route, IRoute } from '../models/Route';
import { calculateDistance } from '../utils/auth';

export interface CreateRouteData {
  routeName: string;
  from: {
    city: string;
    state: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  to: {
    city: string;
    state: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  stops?: Array<{
    name: string;
    city: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
    arrivalTime?: string;
    departureTime?: string;
  }>;
}

export interface UpdateRouteData {
  routeName?: string;
  from?: {
    city: string;
    state: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  to?: {
    city: string;
    state: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  distance?: number;
  duration?: number;
  stops?: Array<{
    name: string;
    city: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
    arrivalTime?: string;
    departureTime?: string;
  }>;
  isActive?: boolean;
}

export interface RouteFilters {
  fromCity?: string;
  toCity?: string;
  isActive?: boolean;
  search?: string;
}

export class RouteService {
  async createRoute(routeData: CreateRouteData): Promise<IRoute> {
    // Check if route already exists
    const existingRoute = await Route.findOne({
      'from.city': routeData.from.city,
      'to.city': routeData.to.city,
    });

    if (existingRoute) {
      throw new Error('Route between these cities already exists');
    }

    // Calculate distance and duration
    const distance = calculateDistance(
      routeData.from.coordinates.latitude,
      routeData.from.coordinates.longitude,
      routeData.to.coordinates.latitude,
      routeData.to.coordinates.longitude
    );

    // Estimate duration based on distance (assuming average speed of 60 km/h)
    const duration = Math.round(distance * 60 / 60); // Convert to minutes

    const route = await Route.create({
      ...routeData,
      distance,
      duration,
      stops: routeData.stops || [],
    });

    return route;
  }

  async getRouteById(routeId: string): Promise<IRoute | null> {
    return await Route.findById(routeId);
  }

  async getRoutes(filters: RouteFilters, pagination: { page: number; limit: number; skip: number }): Promise<{
    routes: IRoute[];
    total: number;
  }> {
    // Build filter
    const filter: any = {};
    if (filters.isActive !== undefined) filter.isActive = filters.isActive;
    
    if (filters.fromCity || filters.toCity) {
      filter.$and = [];
      if (filters.fromCity) {
        filter.$and.push({ 'from.city': { $regex: filters.fromCity, $options: 'i' } });
      }
      if (filters.toCity) {
        filter.$and.push({ 'to.city': { $regex: filters.toCity, $options: 'i' } });
      }
    }

    if (filters.search) {
      filter.$or = [
        { routeName: { $regex: filters.search, $options: 'i' } },
        { 'from.city': { $regex: filters.search, $options: 'i' } },
        { 'to.city': { $regex: filters.search, $options: 'i' } },
      ];
    }

    const routes = await Route.find(filter)
      .sort({ createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit);

    const total = await Route.countDocuments(filter);

    return { routes, total };
  }

  async updateRoute(routeId: string, updateData: UpdateRouteData): Promise<IRoute | null> {
    const route = await Route.findById(routeId);

    if (!route) {
      throw new Error('Route not found');
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
      routeId,
      updateData,
      { new: true, runValidators: true }
    );

    return updatedRoute;
  }

  async deleteRoute(routeId: string): Promise<void> {
    const route = await Route.findById(routeId);

    if (!route) {
      throw new Error('Route not found');
    }

    await Route.findByIdAndDelete(routeId);
  }

  async searchRoutes(fromCity: string, toCity: string): Promise<IRoute[]> {
    if (!fromCity || !toCity) {
      throw new Error('Both fromCity and toCity are required');
    }

    return await Route.find({
      $and: [
        { 'from.city': { $regex: fromCity, $options: 'i' } },
        { 'to.city': { $regex: toCity, $options: 'i' } },
        { isActive: true },
      ],
    });
  }

  async getPopularRoutes(limit: number = 10): Promise<IRoute[]> {
    // This is a simplified version. In a real application, you would
    // calculate popularity based on booking frequency
    return await Route.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  async addStopToRoute(routeId: string, stop: any): Promise<IRoute | null> {
    const route = await Route.findById(routeId);

    if (!route) {
      throw new Error('Route not found');
    }

    route.stops.push(stop);
    await route.save();

    return route;
  }

  async removeStopFromRoute(routeId: string, stopIndex: number): Promise<IRoute | null> {
    const route = await Route.findById(routeId);

    if (!route) {
      throw new Error('Route not found');
    }

    if (stopIndex < 0 || stopIndex >= route.stops.length) {
      throw new Error('Invalid stop index');
    }

    route.stops.splice(stopIndex, 1);
    await route.save();

    return route;
  }

  async updateRouteStatus(routeId: string, isActive: boolean): Promise<IRoute | null> {
    const route = await Route.findById(routeId);

    if (!route) {
      throw new Error('Route not found');
    }

    const updatedRoute = await Route.findByIdAndUpdate(
      routeId,
      { isActive },
      { new: true, runValidators: true }
    );

    return updatedRoute;
  }

  async getRoutesCount(filters: { ownerId?: string; adminId?: string } = {}): Promise<number> {
    const query: any = { isActive: true };
    
    if (filters.ownerId || filters.adminId) {
      // Routes are typically associated with buses, so we need to check bus ownership
      const Bus = require('../models/Bus');
      const buses = await Bus.find({ 
        operator: filters.ownerId || filters.adminId 
      }).select('_id');
      const busIds = buses.map((bus: any) => bus._id);
      
      // This is a simplified approach. In a real app, you might have a direct relationship
      // between routes and operators
      query._id = { $in: [] }; // Empty for now, as routes don't have direct owner relationship
    }
    
    return await Route.countDocuments(query);
  }
}
