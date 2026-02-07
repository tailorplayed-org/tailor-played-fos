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
});

export type EmailLog = z.infer<typeof emailLogSchema>;
