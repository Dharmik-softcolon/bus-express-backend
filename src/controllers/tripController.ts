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

    // Check if bus is available
    if (busData.status !== 'active') {
      return sendBadRequest(res, 'Bus is not available for trips');
    }

    // Validate that route exists
    const routeData = await Route.findById(route);
    if (!routeData) {
      return sendNotFound(res, 'Route not found');
    }

    // Validate that driver exists (if provided and not empty)
    if (driver && driver.trim() !== '') {
      const driverData = await User.findById(driver);
      if (!driverData || driverData.role !== USER_ROLES.BUS_EMPLOYEE || driverData.subrole !== 'DRIVER') {
        return sendBadRequest(res, 'Invalid driver');
      }

      // Check if driver is available (not assigned to another trip on the same date)
      const existingDriverTrip = await Trip.findOne({
        driver,
        departureDate: new Date(departureDate),
        status: { $in: ['scheduled', 'in_progress'] }
      });
      if (existingDriverTrip) {
        return sendBadRequest(res, 'Driver is already assigned to another trip on this date');
      }
    }

    // Validate helper if provided and not empty
    if (helper && helper.trim() !== '') {
      const helperData = await User.findById(helper);
      if (!helperData || helperData.role !== USER_ROLES.BUS_EMPLOYEE || helperData.subrole !== 'HELPER') {
        return sendBadRequest(res, 'Invalid helper');
      }

      // Check if helper is available
      const existingHelperTrip = await Trip.findOne({
        helper,
        departureDate: new Date(departureDate),
        status: { $in: ['scheduled', 'in_progress'] }
      });
      if (existingHelperTrip) {
        return sendBadRequest(res, 'Helper is already assigned to another trip on this date');
      }
    }

    // Check if bus is available for the trip date
    const existingBusTrip = await Trip.findOne({
      bus,
      departureDate: new Date(departureDate),
      status: { $in: ['scheduled', 'in_progress'] }
    });
    if (existingBusTrip) {
      return sendBadRequest(res, 'Bus is already assigned to another trip on this date');
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
      { path: 'route', select: 'routeName from to distance duration' },
      { path: 'bus', select: 'busNumber busName type totalSeats' },
      { path: 'driver', select: 'name phone licenseNumber' },
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
      dateFrom,
      dateTo,
      search,
      sortBy = 'departureDate',
      sortOrder = 'asc'
    } = req.query;

    const filter: any = {};

    // Basic filters - only add if not empty
    if (status && status.toString().trim() !== '') filter.status = status;
    if (route && route.toString().trim() !== '') filter.route = route;
    if (bus && bus.toString().trim() !== '') filter.bus = bus;
    if (driver && typeof driver === 'string' && driver.trim() !== '') filter.driver = driver;
    
    // Handle route and bus filters from URL params
    if (req.params.routeId) {
      filter.route = req.params.routeId;
    }
    if (req.params.busId) {
      filter.bus = req.params.busId;
    }
    
    // Date filter - handle both departureDate and dateFrom/dateTo
    if (departureDate && departureDate.toString().trim() !== '') {
      const date = new Date(departureDate as string);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      filter.departureDate = {
        $gte: date,
        $lt: nextDay,
      };
    } else if (dateFrom && dateTo && dateFrom.toString().trim() !== '' && dateTo.toString().trim() !== '') {
      filter.departureDate = {
        $gte: new Date(dateFrom as string),
        $lte: new Date(dateTo as string),
      };
    }

    // Search filter - only if search term is provided
    if (search && search.toString().trim() !== '') {
      filter.$or = [
        { tripNumber: { $regex: search, $options: 'i' } },
        { 'route.routeName': { $regex: search, $options: 'i' } },
        { 'bus.busNumber': { $regex: search, $options: 'i' } },
        { 'driver.name': { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const sortDirection = sortOrder === 'desc' ? -1 : 1;
    const sortOptions: any = {};
    sortOptions[sortBy as string] = sortDirection;

    const trips = await Trip.find(filter)
      .populate('route', 'routeName from to distance duration')
      .populate('bus', 'busNumber busName type totalSeats')
      .populate('driver', 'name phone licenseNumber')
      .populate('helper', 'name phone')
      .sort(sortOptions)
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

    // Validate driver if provided
    if (updateData.driver && updateData.driver.trim() !== '') {
      const driverData = await User.findById(updateData.driver);
      if (!driverData || driverData.role !== USER_ROLES.BUS_EMPLOYEE || driverData.subrole !== 'DRIVER') {
        return sendBadRequest(res, 'Invalid driver');
      }
    }

    // Validate helper if provided
    if (updateData.helper && updateData.helper.trim() !== '') {
      const helperData = await User.findById(updateData.helper);
      if (!helperData || helperData.role !== USER_ROLES.BUS_EMPLOYEE || helperData.subrole !== 'HELPER') {
        return sendBadRequest(res, 'Invalid helper');
      }
    }

    // Validate bus if provided
    if (updateData.bus) {
      const busData = await Bus.findById(updateData.bus);
      if (!busData) {
        return sendNotFound(res, 'Bus not found');
      }
      if (busData.status !== 'active') {
        return sendBadRequest(res, 'Bus is not available for trips');
      }
    }

    // Validate route if provided
    if (updateData.route) {
      const routeData = await Route.findById(updateData.route);
      if (!routeData) {
        return sendNotFound(res, 'Route not found');
      }
    }

    const trip = await Trip.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate('route', 'routeName from to distance duration')
      .populate('bus', 'busNumber busName type totalSeats')
      .populate('driver', 'name phone licenseNumber')
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
          inProgressTrips: {
            $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] },
          },
          completedTrips: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
          },
          cancelledTrips: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] },
          },
          delayedTrips: {
            $sum: { $cond: [{ $eq: ['$status', 'delayed'] }, 1, 0] },
          },
          totalBookings: { $sum: '$totalBookings' },
          totalRevenue: { $sum: { $multiply: ['$totalBookings', '$fare'] } },
          averageOccupancy: { $avg: { $divide: [{ $subtract: ['$availableSeats', { $subtract: ['$availableSeats', '$totalBookings'] }] }, '$availableSeats'] } },
        },
      },
    ]);

    const result = stats[0] || {
      totalTrips: 0,
      scheduledTrips: 0,
      inProgressTrips: 0,
      completedTrips: 0,
      cancelledTrips: 0,
      delayedTrips: 0,
      totalBookings: 0,
      totalRevenue: 0,
      averageOccupancy: 0,
    };

    return sendSuccess(res, result, 'Trip statistics retrieved successfully');
  } catch (error) {
    logError('Error fetching trip statistics:', error);
    return sendError(res, 'Failed to fetch trip statistics');
  }
});

