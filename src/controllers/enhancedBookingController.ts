import { Request, Response } from 'express';
import { sendSuccess, sendError, sendBadRequest, sendNotFound, sendCreated, asyncHandler } from '../utils/responseHandler';
import { HTTP_STATUS, API_MESSAGES, BOOKING_STATUS, PAYMENT_STATUS } from '../constants';
import { generateBookingReference } from '../utils/auth';
import { AuthenticatedRequest } from '../types';
import { logError } from '../utils/logger';
import { Booking, IBooking } from '../models/Booking';
import { Bus } from '../models/Bus';
import { Route } from '../models/Route';
import { Trip } from '../models/Trip';
import { User } from '../models/User';

// Enhanced Create booking with better validation and seat management
export const createBooking = asyncHandler(async (req: Request, res: Response) => {
  try {
    const {
      trip,
      seats,
      boardingPoint,
      droppingPoint,
      paymentMethod,
    } = req.body;

    const authenticatedReq = req as AuthenticatedRequest;
    const userId = authenticatedReq.user?.id;

    if (!userId) {
      return sendBadRequest(res, 'User not authenticated');
    }

    // Validate trip exists and get detailed information
    const tripData = await Trip.findById(trip)
      .populate('bus', 'busNumber busName type totalSeats availableSeats features')
      .populate('route', 'routeName from to')
      .populate('driver', 'name phone')
      .populate('helper', 'name phone');

    if (!tripData) {
      return sendNotFound(res, 'Trip not found');
    }

    // Check if trip is available for booking
    if (tripData.status !== 'scheduled') {
      return sendBadRequest(res, 'Trip is not available for booking');
    }

    // Check if journey date is in the future
    if (tripData.departureDate < new Date()) {
      return sendBadRequest(res, 'Cannot book past trips');
    }

    // Validate seat data
    if (!seats || !Array.isArray(seats) || seats.length === 0) {
      return sendBadRequest(res, 'At least one seat is required');
    }

    // Check seat availability
    if (seats.length > tripData.availableSeats) {
      return sendBadRequest(res, 'Not enough seats available');
    }

    // Validate seat numbers are within bus capacity
    const maxSeatNumber = (tripData.bus as any).totalSeats;
    const invalidSeats = seats.filter(seat => 
      !seat.seatNumber || seat.seatNumber < 1 || seat.seatNumber > maxSeatNumber
    );
    
    if (invalidSeats.length > 0) {
      return sendBadRequest(res, 'Invalid seat numbers provided');
    }

    // Check if seats are already booked
    const existingBookings = await Booking.find({
      trip,
      bookingStatus: { $in: [BOOKING_STATUS.PENDING, BOOKING_STATUS.CONFIRMED] },
    });

    const bookedSeats = new Set();
    existingBookings.forEach(booking => {
      booking.seats.forEach(seat => {
        bookedSeats.add(seat.seatNumber);
      });
    });

    const requestedSeats = seats.map((seat: any) => seat.seatNumber);
    const conflictingSeats = requestedSeats.filter((seatNumber: any) => bookedSeats.has(seatNumber));

    if (conflictingSeats.length > 0) {
      return sendBadRequest(res, `Seats ${conflictingSeats.join(', ')} are already booked`);
    }

    // Check for duplicate seat numbers in the request
    const uniqueSeats = new Set(requestedSeats);
    if (uniqueSeats.size !== requestedSeats.length) {
      return sendBadRequest(res, 'Duplicate seat numbers in booking request');
    }

    // Calculate total amount with dynamic pricing
    const baseAmount = seats.length * tripData.fare;
    const serviceFee = 50; // Fixed service fee
    const taxes = Math.round(baseAmount * 0.12); // 12% GST
    const totalAmount = baseAmount + serviceFee + taxes;

    // Generate booking reference
    const bookingReference = generateBookingReference();

    // Create booking with enhanced data
    const booking = await Booking.create({
      bookingReference,
      user: userId,
      trip: tripData._id,
      bus: tripData.bus._id,
      route: tripData.route._id,
      journeyDate: tripData.departureDate,
      seats: seats.map(seat => ({
        seatNumber: seat.seatNumber,
        passengerName: seat.passengerName,
        passengerAge: seat.passengerAge,
        passengerGender: seat.passengerGender,
        passengerPhone: seat.passengerPhone,
        passengerEmail: seat.passengerEmail || '',
      })),
      totalAmount,
      baseAmount,
      serviceFee,
      taxes,
      boardingPoint,
      droppingPoint,
      paymentMethod: paymentMethod || 'UPI',
      bookingStatus: BOOKING_STATUS.PENDING,
      paymentStatus: PAYMENT_STATUS.PENDING,
      bookingManager: authenticatedReq.user?.role === 'booking_man' ? userId : null,
    });

    // Update trip available seats and total bookings
    await Trip.findByIdAndUpdate(trip, {
      $inc: { 
        availableSeats: -seats.length,
        totalBookings: seats.length,
      },
    });

    // Update bus available seats
    await Bus.findByIdAndUpdate(tripData.bus._id, {
      $inc: { availableSeats: -seats.length }
    });

    // Populate booking with related data
    await booking.populate([
      { path: 'user', select: 'name email phone' },
      { path: 'bus', select: 'busNumber busName type features' },
      { path: 'route', select: 'routeName from to' },
      { path: 'trip', select: 'tripNumber departureTime arrivalTime' },
    ]);

    logError(`Booking created: ${bookingReference}`, null);
    return sendCreated(res, { booking }, 'Booking created successfully');
  } catch (error) {
    logError('Error creating booking:', error);
    return sendError(res, 'Failed to create booking');
  }
});

