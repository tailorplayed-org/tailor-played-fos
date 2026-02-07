import { describe, it, expect } from 'vitest';
import { calculateMargin, calculateBuffer, BUFFER_PERCENTAGE, getMarginStatus } from './margins';

describe('calculateBuffer', () => {
  it('returns 5% of total cost', () => {
    expect(calculateBuffer(10000)).toBe(500);
  });

  it('returns 0 for 0 cost', () => {
    expect(calculateBuffer(0)).toBe(0);
  });

  it('rounds to nearest integer', () => {
    // 333 * 0.05 = 16.65 → rounds to 17
    expect(calculateBuffer(333)).toBe(17);
    // 1 * 0.05 = 0.05 → rounds to 0
    expect(calculateBuffer(1)).toBe(0);
    // 10 * 0.05 = 0.5 → rounds to 1 (Math.round rounds 0.5 up)
    expect(calculateBuffer(10)).toBe(1);
  });

  it('uses BUFFER_PERCENTAGE constant (0.05)', () => {
    expect(BUFFER_PERCENTAGE).toBe(0.05);
  });
});

describe('calculateMargin', () => {
  it('returns 0 when revenue is 0 (prevents division by zero)', () => {
    expect(calculateMargin(0, 5000)).toBe(0);
  });

  it('returns 0 when both revenue and cost are 0', () => {
    expect(calculateMargin(0, 0)).toBe(0);
  });

  it('returns 100% when cost is 0 and revenue exists', () => {
    expect(calculateMargin(10000, 0)).toBe(100);
  });

  it('calculates margin correctly for normal case', () => {
    // revenue=10000, cost=6000 → (10000-6000)/10000 * 100 = 40%
    expect(calculateMargin(10000, 6000)).toBe(40);
  });

  it('returns negative margin when cost exceeds revenue', () => {
    // revenue=10000, cost=15000 → (10000-15000)/10000 * 100 = -50%
    expect(calculateMargin(10000, 15000)).toBe(-50);
  });

  it('calculates exact 30% boundary', () => {
    // revenue=10000, cost=7000 → (10000-7000)/10000 * 100 = 30%
    expect(calculateMargin(10000, 7000)).toBe(30);
  });

  it('calculates exact 20% boundary', () => {
    // revenue=10000, cost=8000 → (10000-8000)/10000 * 100 = 20%
    expect(calculateMargin(10000, 8000)).toBe(20);
  });

  it('handles large agora values', () => {
    // revenue=1000000, cost=700000 → 30%
    expect(calculateMargin(1000000, 700000)).toBe(30);
  });

  it('with buffer: reduces margin correctly', () => {
    // revenue=10000, cost=6000, buffer=500 → (10000-6000-500)/10000*100 = 35%
    expect(calculateMargin(10000, 6000, 500)).toBe(35);
  });

  it('with buffer=0: same as without buffer (backward compat)', () => {
    expect(calculateMargin(10000, 6000, 0)).toBe(calculateMargin(10000, 6000));
  });

  it('with buffer: zero revenue returns 0', () => {
    expect(calculateMargin(0, 5000, 250)).toBe(0);
  });
});

describe('getMarginStatus', () => {
  it('returns healthy for margin >= 30%', () => {
    expect(getMarginStatus(30)).toBe('healthy');
    expect(getMarginStatus(50)).toBe('healthy');
    expect(getMarginStatus(100)).toBe('healthy');
  });

  it('returns watch for margin 20-29.99%', () => {
    expect(getMarginStatus(20)).toBe('watch');
    expect(getMarginStatus(25)).toBe('watch');
    expect(getMarginStatus(29.99)).toBe('watch');
  });

  it('returns danger for margin < 20%', () => {
    expect(getMarginStatus(19.99)).toBe('danger');
    expect(getMarginStatus(10)).toBe('danger');
    expect(getMarginStatus(0)).toBe('danger');
  });

  it('returns danger for negative margin', () => {
    expect(getMarginStatus(-10)).toBe('danger');
    expect(getMarginStatus(-50)).toBe('danger');
  });

  it('returns healthy at exact 30% boundary', () => {
    expect(getMarginStatus(30)).toBe('healthy');
  });

  it('returns watch at exact 20% boundary', () => {
    expect(getMarginStatus(20)).toBe('watch');
  });

  it('returns watch at 29.99% (just below healthy)', () => {
    expect(getMarginStatus(29.99)).toBe('watch');
  });

  it('returns danger at 19.99% (just below watch)', () => {
    expect(getMarginStatus(19.99)).toBe('danger');
  });
});
