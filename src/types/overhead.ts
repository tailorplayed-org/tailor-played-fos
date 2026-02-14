import { z } from 'zod';

export const OVERHEAD_CATEGORIES = ['subscriptions', 'software', 'meals', 'office', 'general'] as const;
export const OVERHEAD_RECURRENCE = ['one_time', 'monthly', 'yearly'] as const;
export const OVERHEAD_SOURCE = ['manual', 'ai'] as const;

export const overheadSchema = z.object({
  id: z.string(),
  category: z.enum(OVERHEAD_CATEGORIES),
  amountAgora: z.number().int(),
  currency: z.enum(['ILS', 'USD', 'EUR']).default('ILS'),
  date: z.date(),
  description: z.string().nullable().default(null),
  recurrence: z.enum(OVERHEAD_RECURRENCE).default('one_time'),
  source: z.enum(OVERHEAD_SOURCE),
  transactionId: z.string().nullable().default(null),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Overhead = z.infer<typeof overheadSchema>;

export const createOverheadSchema = z.object({
  category: z.enum(OVERHEAD_CATEGORIES, { error: 'Category is required' }),
  amountIls: z.number().positive({ error: 'Amount must be greater than 0' }),
  date: z.string().min(1, { error: 'Date is required' }),
  description: z.string().default(''),
  recurrence: z.enum(OVERHEAD_RECURRENCE),
});

export type CreateOverheadInput = z.infer<typeof createOverheadSchema>;
