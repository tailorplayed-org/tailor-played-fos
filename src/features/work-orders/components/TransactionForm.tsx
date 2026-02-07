import { useForm, useWatch, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Input, Select, Button } from '@/components';
import { useWorkOrderStore } from '@/stores';
import { createTransactionSchema, TRANSACTION_CATEGORIES, type CreateTransactionInput } from '@/types';
import { toMinorUnits, toIlsAgora, formatCurrency, isEstimatedCurrency, formatDateForInput } from '@/lib';
import styles from './TransactionForm.module.scss';

export interface TransactionFormProps {
  onSubmit: (data: CreateTransactionInput) => Promise<void>;
  onCancel: () => void;
  defaultWorkOrderId?: string;
}

export function TransactionForm({ onSubmit, onCancel, defaultWorkOrderId }: TransactionFormProps) {
  const { t } = useTranslation();
  const { workOrders } = useWorkOrderStore();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CreateTransactionInput>({
    resolver: zodResolver(createTransactionSchema),
    defaultValues: {
      vendorName: '',
      amount: undefined as unknown as number,
      currency: 'ILS',
      date: new Date(),
      category: undefined as unknown as CreateTransactionInput['category'],
      workOrderId: defaultWorkOrderId || null,
      notes: null,
    },
  });

  const watchCurrency = useWatch({ control, name: 'currency' });
  const watchAmount = useWatch({ control, name: 'amount' });

  const currencyOptions = [
    { value: 'ILS', label: '₪ ILS' },
    { value: 'USD', label: '$ USD' },
    { value: 'EUR', label: '€ EUR' },
  ];

  const categoryOptions = TRANSACTION_CATEGORIES.map((cat) => ({
    value: cat,
    label: t(`transactions.category.${cat}`),
  }));

  const workOrderOptions = workOrders.map((wo) => ({
    value: wo.id,
    label: wo.clientName,
  }));

  const handleFormSubmit = handleSubmit(async (data) => {
    await onSubmit(data);
  });

  const showEstimate = isEstimatedCurrency(watchCurrency) && watchAmount > 0;
  const estimateText = showEstimate
    ? t('transactions.form.estimatedConversion', {
        amount: formatCurrency(toIlsAgora(toMinorUnits(watchAmount, watchCurrency), watchCurrency)),
      })
    : '';

  return (
    <form className={styles.form} onSubmit={handleFormSubmit} noValidate>
      <h3 className={styles.formTitle}>{t('transactions.form.title')}</h3>
      <div className={styles.fields}>
        <div className={styles.row}>
          <Input
            label={t('transactions.form.vendorName')}
            error={errors.vendorName?.message ? t('transactions.form.vendorNameRequired') : undefined}
            {...register('vendorName')}
          />

          <Input
            type="number"
            step="0.01"
            label={t('transactions.form.amount')}
            error={
              errors.amount?.message
                ? watchAmount <= 0 || isNaN(watchAmount)
                  ? t('transactions.form.amountPositive')
                  : t('transactions.form.amountRequired')
                : undefined
            }
            {...register('amount', { valueAsNumber: true })}
          />

          <Controller
            name="currency"
            control={control}
            render={({ field }) => (
              <div className={styles.currencyField}>
                <Select
                  label={t('transactions.form.currency')}
                  options={currencyOptions}
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.currency?.message}
                />
                {showEstimate && (
                  <span className={styles.estimateText}>{estimateText}</span>
                )}
              </div>
            )}
          />
        </div>

        <div className={styles.row}>
          <Controller
            name="date"
            control={control}
            render={({ field }) => (
              <Input
                type="date"
                label={t('transactions.form.date')}
                value={field.value ? formatDateForInput(field.value) : ''}
                onChange={(e) => {
                  const val = e.target.value;
                  field.onChange(val ? new Date(val + 'T00:00:00') : null);
                }}
                onBlur={field.onBlur}
                name={field.name}
                error={errors.date?.message ? t('transactions.form.dateRequired') : undefined}
              />
            )}
          />

          <Controller
            name="category"
            control={control}
            render={({ field }) => (
              <Select
                label={t('transactions.form.category')}
                options={categoryOptions}
                value={field.value}
                onChange={field.onChange}
                error={errors.category?.message ? t('transactions.form.categoryRequired') : undefined}
                placeholder={t('transactions.form.categoryRequired')}
              />
            )}
          />
        </div>

        <div className={styles.row}>
          <Controller
            name="workOrderId"
            control={control}
            render={({ field }) => (
              <Select
                searchable
                label={t('transactions.form.workOrder')}
                options={workOrderOptions}
                value={field.value || ''}
                onChange={(val) => field.onChange(val || null)}
                placeholder={t('transactions.form.workOrderPlaceholder')}
              />
            )}
          />

          <Input
            label={t('transactions.form.notes')}
            placeholder={t('transactions.form.notesPlaceholder')}
            {...register('notes')}
          />
        </div>
      </div>

      <div className={styles.actions}>
        <Button type="button" variant="ghost" onClick={onCancel}>
          {t('transactions.form.cancel')}
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {t('transactions.form.submit')}
        </Button>
      </div>
    </form>
  );
}

