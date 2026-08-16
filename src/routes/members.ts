import { Hono } from 'hono';
import { Env } from '../types/env';
import { zValidator } from '@hono/zod-validator';
import { addMemberToTripSchema, memberSchema } from '../validators';
import { MemberRepository } from '../repositories/MemberRepository';
import { MemberService } from '../services/TripService';
import { successResponse } from '../utils/response';
import { authMiddleware, requireActiveTrip } from '../middleware/auth';
import { requirePermission } from '../middleware/permission';
import { notificationServiceFromEnv } from '../services/NotificationService';

const router = new Hono<Env>();
router.use('*', authMiddleware, requireActiveTrip);
const getService = (c: any) => new MemberService(new MemberRepository(c.env.DB));
const tripId = (c: any) => c.get('user').trip_id!;

router.get('/', async (c) => c.json(successResponse(await getService(c).getMembers(tripId(c)))));
router.post('/add', requirePermission('member.create'), zValidator('json', addMemberToTripSchema), async (c) => {
  const member = await getService(c).addMemberToTrip(tripId(c), c.req.valid('json'));
  c.executionCtx.waitUntil(
    notificationServiceFromEnv(c.env).send({
      event: 'member_added',
      trip_id: tripId(c),
      title: 'New member added',
      message: `${(member as any)?.display_name} joined the trip`,
      metadata: { member_id: (member as any)?.id }
    })
  );
  return c.json(successResponse(member), 201);
});
router.get('/:id', async (c) => c.json(successResponse(await getService(c).getMember(c.req.param('id'), tripId(c)))));
router.post('/', requirePermission('member.create'), zValidator('json', memberSchema), async (c) => {
  const member = await getService(c).createMember(tripId(c), c.req.valid('json'));
  c.executionCtx.waitUntil(
    notificationServiceFromEnv(c.env).send({
      event: 'member_added',
      trip_id: tripId(c),
      title: 'New member added',
      message: `${(member as any)?.display_name} joined the trip`,
      metadata: { member_id: (member as any)?.id }
    })
  );
  return c.json(successResponse(member), 201);
});
router.put('/:id', requirePermission('member.update'), zValidator('json', memberSchema), async (c) => {
  return c.json(successResponse(await getService(c).updateMember(c.req.param('id'), tripId(c), c.req.valid('json'))));
});
router.delete('/:id', requirePermission('member.delete'), async (c) => {
  await getService(c).deleteMember(String(c.req.param('id')), tripId(c));
  return c.json(successResponse(null, 'Removed from trip'));
});
export default router;
