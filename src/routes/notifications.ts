import { Hono } from 'hono';
import { Env } from '../types/env';
import { zValidator } from '@hono/zod-validator';
import { telegramNotificationSchema, telegramSettingsSchema, telegramTestSchema, telegramSendSchema } from '../validators';
import { notificationServiceFromEnv } from '../services/NotificationService';
import { SettingsService } from '../services/SettingsService';
import { SettingsRepository } from '../repositories/SettingsRepository';
import { DashboardRepository } from '../repositories/DashboardRepository';
import { SettlementRepository } from '../repositories/SettlementRepository';
import { RatingRepository } from '../repositories/RatingRepository';
import { DashboardService } from '../services/TripService';
import { RatingService } from '../services/RatingService';
import { successResponse } from '../utils/response';
import { authMiddleware, requireActiveTrip } from '../middleware/auth';
import { requirePermission } from '../middleware/permission';
import { DEFAULT_NOTIFICATION_EVENTS } from '../dto/notification.dto';

const router = new Hono<Env>();
router.use('*', authMiddleware, requireActiveTrip);

const settingsService = (c: any) => new SettingsService(new SettingsRepository(c.env.DB));
const tripId = (c: any) => c.get('user').trip_id!;

const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

router.get('/settings', async (c) => c.json(successResponse(await settingsService(c).getTelegramSettings(tripId(c)))));

