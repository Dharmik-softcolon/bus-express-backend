import { Router } from 'express';
import authRoutes from './auth';
import busRoutes from './bus';
import routeRoutes from './route';
import bookingRoutes from './booking';

const router = Router();

// API routes
router.use('/auth', authRoutes);
router.use('/buses', busRoutes);
router.use('/routes', routeRoutes);
router.use('/bookings', bookingRoutes);

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

