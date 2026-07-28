import { Hono } from 'hono';
import { Env } from '../types/env';
import { zValidator } from '@hono/zod-validator';
import { depositSchema } from '../validators';
import { DepositRepository } from '../repositories/DepositRepository';
import { DepositService } from '../services/TripService';
import { successResponse } from '../utils/response';
import { authMiddleware } from '../middleware/auth';

const router = new Hono<Env>();
router.use('*', authMiddleware);

const getService = (c: any) => new DepositService(new DepositRepository(c.env.DB));

router.get('/', async (c) => c.json(successResponse(await getService(c).getDeposits())));
router.post('/', zValidator('json', depositSchema), async (c) => {
  const user = c.get('user');
  return c.json(successResponse(await getService(c).createDeposit(user.trip_id, c.req.valid('json'))), 201);
});
router.put('/:id', zValidator('json', depositSchema), async (c) => {
  return c.json(successResponse(await getService(c).updateDeposit(c.req.param('id'), c.req.valid('json'))));
});
router.delete('/:id', async (c) => {
  await getService(c).deleteDeposit(c.req.param('id'));
  return c.json(successResponse(null, 'Deleted'));
});
export default router;