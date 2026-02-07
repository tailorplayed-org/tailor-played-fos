import { useTranslation } from 'react-i18next';
import { Tray } from '@phosphor-icons/react';
import styles from './ReviewPage.module.scss';

export function ReviewPage() {
  const { t } = useTranslation();

  return (
    <div className={styles.placeholder}>
      <Tray size={48} className={styles.icon} />
      <h1 className={styles.title}>{t('pages.review.title')}</h1>
      <p className={styles.description}>
        {t('pages.review.placeholder')}
      </p>
    </div>
  );
}
