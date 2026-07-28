import { Hono } from 'hono';
import { Env } from '../types/env';
import { DashboardRepository } from '../repositories/DashboardRepository';
import { DashboardService } from '../services/TripService';
import { successResponse } from '../utils/response';
import { authMiddleware, requireActiveTrip } from '../middleware/auth';

const router = new Hono<Env>();
router.use('*', authMiddleware, requireActiveTrip);
router.get('/', async (c) => {
  const result = await new DashboardService(new DashboardRepository(c.env.DB)).getDashboardData(c.get('user').trip_id!);
  return c.json(successResponse(result));
});
export default router;
