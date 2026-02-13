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
  'failed_permanent', // After 3 retries, permanently failed (Story 4.5)
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
  retryCount: z.number().int(), // Number of retry attempts (0 = first processing) (Story 4.5)
  updatedAt: z.any(), // Firestore Timestamp — last status change (Story 4.5)
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

  // --- NEW classification + conversion fields (Story 4.4) ---
  suggestedWorkOrderId: z.string().nullable(), // AI suggestion — user confirms in Ghost Text (Epic 5)
  suggestedInventoryItemId: z.string().nullable(), // AI suggestion for restock items
  classificationReasoning: z.string().nullable(), // AI reasoning for category/project match
  isEstimatedConversion: z.boolean(), // true for non-ILS currencies
  conversionRate: z.number().nullable(), // Rate used (e.g., 3.5 for USD→ILS)
  conversionRateDate: z.string().nullable(), // ISO date when rate was recorded
  conversionRateStale: z.boolean(), // true when using fallback/stale conversion rates (Story 4.5)
});

export type Transaction = z.infer<typeof transactionSchema>;

// Parsed document schemas — Gemini structured output (Story 4.3)
export const parsedLineItemSchema = z.object({
  description: z.string(),
  amountRaw: z.number(), // Raw decimal amount (not agora)
});

export const parsedDocumentSchema = z.object({
  // --- Existing extraction fields (Story 4.3) ---
  vendorName: z.string().min(1),
  date: z.string(), // ISO 8601 format: YYYY-MM-DD
  totalAmount: z.number(), // Raw decimal (e.g., 82.50) — converted to agora later
  currency: z.enum(['ILS', 'USD', 'EUR']),
  lineItems: z.array(parsedLineItemSchema),
  documentType: z.enum(['invoice', 'receipt', 'quote']),
  languageDetected: z.enum(['hebrew', 'english', 'mixed']),
  confidence: z.number().min(0).max(100), // Overall confidence (extraction + classification)

  // --- NEW classification fields (Story 4.4) ---
  category: z.enum(TRANSACTION_CATEGORIES), // AI-classified category
  classificationReasoning: z.string(), // 1-2 sentence explanation
  suggestedWorkOrderId: z.string().nullable(), // Matched from provided context (Firestore ID)
  suggestedInventoryItemId: z.string().nullable(), // Matched from provided context (Firestore ID)
});

export type ParsedDocument = z.infer<typeof parsedDocumentSchema>;
export type ParsedLineItem = z.infer<typeof parsedLineItemSchema>;

// Audit log schema (Story 5.4 — transaction approval/rejection audit trail)
export const AUDIT_LOG_ACTIONS = ['approved', 'rejected'] as const;

export const auditLogSchema = z.object({
  transactionId: z.string(),
  action: z.enum(AUDIT_LOG_ACTIONS),
  actorUid: z.string(),
  timestamp: z.any(), // Firestore Timestamp / FieldValue.serverTimestamp()
  beforeSnapshot: z.record(z.string(), z.any()),
  afterSnapshot: z.record(z.string(), z.any()),
});

export type AuditLog = z.infer<typeof auditLogSchema>;

// --- Inventory Log schema (Story 6.2) ---
// Server-side inventory log schema (uses z.any() for Firestore Timestamps)
export const INVENTORY_LOG_ACTIONS = ['restock', 'consume', 'waste'] as const;

export const inventoryLogSchema = z.object({
  itemId: z.string(),
  action: z.enum(INVENTORY_LOG_ACTIONS),
  qtyChange: z.number(),
  costSnapshotAgora: z.number().int(),
  wacBeforeAgora: z.number().int(),
  wacAfterAgora: z.number().int(),
  workOrderRef: z.string().nullable(),
  reason: z.string().nullable(),
  actorUid: z.string(),
  timestamp: z.any(), // Firestore Timestamp
});

export type InventoryLogEntry = z.infer<typeof inventoryLogSchema>;
