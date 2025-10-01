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
import { authenticate, busAdminOnly } from '../middleware/auth';
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
router.post('/', busAdminOnly, [...createRouteValidation, validateRequest], createRoute);

router.put('/:id', busAdminOnly, [...updateRouteValidation, validateRequest], updateRoute);

router.delete('/:id', busAdminOnly, [...deleteRouteValidation, validateRequest], deleteRoute);

router.put('/:id/status', busAdminOnly, [...updateRouteStatusValidation, validateRequest], updateRouteStatus);

router.post('/:id/stops', busAdminOnly, [...addStopToRouteValidation, validateRequest], addStopToRoute);

router.delete('/:id/stops', busAdminOnly, [...removeStopFromRouteValidation, validateRequest], removeStopFromRoute);

export default router;