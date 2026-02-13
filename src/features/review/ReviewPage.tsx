import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { WarningCircle } from '@phosphor-icons/react';
import { toast } from '@/stores/useUIStore';
import { usePendingReview, useGhostTextKeyboard, useConfirmTransaction } from './hooks';
import { ReviewQueue, GhostTextOverlay } from './components';
import styles from './ReviewPage.module.scss';

type AnimationPhase = 'idle' | 'glowing' | 'solidifying' | 'exiting';

export function ReviewPage() {
  const { t } = useTranslation();
  const { pendingTransactions, loading, error } = usePendingReview();
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const [animationPhase, setAnimationPhase] = useState<AnimationPhase>('idle');
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

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

  // ─── Handlers ───

  const handleClose = useCallback(() => {
    clearTimeouts();
    setSelectedTransactionId(null);
    setAnimationPhase('idle');
  }, [clearTimeouts]);

  const handleConfirm = useCallback(async () => {
    if (isConfirming || !selectedTransactionId) return;

    clearTimeouts();

    // Phase 1: Gold glow (200ms)
    setAnimationPhase('glowing');

    const t1 = setTimeout(() => {
      // Phase 2: Text solidify (200ms)
      setAnimationPhase('solidifying');

      const t2 = setTimeout(async () => {
        // Confirm BEFORE exit animation — avoids jarring snap-back on error
        try {
          await confirm();
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
        }, 300);
        timeoutsRef.current.push(t3);
      }, 200);
      timeoutsRef.current.push(t2);
    }, 200);
    timeoutsRef.current.push(t1);
  }, [isConfirming, selectedTransactionId, confirm, pendingTransactions, clearTimeouts]);

  const handleEdit = useCallback(() => {
    toast.info(t('review.ghostText.editComingSoon'));
  }, [t]);

  const handleReject = useCallback(() => {
    toast.info(t('review.ghostText.rejectComingSoon'));
  }, [t]);

  const handleNext = useCallback(() => {
    const currentIndex = pendingTransactions.findIndex(
      (tx) => tx.id === selectedTransactionId,
    );
    if (currentIndex < pendingTransactions.length - 1) {
      setSelectedTransactionId(pendingTransactions[currentIndex + 1].id);
    } else {
      toast.info(t('review.ghostText.noMoreItems'));
    }
  }, [pendingTransactions, selectedTransactionId, t]);

  const handlePrevious = useCallback(() => {
    const currentIndex = pendingTransactions.findIndex(
      (tx) => tx.id === selectedTransactionId,
    );
    if (currentIndex > 0) {
      setSelectedTransactionId(pendingTransactions[currentIndex - 1].id);
    }
  }, [pendingTransactions, selectedTransactionId]);

  // ─── Keyboard shortcuts ───
  useGhostTextKeyboard({
    isOpen: selectedTransaction !== null,
    isConfirming,
    onConfirm: handleConfirm,
    onEdit: handleEdit,
    onReject: handleReject,
    onClose: handleClose,
    onNext: handleNext,
    onPrevious: handlePrevious,
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
          onReject={handleReject}
          onClose={handleClose}
          isConfirming={isConfirming}
          animationPhase={animationPhase}
        />
      )}
    </div>
  );
}
