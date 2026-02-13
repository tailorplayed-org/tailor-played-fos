import { create } from 'zustand';
import type { InventoryItem } from '@/types';

interface InventoryStore {
  inventory: InventoryItem[];
  loading: boolean;
  error: string | null;
  setInventory: (items: InventoryItem[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useInventoryStore = create<InventoryStore>((set) => ({
  inventory: [],
  loading: true,
  error: null,
  setInventory: (inventory) => set({ inventory, loading: false, error: null }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error, loading: false }),
}));

// Selectors (OUTSIDE store per architecture pattern)
export const selectByName = (query: string) => (state: InventoryStore) =>
  state.inventory.filter((item) =>
    item.name.toLowerCase().includes(query.toLowerCase())
  );

export const selectLowStock = (state: InventoryStore) =>
  state.inventory.filter(
    (item) => item.reorderThreshold != null && item.currentQty <= item.reorderThreshold
  );
