import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Package, Plus, Trash, ClockCounterClockwise } from '@phosphor-icons/react';
import { collection, addDoc, updateDoc, doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db, auth } from '@/services';
import { toMinorUnits } from '@/lib/currency';
import { calculateWAC } from '@/lib/wac';
import { toast } from '@/stores/useUIStore';
import { useInventory } from './hooks/useInventory';
import { useWorkOrders } from '@/features/work-orders/hooks/useWorkOrders';
import { useScoopAction } from '@/hooks/useScoopAction';
import { useWasteAction } from '@/hooks/useWasteAction';
import { useInventoryLogs } from './hooks/useInventoryLogs';
import { InventoryTable } from './components/InventoryTable';
import { InventoryForm } from './components/InventoryForm';
import { RestockForm } from './components/RestockForm';
import { WasteForm } from './components/WasteForm';
import { AuditLogPanel } from './components/AuditLogPanel';
import { ScoopModal } from '@/features/work-orders/components/ScoopModal';
import { Button, Card } from '@/components';
import type { InventoryItem, CreateInventoryItemInput, RestockInput } from '@/types';
import styles from './InventoryPage.module.scss';

type FormMode =
  | { type: 'closed' }
  | { type: 'create' }
  | { type: 'edit'; item: InventoryItem }
  | { type: 'restock'; item?: InventoryItem }
  | { type: 'scoop'; item?: InventoryItem }
  | { type: 'waste'; item?: InventoryItem }
  | { type: 'audit' };

