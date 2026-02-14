import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { writeBatch, doc, collection, serverTimestamp } from 'firebase/firestore';
import { applyScoopCost } from '@/lib/wac';
import { db, auth } from '@/services';
import { toast } from '@/stores/useUIStore';
import type { InventoryItem, WorkOrder, ScoopInput } from '@/types';

/**
 * Shared hook for the Scoop action — consumes inventory into a Work Order.
 * Performs an atomic Firestore writeBatch:
 *   1. Decrease inventory item's currentQty
 *   2. Increase work order's inventoryCostAgora
 *   3. Create inventory_log entry (action: 'consume')
 *
 * Shows success/error toasts automatically.
 * On error, shows toast and re-throws so the caller (e.g., ScoopModal) can stay open.
 */
export function useScoopAction(inventory: InventoryItem[], workOrders: WorkOrder[]) {
  const { t } = useTranslation();

  const executeScoop = useCallback(
    async (data: ScoopInput) => {
      const currentUid = auth.currentUser?.uid;
      if (!currentUid) {
        toast.error(t('inventory.scoop.error'));
        throw new Error('No authenticated user');
      }

      const item = inventory.find((i) => i.id === data.itemId);
      const wo = workOrders.find((w) => w.id === data.workOrderId);
      if (!item || !wo) return;

      const costAgora = applyScoopCost(data.quantity, item.wacAgora);

      try {
        const batch = writeBatch(db);

        // 1. Decrease inventory quantity (WAC stays the same)
        batch.update(doc(db, 'inventory', item.id), {
          currentQty: item.currentQty - data.quantity,
          updatedAt: serverTimestamp(),
        });

        // 2. Increase Work Order's inventoryCostAgora
        batch.update(doc(db, 'work_orders', wo.id), {
          inventoryCostAgora: wo.inventoryCostAgora + costAgora,
          updatedAt: serverTimestamp(),
        });

        // 3. Create inventory_log entry
        const logRef = doc(collection(db, 'inventory_log'));
        batch.set(logRef, {
          itemId: item.id,
          action: 'consume',
          qtyChange: -data.quantity,
          costSnapshotAgora: costAgora,
          wacBeforeAgora: item.wacAgora,
          wacAfterAgora: item.wacAgora,
          workOrderRef: wo.id,
          reason: null,
          actorUid: currentUid,
          timestamp: serverTimestamp(),
        });

        await batch.commit();
        toast.success(
          t('inventory.scoop.success', {
            qty: data.quantity,
            material: item.name,
            workOrder: wo.clientName,
          }),
        );
      } catch {
        toast.error(t('inventory.scoop.error'));
        throw new Error('Scoop batch write failed');
      }
    },
    [inventory, workOrders, t],
  );

  return { executeScoop };
}
