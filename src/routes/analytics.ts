import { Router } from 'express';
import {
  getRevenueAnalytics,
  getBookingAnalytics,
  getBusPerformanceAnalytics,
  getDashboardSummary,
} from '../controllers/analyticsController';
import { authenticate, busAdminOnly } from '../middleware/auth';
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
router.get('/revenue', busAdminOnly, [...getRevenueAnalyticsValidation, validateRequest], getRevenueAnalytics);

router.get('/bookings', busAdminOnly, [...getBookingAnalyticsValidation, validateRequest], getBookingAnalytics);

router.get('/bus-performance', busAdminOnly, [...getBusPerformanceAnalyticsValidation, validateRequest], getBusPerformanceAnalytics);

router.get('/dashboard', busAdminOnly, [...getDashboardSummaryValidation, validateRequest], getDashboardSummary);

export default router;
