import { useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/Button';
import styles from './RejectConfirmDialog.module.scss';

export interface RejectConfirmDialogProps {
  /** Called when user cancels the rejection */
  onCancel: () => void;
  /** Called when user confirms the rejection */
  onConfirm: () => void;
  /** Whether the reject operation is in progress */
  isRejecting?: boolean;
}

/**
 * Inline confirmation dialog for rejecting a transaction.
 * Renders within the GhostTextCard, replacing the action buttons area.
 */
export function RejectConfirmDialog({
  onCancel,
  onConfirm,
  isRejecting = false,
}: RejectConfirmDialogProps) {
  const { t } = useTranslation();
  const dialogRef = useRef<HTMLDivElement>(null);

  // Focus the cancel button when dialog appears
  useEffect(() => {
    const cancelBtn = dialogRef.current?.querySelector('button');
    cancelBtn?.focus();
  }, []);

  return (
    <div
      className={styles.rejectDialog}
      role="alertdialog"
      aria-describedby="reject-confirm-message"
      ref={dialogRef}
    >
      <p id="reject-confirm-message" className={styles.message}>
        <strong>{t('review.ghostText.rejectConfirmTitle')}</strong>{' '}
        {t('review.ghostText.rejectConfirmMessage')}
      </p>
      <div className={styles.actions}>
        <Button
          variant="secondary"
          onClick={onCancel}
          disabled={isRejecting}
        >
          {t('review.ghostText.cancel')}
        </Button>
        <Button
          variant="danger"
          onClick={onConfirm}
          loading={isRejecting}
          disabled={isRejecting}
        >
          {t('actions.reject')}
        </Button>
      </div>
    </div>
  );
}
