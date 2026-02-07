import { useTranslation } from 'react-i18next';
import { Briefcase, Warning, WarningCircle } from '@phosphor-icons/react';
import { Skeleton } from '@/components';
import { formatCurrency, calculateMargin, getMarginStatus } from '@/lib';
import type { MarginStatus } from '@/lib';
import type { WorkOrder } from '@/types';
import styles from './ProjectRow.module.scss';

export interface ProjectRowProps {
  workOrder: WorkOrder;
  onClick: () => void;
  loading?: boolean;
}

const STATUS_ICON: Record<MarginStatus, React.ReactNode> = {
  healthy: null,
  watch: <Warning size={14} data-testid="icon-margin-warning" />,
  danger: <WarningCircle size={14} data-testid="icon-margin-danger" />,
};

function getWorkOrderMargin(wo: WorkOrder) {
  const totalCost =
    wo.directCostAgora + wo.inventoryCostAgora + wo.overheadAllocationAgora;
  const margin = calculateMargin(wo.revenueTotalAgora, totalCost);
  const status = getMarginStatus(margin);
  return { margin, status, totalCost };
}

export function ProjectRow({ workOrder, onClick, loading }: ProjectRowProps) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className={styles.row} data-testid="project-row-skeleton" aria-hidden="true">
        <div className={styles.iconContainer}>
          <Skeleton variant="rect" width={40} height={40} />
        </div>
        <div className={styles.info}>
          <Skeleton variant="text" width="60%" height={16} />
          <Skeleton variant="text" width="40%" height={12} />
        </div>
        <Skeleton variant="text" width={70} height={16} className={styles.desktopOnly} />
        <Skeleton variant="text" width={70} height={16} className={styles.desktopOnly} />
        <Skeleton variant="text" width={50} height={16} />
      </div>
    );
  }

  const { margin, status, totalCost } = getWorkOrderMargin(workOrder);
  const noRevenue = workOrder.revenueTotalAgora === 0;

  const statusClass = styles[status] ?? '';
  const rowClasses = [styles.row, styles.interactive, statusClass]
    .filter(Boolean)
    .join(' ');

  const marginDisplay = noRevenue
    ? t('dashboard.projectHealth.noRevenue')
    : `${Math.round(margin)}%`;

  const marginBarWidth = noRevenue ? 0 : Math.min(Math.max(margin, 0), 100);

  const statusLabel = t(`dashboard.projectHealth.status.${workOrder.status}`);

  return (
    <button
      type="button"
      className={rowClasses}
      onClick={onClick}
      aria-label={`${workOrder.clientName} — ${statusLabel} — ${formatCurrency(workOrder.revenueTotalAgora, 'ILS')} — ${formatCurrency(totalCost, 'ILS')} — ${marginDisplay}`}
    >
      <div className={styles.iconContainer}>
        <Briefcase size={20} />
      </div>

      <div className={styles.info}>
        <span className={styles.name}>{workOrder.clientName}</span>
        <span className={styles.status}>{statusLabel}</span>
      </div>

      <span className={[styles.amount, styles.desktopOnly].join(' ')}>
        {formatCurrency(workOrder.revenueTotalAgora, 'ILS')}
      </span>

      <span className={[styles.amount, styles.desktopOnly].join(' ')}>
        {formatCurrency(totalCost, 'ILS')}
      </span>

      <div className={styles.marginCell}>
        <span className={styles.marginValue}>
          {marginDisplay}
          {STATUS_ICON[status]}
        </span>
        <div className={styles.marginBar}>
          <div
            className={styles.marginBarFill}
            style={{ inlineSize: `${marginBarWidth}%` }}
          />
        </div>
      </div>
    </button>
  );
}
