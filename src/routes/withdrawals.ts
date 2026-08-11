import { Hono } from 'hono';
import { Env } from '../types/env';
import { zValidator } from '@hono/zod-validator';
import { withdrawalSchema } from '../validators';
import { WithdrawalRepository } from '../repositories/WithdrawalRepository';
import { WithdrawalService } from '../services/TripService';
import { successResponse } from '../utils/response';
import { authMiddleware, requireActiveTrip, requireOwner } from '../middleware/auth';
import { notificationServiceFromEnv } from '../services/NotificationService';

const router = new Hono<Env>();
router.use('*', authMiddleware, requireActiveTrip);
const service = (c: any) => new WithdrawalService(new WithdrawalRepository(c.env.DB));
const tripId = (c: any) => c.get('user').trip_id!;
router.get('/', async (c) => c.json(successResponse(await service(c).getWithdrawals(tripId(c)))));
router.post('/', zValidator('json', withdrawalSchema), async (c) => {
  const data = c.req.valid('json');
  const withdrawal = await service(c).createWithdrawal(tripId(c), data);
  c.executionCtx.waitUntil(
    notificationServiceFromEnv(c.env).send({
      event: 'expense_created',
      trip_id: tripId(c),
      title: 'Expense added',
      message: `${data.description} (${data.category}) — ${data.amount}`,
      metadata: {
        description: data.description,
        category: data.category,
        amount: data.amount,
        benefactor_member_ids: data.beneficiaries.map((b: { member_id: string }) => b.member_id)
      }
    })
  );
  return c.json(successResponse(withdrawal), 201);
});
router.put('/:id', requireOwner, zValidator('json', withdrawalSchema), async (c) => c.json(successResponse(await service(c).updateWithdrawal(c.req.param('id'), tripId(c), c.req.valid('json')))));
router.delete('/:id', requireOwner, async (c) => { await service(c).deleteWithdrawal(String(c.req.param('id')), tripId(c)); return c.json(successResponse(null, 'Deleted')); });
export default router;