// Enhanced Get all bookings with better filtering and pagination
export const getAllBookings = asyncHandler(async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      paymentStatus,
      userId,
      busId,
      routeId,
      tripId,
      bookingManager,
      search,
      dateFrom,
      dateTo,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const authenticatedReq = req as AuthenticatedRequest;
    const currentUser = authenticatedReq.user;

    // Build filter
    const filter: any = {};
    
    // Role-based filtering
    if (currentUser?.role === 'booking_man') {
      filter.bookingManager = currentUser.id;
    } else if (currentUser?.role === 'customer') {
      filter.user = currentUser.id;
    } else if (currentUser?.role === 'bus_owner' || currentUser?.role === 'bus_admin') {
      // Filter by buses owned by the user
      const userBuses = await Bus.find({ operator: currentUser.id }).select('_id');
      const busIds = userBuses.map(bus => bus._id);
      filter.bus = { $in: busIds };
    }

    // Additional filters
    if (status) filter.bookingStatus = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (userId) filter.user = userId;
    if (busId) filter.bus = busId;
    if (routeId) filter.route = routeId;
    if (tripId) filter.trip = tripId;
    if (bookingManager) filter.bookingManager = bookingManager;

    // Date range filtering
    if (dateFrom || dateTo) {
      filter.journeyDate = {};
      if (dateFrom) filter.journeyDate.$gte = new Date(dateFrom as string);
      if (dateTo) filter.journeyDate.$lte = new Date(dateTo as string);
    }

    // Search functionality
    if (search) {
      filter.$or = [
        { bookingReference: { $regex: search, $options: 'i' } },
        { 'user.name': { $regex: search, $options: 'i' } },
        { 'route.routeName': { $regex: search, $options: 'i' } },
        { 'bus.busNumber': { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const sortOptions: any = {};
    sortOptions[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

    const bookings = await Booking.find(filter)
      .populate([
        { path: 'user', select: 'name email phone' },
        { path: 'bus', select: 'busNumber busName type features' },
        { path: 'route', select: 'routeName from to' },
        { path: 'trip', select: 'tripNumber departureTime arrivalTime' },
        { path: 'bookingManager', select: 'name email' },
      ])
      .sort(sortOptions)
      .limit(Number(limit))
      .skip(skip);

    const total = await Booking.countDocuments(filter);

    return sendSuccess(res, {
      bookings,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    }, 'Bookings retrieved successfully');
  } catch (error) {
    logError('Error fetching bookings:', error);
    return sendError(res, 'Failed to fetch bookings');
  }
});

// Enhanced Get booking by ID with detailed information
export const getBookingById = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const authenticatedReq = req as AuthenticatedRequest;
    const currentUser = authenticatedReq.user;

    const booking = await Booking.findById(id)
      .populate([
        { path: 'user', select: 'name email phone' },
        { path: 'bus', select: 'busNumber busName type features amenities' },
        { path: 'route', select: 'routeName from to distance' },
        { path: 'trip', select: 'tripNumber departureTime arrivalTime pickupPoints dropPoints' },
        { path: 'bookingManager', select: 'name email phone' },
      ]);

    if (!booking) {
      return sendNotFound(res, 'Booking not found');
    }

    // Check access permissions
    if (currentUser?.role === 'customer' && booking.user._id.toString() !== currentUser.id) {
      return sendError(res, 'Access denied', 403);
    }

    if (currentUser?.role === 'booking_man' && booking.bookingManager?._id.toString() !== currentUser.id) {
      return sendError(res, 'Access denied', 403);
    }

    return sendSuccess(res, { booking }, 'Booking retrieved successfully');
  } catch (error) {
    logError('Error fetching booking:', error);
    return sendError(res, 'Failed to fetch booking');
  }
});

