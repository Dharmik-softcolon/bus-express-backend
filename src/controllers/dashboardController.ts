import { Request, Response } from 'express';
import { sendSuccess, sendError, asyncHandler } from '../utils/responseHandler';
import { logError } from '../utils/logger';
import { AuthenticatedRequest } from '../types';
import { UserService } from '../services/userService';
import { BusService } from '../services/busService';
import { BookingService } from '../services/bookingService';
import { TripService } from '../services/tripService';
import { RouteService } from '../services/routeService';
import { ExpenseService } from '../services/expenseService';

const userService = new UserService();
const busService = new BusService();
const bookingService = new BookingService();
const tripService = new TripService();
const routeService = new RouteService();
const expenseService = new ExpenseService();

// Master Admin Dashboard
export const getMasterAdminDashboard = asyncHandler(async (req: Request, res: Response) => {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const userId = authenticatedReq.user?.id || '';

    // Get dashboard statistics
    const [
      totalBusOwners,
      totalBuses,
      totalRoutes,
      totalBookings,
      totalRevenue
    ] = await Promise.all([
      userService.getUsersCount({ role: 'BUS_OWNER' }),
      busService.getBusesCount(),
      routeService.getRoutesCount(),
      bookingService.getBookingsCount(),
      bookingService.getTotalRevenue()
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

    // Get dashboard statistics for bus owner
    const [
      totalBuses,
      totalRoutes,
      totalBookings,
      totalRevenue,
      totalEmployees
    ] = await Promise.all([
      busService.getBusesCount({ ownerId: userId }),
      routeService.getRoutesCount({ ownerId: userId }),
      bookingService.getBookingsCount({ ownerId: userId }),
      bookingService.getTotalRevenue({ ownerId: userId }),
      userService.getUsersCount({ role: 'BUS_ADMIN', createdBy: userId })
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

    // Get dashboard statistics for bus admin
    const [
      totalTrips,
      totalBookings,
      totalRoutes,
      totalEmployees,
      todayBookings
    ] = await Promise.all([
      tripService.getTripsCount({ adminId: userId }),
      bookingService.getBookingsCount({ adminId: userId }),
      routeService.getRoutesCount({ adminId: userId }),
      userService.getUsersCount({ role: 'BUS_EMPLOYEE', createdBy: userId }),
      bookingService.getBookingsCount({ adminId: userId, date: new Date().toISOString().split('T')[0] })
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

    // Get dashboard statistics for booking manager
    const [
      totalBookings,
      todayBookings,
      pendingBookings,
      totalRevenue,
      cancelledBookings
    ] = await Promise.all([
      bookingService.getBookingsCount({ managerId: userId }),
      bookingService.getBookingsCount({ managerId: userId, date: new Date().toISOString().split('T')[0] }),
      bookingService.getBookingsCount({ managerId: userId, status: 'pending' }),
      bookingService.getTotalRevenue({ managerId: userId }),
      bookingService.getBookingsCount({ managerId: userId, status: 'cancelled' })
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

    // Get dashboard statistics for bus employee
    const [
      assignedTrips,
      completedTrips,
      totalExpenses,
      todayTrips,
      upcomingTrips
    ] = await Promise.all([
      tripService.getTripsCount({ employeeId: userId }),
      tripService.getTripsCount({ employeeId: userId, status: 'completed' }),
      expenseService.getExpensesCount({ employeeId: userId }),
      tripService.getTripsCount({ employeeId: userId, date: new Date().toISOString().split('T')[0] }),
      tripService.getTripsCount({ employeeId: userId, status: 'scheduled' })
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

// Customer Dashboard
export const getCustomerDashboard = asyncHandler(async (req: Request, res: Response) => {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const userId = authenticatedReq.user?.id || '';

    // Get dashboard statistics for customer
    const [
      totalBookings,
      activeBookings,
      completedBookings,
      cancelledBookings,
      totalSpent
    ] = await Promise.all([
      bookingService.getBookingsCount({ customerId: userId }),
      bookingService.getBookingsCount({ customerId: userId, status: 'confirmed' }),
      bookingService.getBookingsCount({ customerId: userId, status: 'completed' }),
      bookingService.getBookingsCount({ customerId: userId, status: 'cancelled' }),
      bookingService.getTotalRevenue({ customerId: userId })
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
