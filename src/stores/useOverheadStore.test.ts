import { describe, it, expect, beforeEach } from 'vitest';
import { useOverheadStore, selectByCategory, selectCurrentMonth, selectRecurring } from './useOverheadStore';
import type { Overhead } from '@/types';

const makeOverhead = (overrides: Partial<Overhead> = {}): Overhead => ({
  id: 'oh-1',
  category: 'software',
  amountAgora: 8200,
  currency: 'ILS',
  date: new Date('2026-02-10'),
  description: 'Adobe subscription',
  recurrence: 'monthly',
  source: 'manual',
  transactionId: null,
  isActive: true,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-02-10'),
  ...overrides,
});

describe('useOverheadStore', () => {
  beforeEach(() => {
    useOverheadStore.setState({
      overhead: [],
      loading: true,
      error: null,
    });
  });

  it('has correct initial state', () => {
    const state = useOverheadStore.getState();
    expect(state.overhead).toEqual([]);
    expect(state.loading).toBe(true);
    expect(state.error).toBeNull();
  });

  it('setOverhead updates overhead and clears loading/error', () => {
    const items = [makeOverhead()];
    useOverheadStore.getState().setOverhead(items);
    const state = useOverheadStore.getState();
    expect(state.overhead).toEqual(items);
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('setLoading updates loading flag', () => {
    useOverheadStore.getState().setLoading(false);
    expect(useOverheadStore.getState().loading).toBe(false);
  });

  it('setError updates error and clears loading', () => {
    useOverheadStore.getState().setError('Something went wrong');
    const state = useOverheadStore.getState();
    expect(state.error).toBe('Something went wrong');
    expect(state.loading).toBe(false);
  });
});

describe('selectByCategory', () => {
  it('filters items by category', () => {
    const items = [
      makeOverhead({ id: '1', category: 'software' }),
      makeOverhead({ id: '2', category: 'meals' }),
      makeOverhead({ id: '3', category: 'software' }),
    ];
    useOverheadStore.setState({ overhead: items });
    const state = useOverheadStore.getState();

    const result = selectByCategory('software')(state);
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.id)).toEqual(['1', '3']);
  });

  it('returns empty array when no match', () => {
    useOverheadStore.setState({ overhead: [makeOverhead()] });
    const state = useOverheadStore.getState();

    const result = selectByCategory('meals')(state);
    expect(result).toHaveLength(0);
  });
});

describe('selectCurrentMonth', () => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  it('includes one-time entries from current month', () => {
    const items = [
      makeOverhead({
        id: '1',
        recurrence: 'one_time',
        date: new Date(currentYear, currentMonth, 5),
      }),
      makeOverhead({
        id: '2',
        recurrence: 'one_time',
        date: new Date(currentYear, currentMonth - 1, 15),
      }),
    ];
    useOverheadStore.setState({ overhead: items });
    const state = useOverheadStore.getState();

    const result = selectCurrentMonth(state);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('includes all active recurring entries regardless of date', () => {
    const items = [
      makeOverhead({
        id: '1',
        recurrence: 'monthly',
        isActive: true,
        date: new Date(2025, 5, 1),
      }),
      makeOverhead({
        id: '2',
        recurrence: 'yearly',
        isActive: true,
        date: new Date(2025, 0, 1),
      }),
      makeOverhead({
        id: '3',
        recurrence: 'monthly',
        isActive: false,
        date: new Date(2025, 5, 1),
      }),
    ];
    useOverheadStore.setState({ overhead: items });
    const state = useOverheadStore.getState();

    const result = selectCurrentMonth(state);
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.id)).toEqual(['1', '2']);
  });

  it('returns empty array when no entries match', () => {
    useOverheadStore.setState({ overhead: [] });
    const state = useOverheadStore.getState();

    const result = selectCurrentMonth(state);
    expect(result).toHaveLength(0);
  });
});

describe('selectRecurring', () => {
  it('returns only active recurring items', () => {
    const items = [
      makeOverhead({ id: '1', recurrence: 'monthly', isActive: true }),
      makeOverhead({ id: '2', recurrence: 'one_time', isActive: true }),
      makeOverhead({ id: '3', recurrence: 'yearly', isActive: true }),
      makeOverhead({ id: '4', recurrence: 'monthly', isActive: false }),
    ];
    useOverheadStore.setState({ overhead: items });
    const state = useOverheadStore.getState();

    const result = selectRecurring(state);
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.id)).toEqual(['1', '3']);
  });

  it('returns empty array when no recurring items', () => {
    const items = [makeOverhead({ recurrence: 'one_time' })];
    useOverheadStore.setState({ overhead: items });
    const state = useOverheadStore.getState();

    const result = selectRecurring(state);
    expect(result).toHaveLength(0);
  });
});
