import { Router } from 'express';
import {
  searchBuses,
  getPopularRoutes,
  getAvailableSeats,
  getTripDetails,
  getSearchSuggestions,
} from '../controllers/searchController';
import { validateRequest } from '../middleware/validation';
import {
  searchBusesValidation,
  getPopularRoutesValidation,
  getAvailableSeatsValidation,
  getTripDetailsValidation,
  getSearchSuggestionsValidation,
} from '../validations/searchValidation';

const router = Router();

// Public search routes
router.get('/buses', [...searchBusesValidation, validateRequest], searchBuses);

router.get('/popular-routes', [...getPopularRoutesValidation, validateRequest], getPopularRoutes);

router.get('/suggestions', [...getSearchSuggestionsValidation, validateRequest], getSearchSuggestions);

router.get('/trips/:tripId/seats', [...getAvailableSeatsValidation, validateRequest], getAvailableSeats);

router.get('/trips/:tripId', [...getTripDetailsValidation, validateRequest], getTripDetails);

export default router;
