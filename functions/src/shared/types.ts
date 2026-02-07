import type { EmailLog } from './schemas.js';
import type { DESIGNATED_MAILBOXES, EMAIL_STATUSES } from './schemas.js';

export type { EmailLog };

export type DesignatedMailbox = (typeof DESIGNATED_MAILBOXES)[number];
export type EmailStatus = (typeof EMAIL_STATUSES)[number];

/** Gmail Pub/Sub push notification payload */
export interface GmailPubSubNotification {
  emailAddress: string;
  historyId: number;
}

/** Parsed email data ready for Firestore */
export interface ParsedEmailData {
  messageId: string;
  mailbox: DesignatedMailbox;
  subject: string;
  from: string;
  attachments: Array<{
    filename: string;
    data: Buffer;
    mimeType: string;
  }>;
}
