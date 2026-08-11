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
import { notificationServiceFromEnv } from '../services/NotificationService';

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

router.post('/', zValidator('json', tripSchema), async (c) => {
  const data = c.req.valid('json');
  const trip = await tripService(c).createTrip(c.get('user').id, data);
  c.executionCtx.waitUntil(
    notificationServiceFromEnv(c.env).send({
      event: 'trip_created',
      trip_id: (trip as any)?.id,
      title: 'Trip created',
      message: `Trip "${data.name}" was created`,
      metadata: { name: data.name, currency: data.currency }
    })
  );
  return c.json(successResponse(trip), 201);
});

router.get('/', requireActiveTrip, async (c) => {
  return c.json(successResponse(await tripService(c).getTrip(c.get('user').trip_id!)));
});

router.put('/:id', requireOwner, zValidator('json', tripSchema), async (c) => {
  const data = c.req.valid('json');
  const tripId = c.req.param('id');
  const user = c.get('user');
  if (user.role !== 'admin') {
    const membership = await c.env.DB.prepare(
      'SELECT role FROM MemberTrips WHERE member_id = ? AND trip_id = ? AND active = 1'
    ).bind(user.id, tripId).first<{ role: string }>();
    if (!membership || membership.role !== 'owner') {
      return c.json({ success: false, error: 'Forbidden: Requires owner role in this trip' }, 403);
    }
  }
  const updated = await tripService(c).updateTrip(tripId, data.name, data.currency);
  c.executionCtx.waitUntil(
    notificationServiceFromEnv(c.env).send({
      event: 'trip_updated',
      trip_id: tripId,
      title: 'Trip updated',
      message: `Trip "${data.name}" was updated`,
      metadata: { name: data.name, currency: data.currency }
    })
  );
  return c.json(successResponse(updated));
});

router.delete('/delete/:id', requireOwner, async (c) => {
  await tripService(c).deleteTrip(c.req.param('id')!);
  return c.json(successResponse(null, 'Trip deleted'));
});

export default router;
