import { useTranslation } from 'react-i18next';
import { Lightning } from '@phosphor-icons/react';
import { Button } from '@/components/Button';
import { formatCurrency } from '@/lib/currency';
import type { Transaction } from '@/types';
import styles from './ApproveAllBar.module.scss';

export interface ApproveAllBarProps {
  batchEligible: Transaction[];
  /** Total amount in ILS agora (multi-currency amounts pre-converted) */
  totalAmountIlsAgora: number;
  isBatchApproving: boolean;
  showBatchConfirm: boolean;
  onApproveAll: () => void;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Sticky bottom bar for batch-approving high-confidence transactions.
 *
 * Shows count + total amount + "Approve All" button in default state.
 * Switches to confirmation summary + Confirm/Cancel in confirm state.
 * Hidden when fewer than 2 eligible items.
 */
export function ApproveAllBar({
  batchEligible,
  totalAmountIlsAgora,
  isBatchApproving,
  showBatchConfirm,
  onApproveAll,
  onConfirm,
  onCancel,
}: ApproveAllBarProps) {
  const { t } = useTranslation();

  if (batchEligible.length < 2) return null;

  const count = batchEligible.length;
  const formattedAmount = formatCurrency(totalAmountIlsAgora, 'ILS');

  return (
    <div className={styles.bar} aria-live="polite" data-testid="approve-all-bar">
      {showBatchConfirm ? (
        <div className={styles.confirmContent} role="alertdialog" aria-label={t('review.batchApproval.confirmTitle', { count, amount: formattedAmount })}>
          <span className={styles.confirmText}>
            {t('review.batchApproval.confirmTitle', {
              count,
              amount: formattedAmount,
            })}
          </span>
          <div className={styles.confirmActions}>
            <Button
              variant="primary"
              className={styles.confirmButton}
              onClick={onConfirm}
              loading={isBatchApproving}
              disabled={isBatchApproving}
            >
              {t('review.batchApproval.confirm')}
            </Button>
            <Button
              variant="secondary"
              className={styles.cancelButton}
              onClick={onCancel}
              disabled={isBatchApproving}
            >
              {t('review.batchApproval.cancel')}
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className={styles.info}>
            <span className={styles.count}>
              {t('review.batchApproval.itemsReady', { count })}
            </span>
            <span className={styles.amount}>
              {t('review.batchApproval.totalAmount', {
                amount: formattedAmount,
              })}
            </span>
          </div>
          <Button
            variant="primary"
            className={styles.approveButton}
            onClick={onApproveAll}
          >
            <Lightning size={18} weight="fill" />
            {t('review.batchApproval.approveAll')}
          </Button>
        </>
      )}
    </div>
  );
}