// Enhanced Get booking by reference
export const getBookingByReference = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { reference } = req.params;

    const booking = await Booking.findOne({ bookingReference: reference.toUpperCase() })
      .populate([
        { path: 'user', select: 'name email phone' },
        { path: 'bus', select: 'busNumber busName type features' },
        { path: 'route', select: 'routeName from to' },
        { path: 'trip', select: 'tripNumber departureTime arrivalTime' },
        { path: 'bookingManager', select: 'name email' },
      ]);

    if (!booking) {
      return sendNotFound(res, 'Booking not found');
    }

    return sendSuccess(res, { booking }, 'Booking retrieved successfully');
  } catch (error) {
    logError('Error fetching booking by reference:', error);
    return sendError(res, 'Failed to fetch booking');
  }
});

// Enhanced Update booking status with better validation
export const updateBookingStatus = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, reason, updatedBy } = req.body;
    const authenticatedReq = req as AuthenticatedRequest;
    const currentUser = authenticatedReq.user;

    const booking = await Booking.findById(id)
      .populate('trip', 'status departureDate')
      .populate('bus', 'availableSeats totalSeats');

    if (!booking) {
      return sendNotFound(res, 'Booking not found');
    }

    // Check access permissions
    if (currentUser?.role === 'customer' && booking.user.toString() !== currentUser.id) {
      return sendError(res, 'Access denied', 403);
    }

    if (currentUser?.role === 'booking_man' && booking.bookingManager?.toString() !== currentUser.id) {
      return sendError(res, 'Access denied', 403);
    }

    // Validate status transition
    const validTransitions: Record<string, string[]> = {
      [BOOKING_STATUS.PENDING]: [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.CANCELLED],
      [BOOKING_STATUS.CONFIRMED]: [BOOKING_STATUS.COMPLETED, BOOKING_STATUS.CANCELLED],
      [BOOKING_STATUS.CANCELLED]: [],
      [BOOKING_STATUS.COMPLETED]: [],
    };

    if (!validTransitions[booking.bookingStatus]?.includes(status)) {
      return sendBadRequest(res, `Invalid status transition from ${booking.bookingStatus} to ${status}`);
    }

    // Handle status-specific logic
    if (status === BOOKING_STATUS.CANCELLED) {
      // Refund logic
      const refundAmount = booking.totalAmount * 0.8; // 80% refund
      booking.refundAmount = refundAmount;
      booking.cancellationReason = reason;
      booking.cancelledAt = new Date();
      booking.cancelledBy = updatedBy || currentUser?.id;

      // Release seats
      await Trip.findByIdAndUpdate(booking.trip, {
        $inc: { 
          availableSeats: booking.seats.length,
          totalBookings: -booking.seats.length,
        },
      });

      await Bus.findByIdAndUpdate(booking.bus, {
        $inc: { availableSeats: booking.seats.length }
      });
    } else if (status === BOOKING_STATUS.CONFIRMED) {
      booking.confirmedAt = new Date();
      booking.confirmedBy = updatedBy || currentUser?.id;
    } else if (status === BOOKING_STATUS.COMPLETED) {
      booking.completedAt = new Date();
      booking.completedBy = updatedBy || currentUser?.id;
    }

    booking.bookingStatus = status;
    booking.updatedBy = updatedBy || currentUser?.id;

    await booking.save();

    // Populate updated booking
    await booking.populate([
      { path: 'user', select: 'name email phone' },
      { path: 'bus', select: 'busNumber busName type' },
      { path: 'route', select: 'routeName from to' },
      { path: 'trip', select: 'tripNumber departureTime arrivalTime' },
    ]);

    return sendSuccess(res, { booking }, 'Booking status updated successfully');
  } catch (error) {
    logError('Error updating booking status:', error);
    return sendError(res, 'Failed to update booking status');
  }
});

