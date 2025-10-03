import { Router } from 'express';
import {
  createRoute,
  getAllRoutes,
  getRouteById,
  updateRoute,
  deleteRoute,
  searchRoutes,
  getPopularRoutes,
  addPickupPoint,
  removePickupPoint,
  addDropPoint,
  removeDropPoint,
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
  addPickupPointValidation,
  removePickupPointValidation,
  addDropPointValidation,
  removeDropPointValidation,
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

router.post('/:id/pickup-points', busOwnerOrBusAdmin, [...addPickupPointValidation, validateRequest], addPickupPoint);

router.delete('/:id/pickup-points', busOwnerOrBusAdmin, [...removePickupPointValidation, validateRequest], removePickupPoint);

router.post('/:id/drop-points', busOwnerOrBusAdmin, [...addDropPointValidation, validateRequest], addDropPoint);

router.delete('/:id/drop-points', busOwnerOrBusAdmin, [...removeDropPointValidation, validateRequest], removeDropPoint);

export default router;