import { describe, it, expect, beforeEach } from 'vitest';
import { useInventoryStore, selectByName, selectLowStock } from './useInventoryStore';
import type { InventoryItem } from '@/types';

const makeItem = (overrides: Partial<InventoryItem> = {}): InventoryItem => ({
  id: 'item-1',
  name: 'Cardboard',
  sku: 'CBR-001',
  supplier: 'PaperInc',
  currentQty: 100,
  wacAgora: 350,
  reorderThreshold: 10,
  unit: 'sheets',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-15'),
  ...overrides,
});

describe('useInventoryStore', () => {
  beforeEach(() => {
    useInventoryStore.setState({
      inventory: [],
      loading: true,
      error: null,
    });
  });

  it('has correct initial state', () => {
    const state = useInventoryStore.getState();
    expect(state.inventory).toEqual([]);
    expect(state.loading).toBe(true);
    expect(state.error).toBeNull();
  });

  it('setInventory updates inventory and clears loading/error', () => {
    const items = [makeItem()];
    useInventoryStore.getState().setInventory(items);
    const state = useInventoryStore.getState();
    expect(state.inventory).toEqual(items);
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('setLoading updates loading flag', () => {
    useInventoryStore.getState().setLoading(false);
    expect(useInventoryStore.getState().loading).toBe(false);
  });

  it('setError updates error and clears loading', () => {
    useInventoryStore.getState().setError('Something went wrong');
    const state = useInventoryStore.getState();
    expect(state.error).toBe('Something went wrong');
    expect(state.loading).toBe(false);
  });
});

describe('selectByName', () => {
  it('filters items by name (case-insensitive)', () => {
    const items = [
      makeItem({ id: '1', name: 'Cardboard Sheets' }),
      makeItem({ id: '2', name: 'Fabric Roll' }),
      makeItem({ id: '3', name: 'Card Stock' }),
    ];
    useInventoryStore.setState({ inventory: items });
    const state = useInventoryStore.getState();

    const result = selectByName('card')(state);
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.id)).toEqual(['1', '3']);
  });

  it('returns all items when query is empty', () => {
    const items = [makeItem({ id: '1' }), makeItem({ id: '2' })];
    useInventoryStore.setState({ inventory: items });
    const state = useInventoryStore.getState();

    const result = selectByName('')(state);
    expect(result).toHaveLength(2);
  });

  it('returns empty array when no match', () => {
    useInventoryStore.setState({ inventory: [makeItem()] });
    const state = useInventoryStore.getState();

    const result = selectByName('nonexistent')(state);
    expect(result).toHaveLength(0);
  });
});

describe('selectLowStock', () => {
  it('returns items where currentQty <= reorderThreshold', () => {
    const items = [
      makeItem({ id: '1', currentQty: 5, reorderThreshold: 10 }),
      makeItem({ id: '2', currentQty: 50, reorderThreshold: 10 }),
      makeItem({ id: '3', currentQty: 10, reorderThreshold: 10 }),
    ];
    useInventoryStore.setState({ inventory: items });
    const state = useInventoryStore.getState();

    const result = selectLowStock(state);
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.id)).toEqual(['1', '3']);
  });

  it('excludes items with null reorderThreshold', () => {
    const items = [
      makeItem({ id: '1', currentQty: 0, reorderThreshold: null }),
      makeItem({ id: '2', currentQty: 5, reorderThreshold: 10 }),
    ];
    useInventoryStore.setState({ inventory: items });
    const state = useInventoryStore.getState();

    const result = selectLowStock(state);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('2');
  });

  it('returns empty array when no items are low stock', () => {
    const items = [makeItem({ currentQty: 100, reorderThreshold: 10 })];
    useInventoryStore.setState({ inventory: items });
    const state = useInventoryStore.getState();

    const result = selectLowStock(state);
    expect(result).toHaveLength(0);
  });
});