// Enhanced Cancel booking with better refund handling
export const cancelBooking = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason, cancelledBy } = req.body;
    const authenticatedReq = req as AuthenticatedRequest;
    const currentUser = authenticatedReq.user;

    const booking = await Booking.findById(id)
      .populate('trip', 'departureDate')
      .populate('bus', 'availableSeats');

    if (!booking) {
      return sendNotFound(res, 'Booking not found');
    }

    // Check access permissions
    if (currentUser?.role === 'customer' && booking.user.toString() !== currentUser.id) {
      return sendError(res, 'Access denied', 403);
    }

    if (currentUser?.role === 'booking_man' && booking.bookingManager?.toString() !== currentUser.id) {
      return sendError(res, 'Access denied', 403);
    }

    if (booking.bookingStatus === BOOKING_STATUS.CANCELLED) {
      return sendBadRequest(res, 'Booking is already cancelled');
    }

    if (booking.bookingStatus === BOOKING_STATUS.COMPLETED) {
      return sendBadRequest(res, 'Cannot cancel completed booking');
    }

    // Check cancellation policy
    const hoursUntilDeparture = (new Date((booking.trip as any).departureDate).getTime() - new Date().getTime()) / (1000 * 60 * 60);
    
    let refundPercentage = 0;
    if (hoursUntilDeparture > 24) {
      refundPercentage = 0.9; // 90% refund
    } else if (hoursUntilDeparture > 12) {
      refundPercentage = 0.7; // 70% refund
    } else if (hoursUntilDeparture > 6) {
      refundPercentage = 0.5; // 50% refund
    } else {
      refundPercentage = 0.2; // 20% refund
    }

    const refundAmount = booking.totalAmount * refundPercentage;

    // Update booking
    booking.bookingStatus = BOOKING_STATUS.CANCELLED;
    booking.cancellationReason = reason;
    booking.cancelledAt = new Date();
    booking.cancelledBy = cancelledBy || currentUser?.id;
    booking.refundAmount = refundAmount;
    booking.refundPercentage = refundPercentage;

    await booking.save();

    // Release seats
    await Trip.findByIdAndUpdate(booking.trip, {
      $inc: { 
        availableSeats: booking.seats.length,
        totalBookings: -booking.seats.length,
      },
    });

    await Bus.findByIdAndUpdate(booking.bus, {
      $inc: { availableSeats: booking.seats.length }
    });

    // Populate updated booking
    await booking.populate([
      { path: 'user', select: 'name email phone' },
      { path: 'bus', select: 'busNumber busName type' },
      { path: 'route', select: 'routeName from to' },
      { path: 'trip', select: 'tripNumber departureTime arrivalTime' },
    ]);

    return sendSuccess(res, { 
      booking,
      refundAmount,
      refundPercentage: refundPercentage * 100,
      hoursUntilDeparture: Math.round(hoursUntilDeparture)
    }, 'Booking cancelled successfully');
  } catch (error) {
    logError('Error cancelling booking:', error);
    return sendError(res, 'Failed to cancel booking');
  }
});

