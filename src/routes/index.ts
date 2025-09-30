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

