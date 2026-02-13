import { describe, it, expect } from 'vitest';
import { calculateWAC, applyScoopCost } from './wac';

describe('calculateWAC', () => {
  it('returns 0 when both quantities are zero', () => {
    expect(calculateWAC(0, 0, 0, 0)).toBe(0);
  });

  it('calculates WAC for first restock (existingQty = 0)', () => {
    // 10 units at total cost 5000 agora → WAC = 500
    expect(calculateWAC(0, 0, 10, 5000)).toBe(500);
  });

  it('calculates WAC for first restock with non-round division', () => {
    // 3 units at total cost 1000 agora → WAC = 333 (rounds to nearest)
    expect(calculateWAC(0, 0, 3, 1000)).toBe(333);
  });

  it('calculates standard WAC (blended cost)', () => {
    // Existing: 100 units @ 350 agora/unit (total value 35000)
    // Restock: 50 units @ total cost 20000 agora
    // New WAC: (100*350 + 20000) / (100+50) = 55000 / 150 = 367 (rounded)
    expect(calculateWAC(100, 350, 50, 20000)).toBe(367);
  });

  it('handles zero cost restock (dilution)', () => {
    // Existing: 50 units @ 1000 agora/unit (total value 50000)
    // Restock: 50 units @ 0 cost → dilutes WAC
    // New WAC: (50*1000 + 0) / (50+50) = 50000 / 100 = 500
    expect(calculateWAC(50, 1000, 50, 0)).toBe(500);
  });

  it('handles single unit restock', () => {
    // Existing: 10 units @ 200 agora
    // Restock: 1 unit @ 500 agora
    // New WAC: (10*200 + 500) / (10+1) = 2500 / 11 = 227 (rounded)
    expect(calculateWAC(10, 200, 1, 500)).toBe(227);
  });

  it('returns total cost for single unit when existingQty is 0', () => {
    // First restock: 1 unit at 1500 agora
    expect(calculateWAC(0, 0, 1, 1500)).toBe(1500);
  });

  it('handles large quantities without overflow', () => {
    // Safe integer limit: 2^53 = 9007199254740992
    // Use quantities that produce large intermediate values
    const existingQty = 1000000;
    const existingWac = 100000; // 1000 ILS
    const addedQty = 500000;
    const addedTotalCost = 60000000000; // 600K ILS in agora

    const result = calculateWAC(existingQty, existingWac, addedQty, addedTotalCost);
    // (1000000 * 100000 + 60000000000) / 1500000 = (100_000_000_000 + 60_000_000_000) / 1_500_000
    // = 160_000_000_000 / 1_500_000 = 106667 (rounded)
    expect(result).toBe(106667);
  });

  it('matches manual calculation within 1 agora — scenario A', () => {
    // Manual: existing 25 @ 480, restock 15 @ total 8400
    // (25*480 + 8400) / 40 = (12000 + 8400) / 40 = 20400 / 40 = 510
    expect(calculateWAC(25, 480, 15, 8400)).toBe(510);
  });

  it('matches manual calculation within 1 agora — scenario B', () => {
    // Manual: existing 200 @ 150, restock 100 @ total 18000
    // (200*150 + 18000) / 300 = (30000 + 18000) / 300 = 48000 / 300 = 160
    expect(calculateWAC(200, 150, 100, 18000)).toBe(160);
  });

  it('matches manual calculation within 1 agora — non-round result', () => {
    // Manual: existing 7 @ 300, restock 3 @ total 1100
    // (7*300 + 1100) / 10 = (2100 + 1100) / 10 = 3200 / 10 = 320
    expect(calculateWAC(7, 300, 3, 1100)).toBe(320);
  });

  it('matches manual calculation within 1 agora — rounding scenario', () => {
    // Manual: existing 3 @ 100, restock 2 @ total 250
    // (3*100 + 250) / 5 = 550 / 5 = 110
    expect(calculateWAC(3, 100, 2, 250)).toBe(110);
  });

  it('handles rounding correctly (rounds to nearest agora)', () => {
    // (10*100 + 333) / 13 = 1333/13 = 102.538... → rounds to 103
    expect(calculateWAC(10, 100, 3, 333)).toBe(103);
  });
});

describe('applyScoopCost', () => {
  it('calculates scoop cost as qty * WAC', () => {
    expect(applyScoopCost(5, 350)).toBe(1750);
  });

  it('returns 0 for zero quantity', () => {
    expect(applyScoopCost(0, 500)).toBe(0);
  });

  it('returns 0 for zero WAC', () => {
    expect(applyScoopCost(10, 0)).toBe(0);
  });
});
