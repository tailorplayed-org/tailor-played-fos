import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Package, Plus } from '@phosphor-icons/react';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/services';
import { toMinorUnits } from '@/lib/currency';
import { toast } from '@/stores/useUIStore';
import { useInventory } from './hooks/useInventory';
import { InventoryTable } from './components/InventoryTable';
import { InventoryForm } from './components/InventoryForm';
import { Button, Card } from '@/components';
import type { InventoryItem, CreateInventoryItemInput } from '@/types';
import styles from './InventoryPage.module.scss';

type FormMode = { type: 'closed' } | { type: 'create' } | { type: 'edit'; item: InventoryItem };

export function InventoryPage() {
  const { t } = useTranslation();
  const { inventory, loading, error } = useInventory();
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
          <Button onClick={() => setFormMode({ type: 'create' })}>
            <Plus size={16} weight="bold" /> {t('inventory.addMaterial')}
          </Button>
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

      <InventoryTable
        items={inventory}
        loading={loading}
        onRowClick={handleRowClick}
        emptyState={emptyState}
      />
    </div>
  );
}
