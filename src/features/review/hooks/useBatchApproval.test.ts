import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock firebase/firestore — writeBatch
const mockUpdate = vi.fn();
const mockCommit = vi.fn().mockResolvedValue(undefined);
const mockWriteBatch = vi.fn(() => ({
  update: mockUpdate,
  commit: mockCommit,
}));
const mockDoc = vi.fn((_db, _collection, id) => ({ path: `transactions/${id}` }));
const mockServerTimestamp = vi.fn(() => 'SERVER_TIMESTAMP');

vi.mock('firebase/firestore', () => ({
  writeBatch: (...args: unknown[]) => mockWriteBatch(...args),
  doc: (...args: unknown[]) => mockDoc(...args),
  serverTimestamp: () => mockServerTimestamp(),
}));

// Mock firebase service
vi.mock('@/services', () => ({
  db: { type: 'firestore' },
}));

// Use real currency utils (toIlsAgora uses default conversion rates)
// No mock needed — test verifies actual conversion logic

// Mock toast
const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();
vi.mock('@/stores/useUIStore', () => ({
  toast: {
    success: (...args: unknown[]) => mockToastSuccess(...args),
    error: (...args: unknown[]) => mockToastError(...args),
  },
}));

import type { Transaction } from '@/types';
import { useBatchApproval } from './useBatchApproval';

function createMockTransaction(overrides?: Partial<Transaction>): Transaction {
  return {
    id: 'txn-1',
    vendorName: 'Test Vendor',
    amountAgora: 8250,
    currency: 'ILS',
    date: new Date('2026-02-13'),
    category: 'DirectCost',
    workOrderId: null,
    inventoryItemId: null,
    status: 'pending_review',
    aiConfidence: 92,
    originalFileUrl: null,
    source: 'ai',
    sourceEmailRef: null,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    suggestedWorkOrderId: 'wo-1',
    suggestedInventoryItemId: null,
    classificationReasoning: null,
    isEstimatedConversion: false,
    conversionRate: null,
    conversionRateDate: null,
    conversionRateStale: false,
    ...overrides,
  };
}

