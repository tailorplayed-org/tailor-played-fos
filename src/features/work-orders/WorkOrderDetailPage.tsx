import { useParams } from 'react-router';
import { ClipboardText } from '@phosphor-icons/react';
import styles from './WorkOrderDetailPage.module.scss';

export function WorkOrderDetailPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className={styles.placeholder}>
      <ClipboardText size={48} className={styles.icon} />
      <h1 className={styles.title}>Work Order Detail</h1>
      <p className={styles.description}>
        Detailed view for order <span className={styles.orderId}>{id}</span> is
        coming soon.
      </p>
    </div>
  );
}
