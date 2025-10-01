import { Trip, ITrip } from '../models/Trip';
import { TRIP_STATUS } from '../constants';

export interface CreateTripData {
  bus: string;
  route: string;
  departureTime: Date;
  arrivalTime: Date;
  price: number;
  driver?: string;
  conductor?: string;
}

export interface UpdateTripData {
  departureTime?: Date;
  arrivalTime?: Date;
  price?: number;
  status?: string;
  driver?: string;
  conductor?: string;
}

export interface TripFilters {
  status?: string;
  busId?: string;
  routeId?: string;
  date?: string;
}

export class TripService {
  async createTrip(tripData: CreateTripData): Promise<ITrip> {
    const trip = new Trip({
      ...tripData,
      status: TRIP_STATUS.SCHEDULED,
    });

    await trip.save();
    return trip;
  }

  async getTripById(tripId: string): Promise<ITrip | null> {
    return await Trip.findById(tripId)
      .populate('bus', 'busNumber busName type totalSeats')
      .populate('route', 'routeName from to')
      .populate('driver', 'name phone')
      .populate('conductor', 'name phone');
  }

  async updateTrip(tripId: string, updateData: UpdateTripData): Promise<ITrip | null> {
    return await Trip.findByIdAndUpdate(
      tripId,
      updateData,
      { new: true, runValidators: true }
    );
  }

  async deleteTrip(tripId: string): Promise<void> {
    await Trip.findByIdAndDelete(tripId);
  }

  async getTrips(filters: TripFilters = {}, page: number = 1, limit: number = 10): Promise<{ trips: ITrip[]; total: number }> {
    const query: any = {};

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.busId) {
      query.bus = filters.busId;
    }

    if (filters.routeId) {
      query.route = filters.routeId;
    }

    if (filters.date) {
      const startDate = new Date(filters.date);
      const endDate = new Date(filters.date);
      endDate.setDate(endDate.getDate() + 1);
      query.departureTime = { $gte: startDate, $lt: endDate };
    }

    const skip = (page - 1) * limit;
    const trips = await Trip.find(query)
      .populate('bus', 'busNumber busName type totalSeats')
      .populate('route', 'routeName from to')
      .populate('driver', 'name phone')
      .populate('conductor', 'name phone')
      .sort({ departureTime: 1 })
      .skip(skip)
      .limit(limit);

    const total = await Trip.countDocuments(query);

    return { trips, total };
  }

  async getTripsCount(filters: { 
    adminId?: string; 
    employeeId?: string; 
    status?: string; 
    date?: string 
  } = {}): Promise<number> {
    const query: any = {};
    
    if (filters.adminId) {
      // Get trips for buses managed by this admin
      const Bus = require('../models/Bus');
      const buses = await Bus.find({ operator: filters.adminId }).select('_id');
      const busIds = buses.map((bus: any) => bus._id);
      query.bus = { $in: busIds };
    }
    
    if (filters.employeeId) {
      query.$or = [
        { driver: filters.employeeId },
        { conductor: filters.employeeId }
      ];
    }
    
    if (filters.status) {
      query.status = filters.status;
    }
    
    if (filters.date) {
      const startDate = new Date(filters.date);
      const endDate = new Date(filters.date);
      endDate.setDate(endDate.getDate() + 1);
      query.departureTime = { $gte: startDate, $lt: endDate };
    }
    
    return await Trip.countDocuments(query);
  }
}
