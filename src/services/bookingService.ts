import { Booking, IBooking } from '../models/Booking';
import { Bus } from '../models/Bus';
import { Route } from '../models/Route';
import { BOOKING_STATUS, PAYMENT_STATUS } from '../constants';
import { generateBookingReference } from '../utils/auth';

export interface CreateBookingData {
  bus: string;
  route: string;
  journeyDate: Date;
  seats: Array<{
    seatNumber: number;
    passengerName: string;
    passengerAge: number;
    passengerGender: string;
    passengerPhone: string;
  }>;
  boardingPoint: string;
  droppingPoint: string;
  paymentMethod?: string;
}

export interface UpdateBookingData {
  bookingStatus?: string;
  paymentStatus?: string;
  cancellationReason?: string;
}

export interface BookingFilters {
  status?: string;
  paymentStatus?: string;
  userId?: string;
  busId?: string;
  routeId?: string;
}

export class BookingService {
  async createBooking(bookingData: CreateBookingData, userId: string): Promise<IBooking> {
    // Validate bus exists
    const busData = await Bus.findById(bookingData.bus);
    if (!busData) {
      throw new Error('Bus not found');
    }

    // Validate route exists
    const routeData = await Route.findById(bookingData.route);
    if (!routeData) {
      throw new Error('Route not found');
    }

    // Check if journey date is in the future
    if (bookingData.journeyDate < new Date()) {
      throw new Error('Journey date cannot be in the past');
    }

    // Check seat availability
    if (bookingData.seats.length > busData.availableSeats) {
      throw new Error('Not enough seats available');
    }

    // Check if seats are already booked
    const existingBookings = await Booking.find({
      bus: bookingData.bus,
      journeyDate: bookingData.journeyDate,
      bookingStatus: { $in: ['pending', 'confirmed'] },
    });

    const bookedSeats = existingBookings.flatMap(booking => 
      booking.seats.map(seat => seat.seatNumber)
    );

    const requestedSeats = bookingData.seats.map(seat => seat.seatNumber);
    const conflictingSeats = requestedSeats.filter(seat => bookedSeats.includes(seat));

    if (conflictingSeats.length > 0) {
      throw new Error(`Seats ${conflictingSeats.join(', ')} are already booked`);
    }

    // Calculate total amount (you might want to add pricing logic)
    const seatPrice = 500; // Default price per seat
    const totalAmount = bookingData.seats.length * seatPrice;

    // Generate booking reference
    const bookingReference = generateBookingReference();

    const booking = await Booking.create({
      bookingReference,
      user: userId,
      ...bookingData,
      totalAmount,
      paymentStatus: PAYMENT_STATUS.PENDING,
      bookingStatus: BOOKING_STATUS.PENDING,
    });

    // Update bus available seats
    await Bus.findByIdAndUpdate(bookingData.bus, {
      $inc: { availableSeats: -bookingData.seats.length }
    });

    await booking.populate([
      { path: 'user', select: 'name email phone' },
      { path: 'bus', select: 'busNumber busName type' },
      { path: 'route', select: 'routeName from to' },
    ]);

    return booking;
  }

  async getBookingById(bookingId: string, userId: string, userRole: string): Promise<IBooking | null> {
    const booking = await Booking.findById(bookingId).populate([
      { path: 'user', select: 'name email phone' },
      { path: 'bus', select: 'busNumber busName type' },
      { path: 'route', select: 'routeName from to' },
    ]);

    if (!booking) {
      throw new Error('Booking not found');
    }

    // Check if user can access this booking
    if (userRole !== 'admin' && booking.user._id.toString() !== userId) {
      throw new Error('You can only view your own bookings');
    }

    return booking;
  }

  async getBookingByReference(reference: string, userId: string, userRole: string): Promise<IBooking | null> {
    const booking = await Booking.findOne({ bookingReference: reference }).populate([
      { path: 'user', select: 'name email phone' },
      { path: 'bus', select: 'busNumber busName type' },
      { path: 'route', select: 'routeName from to' },
    ]);

    if (!booking) {
      throw new Error('Booking not found');
    }

    // Check if user can access this booking
    if (userRole !== 'admin' && booking.user._id.toString() !== userId) {
      throw new Error('You can only view your own bookings');
    }

    return booking;
  }

  async getBookings(filters: BookingFilters, pagination: { page: number; limit: number; skip: number }, userId: string, userRole: string): Promise<{
    bookings: IBooking[];
    total: number;
  }> {
    // Build filter
    const filter: any = {};
    if (filters.status) filter.bookingStatus = filters.status;
    if (filters.paymentStatus) filter.paymentStatus = filters.paymentStatus;
    if (filters.userId) filter.user = filters.userId;
    if (filters.busId) filter.bus = filters.busId;
    if (filters.routeId) filter.route = filters.routeId;

    // If user is not admin, only show their bookings
    if (userRole !== 'admin') {
      filter.user = userId;
    }

    const bookings = await Booking.find(filter)
      .populate([
        { path: 'user', select: 'name email phone' },
        { path: 'bus', select: 'busNumber busName type' },
        { path: 'route', select: 'routeName from to' },
      ])
      .sort({ createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit);

    const total = await Booking.countDocuments(filter);

    return { bookings, total };
  }

  async updateBookingStatus(bookingId: string, updateData: UpdateBookingData, userId: string, userRole: string): Promise<IBooking | null> {
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      throw new Error('Booking not found');
    }

    // Check if user can update this booking
    if (userRole !== 'admin') {
      const bus = await Bus.findById(booking.bus);
      if (!bus || bus.operator.toString() !== userId) {
        throw new Error('You can only update bookings for your buses');
      }
    }

    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      updateData,
      { new: true, runValidators: true }
    ).populate([
      { path: 'user', select: 'name email phone' },
      { path: 'bus', select: 'busNumber busName type' },
      { path: 'route', select: 'routeName from to' },
    ]);

    return updatedBooking;
  }

  async cancelBooking(bookingId: string, cancellationReason: string, userId: string, userRole: string): Promise<IBooking | null> {
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      throw new Error('Booking not found');
    }

    // Check if user can cancel this booking
    if (userRole !== 'admin' && booking.user.toString() !== userId) {
      throw new Error('You can only cancel your own bookings');
    }

    // Check if booking can be cancelled
    if (booking.bookingStatus === BOOKING_STATUS.CANCELLED) {
      throw new Error('Booking is already cancelled');
    }

    if (booking.bookingStatus === BOOKING_STATUS.COMPLETED) {
      throw new Error('Cannot cancel completed booking');
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
    await Bus.findByIdAndUpdate(booking.bus, {
      $inc: { availableSeats: booking.seats.length }
    });

    await booking.populate([
      { path: 'user', select: 'name email phone' },
      { path: 'bus', select: 'busNumber busName type' },
      { path: 'route', select: 'routeName from to' },
    ]);

    return booking;
  }

  async getBookingStatistics(period: number = 30): Promise<any> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - period);

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

    return {
      period: `${period} days`,
      statistics: {
        totalBookings,
        confirmedBookings,
        cancelledBookings,
        totalRevenue: totalRevenue[0]?.total || 0,
        cancellationRate: totalBookings > 0 ? (cancelledBookings / totalBookings * 100).toFixed(2) : 0,
      },
    };
  }
}
