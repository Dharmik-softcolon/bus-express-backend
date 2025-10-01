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
import { authenticate, authorize, busOwnerOrBusAdmin } from '../middleware/auth';
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
router.post('/', busOwnerOrBusAdmin, [...createBusValidation, validateRequest], createBus);

router.put('/:id', busOwnerOrBusAdmin, [...updateBusValidation, validateRequest], updateBus);

router.delete('/:id', busOwnerOrBusAdmin, [...deleteBusValidation, validateRequest], deleteBus);

router.put('/:id/status', busOwnerOrBusAdmin, [...updateBusStatusValidation, validateRequest], updateBusStatus);

router.get('/:id/statistics', busOwnerOrBusAdmin, [...getBusStatisticsValidation, validateRequest], getBusStatistics);

// Get buses by operator
router.get('/operator/:operatorId', busOwnerOrBusAdmin, paginationMiddleware, [...getBusesByOperatorValidation, validateRequest], getBusesByOperator);

export default router;