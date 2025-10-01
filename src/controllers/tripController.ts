import { Request, Response } from 'express';
import { Trip } from '../models/Trip';
import { Bus } from '../models/Bus';
import { Route } from '../models/Route';
import { Employee } from '../models/Employee';
import { Booking } from '../models/Booking';
import { sendResponse } from '../utils/responseHandler';
import { HTTP_STATUS, API_MESSAGES } from '../constants';
import { logger } from '../utils/logger';

// Create a new trip
export const createTrip = async (req: Request, res: Response) => {
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
      return sendResponse(res, HTTP_STATUS.NOT_FOUND, false, 'Bus not found');
    }

    // Validate that route exists
    const routeData = await Route.findById(route);
    if (!routeData) {
      return sendResponse(res, HTTP_STATUS.NOT_FOUND, false, 'Route not found');
    }

    // Validate that driver exists
    const driverData = await Employee.findById(driver);
    if (!driverData || driverData.role !== 'driver') {
      return sendResponse(res, HTTP_STATUS.BAD_REQUEST, false, 'Invalid driver');
    }

    // Validate helper if provided
    if (helper) {
      const helperData = await Employee.findById(helper);
      if (!helperData || helperData.role !== 'helper') {
        return sendResponse(res, HTTP_STATUS.BAD_REQUEST, false, 'Invalid helper');
      }
    }

    // Generate trip number
    const tripCount = await Trip.countDocuments();
    const tripNumber = `TR-${String(tripCount + 1).padStart(3, '0')}`;

    const trip = new Trip({
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
    });

    await trip.save();

    // Populate the trip with related data
    await trip.populate([
      { path: 'route', select: 'routeName from to' },
      { path: 'bus', select: 'busNumber busName type' },
      { path: 'driver', select: 'name phone' },
      { path: 'helper', select: 'name phone' },
    ]);

    logger.info(`Trip created: ${tripNumber}`);
    return sendResponse(res, HTTP_STATUS.CREATED, true, API_MESSAGES.SUCCESS, trip);
  } catch (error) {
    logger.error('Error creating trip:', error);
    return sendResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, false, API_MESSAGES.INTERNAL_ERROR);
  }
};

// Get all trips with pagination and filters
export const getAllTrips = async (req: Request, res: Response) => {
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

    const trips = await Trip.find(filter)
      .populate('route', 'routeName from to')
      .populate('bus', 'busNumber busName type')
      .populate('driver', 'name phone')
      .populate('helper', 'name phone')
      .sort({ departureDate: 1, departureTime: 1 })
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit));

    const total = await Trip.countDocuments(filter);

    return sendResponse(res, HTTP_STATUS.OK, true, API_MESSAGES.SUCCESS, {
      trips,
      pagination: {
        current: Number(page),
        pages: Math.ceil(total / Number(limit)),
        total,
      },
    });
  } catch (error) {
    logger.error('Error fetching trips:', error);
    return sendResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, false, API_MESSAGES.INTERNAL_ERROR);
  }
};

// Get trip by ID
export const getTripById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const trip = await Trip.findById(id)
      .populate('route', 'routeName from to distance duration')
      .populate('bus', 'busNumber busName type totalSeats')
      .populate('driver', 'name phone licenseNumber')
      .populate('helper', 'name phone');

    if (!trip) {
      return sendResponse(res, HTTP_STATUS.NOT_FOUND, false, 'Trip not found');
    }

    // Get bookings for this trip
    const bookings = await Booking.find({ trip: id })
      .populate('user', 'name email phone')
      .select('seats totalAmount bookingStatus paymentStatus');

    return sendResponse(res, HTTP_STATUS.OK, true, API_MESSAGES.SUCCESS, {
      trip,
      bookings,
    });
  } catch (error) {
    logger.error('Error fetching trip:', error);
    return sendResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, false, API_MESSAGES.INTERNAL_ERROR);
  }
};

// Update trip
export const updateTrip = async (req: Request, res: Response) => {
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
      return sendResponse(res, HTTP_STATUS.NOT_FOUND, false, 'Trip not found');
    }

    logger.info(`Trip updated: ${trip.tripNumber}`);
    return sendResponse(res, HTTP_STATUS.OK, true, API_MESSAGES.SUCCESS, trip);
  } catch (error) {
    logger.error('Error updating trip:', error);
    return sendResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, false, API_MESSAGES.INTERNAL_ERROR);
  }
};

// Delete trip
export const deleteTrip = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if trip has any bookings
    const bookings = await Booking.find({ trip: id });
    if (bookings.length > 0) {
      return sendResponse(res, HTTP_STATUS.BAD_REQUEST, false, 'Cannot delete trip with existing bookings');
    }

    const trip = await Trip.findByIdAndDelete(id);
    if (!trip) {
      return sendResponse(res, HTTP_STATUS.NOT_FOUND, false, 'Trip not found');
    }

    logger.info(`Trip deleted: ${trip.tripNumber}`);
    return sendResponse(res, HTTP_STATUS.OK, true, 'Trip deleted successfully');
  } catch (error) {
    logger.error('Error deleting trip:', error);
    return sendResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, false, API_MESSAGES.INTERNAL_ERROR);
  }
};

// Update trip status
export const updateTripStatus = async (req: Request, res: Response) => {
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
      return sendResponse(res, HTTP_STATUS.NOT_FOUND, false, 'Trip not found');
    }

    logger.info(`Trip status updated: ${trip.tripNumber} - ${status}`);
    return sendResponse(res, HTTP_STATUS.OK, true, 'Trip status updated successfully', trip);
  } catch (error) {
    logger.error('Error updating trip status:', error);
    return sendResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, false, API_MESSAGES.INTERNAL_ERROR);
  }
};

// Get trip statistics
export const getTripStatistics = async (req: Request, res: Response) => {
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

    return sendResponse(res, HTTP_STATUS.OK, true, API_MESSAGES.SUCCESS, result);
  } catch (error) {
    logger.error('Error fetching trip statistics:', error);
    return sendResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, false, API_MESSAGES.INTERNAL_ERROR);
  }
};
