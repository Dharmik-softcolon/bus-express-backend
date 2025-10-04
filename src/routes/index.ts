import { Router } from 'express';
import authRoutes from './auth';
import busRoutes from './bus';
import routeRoutes from './route';
import bookingRoutes from './booking';
import enhancedBookingRoutes from './enhancedBookingRoutes';
import tripRoutes from './trip';
import expenseRoutes from './expense';
import analyticsRoutes from './analytics';
import searchRoutes from './search';

// Role-based routes
import masterAdminRoutes from './masterAdminRoutes';
import busOwnerRoutes from './busOwnerRoutes';
import busAdminRoutes from './busAdminRoutes';
import bookingManRoutes from './bookingManRoutes';
import busEmployeeRoutes from './busEmployeeRoutes';
import customerRoutes from './customerRoutes';

const router = Router();

// API routes
router.use('/auth', authRoutes);
router.use('/buses', busRoutes);
router.use('/routes', routeRoutes);
router.use('/bookings', enhancedBookingRoutes); // Use enhanced booking routes
router.use('/trips', tripRoutes);
router.use('/expenses', expenseRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/search', searchRoutes);

// Role-based routes
router.use('/master-admin', masterAdminRoutes);
router.use('/bus-owner', busOwnerRoutes);
router.use('/bus-admin', busAdminRoutes);
router.use('/booking-man', bookingManRoutes);
router.use('/bus-employee', busEmployeeRoutes);
router.use('/customer', customerRoutes);

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

