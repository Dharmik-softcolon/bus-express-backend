import { Request, Response } from 'express';
import { Booking } from '../models/Booking';
import { Trip } from '../models/Trip';
import { Bus } from '../models/Bus';
import { Route } from '../models/Route';
import { Expense } from '../models/Expense';
import { asyncHandler } from '../utils/responseHandler';
import { sendSuccess, sendError } from '../utils/responseHandler';
import { logError } from '../utils/logger';

// Get revenue analytics
export const getRevenueAnalytics = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { period = 'monthly', startDate, endDate, route } = req.query;

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

    const matchFilter: any = { 
      ...dateFilter,
      paymentStatus: 'completed',
      bookingStatus: { $in: ['confirmed', 'completed'] }
    };

    // Get revenue by route
    const revenueByRoute = await Booking.aggregate([
      { $match: matchFilter },
      {
        $lookup: {
          from: 'routes',
          localField: 'route',
          foreignField: '_id',
          as: 'routeData',
        },
      },
      { $unwind: '$routeData' },
      {
        $group: {
          _id: {
            routeId: '$route',
            routeName: '$routeData.routeName',
            from: '$routeData.from.city',
            to: '$routeData.to.city',
          },
          totalRevenue: { $sum: '$totalAmount' },
          totalBookings: { $sum: 1 },
          totalPassengers: { $sum: { $size: '$seats' } },
          averageTicketPrice: { $avg: '$totalAmount' },
        },
      },
      { $sort: { totalRevenue: -1 } },
    ]);

    // Get daily revenue
    const dailyRevenue = await Booking.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$journeyDate' } },
          },
          revenue: { $sum: '$totalAmount' },
          bookings: { $sum: 1 },
          passengers: { $sum: { $size: '$seats' } },
        },
      },
      { $sort: { '_id.date': 1 } },
    ]);

    // Get monthly revenue
    const monthlyRevenue = await Booking.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: {
            month: { $month: '$journeyDate' },
            year: { $year: '$journeyDate' },
          },
          revenue: { $sum: '$totalAmount' },
          bookings: { $sum: 1 },
          passengers: { $sum: { $size: '$seats' } },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Get total summary
    const totalSummary = await Booking.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          totalBookings: { $sum: 1 },
          totalPassengers: { $sum: { $size: '$seats' } },
          averageTicketPrice: { $avg: '$totalAmount' },
        },
      },
    ]);

    const result = {
      summary: totalSummary[0] || {
        totalRevenue: 0,
        totalBookings: 0,
        totalPassengers: 0,
        averageTicketPrice: 0,
      },
      byRoute: revenueByRoute,
      daily: dailyRevenue,
      monthly: monthlyRevenue,
    };

    return sendSuccess(res, result, 'Revenue analytics retrieved successfully');
  } catch (error) {
    logError('Error fetching revenue analytics:', error);
    return sendError(res, 'Failed to fetch revenue analytics');
  }
});

// Get booking analytics
export const getBookingAnalytics = asyncHandler(async (req: Request, res: Response) => {
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

    // Get booking status distribution
    const statusDistribution = await Booking.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$bookingStatus',
          count: { $sum: 1 },
          revenue: { $sum: '$totalAmount' },
        },
      },
    ]);

    // Get payment status distribution
    const paymentDistribution = await Booking.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$paymentStatus',
          count: { $sum: 1 },
          revenue: { $sum: '$totalAmount' },
        },
      },
    ]);

    // Get booking trends by day
    const dailyTrends = await Booking.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$journeyDate' } },
          },
          bookings: { $sum: 1 },
          confirmed: {
            $sum: { $cond: [{ $eq: ['$bookingStatus', 'confirmed'] }, 1, 0] },
          },
          cancelled: {
            $sum: { $cond: [{ $eq: ['$bookingStatus', 'cancelled'] }, 1, 0] },
          },
        },
      },
      { $sort: { '_id.date': 1 } },
    ]);

    // Get popular routes
    const popularRoutes = await Booking.aggregate([
      { $match: dateFilter },
      {
        $lookup: {
          from: 'routes',
          localField: 'route',
          foreignField: '_id',
          as: 'routeData',
        },
      },
      { $unwind: '$routeData' },
      {
        $group: {
          _id: {
            routeId: '$route',
            routeName: '$routeData.routeName',
            from: '$routeData.from.city',
            to: '$routeData.to.city',
          },
          bookings: { $sum: 1 },
          passengers: { $sum: { $size: '$seats' } },
        },
      },
      { $sort: { bookings: -1 } },
      { $limit: 10 },
    ]);

    const result = {
      statusDistribution,
      paymentDistribution,
      dailyTrends,
      popularRoutes,
    };

    return sendSuccess(res, result, 'Booking analytics retrieved successfully');
  } catch (error) {
    logError('Error fetching booking analytics:', error);
    return sendError(res, 'Failed to fetch booking analytics');
  }
});

