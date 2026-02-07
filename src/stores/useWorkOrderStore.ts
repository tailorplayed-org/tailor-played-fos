import { create } from 'zustand';
import type { WorkOrder } from '@/types';

interface WorkOrderStore {
  workOrders: WorkOrder[];
  loading: boolean;
  error: string | null;
  setWorkOrders: (orders: WorkOrder[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useWorkOrderStore = create<WorkOrderStore>((set) => ({
  workOrders: [],
  loading: true,
  error: null,
  setWorkOrders: (workOrders) => set({ workOrders, loading: false, error: null }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error, loading: false }),
}));

// Selectors (defined outside store per architecture pattern)
export const selectActiveProjects = (state: WorkOrderStore) =>
  state.workOrders.filter((wo) => wo.status === 'Production');

export const selectWorkOrderById = (id: string) => (state: WorkOrderStore) =>
  state.workOrders.find((wo) => wo.id === id);
