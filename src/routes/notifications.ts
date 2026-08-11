import { Hono } from 'hono';
import { Env } from '../types/env';
import { zValidator } from '@hono/zod-validator';
import { telegramNotificationSchema, telegramSettingsSchema, telegramTestSchema } from '../validators';
import { notificationServiceFromEnv } from '../services/NotificationService';
import { SettingsService } from '../services/SettingsService';
import { SettingsRepository } from '../repositories/SettingsRepository';
import { successResponse } from '../utils/response';
import { authMiddleware, requireActiveTrip, requireOwner } from '../middleware/auth';

const router = new Hono<Env>();
router.use('*', authMiddleware, requireActiveTrip);

const settingsService = (c: any) => new SettingsService(new SettingsRepository(c.env.DB));
const tripId = (c: any) => c.get('user').trip_id!;

router.get('/settings', async (c) => c.json(successResponse(await settingsService(c).getTelegramSettings(tripId(c)))));

router.put('/settings', requireOwner, zValidator('json', telegramSettingsSchema), async (c) => {
  const settings = await settingsService(c).updateTelegramSettings(tripId(c), c.req.valid('json'));
  return c.json(successResponse(settings, 'Telegram settings updated'));
});

router.post('/telegram', zValidator('json', telegramNotificationSchema), async (c) => {
  const data = c.req.valid('json');
  const delivered = await notificationServiceFromEnv(c.env).send({
    event: data.event,
    trip_id: tripId(c),
    title: data.title,
    message: data.message,
    metadata: data.metadata
  });
  return c.json(successResponse({ delivered }, delivered ? 'Notification forwarded' : 'Notification skipped or failed'));
});

router.post('/telegram/test', zValidator('json', telegramTestSchema), async (c) => {
  const data = c.req.valid('json');
  const delivered = await notificationServiceFromEnv(c.env).sendTest(data.chat_id, data.title ?? 'Test notification', data.message);
  return c.json(successResponse({ delivered }, delivered ? 'Test notification sent' : 'Test notification failed'));
});

export default router;
