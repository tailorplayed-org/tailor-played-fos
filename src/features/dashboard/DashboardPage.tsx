import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import {
  CurrencyCircleDollar,
  Briefcase,
  Receipt,
  Tray,
} from '@phosphor-icons/react';
import { auth } from '@/services';
import { formatCurrency } from '@/lib';
import { HeroStat, KpiCard, getDelta, ProjectList } from './components';
import { useDashboardData } from './hooks';
import styles from './DashboardPage.module.scss';

export function DashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    netProfitAgora,
    previousMonthNetProfitAgora,
    taxJarAgora,
    activeProjectCount,
    monthlyOverheadAgora,
    previousMonthOverheadAgora,
    pendingReviewCount,
    pendingGreenCount,
    pendingCheckCount,
    workOrders,
    loading,
    loaded,
  } = useDashboardData();

  const userName = auth.currentUser?.displayName ?? '';

  // Invert delta sense for overhead: increase = BAD (red), decrease = GOOD (green)
  const rawOverheadDelta = getDelta(monthlyOverheadAgora, previousMonthOverheadAgora);
  const overheadDelta = rawOverheadDelta
    ? {
        value: rawOverheadDelta.value,
        type: (rawOverheadDelta.type === 'positive' ? 'negative' : 'positive') as 'positive' | 'negative',
      }
    : null;

  const pendingSubtitle =
    pendingReviewCount === 0
      ? t('dashboard.kpi.allCaughtUp')
      : t('dashboard.kpi.pendingBreakdown', {
          green: String(pendingGreenCount),
          check: String(pendingCheckCount),
        });

  return (
    <div className={styles.page}>
      <div className={loaded ? styles.fadeIn : undefined}>
        <HeroStat
          netProfitAgora={netProfitAgora}
          previousMonthNetProfitAgora={previousMonthNetProfitAgora}
          userName={userName}
          loading={loading}
        />
      </div>

      <div className={loaded ? styles.fadeIn : undefined}>
        <div className={styles.kpiRow}>
          <KpiCard
            label={t('dashboard.kpi.taxJar')}
            value={formatCurrency(taxJarAgora, 'ILS')}
            subtitle={t('dashboard.kpi.taxJarSubtitle')}
            icon={<CurrencyCircleDollar size={20} />}
            loading={loading}
          />
          <KpiCard
            label={t('dashboard.kpi.activeProjects')}
            value={String(activeProjectCount)}
            subtitle={t('dashboard.kpi.activeProjectsSubtitle')}
            icon={<Briefcase size={20} />}
            loading={loading}
          />
          <KpiCard
            label={t('dashboard.kpi.monthlyOverhead')}
            value={formatCurrency(monthlyOverheadAgora, 'ILS')}
            delta={overheadDelta}
            icon={<Receipt size={20} />}
            loading={loading}
          />
          <KpiCard
            label={t('dashboard.kpi.pendingReview')}
            value={String(pendingReviewCount)}
            subtitle={pendingSubtitle}
            icon={<Tray size={20} />}
            onClick={pendingReviewCount > 0 ? () => navigate('/review') : undefined}
            glowOnHover={pendingReviewCount > 0}
            loading={loading}
            ariaLabel={pendingReviewCount > 0 ? t('dashboard.kpi.pendingReviewAction') : undefined}
          />
        </div>
      </div>

      <div className={loaded ? styles.fadeIn : undefined}>
        <ProjectList workOrders={workOrders} loading={loading} />
      </div>
    </div>
  );
}
