import { Router } from 'express';
import {
  createBooking,
  getAllBookings,
  getBookingById,
  getBookingByReference,
  updateBookingStatus,
  cancelBooking,
  getBookingStatistics,
} from '../controllers/bookingController';
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

router.get('/', paginationMiddleware, [...getAllBookingsValidation, validateRequest], getAllBookings);

router.get('/reference/:reference', [...getBookingByReferenceValidation, validateRequest], getBookingByReference);

router.get('/:id', [...getBookingByIdValidation, validateRequest], getBookingById);

router.put('/:id/cancel', [...cancelBookingValidation, validateRequest], cancelBooking);

// Operator/Admin routes
router.put('/:id/status', busOwnerOrBusAdmin, [...updateBookingStatusValidation, validateRequest], updateBookingStatus);

router.get('/statistics', authorize('admin'), [...getBookingStatisticsValidation, validateRequest], getBookingStatistics);

export default router;