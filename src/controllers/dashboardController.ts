import { Request, Response } from 'express';
import { sendSuccess, sendError, asyncHandler } from '../utils/responseHandler';
import { logError } from '../utils/logger';
import { AuthenticatedRequest } from '../types';
import { User } from '../models/User';
import { Bus } from '../models/Bus';
import { Booking } from '../models/Booking';
import { Trip } from '../models/Trip';
import { Route } from '../models/Route';
import { Expense } from '../models/Expense';

// Master Admin Dashboard
export const getMasterAdminDashboard = asyncHandler(async (req: Request, res: Response) => {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const userId = authenticatedReq.user?.id || '';

    // Get dashboard statistics using direct MongoDB queries
    const [
      totalBusOwners,
      totalBuses,
      totalRoutes,
      totalBookings,
      totalRevenue
    ] = await Promise.all([
      User.countDocuments({ role: 'BUS_OWNER' }),
      Bus.countDocuments(),
      Route.countDocuments(),
      Booking.countDocuments(),
      Booking.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: '$totalAmount' }
          }
        }
      ]).then(result => result[0]?.total || 0)
    ]);

    const dashboardData = {
      user: {
        id: authenticatedReq.user?.id,
        name: authenticatedReq.user?.name,
        email: authenticatedReq.user?.email,
        role: authenticatedReq.user?.role
      },
      statistics: {
        totalBusOwners,
        totalBuses,
        totalRoutes,
        totalBookings,
        totalRevenue
      },
      features: [
        'Manage all bus owners',
        'System-wide settings',
        'Platform commission tracking',
        'User role management'
      ],
      recentActivities: [
        { type: 'user_created', message: 'New bus owner registered', timestamp: new Date() },
        { type: 'system_update', message: 'System settings updated', timestamp: new Date() }
      ]
    };

    return sendSuccess(res, dashboardData, 'Master Admin Dashboard data retrieved successfully');
  } catch (error) {
    logError('Master Admin Dashboard error', error);
    return sendError(res, 'Failed to get Master Admin Dashboard data');
  }
});

// Bus Owner Dashboard
export const getBusOwnerDashboard = asyncHandler(async (req: Request, res: Response) => {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const userId = authenticatedReq.user?.id || '';

    // Get dashboard statistics for bus owner using direct MongoDB queries
    const [
      totalBuses,
      totalRoutes,
      totalBookings,
      totalRevenue,
      totalEmployees
    ] = await Promise.all([
      Bus.countDocuments({ owner: userId }),
      Route.countDocuments({ owner: userId }),
      Booking.countDocuments({ owner: userId }),
      Booking.aggregate([
        { $match: { owner: userId } },
        {
          $group: {
            _id: null,
            total: { $sum: '$totalAmount' }
          }
        }
      ]).then(result => result[0]?.total || 0),
      User.countDocuments({ role: 'BUS_ADMIN', createdBy: userId })
    ]);

    const dashboardData = {
      user: {
        id: authenticatedReq.user?.id,
        name: authenticatedReq.user?.name,
        email: authenticatedReq.user?.email,
        role: authenticatedReq.user?.role,
        company: authenticatedReq.user?.company
      },
      statistics: {
        totalBuses,
        totalRoutes,
        totalBookings,
        totalRevenue,
        totalEmployees
      },
      features: [
        'Manage bus admins',
        'View daily reports',
        'Employee management',
        'Revenue tracking'
      ],
      recentActivities: [
        { type: 'booking_created', message: 'New booking received', timestamp: new Date() },
        { type: 'trip_completed', message: 'Trip completed successfully', timestamp: new Date() }
      ]
    };

    return sendSuccess(res, dashboardData, 'Bus Owner Dashboard data retrieved successfully');
  } catch (error) {
    logError('Bus Owner Dashboard error', error);
    return sendError(res, 'Failed to get Bus Owner Dashboard data');
  }
});

