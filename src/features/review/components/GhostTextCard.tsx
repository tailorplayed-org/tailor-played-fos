import { useTranslation } from 'react-i18next';
import { FileText } from '@phosphor-icons/react';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import { formatCurrency } from '@/lib/currency';
import { relativeTime } from '@/lib/dates';
import { useWorkOrderStore, selectWorkOrderById } from '@/stores';
import type { Transaction, TransactionCategory } from '@/types';
import styles from './GhostTextCard.module.scss';

export interface GhostTextCardProps {
  transaction: Transaction;
  onConfirm: () => void;
  onEdit: () => void;
  onReject: () => void;
  isConfirming?: boolean;
  animationPhase?: 'idle' | 'glowing' | 'solidifying' | 'exiting';
}

const CATEGORY_KEYS: Record<TransactionCategory, string> = {
  DirectCost: 'transactions.category.DirectCost',
  InventoryRestock: 'transactions.category.InventoryRestock',
  Overhead: 'transactions.category.Overhead',
  Revenue: 'transactions.category.Revenue',
  Personal: 'transactions.category.Personal',
};

export function GhostTextCard({
  transaction,
  onConfirm,
  onEdit,
  onReject,
  isConfirming = false,
  animationPhase = 'idle',
}: GhostTextCardProps) {
  const { t } = useTranslation();

  const workOrder = useWorkOrderStore(
    selectWorkOrderById(transaction.suggestedWorkOrderId ?? ''),
  );
  const projectName =
    workOrder?.name ?? transaction.suggestedWorkOrderId ?? '—';

  const confidenceValue = transaction.aiConfidence ?? 0;
  const isHighConfidence = confidenceValue >= 85;

  const cardClassNames = [
    styles.ghostTextCard,
    animationPhase !== 'idle' ? styles[animationPhase] : '',
  ]
    .filter(Boolean)
    .join(' ');

  const ghostFieldClassNames = [
    styles.ghostField,
    animationPhase === 'solidifying' || animationPhase === 'exiting'
      ? styles.solidified
      : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={cardClassNames} role="dialog" aria-modal="true" aria-label={transaction.vendorName}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerMain}>
          <FileText size={24} className={styles.headerIcon} />
          <span className={styles.vendorName}>{transaction.vendorName}</span>
        </div>
        <div className={styles.headerMeta}>
          <span className={styles.date}>
            {relativeTime(transaction.date, undefined, t)}
          </span>
          <span className={styles.amount}>
            {formatCurrency(transaction.amountAgora, transaction.currency)}
          </span>
          {transaction.isEstimatedConversion && (
            <Badge
              label={t('review.ghostText.estimated')}
              color="warning"
            />
          )}
        </div>
      </div>

      {/* Ghost Text Fields */}
      <div className={styles.ghostFields}>
        <div className={ghostFieldClassNames}>
          <span className={styles.ghostFieldLabel}>
            {t('review.ghostText.category')}
          </span>
          <span className={styles.ghostFieldValue}>
            {t(CATEGORY_KEYS[transaction.category])}
          </span>
        </div>
        <div className={ghostFieldClassNames}>
          <span className={styles.ghostFieldLabel}>
            {t('review.ghostText.project')}
          </span>
          <span className={styles.ghostFieldValue}>{projectName}</span>
        </div>
      </div>

      {/* Confidence Bar */}
      <div className={styles.confidenceSection}>
        <span className={styles.confidenceLabel}>
          {t('review.ghostText.confidence')}
        </span>
        <div className={styles.confidenceBarTrack}>
          <div
            className={`${styles.confidenceBarFill} ${isHighConfidence ? styles.high : styles.low}`}
            style={{ width: `${confidenceValue}%` }}
            role="progressbar"
            aria-valuenow={confidenceValue}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${t('review.ghostText.confidence')}: ${confidenceValue}%`}
          />
        </div>
        <span
          className={`${styles.confidencePercent} ${isHighConfidence ? styles.high : styles.low}`}
        >
          {confidenceValue}%
        </span>
      </div>

      {/* AI Reasoning */}
      {transaction.classificationReasoning && (
        <div className={styles.aiReasoning}>
          <span className={styles.aiReasoningLabel}>
            {t('review.ghostText.aiReasoning')}
          </span>
          <p className={styles.aiReasoningText}>
            {transaction.classificationReasoning}
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className={styles.actionButtons}>
        <Button
          variant="primary"
          shortcut="Enter"
          onClick={onConfirm}
          loading={isConfirming}
          disabled={isConfirming}
        >
          {t('review.ghostText.confirm')}
        </Button>
        <Button variant="secondary" shortcut="E" onClick={onEdit}>
          {t('review.ghostText.edit')}
        </Button>
        <Button variant="danger" shortcut="Del" onClick={onReject}>
          {t('review.ghostText.reject')}
        </Button>
      </div>

      {/* Footer */}
      {transaction.originalFileUrl && (
        <a
          href={transaction.originalFileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.viewOriginal}
        >
          {t('review.ghostText.viewOriginal')} →
        </a>
      )}
    </div>
  );
}
