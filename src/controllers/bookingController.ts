import { Request, Response } from 'express';
import { Booking, IBooking } from '../models/Booking';
import { Bus } from '../models/Bus';
import { Route } from '../models/Route';
import { Trip } from '../models/Trip';
import { sendSuccess, sendError, sendBadRequest, sendNotFound, sendCreated, asyncHandler } from '../utils/responseHandler';
import { HTTP_STATUS, API_MESSAGES, BOOKING_STATUS, PAYMENT_STATUS } from '../constants';
import { generateBookingReference } from '../utils/auth';
import { AuthenticatedRequest } from '../types';
import { logError } from '../utils/logger';

// Create booking
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

    // Validate trip exists
    const tripData = await Trip.findById(trip)
      .populate('bus', 'busNumber busName type totalSeats')
      .populate('route', 'routeName from to');

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

    // Check seat availability
    if (seats.length > tripData.availableSeats) {
      return sendBadRequest(res, 'Not enough seats available');
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

    // Calculate total amount
    const totalAmount = seats.length * tripData.fare;

    // Generate booking reference
    const bookingReference = generateBookingReference();

    // Create booking
    const booking = await Booking.create({
      bookingReference,
      user: userId,
      bus: tripData.bus._id,
      route: tripData.route._id,
      journeyDate: tripData.departureDate,
      seats,
      totalAmount,
      boardingPoint,
      droppingPoint,
      paymentMethod,
      bookingStatus: BOOKING_STATUS.PENDING,
      paymentStatus: PAYMENT_STATUS.PENDING,
    });

    // Update trip available seats and total bookings
    await Trip.findByIdAndUpdate(trip, {
      $inc: { 
        availableSeats: -seats.length,
        totalBookings: seats.length,
      },
    });

    // Populate booking with related data
    await booking.populate([
      { path: 'user', select: 'name email phone' },
      { path: 'bus', select: 'busNumber busName type' },
      { path: 'route', select: 'routeName from to' },
    ]);

    logError(`Booking created: ${bookingReference}`, null);
    return sendCreated(res, { booking }, 'Booking created successfully');
  } catch (error) {
    logError('Error creating booking:', error);
    return sendError(res, 'Failed to create booking');
  }
});

// Get all bookings
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
    } = req.query;

    const authenticatedReq = req as AuthenticatedRequest;
    const currentUser = authenticatedReq.user;

    // Build filter
    const filter: any = {};
    if (status) filter.bookingStatus = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (userId) filter.user = userId;
    if (busId) filter.bus = busId;
    if (routeId) filter.route = routeId;
    if (tripId) filter.trip = tripId;

    // If user is not admin, only show their bookings
    if (currentUser?.role !== 'admin') {
      filter.user = currentUser?.id;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const bookings = await Booking.find(filter)
      .populate([
        { path: 'user', select: 'name email phone' },
        { path: 'bus', select: 'busNumber busName type' },
        { path: 'route', select: 'routeName from to' },
        { path: 'trip', select: 'tripNumber departureTime arrivalTime' },
      ])
      .sort({ createdAt: -1 })
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

// Get booking by ID
export const getBookingById = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const authenticatedReq = req as AuthenticatedRequest;
    const currentUser = authenticatedReq.user;

    const booking = await Booking.findById(id)
      .populate([
        { path: 'user', select: 'name email phone' },
        { path: 'bus', select: 'busNumber busName type' },
        { path: 'route', select: 'routeName from to' },
        { path: 'trip', select: 'tripNumber departureTime arrivalTime' },
      ]);

    if (!booking) {
      return sendNotFound(res, 'Booking not found');
    }

    // Check if user can access this booking
    if (currentUser?.role !== 'admin' && booking.user._id.toString() !== currentUser?.id) {
      return sendBadRequest(res, 'Access denied');
    }

    return sendSuccess(res, { booking }, 'Booking retrieved successfully');
  } catch (error) {
    logError('Error fetching booking:', error);
    return sendError(res, 'Failed to fetch booking');
  }
});

// Get booking by reference
export const getBookingByReference = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { reference } = req.params;
    const authenticatedReq = req as AuthenticatedRequest;
    const currentUser = authenticatedReq.user;

    const booking = await Booking.findOne({ bookingReference: reference.toUpperCase() })
      .populate([
        { path: 'user', select: 'name email phone' },
        { path: 'bus', select: 'busNumber busName type' },
        { path: 'route', select: 'routeName from to' },
        { path: 'trip', select: 'tripNumber departureTime arrivalTime' },
      ]);

    if (!booking) {
      return sendNotFound(res, 'Booking not found');
    }

    // Check if user can access this booking
    if (currentUser?.role !== 'admin' && booking.user._id.toString() !== currentUser?.id) {
      return sendBadRequest(res, 'Access denied');
    }

    return sendSuccess(res, { booking }, 'Booking retrieved successfully');
  } catch (error) {
    logError('Error fetching booking by reference:', error);
    return sendError(res, 'Failed to fetch booking');
  }
});

