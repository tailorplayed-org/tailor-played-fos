import { useState, useCallback, useRef } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { db } from '@/services';
import { toast } from '@/stores/useUIStore';

/**
 * Hook to reject a pending transaction.
 *
 * Calls `updateDoc` on Firestore to set `status: 'rejected'` and
 * `updatedAt: serverTimestamp()`. The existing `usePendingReview`
 * onSnapshot listener automatically removes the item from the
 * pending list — no manual store manipulation needed.
 */
export function useRejectTransaction(transactionId: string) {
  const { t } = useTranslation();
  const [isRejecting, setIsRejecting] = useState(false);
  const isRejectingRef = useRef(false);

  const reject = useCallback(async () => {
    if (isRejectingRef.current || !transactionId) return;

    isRejectingRef.current = true;
    setIsRejecting(true);
    try {
      await updateDoc(doc(db, 'transactions', transactionId), {
        status: 'rejected',
        updatedAt: serverTimestamp(),
      });
      toast.success(t('review.ghostText.rejected'));
    } catch (error) {
      toast.error(t('review.ghostText.rejectError'));
      throw error;
    } finally {
      isRejectingRef.current = false;
      setIsRejecting(false);
    }
  }, [transactionId, t]);

  return { reject, isRejecting };
}
