import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getBookingManDashboard,
  getBookingManBookings,
  getBookingManCustomers,
  updateBookingStatus,
  cancelBooking
} from '../controllers/bookingManController';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Dashboard
router.get('/dashboard', getBookingManDashboard);

// Bookings
router.get('/bookings', getBookingManBookings);
router.put('/bookings/:bookingId/status', updateBookingStatus);
router.put('/bookings/:bookingId/cancel', cancelBooking);

// Customers
router.get('/customers', getBookingManCustomers);

export default router;
