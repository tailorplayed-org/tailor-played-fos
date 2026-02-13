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

import { useConfirmTransaction } from './useConfirmTransaction';

describe('useConfirmTransaction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateDoc.mockResolvedValue(undefined);
  });

  it('calls updateDoc with correct arguments on confirm', async () => {
    const { result } = renderHook(() => useConfirmTransaction('txn-123'));

    await act(async () => {
      await result.current.confirm();
    });

    expect(mockDoc).toHaveBeenCalledWith({ type: 'firestore' }, 'transactions', 'txn-123');
    expect(mockUpdateDoc).toHaveBeenCalledWith(
      { path: 'transactions/txn-123' },
      {
        status: 'approved',
        updatedAt: 'SERVER_TIMESTAMP',
      },
    );
  });

  it('shows success toast on successful confirmation', async () => {
    const { result } = renderHook(() => useConfirmTransaction('txn-123'));

    await act(async () => {
      await result.current.confirm();
    });

    expect(mockToastSuccess).toHaveBeenCalledWith('review.ghostText.confirmed');
  });

  it('shows error toast on failed confirmation', async () => {
    mockUpdateDoc.mockRejectedValueOnce(new Error('Firestore error'));

    const { result } = renderHook(() => useConfirmTransaction('txn-123'));

    await act(async () => {
      try {
        await result.current.confirm();
      } catch {
        // Expected to throw
      }
    });

    expect(mockToastError).toHaveBeenCalledWith('review.ghostText.confirmError');
  });

  it('sets isConfirming during the operation', async () => {
    let resolvePromise: () => void;
    mockUpdateDoc.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        resolvePromise = resolve;
      }),
    );

    const { result } = renderHook(() => useConfirmTransaction('txn-123'));

    expect(result.current.isConfirming).toBe(false);

    let confirmPromise: Promise<void>;
    act(() => {
      confirmPromise = result.current.confirm();
    });

    // isConfirming should be true while operation is pending
    expect(result.current.isConfirming).toBe(true);

    // Resolve the operation
    await act(async () => {
      resolvePromise!();
      await confirmPromise!;
    });

    expect(result.current.isConfirming).toBe(false);
  });

  it('resets isConfirming on error', async () => {
    mockUpdateDoc.mockRejectedValueOnce(new Error('Fail'));

    const { result } = renderHook(() => useConfirmTransaction('txn-123'));

    await act(async () => {
      try {
        await result.current.confirm();
      } catch {
        // Expected
      }
    });

    expect(result.current.isConfirming).toBe(false);
  });

  it('prevents double confirmation when isConfirming is true', async () => {
    let resolvePromise: () => void;
    mockUpdateDoc.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        resolvePromise = resolve;
      }),
    );

    const { result } = renderHook(() => useConfirmTransaction('txn-123'));

    // Start first confirm
    let firstConfirm: Promise<void>;
    act(() => {
      firstConfirm = result.current.confirm();
    });

    // Try second confirm while first is in progress
    act(() => {
      result.current.confirm(); // Should be no-op
    });

    expect(mockUpdateDoc).toHaveBeenCalledTimes(1);

    // Cleanup
    await act(async () => {
      resolvePromise!();
      await firstConfirm!;
    });
  });

  // ─── Override tests ───

  it('includes category override in updateDoc payload', async () => {
    const { result } = renderHook(() => useConfirmTransaction('txn-123'));

    await act(async () => {
      await result.current.confirm({ category: 'Overhead' });
    });

    expect(mockUpdateDoc).toHaveBeenCalledWith(
      { path: 'transactions/txn-123' },
      {
        status: 'approved',
        updatedAt: 'SERVER_TIMESTAMP',
        category: 'Overhead',
      },
    );
  });

  it('includes workOrderId override and sets suggestedWorkOrderId', async () => {
    const { result } = renderHook(() => useConfirmTransaction('txn-123'));

    await act(async () => {
      await result.current.confirm({ workOrderId: 'wo-99' });
    });

    expect(mockUpdateDoc).toHaveBeenCalledWith(
      { path: 'transactions/txn-123' },
      {
        status: 'approved',
        updatedAt: 'SERVER_TIMESTAMP',
        workOrderId: 'wo-99',
        suggestedWorkOrderId: 'wo-99',
      },
    );
  });

  it('includes both category and workOrderId overrides', async () => {
    const { result } = renderHook(() => useConfirmTransaction('txn-123'));

    await act(async () => {
      await result.current.confirm({ category: 'Revenue', workOrderId: 'wo-55' });
    });

    expect(mockUpdateDoc).toHaveBeenCalledWith(
      { path: 'transactions/txn-123' },
      {
        status: 'approved',
        updatedAt: 'SERVER_TIMESTAMP',
        category: 'Revenue',
        workOrderId: 'wo-55',
        suggestedWorkOrderId: 'wo-55',
      },
    );
  });

  it('sends base payload when confirm called without overrides', async () => {
    const { result } = renderHook(() => useConfirmTransaction('txn-123'));

    await act(async () => {
      await result.current.confirm();
    });

    expect(mockUpdateDoc).toHaveBeenCalledWith(
      { path: 'transactions/txn-123' },
      {
        status: 'approved',
        updatedAt: 'SERVER_TIMESTAMP',
      },
    );
  });
});
