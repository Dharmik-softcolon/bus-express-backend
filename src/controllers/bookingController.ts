import { Request, Response } from 'express';
import { Booking, IBooking } from '../models/Booking.js';
import { Bus } from '../models/Bus.js';
import { Route } from '../models/Route.js';
import { sendSuccess, sendError, sendBadRequest, sendNotFound, sendCreated, asyncHandler } from '../utils/responseHandler.js';
import { API_MESSAGES, BOOKING_STATUS, PAYMENT_STATUS } from '../constants/index';
import { generateBookingReference } from '../utils/auth.js';

// Create booking
export const createBooking = asyncHandler(async (req: Request, res: Response) => {
  const {
    bus,
    route,
    journeyDate,
    seats,
    boardingPoint,
    droppingPoint,
    paymentMethod,
  } = req.body;

  const userId = req.user?.id;

  // Validate bus exists
  const busData = await Bus.findById(bus);
  if (!busData) {
    return sendNotFound(res, 'Bus not found');
  }

  // Validate route exists
  const routeData = await Route.findById(route);
  if (!routeData) {
    return sendNotFound(res, 'Route not found');
  }

  // Check if journey date is in the future
  const journeyDateTime = new Date(journeyDate);
  if (journeyDateTime < new Date()) {
    return sendBadRequest(res, 'Journey date cannot be in the past');
  }

  // Check seat availability
  if (seats.length > busData.availableSeats) {
    return sendBadRequest(res, 'Not enough seats available');
  }

  // Check if seats are already booked
  const existingBookings = await Booking.find({
    bus,
    journeyDate: journeyDateTime,
    bookingStatus: { $in: ['pending', 'confirmed'] },
  });

  const bookedSeats = existingBookings.flatMap(booking => 
    booking.seats.map(seat => seat.seatNumber)
  );

  const requestedSeats = seats.map((seat: any) => seat.seatNumber);
  const conflictingSeats = requestedSeats.filter((seat: number) => bookedSeats.includes(seat));

  if (conflictingSeats.length > 0) {
    return sendBadRequest(res, `Seats ${conflictingSeats.join(', ')} are already booked`);
  }

  // Calculate total amount (you might want to add pricing logic)
  const seatPrice = 500; // Default price per seat
  const totalAmount = seats.length * seatPrice;

  // Generate booking reference
  const bookingReference = generateBookingReference();

  const booking = await Booking.create({
    bookingReference,
    user: userId,
    bus,
    route,
    journeyDate: journeyDateTime,
    seats,
    totalAmount,
    boardingPoint,
    droppingPoint,
    paymentMethod,
    paymentStatus: PAYMENT_STATUS.PENDING,
    bookingStatus: BOOKING_STATUS.PENDING,
  });

  // Update bus available seats
  busData.availableSeats -= seats.length;
  await busData.save();

  await booking.populate([
    { path: 'user', select: 'name email phone' },
    { path: 'bus', select: 'busNumber busName type' },
    { path: 'route', select: 'routeName from to' },
  ]);

  return sendCreated(res, { booking }, API_MESSAGES.BOOKING_CREATED);
});

// Get all bookings
export const getAllBookings = asyncHandler(async (req: Request, res: Response) => {
  const page = req.pagination?.page || 1;
  const limit = req.pagination?.limit || 10;
  const skip = req.pagination?.skip || 0;

  const { status, paymentStatus, userId, busId, routeId } = req.query;

  // Build filter
  const filter: any = {};
  if (status) filter.bookingStatus = status;
  if (paymentStatus) filter.paymentStatus = paymentStatus;
  if (userId) filter.user = userId;
  if (busId) filter.bus = busId;
  if (routeId) filter.route = routeId;

  // If user is not admin, only show their bookings
  if (req.user?.role !== 'admin') {
    filter.user = req.user?.id;
  }

  const bookings = await Booking.find(filter)
    .populate([
      { path: 'user', select: 'name email phone' },
      { path: 'bus', select: 'busNumber busName type' },
      { path: 'route', select: 'routeName from to' },
    ])
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Booking.countDocuments(filter);

  return sendSuccess(res, {
    bookings,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

// Get booking by ID
export const getBookingById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const booking = await Booking.findById(id).populate([
    { path: 'user', select: 'name email phone' },
    { path: 'bus', select: 'busNumber busName type' },
    { path: 'route', select: 'routeName from to' },
  ]);

  if (!booking) {
    return sendNotFound(res, 'Booking not found');
  }

  // Check if user can access this booking
  if (req.user?.role !== 'admin' && booking.user._id.toString() !== req.user?.id) {
    return sendBadRequest(res, 'You can only view your own bookings');
  }

  return sendSuccess(res, { booking });
});

// Get booking by reference
export const getBookingByReference = asyncHandler(async (req: Request, res: Response) => {
  const { reference } = req.params;

  const booking = await Booking.findOne({ bookingReference: reference }).populate([
    { path: 'user', select: 'name email phone' },
    { path: 'bus', select: 'busNumber busName type' },
    { path: 'route', select: 'routeName from to' },
  ]);

  if (!booking) {
    return sendNotFound(res, 'Booking not found');
  }

  // Check if user can access this booking
  if (req.user?.role !== 'admin' && booking.user._id.toString() !== req.user?.id) {
    return sendBadRequest(res, 'You can only view your own bookings');
  }

  return sendSuccess(res, { booking });
});

// Update booking status (Admin/Operator only)
export const updateBookingStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { bookingStatus, paymentStatus } = req.body;

  const booking = await Booking.findById(id);

  if (!booking) {
    return sendNotFound(res, 'Booking not found');
  }

  // Check if user can update this booking
  if (req.user?.role !== 'admin') {
    const bus = await Bus.findById(booking.bus);
    if (!bus || bus.operator.toString() !== req.user?.id) {
      return sendBadRequest(res, 'You can only update bookings for your buses');
    }
  }

  const updatedBooking = await Booking.findByIdAndUpdate(
    id,
    { bookingStatus, paymentStatus },
    { new: true, runValidators: true }
  ).populate([
    { path: 'user', select: 'name email phone' },
    { path: 'bus', select: 'busNumber busName type' },
    { path: 'route', select: 'routeName from to' },
  ]);

  return sendSuccess(res, { booking: updatedBooking }, 'Booking status updated successfully');
});

