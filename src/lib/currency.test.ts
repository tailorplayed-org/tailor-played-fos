import { describe, it, expect } from 'vitest';
import { toMinorUnits, toDisplayAmount, formatCurrency } from './currency';

describe('toMinorUnits', () => {
  it('converts 82.00 → 8200', () => {
    expect(toMinorUnits(82.0)).toBe(8200);
  });

  it('converts 0.01 → 1', () => {
    expect(toMinorUnits(0.01)).toBe(1);
  });

  it('converts 99.99 → 9999', () => {
    expect(toMinorUnits(99.99)).toBe(9999);
  });

  it('converts zero → 0', () => {
    expect(toMinorUnits(0)).toBe(0);
  });

  it('converts negative amounts', () => {
    expect(toMinorUnits(-82.0)).toBe(-8200);
  });

  it('handles large numbers', () => {
    expect(toMinorUnits(1000000)).toBe(100000000);
  });

  it('handles floating-point precision (0.1 + 0.2)', () => {
    // 0.1 + 0.2 = 0.30000000000000004 in JS
    expect(toMinorUnits(0.1 + 0.2)).toBe(30);
  });

  it('works with USD currency', () => {
    expect(toMinorUnits(142.5, 'USD')).toBe(14250);
  });

  it('works with EUR currency', () => {
    expect(toMinorUnits(200, 'EUR')).toBe(20000);
  });
});

describe('toDisplayAmount', () => {
  it('converts 8200 → 82', () => {
    expect(toDisplayAmount(8200)).toBe(82);
  });

  it('converts 1 → 0.01', () => {
    expect(toDisplayAmount(1)).toBe(0.01);
  });

  it('converts 0 → 0', () => {
    expect(toDisplayAmount(0)).toBe(0);
  });

  it('converts negative minorUnits', () => {
    expect(toDisplayAmount(-8200)).toBe(-82);
  });

  it('round trips with toMinorUnits', () => {
    expect(toDisplayAmount(toMinorUnits(99.99))).toBe(99.99);
  });
});

describe('formatCurrency', () => {
  it('formats ILS correctly', () => {
    const result = formatCurrency(8200, 'ILS');
    expect(result).toBe('₪82.00');
  });

  it('formats USD correctly', () => {
    const result = formatCurrency(14250, 'USD');
    expect(result).toBe('$142.50');
  });

  it('formats EUR correctly', () => {
    const result = formatCurrency(20000, 'EUR');
    expect(result).toBe('€200.00');
  });

  it('formats zero', () => {
    const result = formatCurrency(0, 'USD');
    expect(result).toBe('$0.00');
  });

  it('formats negative amounts', () => {
    const result = formatCurrency(-8200, 'USD');
    expect(result).toBe('-$82.00');
  });

  it('formats large numbers with separators', () => {
    const result = formatCurrency(10000000, 'USD');
    expect(result).toBe('$100,000.00');
  });

  it('defaults to ILS when no currency specified', () => {
    const result = formatCurrency(8200);
    expect(result).toBe('₪82.00');
  });

  // WAC calculation precision scenario
  it('handles WAC precision — multi-purchase average cost', () => {
    // Scenario: 10 items at ₪50 (5000 agora), then 5 items at ₪60 (6000 agora)
    // Total cost: 10*5000 + 5*6000 = 50000 + 30000 = 80000 agora
    // Total items: 15
    // WAC per unit: 80000/15 = 5333.33... agora → round to 5333
    const wacPerUnit = Math.round(80000 / 15);
    expect(wacPerUnit).toBe(5333);
    const result = formatCurrency(wacPerUnit, 'ILS');
    expect(result).toBe('₪53.33');
  });
});
