import { useState, useCallback, useRef } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { db } from '@/services';
import { toast } from '@/stores/useUIStore';

/**
 * Hook to confirm (approve) a pending transaction.
 *
 * Calls `updateDoc` on Firestore to set `status: 'approved'` and
 * `updatedAt: serverTimestamp()`. The existing `usePendingReview`
 * onSnapshot listener automatically removes the item from the
 * pending list — no manual store manipulation needed.
 */
export function useConfirmTransaction(transactionId: string) {
  const { t } = useTranslation();
  const [isConfirming, setIsConfirming] = useState(false);
  const isConfirmingRef = useRef(false);

  const confirm = useCallback(async () => {
    if (isConfirmingRef.current || !transactionId) return;

    isConfirmingRef.current = true;
    setIsConfirming(true);
    try {
      await updateDoc(doc(db, 'transactions', transactionId), {
        status: 'approved',
        updatedAt: serverTimestamp(),
      });
      toast.success(t('review.ghostText.confirmed'));
    } catch (error) {
      toast.error(t('review.ghostText.confirmError'));
      throw error;
    } finally {
      isConfirmingRef.current = false;
      setIsConfirming(false);
    }
  }, [transactionId, t]);

  return { confirm, isConfirming };
}
