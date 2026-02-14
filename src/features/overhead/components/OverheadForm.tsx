import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Input, Select, Button } from '@/components';
import { createOverheadSchema, OVERHEAD_CATEGORIES, OVERHEAD_RECURRENCE } from '@/types';
import type { CreateOverheadInput } from '@/types';
import styles from './OverheadForm.module.scss';

/** Converts empty/undefined input to 0, otherwise to a number */
const toNumberOrZero = (v: unknown) =>
  v === '' || v === undefined || v === null || Number.isNaN(Number(v)) ? 0 : Number(v);

export interface OverheadFormProps {
  onSubmit: (data: CreateOverheadInput) => Promise<void>;
  onCancel: () => void;
}

export function OverheadForm({ onSubmit, onCancel }: OverheadFormProps) {
  const { t } = useTranslation();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CreateOverheadInput>({
    resolver: zodResolver(createOverheadSchema),
    defaultValues: {
      category: undefined,
      amountIls: 0,
      date: new Date().toISOString().split('T')[0],
      description: '',
      recurrence: 'one_time',
    },
  });

  const categoryOptions = OVERHEAD_CATEGORIES.map((cat) => ({
    value: cat,
    label: t(`overhead.categories.${cat}`),
  }));

  const recurrenceOptions = OVERHEAD_RECURRENCE.map((rec) => ({
    value: rec,
    label: t(`overhead.recurrence.${rec}`),
  }));

  const handleFormSubmit = handleSubmit(async (data) => {
    await onSubmit(data);
  });

  return (
    <form className={styles.form} onSubmit={handleFormSubmit} noValidate>
      <h2 className={styles.formTitle}>{t('overhead.form.title')}</h2>
      <div className={styles.fields}>
        <Controller
          name="category"
          control={control}
          render={({ field }) => (
            <Select
              label={t('overhead.form.category')}
              options={categoryOptions}
              value={field.value ?? ''}
              onChange={field.onChange}
              error={errors.category?.message ? t('overhead.form.categoryRequired') : undefined}
            />
          )}
        />

        <Input
          type="number"
          label={t('overhead.form.amount')}
          error={errors.amountIls?.message ? t('overhead.form.amountError') : undefined}
          min={0}
          step="0.01"
          {...register('amountIls', { setValueAs: toNumberOrZero })}
        />

        <Input
          type="date"
          label={t('overhead.form.date')}
          error={errors.date?.message ? t('overhead.form.dateRequired') : undefined}
          {...register('date')}
        />

        <Input
          type="text"
          label={t('overhead.form.description')}
          placeholder={t('overhead.form.descriptionPlaceholder')}
          {...register('description')}
        />

        <Controller
          name="recurrence"
          control={control}
          render={({ field }) => (
            <Select
              label={t('overhead.form.recurrence')}
              options={recurrenceOptions}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
      </div>

      <div className={styles.actions}>
        <Button type="button" variant="ghost" onClick={onCancel}>
          {t('overhead.form.cancel')}
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {t('overhead.form.submit')}
        </Button>
      </div>
    </form>
  );
}