// Get bus performance analytics
export const getBusPerformanceAnalytics = asyncHandler(async (req: Request, res: Response) => {
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

    // Get bus performance
    const busPerformance = await Booking.aggregate([
      { $match: dateFilter },
      {
        $lookup: {
          from: 'buses',
          localField: 'bus',
          foreignField: '_id',
          as: 'busData',
        },
      },
      { $unwind: '$busData' },
      {
        $group: {
          _id: {
            busId: '$bus',
            busNumber: '$busData.busNumber',
            busName: '$busData.busName',
            busType: '$busData.type',
          },
          totalBookings: { $sum: 1 },
          totalPassengers: { $sum: { $size: '$seats' } },
          totalRevenue: { $sum: '$totalAmount' },
          averageOccupancy: { $avg: { $size: '$seats' } },
        },
      },
      { $sort: { totalRevenue: -1 } },
    ]);

    // Get bus utilization
    const busUtilization = await Trip.aggregate([
      {
        $lookup: {
          from: 'buses',
          localField: 'bus',
          foreignField: '_id',
          as: 'busData',
        },
      },
      { $unwind: '$busData' },
      {
        $group: {
          _id: {
            busId: '$bus',
            busNumber: '$busData.busNumber',
            busName: '$busData.busName',
          },
          totalTrips: { $sum: 1 },
          completedTrips: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
          },
          cancelledTrips: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] },
          },
          totalBookings: { $sum: '$totalBookings' },
        },
      },
      {
        $addFields: {
          utilizationRate: {
            $multiply: [
              { $divide: ['$completedTrips', '$totalTrips'] },
              100,
            ],
          },
        },
      },
      { $sort: { utilizationRate: -1 } },
    ]);

    const result = {
      performance: busPerformance,
      utilization: busUtilization,
    };

    return sendSuccess(res, result, 'Bus performance analytics retrieved successfully');
  } catch (error) {
    logError('Error fetching bus performance analytics:', error);
    return sendError(res, 'Failed to fetch bus performance analytics');
  }
});

// Get dashboard summary
export const getDashboardSummary = asyncHandler(async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Get current month bookings
    const currentMonthBookings = await Booking.aggregate([
      {
        $match: {
          journeyDate: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
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
        },
      },
    ]);

    // Get previous month bookings for comparison
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const previousMonthBookings = await Booking.aggregate([
      {
        $match: {
          journeyDate: { $gte: previousMonthStart, $lte: previousMonthEnd },
        },
      },
      {
        $group: {
          _id: null,
          totalBookings: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
          totalPassengers: { $sum: { $size: '$seats' } },
        },
      },
    ]);

    // Get total counts
    const totalBuses = await Bus.countDocuments({ status: 'active' });
    const totalRoutes = await Route.countDocuments({ isActive: true });
    const totalTrips = await Trip.countDocuments({
      departureDate: { $gte: startOfMonth, $lte: endOfMonth },
    });

    // Get today's bookings
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    const todayBookings = await Booking.aggregate([
      {
        $match: {
          journeyDate: { $gte: todayStart, $lt: todayEnd },
        },
      },
      {
        $group: {
          _id: null,
          totalBookings: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
        },
      },
    ]);

    const current = currentMonthBookings[0] || {
      totalBookings: 0,
      totalRevenue: 0,
      totalPassengers: 0,
      confirmedBookings: 0,
      pendingBookings: 0,
    };

    const previous = previousMonthBookings[0] || {
      totalBookings: 0,
      totalRevenue: 0,
      totalPassengers: 0,
    };

    const today = todayBookings[0] || {
      totalBookings: 0,
      totalRevenue: 0,
    };

    // Calculate growth percentages
    const bookingGrowth = previous.totalBookings > 0 
      ? ((current.totalBookings - previous.totalBookings) / previous.totalBookings) * 100 
      : 0;

    const revenueGrowth = previous.totalRevenue > 0 
      ? ((current.totalRevenue - previous.totalRevenue) / previous.totalRevenue) * 100 
      : 0;

    const result = {
      currentMonth: current,
      previousMonth: previous,
      today: today,
      totals: {
        buses: totalBuses,
        routes: totalRoutes,
        trips: totalTrips,
      },
      growth: {
        bookings: Math.round(bookingGrowth * 100) / 100,
        revenue: Math.round(revenueGrowth * 100) / 100,
      },
    };

    return sendSuccess(res, result, 'Dashboard summary retrieved successfully');
  } catch (error) {
    logError('Error fetching dashboard summary:', error);
    return sendError(res, 'Failed to fetch dashboard summary');
  }
});