// Bus Admin Dashboard
export const getBusAdminDashboard = asyncHandler(async (req: Request, res: Response) => {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const userId = authenticatedReq.user?.id || '';

    // Get dashboard statistics for bus admin using direct MongoDB queries
    const today = new Date().toISOString().split('T')[0];
    const [
      totalTrips,
      totalBookings,
      totalRoutes,
      totalEmployees,
      todayBookings
    ] = await Promise.all([
      Trip.countDocuments({ admin: userId }),
      Booking.countDocuments({ admin: userId }),
      Route.countDocuments({ admin: userId }),
      User.countDocuments({ role: 'BUS_EMPLOYEE', createdBy: userId }),
      Booking.countDocuments({ 
        admin: userId, 
        journeyDate: { 
          $gte: new Date(today), 
          $lt: new Date(new Date(today).getTime() + 24 * 60 * 60 * 1000) 
        } 
      })
    ]);

    const dashboardData = {
      user: {
        id: authenticatedReq.user?.id,
        name: authenticatedReq.user?.name,
        email: authenticatedReq.user?.email,
        role: authenticatedReq.user?.role,
        company: authenticatedReq.user?.company
      },
      statistics: {
        totalTrips,
        totalBookings,
        totalRoutes,
        totalEmployees,
        todayBookings
      },
      features: [
        'Create and manage trips',
        'Assign employees to buses',
        'Manage routes and schedules',
        'Booking management'
      ],
      recentActivities: [
        { type: 'trip_created', message: 'New trip scheduled', timestamp: new Date() },
        { type: 'booking_confirmed', message: 'Booking confirmed', timestamp: new Date() }
      ]
    };

    return sendSuccess(res, dashboardData, 'Bus Admin Dashboard data retrieved successfully');
  } catch (error) {
    logError('Bus Admin Dashboard error', error);
    return sendError(res, 'Failed to get Bus Admin Dashboard data');
  }
});

// Booking Manager Dashboard
export const getBookingManagerDashboard = asyncHandler(async (req: Request, res: Response) => {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const userId = authenticatedReq.user?.id || '';

    // Get dashboard statistics for booking manager using direct MongoDB queries
    const today = new Date().toISOString().split('T')[0];
    const [
      totalBookings,
      todayBookings,
      pendingBookings,
      totalRevenue,
      cancelledBookings
    ] = await Promise.all([
      Booking.countDocuments({ manager: userId }),
      Booking.countDocuments({ 
        manager: userId, 
        journeyDate: { 
          $gte: new Date(today), 
          $lt: new Date(new Date(today).getTime() + 24 * 60 * 60 * 1000) 
        } 
      }),
      Booking.countDocuments({ manager: userId, bookingStatus: 'pending' }),
      Booking.aggregate([
        { $match: { manager: userId } },
        {
          $group: {
            _id: null,
            total: { $sum: '$totalAmount' }
          }
        }
      ]).then(result => result[0]?.total || 0),
      Booking.countDocuments({ manager: userId, bookingStatus: 'cancelled' })
    ]);

    const dashboardData = {
      user: {
        id: authenticatedReq.user?.id,
        name: authenticatedReq.user?.name,
        email: authenticatedReq.user?.email,
        role: authenticatedReq.user?.role,
        company: authenticatedReq.user?.company
      },
      statistics: {
        totalBookings,
        todayBookings,
        pendingBookings,
        totalRevenue,
        cancelledBookings
      },
      features: [
        'Book customer seats',
        'Cancel bookings',
        'View booking reports',
        'Commission tracking'
      ],
      recentActivities: [
        { type: 'booking_created', message: 'New booking created', timestamp: new Date() },
        { type: 'booking_cancelled', message: 'Booking cancelled', timestamp: new Date() }
      ]
    };

    return sendSuccess(res, dashboardData, 'Booking Manager Dashboard data retrieved successfully');
  } catch (error) {
    logError('Booking Manager Dashboard error', error);
    return sendError(res, 'Failed to get Booking Manager Dashboard data');
  }
});

