import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components';
import styles from './KpiCard.module.scss';

export interface KpiCardProps {
  label: string;
  value: string;
  subtitle?: string;
  delta?: { value: number; type: 'positive' | 'negative' } | null;
  onClick?: () => void;
  glowOnHover?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  ariaLabel?: string;
}

export function KpiCard({
  label,
  value,
  subtitle,
  delta,
  onClick,
  glowOnHover = false,
  loading = false,
  icon,
  ariaLabel,
}: KpiCardProps) {
  const { t } = useTranslation();

  const classNames = [
    styles.card,
    onClick ? styles.clickable : '',
    glowOnHover ? styles.glow : '',
  ]
    .filter(Boolean)
    .join(' ');

  if (loading) {
    return (
      <div className={styles.card} data-testid="kpi-card-skeleton">
        <Skeleton variant="text" width={80} height={14} />
        <Skeleton variant="text" width={120} height={28} />
        <Skeleton variant="text" width={100} height={14} />
      </div>
    );
  }

  const content = (
    <>
      <div className={styles.header}>
        {icon ? <span className={styles.icon}>{icon}</span> : null}
        <span className={styles.label}>{label}</span>
      </div>
      <p className={styles.value}>{value}</p>
      <div className={styles.footer}>
        {subtitle ? <span className={styles.subtitle}>{subtitle}</span> : null}
        {delta ? (
          <span
            className={`${styles.delta} ${
              delta.type === 'positive' ? styles.deltaPositive : styles.deltaNegative
            }`}
          >
            {delta.type === 'positive' ? t('dashboard.deltaUp') : t('dashboard.deltaDown')}{' '}
            {delta.value}%
          </span>
        ) : null}
      </div>
    </>
  );

  if (onClick) {
    return (
      <div
        className={classNames}
        role="button"
        tabIndex={0}
        aria-label={ariaLabel}
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick();
          }
        }}
      >
        {content}
      </div>
    );
  }

  return <div className={classNames}>{content}</div>;
}