export function InventoryPage() {
  const { t } = useTranslation();
  const { inventory, loading, error } = useInventory();
  const { workOrders } = useWorkOrders();
  const { executeScoop } = useScoopAction(inventory, workOrders);
  const { executeWaste } = useWasteAction(inventory, workOrders);
  const { logs: inventoryLogs, loading: logsLoading } = useInventoryLogs();
  const [formMode, setFormMode] = useState<FormMode>({ type: 'closed' });

  const handleCreate = useCallback(async (data: CreateInventoryItemInput) => {
    try {
      await addDoc(collection(db, 'inventory'), {
        name: data.name,
        sku: data.sku || null,
        supplier: data.supplier || null,
        unit: data.unit,
        currentQty: data.initialQty ?? 0,
        wacAgora: data.initialCostPerUnit != null ? toMinorUnits(data.initialCostPerUnit) : 0,
        reorderThreshold: data.reorderThreshold ?? null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast.success(t('inventory.toast.created'));
      setFormMode({ type: 'closed' });
    } catch {
      toast.error(t('inventory.toast.createError'));
    }
  }, [t]);

  const handleUpdate = useCallback(async (data: CreateInventoryItemInput) => {
    if (formMode.type !== 'edit') return;
    try {
      await updateDoc(doc(db, 'inventory', formMode.item.id), {
        name: data.name,
        sku: data.sku || null,
        supplier: data.supplier || null,
        unit: data.unit,
        reorderThreshold: data.reorderThreshold ?? null,
        updatedAt: serverTimestamp(),
      });
      toast.success(t('inventory.toast.updated'));
      setFormMode({ type: 'closed' });
    } catch {
      toast.error(t('inventory.toast.updateError'));
    }
  }, [formMode, t]);

  const handleRestock = useCallback(async (data: RestockInput) => {
    const currentUid = auth.currentUser?.uid;
    if (!currentUid) {
      toast.error(t('inventory.restock.error'));
      return;
    }

    const item = inventory.find((i) => i.id === data.itemId);
    if (!item) return;

    const totalCostAgora = toMinorUnits(data.totalCostIls);
    const newWAC = calculateWAC(item.currentQty, item.wacAgora, data.quantity, totalCostAgora);

    try {
      const batch = writeBatch(db);

      // 1. Update inventory item
      batch.update(doc(db, 'inventory', item.id), {
        currentQty: item.currentQty + data.quantity,
        wacAgora: newWAC,
        updatedAt: serverTimestamp(),
      });

      // 2. Create inventory_log entry
      const logRef = doc(collection(db, 'inventory_log'));
      batch.set(logRef, {
        itemId: item.id,
        action: 'restock',
        qtyChange: data.quantity,
        costSnapshotAgora: totalCostAgora,
        wacBeforeAgora: item.wacAgora,
        wacAfterAgora: newWAC,
        workOrderRef: null,
        reason: null,
        actorUid: currentUid,
        timestamp: serverTimestamp(),
      });

      await batch.commit();
      toast.success(t('inventory.restock.success'));
      setFormMode({ type: 'closed' });
    } catch {
      toast.error(t('inventory.restock.error'));
    }
  }, [inventory, t]);

  const handleRestockClick = useCallback((item: InventoryItem) => {
    setFormMode({ type: 'restock', item });
  }, []);

  const handleScoopClick = useCallback((item: InventoryItem) => {
    setFormMode({ type: 'scoop', item });
  }, []);

  const handleWasteClick = useCallback((item: InventoryItem) => {
    setFormMode({ type: 'waste', item });
  }, []);

  const handleAuditClick = useCallback(() => {
    setFormMode({ type: 'audit' });
  }, []);

  const handleRowClick = useCallback((item: InventoryItem) => {
    setFormMode({ type: 'edit', item });
  }, []);

  const handleCancel = useCallback(() => {
    setFormMode({ type: 'closed' });
  }, []);

  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.errorState}>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const emptyState = (
    <Card className={styles.emptyState}>
      <Package size={48} className={styles.emptyIcon} />
      <p className={styles.emptyText}>{t('inventory.emptyState')}</p>
      <p className={styles.emptyHint}>{t('inventory.emptyStateHint')}</p>
      <Button onClick={() => setFormMode({ type: 'create' })}>
        <Plus size={16} weight="bold" /> {t('inventory.addMaterial')}
      </Button>
    </Card>
  );

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.titleRow}>
          <Package size={28} className={styles.titleIcon} />
          <h1 className={styles.title}>{t('inventory.title')}</h1>
        </div>
        {inventory.length > 0 && (
          <div className={styles.headerActions}>
            <Button size="sm" variant="secondary" onClick={handleAuditClick}>
              <ClockCounterClockwise size={18} weight="bold" />
              <span>{t('inventory.audit.title')}</span>
            </Button>
            <Button size="sm" variant="danger" onClick={() => setFormMode({ type: 'waste' })}>
              <Trash size={18} weight="bold" />
              <span>{t('inventory.waste.action')}</span>
            </Button>
            <Button onClick={() => setFormMode({ type: 'create' })}>
              <Plus size={16} weight="bold" /> {t('inventory.addMaterial')}
            </Button>
          </div>
        )}
      </header>

      {formMode.type === 'create' && (
        <InventoryForm
          onSubmit={handleCreate}
          onCancel={handleCancel}
        />
      )}

      {formMode.type === 'edit' && (
        <InventoryForm
          isEdit
          defaultValues={{
            name: formMode.item.name,
            sku: formMode.item.sku,
            supplier: formMode.item.supplier,
            unit: formMode.item.unit,
            reorderThreshold: formMode.item.reorderThreshold,
          }}
          onSubmit={handleUpdate}
          onCancel={handleCancel}
        />
      )}

      {formMode.type === 'restock' && (
        <RestockForm
          item={formMode.item}
          inventoryItems={inventory}
          onSubmit={handleRestock}
          onCancel={handleCancel}
        />
      )}

      {formMode.type === 'scoop' && (
        <ScoopModal
          open={formMode.type === 'scoop'}
          onClose={handleCancel}
          onSubmit={executeScoop}
          inventoryItems={inventory}
          workOrders={workOrders}
          preselectedItemId={formMode.item?.id}
        />
      )}

      {formMode.type === 'waste' && (
        <WasteForm
          item={formMode.item}
          inventoryItems={inventory}
          workOrders={workOrders}
          onSubmit={async (data) => {
            await executeWaste(data);
            setFormMode({ type: 'closed' });
          }}
          onCancel={handleCancel}
        />
      )}

      {formMode.type === 'audit' && (
        <AuditLogPanel
          logs={inventoryLogs}
          inventoryItems={inventory}
          workOrders={workOrders}
          loading={logsLoading}
          onClose={handleCancel}
        />
      )}

      <InventoryTable
        items={inventory}
        loading={loading}
        onRowClick={handleRowClick}
        onRestock={handleRestockClick}
        onScoop={handleScoopClick}
        onWaste={handleWasteClick}
        emptyState={emptyState}
      />
    </div>
  );
}