// Cancel booking
export const cancelBooking = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { cancellationReason } = req.body;

  const booking = await Booking.findById(id);

  if (!booking) {
    return sendNotFound(res, 'Booking not found');
  }

  // Check if user can cancel this booking
  if (req.user?.role !== 'admin' && booking.user.toString() !== req.user?.id) {
    return sendBadRequest(res, 'You can only cancel your own bookings');
  }

  // Check if booking can be cancelled
  if (booking.bookingStatus === BOOKING_STATUS.CANCELLED) {
    return sendBadRequest(res, 'Booking is already cancelled');
  }

  if (booking.bookingStatus === BOOKING_STATUS.COMPLETED) {
    return sendBadRequest(res, 'Cannot cancel completed booking');
  }

  // Calculate refund amount (you might want to add cancellation policy)
  const journeyDate = new Date(booking.journeyDate);
  const now = new Date();
  const hoursUntilJourney = (journeyDate.getTime() - now.getTime()) / (1000 * 60 * 60);

  let refundAmount = 0;
  if (hoursUntilJourney > 24) {
    refundAmount = booking.totalAmount; // Full refund
  } else if (hoursUntilJourney > 2) {
    refundAmount = booking.totalAmount * 0.5; // 50% refund
  }

  // Update booking
  booking.bookingStatus = BOOKING_STATUS.CANCELLED;
  booking.paymentStatus = PAYMENT_STATUS.REFUNDED;
  booking.cancellationReason = cancellationReason;
  booking.cancelledAt = new Date();
  booking.refundAmount = refundAmount;

  await booking.save();

  // Update bus available seats
  const bus = await Bus.findById(booking.bus);
  if (bus) {
    bus.availableSeats += booking.seats.length;
    await bus.save();
  }

  await booking.populate([
    { path: 'user', select: 'name email phone' },
    { path: 'bus', select: 'busNumber busName type' },
    { path: 'route', select: 'routeName from to' },
  ]);

  return sendSuccess(res, { booking }, API_MESSAGES.BOOKING_CANCELLED);
});

// Get booking statistics (Admin only)
export const getBookingStatistics = asyncHandler(async (req: Request, res: Response) => {
  const { period = '30' } = req.query; // days
  const days = parseInt(period as string);

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const totalBookings = await Booking.countDocuments({
    createdAt: { $gte: startDate },
  });

  const confirmedBookings = await Booking.countDocuments({
    createdAt: { $gte: startDate },
    bookingStatus: BOOKING_STATUS.CONFIRMED,
  });

  const cancelledBookings = await Booking.countDocuments({
    createdAt: { $gte: startDate },
    bookingStatus: BOOKING_STATUS.CANCELLED,
  });

  const totalRevenue = await Booking.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate },
        bookingStatus: BOOKING_STATUS.CONFIRMED,
        paymentStatus: PAYMENT_STATUS.COMPLETED,
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$totalAmount' },
      },
    },
  ]);

  return sendSuccess(res, {
    period: `${days} days`,
    statistics: {
      totalBookings,
      confirmedBookings,
      cancelledBookings,
      totalRevenue: totalRevenue[0]?.total || 0,
      cancellationRate: totalBookings > 0 ? (cancelledBookings / totalBookings * 100).toFixed(2) : 0,
    },
  });
});
