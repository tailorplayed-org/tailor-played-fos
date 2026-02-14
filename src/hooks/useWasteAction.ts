import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { writeBatch, doc, collection, serverTimestamp } from 'firebase/firestore';
import { applyScoopCost } from '@/lib/wac';
import { db, auth } from '@/services';
import { toast } from '@/stores/useUIStore';
import type { InventoryItem, WorkOrder, WasteInput } from '@/types';

/**
 * Shared hook for the Waste action — logs inventory waste/loss.
 * Performs an atomic Firestore writeBatch:
 *   1. Decrease inventory item's currentQty (WAC stays the same)
 *   2. If Work Order linked, increase its inventoryCostAgora (waste is a real cost)
 *   3. Create inventory_log entry (action: 'waste', reason required)
 *
 * Shows success/error toasts automatically.
 * On error, shows toast and re-throws so the caller (e.g., WasteForm) can stay open.
 */
export function useWasteAction(inventory: InventoryItem[], workOrders: WorkOrder[]) {
  const { t } = useTranslation();

  const executeWaste = useCallback(
    async (data: WasteInput) => {
      const currentUid = auth.currentUser?.uid;
      if (!currentUid) {
        toast.error(t('inventory.waste.error'));
        throw new Error('No authenticated user');
      }

      const item = inventory.find((i) => i.id === data.itemId);
      if (!item) return;

      const wo = data.workOrderId ? workOrders.find((w) => w.id === data.workOrderId) : null;
      const costAgora = applyScoopCost(data.quantity, item.wacAgora);

      try {
        const batch = writeBatch(db);

        // 1. Decrease inventory quantity (WAC stays the same)
        batch.update(doc(db, 'inventory', item.id), {
          currentQty: item.currentQty - data.quantity,
          updatedAt: serverTimestamp(),
        });

        // 2. If Work Order linked, increase its inventoryCostAgora (waste is a real cost)
        if (wo) {
          batch.update(doc(db, 'work_orders', wo.id), {
            inventoryCostAgora: wo.inventoryCostAgora + costAgora,
            updatedAt: serverTimestamp(),
          });
        }

        // 3. Create inventory_log entry
        const logRef = doc(collection(db, 'inventory_log'));
        batch.set(logRef, {
          itemId: item.id,
          action: 'waste',
          qtyChange: -data.quantity, // NEGATIVE for waste
          costSnapshotAgora: costAgora, // positive: total cost of this waste
          wacBeforeAgora: item.wacAgora,
          wacAfterAgora: item.wacAgora, // SAME — WAC doesn't change on waste
          workOrderRef: data.workOrderId || null, // null when no WO linked
          reason: data.reason, // REQUIRED for waste
          actorUid: currentUid,
          timestamp: serverTimestamp(),
        });

        await batch.commit();
        toast.success(
          t('inventory.waste.success', {
            qty: data.quantity,
            material: item.name,
          }),
        );
      } catch {
        toast.error(t('inventory.waste.error'));
        throw new Error('Waste batch write failed');
      }
    },
    [inventory, workOrders, t],
  );

  return { executeWaste };
}
