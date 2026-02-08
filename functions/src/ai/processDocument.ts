import { onDocumentCreated } from 'firebase-functions/firestore';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import * as logger from 'firebase-functions/logger';
import { parseFinancialDocument } from './geminiClient.js';
import { geminiApiKey } from '../config.js';
import { DEFAULT_CONVERSION_RATES } from '../shared/currency.js';
import type { VendorHistoryEntry, WorkOrderSummary, ClassificationContext } from '../shared/types.js';

/**
 * Query approved AI transactions and aggregate vendor history for classification context.
 * Returns one entry per vendor+workOrder combination with occurrence count.
 */
export async function getVendorHistory(
  db: FirebaseFirestore.Firestore,
): Promise<VendorHistoryEntry[]> {
  const snapshot = await db
    .collection('transactions')
    .where('status', '==', 'approved')
    .where('source', '==', 'ai')
    .get();

  // Aggregate by vendor name + category + workOrderId
  const vendorMap = new Map<
    string,
    Map<string, { category: string; workOrderId: string | null; count: number }>
  >();

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const vendor = data.vendorName as string;
    if (!vendor) continue;

    if (!vendorMap.has(vendor)) vendorMap.set(vendor, new Map());

    const key = `${data.category}|${data.workOrderId ?? 'none'}`;
    const existing = vendorMap.get(vendor)!.get(key);
    if (existing) {
      existing.count++;
    } else {
      vendorMap.get(vendor)!.set(key, {
        category: data.category as string,
        workOrderId: (data.workOrderId as string) ?? null,
        count: 1,
      });
    }
  }

  // Flatten to entries array
  const entries: VendorHistoryEntry[] = [];
  for (const [vendorName, combos] of vendorMap) {
    for (const combo of combos.values()) {
      entries.push({
        vendorName,
        category: combo.category,
        workOrderId: combo.workOrderId,
        workOrderName: null, // Enriched with work order name if available
        count: combo.count,
      });
    }
  }

  return entries;
}

/**
 * Query active work orders for classification context.
 * Returns id, clientName, and status for each work order.
 */
export async function getActiveWorkOrders(
  db: FirebaseFirestore.Firestore,
): Promise<WorkOrderSummary[]> {
  const snapshot = await db.collection('work_orders').get();

  const workOrders: WorkOrderSummary[] = [];
  for (const doc of snapshot.docs) {
    const data = doc.data();
    const status = (data.status as string) || 'Lead';
    // Exclude shipped/completed work orders — only suggest active projects to Gemini
    if (status === 'Shipped') continue;
    workOrders.push({
      id: doc.id,
      clientName: (data.clientName as string) || '',
      status,
    });
  }

  return workOrders;
}

/**
 * Get currency conversion rates from system_config, with fallback to defaults.
 */
export async function getConversionRates(
  db: FirebaseFirestore.Firestore,
): Promise<{ rates: Record<string, number>; date: string | null }> {
  try {
    const configDoc = await db.collection('system_config').doc('currency').get();
    if (configDoc.exists) {
      const data = configDoc.data();
      return {
        rates: (data?.currencyRates as Record<string, number>) ?? {},
        date: (data?.updatedAt as string) ?? null,
      };
    }
  } catch (error) {
    logger.warn('Failed to load currency rates from system_config, using defaults', {
      error: error instanceof Error ? error.message : String(error),
    });
  }

  // Fallback to hardcoded defaults
  return {
    rates: { ...DEFAULT_CONVERSION_RATES },
    date: null,
  };
}

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

      // 3. Query classification context from Firestore (Story 4.4)
      // Gracefully degrade if context queries fail — classification context is enhancing, not essential
      let classificationContext: ClassificationContext = { vendorHistory: [], workOrders: [] };
      try {
        const [vendorHistory, workOrders] = await Promise.all([
          getVendorHistory(db),
          getActiveWorkOrders(db),
        ]);

        // Enrich vendor history with work order names for better Gemini classification
        for (const entry of vendorHistory) {
          if (entry.workOrderId) {
            const matchedWo = workOrders.find(wo => wo.id === entry.workOrderId);
            if (matchedWo) {
              entry.workOrderName = matchedWo.clientName;
            }
          }
        }

        classificationContext = { vendorHistory, workOrders };
      } catch (contextError) {
        logger.warn('Failed to load classification context, proceeding without', {
          error: contextError instanceof Error ? contextError.message : String(contextError),
          docId: event.params.docId,
        });
      }

      // 4. Call Gemini for AI extraction + classification (Story 4.4)
      const parsed = await parseFinancialDocument(documentUrl, mimeType, classificationContext);

      // 5. Convert amount to agora (integer)
      const amountAgora = Math.round(parsed.totalAmount * 100);

      // 6. Parse and validate date
      const parsedDate = new Date(parsed.date);
      if (isNaN(parsedDate.getTime())) {
        throw new Error(`Invalid date from Gemini: ${parsed.date}`);
      }

      // 7. Handle currency conversion (Story 4.4)
      const isEstimatedConversion = parsed.currency !== 'ILS';
      let conversionRate: number | null = null;
      let conversionRateDate: string | null = null;

      if (isEstimatedConversion) {
        const { rates, date } = await getConversionRates(db);
        conversionRate = rates[parsed.currency] ?? DEFAULT_CONVERSION_RATES[parsed.currency as keyof typeof DEFAULT_CONVERSION_RATES];
        conversionRateDate = date ?? new Date().toISOString().split('T')[0];
      }

      // 8. Create transaction document with classification + conversion fields (Story 4.4)
      const transactionRef = await db.collection('transactions').add({
        vendorName: parsed.vendorName,
        amountAgora,
        currency: parsed.currency,
        date: parsedDate,
        category: parsed.category, // Now Gemini-classified (replaces mailbox heuristic)
        workOrderId: null, // Confirmed link — set by Ghost Text approval (Epic 5)
        inventoryItemId: null, // Confirmed link — set by Ghost Text approval (Epic 5)
        status: 'pending_review',
        aiConfidence: parsed.confidence, // Now includes classification confidence
        originalFileUrl: documentUrl,
        source: 'ai',
        sourceEmailRef: event.params.docId,
        notes: null,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),

        // NEW classification fields (Story 4.4)
        suggestedWorkOrderId: parsed.suggestedWorkOrderId,
        suggestedInventoryItemId: parsed.suggestedInventoryItemId,
        classificationReasoning: parsed.classificationReasoning,

        // NEW currency conversion fields (Story 4.4)
        isEstimatedConversion,
        conversionRate,
        conversionRateDate,
      });

      // 9. Update email_log: processed + transaction link
      await emailLogRef.update({
        status: 'processed',
        transactionId: transactionRef.id,
      });

      logger.info('Document processed and classified successfully', {
        emailLogId: event.params.docId,
        transactionId: transactionRef.id,
        vendorName: parsed.vendorName,
        amountAgora,
        currency: parsed.currency,
        category: parsed.category,
        confidence: parsed.confidence,
        suggestedWorkOrderId: parsed.suggestedWorkOrderId,
        isEstimatedConversion,
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
