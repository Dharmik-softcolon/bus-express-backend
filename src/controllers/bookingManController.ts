import { Request, Response } from 'express';
import { sendSuccess, sendError, asyncHandler } from '../utils/responseHandler';
import { logError } from '../utils/logger';
import { AuthenticatedRequest } from '../types';
import { Booking } from '../models/Booking';
import { User } from '../models/User';
import { Trip } from '../models/Trip';
import { Bus } from '../models/Bus';
import { Route } from '../models/Route';
import { BOOKING_STATUS, PAYMENT_STATUS } from '../constants';

// Booking Man Dashboard
export const getBookingManDashboard = asyncHandler(async (req: Request, res: Response) => {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const userId = authenticatedReq.user?.id || '';

    // Get dashboard statistics
    const [
      totalBookings,
      pendingBookings,
      confirmedBookings,
      cancelledBookings,
      totalRevenue,
      monthlyRevenue,
      totalCustomers,
      commissionEarned
    ] = await Promise.all([
      Booking.countDocuments({ user: userId }),
      Booking.countDocuments({ user: userId, bookingStatus: BOOKING_STATUS.PENDING }),
      Booking.countDocuments({ user: userId, bookingStatus: BOOKING_STATUS.CONFIRMED }),
      Booking.countDocuments({ user: userId, bookingStatus: BOOKING_STATUS.CANCELLED }),
      Booking.aggregate([
        { $match: { user: userId, bookingStatus: BOOKING_STATUS.CONFIRMED } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      Booking.aggregate([
        { 
          $match: { 
            user: userId, 
            bookingStatus: BOOKING_STATUS.CONFIRMED,
            createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
          } 
        },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      Booking.distinct('user', { user: userId }),
      Booking.aggregate([
        { $match: { user: userId, bookingStatus: BOOKING_STATUS.CONFIRMED } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]).then(result => {
        const total = result[0]?.total || 0;
        // Assuming 5% commission for booking man
        return total * 0.05;
      })
    ]);

    // Get recent activities
    const recentActivities = await Booking.find({ user: userId })
      .populate('route', 'name')
      .populate('bus', 'busNumber')
      .sort({ createdAt: -1 })
      .limit(10)
      .select('bookingReference bookingStatus createdAt route bus totalAmount')
      .lean();

    const activities = recentActivities.map(booking => ({
      type: 'booking_created',
      message: `Booking ${booking.bookingReference} created for ${(booking.route as any)?.name || 'Unknown Route'}`,
      timestamp: booking.createdAt
    }));

    const dashboardData = {
      user: {
        id: authenticatedReq.user?.id,
        name: authenticatedReq.user?.name,
        email: authenticatedReq.user?.email,
        role: authenticatedReq.user?.role,
        company: authenticatedReq.user?.company
      },
      statistics: {
        totalBookings: totalBookings || 0,
        pendingBookings: pendingBookings || 0,
        confirmedBookings: confirmedBookings || 0,
        cancelledBookings: cancelledBookings || 0,
        totalRevenue: totalRevenue[0]?.total || 0,
        monthlyRevenue: monthlyRevenue[0]?.total || 0,
        totalCustomers: totalCustomers.length || 0,
        commissionEarned: commissionEarned || 0
      },
      features: [
        'Manage bookings',
        'View booking analytics',
        'Customer management',
        'Revenue tracking'
      ],
      recentActivities: activities
    };

    return sendSuccess(res, dashboardData, 'Booking Man Dashboard data retrieved successfully');
  } catch (error) {
    logError('Booking Man Dashboard error', error);
    return sendError(res, 'Failed to get Booking Man Dashboard data');
  }
});

// Get Booking Man Bookings
export const getBookingManBookings = asyncHandler(async (req: Request, res: Response) => {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const userId = authenticatedReq.user?.id || '';
    const { page = 1, limit = 10, status, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    // Build query
    const query: any = { user: userId };
    
    if (status && status !== 'all') {
      query.bookingStatus = status;
    }

    if (search) {
      query.$or = [
        { bookingReference: { $regex: search, $options: 'i' } },
        { 'seats.passengerName': { $regex: search, $options: 'i' } },
        { 'seats.passengerPhone': { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort: any = {};
    sort[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const bookings = await Booking.find(query)
      .populate('trip', 'tripNumber departureTime arrivalTime fare')
      .populate('bus', 'busNumber busName type')
      .populate('route', 'routeName from to')
      .sort(sort)
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit))
      .lean();

    // Get total count
    const total = await Booking.countDocuments(query);

    // Calculate pagination info
    const totalPages = Math.ceil(total / Number(limit));
    const hasNextPage = Number(page) < totalPages;
    const hasPrevPage = Number(page) > 1;

    return sendSuccess(res, {
      bookings,
      pagination: {
        currentPage: Number(page),
        totalPages,
        totalItems: total,
        itemsPerPage: Number(limit),
        hasNextPage,
        hasPrevPage
      }
    }, 'Booking Man bookings retrieved successfully');
  } catch (error) {
    logError('Error getting booking man bookings:', error);
    return sendError(res, 'Failed to get bookings');
  }
});

// Get Booking Man Customers
export const getBookingManCustomers = asyncHandler(async (req: Request, res: Response) => {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const userId = authenticatedReq.user?.id || '';
    const { page = 1, limit = 10, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    // Get unique customers from bookings
    const customerQuery: any = { user: userId };
    
    if (search) {
      customerQuery.$or = [
        { 'seats.passengerName': { $regex: search, $options: 'i' } },
        { 'seats.passengerPhone': { $regex: search, $options: 'i' } }
      ];
    }

    // Get customer data with aggregation
    const customers = await Booking.aggregate([
      { $match: customerQuery },
      { $unwind: '$seats' },
      {
        $group: {
          _id: '$seats.passengerPhone',
          name: { $first: '$seats.passengerName' },
          phone: { $first: '$seats.passengerPhone' },
          totalBookings: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
          lastBookingDate: { $max: '$createdAt' },
          bookingReferences: { $addToSet: '$bookingReference' }
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          phone: 1,
          totalBookings: 1,
          totalAmount: 1,
          lastBookingDate: 1,
          bookingReferences: 1
        }
      },
      { $sort: { [sortBy as string]: sortOrder === 'desc' ? -1 : 1 } },
      { $skip: (Number(page) - 1) * Number(limit) },
      { $limit: Number(limit) }
    ]);

    // Get total count
    const totalCustomers = await Booking.aggregate([
      { $match: customerQuery },
      { $unwind: '$seats' },
      { $group: { _id: '$seats.passengerPhone' } },
      { $count: 'total' }
    ]);

    const total = totalCustomers[0]?.total || 0;

    // Calculate pagination info
    const totalPages = Math.ceil(total / Number(limit));
    const hasNextPage = Number(page) < totalPages;
    const hasPrevPage = Number(page) > 1;

    return sendSuccess(res, {
      customers,
      pagination: {
        currentPage: Number(page),
        totalPages,
        totalItems: total,
        itemsPerPage: Number(limit),
        hasNextPage,
        hasPrevPage
      }
    }, 'Booking Man customers retrieved successfully');
  } catch (error) {
    logError('Error getting booking man customers:', error);
    return sendError(res, 'Failed to get customers');
  }
});

// Update Booking Status
export const updateBookingStatus = asyncHandler(async (req: Request, res: Response) => {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const userId = authenticatedReq.user?.id || '';
    const { bookingId } = req.params;
    const { bookingStatus, paymentStatus, notes } = req.body;

    // Find booking and verify ownership
    const booking = await Booking.findOne({ _id: bookingId, user: userId });
    if (!booking) {
      return sendError(res, 'Booking not found or access denied', 404);
    }

    // Update booking status
    const updateData: any = {};
    if (bookingStatus) updateData.bookingStatus = bookingStatus;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;
    if (notes) updateData.notes = notes;

    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      updateData,
      { new: true }
    ).populate([
      { path: 'user', select: 'name email phone' },
      { path: 'bus', select: 'busNumber busName type' },
      { path: 'route', select: 'routeName from to' },
      { path: 'trip', select: 'tripNumber departureTime arrivalTime fare' }
    ]);

    logError(`Booking status updated: ${bookingId}`, null);
    return sendSuccess(res, { booking: updatedBooking }, 'Booking status updated successfully');
  } catch (error) {
    logError('Error updating booking status:', error);
    return sendError(res, 'Failed to update booking status');
  }
});

// Cancel Booking
export const cancelBooking = asyncHandler(async (req: Request, res: Response) => {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const userId = authenticatedReq.user?.id || '';
    const { bookingId } = req.params;
    const { cancellationReason, refundAmount } = req.body;

    // Find booking and verify ownership
    const booking = await Booking.findOne({ _id: bookingId, user: userId });
    if (!booking) {
      return sendError(res, 'Booking not found or access denied', 404);
    }

    // Check if booking can be cancelled
    if (booking.bookingStatus === BOOKING_STATUS.CANCELLED) {
      return sendError(res, 'Booking is already cancelled');
    }

    if (booking.bookingStatus === BOOKING_STATUS.COMPLETED) {
      return sendError(res, 'Cannot cancel completed booking');
    }

    // Update booking status
    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      {
        bookingStatus: BOOKING_STATUS.CANCELLED,
        paymentStatus: PAYMENT_STATUS.REFUNDED,
        cancellationReason,
        refundAmount: refundAmount || booking.totalAmount,
        cancelledAt: new Date()
      },
      { new: true }
    ).populate([
      { path: 'user', select: 'name email phone' },
      { path: 'bus', select: 'busNumber busName type' },
      { path: 'route', select: 'routeName from to' },
      { path: 'trip', select: 'tripNumber departureTime arrivalTime fare' }
    ]);

    // Update trip available seats
    if (updatedBooking?.trip) {
      await Trip.findByIdAndUpdate(updatedBooking.trip, {
        $inc: {
          availableSeats: updatedBooking.seats.length,
          totalBookings: -updatedBooking.seats.length
        }
      });
    }

    logError(`Booking cancelled: ${bookingId}`, null);
    return sendSuccess(res, { booking: updatedBooking }, 'Booking cancelled successfully');
  } catch (error) {
    logError('Error cancelling booking:', error);
    return sendError(res, 'Failed to cancel booking');
  }
});
