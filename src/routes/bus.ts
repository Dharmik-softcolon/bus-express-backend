import { Router } from 'express';
import {
  createBus,
  getAllBuses,
  getBusById,
  updateBus,
  deleteBus,
  getBusesByOperator,
  updateBusStatus,
  getBusStatistics,
} from '../controllers/busController';
import { authenticate, authorize, operatorOrAdmin } from '../middleware/auth';
import { validateRequest, paginationMiddleware } from '../middleware/validation';
import {
  createBusValidation,
  getAllBusesValidation,
  getBusByIdValidation,
  updateBusValidation,
  deleteBusValidation,
  getBusesByOperatorValidation,
  updateBusStatusValidation,
  getBusStatisticsValidation,
} from '../validations/busValidation';

const router = Router();

// Public routes
router.get('/', paginationMiddleware, [...getAllBusesValidation, validateRequest], getAllBuses);
router.get('/:id', [...getBusByIdValidation, validateRequest], getBusById);

// Protected routes
router.use(authenticate);

// Operator/Admin routes
router.post('/', operatorOrAdmin, [...createBusValidation, validateRequest], createBus);

router.put('/:id', operatorOrAdmin, [...updateBusValidation, validateRequest], updateBus);

router.delete('/:id', operatorOrAdmin, [...deleteBusValidation, validateRequest], deleteBus);

router.put('/:id/status', operatorOrAdmin, [...updateBusStatusValidation, validateRequest], updateBusStatus);

router.get('/:id/statistics', operatorOrAdmin, [...getBusStatisticsValidation, validateRequest], getBusStatistics);

// Get buses by operator
router.get('/operator/:operatorId', operatorOrAdmin, paginationMiddleware, [...getBusesByOperatorValidation, validateRequest], getBusesByOperator);

export default router;