// Get available drivers for a specific date
export const getAvailableDrivers = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { date } = req.query;
    
    if (!date) {
      return sendBadRequest(res, 'Date is required');
    }

    const tripDate = new Date(date as string);
    
    // Get drivers already assigned to trips on this date
    const assignedDrivers = await Trip.find({
      departureDate: tripDate,
      status: { $in: ['scheduled', 'in_progress'] }
    }).select('driver');

    const assignedDriverIds = assignedDrivers.map(trip => trip.driver);

    // Get all available drivers
    const availableDrivers = await User.find({
      role: USER_ROLES.BUS_EMPLOYEE,
      subrole: 'DRIVER',
      status: 'active',
      _id: { $nin: assignedDriverIds }
    }).select('name phone licenseNumber');

    return sendSuccess(res, { drivers: availableDrivers }, 'Available drivers retrieved successfully');
  } catch (error) {
    logError('Error fetching available drivers:', error);
    return sendError(res, 'Failed to fetch available drivers');
  }
});

// Get available helpers for a specific date
export const getAvailableHelpers = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { date } = req.query;
    
    if (!date) {
      return sendBadRequest(res, 'Date is required');
    }

    const tripDate = new Date(date as string);
    
    // Get helpers already assigned to trips on this date
    const assignedHelpers = await Trip.find({
      departureDate: tripDate,
      status: { $in: ['scheduled', 'in_progress'] },
      helper: { $exists: true }
    }).select('helper');

    const assignedHelperIds = assignedHelpers.map(trip => trip.helper).filter(Boolean);

    // Get all available helpers
    const availableHelpers = await User.find({
      role: USER_ROLES.BUS_EMPLOYEE,
      subrole: 'HELPER',
      status: 'active',
      _id: { $nin: assignedHelperIds }
    }).select('name phone');

    return sendSuccess(res, { helpers: availableHelpers }, 'Available helpers retrieved successfully');
  } catch (error) {
    logError('Error fetching available helpers:', error);
    return sendError(res, 'Failed to fetch available helpers');
  }
});