// Bus Employee Dashboard
export const getBusEmployeeDashboard = asyncHandler(async (req: Request, res: Response) => {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const userId = authenticatedReq.user?.id || '';

    // Get dashboard statistics for bus employee using direct MongoDB queries
    const today = new Date().toISOString().split('T')[0];
    const [
      assignedTrips,
      completedTrips,
      totalExpenses,
      todayTrips,
      upcomingTrips
    ] = await Promise.all([
      Trip.countDocuments({ 
        $or: [{ driver: userId }, { helper: userId }] 
      }),
      Trip.countDocuments({ 
        $or: [{ driver: userId }, { helper: userId }], 
        status: 'completed' 
      }),
      Expense.countDocuments({ employee: userId }),
      Trip.countDocuments({ 
        $or: [{ driver: userId }, { helper: userId }], 
        departureDate: { 
          $gte: new Date(today), 
          $lt: new Date(new Date(today).getTime() + 24 * 60 * 60 * 1000) 
        } 
      }),
      Trip.countDocuments({ 
        $or: [{ driver: userId }, { helper: userId }], 
        status: 'scheduled' 
      })
    ]);

    const dashboardData = {
      user: {
        id: authenticatedReq.user?.id,
        name: authenticatedReq.user?.name,
        email: authenticatedReq.user?.email,
        role: authenticatedReq.user?.role,
        subrole: authenticatedReq.user?.subrole,
        company: authenticatedReq.user?.company
      },
      statistics: {
        assignedTrips,
        completedTrips,
        totalExpenses,
        todayTrips,
        upcomingTrips
      },
      features: [
        'View assigned trips',
        'Customer list access',
        'Add trip expenses',
        'Pickup/drop point details'
      ],
      recentActivities: [
        { type: 'trip_assigned', message: 'New trip assigned', timestamp: new Date() },
        { type: 'expense_added', message: 'Trip expense added', timestamp: new Date() }
      ]
    };

    return sendSuccess(res, dashboardData, 'Bus Employee Dashboard data retrieved successfully');
  } catch (error) {
    logError('Bus Employee Dashboard error', error);
    return sendError(res, 'Failed to get Bus Employee Dashboard data');
  }
});

