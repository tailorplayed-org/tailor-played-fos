import { z } from 'zod';

export const DESIGNATED_MAILBOXES = [
  'orders',
  'supplies',
  'developing',
  'expenses',
] as const;
export type DesignatedMailbox = (typeof DESIGNATED_MAILBOXES)[number];

export const EMAIL_STATUSES = [
  'received',
  'processing',
  'processed',
  'unprocessed',
  'failed',
  'failed_permanent', // After 3 retries, permanently failed (Story 4.5)
] as const;
export type EmailStatus = (typeof EMAIL_STATUSES)[number];

export const emailLogSchema = z.object({
  id: z.string(),
  messageId: z.string(),
  mailbox: z.enum(DESIGNATED_MAILBOXES),
  receivedAt: z.date(),
  status: z.enum(EMAIL_STATUSES),
  attachmentUrls: z.array(z.string()),
  subject: z.string(),
  from: z.string(),
  transactionId: z.string().nullable(),
  errorMessage: z.string().nullable(),
  paperlessForwarded: z.boolean(), // Tracks Paperless forwarding status (FR42/FR43/FR44)
  retryCount: z.number().int(), // Number of retry attempts (0 = first processing) (Story 4.5)
  updatedAt: z.date(), // Last status change (Story 4.5)
});

export type EmailLog = z.infer<typeof emailLogSchema>;
