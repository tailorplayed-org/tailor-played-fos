import type { AuditLog, EmailLog, ParsedDocument, ParsedLineItem, Transaction } from './schemas.js';
import type { DESIGNATED_MAILBOXES, EMAIL_STATUSES } from './schemas.js';

export type { AuditLog, EmailLog, ParsedDocument, ParsedLineItem, Transaction };

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

// --- Classification context types (Story 4.4) ---

/** Vendor history entry for AI classification context */
export interface VendorHistoryEntry {
  vendorName: string;
  category: string;
  workOrderId: string | null;
  workOrderName: string | null;
  count: number; // Number of times this vendor → workOrder pairing occurred
}

/** Work order summary for AI classification context */
export interface WorkOrderSummary {
  id: string;
  clientName: string;
  status: string;
}

/** Full classification context passed to Gemini */
export interface ClassificationContext {
  vendorHistory: VendorHistoryEntry[];
  workOrders: WorkOrderSummary[];
}
