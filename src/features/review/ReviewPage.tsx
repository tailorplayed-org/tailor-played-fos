import { Tray } from '@phosphor-icons/react';
import styles from './ReviewPage.module.scss';

export function ReviewPage() {
  return (
    <div className={styles.placeholder}>
      <Tray size={48} className={styles.icon} />
      <h1 className={styles.title}>Review</h1>
      <p className={styles.description}>
        Pending transactions awaiting your approval will appear here.
      </p>
    </div>
  );
}
