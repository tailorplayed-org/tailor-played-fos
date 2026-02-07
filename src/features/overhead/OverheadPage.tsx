import { useTranslation } from 'react-i18next';
import { Receipt } from '@phosphor-icons/react';
import styles from './OverheadPage.module.scss';

export function OverheadPage() {
  const { t } = useTranslation();

  return (
    <div className={styles.placeholder}>
      <Receipt size={48} className={styles.icon} />
      <h1 className={styles.title}>{t('pages.overhead.title')}</h1>
      <p className={styles.description}>
        {t('pages.overhead.placeholder')}
      </p>
    </div>
  );
}
