import { Badge, type BadgeColor } from './Badge';

export type WorkOrderStatus = 'Lead' | 'Design' | 'Production' | 'Shipped';

export interface StatusBadgeProps {
  status: WorkOrderStatus;
  className?: string;
}

const STATUS_COLOR_MAP: Record<WorkOrderStatus, BadgeColor> = {
  Lead: 'info',
  Design: 'warning',
  Production: 'success',
  Shipped: 'default',
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return <Badge label={status} color={STATUS_COLOR_MAP[status]} className={className} />;
}
