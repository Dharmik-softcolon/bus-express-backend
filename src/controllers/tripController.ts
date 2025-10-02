import { Request, Response } from 'express';
import { Trip } from '../models/Trip';
import { Bus } from '../models/Bus';
import { Route } from '../models/Route';
import { User } from '../models/User';
import { Booking } from '../models/Booking';
import { sendSuccess, sendError, sendBadRequest, sendNotFound, sendCreated, asyncHandler } from '../utils/responseHandler';
import { HTTP_STATUS, API_MESSAGES, USER_ROLES } from '../constants';
import { logError } from '../utils/logger';

// Create a new trip
export const createTrip = asyncHandler(async (req: Request, res: Response) => {
  try {
    const {
      route,
      bus,
      driver,
      helper,
      departureTime,
      arrivalTime,
      departureDate,
      pickupPoints,
      dropPoints,
      fare,
    } = req.body;

    // Validate that bus exists and get available seats
    const busData = await Bus.findById(bus);
    if (!busData) {
      return sendNotFound(res, 'Bus not found');
    }

    // Validate that route exists
    const routeData = await Route.findById(route);
    if (!routeData) {
      return sendNotFound(res, 'Route not found');
    }

    // Validate that driver exists
    const driverData = await User.findById(driver);
    if (!driverData || driverData.role !== USER_ROLES.BUS_EMPLOYEE || driverData.subrole !== 'DRIVER') {
      return sendBadRequest(res, 'Invalid driver');
    }

    // Validate helper if provided
    if (helper) {
      const helperData = await User.findById(helper);
      if (!helperData || helperData.role !== USER_ROLES.BUS_EMPLOYEE || helperData.subrole !== 'HELPER') {
        return sendBadRequest(res, 'Invalid helper');
      }
    }

    // Generate trip number
    const tripCount = await Trip.countDocuments();
    const tripNumber = `TR-${String(tripCount + 1).padStart(3, '0')}`;

    const trip = await Trip.create({
      tripNumber,
      route,
      bus,
      driver,
      helper,
      departureTime,
      arrivalTime,
      departureDate,
      pickupPoints,
      dropPoints,
      availableSeats: busData.totalSeats,
      fare,
      status: 'scheduled',
    });

    // Populate the trip with related data
    await trip.populate([
      { path: 'route', select: 'routeName from to' },
      { path: 'bus', select: 'busNumber busName type' },
      { path: 'driver', select: 'name phone' },
      { path: 'helper', select: 'name phone' },
    ]);

    logError(`Trip created: ${tripNumber}`, null);
    return sendCreated(res, { trip }, 'Trip created successfully');
  } catch (error) {
    logError('Error creating trip:', error);
    return sendError(res, 'Failed to create trip');
  }
});

// Get all trips with pagination and filters
export const getAllTrips = asyncHandler(async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      route,
      bus,
      driver,
      departureDate,
    } = req.query;

    const filter: any = {};

    if (status) filter.status = status;
    if (route) filter.route = route;
    if (bus) filter.bus = bus;
    if (driver) filter.driver = driver;
    
    // Handle route and bus filters from URL params
    if (req.params.routeId) {
      filter.route = req.params.routeId;
    }
    if (req.params.busId) {
      filter.bus = req.params.busId;
    }
    if (departureDate) {
      const date = new Date(departureDate as string);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      filter.departureDate = {
        $gte: date,
        $lt: nextDay,
      };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const trips = await Trip.find(filter)
      .populate('route', 'routeName from to')
      .populate('bus', 'busNumber busName type')
      .populate('driver', 'name phone')
      .populate('helper', 'name phone')
      .sort({ departureDate: 1, departureTime: 1 })
      .limit(Number(limit))
      .skip(skip);

    const total = await Trip.countDocuments(filter);

    return sendSuccess(res, {
      trips,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    }, 'Trips retrieved successfully');
  } catch (error) {
    logError('Error fetching trips:', error);
    return sendError(res, 'Failed to fetch trips');
  }
});

// Get trip by ID
export const getTripById = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const trip = await Trip.findById(id)
      .populate('route', 'routeName from to distance duration')
      .populate('bus', 'busNumber busName type totalSeats')
      .populate('driver', 'name phone licenseNumber')
      .populate('helper', 'name phone');

    if (!trip) {
      return sendNotFound(res, 'Trip not found');
    }

    // Get bookings for this trip
    const bookings = await Booking.find({ trip: id })
      .populate('user', 'name email phone')
      .select('seats totalAmount bookingStatus paymentStatus');

    return sendSuccess(res, {
      trip,
      bookings,
    }, 'Trip retrieved successfully');
  } catch (error) {
    logError('Error fetching trip:', error);
    return sendError(res, 'Failed to fetch trip');
  }
});

// Update trip
export const updateTrip = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const trip = await Trip.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate('route', 'routeName from to')
      .populate('bus', 'busNumber busName type')
      .populate('driver', 'name phone')
      .populate('helper', 'name phone');

    if (!trip) {
      return sendNotFound(res, 'Trip not found');
    }

    return sendSuccess(res, trip, 'Trip updated successfully');
  } catch (error) {
    logError('Error updating trip:', error);
    return sendError(res, 'Failed to update trip');
  }
});

// Delete trip
export const deleteTrip = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if trip has any bookings
    const bookings = await Booking.find({ trip: id });
    if (bookings.length > 0) {
      return sendBadRequest(res, 'Cannot delete trip with existing bookings');
    }

    const trip = await Trip.findByIdAndDelete(id);
    if (!trip) {
      return sendNotFound(res, 'Trip not found');
    }

    return sendSuccess(res, trip, 'Trip deleted successfully');
  } catch (error) {
    logError('Error deleting trip:', error);
    return sendError(res, 'Failed to delete trip');
  }
});

// Update trip status
export const updateTripStatus = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const trip = await Trip.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    )
      .populate('route', 'routeName from to')
      .populate('bus', 'busNumber busName type')
      .populate('driver', 'name phone')
      .populate('helper', 'name phone');

    if (!trip) {
      return sendNotFound(res, 'Trip not found');
    }

    return sendSuccess(res, trip, 'Trip status updated successfully');
  } catch (error) {
    logError('Error updating trip status:', error);
    return sendError(res, 'Failed to update trip status');
  }
});

// Get trip statistics
export const getTripStatistics = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { period = 'monthly', startDate, endDate } = req.query;

    let dateFilter: any = {};
    if (startDate && endDate) {
      dateFilter.departureDate = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string),
      };
    } else {
      // Default to current month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      dateFilter.departureDate = {
        $gte: startOfMonth,
        $lte: endOfMonth,
      };
    }

    const stats = await Trip.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          totalTrips: { $sum: 1 },
          scheduledTrips: {
            $sum: { $cond: [{ $eq: ['$status', 'scheduled'] }, 1, 0] },
          },
          completedTrips: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
          },
          cancelledTrips: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] },
          },
          totalBookings: { $sum: '$totalBookings' },
          totalRevenue: { $sum: { $multiply: ['$totalBookings', '$fare'] } },
        },
      },
    ]);

    const result = stats[0] || {
      totalTrips: 0,
      scheduledTrips: 0,
      completedTrips: 0,
      cancelledTrips: 0,
      totalBookings: 0,
      totalRevenue: 0,
    };

    return sendSuccess(res, result, 'Trip statistics retrieved successfully');
  } catch (error) {
    logError('Error fetching trip statistics:', error);
    return sendError(res, 'Failed to fetch trip statistics');
  }
});
