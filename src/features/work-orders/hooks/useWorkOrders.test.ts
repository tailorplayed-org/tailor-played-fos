import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWorkOrderStore } from '@/stores';

// Mock useFirestoreCollection
let capturedCallbacks: {
  onData: (data: unknown[]) => void;
  onError: (error: string) => void;
  onLoading: (loading: boolean) => void;
} | null = null;

vi.mock('@/hooks', () => ({
  useFirestoreCollection: vi.fn(
    (_collectionName: string, _schema: unknown, callbacks: typeof capturedCallbacks) => {
      capturedCallbacks = callbacks;
    }
  ),
}));

// Must import after mocks are set up
import { useWorkOrders } from './useWorkOrders';

describe('useWorkOrders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedCallbacks = null;
    useWorkOrderStore.setState({
      workOrders: [],
      loading: true,
      error: null,
    });
  });

  it('calls useFirestoreCollection with work_orders collection', async () => {
    const { useFirestoreCollection } = await import('@/hooks');
    renderHook(() => useWorkOrders());

    expect(useFirestoreCollection).toHaveBeenCalledWith(
      'work_orders',
      expect.anything(),
      expect.objectContaining({
        onData: expect.any(Function),
        onError: expect.any(Function),
        onLoading: expect.any(Function),
      })
    );
  });

  it('syncs data to store via onData callback', () => {
    renderHook(() => useWorkOrders());

    const mockData = [
      {
        id: 'wo-1',
        clientName: 'Test',
        projectDescription: '',
        deadline: null,
        status: 'Lead',
        revenueTotalAgora: 0,
        directCostAgora: 0,
        inventoryCostAgora: 0,
        overheadAllocationAgora: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    act(() => {
      capturedCallbacks!.onData(mockData);
    });

    const state = useWorkOrderStore.getState();
    expect(state.workOrders).toHaveLength(1);
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('syncs loading state to store', () => {
    renderHook(() => useWorkOrders());

    act(() => {
      capturedCallbacks!.onLoading(true);
    });
    expect(useWorkOrderStore.getState().loading).toBe(true);

    act(() => {
      capturedCallbacks!.onLoading(false);
    });
    expect(useWorkOrderStore.getState().loading).toBe(false);
  });

  it('syncs error state to store', () => {
    renderHook(() => useWorkOrders());

    act(() => {
      capturedCallbacks!.onError('Permission denied');
    });
    const state = useWorkOrderStore.getState();
    expect(state.error).toBe('Permission denied');
    expect(state.loading).toBe(false);
  });
});
