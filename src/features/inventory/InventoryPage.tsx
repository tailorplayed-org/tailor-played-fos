import { Package } from '@phosphor-icons/react';
import styles from './InventoryPage.module.scss';

export function InventoryPage() {
  return (
    <div className={styles.placeholder}>
      <Package size={48} className={styles.icon} />
      <h1 className={styles.title}>Inventory</h1>
      <p className={styles.description}>
        Manage your ingredients and stock levels here.
      </p>
    </div>
  );
}
