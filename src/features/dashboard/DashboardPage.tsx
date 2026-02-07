import { useTranslation } from 'react-i18next';
import { ChartBar } from '@phosphor-icons/react';
import styles from './DashboardPage.module.scss';

export function DashboardPage() {
  const { t } = useTranslation();

  return (
    <div className={styles.placeholder}>
      <ChartBar size={48} className={styles.icon} />
      <h1 className={styles.title}>{t('pages.dashboard.title')}</h1>
      <p className={styles.description}>
        {t('pages.dashboard.placeholder')}
      </p>
    </div>
  );
}
