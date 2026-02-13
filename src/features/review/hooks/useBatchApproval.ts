import { useState, useMemo, useCallback, useRef } from 'react';
import { writeBatch, doc, serverTimestamp } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { db } from '@/services';
import { toast } from '@/stores/useUIStore';
import { toIlsAgora } from '@/lib/currency';
import type { Transaction } from '@/types';

const BATCH_APPROVAL_CONFIDENCE_THRESHOLD = 85;

/**
 * Hook for batch-approving high-confidence pending transactions.
 *
 * Filters transactions by `aiConfidence >= 85`, provides total amount,
 * and executes atomic Firestore `writeBatch` to approve all eligible items.
 *
 * The existing `usePendingReview` onSnapshot listener automatically
 * removes approved items from the pending list — no manual store manipulation needed.
 */
export function useBatchApproval(pendingTransactions: Transaction[]) {
  const { t } = useTranslation();
  const [isBatchApproving, setIsBatchApproving] = useState(false);
  const [showBatchConfirm, setShowBatchConfirm] = useState(false);
  const isBatchApprovingRef = useRef(false);

  const batchEligible = useMemo(
    () =>
      pendingTransactions.filter(
        (tx) => (tx.aiConfidence ?? 0) >= BATCH_APPROVAL_CONFIDENCE_THRESHOLD,
      ),
    [pendingTransactions],
  );

  // Convert each transaction's amount to ILS agora before summing
  // to handle mixed-currency batches correctly (e.g. ILS + USD)
  const totalAmountIlsAgora = useMemo(
    () =>
      batchEligible.reduce(
        (sum, tx) => sum + toIlsAgora(tx.amountAgora ?? 0, tx.currency),
        0,
      ),
    [batchEligible],
  );

  const requestBatchApproval = useCallback(() => {
    setShowBatchConfirm(true);
  }, []);

  const cancelBatchApproval = useCallback(() => {
    setShowBatchConfirm(false);
  }, []);

  const confirmBatchApproval = useCallback(async () => {
    if (isBatchApprovingRef.current || batchEligible.length === 0) return;

    isBatchApprovingRef.current = true;
    setIsBatchApproving(true);

    try {
      const batch = writeBatch(db);

      for (const txn of batchEligible) {
        const txnRef = doc(db, 'transactions', txn.id);
        batch.update(txnRef, {
          status: 'approved',
          updatedAt: serverTimestamp(),
        });
      }

      await batch.commit();

      const count = batchEligible.length;
      toast.success(t('review.batchApproval.success', { count }));
      setShowBatchConfirm(false);
    } catch {
      toast.error(t('review.batchApproval.error'));
      setShowBatchConfirm(false);
    } finally {
      isBatchApprovingRef.current = false;
      setIsBatchApproving(false);
    }
  }, [batchEligible, t]);

  return {
    batchEligible,
    totalAmountIlsAgora,
    isBatchApproving,
    showBatchConfirm,
    requestBatchApproval,
    cancelBatchApproval,
    confirmBatchApproval,
  };
}
