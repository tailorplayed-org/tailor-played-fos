import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  useOverheadStore,
  selectByCategory,
  selectCurrentMonth,
  selectPreviousMonth,
  selectRecurring,
  calculateBurn,
} from './useOverheadStore';
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

describe('calculateBurn', () => {
  it('returns 0 for empty array', () => {
    expect(calculateBurn([])).toBe(0);
  });

  it('sums one_time entries at full amount', () => {
    const entries = [
      makeOverhead({ amountAgora: 5000, recurrence: 'one_time' }),
      makeOverhead({ id: 'oh-2', amountAgora: 3000, recurrence: 'one_time' }),
    ];
    expect(calculateBurn(entries)).toBe(8000);
  });

  it('sums monthly entries at full amount', () => {
    const entries = [
      makeOverhead({ amountAgora: 10000, recurrence: 'monthly' }),
      makeOverhead({ id: 'oh-2', amountAgora: 2000, recurrence: 'monthly' }),
    ];
    expect(calculateBurn(entries)).toBe(12000);
  });

  it('prorates yearly entries to amount / 12 (rounded)', () => {
    const entries = [
      makeOverhead({ amountAgora: 12000, recurrence: 'yearly' }),
    ];
    expect(calculateBurn(entries)).toBe(1000); // 12000/12
  });

  it('rounds yearly proration correctly', () => {
    const entries = [
      makeOverhead({ amountAgora: 10000, recurrence: 'yearly' }),
    ];
    expect(calculateBurn(entries)).toBe(833); // Math.round(10000/12)
  });

  it('handles mixed recurrence correctly', () => {
    const entries = [
      makeOverhead({ id: '1', amountAgora: 5000, recurrence: 'one_time' }),
      makeOverhead({ id: '2', amountAgora: 3000, recurrence: 'monthly' }),
      makeOverhead({ id: '3', amountAgora: 12000, recurrence: 'yearly' }),
    ];
    // 5000 + 3000 + Math.round(12000/12) = 5000 + 3000 + 1000 = 9000
    expect(calculateBurn(entries)).toBe(9000);
  });
});

describe('selectPreviousMonth', () => {
  const now = new Date();
  const prevMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
  const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();

  it('returns one-time entries from previous month only', () => {
    const items = [
      makeOverhead({
        id: '1',
        recurrence: 'one_time',
        date: new Date(prevYear, prevMonth, 10),
      }),
      makeOverhead({
        id: '2',
        recurrence: 'one_time',
        date: new Date(now.getFullYear(), now.getMonth(), 5),
      }),
    ];
    useOverheadStore.setState({ overhead: items });
    const state = useOverheadStore.getState();

    const result = selectPreviousMonth(state);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('returns active recurring entries regardless of date', () => {
    const items = [
      makeOverhead({
        id: '1',
        recurrence: 'monthly',
        isActive: true,
        date: new Date(2025, 3, 1),
      }),
      makeOverhead({
        id: '2',
        recurrence: 'yearly',
        isActive: true,
        date: new Date(2025, 0, 1),
      }),
    ];
    useOverheadStore.setState({ overhead: items });
    const state = useOverheadStore.getState();

    const result = selectPreviousMonth(state);
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.id)).toEqual(['1', '2']);
  });

  it('excludes inactive recurring entries', () => {
    const items = [
      makeOverhead({
        id: '1',
        recurrence: 'monthly',
        isActive: false,
      }),
      makeOverhead({
        id: '2',
        recurrence: 'yearly',
        isActive: false,
      }),
    ];
    useOverheadStore.setState({ overhead: items });
    const state = useOverheadStore.getState();

    const result = selectPreviousMonth(state);
    expect(result).toHaveLength(0);
  });

  it('handles January → December year boundary', () => {
    // Mock date to January 15, 2026 — previous month should be December 2025
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 15)); // January 15, 2026

    const items = [
      makeOverhead({
        id: 'dec-entry',
        recurrence: 'one_time',
        date: new Date(2025, 11, 10), // December 10, 2025
      }),
      makeOverhead({
        id: 'nov-entry',
        recurrence: 'one_time',
        date: new Date(2025, 10, 10), // November 10, 2025 — should be excluded
      }),
      makeOverhead({
        id: 'jan-entry',
        recurrence: 'one_time',
        date: new Date(2026, 0, 5), // January 5, 2026 — should be excluded
      }),
    ];
    useOverheadStore.setState({ overhead: items });
    const state = useOverheadStore.getState();

    const result = selectPreviousMonth(state);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('dec-entry');

    vi.useRealTimers();
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
