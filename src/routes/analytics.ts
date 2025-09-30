import { Router } from 'express';
import {
  getRevenueAnalytics,
  getBookingAnalytics,
  getBusPerformanceAnalytics,
  getDashboardSummary,
} from '../controllers/analyticsController';
import { authenticate, adminOnly } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import {
  getRevenueAnalyticsValidation,
  getBookingAnalyticsValidation,
  getBusPerformanceAnalyticsValidation,
  getDashboardSummaryValidation,
} from '../validations/analyticsValidation';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Analytics routes
router.get('/revenue', adminOnly, [...getRevenueAnalyticsValidation, validateRequest], getRevenueAnalytics);

router.get('/bookings', adminOnly, [...getBookingAnalyticsValidation, validateRequest], getBookingAnalytics);

router.get('/bus-performance', adminOnly, [...getBusPerformanceAnalyticsValidation, validateRequest], getBusPerformanceAnalytics);

router.get('/dashboard', adminOnly, [...getDashboardSummaryValidation, validateRequest], getDashboardSummary);

export default router;