// Update booking status
export const updateBookingStatus = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const booking = await Booking.findByIdAndUpdate(
      id,
      { bookingStatus: status },
      { new: true, runValidators: true }
    )
      .populate([
        { path: 'user', select: 'name email phone' },
        { path: 'bus', select: 'busNumber busName type' },
        { path: 'route', select: 'routeName from to' },
        { path: 'trip', select: 'tripNumber departureTime arrivalTime' },
      ]);

    if (!booking) {
      return sendNotFound(res, 'Booking not found');
    }

    logError(`Booking status updated: ${booking.bookingReference} - ${status}`, null);
    return sendSuccess(res, { booking }, 'Booking status updated successfully');
  } catch (error) {
    logError('Error updating booking status:', error);
    return sendError(res, 'Failed to update booking status');
  }
});

// Cancel booking
export const cancelBooking = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { cancellationReason } = req.body;
    const authenticatedReq = req as AuthenticatedRequest;
    const currentUser = authenticatedReq.user;

    const booking = await Booking.findById(id);

    if (!booking) {
      return sendNotFound(res, 'Booking not found');
    }

    // Check if user can cancel this booking
    if (currentUser?.role !== 'admin' && booking.user.toString() !== currentUser?.id) {
      return sendBadRequest(res, 'Access denied');
    }

    // Check if booking can be cancelled
    if (booking.bookingStatus === BOOKING_STATUS.CANCELLED) {
      return sendBadRequest(res, 'Booking is already cancelled');
    }

    if (booking.bookingStatus === BOOKING_STATUS.COMPLETED) {
      return sendBadRequest(res, 'Cannot cancel completed booking');
    }

    // Calculate refund amount (you can implement your refund policy here)
    const refundAmount = booking.totalAmount * 0.8; // 80% refund

    // Update booking
    booking.bookingStatus = BOOKING_STATUS.CANCELLED;
    booking.cancellationReason = cancellationReason;
    booking.cancelledAt = new Date();
    booking.refundAmount = refundAmount;
    booking.paymentStatus = PAYMENT_STATUS.REFUNDED;

    await booking.save();

    // Update trip available seats
    await Trip.findByIdAndUpdate(booking.trip, {
      $inc: { 
        availableSeats: booking.seats.length,
        totalBookings: -booking.seats.length,
      },
    });

    logError(`Booking cancelled: ${booking.bookingReference}`, null);
    return sendSuccess(res, { booking }, 'Booking cancelled successfully');
  } catch (error) {
    logError('Error cancelling booking:', error);
    return sendError(res, 'Failed to cancel booking');
  }
});

// Get booking statistics
export const getBookingStatistics = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { period = 'monthly', startDate, endDate } = req.query;

    let dateFilter: any = {};
    if (startDate && endDate) {
      dateFilter.journeyDate = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string),
      };
    } else {
      // Default to current month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      dateFilter.journeyDate = {
        $gte: startOfMonth,
        $lte: endOfMonth,
      };
    }

    const stats = await Booking.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          totalBookings: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
          totalPassengers: { $sum: { $size: '$seats' } },
          confirmedBookings: {
            $sum: { $cond: [{ $eq: ['$bookingStatus', 'confirmed'] }, 1, 0] },
          },
          pendingBookings: {
            $sum: { $cond: [{ $eq: ['$bookingStatus', 'pending'] }, 1, 0] },
          },
          cancelledBookings: {
            $sum: { $cond: [{ $eq: ['$bookingStatus', 'cancelled'] }, 1, 0] },
          },
          completedBookings: {
            $sum: { $cond: [{ $eq: ['$bookingStatus', 'completed'] }, 1, 0] },
          },
        },
      },
    ]);

    const result = stats[0] || {
      totalBookings: 0,
      totalRevenue: 0,
      totalPassengers: 0,
      confirmedBookings: 0,
      pendingBookings: 0,
      cancelledBookings: 0,
      completedBookings: 0,
    };

    return sendSuccess(res, result, 'Booking statistics retrieved successfully');
  } catch (error) {
    logError('Error fetching booking statistics:', error);
    return sendError(res, 'Failed to fetch booking statistics');
  }
});