import { onSchedule } from 'firebase-functions/scheduler';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import * as logger from 'firebase-functions/logger';
import { getStorage } from 'firebase-admin/storage';
import { geminiApiKey, gmailClientId, gmailClientSecret, gmailRefreshToken } from '../config.js';
import { getEmailById, getAttachments } from '../email/gmailClient.js';
import { runAIProcessing } from '../ai/processDocument.js';

const MAX_RETRIES = 3;
const MAX_ITEMS_PER_RUN = 10;
const RETRY_DELAY_MS = 2000; // 2s between items to respect Gemini rate limits
const ONE_HOUR_MS = 60 * 60 * 1000;

/**
 * Scheduled Cloud Function: runs every 60 minutes.
 * Queries email_log for 'unprocessed' or 'failed' documents older than 1 hour.
 * Re-triggers AI processing for each (up to 10 per run).
 * After 3 failed retries, marks as 'failed_permanent'.
 */
export const retryFailedProcessing = onSchedule(
  {
    schedule: 'every 60 minutes',
    secrets: [geminiApiKey, gmailClientId, gmailClientSecret, gmailRefreshToken],
    timeoutSeconds: 300, // 5 min max for batch processing
  },
  async () => {
    const db = getFirestore();

    // Query candidates — filter in-memory to avoid composite index requirement
    const snapshot = await db.collection('email_log')
      .where('status', 'in', ['unprocessed', 'failed'])
      .get();

    const oneHourAgo = new Date(Date.now() - ONE_HOUR_MS);
    const candidates = snapshot.docs.filter(doc => {
      const data = doc.data();
      const retryCount = (data.retryCount as number) ?? 0;
      // Use updatedAt if available, fall back to receivedAt
      const lastUpdate = data.updatedAt?.toDate?.() ?? data.receivedAt?.toDate?.() ?? new Date(0);
      return retryCount < MAX_RETRIES && lastUpdate < oneHourAgo;
    }).slice(0, MAX_ITEMS_PER_RUN);

    if (candidates.length === 0) {
      logger.info('retryFailedProcessing: No retry candidates found');
      return;
    }

    logger.info(`retryFailedProcessing: Processing ${candidates.length} candidates`);
    let successCount = 0;
    let failCount = 0;
    let permanentFailCount = 0;

    for (let i = 0; i < candidates.length; i++) {
      const doc = candidates[i];
      const data = doc.data();
      const docId = doc.id;
      const currentRetryCount = ((data.retryCount as number) ?? 0) + 1;

      try {
        // Check if already at max retries → mark permanent failure
        if (currentRetryCount >= MAX_RETRIES) {
          await doc.ref.update({
            status: 'failed_permanent',
            retryCount: currentRetryCount,
            updatedAt: FieldValue.serverTimestamp(),
          });
          logger.warn('retryFailedProcessing: Marked as failed_permanent', {
            docId, retryCount: currentRetryCount,
          });
          permanentFailCount++;
          continue;
        }

        // Increment retryCount
        await doc.ref.update({
          retryCount: currentRetryCount,
          updatedAt: FieldValue.serverTimestamp(),
        });

        // Idempotency: check if transaction already exists
        const existingTxn = await db.collection('transactions')
          .where('sourceEmailRef', '==', docId)
          .limit(1)
          .get();
        if (!existingTxn.empty) {
          await doc.ref.update({
            status: 'processed',
            transactionId: existingTxn.docs[0].id,
            updatedAt: FieldValue.serverTimestamp(),
          });
          successCount++;
          continue;
        }

        // Handle failed emails with no attachments — re-download from Gmail
        let attachmentUrls: string[] = (data.attachmentUrls as string[]) ?? [];
        if (attachmentUrls.length === 0 && data.messageId) {
          // Re-download from Gmail
          const message = await getEmailById(data.messageId as string);
          const attachments = await getAttachments(data.messageId as string, message);
          const storage = getStorage();
          const bucket = storage.bucket();
          const newPaths: string[] = [];
          for (const att of attachments) {
            const storagePath = `documents/${data.messageId}/${att.filename}`;
            await bucket.file(storagePath).save(att.data, { contentType: att.mimeType });
            newPaths.push(storagePath);
          }
          attachmentUrls = newPaths;
          await doc.ref.update({ attachmentUrls: newPaths, updatedAt: FieldValue.serverTimestamp() });
        }

        if (attachmentUrls.length === 0) {
          throw new Error('No attachments available after re-download attempt');
        }

        // Re-run AI processing
        await doc.ref.update({ status: 'processing', updatedAt: FieldValue.serverTimestamp() });
        const result = await runAIProcessing(db, attachmentUrls[0], docId);
        await doc.ref.update({
          status: 'processed',
          transactionId: result.transactionId,
          updatedAt: FieldValue.serverTimestamp(),
          errorMessage: null,
        });
        successCount++;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.error('retryFailedProcessing: Item failed', { docId, error: errorMsg });
        try {
          await doc.ref.update({
            status: 'unprocessed',
            errorMessage: errorMsg,
            updatedAt: FieldValue.serverTimestamp(),
          });
        } catch (updateErr) {
          logger.error('retryFailedProcessing: Failed to update error status', {
            docId,
            updateError: updateErr instanceof Error ? updateErr.message : String(updateErr),
          });
        }
        failCount++;
      }

      // Delay between items for rate limit protection
      if (i < candidates.length - 1) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
      }
    }

    logger.info('retryFailedProcessing: Run complete', {
      total: candidates.length, successCount, failCount, permanentFailCount,
    });
  },
);
