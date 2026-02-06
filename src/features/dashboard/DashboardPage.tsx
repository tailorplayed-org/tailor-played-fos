import { ChartBar } from '@phosphor-icons/react';
import styles from './DashboardPage.module.scss';

export function DashboardPage() {
  return (
    <div className={styles.placeholder}>
      <ChartBar size={48} className={styles.icon} />
      <h1 className={styles.title}>Dashboard</h1>
      <p className={styles.description}>
        Your financial cockpit is coming soon.
      </p>
    </div>
  );
}
