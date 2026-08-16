import { Hono } from 'hono';
import { Env } from '../types/env';
import { zValidator } from '@hono/zod-validator';
import { ratingSchema } from '../validators';
import { RatingRepository } from '../repositories/RatingRepository';
import { MemberRepository } from '../repositories/MemberRepository';
import { RatingService } from '../services/RatingService';
import { successResponse } from '../utils/response';
import { authMiddleware, requireActiveTrip } from '../middleware/auth';
import { requirePermission } from '../middleware/permission';

const router = new Hono<Env>();
router.use('*', authMiddleware, requireActiveTrip);

const tripId = (c: any) => c.get('user').trip_id!;
const userId = (c: any) => c.get('user').id!;
const isOwnerOrAdmin = (c: any) => {
  const role = c.get('user').role;
  return role === 'owner' || role === 'admin';
};
const getService = (c: any) => new RatingService(
  new RatingRepository(c.env.DB),
  new MemberRepository(c.env.DB)
);

router.get('/ratees', async (c) => {
  return c.json(successResponse(await getService(c).getRatees(userId(c), tripId(c))));
});

router.post('/', requirePermission('ratings.submit'), zValidator('json', ratingSchema), async (c) => {
  const data = c.req.valid('json');
  await getService(c).submitRating(userId(c), tripId(c), data.ratee_id, data.ethics, data.participation, data.flexibility, isOwnerOrAdmin(c));

  return c.json(successResponse(null, 'Rating submitted'), 201);
});

router.get('/results', async (c) => {
  return c.json(successResponse(await getService(c).getAggregates(tripId(c))));
});

router.get('/status', async (c) => {
  return c.json(successResponse(await getService(c).getRaterStatus(tripId(c))));
});

router.get('/all', async (c) => {
  return c.json(successResponse(await getService(c).getAllRatings(tripId(c))));
});

router.get('/mine', async (c) => {
  return c.json(successResponse(await getService(c).getMyRatings(userId(c), tripId(c))));
});

router.put('/:ratingId', requirePermission('ratings.update'), zValidator('json', ratingSchema), async (c) => {
  const ratingId = c.req.param('ratingId') as string;
  const data = c.req.valid('json');
  await getService(c).updateRating(ratingId, userId(c), tripId(c), data.ratee_id, data.ethics, data.participation, data.flexibility, isOwnerOrAdmin(c));
  return c.json(successResponse(null, 'Rating updated'));
});

router.delete('/:ratingId', requirePermission('ratings.delete'), async (c) => {
  const ratingId = c.req.param('ratingId') as string;
  await getService(c).deleteRating(ratingId, userId(c), tripId(c), isOwnerOrAdmin(c));
  return c.json(successResponse(null, 'Rating deleted'));
});

router.delete('/member/:memberId', requirePermission('ratings.delete'), async (c) => {
  const memberId = c.req.param('memberId') as string;
  await getService(c).deleteByRater(memberId, tripId(c));
  return c.json(successResponse(null, 'All ratings by this member deleted'));
});

export default router;
