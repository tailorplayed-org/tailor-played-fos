import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Input, Select, Button } from '@/components';
import { formatCurrency, toMinorUnits } from '@/lib/currency';
import { restockInputSchema, type RestockInput, type InventoryItem } from '@/types';
import styles from './RestockForm.module.scss';

/** Converts empty/undefined input to 0, otherwise to a number */
const toNumberOrZero = (v: unknown) =>
  v === '' || v === undefined || v === null || Number.isNaN(Number(v)) ? 0 : Number(v);

export interface RestockFormProps {
  item?: InventoryItem; // pre-selected item (from row action)
  inventoryItems: InventoryItem[]; // for searchable selector if no pre-selected item
  onSubmit: (data: RestockInput) => Promise<void>;
  onCancel: () => void;
}

export function RestockForm({ item, inventoryItems, onSubmit, onCancel }: RestockFormProps) {
  const { t } = useTranslation();

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RestockInput>({
    resolver: zodResolver(restockInputSchema),
    defaultValues: {
      itemId: item?.id ?? '',
      quantity: 0,
      totalCostIls: 0,
    },
  });

  const quantity = watch('quantity');
  const totalCostIls = watch('totalCostIls');

  // Real-time unit cost preview (display in agora → ILS formatted)
  const unitCostPreview =
    quantity > 0 && totalCostIls > 0
      ? formatCurrency(toMinorUnits(totalCostIls / quantity), 'ILS')
      : '—';

  const materialOptions = inventoryItems.map((inv) => ({
    value: inv.id,
    label: inv.name,
  }));

  const handleFormSubmit = handleSubmit(async (data) => {
    await onSubmit(data);
  });

  return (
    <form className={styles.form} onSubmit={handleFormSubmit} noValidate>
      <h2 className={styles.formTitle}>{t('inventory.restock.title')}</h2>
      <div className={styles.fields}>
        {item ? (
          <div className={styles.preselectedItem}>
            <span className={styles.preselectedLabel}>{t('inventory.restock.material')}</span>
            <span className={styles.preselectedValue}>{item.name}</span>
            <input type="hidden" {...register('itemId')} />
          </div>
        ) : (
          <Controller
            name="itemId"
            control={control}
            render={({ field }) => (
              <Select
                label={t('inventory.restock.material')}
                options={materialOptions}
                value={field.value}
                onChange={field.onChange}
                error={errors.itemId?.message ? t('inventory.restock.materialRequired') : undefined}
                searchable
              />
            )}
          />
        )}

        <Input
          type="number"
          label={t('inventory.restock.quantity')}
          error={errors.quantity?.message ? t('inventory.restock.quantityError') : undefined}
          min={0}
          {...register('quantity', { setValueAs: toNumberOrZero })}
        />

        <Input
          type="number"
          label={t('inventory.restock.totalCost')}
          error={errors.totalCostIls?.message ? t('inventory.restock.totalCostError') : undefined}
          min={0}
          step="0.01"
          {...register('totalCostIls', { setValueAs: toNumberOrZero })}
        />

        <div className={styles.unitCostPreview}>
          <span className={styles.unitCostLabel}>{t('inventory.restock.unitCost')}</span>
          <span className={styles.unitCostValue}>{unitCostPreview}</span>
        </div>
      </div>

      <div className={styles.actions}>
        <Button type="button" variant="ghost" onClick={onCancel}>
          {t('inventory.restock.cancel')}
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {t('inventory.restock.submit')}
        </Button>
      </div>
    </form>
  );
}
