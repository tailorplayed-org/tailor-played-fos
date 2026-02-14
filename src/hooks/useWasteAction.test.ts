import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { writeBatch } from 'firebase/firestore';
import { useWasteAction } from './useWasteAction';
import type { InventoryItem, WorkOrder, WasteInput } from '@/types';

// Mock firebase/firestore
const mockBatchSet = vi.fn();
const mockBatchUpdate = vi.fn();
const mockBatchCommit = vi.fn(() => Promise.resolve());

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(() => 'mock-collection-ref'),
  doc: vi.fn((...args: unknown[]) => {
    if (args.length === 3) return `mock-doc-ref-${args[2]}`;
    return 'mock-log-ref';
  }),
  writeBatch: vi.fn(() => ({
    set: mockBatchSet,
    update: mockBatchUpdate,
    commit: mockBatchCommit,
  })),
  serverTimestamp: vi.fn(() => 'server-timestamp'),
}));

vi.mock('@/services', () => ({
  db: 'mock-db',
  auth: { currentUser: { uid: 'user-123' } },
}));

vi.mock('@/lib/wac', () => ({
  applyScoopCost: vi.fn((qty: number, wac: number) => qty * wac),
}));

const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();
vi.mock('@/stores/useUIStore', () => ({
  toast: {
    success: (...args: unknown[]) => mockToastSuccess(...args),
    error: (...args: unknown[]) => mockToastError(...args),
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const mockItem: InventoryItem = {
  id: 'item-1',
  name: 'Cardboard Sheets',
  sku: null,
  supplier: null,
  currentQty: 100,
  wacAgora: 500,
  reorderThreshold: null,
  unit: 'sheets',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockWo: WorkOrder = {
  id: 'wo-1',
  clientName: 'TestClient',
  status: 'in_progress',
  inventoryCostAgora: 10000,
} as WorkOrder;

describe('useWasteAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates correct batch writes (inventory + log) when no WO linked', async () => {
    const { result } = renderHook(() => useWasteAction([mockItem], [mockWo]));

    const data: WasteInput = {
      itemId: 'item-1',
      quantity: 5,
      reason: 'Expired material',
      workOrderId: '',
    };

    await result.current.executeWaste(data);

    expect(writeBatch).toHaveBeenCalledWith('mock-db');

    // 1. Inventory update
    expect(mockBatchUpdate).toHaveBeenCalledWith('mock-doc-ref-item-1', {
      currentQty: 95, // 100 - 5
      updatedAt: 'server-timestamp',
    });

    // 2. NO Work Order update (empty workOrderId)
    expect(mockBatchUpdate).toHaveBeenCalledTimes(1);

    // 3. inventory_log entry
    expect(mockBatchSet).toHaveBeenCalledWith('mock-log-ref', {
      itemId: 'item-1',
      action: 'waste',
      qtyChange: -5,
      costSnapshotAgora: 2500, // 5 * 500
      wacBeforeAgora: 500,
      wacAfterAgora: 500, // WAC doesn't change on waste
      workOrderRef: null, // empty string → null
      reason: 'Expired material',
      actorUid: 'user-123',
      timestamp: 'server-timestamp',
    });

    expect(mockBatchCommit).toHaveBeenCalledTimes(1);
  });

  it('creates correct batch writes (inventory + WO + log) when WO linked', async () => {
    const { result } = renderHook(() => useWasteAction([mockItem], [mockWo]));

    const data: WasteInput = {
      itemId: 'item-1',
      quantity: 3,
      reason: 'Damaged',
      workOrderId: 'wo-1',
    };

    await result.current.executeWaste(data);

    // 1. Inventory update
    expect(mockBatchUpdate).toHaveBeenCalledWith('mock-doc-ref-item-1', {
      currentQty: 97, // 100 - 3
      updatedAt: 'server-timestamp',
    });

    // 2. Work Order update — waste is a real cost
    expect(mockBatchUpdate).toHaveBeenCalledWith('mock-doc-ref-wo-1', {
      inventoryCostAgora: 11500, // 10000 + (3 * 500)
      updatedAt: 'server-timestamp',
    });

    expect(mockBatchUpdate).toHaveBeenCalledTimes(2);

    // 3. inventory_log entry
    expect(mockBatchSet).toHaveBeenCalledWith('mock-log-ref', {
      itemId: 'item-1',
      action: 'waste',
      qtyChange: -3,
      costSnapshotAgora: 1500, // 3 * 500
      wacBeforeAgora: 500,
      wacAfterAgora: 500,
      workOrderRef: 'wo-1',
      reason: 'Damaged',
      actorUid: 'user-123',
      timestamp: 'server-timestamp',
    });
  });

  it('sets action: waste and reason in log entry', async () => {
    const { result } = renderHook(() => useWasteAction([mockItem], [mockWo]));

    await result.current.executeWaste({
      itemId: 'item-1',
      quantity: 2,
      reason: 'Scrap from cutting',
      workOrderId: '',
    });

    expect(mockBatchSet).toHaveBeenCalledWith(
      'mock-log-ref',
      expect.objectContaining({
        action: 'waste',
        reason: 'Scrap from cutting',
      }),
    );
  });

  it('sets qtyChange as negative', async () => {
    const { result } = renderHook(() => useWasteAction([mockItem], [mockWo]));

    await result.current.executeWaste({
      itemId: 'item-1',
      quantity: 7,
      reason: 'Damaged',
      workOrderId: '',
    });

    expect(mockBatchSet).toHaveBeenCalledWith(
      'mock-log-ref',
      expect.objectContaining({
        qtyChange: -7,
      }),
    );
  });

  it('sets wacAfterAgora === wacBeforeAgora (WAC unchanged on waste)', async () => {
    const { result } = renderHook(() => useWasteAction([mockItem], [mockWo]));

    await result.current.executeWaste({
      itemId: 'item-1',
      quantity: 1,
      reason: 'Expired',
      workOrderId: '',
    });

    expect(mockBatchSet).toHaveBeenCalledWith(
      'mock-log-ref',
      expect.objectContaining({
        wacBeforeAgora: 500,
        wacAfterAgora: 500,
      }),
    );
  });

  it('shows success toast on success', async () => {
    const { result } = renderHook(() => useWasteAction([mockItem], [mockWo]));

    await result.current.executeWaste({
      itemId: 'item-1',
      quantity: 5,
      reason: 'Expired',
      workOrderId: '',
    });

    // t() mock returns just the key string, so toast receives a single argument
    expect(mockToastSuccess).toHaveBeenCalledWith('inventory.waste.success');
  });

  it('shows error toast and throws on failure', async () => {
    mockBatchCommit.mockRejectedValueOnce(new Error('Network error'));
    const { result } = renderHook(() => useWasteAction([mockItem], [mockWo]));

    await expect(
      result.current.executeWaste({
        itemId: 'item-1',
        quantity: 5,
        reason: 'Expired',
        workOrderId: '',
      }),
    ).rejects.toThrow('Waste batch write failed');

    expect(mockToastError).toHaveBeenCalledWith('inventory.waste.error');
  });

  it('shows error when no authenticated user', async () => {
    // Override auth mock for this test
    const { auth } = await import('@/services');
    const originalUser = auth.currentUser;
    Object.defineProperty(auth, 'currentUser', { value: null, writable: true });

    const { result } = renderHook(() => useWasteAction([mockItem], [mockWo]));

    await expect(
      result.current.executeWaste({
        itemId: 'item-1',
        quantity: 5,
        reason: 'Expired',
        workOrderId: '',
      }),
    ).rejects.toThrow('No authenticated user');

    expect(mockToastError).toHaveBeenCalledWith('inventory.waste.error');
    expect(mockBatchCommit).not.toHaveBeenCalled();

    // Restore
    Object.defineProperty(auth, 'currentUser', { value: originalUser, writable: true });
  });

  it('exits silently when item not found', async () => {
    const { result } = renderHook(() => useWasteAction([mockItem], [mockWo]));

    await result.current.executeWaste({
      itemId: 'nonexistent',
      quantity: 5,
      reason: 'Expired',
      workOrderId: '',
    });

    expect(mockBatchCommit).not.toHaveBeenCalled();
  });
});
