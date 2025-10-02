import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getBookingManagerDashboard
} from '../controllers/bookingManagerController';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Dashboard
router.get('/dashboard', getBookingManagerDashboard);

export default router;