// Get available buses for a specific date
export const getAvailableBuses = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { date } = req.query;
    
    if (!date) {
      return sendBadRequest(res, 'Date is required');
    }

    const tripDate = new Date(date as string);
    
    // Get buses already assigned to trips on this date
    const assignedBuses = await Trip.find({
      departureDate: tripDate,
      status: { $in: ['scheduled', 'in_progress'] }
    }).select('bus');

    const assignedBusIds = assignedBuses.map(trip => trip.bus);

    // Get all available buses
    const availableBuses = await Bus.find({
      status: 'active',
      _id: { $nin: assignedBusIds }
    }).select('busNumber busName type totalSeats');

    return sendSuccess(res, { buses: availableBuses }, 'Available buses retrieved successfully');
  } catch (error) {
    logError('Error fetching available buses:', error);
    return sendError(res, 'Failed to fetch available buses');
  }
});

// Get trips by bus admin (filtered by their buses)
export const getTripsByBusAdmin = asyncHandler(async (req: Request, res: Response) => {
  try {
    const authenticatedReq = req as any;
    const busAdminId = authenticatedReq.user.id;
    
    const {
      page = 1,
      limit = 10,
      status,
      route,
      bus,
      driver,
      departureDate,
      dateFrom,
      dateTo,
      search,
      sortBy = 'departureDate',
      sortOrder = 'asc'
    } = req.query;

    // Get buses owned by this bus admin
    const buses = await Bus.find({ operator: busAdminId }).select('_id');
    const busIds = buses.map(bus => bus._id);

    if (busIds.length === 0) {
      return sendSuccess(res, {
        trips: [],
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: 0,
          pages: 0,
        },
      }, 'No trips found');
    }

    const filter: any = {
      bus: { $in: busIds }
    };

    // Apply additional filters - only add if not empty
    if (status && status.toString().trim() !== '') filter.status = status;
    if (route && route.toString().trim() !== '') filter.route = route;
    if (bus && bus.toString().trim() !== '') filter.bus = bus;
    if (driver && typeof driver === 'string' && driver.trim() !== '') filter.driver = driver;
    
    // Date filter - handle both departureDate and dateFrom/dateTo
    if (departureDate && departureDate.toString().trim() !== '') {
      const date = new Date(departureDate as string);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      filter.departureDate = {
        $gte: date,
        $lt: nextDay,
      };
    } else if (dateFrom && dateTo && dateFrom.toString().trim() !== '' && dateTo.toString().trim() !== '') {
      filter.departureDate = {
        $gte: new Date(dateFrom as string),
        $lte: new Date(dateTo as string),
      };
    }

    // Search filter - only if search term is provided
    if (search && search.toString().trim() !== '') {
      filter.$or = [
        { tripNumber: { $regex: search, $options: 'i' } },
        { 'route.routeName': { $regex: search, $options: 'i' } },
        { 'bus.busNumber': { $regex: search, $options: 'i' } },
        { 'driver.name': { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const sortDirection = sortOrder === 'desc' ? -1 : 1;
    const sortOptions: any = {};
    sortOptions[sortBy as string] = sortDirection;

    const trips = await Trip.find(filter)
      .populate('route', 'routeName from to distance duration')
      .populate('bus', 'busNumber busName type totalSeats')
      .populate('driver', 'name phone licenseNumber')
      .populate('helper', 'name phone')
      .sort(sortOptions)
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
    logError('Error fetching trips by bus admin:', error);
    return sendError(res, 'Failed to fetch trips');
  }
});

// Bulk update trip status
export const bulkUpdateTripStatus = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { tripIds, status } = req.body;

    if (!tripIds || !Array.isArray(tripIds) || tripIds.length === 0) {
      return sendBadRequest(res, 'Trip IDs array is required');
    }

    if (!status || !['scheduled', 'in_progress', 'completed', 'cancelled', 'delayed'].includes(status)) {
      return sendBadRequest(res, 'Valid status is required');
    }

    const result = await Trip.updateMany(
      { _id: { $in: tripIds } },
      { status }
    );

    return sendSuccess(res, { 
      modifiedCount: result.modifiedCount,
      matchedCount: result.matchedCount 
    }, `${result.modifiedCount} trips updated successfully`);
  } catch (error) {
    logError('Error bulk updating trip status:', error);
    return sendError(res, 'Failed to bulk update trip status');
  }
});
