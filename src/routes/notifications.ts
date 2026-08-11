import { Hono } from 'hono';
import { Env } from '../types/env';
import { zValidator } from '@hono/zod-validator';
import { telegramNotificationSchema } from '../validators';
import { notificationServiceFromEnv } from '../services/NotificationService';
import { successResponse } from '../utils/response';
import { authMiddleware } from '../middleware/auth';

const router = new Hono<Env>();
router.use('*', authMiddleware);

router.post('/telegram', zValidator('json', telegramNotificationSchema), async (c) => {
  const delivered = await notificationServiceFromEnv(c.env).send(c.req.valid('json'));
  return c.json(successResponse({ delivered }, delivered ? 'Notification forwarded' : 'Notification skipped or failed'));
});

export default router;
