import { Hono } from 'hono';
import { Env } from '../types/env';
import { zValidator } from '@hono/zod-validator';
import { ratingSchema } from '../validators';
import { RatingRepository } from '../repositories/RatingRepository';
import { MemberRepository } from '../repositories/MemberRepository';
import { RatingService } from '../services/RatingService';
import { successResponse } from '../utils/response';
import { authMiddleware, requireActiveTrip, requireOwner } from '../middleware/auth';
import { notificationServiceFromEnv } from '../services/NotificationService';
import { SettingsService } from '../services/SettingsService';
import { SettingsRepository } from '../repositories/SettingsRepository';
import { DEFAULT_NOTIFICATION_EVENTS } from '../dto/notification.dto';

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

async function sendRatingsReport(db: D1Database, env: Env['Bindings'], trip_id: string) {
  const ratingRepo = new RatingRepository(db);
  const memberRepo = new MemberRepository(db);
  const ratingService = new RatingService(ratingRepo, memberRepo);
  const aggregates = await ratingService.getAggregates(trip_id);

  if (aggregates.length === 0) return;

  const settingsService = new SettingsService(new SettingsRepository(db));
  const settings = await settingsService.getTelegramSettings(trip_id);
  const template = settings?.events?.ratings_report?.message || DEFAULT_NOTIFICATION_EVENTS.ratings_report.message;

  const bar = (val: number) => '★'.repeat(Math.round(val)) + '☆'.repeat(5 - Math.round(val));
  const ratingLines = aggregates.map((a: any, i: number) => {
    return `${i + 1}. ${a.display_name}\n   🧭 Ethics: ${bar(a.ethics_avg)} (${a.ethics_avg.toFixed(1)})\n   🤝 Participation: ${bar(a.participation_avg)} (${a.participation_avg.toFixed(1)})\n   🔄 Flexibility: ${bar(a.flexibility_avg)} (${a.flexibility_avg.toFixed(1)})\n   📊 Overall: ${a.overall_avg.toFixed(1)}/5 (${a.rated_by_count} rater${a.rated_by_count > 1 ? 's' : ''})`;
  });

  const message = template
    .replace('{ratings_list}', ratingLines.join('\n\n'))
    .replace('{rated_count}', String(aggregates.length));

  await notificationServiceFromEnv(env).sendRaw(trip_id, message);
}

router.get('/ratees', async (c) => {
  return c.json(successResponse(await getService(c).getRatees(userId(c), tripId(c))));
});

router.post('/', zValidator('json', ratingSchema), async (c) => {
  const data = c.req.valid('json');
  await getService(c).submitRating(userId(c), tripId(c), data.ratee_id, data.ethics, data.participation, data.flexibility, isOwnerOrAdmin(c));

  c.executionCtx.waitUntil(
    sendRatingsReport(c.env.DB, c.env, tripId(c))
  );

  return c.json(successResponse(null, 'Rating submitted'), 201);
});

router.get('/results', async (c) => {
  return c.json(successResponse(await getService(c).getAggregates(tripId(c))));
});

router.get('/status', async (c) => {
  return c.json(successResponse(await getService(c).getRaterStatus(tripId(c))));
});

router.get('/all', requireOwner, async (c) => {
  return c.json(successResponse(await getService(c).getAllRatings(tripId(c))));
});

export default router;
