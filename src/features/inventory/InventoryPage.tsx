import { useTranslation } from 'react-i18next';
import { Package } from '@phosphor-icons/react';
import styles from './InventoryPage.module.scss';

export function InventoryPage() {
  const { t } = useTranslation();

  return (
    <div className={styles.placeholder}>
      <Package size={48} className={styles.icon} />
      <h1 className={styles.title}>{t('pages.inventory.title')}</h1>
      <p className={styles.description}>
        {t('pages.inventory.placeholder')}
      </p>
    </div>
  );
}
