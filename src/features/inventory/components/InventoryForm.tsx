import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Input, Select, Button } from '@/components';
import { createInventoryItemSchema, type CreateInventoryItemInput } from '@/types';
import styles from './InventoryForm.module.scss';

const UNIT_OPTIONS = ['sheets', 'kg', 'units', 'meters', 'liters', 'pieces'] as const;

/** Converts empty/undefined input to null, otherwise to a number */
const toNullableNumber = (v: unknown) =>
  v === '' || v === undefined || v === null ? null : Number(v);

/** Converts empty/undefined input to 0, otherwise to a number */
const toNumberOrZero = (v: unknown) =>
  v === '' || v === undefined || v === null || Number.isNaN(Number(v)) ? 0 : Number(v);

export interface InventoryFormProps {
  onSubmit: (data: CreateInventoryItemInput) => void | Promise<void>;
  defaultValues?: Partial<CreateInventoryItemInput>;
  onCancel: () => void;
  isEdit?: boolean;
}

export function InventoryForm({ onSubmit, defaultValues, onCancel, isEdit = false }: InventoryFormProps) {
  const { t } = useTranslation();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CreateInventoryItemInput>({
    resolver: zodResolver(createInventoryItemSchema),
    defaultValues: {
      name: defaultValues?.name ?? '',
      sku: defaultValues?.sku ?? null,
      supplier: defaultValues?.supplier ?? null,
      unit: defaultValues?.unit ?? '',
      initialQty: defaultValues?.initialQty ?? 0,
      initialCostPerUnit: defaultValues?.initialCostPerUnit ?? null,
      reorderThreshold: defaultValues?.reorderThreshold ?? null,
    },
  });

  const unitOptions = UNIT_OPTIONS.map((unit) => ({
    value: unit,
    label: t(`inventory.units.${unit}`),
  }));

  const handleFormSubmit = handleSubmit(async (data) => {
    await onSubmit(data);
  });

  return (
    <form className={styles.form} onSubmit={handleFormSubmit} noValidate>
      <div className={styles.fields}>
        <Input
          label={t('inventory.form.name')}
          error={errors.name?.message ? t('inventory.form.nameRequired') : undefined}
          {...register('name')}
        />

        <Input
          label={t('inventory.form.sku')}
          error={errors.sku?.message}
          {...register('sku')}
        />

        <Input
          label={t('inventory.form.supplier')}
          error={errors.supplier?.message}
          {...register('supplier')}
        />

        <Controller
          name="unit"
          control={control}
          render={({ field }) => (
            <Select
              label={t('inventory.form.unit')}
              options={unitOptions}
              value={field.value}
              onChange={field.onChange}
              error={errors.unit?.message ? t('inventory.form.unitRequired') : undefined}
              searchable
            />
          )}
        />

        {!isEdit && (
          <>
            <Input
              type="number"
              label={t('inventory.form.initialQty')}
              error={errors.initialQty?.message}
              min={0}
              {...register('initialQty', { setValueAs: toNumberOrZero })}
            />

            <Input
              type="number"
              label={t('inventory.form.initialCostPerUnit')}
              error={errors.initialCostPerUnit?.message}
              min={0}
              step="0.01"
              {...register('initialCostPerUnit', { setValueAs: toNullableNumber })}
            />
          </>
        )}

        <Input
          type="number"
          label={t('inventory.form.reorderThreshold')}
          error={errors.reorderThreshold?.message}
          min={0}
          {...register('reorderThreshold', { setValueAs: toNullableNumber })}
        />
      </div>

      <div className={styles.actions}>
        <Button type="button" variant="ghost" onClick={onCancel}>
          {t('inventory.form.cancel')}
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {isEdit ? t('inventory.form.update') : t('inventory.form.create')}
        </Button>
      </div>
    </form>
  );
}
