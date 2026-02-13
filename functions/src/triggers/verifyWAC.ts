import { onDocumentWritten } from 'firebase-functions/firestore';
import { getFirestore } from 'firebase-admin/firestore';
import * as logger from 'firebase-functions/logger';

/**
 * Replay WAC step-by-step through inventory_log entries.
 *
 * CRITICAL: WAC must be replayed step-by-step through log entries.
 * A simplified "sum all costs / total qty" approach breaks when consume/waste
 * entries exist (Story 6.3+). Replay approach is correct for ALL action types.
 */
function replayWAC(logs: FirebaseFirestore.QuerySnapshot): { qty: number; wac: number } {
  let qty = 0;
  let wacAgora = 0;

  for (const logDoc of logs.docs) {
    const entry = logDoc.data();
    if (entry.action === 'restock') {
      // Standard WAC recalculation on restock
      const totalQty = qty + entry.qtyChange;
      if (totalQty > 0) {
        wacAgora = Math.round((qty * wacAgora + entry.costSnapshotAgora) / totalQty);
      }
      qty = totalQty;
    } else if (entry.action === 'consume' || entry.action === 'waste') {
      // Consume/waste reduces qty but WAC stays the same
      qty += entry.qtyChange; // qtyChange is negative
    }
  }

  return { qty, wac: qty > 0 ? wacAgora : 0 };
}

/**
 * Cloud Function: verifyWAC
 *
 * Triggers on any write to a document in the `inventory` collection.
 * Independently recalculates WAC from inventory_log entries for the item.
 * If the client-side WAC diverges from the server calculation by > 1 agora,
 * the server value overwrites.
 *
 * Guards:
 * - No-op if document was deleted
 * - No-op if wacAgora didn't change (prevents infinite loop from self-update)
 * - No-op if no log entries exist (initial create)
 */
export const verifyWAC = onDocumentWritten('inventory/{docId}', async (event) => {
  const before = event.data?.before?.data();
  const after = event.data?.after?.data();

  // Guard: document deleted, skip
  if (!after) return;

  // Guard: only verify if wacAgora actually changed (prevents infinite loop)
  if (before && before.wacAgora === after.wacAgora) return;

  const docId = event.params.docId;
  const db = getFirestore();

  // Query all inventory_log entries for this item, ordered by timestamp
  const logs = await db
    .collection('inventory_log')
    .where('itemId', '==', docId)
    .orderBy('timestamp', 'asc')
    .get();

  // No log entries yet (initial create)
  if (logs.empty) return;

  const { wac: serverWAC } = replayWAC(logs);
  const clientWAC = after.wacAgora;

  if (Math.abs(serverWAC - clientWAC) > 1) {
    logger.warn(`WAC divergence for ${docId}: client=${clientWAC}, server=${serverWAC}. Correcting.`);
    // NOTE: This update triggers another onDocumentWritten invocation. The second
    // invocation will re-read inventory_log and verify the corrected WAC matches
    // the server replay (diff = 0), then exit without updating. This double-trigger
    // is expected and costs one additional Firestore read per correction event.
    await event.data?.after?.ref.update({ wacAgora: serverWAC });
  } else {
    logger.info(`WAC verified for ${docId}: ${clientWAC} (diff: ${Math.abs(serverWAC - clientWAC)})`);
  }
});
