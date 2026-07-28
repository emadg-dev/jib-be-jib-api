import { Hono } from 'hono';
import { Env } from '../types/env';
import { DashboardRepository } from '../repositories/DashboardRepository';
import { DashboardService } from '../services/TripService';
import { successResponse } from '../utils/response';
import { authMiddleware } from '../middleware/auth';

const router = new Hono<Env>();
router.use('*', authMiddleware);

router.get('/', async (c) => {
  const service = new DashboardService(new DashboardRepository(c.env.DB));
  return c.json(successResponse(await service.getDashboardData()));
});
export default router;