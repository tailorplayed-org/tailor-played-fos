import { Receipt } from '@phosphor-icons/react';
import styles from './OverheadPage.module.scss';

export function OverheadPage() {
  return (
    <div className={styles.placeholder}>
      <Receipt size={48} className={styles.icon} />
      <h1 className={styles.title}>Overhead</h1>
      <p className={styles.description}>
        Track monthly expenses and overhead costs here.
      </p>
    </div>
  );
}