// Get comprehensive dashboard data for admin
export const getAdminDashboard = asyncHandler(async (req: Request, res: Response) => {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const userId = authenticatedReq.user?.id || '';

    // Get comprehensive statistics
    const [
      totalBuses,
      totalRoutes,
      totalBookings,
      totalEmployees,
      totalBookingMen,
      totalRevenue,
      todayBookings,
      activeBuses,
      maintenanceBuses,
      recentBookings,
      recentTrips,
      recentExpenses
    ] = await Promise.all([
      Bus.countDocuments(),
      Route.countDocuments(),
      Booking.countDocuments(),
      User.countDocuments({ role: 'BUS_EMPLOYEE' }),
      User.countDocuments({ role: 'BOOKING_MAN' }),
      Booking.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: '$totalAmount' }
          }
        }
      ]).then(result => result[0]?.total || 0),
      Booking.countDocuments({
        journeyDate: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
          $lt: new Date(new Date().setHours(23, 59, 59, 999))
        }
      }),
      Bus.countDocuments({ status: 'active' }),
      Bus.countDocuments({ status: 'maintenance' }),
      Booking.find().sort({ createdAt: -1 }).limit(10).populate('user', 'name email phone'),
      Trip.find().sort({ createdAt: -1 }).limit(10).populate('route', 'name'),
      Expense.find().sort({ createdAt: -1 }).limit(10).populate('bus', 'number')
    ]);

    // Get monthly revenue data
    const monthlyRevenue = await Booking.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$journeyDate' },
            month: { $month: '$journeyDate' }
          },
          revenue: { $sum: '$totalAmount' },
          bookings: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    // Get route performance
    const routePerformance = await Route.aggregate([
      {
        $lookup: {
          from: 'bookings',
          localField: '_id',
          foreignField: 'route',
          as: 'bookings'
        }
      },
      {
        $project: {
          name: 1,
          totalBookings: { $size: '$bookings' },
          totalRevenue: { $sum: '$bookings.totalAmount' },
          avgFare: { $avg: '$bookings.totalAmount' }
        }
      },
      { $sort: { totalBookings: -1 } },
      { $limit: 10 }
    ]);

    const dashboardData = {
      user: {
        id: authenticatedReq.user?.id,
        name: authenticatedReq.user?.name,
        email: authenticatedReq.user?.email,
        role: authenticatedReq.user?.role,
        company: authenticatedReq.user?.company
      },
      statistics: {
        totalBuses,
        totalRoutes,
        totalBookings,
        totalEmployees,
        totalBookingMen,
        totalRevenue,
        todayBookings,
        activeBuses,
        maintenanceBuses
      },
      charts: {
        monthlyRevenue,
        routePerformance
      },
      recent: {
        bookings: recentBookings,
        trips: recentTrips,
        expenses: recentExpenses
      },
      features: [
        'Comprehensive bus management',
        'Route and trip management',
        'Employee and booking manager management',
        'Revenue and expense tracking',
        'Real-time analytics'
      ]
    };

    return sendSuccess(res, dashboardData, 'Admin Dashboard data retrieved successfully');
  } catch (error) {
    logError('Admin Dashboard error', error);
    return sendError(res, 'Failed to get Admin Dashboard data');
  }
});

// Get buses data for admin dashboard
export const getAdminBuses = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter: any = {};
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { number: { $regex: search, $options: 'i' } },
        { type: { $regex: search, $options: 'i' } }
      ];
    }

    const [buses, total] = await Promise.all([
      Bus.find(filter)
        .populate('owner', 'name email')
        .populate('driver', 'name phone')
        .populate('conductor', 'name phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Bus.countDocuments(filter)
    ]);

    return sendSuccess(res, {
      buses,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    }, 'Buses retrieved successfully');
  } catch (error) {
    logError('Get admin buses error', error);
    return sendError(res, 'Failed to get buses');
  }
});

// Get routes data for admin dashboard
export const getAdminRoutes = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter: any = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { from: { $regex: search, $options: 'i' } },
        { to: { $regex: search, $options: 'i' } }
      ];
    }

    const [routes, total] = await Promise.all([
      Route.find(filter)
        .populate('owner', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Route.countDocuments(filter)
    ]);

    return sendSuccess(res, {
      routes,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    }, 'Routes retrieved successfully');
  } catch (error) {
    logError('Get admin routes error', error);
    return sendError(res, 'Failed to get routes');
  }
});

// Get bookings data for admin dashboard
export const getAdminBookings = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter: any = {};
    if (status) filter.bookingStatus = status;
    if (search) {
      filter.$or = [
        { bookingReference: { $regex: search, $options: 'i' } },
        { 'passengerDetails.name': { $regex: search, $options: 'i' } },
        { 'passengerDetails.phone': { $regex: search, $options: 'i' } }
      ];
    }

    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .populate('user', 'name email phone')
        .populate('trip', 'departureTime arrivalTime')
        .populate('route', 'name from to')
        .populate('bus', 'number')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Booking.countDocuments(filter)
    ]);

    return sendSuccess(res, {
      bookings,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    }, 'Bookings retrieved successfully');
  } catch (error) {
    logError('Get admin bookings error', error);
    return sendError(res, 'Failed to get bookings');
  }
});

