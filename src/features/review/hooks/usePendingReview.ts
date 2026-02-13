import { useMemo } from 'react';
import { useFirestoreCollection } from '@/hooks';
import { useTransactionStore, selectPendingReview } from '@/stores';
import { transactionSchema } from '@/types';

/**
 * Real-time hook for pending review transactions.
 *
 * Subscribes to the `transactions` Firestore collection, wires data into
 * `useTransactionStore`, and returns only `pending_review` items sorted
 * by `aiConfidence` ascending (low-confidence first — needs most attention).
 *
 * Follows the useDashboardData pattern: full store access + useMemo
 * to prevent React 19 + Zustand re-render loops. Reuses the shared
 * `selectPendingReview` selector for DRY consistency with Dashboard.
 */
export function usePendingReview() {
  const txnStore = useTransactionStore();

  // Subscribe to Firestore — merges into shared store
  useFirestoreCollection('transactions', transactionSchema, {
    onData: txnStore.setTransactions,
    onError: txnStore.setError,
    onLoading: txnStore.setLoading,
  });

  // Derive pending transactions via useMemo (avoids re-render loops).
  // Uses selectPendingReview for the filter, then sorts by confidence.
  const pendingTransactions = useMemo(
    () =>
      [...selectPendingReview(txnStore)].sort(
        (a, b) => (a.aiConfidence ?? 0) - (b.aiConfidence ?? 0),
      ),
    [txnStore.transactions],
  );

  return {
    pendingTransactions,
    loading: txnStore.loading,
    error: txnStore.error,
  };
}
