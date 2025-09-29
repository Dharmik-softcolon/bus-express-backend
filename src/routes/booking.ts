import { Router } from 'express';
import {
  createBooking,
  getAllBookings,
  getBookingById,
  getBookingByReference,
  updateBookingStatus,
  cancelBooking,
  getBookingStatistics,
} from '../controllers/bookingController.js';
import { authenticate, authorize, operatorOrAdmin } from '../middleware/auth.js';
import { validateRequest, paginationMiddleware } from '../middleware/validation.js';
import {
  createBookingValidation,
  getAllBookingsValidation,
  getBookingByIdValidation,
  getBookingByReferenceValidation,
  updateBookingStatusValidation,
  cancelBookingValidation,
  getBookingStatisticsValidation,
} from '../validations/bookingValidation.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Customer routes
router.post('/', [...createBookingValidation, validateRequest], createBooking);

router.get('/', paginationMiddleware, [...getAllBookingsValidation, validateRequest], getAllBookings);

router.get('/reference/:reference', [...getBookingByReferenceValidation, validateRequest], getBookingByReference);

router.get('/:id', [...getBookingByIdValidation, validateRequest], getBookingById);

router.put('/:id/cancel', [...cancelBookingValidation, validateRequest], cancelBooking);

// Operator/Admin routes
router.put('/:id/status', operatorOrAdmin, [...updateBookingStatusValidation, validateRequest], updateBookingStatus);

router.get('/statistics', authorize('admin'), [...getBookingStatisticsValidation, validateRequest], getBookingStatistics);

export default router;