// Enhanced Get booking statistics with more detailed metrics
export const getBookingStatistics = asyncHandler(async (req: Request, res: Response) => {
  try {
    const {
      period = 'monthly',
      startDate,
      endDate,
      bookingManager,
      busId,
      routeId
    } = req.query;

    const authenticatedReq = req as AuthenticatedRequest;
    const currentUser = authenticatedReq.user;

    // Build base filter
    const baseFilter: any = {};
    
    if (currentUser?.role === 'booking_man') {
      baseFilter.bookingManager = currentUser.id;
    } else if (currentUser?.role === 'bus_owner' || currentUser?.role === 'bus_admin') {
      const userBuses = await Bus.find({ operator: currentUser.id }).select('_id');
      const busIds = userBuses.map(bus => bus._id);
      baseFilter.bus = { $in: busIds };
    }

    if (bookingManager) baseFilter.bookingManager = bookingManager;
    if (busId) baseFilter.bus = busId;
    if (routeId) baseFilter.route = routeId;

    // Date filtering
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          $gte: new Date(startDate as string),
          $lte: new Date(endDate as string)
        }
      };
    } else {
      const now = new Date();
      switch (period) {
        case 'daily':
          dateFilter = {
            createdAt: {
              $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
              $lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
            }
          };
          break;
        case 'weekly':
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - now.getDay());
          weekStart.setHours(0, 0, 0, 0);
          dateFilter = {
            createdAt: {
              $gte: weekStart,
              $lt: new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000)
            }
          };
          break;
        case 'monthly':
          dateFilter = {
            createdAt: {
              $gte: new Date(now.getFullYear(), now.getMonth(), 1),
              $lt: new Date(now.getFullYear(), now.getMonth() + 1, 1)
            }
          };
          break;
        case 'yearly':
          dateFilter = {
            createdAt: {
              $gte: new Date(now.getFullYear(), 0, 1),
              $lt: new Date(now.getFullYear() + 1, 0, 1)
            }
          };
          break;
      }
    }

    const filter = { ...baseFilter, ...dateFilter };

    // Get comprehensive statistics
    const [
      totalBookings,
      pendingBookings,
      confirmedBookings,
      cancelledBookings,
      completedBookings,
      totalRevenue,
      totalRefunds,
      averageBookingValue,
      topRoutes,
      bookingTrends
    ] = await Promise.all([
      Booking.countDocuments(filter),
      Booking.countDocuments({ ...filter, bookingStatus: BOOKING_STATUS.PENDING }),
      Booking.countDocuments({ ...filter, bookingStatus: BOOKING_STATUS.CONFIRMED }),
      Booking.countDocuments({ ...filter, bookingStatus: BOOKING_STATUS.CANCELLED }),
      Booking.countDocuments({ ...filter, bookingStatus: BOOKING_STATUS.COMPLETED }),
      Booking.aggregate([
        { $match: { ...filter, bookingStatus: BOOKING_STATUS.CONFIRMED } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      Booking.aggregate([
        { $match: { ...filter, bookingStatus: BOOKING_STATUS.CANCELLED } },
        { $group: { _id: null, total: { $sum: '$refundAmount' } } }
      ]),
      Booking.aggregate([
        { $match: { ...filter, bookingStatus: BOOKING_STATUS.CONFIRMED } },
        { $group: { _id: null, average: { $avg: '$totalAmount' } } }
      ]),
      Booking.aggregate([
        { $match: { ...filter, bookingStatus: BOOKING_STATUS.CONFIRMED } },
        { $group: { _id: '$route', count: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } },
        { $lookup: { from: 'routes', localField: '_id', foreignField: '_id', as: 'route' } },
        { $unwind: '$route' },
        { $project: { routeName: '$route.routeName', count: 1, revenue: 1 } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]),
      Booking.aggregate([
        { $match: filter },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' }
            },
            count: { $sum: 1 },
            revenue: { $sum: '$totalAmount' }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
        { $limit: 30 }
      ])
    ]);

    const statistics = {
      overview: {
        totalBookings,
        pendingBookings,
        confirmedBookings,
        cancelledBookings,
        completedBookings,
        totalRevenue: totalRevenue[0]?.total || 0,
        totalRefunds: totalRefunds[0]?.total || 0,
        averageBookingValue: averageBookingValue[0]?.average || 0,
        successRate: totalBookings > 0 ? ((confirmedBookings + completedBookings) / totalBookings * 100).toFixed(2) : 0,
        cancellationRate: totalBookings > 0 ? (cancelledBookings / totalBookings * 100).toFixed(2) : 0,
      },
      topRoutes,
      bookingTrends,
      period,
      dateRange: {
        startDate: startDate || 'auto',
        endDate: endDate || 'auto'
      }
    };

    return sendSuccess(res, statistics, 'Booking statistics retrieved successfully');
  } catch (error) {
    logError('Error fetching booking statistics:', error);
    return sendError(res, 'Failed to fetch booking statistics');
  }
});

