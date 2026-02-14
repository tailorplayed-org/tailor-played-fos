import { useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Input, Select, Button } from '@/components';
import { applyScoopCost } from '@/lib/wac';
import { formatCurrency } from '@/lib/currency';
import { scoopInputSchema, type ScoopInput, type InventoryItem } from '@/types';
import type { WorkOrder } from '@/types';
import styles from './ScoopModal.module.scss';

/** Converts empty/undefined input to 0, otherwise to a number */
const toNumberOrZero = (v: unknown) =>
  v === '' || v === undefined || v === null || Number.isNaN(Number(v)) ? 0 : Number(v);

export interface ScoopModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ScoopInput) => Promise<void>;
  inventoryItems: InventoryItem[];
  workOrders: WorkOrder[];
  preselectedWorkOrderId?: string;
  preselectedItemId?: string;
}

export function ScoopModal({
  open,
  onClose,
  onSubmit,
  inventoryItems,
  workOrders,
  preselectedWorkOrderId,
  preselectedItemId,
}: ScoopModalProps) {
  const { t } = useTranslation();

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ScoopInput>({
    resolver: zodResolver(scoopInputSchema),
    defaultValues: {
      itemId: preselectedItemId ?? '',
      quantity: 0,
      workOrderId: preselectedWorkOrderId ?? '',
    },
  });

  const quantity = watch('quantity');
  const itemId = watch('itemId');
  const selectedItem = inventoryItems.find((i) => i.id === itemId);
  const isOverdraft = selectedItem != null && quantity > selectedItem.currentQty;
  const scoopCost =
    selectedItem && quantity > 0 ? applyScoopCost(quantity, selectedItem.wacAgora) : 0;

  // Escape key closes modal
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [open, handleKeyDown]);

  if (!open) return null;

  const materialOptions = inventoryItems.map((inv) => ({
    value: inv.id,
    label: inv.name,
  }));

  const workOrderOptions = workOrders.map((wo) => ({
    value: wo.id,
    label: wo.clientName,
  }));

  const handleFormSubmit = handleSubmit(async (data) => {
    await onSubmit(data);
    onClose();
  });

  const isConfirmDisabled = isSubmitting || isOverdraft || !selectedItem || quantity <= 0;

  return (
    <div className={styles.overlay} onClick={onClose} role="presentation">
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={t('inventory.scoop.title')}
      >
        <form onSubmit={handleFormSubmit} noValidate>
          <h2 className={styles.title}>{t('inventory.scoop.title')}</h2>

          <div className={styles.fields}>
            {/* Material selector */}
            <Controller
              name="itemId"
              control={control}
              render={({ field }) => (
                <Select
                  label={t('inventory.scoop.material')}
                  options={materialOptions}
                  value={field.value}
                  onChange={field.onChange}
                  error={
                    errors.itemId?.message
                      ? t('inventory.scoop.materialRequired')
                      : undefined
                  }
                  searchable
                />
              )}
            />

            {/* Quantity input */}
            <Input
              type="number"
              label={t('inventory.scoop.quantity')}
              error={
                isOverdraft
                  ? t('inventory.scoop.overdraftError', {
                      available: selectedItem?.currentQty ?? 0,
                    })
                  : errors.quantity?.message
                    ? t('inventory.scoop.quantityError')
                    : undefined
              }
              min={0}
              step="any"
              {...register('quantity', { setValueAs: toNumberOrZero })}
            />

            {/* Available stock display */}
            {selectedItem && (
              <div
                className={[styles.infoRow, isOverdraft ? styles.infoRowError : '']
                  .filter(Boolean)
                  .join(' ')}
                aria-live="polite"
              >
                <span className={styles.infoLabel}>{t('inventory.scoop.availableStock')}</span>
                <span className={isOverdraft ? styles.infoValueError : styles.infoValue}>
                  {selectedItem.currentQty} {selectedItem.unit}
                  {quantity > 0 && (
                    <span className={styles.infoSuffix}>
                      {' '}
                      ({t('inventory.scoop.remainingAfter', {
                        remaining: selectedItem.currentQty - quantity,
                      })})
                    </span>
                  )}
                </span>
              </div>
            )}

            {/* Calculated cost display */}
            <div className={styles.infoRow} aria-live="polite">
              <span className={styles.infoLabel}>{t('inventory.scoop.calculatedCost')}</span>
              <span className={styles.infoValue}>{formatCurrency(scoopCost)}</span>
            </div>

            {/* Work Order selector */}
            <Controller
              name="workOrderId"
              control={control}
              render={({ field }) => (
                <Select
                  label={t('inventory.scoop.workOrder')}
                  options={workOrderOptions}
                  value={field.value}
                  onChange={field.onChange}
                  error={
                    errors.workOrderId?.message
                      ? t('inventory.scoop.workOrderRequired')
                      : undefined
                  }
                  searchable
                />
              )}
            />
          </div>

          <div className={styles.actions}>
            <Button type="button" variant="ghost" onClick={onClose}>
              {t('inventory.scoop.cancel')}
            </Button>
            <Button type="submit" loading={isSubmitting} disabled={isConfirmDisabled}>
              {t('inventory.scoop.submit')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
