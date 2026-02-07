import { describe, it, expect, beforeEach } from 'vitest';
import { useWorkOrderStore, selectActiveProjects, selectWorkOrderById } from './useWorkOrderStore';
import type { WorkOrder } from '@/types';

const mockWorkOrders: WorkOrder[] = [
  {
    id: 'wo-1',
    clientName: "David's Game",
    projectDescription: 'Custom board game',
    deadline: new Date('2026-06-01'),
    status: 'Production',
    revenueTotalAgora: 50000,
    directCostAgora: 20000,
    inventoryCostAgora: 5000,
    overheadAllocationAgora: 3000,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'wo-2',
    clientName: 'Rina Wedding Game',
    projectDescription: 'Wedding board game',
    deadline: null,
    status: 'Lead',
    revenueTotalAgora: 0,
    directCostAgora: 0,
    inventoryCostAgora: 0,
    overheadAllocationAgora: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'wo-3',
    clientName: 'Corp Event Game',
    projectDescription: '',
    deadline: new Date('2026-12-01'),
    status: 'Production',
    revenueTotalAgora: 100000,
    directCostAgora: 40000,
    inventoryCostAgora: 10000,
    overheadAllocationAgora: 8000,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

describe('useWorkOrderStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    useWorkOrderStore.setState({
      workOrders: [],
      loading: true,
      error: null,
    });
  });

  it('has correct initial state', () => {
    const state = useWorkOrderStore.getState();
    expect(state.workOrders).toEqual([]);
    expect(state.loading).toBe(true);
    expect(state.error).toBeNull();
  });

  it('setWorkOrders updates workOrders and clears loading/error', () => {
    useWorkOrderStore.getState().setWorkOrders(mockWorkOrders);
    const state = useWorkOrderStore.getState();
    expect(state.workOrders).toHaveLength(3);
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('setLoading updates loading state', () => {
    useWorkOrderStore.getState().setLoading(false);
    expect(useWorkOrderStore.getState().loading).toBe(false);

    useWorkOrderStore.getState().setLoading(true);
    expect(useWorkOrderStore.getState().loading).toBe(true);
  });

  it('setError updates error and clears loading', () => {
    useWorkOrderStore.getState().setError('Connection failed');
    const state = useWorkOrderStore.getState();
    expect(state.error).toBe('Connection failed');
    expect(state.loading).toBe(false);
  });

  it('setError clears error when set to null', () => {
    useWorkOrderStore.getState().setError('Some error');
    useWorkOrderStore.getState().setError(null);
    expect(useWorkOrderStore.getState().error).toBeNull();
  });
});

describe('selectActiveProjects', () => {
  beforeEach(() => {
    useWorkOrderStore.setState({ workOrders: mockWorkOrders });
  });

  it('returns only Production status work orders', () => {
    const state = useWorkOrderStore.getState();
    const active = selectActiveProjects(state);
    expect(active).toHaveLength(2);
    expect(active.every((wo) => wo.status === 'Production')).toBe(true);
  });

  it('returns empty array when no Production work orders', () => {
    useWorkOrderStore.setState({
      workOrders: [mockWorkOrders[1]], // Lead only
    });
    const state = useWorkOrderStore.getState();
    const active = selectActiveProjects(state);
    expect(active).toHaveLength(0);
  });
});

describe('selectWorkOrderById', () => {
  beforeEach(() => {
    useWorkOrderStore.setState({ workOrders: mockWorkOrders });
  });

  it('finds work order by id', () => {
    const state = useWorkOrderStore.getState();
    const wo = selectWorkOrderById('wo-2')(state);
    expect(wo).toBeDefined();
    expect(wo?.clientName).toBe('Rina Wedding Game');
  });

  it('returns undefined for non-existent id', () => {
    const state = useWorkOrderStore.getState();
    const wo = selectWorkOrderById('wo-nonexistent')(state);
    expect(wo).toBeUndefined();
  });
});
