import { Hono } from 'hono';
import { Env } from '../types/env';
import { zValidator } from '@hono/zod-validator';
import { settlementSchema } from '../validators';
import { SettlementRepository } from '../repositories/SettlementRepository';
import { SettlementService } from '../services/TripService';
import { successResponse } from '../utils/response';
import { authMiddleware, requireActiveTrip, requireOwner } from '../middleware/auth';
import { notificationServiceFromEnv } from '../services/NotificationService';

const router = new Hono<Env>();
router.use('*', authMiddleware, requireActiveTrip);
const service = (c: any) => new SettlementService(new SettlementRepository(c.env.DB));
const tripId = (c: any) => c.get('user').trip_id!;

router.get('/', requireOwner, async (c) => c.json(successResponse(await service(c).getSettlements(tripId(c)))));
router.post('/', requireOwner, zValidator('json', settlementSchema), async (c) => {
  const data = c.req.valid('json');
  const settlement = await service(c).createSettlement(tripId(c), data);

  c.executionCtx.waitUntil(
    notificationServiceFromEnv(c.env).send({
      event: 'settlement_recorded',
      trip_id: tripId(c),
      title: 'Settlement recorded',
      message: `{member_name} settled ${data.amount}.`,
      metadata: { member_id: data.member_id, amount: data.amount },
    })
  );

  return c.json(successResponse(settlement), 201);
});
router.put('/:id', requireOwner, zValidator('json', settlementSchema), async (c) => c.json(successResponse(await service(c).updateSettlement(c.req.param('id'), tripId(c), c.req.valid('json')))));
router.delete('/:id', requireOwner, async (c) => { await service(c).deleteSettlement(String(c.req.param('id')), tripId(c)); return c.json(successResponse(null, 'Deleted')); });

export default router;
