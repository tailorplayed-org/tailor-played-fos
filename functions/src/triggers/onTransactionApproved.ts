import { onDocumentUpdatedWithAuthContext } from 'firebase-functions/firestore';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import * as logger from 'firebase-functions/logger';

/**
 * Category → Work Order field mapping.
 * Only these categories trigger Work Order total updates.
 */
const WO_FIELD_MAP: Record<string, string> = {
  DirectCost: 'directCostAgora',
  Revenue: 'revenueTotalAgora',
  InventoryRestock: 'inventoryCostAgora',
};

/**
 * Create an audit log document for transaction status changes.
 * Errors are logged but never thrown — the caller always continues.
 */
async function createAuditLog(
  db: FirebaseFirestore.Firestore,
  transactionId: string,
  action: 'approved' | 'rejected',
  actorUid: string,
  beforeData: Record<string, unknown>,
  afterData: Record<string, unknown>,
): Promise<void> {
  try {
    await db.collection('audit_log').add({
      transactionId,
      action,
      actorUid,
      timestamp: FieldValue.serverTimestamp(),
      beforeSnapshot: beforeData,
      afterSnapshot: afterData,
    });
    logger.info('Audit log created', { transactionId, action, actorUid });
  } catch (error) {
    logger.error('Failed to create audit log', {
      transactionId,
      action,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Update Work Order totals by atomically incrementing the appropriate field.
 * Safe for concurrent batch approvals — FieldValue.increment is atomic.
 */
async function updateWorkOrderTotals(
  db: FirebaseFirestore.Firestore,
  workOrderId: string,
  category: string,
  amountAgora: number,
): Promise<void> {
  // Check category maps to a WO field BEFORE any Firestore read
  const field = WO_FIELD_MAP[category];
  if (!field) return; // Overhead, Personal — no WO update

  const woRef = db.collection('work_orders').doc(workOrderId);

  // Verify Work Order exists
  const woDoc = await woRef.get();
  if (!woDoc.exists) {
    logger.warn('Work Order not found for transaction side effect', { workOrderId });
    return;
  }

  await woRef.update({
    [field]: FieldValue.increment(amountAgora),
    updatedAt: FieldValue.serverTimestamp(),
  });
}

/**
 * Handle approved transaction: update Work Order totals + create audit trail.
 * WO update and audit trail run in parallel for lower latency (AC #9).
 */
async function handleApproval(
  db: FirebaseFirestore.Firestore,
  transactionId: string,
  beforeData: Record<string, unknown>,
  afterData: Record<string, unknown>,
  actorUid: string,
): Promise<void> {
  const category = afterData.category as string | undefined;
  const amountAgora = afterData.amountAgora as number | undefined;
  const workOrderId = afterData.workOrderId as string | null | undefined;

  // Log success with structured data
  logger.info('Transaction approved — processing side effects', {
    transactionId,
    category,
    workOrderId: workOrderId ?? null,
    amountAgora: amountAgora ?? 0,
  });

  // Build parallel operations: WO update + audit trail
  const operations: Promise<void>[] = [];

  // Update Work Order totals if applicable
  if (workOrderId && category && amountAgora !== undefined) {
    operations.push(
      updateWorkOrderTotals(db, workOrderId, category, amountAgora).catch((error) => {
        logger.error('Failed to update Work Order totals', {
          transactionId,
          workOrderId,
          category,
          error: error instanceof Error ? error.message : String(error),
        });
      }),
    );
  }

  // Create audit trail (errors logged internally, never thrown)
  operations.push(
    createAuditLog(db, transactionId, 'approved', actorUid, beforeData, afterData),
  );

  await Promise.allSettled(operations);
}

/**
 * Handle rejected transaction: create audit trail only, no financial side effects.
 */
async function handleRejection(
  db: FirebaseFirestore.Firestore,
  transactionId: string,
  beforeData: Record<string, unknown>,
  afterData: Record<string, unknown>,
  actorUid: string,
): Promise<void> {
  logger.info('Transaction rejected — creating audit trail', { transactionId });

  // Create audit trail only — no financial side effects for rejections
  await createAuditLog(db, transactionId, 'rejected', actorUid, beforeData, afterData);
}

/**
 * Cloud Function: onTransactionStatusChanged
 *
 * Triggers on any update to a document in the `transactions` collection.
 * Handles two status transitions:
 * - pending_review → approved: Update Work Order totals + create audit trail
 * - pending_review → rejected: Create audit trail only
 *
 * Guards:
 * - No-op if status didn't change (idempotency)
 * - No-op if transition is not from pending_review
 * - No-op if new status is neither approved nor rejected
 */
export const onTransactionStatusChanged = onDocumentUpdatedWithAuthContext(
  'transactions/{docId}',
  async (event) => {
    if (!event.data) {
      logger.error('No data in event');
      return;
    }

    const db = getFirestore();
    const before = event.data.before.data();
    const after = event.data.after.data();
    const transactionId = event.params.docId;
    const actorUid = event.authId ?? 'system';

    // Guard: only process actual status changes
    if (before.status === after.status) {
      return;
    }

    // Guard: only process transitions from pending_review
    if (before.status !== 'pending_review') {
      logger.info('Skipping — transition not from pending_review', {
        transactionId,
        beforeStatus: before.status,
        afterStatus: after.status,
      });
      return;
    }

    if (after.status === 'approved') {
      await handleApproval(db, transactionId, before, after, actorUid);
    } else if (after.status === 'rejected') {
      await handleRejection(db, transactionId, before, after, actorUid);
    }
  },
);
