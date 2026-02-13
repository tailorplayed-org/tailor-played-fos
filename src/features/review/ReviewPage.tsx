import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { WarningCircle } from '@phosphor-icons/react';
import { toast } from '@/stores/useUIStore';
import type { TransactionCategory } from '@/types';
import type { AnimationPhase } from './components';
import { usePendingReview, useGhostTextKeyboard, useConfirmTransaction, useRejectTransaction } from './hooks';
import { ReviewQueue, GhostTextOverlay } from './components';
import styles from './ReviewPage.module.scss';

export function ReviewPage() {
  const { t } = useTranslation();
  const { pendingTransactions, loading, error } = usePendingReview();
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const [animationPhase, setAnimationPhase] = useState<AnimationPhase>('idle');
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // ─── Edit state ───
  const [isEditing, setIsEditing] = useState(false);
  const [editedCategory, setEditedCategory] = useState<TransactionCategory | null>(null);
  const [editedProjectId, setEditedProjectId] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // ─── Reject state ───
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);

  const clearTimeouts = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  }, []);

  // Cleanup all pending timeouts on unmount
  useEffect(() => {
    return () => clearTimeouts();
  }, [clearTimeouts]);

  const selectedTransaction = useMemo(
    () => pendingTransactions.find((tx) => tx.id === selectedTransactionId) ?? null,
    [pendingTransactions, selectedTransactionId],
  );

  const { confirm, isConfirming } = useConfirmTransaction(selectedTransactionId ?? '');
  const { reject, isRejecting } = useRejectTransaction(selectedTransactionId ?? '');

  // ─── Reset edit/reject state ───
  const resetEditState = useCallback(() => {
    setIsEditing(false);
    setEditedCategory(null);
    setEditedProjectId(null);
    setIsDropdownOpen(false);
    setShowRejectConfirm(false);
  }, []);

  // ─── Handlers ───

  const handleClose = useCallback(() => {
    clearTimeouts();
    setSelectedTransactionId(null);
    setAnimationPhase('idle');
    resetEditState();
  }, [clearTimeouts, resetEditState]);

  const handleConfirm = useCallback(async () => {
    if (isConfirming || !selectedTransactionId || showRejectConfirm) return;

    clearTimeouts();

    // Build overrides from edited values
    const overrides: { category?: TransactionCategory; workOrderId?: string } = {};
    if (editedCategory) overrides.category = editedCategory;
    if (editedProjectId) overrides.workOrderId = editedProjectId;

    // Phase 1: Gold glow (200ms)
    setAnimationPhase('glowing');

    const t1 = setTimeout(() => {
      // Phase 2: Text solidify (200ms)
      setAnimationPhase('solidifying');

      const t2 = setTimeout(async () => {
        // Confirm BEFORE exit animation — avoids jarring snap-back on error
        try {
          await confirm(Object.keys(overrides).length > 0 ? overrides : undefined);
        } catch {
          // Error toast already shown by hook; reset animation and keep card open
          setAnimationPhase('idle');
          return;
        }

        // Phase 3: Card exit (300ms) — only on success
        setAnimationPhase('exiting');

        const t3 = setTimeout(() => {
          // After exit animation: advance to next item or clear
          const currentIndex = pendingTransactions.findIndex(
            (tx) => tx.id === selectedTransactionId,
          );
          const nextItem = pendingTransactions[currentIndex + 1];
          if (nextItem) {
            setSelectedTransactionId(nextItem.id);
          } else {
            setSelectedTransactionId(null);
          }
          setAnimationPhase('idle');
          resetEditState();
        }, 300);
        timeoutsRef.current.push(t3);
      }, 200);
      timeoutsRef.current.push(t2);
    }, 200);
    timeoutsRef.current.push(t1);
  }, [isConfirming, selectedTransactionId, showRejectConfirm, confirm, pendingTransactions, clearTimeouts, editedCategory, editedProjectId, resetEditState]);

  const handleEdit = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleReject = useCallback(() => {
    setShowRejectConfirm(true);
  }, []);

  const handleRejectConfirm = useCallback(async () => {
    try {
      await reject();
    } catch {
      // Error toast shown by hook; keep card open
      return;
    }

    // Play red flash exit animation
    setAnimationPhase('rejectExiting');

    const t1 = setTimeout(() => {
      // After exit animation: advance to next item or clear
      const currentIndex = pendingTransactions.findIndex(
        (tx) => tx.id === selectedTransactionId,
      );
      const nextItem = pendingTransactions[currentIndex + 1];
      if (nextItem) {
        setSelectedTransactionId(nextItem.id);
      } else {
        setSelectedTransactionId(null);
      }
      setAnimationPhase('idle');
      resetEditState();
    }, 500); // 200ms flash + 300ms slide
    timeoutsRef.current.push(t1);
  }, [reject, pendingTransactions, selectedTransactionId, resetEditState]);

  const handleRejectCancel = useCallback(() => {
    setShowRejectConfirm(false);
  }, []);

  const handleCategoryChange = useCallback((value: TransactionCategory) => {
    setEditedCategory(value);
  }, []);

  const handleProjectChange = useCallback((projectId: string) => {
    setEditedProjectId(projectId);
  }, []);

  const handleDropdownToggle = useCallback((open: boolean) => {
    setIsDropdownOpen(open);
  }, []);

  const handleCloseDropdown = useCallback(() => {
    setIsDropdownOpen(false);
  }, []);

  const handleNext = useCallback(() => {
    const currentIndex = pendingTransactions.findIndex(
      (tx) => tx.id === selectedTransactionId,
    );
    if (currentIndex < pendingTransactions.length - 1) {
      setSelectedTransactionId(pendingTransactions[currentIndex + 1].id);
      resetEditState();
    } else {
      toast.info(t('review.ghostText.noMoreItems'));
    }
  }, [pendingTransactions, selectedTransactionId, t, resetEditState]);

  const handlePrevious = useCallback(() => {
    const currentIndex = pendingTransactions.findIndex(
      (tx) => tx.id === selectedTransactionId,
    );
    if (currentIndex > 0) {
      setSelectedTransactionId(pendingTransactions[currentIndex - 1].id);
      resetEditState();
    }
  }, [pendingTransactions, selectedTransactionId, resetEditState]);

  // ─── Keyboard shortcuts ───
  useGhostTextKeyboard({
    isOpen: selectedTransaction !== null,
    isConfirming,
    isEditing,
    isDropdownOpen,
    onConfirm: handleConfirm,
    onEdit: handleEdit,
    onReject: handleReject,
    onClose: handleClose,
    onNext: handleNext,
    onPrevious: handlePrevious,
    onCloseDropdown: handleCloseDropdown,
  });

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

      {selectedTransaction && (
        <GhostTextOverlay
          transaction={selectedTransaction}
          onConfirm={handleConfirm}
          onEdit={handleEdit}
          onReject={showRejectConfirm ? handleRejectConfirm : handleReject}
          onClose={handleClose}
          isConfirming={isConfirming}
          animationPhase={animationPhase}
          editMode={isEditing}
          editedCategory={editedCategory}
          editedProjectId={editedProjectId}
          onCategoryChange={handleCategoryChange}
          onProjectChange={handleProjectChange}
          onDropdownToggle={handleDropdownToggle}
          showRejectConfirm={showRejectConfirm}
          onRejectCancel={handleRejectCancel}
          isRejecting={isRejecting}
        />
      )}
    </div>
  );
}
