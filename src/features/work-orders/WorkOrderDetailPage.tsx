import { useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ClipboardText } from '@phosphor-icons/react';
import styles from './WorkOrderDetailPage.module.scss';

export function WorkOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();

  return (
    <div className={styles.placeholder}>
      <ClipboardText size={48} className={styles.icon} />
      <h1 className={styles.title}>{t('pages.workOrderDetail.title')}</h1>
      <p className={styles.description}>
        {t('pages.workOrderDetail.placeholder', { id })}
      </p>
    </div>
  );
}
