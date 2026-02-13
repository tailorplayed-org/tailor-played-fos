import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, CheckCircle, FileText, CaretDown, CaretUp } from '@phosphor-icons/react';
import { Button } from '@/components/Button';
import type { Transaction, TransactionCategory } from '@/types';
import type { AnimationPhase } from './GhostTextCard';
import { GhostTextCard } from './GhostTextCard';
import styles from './MobileGhostTextView.module.scss';

export interface MobileGhostTextViewProps {
  transaction: Transaction;
  currentIndex: number;
  totalCount: number;
  onBack: () => void;
  onConfirm: () => void;
  onEdit: () => void;
  onReject: () => void;
  isConfirming?: boolean;
  animationPhase?: AnimationPhase;
  editMode?: boolean;
  editedCategory?: TransactionCategory | null;
  editedProjectId?: string | null;
  onCategoryChange?: (value: TransactionCategory) => void;
  onProjectChange?: (projectId: string) => void;
  onDropdownToggle?: (isOpen: boolean) => void;
  showRejectConfirm?: boolean;
  onRejectCancel?: () => void;
  isRejecting?: boolean;
}

/**
 * Full-screen mobile Ghost Text review view.
 *
 * Wraps the existing GhostTextCard in a mobile-optimized layout with:
 * - Back arrow + "Review X of Y" counter header
 * - Collapsible invoice preview
 * - Full-width stacked action buttons
 * - "All caught up" empty state
 */
export function MobileGhostTextView({
  transaction,
  currentIndex,
  totalCount,
  onBack,
  onConfirm,
  onEdit,
  onReject,
  isConfirming = false,
  animationPhase = 'idle',
  editMode = false,
  editedCategory = null,
  editedProjectId = null,
  onCategoryChange,
  onProjectChange,
  onDropdownToggle,
  showRejectConfirm = false,
  onRejectCancel,
  isRejecting = false,
}: MobileGhostTextViewProps) {
  const { t } = useTranslation();
  const [invoiceExpanded, setInvoiceExpanded] = useState(false);
  const [invoiceError, setInvoiceError] = useState(false);

  const handleInvoiceError = useCallback(() => {
    setInvoiceError(true);
  }, []);

  // "All caught up" state when no transaction provided (totalCount === 0)
  if (totalCount === 0) {
    return (
      <div className={styles.fullScreen} data-testid="mobile-ghost-text-view">
        <div className={styles.header}>
          <button
            className={styles.backButton}
            onClick={onBack}
            aria-label={t('review.mobile.back')}
          >
            <ArrowLeft size={24} />
          </button>
        </div>
        <div className={styles.allCaughtUp}>
          <CheckCircle size={64} weight="fill" className={styles.allCaughtUpIcon} />
          <h2 className={styles.allCaughtUpTitle}>
            {t('review.mobile.allCaughtUp')}
          </h2>
          <p className={styles.allCaughtUpMessage}>
            {t('review.mobile.allCaughtUpMessage')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.fullScreen} data-testid="mobile-ghost-text-view">
      {/* Header: back arrow + review counter */}
      <div className={styles.header}>
        <button
          className={styles.backButton}
          onClick={onBack}
          aria-label={t('review.mobile.back')}
        >
          <ArrowLeft size={24} />
        </button>
        <span className={styles.counter}>
          {t('review.mobile.reviewCounter', {
            current: currentIndex + 1,
            total: totalCount,
          })}
        </span>
      </div>

      {/* Collapsible invoice preview */}
      {transaction.originalFileUrl && (
        <div className={styles.invoiceSection}>
          <button
            className={styles.invoiceToggle}
            onClick={() => setInvoiceExpanded(!invoiceExpanded)}
            aria-expanded={invoiceExpanded}
          >
            <span className={styles.invoiceLabel}>
              <FileText size={18} />
              {t('review.mobile.invoicePreview')}
            </span>
            <span className={styles.invoiceHint}>
              {invoiceExpanded ? (
                <>
                  {t('review.mobile.tapToCollapse')} <CaretUp size={14} />
                </>
              ) : (
                <>
                  {t('review.mobile.tapToExpand')} <CaretDown size={14} />
                </>
              )}
            </span>
          </button>
          {invoiceExpanded && (
            <div className={styles.invoicePreview}>
              {invoiceError ? (
                <p className={styles.invoiceErrorText}>
                  {t('review.mobile.invoiceLoadError', 'Could not load invoice preview')}
                </p>
              ) : (
                <img
                  src={transaction.originalFileUrl}
                  alt={t('review.mobile.invoicePreview')}
                  onError={handleInvoiceError}
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* Ghost Text Card content */}
      <div className={styles.cardContainer}>
        <GhostTextCard
          transaction={transaction}
          onConfirm={onConfirm}
          onEdit={onEdit}
          onReject={onReject}
          isConfirming={isConfirming}
          animationPhase={animationPhase}
          editMode={editMode}
          editedCategory={editedCategory}
          editedProjectId={editedProjectId}
          onCategoryChange={onCategoryChange}
          onProjectChange={onProjectChange}
          onDropdownToggle={onDropdownToggle}
          showRejectConfirm={showRejectConfirm}
          onRejectCancel={onRejectCancel}
          isRejecting={isRejecting}
        />
      </div>
    </div>
  );
}
