import { create } from 'zustand';
import type { Overhead } from '@/types';

interface OverheadStore {
  overhead: Overhead[];
  loading: boolean;
  error: string | null;
  setOverhead: (items: Overhead[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useOverheadStore = create<OverheadStore>((set) => ({
  overhead: [],
  loading: true,
  error: null,
  setOverhead: (overhead) => set({ overhead, loading: false, error: null }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error, loading: false }),
}));

// Selectors (OUTSIDE store per architecture pattern)
export const selectByCategory = (category: string) => (state: OverheadStore) =>
  state.overhead.filter((item) => item.category === category);

export const selectCurrentMonth = (state: OverheadStore) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  return state.overhead.filter((item) => {
    // Include one-time entries from current month
    if (item.recurrence === 'one_time') {
      return item.date.getFullYear() === year && item.date.getMonth() === month;
    }
    // Include all active recurring entries (they contribute every month)
    return item.isActive;
  });
};

export const selectPreviousMonth = (state: OverheadStore) => {
  const now = new Date();
  const prevMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
  const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  return state.overhead.filter((item) => {
    if (item.recurrence === 'one_time') {
      return item.date.getFullYear() === prevYear && item.date.getMonth() === prevMonth;
    }
    return item.isActive;
  });
};

export const selectRecurring = (state: OverheadStore) =>
  state.overhead.filter((item) => item.recurrence !== 'one_time' && item.isActive);

/**
 * Calculate monthly burn rate from overhead entries.
 * Rules:
 * - one_time: full amountAgora
 * - monthly: full amountAgora
 * - yearly: Math.round(amountAgora / 12)
 * Entries should already be filtered to the target period.
 */
export function calculateBurn(entries: Overhead[]): number {
  return entries.reduce((sum, item) => {
    if (item.recurrence === 'yearly') return sum + Math.round(item.amountAgora / 12);
    return sum + item.amountAgora; // one_time + monthly
  }, 0);
}
