import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getBusEmployeeDashboard
} from '../controllers/busEmployeeController';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Dashboard
router.get('/dashboard', getBusEmployeeDashboard);

export default router;
