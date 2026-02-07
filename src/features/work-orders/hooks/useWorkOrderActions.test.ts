import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { addDoc, updateDoc } from 'firebase/firestore';
import { useWorkOrderActions } from './useWorkOrderActions';
import type { CreateWorkOrderInput } from '@/types';

// Mock firebase/firestore
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(() => 'mock-collection-ref'),
  doc: vi.fn(() => 'mock-doc-ref'),
  addDoc: vi.fn(() => Promise.resolve({ id: 'new-doc-id' })),
  updateDoc: vi.fn(() => Promise.resolve()),
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

describe('useWorkOrderActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createWorkOrder', () => {
    const validInput: CreateWorkOrderInput = {
      clientName: "David's Game",
      projectDescription: 'Custom board game',
      deadline: new Date('2026-06-01'),
      status: 'Design',
    };

    it('writes a new document to Firestore with defaults', async () => {
      const { result } = renderHook(() => useWorkOrderActions());

      await result.current.createWorkOrder(validInput);

      expect(addDoc).toHaveBeenCalledTimes(1);
      expect(addDoc).toHaveBeenCalledWith(
        'mock-collection-ref',
        expect.objectContaining({
          clientName: "David's Game",
          projectDescription: 'Custom board game',
          status: 'Design',
          revenueTotalAgora: 0,
          directCostAgora: 0,
          inventoryCostAgora: 0,
          overheadAllocationAgora: 0,
          createdAt: 'server-timestamp',
          updatedAt: 'server-timestamp',
        })
      );
    });

    it('shows success toast on create', async () => {
      const { result } = renderHook(() => useWorkOrderActions());

      await result.current.createWorkOrder(validInput);

      expect(mockToastSuccess).toHaveBeenCalledWith('workOrders.toast.created');
    });

    it('shows error toast and re-throws on create failure', async () => {
      vi.mocked(addDoc).mockRejectedValueOnce(new Error('Permission denied'));

      const { result } = renderHook(() => useWorkOrderActions());

      await expect(result.current.createWorkOrder(validInput)).rejects.toThrow('Permission denied');
      expect(mockToastError).toHaveBeenCalledWith('workOrders.toast.createError');
    });
  });

  describe('updateWorkOrder', () => {
    it('updates an existing Firestore document', async () => {
      const { result } = renderHook(() => useWorkOrderActions());

      await result.current.updateWorkOrder('wo-123', { clientName: 'Updated Name' });

      expect(updateDoc).toHaveBeenCalledTimes(1);
      expect(updateDoc).toHaveBeenCalledWith(
        'mock-doc-ref',
        expect.objectContaining({
          clientName: 'Updated Name',
          updatedAt: 'server-timestamp',
        })
      );
    });

    it('shows success toast on update', async () => {
      const { result } = renderHook(() => useWorkOrderActions());

      await result.current.updateWorkOrder('wo-123', { status: 'Production' });

      expect(mockToastSuccess).toHaveBeenCalledWith('workOrders.toast.updated');
    });

    it('shows error toast and re-throws on update failure', async () => {
      vi.mocked(updateDoc).mockRejectedValueOnce(new Error('Not found'));

      const { result } = renderHook(() => useWorkOrderActions());

      await expect(result.current.updateWorkOrder('wo-123', { status: 'Shipped' })).rejects.toThrow('Not found');
      expect(mockToastError).toHaveBeenCalledWith('workOrders.toast.updateError');
    });
  });
});
