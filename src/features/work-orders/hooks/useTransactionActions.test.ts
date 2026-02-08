import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { writeBatch } from 'firebase/firestore';
import { useTransactionActions } from './useTransactionActions';
import type { CreateTransactionInput } from '@/types';

// Mock firebase/firestore
const mockBatchSet = vi.fn();
const mockBatchUpdate = vi.fn();
const mockBatchCommit = vi.fn(() => Promise.resolve());

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(() => 'mock-collection-ref'),
  doc: vi.fn((...args: unknown[]) => {
    // When called with (db, collectionName, docId) — doc reference for WO update
    if (args.length === 3) return `mock-doc-ref-${args[2]}`;
    // When called with (collectionRef) — auto-id for new transaction
    return 'mock-txn-ref';
  }),
  writeBatch: vi.fn(() => ({
    set: mockBatchSet,
    update: mockBatchUpdate,
    commit: mockBatchCommit,
  })),
  increment: vi.fn((n: number) => `increment(${n})`),
  serverTimestamp: vi.fn(() => 'server-timestamp'),
}));

vi.mock('@/services', () => ({
  db: 'mock-db',
}));

// Mock toast
const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();
vi.mock('@/components/Toast', () => ({
  toast: {
    success: (...args: unknown[]) => mockToastSuccess(...args),
    error: (...args: unknown[]) => mockToastError(...args),
  },
}));

describe('useTransactionActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const baseInput: CreateTransactionInput = {
    vendorName: 'Acme Supplies',
    amount: 82.5,
    currency: 'ILS',
    date: new Date('2026-02-01'),
    category: 'DirectCost',
    workOrderId: null,
    notes: null,
  };

  describe('createTransaction', () => {
    it('creates transaction doc with source=manual and status=approved', async () => {
      const { result } = renderHook(() => useTransactionActions());

      await result.current.createTransaction(baseInput);

      expect(writeBatch).toHaveBeenCalledWith('mock-db');
      expect(mockBatchSet).toHaveBeenCalledWith(
        'mock-txn-ref',
        expect.objectContaining({
          vendorName: 'Acme Supplies',
          amountAgora: 8250, // 82.5 * 100
          currency: 'ILS',
          source: 'manual',
          status: 'approved',
          workOrderId: null,
          inventoryItemId: null,
          aiConfidence: null,
          originalFileUrl: null,
          sourceEmailRef: null,
          notes: null,
          createdAt: 'server-timestamp',
          updatedAt: 'server-timestamp',
          suggestedWorkOrderId: null,
          suggestedInventoryItemId: null,
          classificationReasoning: null,
          isEstimatedConversion: false,
          conversionRate: null,
          conversionRateDate: null,
          conversionRateStale: false,
        }),
      );
      expect(mockBatchCommit).toHaveBeenCalledTimes(1);
    });

    it('shows success toast on create', async () => {
      const { result } = renderHook(() => useTransactionActions());

      await result.current.createTransaction(baseInput);

      expect(mockToastSuccess).toHaveBeenCalledWith('transactions.toast.created');
    });

    it('updates WO directCostAgora when linked with DirectCost category', async () => {
      const { result } = renderHook(() => useTransactionActions());
      const input: CreateTransactionInput = { ...baseInput, workOrderId: 'wo-1', category: 'DirectCost' };

      await result.current.createTransaction(input);

      expect(mockBatchUpdate).toHaveBeenCalledWith(
        'mock-doc-ref-wo-1',
        expect.objectContaining({
          directCostAgora: 'increment(8250)',
          updatedAt: 'server-timestamp',
        }),
      );
    });

    it('updates WO revenueTotalAgora when linked with Revenue category', async () => {
      const { result } = renderHook(() => useTransactionActions());
      const input: CreateTransactionInput = { ...baseInput, workOrderId: 'wo-1', category: 'Revenue' };

      await result.current.createTransaction(input);

      expect(mockBatchUpdate).toHaveBeenCalledWith(
        'mock-doc-ref-wo-1',
        expect.objectContaining({
          revenueTotalAgora: 'increment(8250)',
          updatedAt: 'server-timestamp',
        }),
      );
    });

    it('does not update WO when workOrderId is missing', async () => {
      const { result } = renderHook(() => useTransactionActions());

      await result.current.createTransaction(baseInput);

      expect(mockBatchUpdate).not.toHaveBeenCalled();
    });

    it('does not update WO for non-linkable categories', async () => {
      const { result } = renderHook(() => useTransactionActions());
      const categories = ['InventoryRestock', 'Overhead', 'Personal'] as const;

      for (const category of categories) {
        vi.clearAllMocks();
        const input: CreateTransactionInput = { ...baseInput, workOrderId: 'wo-1', category };
        await result.current.createTransaction(input);
        expect(mockBatchUpdate).not.toHaveBeenCalled();
      }
    });

    it('converts non-ILS currency for WO linkage', async () => {
      const { result } = renderHook(() => useTransactionActions());
      const input: CreateTransactionInput = {
        ...baseInput,
        amount: 100,
        currency: 'USD',
        workOrderId: 'wo-1',
        category: 'DirectCost',
      };

      await result.current.createTransaction(input);

      // 100 USD → 10000 cents, ILS equiv = 10000 * 3.5 = 35000 agora
      expect(mockBatchSet).toHaveBeenCalledWith(
        'mock-txn-ref',
        expect.objectContaining({
          amountAgora: 10000, // Original USD cents
          currency: 'USD',
          isEstimatedConversion: true,
          conversionRate: 3.5, // DEFAULT_CONVERSION_RATES.USD
          conversionRateDate: expect.any(String),
          conversionRateStale: false, // Manual transactions never stale (Story 4.5)
        }),
      );
      expect(mockBatchUpdate).toHaveBeenCalledWith(
        'mock-doc-ref-wo-1',
        expect.objectContaining({
          directCostAgora: 'increment(35000)', // ILS agora
        }),
      );
    });

    it('shows error toast and re-throws on failure', async () => {
      mockBatchCommit.mockRejectedValueOnce(new Error('Network error'));
      const { result } = renderHook(() => useTransactionActions());

      await expect(result.current.createTransaction(baseInput)).rejects.toThrow('Network error');
      expect(mockToastError).toHaveBeenCalledWith('transactions.toast.createError');
    });
  });
});
