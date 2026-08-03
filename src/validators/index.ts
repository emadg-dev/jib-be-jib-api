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

export const depositSchema = z.object({
  member_id: z.string().min(1, 'Member is required'),
  amount: z.number().positive('Amount must be positive'),
  note: z.string().optional(),
  date: z.string().optional()
});

export const withdrawalSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  category: z.string().min(1, 'Category is required'),
  amount: z.number().positive('Amount must be positive'),
  beneficiaries: z.array(z.object({
    member_id: z.string(),
    share: z.number().nonnegative()
  })).min(1, 'At least one beneficiary is required'),
  date: z.string().optional()
}).refine((data) => {
  const totalShares = data.beneficiaries.reduce((sum, b) => sum + b.share, 0);
  return Math.abs(totalShares - data.amount) < 0.01;
}, { message: 'Sum of shares must equal total amount', path: ['beneficiaries'] });
