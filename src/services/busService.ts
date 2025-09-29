import { Bus, IBus } from '../models/Bus.js';

export interface CreateBusData {
  busNumber: string;
  busName: string;
  type: string;
  totalSeats: number;
  amenities?: string[];
  features?: {
    wifi: boolean;
    charging: boolean;
    blankets: boolean;
    water: boolean;
    snacks: boolean;
  };
  images?: string[];
}

export interface UpdateBusData {
  busNumber?: string;
  busName?: string;
  type?: string;
  totalSeats?: number;
  availableSeats?: number;
  amenities?: string[];
  features?: {
    wifi: boolean;
    charging: boolean;
    blankets: boolean;
    water: boolean;
    snacks: boolean;
  };
  images?: string[];
  status?: string;
}

export interface BusFilters {
  type?: string;
  status?: string;
  operator?: string;
  search?: string;
}

export class BusService {
  async createBus(busData: CreateBusData, operatorId: string): Promise<IBus> {
    // Check if bus number already exists
    const existingBus = await Bus.findOne({ busNumber: busData.busNumber });
    if (existingBus) {
      throw new Error('Bus with this number already exists');
    }

    const bus = await Bus.create({
      ...busData,
      operator: operatorId,
      availableSeats: busData.totalSeats,
      features: busData.features || {
        wifi: false,
        charging: false,
        blankets: false,
        water: false,
        snacks: false,
      },
      amenities: busData.amenities || [],
      images: busData.images || [],
    });

    await bus.populate('operator', 'name email phone');
    return bus;
  }

  async getBusById(busId: string): Promise<IBus | null> {
    return await Bus.findById(busId).populate('operator', 'name email phone');
  }

  async getBuses(filters: BusFilters, pagination: { page: number; limit: number; skip: number }): Promise<{
    buses: IBus[];
    total: number;
  }> {
    // Build filter
    const filter: any = {};
    if (filters.type) filter.type = filters.type;
    if (filters.status) filter.status = filters.status;
    if (filters.operator) filter.operator = filters.operator;
    if (filters.search) {
      filter.$or = [
        { busNumber: { $regex: filters.search, $options: 'i' } },
        { busName: { $regex: filters.search, $options: 'i' } },
      ];
    }

    const buses = await Bus.find(filter)
      .populate('operator', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit);

    const total = await Bus.countDocuments(filter);

    return { buses, total };
  }

  async updateBus(busId: string, updateData: UpdateBusData, userId: string, userRole: string): Promise<IBus | null> {
    const bus = await Bus.findById(busId);

    if (!bus) {
      throw new Error('Bus not found');
    }

    // Check if user is operator of this bus or admin
    if (userRole !== 'admin' && bus.operator.toString() !== userId) {
      throw new Error('You can only update your own buses');
    }

    // If totalSeats is being updated, update availableSeats accordingly
    if (updateData.totalSeats && updateData.totalSeats !== bus.totalSeats) {
      const seatDifference = updateData.totalSeats - bus.totalSeats;
      updateData.availableSeats = bus.availableSeats + seatDifference;
    }

    const updatedBus = await Bus.findByIdAndUpdate(
      busId,
      updateData,
      { new: true, runValidators: true }
    ).populate('operator', 'name email phone');

    return updatedBus;
  }

  async deleteBus(busId: string, userId: string, userRole: string): Promise<void> {
    const bus = await Bus.findById(busId);

    if (!bus) {
      throw new Error('Bus not found');
    }

    // Check if user is operator of this bus or admin
    if (userRole !== 'admin' && bus.operator.toString() !== userId) {
      throw new Error('You can only delete your own buses');
    }

    await Bus.findByIdAndDelete(busId);
  }

  async updateBusStatus(busId: string, status: string, userId: string, userRole: string): Promise<IBus | null> {
    const bus = await Bus.findById(busId);

    if (!bus) {
      throw new Error('Bus not found');
    }

    // Check if user is operator of this bus or admin
    if (userRole !== 'admin' && bus.operator.toString() !== userId) {
      throw new Error('You can only update your own buses');
    }

    const updatedBus = await Bus.findByIdAndUpdate(
      busId,
      { status },
      { new: true, runValidators: true }
    ).populate('operator', 'name email phone');

    return updatedBus;
  }

  async getBusesByOperator(operatorId: string, pagination: { page: number; limit: number; skip: number }): Promise<{
    buses: IBus[];
    total: number;
  }> {
    const buses = await Bus.find({ operator: operatorId })
      .populate('operator', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit);

    const total = await Bus.countDocuments({ operator: operatorId });

    return { buses, total };
  }

  async getBusStatistics(busId: string, userId: string, userRole: string): Promise<any> {
    const bus = await Bus.findById(busId);

    if (!bus) {
      throw new Error('Bus not found');
    }

    // Check if user is operator of this bus or admin
    if (userRole !== 'admin' && bus.operator.toString() !== userId) {
      throw new Error('You can only view statistics for your own buses');
    }

    // Get booking statistics for this bus
    const Booking = require('../models/Booking.js').Booking;
    
    const totalBookings = await Booking.countDocuments({ bus: busId });
    const confirmedBookings = await Booking.countDocuments({ bus: busId, bookingStatus: 'confirmed' });
    const cancelledBookings = await Booking.countDocuments({ bus: busId, bookingStatus: 'cancelled' });
    
    // Calculate revenue
    const bookings = await Booking.find({ bus: busId, bookingStatus: 'confirmed' });
    const totalRevenue = bookings.reduce((sum: number, booking: any) => sum + booking.totalAmount, 0);

    return {
      bus: {
        id: bus._id,
        busNumber: bus.busNumber,
        busName: bus.busName,
        totalSeats: bus.totalSeats,
        availableSeats: bus.availableSeats,
        status: bus.status,
      },
      statistics: {
        totalBookings,
        confirmedBookings,
        cancelledBookings,
        totalRevenue,
        occupancyRate: bus.totalSeats > 0 ? ((bus.totalSeats - bus.availableSeats) / bus.totalSeats * 100).toFixed(2) : 0,
      },
    };
  }

  async updateAvailableSeats(busId: string, seatCount: number): Promise<void> {
    await Bus.findByIdAndUpdate(busId, {
      $inc: { availableSeats: seatCount }
    });
  }
}
