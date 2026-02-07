import { gmail_v1, google } from 'googleapis';
import * as logger from 'firebase-functions/logger';
import {
  gmailClientId,
  gmailClientSecret,
  gmailRefreshToken,
} from '../config.js';

/**
 * Create an authenticated Gmail API client using OAuth2 credentials from config.
 * A new client is created each invocation — intentional for Cloud Functions cold starts.
 */
function getGmailClient(): gmail_v1.Gmail {
  const oauth2Client = new google.auth.OAuth2(
    gmailClientId.value(),
    gmailClientSecret.value(),
    'https://developers.google.com/oauthplayground',
  );
  oauth2Client.setCredentials({
    refresh_token: gmailRefreshToken.value(),
  });
  return google.gmail({ version: 'v1', auth: oauth2Client });
}

/**
 * Fetch a full email message by Gmail message ID.
 */
export async function getEmailById(
  messageId: string,
): Promise<gmail_v1.Schema$Message> {
  const gmail = getGmailClient();
  try {
    const response = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full',
    });
    return response.data;
  } catch (error) {
    logger.error('getEmailById failed', { messageId, error });
    throw new Error(
      `Failed to fetch email ${messageId}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Download all attachments from a Gmail message.
 * Accepts an already-fetched message to avoid a redundant API call.
 * Returns array of { filename, data (Buffer), mimeType }.
 */
export async function getAttachments(
  messageId: string,
  message: gmail_v1.Schema$Message,
): Promise<Array<{ filename: string; data: Buffer; mimeType: string }>> {
  const gmail = getGmailClient();
  try {
    const attachments: Array<{
      filename: string;
      data: Buffer;
      mimeType: string;
    }> = [];
    const parts = message.payload?.parts ?? [];

    for (const part of parts) {
      if (part.filename && part.body?.attachmentId) {
        const attachment = await gmail.users.messages.attachments.get({
          userId: 'me',
          messageId,
          id: part.body.attachmentId,
        });
        if (attachment.data.data) {
          attachments.push({
            filename: part.filename,
            data: Buffer.from(attachment.data.data, 'base64'),
            mimeType: part.mimeType ?? 'application/octet-stream',
          });
        }
      }
    }
    return attachments;
  } catch (error) {
    logger.error('getAttachments failed', { messageId, error });
    throw new Error(
      `Failed to fetch attachments for ${messageId}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Mark a Gmail message as read by removing the UNREAD label.
 */
export async function markAsRead(messageId: string): Promise<void> {
  const gmail = getGmailClient();
  try {
    await gmail.users.messages.modify({
      userId: 'me',
      id: messageId,
      requestBody: {
        removeLabelIds: ['UNREAD'],
      },
    });
  } catch (error) {
    logger.error('markAsRead failed', { messageId, error });
    throw new Error(
      `Failed to mark email ${messageId} as read: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * List unread messages in the inbox.
 * Used as a simpler alternative to history.list for MVP.
 */
export async function listUnreadMessages(): Promise<gmail_v1.Schema$Message[]> {
  const gmail = getGmailClient();
  try {
    const response = await gmail.users.messages.list({
      userId: 'me',
      q: 'is:unread',
      maxResults: 50,
    });
    return response.data.messages ?? [];
  } catch (error) {
    logger.error('listUnreadMessages failed', { error });
    throw new Error(
      `Failed to list unread messages: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
