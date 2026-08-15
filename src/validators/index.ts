import { z } from 'zod';

export const loginSchema = z.object({
  name: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required')
});

export const tripSchema = z.object({
  name: z.string().min(1, 'Trip name is required'),
  currency: z.string().length(3, 'Currency must be 3 letters').default('USD')
});

export const selectTripSchema = z.object({
  trip_id: z.string().min(1, 'Trip is required')
});

export const memberSchema = z.object({
  name: z.string().min(1, 'Username is required'),
  display_name: z.string().min(1, 'Display name is required'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  role: z.enum(['owner', 'member']).default('member'),
  active: z.boolean().default(true)
});

export const addMemberToTripSchema = z.object({
  member_id: z.string().min(1, 'Member is required'),
  role: z.enum(['owner', 'member']).default('member'),
  active: z.boolean().default(true)
});

export const changePasswordSchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password: z.string().min(6, 'New password must be at least 6 characters')
});

export const preferencesSchema = z.record(z.string(), z.union([z.string(), z.boolean()]));

export const avatarSchema = z.object({
  avatar: z.union([
    z.string().startsWith('data:image/', 'Avatar must be an image data URL').max(200000, 'Avatar is too large'),
    z.literal('')
  ])
});

export const displayNameSchema = z.object({
  display_name: z.string().min(1, 'Name is required').max(50, 'Name is too long')
});

export const depositSchema = z.object({
  member_id: z.string().min(1, 'Member is required'),
  amount: z.number().positive('Amount must be positive'),
  note: z.string().optional(),
  date: z.string().optional()
});

export const telegramNotificationSchema = z.object({
  event: z.enum(['trip_created', 'trip_updated', 'member_added', 'deposit_created', 'expense_created', 'rating_submitted', 'settlement_recorded', 'members_report', 'bank_stats_report', 'settlements_report', 'ratings_report']),
  title: z.string().min(1, 'Title is required'),
  message: z.string().min(1, 'Message is required'),
  metadata: z.record(z.string(), z.unknown()).default({})
});

export const telegramTestSchema = z.object({
  chat_id: z.string().min(1, 'Chat ID is required'),
  title: z.string().optional(),
  message: z.string().min(1, 'Message is required')
});

export const telegramSettingsSchema = z.object({
  telegram_enabled: z.boolean(),
  telegram_chat_id: z.string().optional(),
  events: z.record(
    z.enum(['trip_created', 'trip_updated', 'member_added', 'deposit_created', 'expense_created', 'rating_submitted', 'settlement_recorded', 'members_report', 'bank_stats_report', 'settlements_report', 'ratings_report']),
    z.object({
      enabled: z.boolean().optional(),
      message: z.string().optional()
    })
  ).optional()
});

export const withdrawalSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  category: z.string().min(1, 'Category is required'),
  amount: z.number().positive('Amount must be positive'),
  paid_by: z.string().nullable().optional(),
  beneficiaries: z.array(z.object({
    member_id: z.string(),
    share: z.number().nonnegative()
  })).min(1, 'At least one beneficiary is required'),
  date: z.string().optional()
}).refine((data) => {
  const totalShares = data.beneficiaries.reduce((sum, b) => sum + b.share, 0);
  return Math.abs(totalShares - data.amount) < 0.01;
}, { message: 'Sum of shares must equal total amount', path: ['beneficiaries'] });

export const ratingSchema = z.object({
  ratee_id: z.string().min(1, 'Member is required'),
  ethics: z.number().int().min(1).max(5),
  participation: z.number().int().min(1).max(5),
  flexibility: z.number().int().min(1).max(5),
});

export const settlementSchema = z.object({
  member_id: z.string().min(1, 'Member is required'),
  amount: z.number().positive('Amount must be positive'),
  note: z.string().optional(),
  date: z.string().optional()
});

export const telegramSendSchema = z.object({
  message: z.string().min(1, 'Message is required'),
});
