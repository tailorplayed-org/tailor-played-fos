import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePendingReview } from './usePendingReview';

// Mock useFirestoreCollection — we don't want real Firestore in unit tests
vi.mock('@/hooks', () => ({
  useFirestoreCollection: vi.fn(),
}));

// Mock the store — return controlled state
const mockStore = {
  transactions: [] as Array<{ status: string; aiConfidence: number | null; [key: string]: unknown }>,
  loading: true,
  error: null as string | null,
  setTransactions: vi.fn(),
  setLoading: vi.fn(),
  setError: vi.fn(),
};

vi.mock('@/stores', () => ({
  useTransactionStore: () => mockStore,
  selectPendingReview: (state: { transactions: Array<{ status: string }> }) =>
    state.transactions.filter((t) => t.status === 'pending_review'),
}));

describe('usePendingReview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStore.transactions = [];
    mockStore.loading = true;
    mockStore.error = null;
  });

  it('returns loading state when store is loading', () => {
    mockStore.loading = true;
    const { result } = renderHook(() => usePendingReview());

    expect(result.current.loading).toBe(true);
    expect(result.current.pendingTransactions).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('filters only pending_review transactions', () => {
    mockStore.loading = false;
    mockStore.transactions = [
      { id: '1', status: 'pending_review', aiConfidence: 90, vendorName: 'A' },
      { id: '2', status: 'approved', aiConfidence: 95, vendorName: 'B' },
      { id: '3', status: 'pending_review', aiConfidence: 60, vendorName: 'C' },
      { id: '4', status: 'rejected', aiConfidence: 30, vendorName: 'D' },
    ];

    const { result } = renderHook(() => usePendingReview());

    expect(result.current.pendingTransactions).toHaveLength(2);
    expect(result.current.pendingTransactions.map((t) => t.id)).toEqual(['3', '1']);
  });

  it('sorts by aiConfidence ascending (low-confidence first)', () => {
    mockStore.loading = false;
    mockStore.transactions = [
      { id: 'high', status: 'pending_review', aiConfidence: 95, vendorName: 'High' },
      { id: 'low', status: 'pending_review', aiConfidence: 40, vendorName: 'Low' },
      { id: 'mid', status: 'pending_review', aiConfidence: 70, vendorName: 'Mid' },
    ];

    const { result } = renderHook(() => usePendingReview());

    expect(result.current.pendingTransactions[0].id).toBe('low');
    expect(result.current.pendingTransactions[1].id).toBe('mid');
    expect(result.current.pendingTransactions[2].id).toBe('high');
  });

  it('handles null aiConfidence by treating as 0', () => {
    mockStore.loading = false;
    mockStore.transactions = [
      { id: 'conf', status: 'pending_review', aiConfidence: 50, vendorName: 'With' },
      { id: 'null', status: 'pending_review', aiConfidence: null, vendorName: 'Null' },
    ];

    const { result } = renderHook(() => usePendingReview());

    // null confidence → 0, should be sorted first
    expect(result.current.pendingTransactions[0].id).toBe('null');
    expect(result.current.pendingTransactions[1].id).toBe('conf');
  });

  it('returns empty array when no pending_review transactions exist', () => {
    mockStore.loading = false;
    mockStore.transactions = [
      { id: '1', status: 'approved', aiConfidence: 90, vendorName: 'A' },
      { id: '2', status: 'rejected', aiConfidence: 80, vendorName: 'B' },
    ];

    const { result } = renderHook(() => usePendingReview());

    expect(result.current.pendingTransactions).toEqual([]);
  });

  it('returns error from store', () => {
    mockStore.loading = false;
    mockStore.error = 'Firestore permission denied';

    const { result } = renderHook(() => usePendingReview());

    expect(result.current.error).toBe('Firestore permission denied');
  });
});
