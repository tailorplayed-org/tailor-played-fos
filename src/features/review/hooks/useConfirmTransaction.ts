import { useState, useCallback, useRef } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { db } from '@/services';
import { toast } from '@/stores/useUIStore';
import type { TransactionCategory } from '@/types';

export interface ConfirmOverrides {
  category?: TransactionCategory;
  workOrderId?: string;
}

/**
 * Hook to confirm (approve) a pending transaction.
 *
 * Calls `updateDoc` on Firestore to set `status: 'approved'` and
 * `updatedAt: serverTimestamp()`. When overrides are provided,
 * they are included in the update payload (edited category, workOrderId).
 *
 * The existing `usePendingReview` onSnapshot listener automatically
 * removes the item from the pending list — no manual store manipulation needed.
 */
export function useConfirmTransaction(transactionId: string) {
  const { t } = useTranslation();
  const [isConfirming, setIsConfirming] = useState(false);
  const isConfirmingRef = useRef(false);

  const confirm = useCallback(
    async (overrides?: ConfirmOverrides) => {
      if (isConfirmingRef.current || !transactionId) return;

      isConfirmingRef.current = true;
      setIsConfirming(true);
      try {
        const updates: Record<string, unknown> = {
          status: 'approved',
          updatedAt: serverTimestamp(),
        };

        if (overrides?.category) {
          updates.category = overrides.category;
        }
        if (overrides?.workOrderId) {
          updates.workOrderId = overrides.workOrderId;
          updates.suggestedWorkOrderId = overrides.workOrderId;
        }

        await updateDoc(doc(db, 'transactions', transactionId), updates);
        toast.success(t('review.ghostText.confirmed'));
      } catch (error) {
        toast.error(t('review.ghostText.confirmError'));
        throw error;
      } finally {
        isConfirmingRef.current = false;
        setIsConfirming(false);
      }
    },
    [transactionId, t],
  );

  return { confirm, isConfirming };
}
