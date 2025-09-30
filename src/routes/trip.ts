import { Router } from 'express';
import {
  createTrip,
  getAllTrips,
  getTripById,
  updateTrip,
  deleteTrip,
  updateTripStatus,
  getTripStatistics,
} from '../controllers/tripController';
import { authenticate, operatorOrAdmin } from '../middleware/auth';
import { validateRequest, paginationMiddleware } from '../middleware/validation';
import {
  createTripValidation,
  getAllTripsValidation,
  getTripByIdValidation,
  updateTripValidation,
  deleteTripValidation,
  updateTripStatusValidation,
  getTripStatisticsValidation,
} from '../validations/tripValidation';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Trip management routes
router.post('/', operatorOrAdmin, [...createTripValidation, validateRequest], createTrip);

router.get('/', paginationMiddleware, [...getAllTripsValidation, validateRequest], getAllTrips);

router.get('/statistics', operatorOrAdmin, [...getTripStatisticsValidation, validateRequest], getTripStatistics);

router.get('/:id', [...getTripByIdValidation, validateRequest], getTripById);

router.put('/:id', operatorOrAdmin, [...updateTripValidation, validateRequest], updateTrip);

router.put('/:id/status', operatorOrAdmin, [...updateTripStatusValidation, validateRequest], updateTripStatus);

router.delete('/:id', operatorOrAdmin, [...deleteTripValidation, validateRequest], deleteTrip);

export default router;
