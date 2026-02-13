import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { WarningCircle } from '@phosphor-icons/react';
import { usePendingReview } from './hooks';
import { ReviewQueue } from './components';
import styles from './ReviewPage.module.scss';

export function ReviewPage() {
  const { t } = useTranslation();
  const { pendingTransactions, loading, error } = usePendingReview();
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{t('pages.review.title')}</h1>

      {error ? (
        <div className={styles.errorState} role="alert">
          <WarningCircle size={48} className={styles.errorIcon} />
          <p className={styles.errorText}>{t('review.error.title')}</p>
          <p className={styles.errorDetail}>{error}</p>
        </div>
      ) : (
        <div className={styles.content}>
          <ReviewQueue
            transactions={pendingTransactions}
            loading={loading}
            selectedId={selectedTransactionId}
            onSelect={setSelectedTransactionId}
          />
        </div>
      )}
    </div>
  );
}
