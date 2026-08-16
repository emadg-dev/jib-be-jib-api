import { Hono } from 'hono';
import { Env } from '../types/env';
import { zValidator } from '@hono/zod-validator';
import { depositSchema } from '../validators';
import { DepositRepository } from '../repositories/DepositRepository';
import { DepositService } from '../services/TripService';
import { successResponse } from '../utils/response';
import { authMiddleware, requireActiveTrip } from '../middleware/auth';
import { requirePermission } from '../middleware/permission';
import { notificationServiceFromEnv } from '../services/NotificationService';

const router = new Hono<Env>();
router.use('*', authMiddleware, requireActiveTrip);
const service = (c: any) => new DepositService(new DepositRepository(c.env.DB));
const tripId = (c: any) => c.get('user').trip_id!;
router.get('/', async (c) => c.json(successResponse(await service(c).getDeposits(tripId(c)))));
router.post('/', requirePermission('deposit.create'), zValidator('json', depositSchema), async (c) => {
  const data = c.req.valid('json');
  const deposit = await service(c).createDeposit(tripId(c), data);
  c.executionCtx.waitUntil(
    notificationServiceFromEnv(c.env).send({
      event: 'deposit_created',
      trip_id: tripId(c),
      title: 'Deposit added',
      message: `Deposit of ${data.amount} was recorded`,
      metadata: { member_id: data.member_id, amount: data.amount }
    })
  );
  return c.json(successResponse(deposit), 201);
});
router.put('/:id', requirePermission('deposit.update'), zValidator('json', depositSchema), async (c) => c.json(successResponse(await service(c).updateDeposit(c.req.param('id'), tripId(c), c.req.valid('json')))));
router.delete('/:id', requirePermission('deposit.delete'), async (c) => { await service(c).deleteDeposit(String(c.req.param('id')), tripId(c)); return c.json(successResponse(null, 'Deleted')); });
export default router;