describe('useBatchApproval', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCommit.mockResolvedValue(undefined);
  });

  // ─── Filtering ───

  it('filters batchEligible to only aiConfidence >= 85', () => {
    const transactions = [
      createMockTransaction({ id: 'high-1', aiConfidence: 92 }),
      createMockTransaction({ id: 'low-1', aiConfidence: 60 }),
      createMockTransaction({ id: 'high-2', aiConfidence: 85 }),
      createMockTransaction({ id: 'low-2', aiConfidence: 84 }),
    ];

    const { result } = renderHook(() => useBatchApproval(transactions));

    expect(result.current.batchEligible).toHaveLength(2);
    expect(result.current.batchEligible.map((t) => t.id)).toEqual(['high-1', 'high-2']);
  });

  it('treats null aiConfidence as 0 (excluded from batch)', () => {
    const transactions = [
      createMockTransaction({ id: 'null-conf', aiConfidence: null }),
      createMockTransaction({ id: 'high', aiConfidence: 90 }),
    ];

    const { result } = renderHook(() => useBatchApproval(transactions));

    expect(result.current.batchEligible).toHaveLength(1);
    expect(result.current.batchEligible[0].id).toBe('high');
  });

  // ─── Total amount ───

  it('computes totalAmountIlsAgora from batch-eligible items only (ILS)', () => {
    const transactions = [
      createMockTransaction({ id: '1', aiConfidence: 90, amountAgora: 5000, currency: 'ILS' }),
      createMockTransaction({ id: '2', aiConfidence: 50, amountAgora: 3000, currency: 'ILS' }),
      createMockTransaction({ id: '3', aiConfidence: 95, amountAgora: 2500, currency: 'ILS' }),
    ];

    const { result } = renderHook(() => useBatchApproval(transactions));

    expect(result.current.totalAmountIlsAgora).toBe(7500); // 5000 + 2500 (ILS pass-through)
  });

  it('converts non-ILS amounts to ILS agora for totalAmountIlsAgora', () => {
    const transactions = [
      createMockTransaction({ id: '1', aiConfidence: 90, amountAgora: 1000, currency: 'ILS' }),
      createMockTransaction({ id: '2', aiConfidence: 90, amountAgora: 1000, currency: 'USD' }),
    ];

    const { result } = renderHook(() => useBatchApproval(transactions));

    // ILS: 1000, USD: 1000 * 3.5 = 3500 → total = 4500
    expect(result.current.totalAmountIlsAgora).toBe(4500);
  });

  // ─── State management ───

  it('initializes with isBatchApproving=false and showBatchConfirm=false', () => {
    const { result } = renderHook(() => useBatchApproval([]));

    expect(result.current.isBatchApproving).toBe(false);
    expect(result.current.showBatchConfirm).toBe(false);
  });

  it('requestBatchApproval sets showBatchConfirm to true', () => {
    const { result } = renderHook(() => useBatchApproval([]));

    act(() => {
      result.current.requestBatchApproval();
    });

    expect(result.current.showBatchConfirm).toBe(true);
  });

  it('cancelBatchApproval sets showBatchConfirm to false', () => {
    const { result } = renderHook(() => useBatchApproval([]));

    act(() => {
      result.current.requestBatchApproval();
    });
    expect(result.current.showBatchConfirm).toBe(true);

    act(() => {
      result.current.cancelBatchApproval();
    });
    expect(result.current.showBatchConfirm).toBe(false);
  });

  // ─── Batch confirmation ───

  it('calls writeBatch with correct updates on confirm', async () => {
    const transactions = [
      createMockTransaction({ id: 'txn-a', aiConfidence: 90 }),
      createMockTransaction({ id: 'txn-b', aiConfidence: 88 }),
    ];

    const { result } = renderHook(() => useBatchApproval(transactions));

    await act(async () => {
      await result.current.confirmBatchApproval();
    });

    expect(mockWriteBatch).toHaveBeenCalledWith({ type: 'firestore' });
    expect(mockUpdate).toHaveBeenCalledTimes(2);
    expect(mockUpdate).toHaveBeenCalledWith(
      { path: 'transactions/txn-a' },
      { status: 'approved', updatedAt: 'SERVER_TIMESTAMP' },
    );
    expect(mockUpdate).toHaveBeenCalledWith(
      { path: 'transactions/txn-b' },
      { status: 'approved', updatedAt: 'SERVER_TIMESTAMP' },
    );
    expect(mockCommit).toHaveBeenCalledTimes(1);
  });

  it('shows success toast after batch commit', async () => {
    const transactions = [
      createMockTransaction({ id: '1', aiConfidence: 90 }),
      createMockTransaction({ id: '2', aiConfidence: 95 }),
      createMockTransaction({ id: '3', aiConfidence: 88 }),
    ];

    const { result } = renderHook(() => useBatchApproval(transactions));

    await act(async () => {
      await result.current.confirmBatchApproval();
    });

    expect(mockToastSuccess).toHaveBeenCalledWith(
      expect.stringContaining('review.batchApproval.success'),
    );
  });

  it('shows error toast on batch failure', async () => {
    mockCommit.mockRejectedValueOnce(new Error('Network error'));

    const transactions = [
      createMockTransaction({ id: '1', aiConfidence: 90 }),
      createMockTransaction({ id: '2', aiConfidence: 95 }),
    ];

    const { result } = renderHook(() => useBatchApproval(transactions));

    await act(async () => {
      await result.current.confirmBatchApproval();
    });

    expect(mockToastError).toHaveBeenCalledWith(
      'review.batchApproval.error',
    );
  });

  it('resets showBatchConfirm to false after successful commit', async () => {
    const transactions = [
      createMockTransaction({ id: '1', aiConfidence: 90 }),
      createMockTransaction({ id: '2', aiConfidence: 95 }),
    ];

    const { result } = renderHook(() => useBatchApproval(transactions));

    act(() => {
      result.current.requestBatchApproval();
    });
    expect(result.current.showBatchConfirm).toBe(true);

    await act(async () => {
      await result.current.confirmBatchApproval();
    });
    expect(result.current.showBatchConfirm).toBe(false);
  });

  it('resets showBatchConfirm on error (AC #9: bar returns to default state)', async () => {
    mockCommit.mockRejectedValueOnce(new Error('Fail'));

    const transactions = [
      createMockTransaction({ id: '1', aiConfidence: 90 }),
      createMockTransaction({ id: '2', aiConfidence: 95 }),
    ];

    const { result } = renderHook(() => useBatchApproval(transactions));

    act(() => {
      result.current.requestBatchApproval();
    });

    await act(async () => {
      await result.current.confirmBatchApproval();
    });

    // showBatchConfirm resets to false per AC #9
    expect(result.current.showBatchConfirm).toBe(false);
  });

  // ─── Loading state ───

  it('sets isBatchApproving during the operation', async () => {
    let resolveCommit: () => void;
    mockCommit.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        resolveCommit = resolve;
      }),
    );

    const transactions = [
      createMockTransaction({ id: '1', aiConfidence: 90 }),
      createMockTransaction({ id: '2', aiConfidence: 95 }),
    ];

    const { result } = renderHook(() => useBatchApproval(transactions));

    expect(result.current.isBatchApproving).toBe(false);

    let confirmPromise: Promise<void>;
    act(() => {
      confirmPromise = result.current.confirmBatchApproval();
    });

    expect(result.current.isBatchApproving).toBe(true);

    await act(async () => {
      resolveCommit!();
      await confirmPromise!;
    });

    expect(result.current.isBatchApproving).toBe(false);
  });

  it('resets isBatchApproving on error', async () => {
    mockCommit.mockRejectedValueOnce(new Error('Fail'));

    const transactions = [
      createMockTransaction({ id: '1', aiConfidence: 90 }),
      createMockTransaction({ id: '2', aiConfidence: 95 }),
    ];

    const { result } = renderHook(() => useBatchApproval(transactions));

    await act(async () => {
      await result.current.confirmBatchApproval();
    });

    expect(result.current.isBatchApproving).toBe(false);
  });

  // ─── Guard: no-op when empty ───

  it('does nothing when batchEligible is empty', async () => {
    const transactions = [
      createMockTransaction({ id: '1', aiConfidence: 50 }),
    ];

    const { result } = renderHook(() => useBatchApproval(transactions));

    await act(async () => {
      await result.current.confirmBatchApproval();
    });

    expect(mockWriteBatch).not.toHaveBeenCalled();
    expect(mockCommit).not.toHaveBeenCalled();
  });

  // ─── Guard: prevent double execution ───

  it('prevents double batch approval when already in progress', async () => {
    let resolveCommit: () => void;
    mockCommit.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        resolveCommit = resolve;
      }),
    );

    const transactions = [
      createMockTransaction({ id: '1', aiConfidence: 90 }),
      createMockTransaction({ id: '2', aiConfidence: 95 }),
    ];

    const { result } = renderHook(() => useBatchApproval(transactions));

    let firstPromise: Promise<void>;
    act(() => {
      firstPromise = result.current.confirmBatchApproval();
    });

    // Second call while first is in progress — should be no-op
    act(() => {
      result.current.confirmBatchApproval();
    });

    expect(mockWriteBatch).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveCommit!();
      await firstPromise!;
    });
  });
});
