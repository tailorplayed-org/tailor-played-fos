import { useTranslation } from 'react-i18next';
import { ClipboardText } from '@phosphor-icons/react';
import styles from './WorkOrdersPage.module.scss';

export function WorkOrdersPage() {
  const { t } = useTranslation();

  return (
    <div className={styles.placeholder}>
      <ClipboardText size={48} className={styles.icon} />
      <h1 className={styles.title}>{t('pages.workOrders.title')}</h1>
      <p className={styles.description}>
        {t('pages.workOrders.placeholder')}
      </p>
    </div>
  );
}
