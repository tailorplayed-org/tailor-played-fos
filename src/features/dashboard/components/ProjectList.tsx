import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { Briefcase } from '@phosphor-icons/react';
import { Button } from '@/components';
import { calculateMargin } from '@/lib';
import type { WorkOrder } from '@/types';
import { ProjectRow } from './ProjectRow';
import styles from './ProjectList.module.scss';

export interface ProjectListProps {
  workOrders: WorkOrder[];
  loading: boolean;
}

const STATUS_PRIORITY: Record<string, number> = {
  Production: 0,
  Design: 1,
  Lead: 2,
};

const SKELETON_COUNT = 3;

export function ProjectList({ workOrders, loading }: ProjectListProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const sortedProjects = useMemo(() => {
    return workOrders
      .filter((wo) => wo.status !== 'Shipped')
      .map((wo) => {
        const totalCost =
          wo.directCostAgora + wo.inventoryCostAgora + wo.overheadAllocationAgora;
        const margin = calculateMargin(wo.revenueTotalAgora, totalCost);
        return { ...wo, _margin: margin };
      })
      .sort((a, b) => {
        const priorityDiff =
          (STATUS_PRIORITY[a.status] ?? 99) - (STATUS_PRIORITY[b.status] ?? 99);
        if (priorityDiff !== 0) return priorityDiff;
        return a._margin - b._margin;
      });
  }, [workOrders]);

  if (loading) {
    return (
      <section className={styles.section} aria-busy="true">
        <div className={styles.header}>
          <h2 className={styles.title}>{t('dashboard.projectHealth.title')}</h2>
        </div>
        <div className={styles.list}>
          {Array.from({ length: SKELETON_COUNT }, (_, i) => (
            <ProjectRow
              key={i}
              workOrder={{} as WorkOrder}
              onClick={() => {}}
              loading
            />
          ))}
        </div>
      </section>
    );
  }

  if (sortedProjects.length === 0) {
    return (
      <section className={styles.section}>
        <div className={styles.header}>
          <h2 className={styles.title}>{t('dashboard.projectHealth.title')}</h2>
        </div>
        <div className={styles.emptyState}>
          <Briefcase size={48} className={styles.emptyIcon} />
          <p className={styles.emptyTitle}>
            {t('dashboard.projectHealth.emptyTitle')}
          </p>
          <Button onClick={() => navigate('/work-orders')}>
            {t('dashboard.projectHealth.emptyCta')}
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.title}>{t('dashboard.projectHealth.title')}</h2>
        <span className={styles.count}>
          {t('dashboard.projectHealth.count', { count: sortedProjects.length })}
        </span>
      </div>
      <div className={styles.list}>
        {sortedProjects.map((wo) => (
          <ProjectRow
            key={wo.id}
            workOrder={wo}
            onClick={() => navigate(`/work-orders/${wo.id}`)}
          />
        ))}
      </div>
    </section>
  );
}
