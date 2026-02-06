import { ClipboardText } from '@phosphor-icons/react';
import styles from './WorkOrdersPage.module.scss';

export function WorkOrdersPage() {
  return (
    <div className={styles.placeholder}>
      <ClipboardText size={48} className={styles.icon} />
      <h1 className={styles.title}>Work Orders</h1>
      <p className={styles.description}>
        Track and manage your production orders here.
      </p>
    </div>
  );
}
