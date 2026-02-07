import { z } from 'zod';

export const DESIGNATED_MAILBOXES = [
  'orders',
  'supplies',
  'developing',
  'expenses',
] as const;

export const EMAIL_STATUSES = [
  'received',
  'processing',
  'processed',
  'unprocessed',
  'failed',
] as const;

// Server-side schema: uses z.any() for Firestore Timestamps
// (Firestore Admin SDK returns Timestamp objects, not JS Dates)
export const emailLogSchema = z.object({
  messageId: z.string(),
  mailbox: z.enum(DESIGNATED_MAILBOXES),
  receivedAt: z.any(), // Firestore Timestamp
  status: z.enum(EMAIL_STATUSES),
  attachmentUrls: z.array(z.string()),
  subject: z.string(),
  from: z.string(),
  transactionId: z.string().nullable(),
  errorMessage: z.string().nullable(),
  paperlessForwarded: z.boolean(), // Tracks Paperless forwarding status (FR42/FR43/FR44)
});

export type EmailLog = z.infer<typeof emailLogSchema>;

// Transaction constants (server-side copy — kept in sync with src/types/transaction.ts)
export const TRANSACTION_CATEGORIES = [
  'DirectCost',
  'InventoryRestock',
  'Overhead',
  'Revenue',
  'Personal',
] as const;

export const TRANSACTION_STATUSES = ['pending_review', 'approved', 'rejected'] as const;

export const TRANSACTION_SOURCES = ['manual', 'ai'] as const;

// Server-side transaction schema: uses z.any() for Firestore Timestamps
export const transactionSchema = z.object({
  vendorName: z.string(),
  amountAgora: z.number().int(),
  currency: z.enum(['ILS', 'USD', 'EUR']),
  date: z.any(), // Firestore Timestamp
  category: z.enum(TRANSACTION_CATEGORIES),
  workOrderId: z.string().nullable(),
  inventoryItemId: z.string().nullable(),
  status: z.enum(TRANSACTION_STATUSES),
  aiConfidence: z.number().nullable(),
  originalFileUrl: z.string().nullable(),
  source: z.enum(TRANSACTION_SOURCES),
  sourceEmailRef: z.string().nullable(),
  notes: z.string().nullable(),
  createdAt: z.any(), // Firestore Timestamp / FieldValue.serverTimestamp()
  updatedAt: z.any(), // Firestore Timestamp / FieldValue.serverTimestamp()
});

export type Transaction = z.infer<typeof transactionSchema>;

// Parsed document schemas — Gemini structured output (Story 4.3)
export const parsedLineItemSchema = z.object({
  description: z.string(),
  amountRaw: z.number(), // Raw decimal amount (not agora)
});

export const parsedDocumentSchema = z.object({
  vendorName: z.string().min(1),
  date: z.string(), // ISO 8601 format: YYYY-MM-DD
  totalAmount: z.number(), // Raw decimal (e.g., 82.50) — converted to agora later
  currency: z.enum(['ILS', 'USD', 'EUR']),
  lineItems: z.array(parsedLineItemSchema),
  documentType: z.enum(['invoice', 'receipt', 'quote']),
  languageDetected: z.enum(['hebrew', 'english', 'mixed']),
  confidence: z.number().min(0).max(100),
});

export type ParsedDocument = z.infer<typeof parsedDocumentSchema>;
export type ParsedLineItem = z.infer<typeof parsedLineItemSchema>;
