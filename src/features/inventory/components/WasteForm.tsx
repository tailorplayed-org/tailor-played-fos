import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Input, Select, Button } from '@/components';
import { formatCurrency } from '@/lib/currency';
import { applyScoopCost } from '@/lib/wac';
import { wasteInputSchema, type WasteInput, type InventoryItem, type WorkOrder } from '@/types';
import styles from './WasteForm.module.scss';

/** Converts empty/undefined input to 0, otherwise to a number */
const toNumberOrZero = (v: unknown) =>
  v === '' || v === undefined || v === null || Number.isNaN(Number(v)) ? 0 : Number(v);

export interface WasteFormProps {
  item?: InventoryItem; // pre-selected from row action
  inventoryItems: InventoryItem[]; // for searchable selector
  workOrders: WorkOrder[]; // optional WO linkage
  onSubmit: (data: WasteInput) => Promise<void>;
  onCancel: () => void;
}

export function WasteForm({ item, inventoryItems, workOrders, onSubmit, onCancel }: WasteFormProps) {
  const { t } = useTranslation();

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<WasteInput>({
    resolver: zodResolver(wasteInputSchema),
    defaultValues: {
      itemId: item?.id ?? '',
      quantity: 0,
      reason: '',
      workOrderId: '',
    },
  });

  const quantity = watch('quantity');
  const itemId = watch('itemId');
  const reason = watch('reason');
  const selectedItem = inventoryItems.find((i) => i.id === itemId);

  const isOverdraft = selectedItem != null && quantity > selectedItem.currentQty;
  const wasteCost =
    selectedItem && quantity > 0 ? applyScoopCost(quantity, selectedItem.wacAgora) : 0;

  const materialOptions = inventoryItems.map((inv) => ({
    value: inv.id,
    label: inv.name,
  }));

  const workOrderOptions = [
    { value: '', label: t('inventory.waste.workOrderNone') },
    ...workOrders.map((wo) => ({
      value: wo.id,
      label: wo.clientName,
    })),
  ];

  const handleFormSubmit = handleSubmit(async (data) => {
    await onSubmit(data);
  });

  const isConfirmDisabled =
    isSubmitting || isOverdraft || !selectedItem || quantity <= 0 || !reason;

  return (
    <form className={styles.form} onSubmit={handleFormSubmit} noValidate>
      <h2 className={styles.formTitle}>{t('inventory.waste.title')}</h2>
      <div className={styles.fields}>
        {item ? (
          <div className={styles.preselectedItem}>
            <span className={styles.preselectedLabel}>{t('inventory.waste.material')}</span>
            <span className={styles.preselectedValue}>{item.name}</span>
            <input type="hidden" {...register('itemId')} />
          </div>
        ) : (
          <Controller
            name="itemId"
            control={control}
            render={({ field }) => (
              <Select
                label={t('inventory.waste.material')}
                options={materialOptions}
                value={field.value}
                onChange={field.onChange}
                error={errors.itemId?.message ? t('inventory.waste.materialRequired') : undefined}
                searchable
              />
            )}
          />
        )}

        <Input
          type="number"
          label={t('inventory.waste.quantity')}
          error={
            isOverdraft
              ? t('inventory.waste.overdraftError', { available: selectedItem?.currentQty })
              : errors.quantity?.message
                ? t('inventory.waste.quantityError')
                : undefined
          }
          min={0}
          {...register('quantity', { setValueAs: toNumberOrZero })}
        />

        {selectedItem && (
          <div className={styles.stockPreview}>
            <span className={styles.stockLabel}>{t('inventory.waste.availableStock')}</span>
            <span className={isOverdraft ? styles.stockValueError : styles.stockValue}>
              {selectedItem.currentQty - quantity} {selectedItem.unit}
              {!isOverdraft &&
                quantity > 0 &&
                ` (${t('inventory.waste.remainingAfter', { remaining: selectedItem.currentQty - quantity })})`}
            </span>
          </div>
        )}

        {wasteCost > 0 && (
          <div className={styles.costPreview}>
            <span className={styles.costLabel}>{t('inventory.waste.calculatedCost')}</span>
            <span className={styles.costValue}>{formatCurrency(wasteCost)}</span>
          </div>
        )}

        <Input
          type="text"
          label={t('inventory.waste.reason')}
          error={errors.reason?.message ? t('inventory.waste.reasonRequired') : undefined}
          placeholder={t('inventory.waste.reasonPlaceholder')}
          {...register('reason')}
        />

        <Controller
          name="workOrderId"
          control={control}
          render={({ field }) => (
            <Select
              label={t('inventory.waste.workOrder')}
              options={workOrderOptions}
              value={field.value}
              onChange={field.onChange}
              searchable
            />
          )}
        />
      </div>

      <div className={styles.actions}>
        <Button type="button" variant="ghost" onClick={onCancel}>
          {t('inventory.waste.cancel')}
        </Button>
        <Button type="submit" variant="danger" disabled={isConfirmDisabled} loading={isSubmitting}>
          {t('inventory.waste.submit')}
        </Button>
      </div>
    </form>
  );
}