// Get expenses data for admin dashboard
export const getAdminExpenses = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, category, status, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter: any = {};
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { description: { $regex: search, $options: 'i' } },
        { addedBy: { $regex: search, $options: 'i' } }
      ];
    }

    const [expenses, total] = await Promise.all([
      Expense.find(filter)
        .populate('bus', 'number')
        .populate('addedBy', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Expense.countDocuments(filter)
    ]);

    return sendSuccess(res, {
      expenses,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    }, 'Expenses retrieved successfully');
  } catch (error) {
    logError('Get admin expenses error', error);
    return sendError(res, 'Failed to get expenses');
  }
});

// Get earnings data for admin dashboard
export const getAdminEarnings = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { period = 'month' } = req.query;
    
    let dateFilter: any = {};
    const now = new Date();
    
    switch (period) {
      case 'week':
        const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
        const weekEnd = new Date(now.setDate(now.getDate() - now.getDay() + 6));
        dateFilter = {
          journeyDate: { $gte: weekStart, $lte: weekEnd }
        };
        break;
      case 'month':
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        dateFilter = {
          journeyDate: { $gte: monthStart, $lte: monthEnd }
        };
        break;
      case 'year':
        const yearStart = new Date(now.getFullYear(), 0, 1);
        const yearEnd = new Date(now.getFullYear(), 11, 31);
        dateFilter = {
          journeyDate: { $gte: yearStart, $lte: yearEnd }
        };
        break;
    }

    const earnings = await Booking.aggregate([
      { $match: dateFilter },
      {
        $lookup: {
          from: 'routes',
          localField: 'route',
          foreignField: '_id',
          as: 'routeInfo'
        }
      },
      {
        $group: {
          _id: {
            route: { $arrayElemAt: ['$routeInfo.name', 0] },
            date: { $dateToString: { format: '%Y-%m-%d', date: '$journeyDate' } }
          },
          revenue: { $sum: '$totalAmount' },
          bookings: { $sum: 1 },
          avgFare: { $avg: '$totalAmount' }
        }
      },
      { $sort: { '_id.date': -1 } },
      { $limit: 50 }
    ]);

    return sendSuccess(res, { earnings }, 'Earnings data retrieved successfully');
  } catch (error) {
    logError('Get admin earnings error', error);
    return sendError(res, 'Failed to get earnings data');
  }
});

// Customer Dashboard
export const getCustomerDashboard = asyncHandler(async (req: Request, res: Response) => {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const userId = authenticatedReq.user?.id || '';

    // Get dashboard statistics for customer using direct MongoDB queries
    const [
      totalBookings,
      activeBookings,
      completedBookings,
      cancelledBookings,
      totalSpent
    ] = await Promise.all([
      Booking.countDocuments({ user: userId }),
      Booking.countDocuments({ user: userId, bookingStatus: 'confirmed' }),
      Booking.countDocuments({ user: userId, bookingStatus: 'completed' }),
      Booking.countDocuments({ user: userId, bookingStatus: 'cancelled' }),
      Booking.aggregate([
        { $match: { user: userId } },
        {
          $group: {
            _id: null,
            total: { $sum: '$totalAmount' }
          }
        }
      ]).then(result => result[0]?.total || 0)
    ]);

    const dashboardData = {
      user: {
        id: authenticatedReq.user?.id,
        name: authenticatedReq.user?.name,
        email: authenticatedReq.user?.email,
        role: authenticatedReq.user?.role
      },
      statistics: {
        totalBookings,
        activeBookings,
        completedBookings,
        cancelledBookings,
        totalSpent
      },
      features: [
        'Search and book buses',
        'View booking history',
        'Manage profile',
        'Track trips'
      ],
      recentActivities: [
        { type: 'booking_created', message: 'New booking created', timestamp: new Date() },
        { type: 'trip_completed', message: 'Trip completed', timestamp: new Date() }
      ]
    };

    return sendSuccess(res, dashboardData, 'Customer Dashboard data retrieved successfully');
  } catch (error) {
    logError('Customer Dashboard error', error);
    return sendError(res, 'Failed to get Customer Dashboard data');
  }
});
