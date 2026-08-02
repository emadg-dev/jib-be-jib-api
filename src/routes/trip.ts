import { Hono } from 'hono';
import { Env } from '../types/env';
import { zValidator } from '@hono/zod-validator';
import { selectTripSchema, tripSchema } from '../validators';
import { TripRepository } from '../repositories/TripRepository';
import { TripService } from '../services/TripService';
import { AuthService } from '../services/AuthService';
import { MemberRepository } from '../repositories/MemberRepository';
import { successResponse } from '../utils/response';
import { authMiddleware, requireActiveTrip, requireOwner } from '../middleware/auth';
import { setCookie } from 'hono/cookie';

const router = new Hono<Env>();
router.use('*', authMiddleware);
const tripService = (c: any) => new TripService(new TripRepository(c.env.DB));

router.get('/available', async (c) => c.json(successResponse(await tripService(c).getTrips(c.get('user').id))));

router.post('/select', zValidator('json', selectTripSchema), async (c) => {
  const result = await new AuthService(new MemberRepository(c.env.DB), new TripRepository(c.env.DB), c.env.JWT_SECRET)
    .selectTrip(c.get('user').id, c.req.valid('json').trip_id);
  setCookie(c, 'auth_token', result.token, { httpOnly: true, secure: true, sameSite: 'Lax', path: '/', maxAge: 60 * 60 * 24 * 7 });
  return c.json(successResponse(result, 'Trip selected'));
});

router.post('/', requireActiveTrip, requireOwner, zValidator('json', tripSchema), async (c) => {
  return c.json(successResponse(await tripService(c).createTrip(c.get('user').id, c.req.valid('json'))), 201);
});

router.get('/', requireActiveTrip, async (c) => {
  return c.json(successResponse(await tripService(c).getTrip(c.get('user').trip_id!)));
});

router.put('/', requireActiveTrip, requireOwner, zValidator('json', tripSchema), async (c) => {
  const data = c.req.valid('json');
  return c.json(successResponse(await tripService(c).updateTrip(c.get('user').trip_id!, data.name, data.currency)));
});

router.delete('/delete/:id', requireOwner, async (c) => {
  await tripService(c).deleteTrip(c.req.param('id')!);
  return c.json(successResponse(null, 'Trip deleted'));
});

export default router;
