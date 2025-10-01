import { Router } from 'express';
import authRoutes from './auth';
import busRoutes from './bus';
import routeRoutes from './route';
import bookingRoutes from './booking';
import tripRoutes from './trip';
import employeeRoutes from './employee';
import expenseRoutes from './expense';
import analyticsRoutes from './analytics';
import searchRoutes from './search';
import { authenticate, masterAdminOnly, busOwnerOrBusAdmin, busAdminOnly } from '../middleware/auth';
import {
  getMasterAdminDashboard,
  getBusOwnerDashboard,
  getBusAdminDashboard,
  getBookingManagerDashboard,
  getBusEmployeeDashboard,
  getCustomerDashboard
} from '../controllers/dashboardController';

const router = Router();

// API routes
router.use('/auth', authRoutes);
router.use('/buses', busRoutes);
router.use('/routes', routeRoutes);
router.use('/bookings', bookingRoutes);
router.use('/trips', tripRoutes);
router.use('/employees', employeeRoutes);
router.use('/expenses', expenseRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/search', searchRoutes);

// Role-based dashboard routes
router.get('/master-admin', masterAdminOnly, getMasterAdminDashboard);
router.get('/bus-owner', busOwnerOrBusAdmin, getBusOwnerDashboard);
router.get('/bus-admin', busOwnerOrBusAdmin, getBusAdminDashboard);
router.get('/booking-man', authenticate, getBookingManagerDashboard);
router.get('/bus-employee', authenticate, getBusEmployeeDashboard);
router.get('/customer', authenticate, getCustomerDashboard);

// Health check route
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// 404 handler for API routes
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    timestamp: new Date().toISOString(),
  });
});

export default router;