// New endpoint: Get available seats for a trip
export const getAvailableSeats = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { tripId } = req.params;

    const trip = await Trip.findById(tripId)
      .populate('bus', 'totalSeats availableSeats type');

    if (!trip) {
      return sendNotFound(res, 'Trip not found');
    }

    // Get booked seats
    const bookings = await Booking.find({
      trip: tripId,
      bookingStatus: { $in: [BOOKING_STATUS.PENDING, BOOKING_STATUS.CONFIRMED] }
    });

    const bookedSeats = new Set();
    bookings.forEach(booking => {
      booking.seats.forEach(seat => {
        bookedSeats.add(seat.seatNumber);
      });
    });

    // Generate available seats
    const availableSeats = [];
    for (let i = 1; i <= (trip.bus as any).totalSeats; i++) {
      if (!bookedSeats.has(i)) {
        availableSeats.push(i);
      }
    }

    return sendSuccess(res, {
      tripId,
      totalSeats: (trip.bus as any).totalSeats,
      availableSeats,
      bookedSeats: Array.from(bookedSeats),
      busType: (trip.bus as any).type,
      occupancyPercentage: Math.round((bookedSeats.size / (trip.bus as any).totalSeats) * 100)
    }, 'Available seats retrieved successfully');
  } catch (error) {
    logError('Error fetching available seats:', error);
    return sendError(res, 'Failed to fetch available seats');
  }
});

// New endpoint: Get booking analytics for dashboard
export const getBookingAnalytics = asyncHandler(async (req: Request, res: Response) => {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const currentUser = authenticatedReq.user;

    const baseFilter: any = {};
    if (currentUser?.role === 'booking_man') {
      baseFilter.bookingManager = currentUser.id;
    }

    // Get analytics for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      dailyBookings,
      revenueByDay,
      statusDistribution,
      topCustomers,
      recentBookings
    ] = await Promise.all([
      Booking.aggregate([
        { $match: { ...baseFilter, createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
      ]),
      Booking.aggregate([
        { $match: { ...baseFilter, bookingStatus: BOOKING_STATUS.CONFIRMED, createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' }
            },
            revenue: { $sum: '$totalAmount' }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
      ]),
      Booking.aggregate([
        { $match: { ...baseFilter, createdAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: '$bookingStatus', count: { $sum: 1 } } }
      ]),
      Booking.aggregate([
        { $match: { ...baseFilter, bookingStatus: BOOKING_STATUS.CONFIRMED } },
        { $group: { _id: '$user', totalBookings: { $sum: 1 }, totalSpent: { $sum: '$totalAmount' } } },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
        { $unwind: '$user' },
        { $project: { name: '$user.name', email: '$user.email', totalBookings: 1, totalSpent: 1 } },
        { $sort: { totalSpent: -1 } },
        { $limit: 10 }
      ]),
      Booking.find({ ...baseFilter })
        .populate('user', 'name email')
        .populate('route', 'routeName')
        .populate('bus', 'busNumber')
        .sort({ createdAt: -1 })
        .limit(10)
        .select('bookingReference bookingStatus totalAmount createdAt user route bus')
    ]);

    const analytics = {
      dailyBookings,
      revenueByDay,
      statusDistribution,
      topCustomers,
      recentBookings,
      period: 'last_30_days'
    };

    return sendSuccess(res, analytics, 'Booking analytics retrieved successfully');
  } catch (error) {
    logError('Error fetching booking analytics:', error);
    return sendError(res, 'Failed to fetch booking analytics');
  }
});
