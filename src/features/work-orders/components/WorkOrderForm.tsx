import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Input, Select, Button } from '@/components';
import { createWorkOrderSchema, WORK_ORDER_STATUSES, type CreateWorkOrderInput } from '@/types';
import styles from './WorkOrderForm.module.scss';

export interface WorkOrderFormProps {
  onSubmit: (data: CreateWorkOrderInput) => void | Promise<void>;
  defaultValues?: Partial<CreateWorkOrderInput>;
  onCancel: () => void;
  isEdit?: boolean;
}

export function WorkOrderForm({ onSubmit, defaultValues, onCancel, isEdit = false }: WorkOrderFormProps) {
  const { t } = useTranslation();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CreateWorkOrderInput>({
    resolver: zodResolver(createWorkOrderSchema),
    defaultValues: {
      clientName: defaultValues?.clientName ?? '',
      projectDescription: defaultValues?.projectDescription ?? '',
      deadline: defaultValues?.deadline ?? null,
      status: defaultValues?.status ?? 'Lead',
    },
  });

  const statusOptions = WORK_ORDER_STATUSES.map((status) => ({
    value: status,
    label: t(`workOrders.status.${status}`),
  }));

  const handleFormSubmit = handleSubmit(async (data) => {
    await onSubmit(data);
  });

  return (
    <form className={styles.form} onSubmit={handleFormSubmit} noValidate>
      <div className={styles.fields}>
        <Input
          label={t('workOrders.form.clientName')}
          error={errors.clientName?.message ? t('workOrders.form.clientNameRequired') : undefined}
          {...register('clientName')}
        />

        <Input
          label={t('workOrders.form.projectDescription')}
          error={errors.projectDescription?.message}
          {...register('projectDescription')}
        />

        <Controller
          name="deadline"
          control={control}
          render={({ field }) => (
            <Input
              type="date"
              label={t('workOrders.form.deadline')}
              value={field.value ? formatDateForInput(field.value) : ''}
              onChange={(e) => {
                const val = e.target.value;
                field.onChange(val ? new Date(val + 'T00:00:00') : null);
              }}
              onBlur={field.onBlur}
              name={field.name}
            />
          )}
        />

        <Controller
          name="status"
          control={control}
          render={({ field }) => (
            <Select
              label={t('workOrders.form.status')}
              options={statusOptions}
              value={field.value}
              onChange={field.onChange}
              error={errors.status?.message}
            />
          )}
        />
      </div>

      <div className={styles.actions}>
        <Button type="button" variant="ghost" onClick={onCancel}>
          {t('workOrders.form.cancel')}
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {isEdit ? t('workOrders.form.update') : t('workOrders.form.create')}
        </Button>
      </div>
    </form>
  );
}

function formatDateForInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
