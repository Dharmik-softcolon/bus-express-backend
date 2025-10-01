import { Router } from 'express';
import {
  createRoute,
  getAllRoutes,
  getRouteById,
  updateRoute,
  deleteRoute,
  searchRoutes,
  getPopularRoutes,
  addStopToRoute,
  removeStopFromRoute,
  updateRouteStatus,
} from '../controllers/routeController';
import { authenticate, busAdminOnly, busOwnerOrBusAdmin } from '../middleware/auth';
import { validateRequest, paginationMiddleware } from '../middleware/validation';
import {
  createRouteValidation,
  getAllRoutesValidation,
  getRouteByIdValidation,
  updateRouteValidation,
  deleteRouteValidation,
  searchRoutesValidation,
  getPopularRoutesValidation,
  addStopToRouteValidation,
  removeStopFromRouteValidation,
  updateRouteStatusValidation,
} from '../validations/routeValidation';

const router = Router();

// Public routes
router.get('/', paginationMiddleware, [...getAllRoutesValidation, validateRequest], getAllRoutes);
router.get('/search', [...searchRoutesValidation, validateRequest], searchRoutes);
router.get('/popular', [...getPopularRoutesValidation, validateRequest], getPopularRoutes);
router.get('/:id', [...getRouteByIdValidation, validateRequest], getRouteById);

// Protected routes
router.use(authenticate);

// Admin only routes
router.post('/', busOwnerOrBusAdmin, [...createRouteValidation, validateRequest], createRoute);

router.put('/:id', busOwnerOrBusAdmin, [...updateRouteValidation, validateRequest], updateRoute);

router.delete('/:id', busOwnerOrBusAdmin, [...deleteRouteValidation, validateRequest], deleteRoute);

router.put('/:id/status', busOwnerOrBusAdmin, [...updateRouteStatusValidation, validateRequest], updateRouteStatus);

router.post('/:id/stops', busOwnerOrBusAdmin, [...addStopToRouteValidation, validateRequest], addStopToRoute);

router.delete('/:id/stops', busOwnerOrBusAdmin, [...removeStopFromRouteValidation, validateRequest], removeStopFromRoute);

export default router;