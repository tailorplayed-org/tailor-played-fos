import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock firebase/firestore
const mockUpdateDoc = vi.fn();
const mockDoc = vi.fn((_db, _collection, id) => ({ path: `transactions/${id}` }));
const mockServerTimestamp = vi.fn(() => 'SERVER_TIMESTAMP');

vi.mock('firebase/firestore', () => ({
  updateDoc: (...args: unknown[]) => mockUpdateDoc(...args),
  doc: (...args: unknown[]) => mockDoc(...args),
  serverTimestamp: () => mockServerTimestamp(),
}));

// Mock firebase service
vi.mock('@/services', () => ({
  db: { type: 'firestore' },
}));

// Mock toast
const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();
vi.mock('@/stores/useUIStore', () => ({
  toast: {
    success: (...args: unknown[]) => mockToastSuccess(...args),
    error: (...args: unknown[]) => mockToastError(...args),
  },
}));

import { useRejectTransaction } from './useRejectTransaction';

describe('useRejectTransaction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateDoc.mockResolvedValue(undefined);
  });

  it('calls updateDoc with status: rejected on reject', async () => {
    const { result } = renderHook(() => useRejectTransaction('txn-456'));

    await act(async () => {
      await result.current.reject();
    });

    expect(mockDoc).toHaveBeenCalledWith(
      { type: 'firestore' },
      'transactions',
      'txn-456',
    );
    expect(mockUpdateDoc).toHaveBeenCalledWith(
      { path: 'transactions/txn-456' },
      {
        status: 'rejected',
        updatedAt: 'SERVER_TIMESTAMP',
      },
    );
  });

  it('shows success toast on successful rejection', async () => {
    const { result } = renderHook(() => useRejectTransaction('txn-456'));

    await act(async () => {
      await result.current.reject();
    });

    expect(mockToastSuccess).toHaveBeenCalledWith('review.ghostText.rejected');
  });

  it('shows error toast on failed rejection', async () => {
    mockUpdateDoc.mockRejectedValueOnce(new Error('Firestore error'));

    const { result } = renderHook(() => useRejectTransaction('txn-456'));

    await act(async () => {
      try {
        await result.current.reject();
      } catch {
        // Expected to throw
      }
    });

    expect(mockToastError).toHaveBeenCalledWith('review.ghostText.rejectError');
  });

  it('sets isRejecting during the operation', async () => {
    let resolvePromise: () => void;
    mockUpdateDoc.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        resolvePromise = resolve;
      }),
    );

    const { result } = renderHook(() => useRejectTransaction('txn-456'));

    expect(result.current.isRejecting).toBe(false);

    let rejectPromise: Promise<void>;
    act(() => {
      rejectPromise = result.current.reject();
    });

    expect(result.current.isRejecting).toBe(true);

    await act(async () => {
      resolvePromise!();
      await rejectPromise!;
    });

    expect(result.current.isRejecting).toBe(false);
  });

  it('resets isRejecting on error', async () => {
    mockUpdateDoc.mockRejectedValueOnce(new Error('Fail'));

    const { result } = renderHook(() => useRejectTransaction('txn-456'));

    await act(async () => {
      try {
        await result.current.reject();
      } catch {
        // Expected
      }
    });

    expect(result.current.isRejecting).toBe(false);
  });

  it('prevents double rejection when isRejecting is true', async () => {
    let resolvePromise: () => void;
    mockUpdateDoc.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        resolvePromise = resolve;
      }),
    );

    const { result } = renderHook(() => useRejectTransaction('txn-456'));

    let firstReject: Promise<void>;
    act(() => {
      firstReject = result.current.reject();
    });

    // Try second reject while first is in progress
    act(() => {
      result.current.reject(); // Should be no-op
    });

    expect(mockUpdateDoc).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolvePromise!();
      await firstReject!;
    });
  });

  it('does not call updateDoc when transactionId is empty', async () => {
    const { result } = renderHook(() => useRejectTransaction(''));

    await act(async () => {
      await result.current.reject();
    });

    expect(mockUpdateDoc).not.toHaveBeenCalled();
  });
});
