import { Hono } from 'hono';
import { Env } from '../types/env';
import { zValidator } from '@hono/zod-validator';
import { withdrawalSchema } from '../validators';
import { WithdrawalRepository } from '../repositories/WithdrawalRepository';
import { WithdrawalService } from '../services/TripService';
import { successResponse } from '../utils/response';
import { authMiddleware } from '../middleware/auth';

const router = new Hono<Env>();
router.use('*', authMiddleware);

const getService = (c: any) => new WithdrawalService(new WithdrawalRepository(c.env.DB));

router.get('/', async (c) => c.json(successResponse(await getService(c).getWithdrawals())));
router.post('/', zValidator('json', withdrawalSchema), async (c) => {
  const user = c.get('user');
  return c.json(successResponse(await getService(c).createWithdrawal(user.trip_id, c.req.valid('json'))), 201);
});
router.put('/:id', zValidator('json', withdrawalSchema), async (c) => {
  return c.json(successResponse(await getService(c).updateWithdrawal(c.req.param('id'), c.req.valid('json'))));
});
router.delete('/:id', async (c) => {
  await getService(c).deleteWithdrawal(c.req.param('id'));
  return c.json(successResponse(null, 'Deleted'));
});
export default router;