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
