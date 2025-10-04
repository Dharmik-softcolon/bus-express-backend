import { Router } from 'express';
import {
  createBooking,
  getAllBookings,
  getBookingById,
  getBookingByReference,
  updateBookingStatus,
  cancelBooking,
  getBookingStatistics,
  getAvailableSeats,
  getBookingAnalytics,
} from '../controllers/enhancedBookingController';
import { authenticate, authorize, busOwnerOrBusAdmin } from '../middleware/auth';
import { validateRequest, paginationMiddleware } from '../middleware/validation';
import {
  createBookingValidation,
  getAllBookingsValidation,
  getBookingByIdValidation,
  getBookingByReferenceValidation,
  updateBookingStatusValidation,
  cancelBookingValidation,
  getBookingStatisticsValidation,
} from '../validations/bookingValidation';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Customer routes
router.post('/', [...createBookingValidation, validateRequest], createBooking);

// Public routes (with authentication)
router.get('/available-seats/:tripId', getAvailableSeats);

// Admin and Manager routes
router.get('/', paginationMiddleware, [...getAllBookingsValidation, validateRequest], getAllBookings);
router.get('/analytics', getBookingAnalytics);
router.get('/statistics', [...getBookingStatisticsValidation, validateRequest], getBookingStatistics);

// Specific booking routes
router.get('/:id', [...getBookingByIdValidation, validateRequest], getBookingById);
router.get('/reference/:reference', [...getBookingByReferenceValidation, validateRequest], getBookingByReference);

// Booking management routes
router.put('/:id/status', [...updateBookingStatusValidation, validateRequest], updateBookingStatus);
router.put('/:id/cancel', [...cancelBookingValidation, validateRequest], cancelBooking);

export default router;
