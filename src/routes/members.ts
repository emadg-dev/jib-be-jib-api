import { Hono } from 'hono';
import { Env } from '../types/env';
import { zValidator } from '@hono/zod-validator';
import { memberSchema } from '../validators';
import { MemberRepository } from '../repositories/MemberRepository';
import { MemberService } from '../services/TripService';
import { successResponse } from '../utils/response';
import { authMiddleware, requireOwner } from '../middleware/auth';

const router = new Hono<Env>();
router.use('*', authMiddleware);

const getService = (c: any) => new MemberService(new MemberRepository(c.env.DB));

router.get('/', async (c) => c.json(successResponse(await getService(c).getMembers())));
router.get('/:id', async (c) => c.json(successResponse(await getService(c).getMember(c.req.param('id')))));
router.post('/', requireOwner, zValidator('json', memberSchema), async (c) => {
  const user = c.get('user');
  return c.json(successResponse(await getService(c).createMember(user.trip_id, c.req.valid('json'))), 201);
});
router.put('/:id', requireOwner, zValidator('json', memberSchema), async (c) => {
  return c.json(successResponse(await getService(c).updateMember(c.req.param('id'), c.req.valid('json'))));
});
router.delete('/:id', requireOwner, async (c) => {
  await getService(c).deleteMember(String(c.req.param('id')));
  return c.json(successResponse(null, 'Deleted'));
});
export default router;