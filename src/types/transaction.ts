import { z } from 'zod';

export const TRANSACTION_CATEGORIES = [
  'DirectCost',
  'InventoryRestock',
  'Overhead',
  'Revenue',
  'Personal',
  'OwnerContribution',
  'OwnerWithdrawal',
] as const;
export type TransactionCategory = (typeof TRANSACTION_CATEGORIES)[number];

export const TRANSACTION_STATUSES = ['pending_review', 'approved', 'rejected'] as const;
export type TransactionStatus = (typeof TRANSACTION_STATUSES)[number];

export const TRANSACTION_SOURCES = ['manual', 'ai'] as const;
export type TransactionSource = (typeof TRANSACTION_SOURCES)[number];

export const transactionSchema = z.object({
  id: z.string(),
  vendorName: z.string().min(1, 'Vendor name is required'),
  amountAgora: z.number().int(),
  currency: z.enum(['ILS', 'USD', 'EUR']),
  date: z.date(),
  category: z.enum(TRANSACTION_CATEGORIES),
  workOrderId: z.string().nullable(),
  inventoryItemId: z.string().nullable(),
  status: z.enum(TRANSACTION_STATUSES),
  aiConfidence: z.number().nullable(),
  originalFileUrl: z.string().nullable(),
  source: z.enum(TRANSACTION_SOURCES),
  sourceEmailRef: z.string().nullable().default(null),
  notes: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),

  // --- NEW classification + conversion fields (Story 4.4) ---
  // Defaults absorb pre-Story-4.4 documents that lack these keys entirely.
  suggestedWorkOrderId: z.string().nullable().default(null),
  suggestedInventoryItemId: z.string().nullable().default(null),
  classificationReasoning: z.string().nullable().default(null),
  isEstimatedConversion: z.boolean().default(false),
  conversionRate: z.number().nullable().default(null),
  conversionRateDate: z.string().nullable().default(null),
  conversionRateStale: z.boolean().default(false),
});

export type Transaction = z.infer<typeof transactionSchema>;

// Form input schema — no .default() per Zod 4 learning
// Amount is in display units (e.g., 82.50), NOT agora — converted before saving
export const createTransactionSchema = z.object({
  vendorName: z.string().min(1, 'Vendor name is required'),
  amount: z.number().positive('Amount must be positive'),
  currency: z.enum(['ILS', 'USD', 'EUR']),
  date: z.date(),
  category: z.enum(TRANSACTION_CATEGORIES),
  workOrderId: z.string().nullable(),
  notes: z.string().nullable(),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
