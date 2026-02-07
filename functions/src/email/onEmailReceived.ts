import { onMessagePublished } from 'firebase-functions/pubsub';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import * as logger from 'firebase-functions/logger';
import {
  getEmailById,
  getAttachments,
  markAsRead,
  listUnreadMessages,
} from './gmailClient.js';
import {
  gmailClientId,
  gmailClientSecret,
  gmailRefreshToken,
} from '../config.js';
import { DESIGNATED_MAILBOXES } from '../shared/schemas.js';

/** Designated mailbox email addresses */
const MAILBOX_ADDRESSES: Record<string, string> = {
  'orders@tailorplayed.com': 'orders',
  'supplies@tailorplayed.com': 'supplies',
  'developing@tailorplayed.com': 'developing',
  'expenses@tailorplayed.com': 'expenses',
};

/**
 * Detect which designated mailbox received the email from the To/Delivered-To headers.
 * Checks ALL matching headers (not just the first) to handle forwarding scenarios.
 * Returns the mailbox name or null if not a designated mailbox.
 */
function detectMailbox(
  headers: Array<{ name?: string | null; value?: string | null }>,
): (typeof DESIGNATED_MAILBOXES)[number] | null {
  const relevantHeaders = headers.filter(
    (h) => h.name?.toLowerCase() === 'to' || h.name?.toLowerCase() === 'delivered-to',
  );

  for (const header of relevantHeaders) {
    if (!header.value) continue;
    const headerValue = header.value.toLowerCase();
    for (const [address, mailbox] of Object.entries(MAILBOX_ADDRESSES)) {
      if (headerValue.includes(address)) {
        return mailbox as (typeof DESIGNATED_MAILBOXES)[number];
      }
    }
  }
  return null;
}

/**
 * Extract a header value from Gmail message payload headers.
 */
function getHeader(
  headers: Array<{ name?: string | null; value?: string | null }>,
  name: string,
): string {
  return (
    headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value ?? ''
  );
}

/**
 * Process a single Gmail message: download, upload attachments, create email_log.
 * Implements zero-email-loss: always creates an email_log entry even on error.
 */
async function processMessage(messageId: string): Promise<void> {
  const db = getFirestore();
  const storage = getStorage();

  // Idempotency check: skip if email_log with this messageId already exists
  const existing = await db
    .collection('email_log')
    .where('messageId', '==', messageId)
    .limit(1)
    .get();

  if (!existing.empty) {
    logger.info('Skipping duplicate message', { messageId });
    return;
  }

  let mailbox: (typeof DESIGNATED_MAILBOXES)[number] = 'orders'; // default
  let subject = '';
  let from = '';
  const attachmentPaths: string[] = [];

  try {
    // Download full email
    const message = await getEmailById(messageId);
    const headers = message.payload?.headers ?? [];

    // Extract metadata
    subject = getHeader(headers, 'Subject');
    from = getHeader(headers, 'From');
    const detectedMailbox = detectMailbox(headers);
    if (detectedMailbox) {
      mailbox = detectedMailbox;
    }

    // Download and upload attachments (pass already-fetched message to avoid double API call)
    const attachments = await getAttachments(messageId, message);
    const bucket = storage.bucket();

    for (const attachment of attachments) {
      const storagePath = `documents/${messageId}/${attachment.filename}`;
      const file = bucket.file(storagePath);
      await file.save(attachment.data, {
        contentType: attachment.mimeType,
      });
      attachmentPaths.push(storagePath);
      logger.info('Attachment uploaded', {
        messageId,
        filename: attachment.filename,
        storagePath,
      });
    }

    // Create email_log document with status 'received'
    await db.collection('email_log').add({
      messageId,
      mailbox,
      receivedAt: FieldValue.serverTimestamp(),
      status: 'received',
      attachmentUrls: attachmentPaths,
      subject,
      from,
      transactionId: null,
      errorMessage: null,
    });

    // Mark email as read after successful processing
    await markAsRead(messageId);

    logger.info('Email processed successfully', {
      messageId,
      mailbox,
      attachmentCount: attachmentPaths.length,
    });
  } catch (error) {
    // Zero email loss: create email_log even on failure
    logger.error('Error processing email', { messageId, error });

    try {
      await db.collection('email_log').add({
        messageId,
        mailbox,
        receivedAt: FieldValue.serverTimestamp(),
        status: 'failed',
        attachmentUrls: attachmentPaths,
        subject,
        from,
        transactionId: null,
        errorMessage:
          error instanceof Error ? error.message : String(error),
      });
    } catch (logError) {
      logger.error('CRITICAL: Failed to create error email_log entry', {
        messageId,
        logError,
      });
    }

    throw error; // Re-throw so Cloud Functions can retry
  }
}

/**
 * Pub/Sub trigger: fires when Gmail push notification arrives.
 *
 * Gmail Pub/Sub sends { emailAddress, historyId }.
 * MVP approach: list unread messages and process each one.
 * This avoids tracking historyId state across invocations.
 */
export const onEmailReceived = onMessagePublished(
  {
    topic: 'tp-fos-email-ingestion',
    secrets: [gmailClientId, gmailClientSecret, gmailRefreshToken],
  },
  async (event) => {
    try {
      const notification = event.data.message.json as {
        emailAddress: string;
        historyId: number;
      };
      logger.info('Gmail notification received', {
        emailAddress: notification.emailAddress,
        historyId: notification.historyId,
      });

      // MVP approach: list all unread messages and process each
      const messages = await listUnreadMessages();

      if (messages.length === 0) {
        logger.info('No unread messages found');
        return;
      }

      logger.info(`Found ${messages.length} unread message(s)`);

      for (const msg of messages) {
        if (msg.id) {
          await processMessage(msg.id);
        }
      }
    } catch (error) {
      logger.error('onEmailReceived failed', { error });
      throw error; // Cloud Functions will retry on uncaught errors
    }
  },
);
