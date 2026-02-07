import { describe, it, expect } from 'vitest';
import {
  emailLogSchema,
  DESIGNATED_MAILBOXES,
  EMAIL_STATUSES,
  type EmailLog,
  type DesignatedMailbox,
  type EmailStatus,
} from './email';

describe('EmailLog Schema', () => {
  const validEmailLog = {
    id: 'abc123',
    messageId: '18f1234567890abc',
    mailbox: 'orders' as const,
    receivedAt: new Date('2026-02-07T10:00:00Z'),
    status: 'received' as const,
    attachmentUrls: ['documents/abc123/invoice.pdf'],
    subject: 'Invoice #1234',
    from: 'vendor@example.com',
    transactionId: null,
    errorMessage: null,
    paperlessForwarded: true,
  };

  it('validates a correct EmailLog object', () => {
    const result = emailLogSchema.safeParse(validEmailLog);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe('abc123');
      expect(result.data.messageId).toBe('18f1234567890abc');
      expect(result.data.mailbox).toBe('orders');
      expect(result.data.status).toBe('received');
      expect(result.data.attachmentUrls).toEqual(['documents/abc123/invoice.pdf']);
      expect(result.data.transactionId).toBeNull();
      expect(result.data.errorMessage).toBeNull();
    }
  });

  it('validates all designated mailboxes', () => {
    for (const mailbox of DESIGNATED_MAILBOXES) {
      const result = emailLogSchema.safeParse({ ...validEmailLog, mailbox });
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid mailbox values', () => {
    const result = emailLogSchema.safeParse({
      ...validEmailLog,
      mailbox: 'invalid-mailbox',
    });
    expect(result.success).toBe(false);
  });

  it('validates all email statuses', () => {
    for (const status of EMAIL_STATUSES) {
      const result = emailLogSchema.safeParse({ ...validEmailLog, status });
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid status values', () => {
    const result = emailLogSchema.safeParse({
      ...validEmailLog,
      status: 'unknown-status',
    });
    expect(result.success).toBe(false);
  });

  it('accepts transactionId as string when present', () => {
    const result = emailLogSchema.safeParse({
      ...validEmailLog,
      transactionId: 'txn-456',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.transactionId).toBe('txn-456');
    }
  });

  it('accepts errorMessage as string when present', () => {
    const result = emailLogSchema.safeParse({
      ...validEmailLog,
      errorMessage: 'Gmail API timeout',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.errorMessage).toBe('Gmail API timeout');
    }
  });

  it('rejects missing required fields', () => {
    const incomplete = { id: 'abc123' };
    const result = emailLogSchema.safeParse(incomplete);
    expect(result.success).toBe(false);
  });

  it('validates attachmentUrls as array of strings', () => {
    const result = emailLogSchema.safeParse({
      ...validEmailLog,
      attachmentUrls: ['path1.pdf', 'path2.jpg', 'path3.png'],
    });
    expect(result.success).toBe(true);
  });

  it('rejects non-string values in attachmentUrls', () => {
    const result = emailLogSchema.safeParse({
      ...validEmailLog,
      attachmentUrls: [123, true],
    });
    expect(result.success).toBe(false);
  });

  it('accepts empty attachmentUrls array', () => {
    const result = emailLogSchema.safeParse({
      ...validEmailLog,
      attachmentUrls: [],
    });
    expect(result.success).toBe(true);
  });

  it('validates paperlessForwarded as true', () => {
    const result = emailLogSchema.safeParse({
      ...validEmailLog,
      paperlessForwarded: true,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.paperlessForwarded).toBe(true);
    }
  });

  it('validates paperlessForwarded as false', () => {
    const result = emailLogSchema.safeParse({
      ...validEmailLog,
      paperlessForwarded: false,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.paperlessForwarded).toBe(false);
    }
  });

  it('rejects non-boolean paperlessForwarded', () => {
    const result = emailLogSchema.safeParse({
      ...validEmailLog,
      paperlessForwarded: 'yes',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing paperlessForwarded field', () => {
    const { paperlessForwarded, ...withoutPaperless } = validEmailLog;
    const result = emailLogSchema.safeParse(withoutPaperless);
    expect(result.success).toBe(false);
  });
});

describe('EmailLog Constants', () => {
  it('DESIGNATED_MAILBOXES contains all 4 mailboxes', () => {
    expect(DESIGNATED_MAILBOXES).toEqual(['orders', 'supplies', 'developing', 'expenses']);
    expect(DESIGNATED_MAILBOXES).toHaveLength(4);
  });

  it('EMAIL_STATUSES contains all 5 statuses', () => {
    expect(EMAIL_STATUSES).toEqual([
      'received',
      'processing',
      'processed',
      'unprocessed',
      'failed',
    ]);
    expect(EMAIL_STATUSES).toHaveLength(5);
  });
});

describe('EmailLog Type', () => {
  it('type-checks a valid EmailLog object', () => {
    // This test ensures the TypeScript type is correctly inferred
    const log: EmailLog = {
      id: 'test',
      messageId: 'msg123',
      mailbox: 'supplies',
      receivedAt: new Date(),
      status: 'processing',
      attachmentUrls: [],
      subject: 'Test',
      from: 'test@example.com',
      transactionId: null,
      errorMessage: null,
      paperlessForwarded: true,
    };
    expect(log.mailbox).toBe('supplies');
  });

  it('DesignatedMailbox type matches DESIGNATED_MAILBOXES values', () => {
    const mailbox: DesignatedMailbox = 'orders';
    expect(DESIGNATED_MAILBOXES).toContain(mailbox);
  });

  it('EmailStatus type matches EMAIL_STATUSES values', () => {
    const status: EmailStatus = 'failed';
    expect(EMAIL_STATUSES).toContain(status);
  });
});
