import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getCustomerDashboard
} from '../controllers/customerController';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Dashboard
router.get('/dashboard', getCustomerDashboard);

export default router;
