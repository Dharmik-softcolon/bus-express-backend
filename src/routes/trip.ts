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
import { authenticate, busOwnerOrBusAdmin } from '../middleware/auth';
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
router.post('/', busOwnerOrBusAdmin, [...createTripValidation, validateRequest], createTrip);

router.get('/', paginationMiddleware, [...getAllTripsValidation, validateRequest], getAllTrips);

router.get('/statistics', busOwnerOrBusAdmin, [...getTripStatisticsValidation, validateRequest], getTripStatistics);

router.get('/:id', [...getTripByIdValidation, validateRequest], getTripById);

router.put('/:id', busOwnerOrBusAdmin, [...updateTripValidation, validateRequest], updateTrip);

router.put('/:id/status', busOwnerOrBusAdmin, [...updateTripStatusValidation, validateRequest], updateTripStatus);

router.delete('/:id', busOwnerOrBusAdmin, [...deleteTripValidation, validateRequest], deleteTrip);

// Additional trip routes
router.get('/route/:routeId', [...getAllTripsValidation, validateRequest], getAllTrips);

router.get('/bus/:busId', [...getAllTripsValidation, validateRequest], getAllTrips);

export default router;
