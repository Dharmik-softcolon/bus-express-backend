import { Request, Response } from 'express';
import { Booking, IBooking } from '../models/Booking';
import { Bus } from '../models/Bus';
import { Route } from '../models/Route';
import { Trip } from '../models/Trip';
import { sendResponse } from '../utils/responseHandler';
import { HTTP_STATUS, API_MESSAGES, BOOKING_STATUS, PAYMENT_STATUS } from '../constants';
import { generateBookingReference } from '../utils/auth';
import { AuthenticatedRequest } from '../types';
import { logger } from '../utils/logger';

// Create booking
export const createBooking = async (req: Request, res: Response) => {
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
      return sendResponse(res, HTTP_STATUS.UNAUTHORIZED, false, 'User not authenticated');
    }

    // Validate trip exists
    const tripData = await Trip.findById(trip)
      .populate('bus', 'busNumber busName type totalSeats')
      .populate('route', 'routeName from to');

    if (!tripData) {
      return sendResponse(res, HTTP_STATUS.NOT_FOUND, false, 'Trip not found');
    }

    // Check if trip is available for booking
    if (tripData.status !== 'scheduled') {
      return sendResponse(res, HTTP_STATUS.BAD_REQUEST, false, 'Trip is not available for booking');
  }

  // Check if journey date is in the future
    if (tripData.departureDate < new Date()) {
      return sendResponse(res, HTTP_STATUS.BAD_REQUEST, false, 'Cannot book past trips');
  }

  // Check seat availability
    if (seats.length > tripData.availableSeats) {
      return sendResponse(res, HTTP_STATUS.BAD_REQUEST, false, 'Not enough seats available');
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
      return sendResponse(res, HTTP_STATUS.BAD_REQUEST, false, `Seats ${conflictingSeats.join(', ')} are already booked`);
  }

    // Calculate total amount
    const totalAmount = seats.length * tripData.fare;

  // Generate booking reference
  const bookingReference = generateBookingReference();

    // Create booking
    const booking = new Booking({
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
    });

    await booking.save();

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

    logger.info(`Booking created: ${bookingReference}`);
    return sendResponse(res, HTTP_STATUS.CREATED, true, 'Booking created successfully', booking);
  } catch (error) {
    logger.error('Error creating booking:', error);
    return sendResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, false, API_MESSAGES.INTERNAL_ERROR);
  }
};

// Get all bookings
export const getAllBookings = async (req: Request, res: Response) => {
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

  const bookings = await Booking.find(filter)
    .populate([
      { path: 'user', select: 'name email phone' },
      { path: 'bus', select: 'busNumber busName type' },
      { path: 'route', select: 'routeName from to' },
        { path: 'trip', select: 'tripNumber departureTime arrivalTime' },
    ])
    .sort({ createdAt: -1 })
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit));

  const total = await Booking.countDocuments(filter);

    return sendResponse(res, HTTP_STATUS.OK, true, API_MESSAGES.SUCCESS, {
    bookings,
    pagination: {
        current: Number(page),
        pages: Math.ceil(total / Number(limit)),
      total,
    },
  });
  } catch (error) {
    logger.error('Error fetching bookings:', error);
    return sendResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, false, API_MESSAGES.INTERNAL_ERROR);
  }
};

// Get booking by ID
export const getBookingById = async (req: Request, res: Response) => {
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
      return sendResponse(res, HTTP_STATUS.NOT_FOUND, false, 'Booking not found');
  }

  // Check if user can access this booking
    if (currentUser?.role !== 'admin' && booking.user._id.toString() !== currentUser?.id) {
      return sendResponse(res, HTTP_STATUS.FORBIDDEN, false, 'Access denied');
    }

    return sendResponse(res, HTTP_STATUS.OK, true, API_MESSAGES.SUCCESS, booking);
  } catch (error) {
    logger.error('Error fetching booking:', error);
    return sendResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, false, API_MESSAGES.INTERNAL_ERROR);
  }
};

// Get booking by reference
export const getBookingByReference = async (req: Request, res: Response) => {
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
      return sendResponse(res, HTTP_STATUS.NOT_FOUND, false, 'Booking not found');
  }

  // Check if user can access this booking
    if (currentUser?.role !== 'admin' && booking.user._id.toString() !== currentUser?.id) {
      return sendResponse(res, HTTP_STATUS.FORBIDDEN, false, 'Access denied');
    }

    return sendResponse(res, HTTP_STATUS.OK, true, API_MESSAGES.SUCCESS, booking);
  } catch (error) {
    logger.error('Error fetching booking by reference:', error);
    return sendResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, false, API_MESSAGES.INTERNAL_ERROR);
  }
};

// Update booking status
export const updateBookingStatus = async (req: Request, res: Response) => {
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
      return sendResponse(res, HTTP_STATUS.NOT_FOUND, false, 'Booking not found');
    }

    logger.info(`Booking status updated: ${booking.bookingReference} - ${status}`);
    return sendResponse(res, HTTP_STATUS.OK, true, 'Booking status updated successfully', booking);
  } catch (error) {
    logger.error('Error updating booking status:', error);
    return sendResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, false, API_MESSAGES.INTERNAL_ERROR);
  }
};

// Cancel booking
export const cancelBooking = async (req: Request, res: Response) => {
  try {
  const { id } = req.params;
  const { cancellationReason } = req.body;
  const authenticatedReq = req as AuthenticatedRequest;
    const currentUser = authenticatedReq.user;

  const booking = await Booking.findById(id);

  if (!booking) {
      return sendResponse(res, HTTP_STATUS.NOT_FOUND, false, 'Booking not found');
  }

  // Check if user can cancel this booking
    if (currentUser?.role !== 'admin' && booking.user.toString() !== currentUser?.id) {
      return sendResponse(res, HTTP_STATUS.FORBIDDEN, false, 'Access denied');
  }

  // Check if booking can be cancelled
  if (booking.bookingStatus === BOOKING_STATUS.CANCELLED) {
      return sendResponse(res, HTTP_STATUS.BAD_REQUEST, false, 'Booking is already cancelled');
  }

  if (booking.bookingStatus === BOOKING_STATUS.COMPLETED) {
      return sendResponse(res, HTTP_STATUS.BAD_REQUEST, false, 'Cannot cancel completed booking');
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

    logger.info(`Booking cancelled: ${booking.bookingReference}`);
    return sendResponse(res, HTTP_STATUS.OK, true, 'Booking cancelled successfully', booking);
  } catch (error) {
    logger.error('Error cancelling booking:', error);
    return sendResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, false, API_MESSAGES.INTERNAL_ERROR);
  }
};

// Get booking statistics
export const getBookingStatistics = async (req: Request, res: Response) => {
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

    return sendResponse(res, HTTP_STATUS.OK, true, API_MESSAGES.SUCCESS, result);
  } catch (error) {
    logger.error('Error fetching booking statistics:', error);
    return sendResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, false, API_MESSAGES.INTERNAL_ERROR);
  }
};