import { useTranslation } from 'react-i18next';
import { CheckCircle } from '@phosphor-icons/react';
import { Skeleton } from '@/components/Skeleton';
import type { Transaction } from '@/types';
import { ReviewQueueItem } from './ReviewQueueItem';
import styles from './ReviewQueue.module.scss';

export interface ReviewQueueProps {
  transactions: Transaction[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (transactionId: string) => void;
  lastReviewedAt?: Date | null;
}

function LoadingSkeleton() {
  return (
    <div className={styles.skeletonList} aria-busy="true">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className={styles.skeletonItem}>
          <div className={styles.skeletonMainRow}>
            <Skeleton width="60%" height={16} />
            <Skeleton width="20%" height={16} />
          </div>
          <div className={styles.skeletonMetaRow}>
            <Skeleton width={64} height={20} variant="rect" />
            <Skeleton width={80} height={14} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ReviewQueue({
  transactions,
  loading,
  selectedId,
  onSelect,
  lastReviewedAt,
}: ReviewQueueProps) {
  const { t } = useTranslation();

  if (loading) {
    return <LoadingSkeleton />;
  }

  // Empty state
  if (transactions.length === 0) {
    return (
      <div className={styles.emptyState}>
        <CheckCircle size={48} weight="light" className={styles.emptyIcon} />
        <p className={styles.emptyText}>{t('empty.allCaughtUp')}</p>
        {lastReviewedAt && (
          <p className={styles.lastReviewTime}>
            {t('review.queue.lastReviewAt', {
              time: lastReviewedAt.toLocaleString(),
            })}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={styles.queue}>
      <div className={styles.header}>
        <span className={styles.pendingCount}>
          {t('review.queue.pendingCount', { count: transactions.length })}
        </span>
        <span className={styles.sortHint}>
          {t('review.queue.sortedByAttention')}
        </span>
      </div>

      <div className={styles.list} role="list">
        {transactions.map((txn) => (
          <div key={txn.id} role="listitem">
            <ReviewQueueItem
              transaction={txn}
              selected={txn.id === selectedId}
              onSelect={onSelect}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
