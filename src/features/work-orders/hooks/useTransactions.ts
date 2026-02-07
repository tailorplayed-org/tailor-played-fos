import { useFirestoreCollection } from '@/hooks';
import { useTransactionStore } from '@/stores';
import { transactionSchema } from '@/types';

/**
 * Subscribes to the transactions Firestore collection in real-time.
 * Parses documents through transactionSchema and syncs into useTransactionStore.
 */
export function useTransactions() {
  const { setTransactions, setLoading, setError } = useTransactionStore();

  useFirestoreCollection('transactions', transactionSchema, {
    onData: setTransactions,
    onError: setError,
    onLoading: setLoading,
  });

  return useTransactionStore();
}
