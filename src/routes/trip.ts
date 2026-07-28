import { Hono } from 'hono';
import { Env } from '../types/env';
import { zValidator } from '@hono/zod-validator';
import { tripSchema } from '../validators';
import { TripRepository } from '../repositories/TripRepository';
import { TripService } from '../services/TripService';
import { successResponse } from '../utils/response';
import { authMiddleware, requireOwner } from '../middleware/auth';

const router = new Hono<Env>();
router.use('*', authMiddleware);

router.get('/', async (c) => {
  const service = new TripService(new TripRepository(c.env.DB));
  return c.json(successResponse(await service.getTrip()));
});

router.put('/', requireOwner, zValidator('json', tripSchema), async (c) => {
  const data = c.req.valid('json');
  const user = c.get('user');
  const service = new TripService(new TripRepository(c.env.DB));
  return c.json(successResponse(await service.updateTrip(user.trip_id, data.name, data.currency)));
});

export default router;