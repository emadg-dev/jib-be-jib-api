import { Hono } from 'hono';
import { Env } from '../types/env';
import { SettingsRepository } from '../repositories/SettingsRepository';
import { DashboardRepository } from '../repositories/DashboardRepository';
import { MemberRepository } from '../repositories/MemberRepository';
import { WithdrawalRepository } from '../repositories/WithdrawalRepository';
import { TripRepository } from '../repositories/TripRepository';
import { DashboardService } from '../services/TripService';
import { successResponse, errorResponse } from '../utils/response';

const router = new Hono<Env>();

router.use('*', async (c, next) => {
  const authHeader = c.req.header('Authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token || token !== c.env.API_SECRET) {
    return c.json(errorResponse('Unauthorized'), 401);
  }
  await next();
});

router.use('*', async (c, next) => {
  const chatId = String(c.req.param('chatId') || '');
  const settingsRepo = new SettingsRepository(c.env.DB);
  const match = await settingsRepo.findByTelegramChatId(chatId);

  if (!match) {
    return c.json(errorResponse('Chat not linked to any trip or notifications disabled'), 404);
  }

  c.set('telegramContext', { trip_id: match.trip_id, chat_id: match.telegram_chat_id });
  await next();
});

router.get('/:chatId/balance', async (c) => {
  const { trip_id } = c.get('telegramContext');
  const tripRepo = new TripRepository(c.env.DB);
  const dashboardRepo = new DashboardRepository(c.env.DB);
  const dashboardService = new DashboardService(dashboardRepo);
  const [data, trip] = await Promise.all([
    dashboardService.getDashboardData(trip_id),
    tripRepo.findById(trip_id),
  ]);

  return c.json(successResponse({
    trip_id,
    trip_name: trip?.name,
    currency: trip?.currency,
    bank_balance: data.currentBankBalance,
    total_deposits: data.totalDeposits,
    total_expenses: data.totalWithdrawals,
  }));
});

router.get('/:chatId/expenses', async (c) => {
  const { trip_id } = c.get('telegramContext');
  const tripRepo = new TripRepository(c.env.DB);
  const withdrawalRepo = new WithdrawalRepository(c.env.DB);
  const [withdrawals, trip] = await Promise.all([
    withdrawalRepo.findAll(trip_id),
    tripRepo.findById(trip_id),
  ]);

  return c.json(successResponse({
    trip_id,
    trip_name: trip?.name,
    currency: trip?.currency,
    expenses: withdrawals.map((w: any) => ({
      id: w.id,
      description: w.description,
      category: w.category,
      amount: w.amount,
      date: w.date,
      beneficiaries: (w.beneficiaries || []).map((b: any) => ({
        name: b.member_name,
        share: b.share,
      })),
    })),
  }));
});

router.get('/:chatId/members', async (c) => {
  const { trip_id } = c.get('telegramContext');
  const memberRepo = new MemberRepository(c.env.DB);
  const members = await memberRepo.findAll(trip_id);

  return c.json(successResponse({
    trip_id,
    members: members.map((m: any) => ({
      id: m.id,
      name: m.display_name,
      role: m.role,
      active: Boolean(m.active),
    })),
  }));
});

router.get('/:chatId/summary', async (c) => {
  const { trip_id } = c.get('telegramContext');
  const tripRepo = new TripRepository(c.env.DB);
  const dashboardRepo = new DashboardRepository(c.env.DB);
  const dashboardService = new DashboardService(dashboardRepo);
  const [data, trip] = await Promise.all([
    dashboardService.getDashboardData(trip_id),
    tripRepo.findById(trip_id),
  ]);

  return c.json(successResponse({
    trip_id,
    trip_name: trip?.name,
    currency: trip?.currency,
    bank_balance: data.currentBankBalance,
    total_deposits: data.totalDeposits,
    total_expenses: data.totalWithdrawals,
    member_count: data.members.length,
    categories: data.categories,
  }));
});

export default router;
