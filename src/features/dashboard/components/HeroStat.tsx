import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components';
import styles from './HeroStat.module.scss';
import { formatCurrency } from '@/lib';

export interface HeroStatProps {
  netProfitAgora: number;
  previousMonthNetProfitAgora: number | null;
  userName: string;
  loading: boolean;
}

function getGreetingKey(hour: number): string {
  if (hour >= 5 && hour < 12) return 'dashboard.greeting.morning';
  if (hour >= 12 && hour < 18) return 'dashboard.greeting.afternoon';
  return 'dashboard.greeting.evening';
}

function getFirstName(displayName: string | null | undefined): string {
  if (!displayName) return '';
  return displayName.split(' ')[0];
}

export function getDelta(
  current: number,
  previous: number | null,
): { value: number; type: 'positive' | 'negative' } | null {
  if (previous === null || previous === 0) return null;
  const change = ((current - previous) / Math.abs(previous)) * 100;
  const value = Math.abs(Math.round(change));
  if (value === 0) return null;
  return {
    value,
    type: change >= 0 ? 'positive' : 'negative',
  };
}

export function HeroStat({
  netProfitAgora,
  previousMonthNetProfitAgora,
  userName,
  loading,
}: HeroStatProps) {
  const { t, i18n } = useTranslation();

  if (loading) {
    return (
      <div className={styles.hero} data-testid="hero-stat-skeleton">
        <Skeleton variant="text" width={200} height={20} />
        <Skeleton variant="text" width={240} height={44} />
        <Skeleton variant="text" width={180} height={16} />
      </div>
    );
  }

  const hour = new Date().getHours();
  const greetingKey = getGreetingKey(hour);
  const firstName = getFirstName(userName);
  const greeting = firstName
    ? t('dashboard.greetingName', { greeting: t(greetingKey), name: firstName })
    : t('dashboard.greetingAnonymous', { greeting: t(greetingKey) });

  const monthYear = new Intl.DateTimeFormat(i18n.language, {
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const profitLabel = t('dashboard.netProfitLabel', { monthYear });
  const delta = getDelta(netProfitAgora, previousMonthNetProfitAgora);

  const prevMonth = new Date();
  prevMonth.setMonth(prevMonth.getMonth() - 1);
  const prevMonthName = new Intl.DateTimeFormat(i18n.language, {
    month: 'long',
  }).format(prevMonth);

  return (
    <div className={styles.hero}>
      <p className={styles.greeting}>{greeting}</p>
      <p className={styles.amount}>{formatCurrency(netProfitAgora, 'ILS')}</p>
      <p className={styles.label}>{profitLabel}</p>
      {delta ? (
        <p
          className={`${styles.delta} ${
            delta.type === 'positive' ? styles.deltaPositive : styles.deltaNegative
          }`}
        >
          {t('dashboard.deltaFromPrevious', {
            direction: delta.type === 'positive' ? t('dashboard.deltaUp') : t('dashboard.deltaDown'),
            value: String(delta.value),
            month: prevMonthName,
          })}
        </p>
      ) : null}
    </div>
  );
}
