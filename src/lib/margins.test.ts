import { describe, it, expect } from 'vitest';
import { calculateMargin, getMarginStatus } from './margins';

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
