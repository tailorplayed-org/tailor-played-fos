import type { ComponentType } from 'react';
import { useTranslation } from 'react-i18next';
import { Repeat, Desktop, ForkKnife, Buildings, DotsThreeCircle } from '@phosphor-icons/react';
import type { IconProps } from '@phosphor-icons/react';
import { Skeleton } from '@/components';
import { formatCurrency } from '@/lib/currency';
import type { Overhead } from '@/types';
import { OVERHEAD_CATEGORIES } from '@/types';
import styles from './CategoryBreakdown.module.scss';

const CATEGORY_CONFIG: Record<string, { icon: ComponentType<IconProps>; color: string }> = {
  subscriptions: { icon: Repeat, color: '#e879f9' },
  software: { icon: Desktop, color: '#60a5fa' },
  meals: { icon: ForkKnife, color: '#f97316' },
  office: { icon: Buildings, color: '#34d399' },
  general: { icon: DotsThreeCircle, color: '#a78bfa' },
};

interface CategoryBreakdownProps {
  overhead: Overhead[];
  loading?: boolean;
}

export function CategoryBreakdown({ overhead, loading }: CategoryBreakdownProps) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className={styles.grid} data-testid="category-breakdown-loading">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={styles.card}>
            <Skeleton variant="rect" width="100%" height={72} />
          </div>
        ))}
      </div>
    );
  }

  // Group by category and calculate prorated monthly totals
  // Yearly entries are prorated to amount/12 (same logic as calculateBurn)
  const categoryTotals = OVERHEAD_CATEGORIES.map((cat) => {
    const entries = overhead.filter((item) => item.category === cat);
    const total = entries.reduce((sum, item) => {
      if (item.recurrence === 'yearly') return sum + Math.round(item.amountAgora / 12);
      return sum + item.amountAgora; // one_time + monthly
    }, 0);
    return { category: cat, total, count: entries.length };
  })
    .filter((cat) => cat.count > 0)
    .sort((a, b) => b.total - a.total);

  if (categoryTotals.length === 0) return null;

  const totalOverhead = categoryTotals.reduce((sum, cat) => sum + cat.total, 0);

  return (
    <section>
      <h2 className={styles.title}>{t('overhead.breakdown.title')}</h2>
      <div className={styles.grid}>
        {categoryTotals.map(({ category, total, count }) => {
          const config = CATEGORY_CONFIG[category];
          const Icon = config.icon;
          const pct = totalOverhead > 0 ? Math.round((total / totalOverhead) * 100) : 0;
          return (
            <div key={category} className={styles.card} data-testid={`category-card-${category}`}>
              <div className={styles.cardHeader}>
                <span className={styles.iconWrap} style={{ color: config.color }}>
                  <Icon size={24} weight="duotone" />
                </span>
                <span className={styles.categoryName}>{t(`overhead.categories.${category}`)}</span>
              </div>
              <span className={styles.categoryTotal}>{formatCurrency(total)}</span>
              <span className={styles.entryCount}>
                {t('overhead.breakdown.entries', { count })}
              </span>
              {totalOverhead > 0 && (
                <>
                  <div className={styles.proportionBar} data-testid={`proportion-bar-${category}`}>
                    <div
                      className={styles.proportionFill}
                      style={{
                        width: `${pct}%`,
                        backgroundColor: config.color,
                      }}
                    />
                  </div>
                  <span className={styles.proportionLabel} data-testid={`proportion-label-${category}`}>
                    {pct}%
                  </span>
                </>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
