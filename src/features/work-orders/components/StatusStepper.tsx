import { useTranslation } from 'react-i18next';
import { CheckCircle, Circle } from '@phosphor-icons/react';
import { WORK_ORDER_STATUSES, type WorkOrderStatus } from '@/types';
import styles from './StatusStepper.module.scss';

export interface StatusStepperProps {
  currentStatus: WorkOrderStatus;
  onStatusChange: (newStatus: WorkOrderStatus) => void;
  disabled?: boolean;
}

export function StatusStepper({ currentStatus, onStatusChange, disabled = false }: StatusStepperProps) {
  const { t } = useTranslation();
  const currentIndex = WORK_ORDER_STATUSES.indexOf(currentStatus);

  return (
    <div
      role="group"
      aria-label={t('workOrders.statusStepper.label')}
      className={styles.stepper}
    >
      {WORK_ORDER_STATUSES.map((status, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;

        return (
          <div key={status} className={styles.stepWrapper}>
            {index > 0 && (
              <div
                className={`${styles.connector} ${isCompleted ? styles.connectorCompleted : ''}`}
              />
            )}
            <button
              type="button"
              className={`${styles.step} ${isCompleted ? styles.stepCompleted : ''} ${isCurrent ? styles.stepCurrent : ''}`}
              onClick={() => onStatusChange(status)}
              disabled={disabled}
              aria-current={isCurrent ? 'step' : undefined}
              aria-label={t(`workOrders.status.${status}`)}
            >
              <span className={styles.stepIcon}>
                {isCompleted ? (
                  <CheckCircle size={24} weight="fill" />
                ) : isCurrent ? (
                  <Circle size={24} weight="fill" />
                ) : (
                  <Circle size={24} />
                )}
              </span>
              <span className={styles.stepLabel}>
                {t(`workOrders.status.${status}`)}
              </span>
            </button>
          </div>
        );
      })}
    </div>
  );
}
