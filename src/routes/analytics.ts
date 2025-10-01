import { Router } from 'express';
import {
  getRevenueAnalytics,
  getBookingAnalytics,
  getBusPerformanceAnalytics,
  getDashboardSummary,
} from '../controllers/analyticsController';
import { authenticate, busAdminOnly, busOwnerOrBusAdmin } from '../middleware/auth';
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
router.get('/revenue', busOwnerOrBusAdmin, [...getRevenueAnalyticsValidation, validateRequest], getRevenueAnalytics);

router.get('/bookings', busOwnerOrBusAdmin, [...getBookingAnalyticsValidation, validateRequest], getBookingAnalytics);

router.get('/bus-performance', busOwnerOrBusAdmin, [...getBusPerformanceAnalyticsValidation, validateRequest], getBusPerformanceAnalytics);

router.get('/dashboard', busOwnerOrBusAdmin, [...getDashboardSummaryValidation, validateRequest], getDashboardSummary);

export default router;
