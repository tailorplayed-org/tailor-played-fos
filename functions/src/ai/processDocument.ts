import { onDocumentCreated } from 'firebase-functions/firestore';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import * as logger from 'firebase-functions/logger';
import { parseFinancialDocument } from './geminiClient.js';
import { geminiApiKey } from '../config.js';

// Category heuristic based on mailbox context (refined in Story 4.4)
const MAILBOX_CATEGORY_MAP: Record<string, string> = {
  orders: 'DirectCost',
  supplies: 'InventoryRestock',
  expenses: 'Overhead',
  developing: 'DirectCost',
};

export const processDocument = onDocumentCreated(
  {
    document: 'email_log/{docId}',
    secrets: [geminiApiKey],
  },
  async (event) => {
    const db = getFirestore();
    const snapshot = event.data;
    if (!snapshot) {
      logger.error('No data in event');
      return;
    }

    const emailLogData = snapshot.data();
    const emailLogRef = snapshot.ref;

    // Guard: only process 'received' status
    if (emailLogData.status !== 'received') {
      logger.info('Skipping email_log — status is not received', {
        status: emailLogData.status,
        docId: event.params.docId,
      });
      return;
    }

    try {
      // 1. Update status to 'processing'
      await emailLogRef.update({ status: 'processing' });

      // 2. Get first attachment URL
      const attachmentUrls: string[] = emailLogData.attachmentUrls ?? [];
      if (attachmentUrls.length === 0) {
        throw new Error('No attachments found in email_log');
      }
      const documentUrl = attachmentUrls[0]; // Process first attachment
      const mimeType = guessMimeType(documentUrl);

      // 3. Call Gemini for AI extraction
      const parsed = await parseFinancialDocument(documentUrl, mimeType);

      // 4. Convert amount to agora (integer)
      const amountAgora = Math.round(parsed.totalAmount * 100);

      // 5. Determine preliminary category from mailbox
      const category = MAILBOX_CATEGORY_MAP[emailLogData.mailbox] ?? 'DirectCost';

      // 6. Parse and validate date
      const parsedDate = new Date(parsed.date);
      if (isNaN(parsedDate.getTime())) {
        throw new Error(`Invalid date from Gemini: ${parsed.date}`);
      }

      // 7. Create transaction document
      const transactionRef = await db.collection('transactions').add({
        vendorName: parsed.vendorName,
        amountAgora,
        currency: parsed.currency,
        date: parsedDate,
        category,
        workOrderId: null, // Set by Story 4.4 classification
        inventoryItemId: null, // Set by Story 4.4 classification
        status: 'pending_review',
        aiConfidence: parsed.confidence,
        originalFileUrl: documentUrl,
        source: 'ai',
        sourceEmailRef: event.params.docId,
        notes: null,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      // 8. Update email_log: processed + transaction link
      await emailLogRef.update({
        status: 'processed',
        transactionId: transactionRef.id,
      });

      logger.info('Document processed successfully', {
        emailLogId: event.params.docId,
        transactionId: transactionRef.id,
        vendorName: parsed.vendorName,
        amountAgora,
        currency: parsed.currency,
        confidence: parsed.confidence,
      });
    } catch (error) {
      // Error path: mark as 'unprocessed', preserve error details
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error('processDocument failed', {
        docId: event.params.docId,
        error: errorMsg,
      });

      try {
        await emailLogRef.update({
          status: 'unprocessed',
          errorMessage: errorMsg,
        });
      } catch (updateError) {
        // If even the error status update fails, log it — document stays in 'processing'
        logger.error('Failed to update email_log error status', {
          docId: event.params.docId,
          originalError: errorMsg,
          updateError: updateError instanceof Error ? updateError.message : String(updateError),
        });
      }
      // Do NOT re-throw — let retry function (Story 4.5) handle retries
    }
  },
);

function guessMimeType(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf':
      return 'application/pdf';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'html':
      return 'text/html';
    default:
      return 'application/octet-stream';
  }
}
