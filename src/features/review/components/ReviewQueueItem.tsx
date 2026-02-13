import { useTranslation } from 'react-i18next';
import { ConfidenceBadge } from '@/components/Badge';
import { Badge } from '@/components/Badge';
import { formatCurrency } from '@/lib/currency';
import { relativeTime } from '@/lib/dates';
import type { Transaction } from '@/types';
import styles from './ReviewQueueItem.module.scss';

export interface ReviewQueueItemProps {
  transaction: Transaction;
  selected?: boolean;
  onSelect: (transactionId: string) => void;
}

export function ReviewQueueItem({
  transaction,
  selected = false,
  onSelect,
}: ReviewQueueItemProps) {
  const { t } = useTranslation();

  const classNames = [styles.item, selected ? styles.selected : '']
    .filter(Boolean)
    .join(' ');

  return (
    <button
      className={classNames}
      onClick={() => onSelect(transaction.id)}
      type="button"
      aria-pressed={selected}
      aria-label={`${transaction.vendorName} — ${formatCurrency(transaction.amountAgora, transaction.currency)}`}
    >
      <div className={styles.mainRow}>
        <span className={styles.vendorName}>{transaction.vendorName}</span>
        <span className={styles.amount}>
          {formatCurrency(transaction.amountAgora, transaction.currency)}
        </span>
      </div>
      <div className={styles.metaRow}>
        <ConfidenceBadge
          confidence={transaction.aiConfidence ?? 0}
          className={styles.confidence}
        />
        <span className={styles.date}>{relativeTime(transaction.date, undefined, t)}</span>
        {transaction.sourceEmailRef && (
          <Badge
            label={t('review.queue.mailboxSource', {
              mailbox: transaction.sourceEmailRef,
            })}
            className={styles.mailbox}
          />
        )}
      </div>
    </button>
  );
}
