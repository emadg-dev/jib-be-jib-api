import { Hono } from 'hono';
import { Env } from '../types/env';
import { zValidator } from '@hono/zod-validator';
import { addMemberToTripSchema, memberSchema } from '../validators';
import { MemberRepository } from '../repositories/MemberRepository';
import { MemberService } from '../services/TripService';
import { successResponse } from '../utils/response';
import { authMiddleware, requireActiveTrip, requireOwner } from '../middleware/auth';

const router = new Hono<Env>();
router.use('*', authMiddleware, requireActiveTrip);
const getService = (c: any) => new MemberService(new MemberRepository(c.env.DB));
const tripId = (c: any) => c.get('user').trip_id!;

router.get('/', async (c) => c.json(successResponse(await getService(c).getMembers(tripId(c)))));
router.post('/add', requireOwner, zValidator('json', addMemberToTripSchema), async (c) => {
  return c.json(successResponse(await getService(c).addMemberToTrip(tripId(c), c.req.valid('json'))), 201);
});
router.get('/:id', async (c) => c.json(successResponse(await getService(c).getMember(c.req.param('id'), tripId(c)))));
router.post('/', requireOwner, zValidator('json', memberSchema), async (c) => {
  return c.json(successResponse(await getService(c).createMember(tripId(c), c.req.valid('json'))), 201);
});
router.put('/:id', requireOwner, zValidator('json', memberSchema), async (c) => {
  return c.json(successResponse(await getService(c).updateMember(c.req.param('id'), tripId(c), c.req.valid('json'))));
});
router.delete('/:id', requireOwner, async (c) => {
  await getService(c).deleteMember(String(c.req.param('id')), tripId(c));
  return c.json(successResponse(null, 'Removed from trip'));
});
export default router;
