import { create } from 'zustand';
import type { Transaction, TransactionCategory } from '@/types';

interface TransactionStore {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  setTransactions: (txns: Transaction[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useTransactionStore = create<TransactionStore>((set) => ({
  transactions: [],
  loading: true,
  error: null,
  setTransactions: (transactions) => set({ transactions, loading: false, error: null }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error, loading: false }),
}));

// Selectors (defined outside store per architecture pattern)
export const selectByWorkOrder = (woId: string) => (state: TransactionStore) =>
  state.transactions.filter((t) => t.workOrderId === woId);

export const selectPendingReview = (state: TransactionStore) =>
  state.transactions.filter((t) => t.status === 'pending_review');

export const selectByCategory = (category: TransactionCategory) => (state: TransactionStore) =>
  state.transactions.filter((t) => t.category === category);