router.put('/settings', requirePermission('notifications.manage'), zValidator('json', telegramSettingsSchema), async (c) => {
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

router.post('/telegram/send', requirePermission('notifications.send'), zValidator('json', telegramSendSchema), async (c) => {
  const { message } = c.req.valid('json');
  const delivered = await notificationServiceFromEnv(c.env).sendRaw(tripId(c), message);
  return c.json(successResponse({ delivered }, delivered ? 'Message sent' : 'Failed to send message'));
});

router.post('/telegram/members', requirePermission('notifications.send'), async (c) => {
  const db = c.env.DB;
  const dashboardRepo = new DashboardRepository(db);
  const settlementRepo = new SettlementRepository(db);
  const dashboardService = new DashboardService(dashboardRepo, settlementRepo);
  const data = await dashboardService.getDashboardData(tripId(c));

  const memberLines = data.members.map((m: any, i: number) => {
    const status = m.balance >= 0 ? '✅' : '⚠️';
    const bal = `${m.balance < 0 ? '-' : '+'}${fmt(m.balance)}`;
    const settledLine = m.total_settled > 0 ? `\n   ✅ Settled: ${fmt(m.total_settled)}` : '';
    return `${status} ${i + 1}. ${m.display_name || m.name}\n   💰 Deposited: ${fmt(m.total_deposited)}\n   🛒 Spent: ${fmt(m.total_expenses)}${settledLine}\n   📊 Balance: ${bal}`;
  });

  const settings = await settingsService(c).getTelegramSettings(tripId(c));
  const template = settings?.events?.members_report?.message || DEFAULT_NOTIFICATION_EVENTS.members_report.message;

  const message = template
    .replace('{members_list}', memberLines.join('\n\n'))
    .replace('{bank_balance}', fmt(data.currentBankBalance));

  const delivered = await notificationServiceFromEnv(c.env).sendRaw(tripId(c), message);
  return c.json(successResponse({ delivered }, delivered ? 'Member breakdown sent' : 'Failed to send'));
});

router.post('/telegram/bank-stats', requirePermission('notifications.send'), async (c) => {
  const db = c.env.DB;
  const dashboardRepo = new DashboardRepository(db);
  const settlementRepo = new SettlementRepository(db);
  const dashboardService = new DashboardService(dashboardRepo, settlementRepo);
  const data = await dashboardService.getDashboardData(tripId(c));

  const positive = data.members.filter((m: any) => m.balance > 0);
  const negative = data.members.filter((m: any) => m.balance < 0);

  const settings = await settingsService(c).getTelegramSettings(tripId(c));
  const template = settings?.events?.bank_stats_report?.message || DEFAULT_NOTIFICATION_EVENTS.bank_stats_report.message;

  const message = template
    .replace('{bank_balance}', fmt(data.currentBankBalance))
    .replace('{total_deposits}', fmt(data.totalDeposits))
    .replace('{total_expenses}', fmt(data.totalWithdrawals))
    .replace('{settled_line}', data.totalSettled > 0 ? `✅ Total Settled: ${fmt(data.totalSettled)}` : '')
    .replace('{member_count}', String(data.members.length))
    .replace('{creditors_line}', positive.length > 0 ? `💚 Creditors: ${positive.map((m: any) => `${m.display_name || m.name} (+${fmt(Math.abs(m.balance))})`).join(', ')}` : '')
    .replace('{debtors_line}', negative.length > 0 ? `🔴 Debtors: ${negative.map((m: any) => `${m.display_name || m.name} (-${fmt(Math.abs(m.balance))})`).join(', ')}` : '');

  const delivered = await notificationServiceFromEnv(c.env).sendRaw(tripId(c), message);
  return c.json(successResponse({ delivered }, delivered ? 'Bank stats sent' : 'Failed to send'));
});

router.post('/telegram/ratings', requirePermission('notifications.send'), async (c) => {
  const db = c.env.DB;
  const ratingRepo = new RatingRepository(db);
  const ratingService = new RatingService(ratingRepo, new (await import('../repositories/MemberRepository')).MemberRepository(db));
  const aggregates = await ratingService.getAggregates(tripId(c));

  if (aggregates.length === 0) {
    return c.json(successResponse({ delivered: false }, 'No ratings submitted yet'));
  }

  const bar = (val: number) => '★'.repeat(Math.round(val)) + '☆'.repeat(5 - Math.round(val));
  const ratingLines = aggregates.map((a: any, i: number) => {
    return `${i + 1}. ${a.display_name}\n   🧭 Ethics: ${bar(a.ethics_avg)} (${a.ethics_avg.toFixed(1)})\n   🤝 Participation: ${bar(a.participation_avg)} (${a.participation_avg.toFixed(1)})\n   🔄 Flexibility: ${bar(a.flexibility_avg)} (${a.flexibility_avg.toFixed(1)})\n   📊 Overall: ${a.overall_avg.toFixed(1)}/5 (${a.rated_by_count} rater${a.rated_by_count > 1 ? 's' : ''})`;
  });

  const settings = await settingsService(c).getTelegramSettings(tripId(c));
  const template = settings?.events?.ratings_report?.message || DEFAULT_NOTIFICATION_EVENTS.ratings_report.message;

  const message = template
    .replace('{ratings_list}', ratingLines.join('\n\n'))
    .replace('{rated_count}', String(aggregates.length));

  const delivered = await notificationServiceFromEnv(c.env).sendRaw(tripId(c), message);
  return c.json(successResponse({ delivered }, delivered ? 'Ratings sent' : 'Failed to send'));
});

router.post('/telegram/settlements', requirePermission('notifications.send'), async (c) => {
  const db = c.env.DB;
  const settlementRepo = new SettlementRepository(db);
  const settlements = await settlementRepo.findAll(tripId(c));

  if (settlements.length === 0) {
    return c.json(successResponse({ delivered: false }, 'No settlements recorded yet'));
  }

  const settlementLines = settlements.map((s: any, i: number) => {
    const dateStr = s.date || s.created_at?.slice(0, 10) || '';
    const noteStr = s.note ? ` (${s.note})` : '';
    return `${i + 1}. ✅ ${s.member_name} — ${fmt(s.amount)}${noteStr}\n   📅 ${dateStr}`;
  });

  const totalSettled = settlements.reduce((sum: number, s: any) => sum + s.amount, 0);

  const settings = await settingsService(c).getTelegramSettings(tripId(c));
  const template = settings?.events?.settlements_report?.message || DEFAULT_NOTIFICATION_EVENTS.settlements_report.message;

  const message = template
    .replace('{settlements_list}', settlementLines.join('\n\n'))
    .replace('{total_settled}', fmt(totalSettled))
    .replace('{settlement_count}', String(settlements.length));

  const delivered = await notificationServiceFromEnv(c.env).sendRaw(tripId(c), message);
  return c.json(successResponse({ delivered }, delivered ? 'Settlements sent' : 'Failed to send'));
});

export default router;
