import { describe, it, expect } from 'vitest';
import { calculateTaxReserve, calculateTaxBreakdown } from './taxJar';

describe('calculateTaxReserve', () => {
  describe('flat mode', () => {
    it('calculates 35% of positive net profit', () => {
      // 100,000 agora * 0.35 = 35,000
      expect(calculateTaxReserve(100_000, 'flat', 0.35)).toBe(35_000);
    });

    it('uses default 35% rate when flatRate not provided', () => {
      expect(calculateTaxReserve(100_000, 'flat')).toBe(35_000);
    });

    it('calculates with custom flat rate', () => {
      // 100,000 agora * 0.20 = 20,000
      expect(calculateTaxReserve(100_000, 'flat', 0.20)).toBe(20_000);
    });

    it('rounds result to nearest integer', () => {
      // 33,333 * 0.35 = 11,666.55 → 11,667
      expect(calculateTaxReserve(33_333, 'flat', 0.35)).toBe(11_667);
    });

    it('handles large amounts correctly', () => {
      // 10,000,000 agora (₪100,000) * 0.35 = 3,500,000
      expect(calculateTaxReserve(10_000_000, 'flat', 0.35)).toBe(3_500_000);
    });
  });

  describe('bracket mode', () => {
    it('calculates tax for income in first bracket only', () => {
      // Monthly: 50,000 agora (₪500/month)
      // Annual: 600,000 agora (₪6,000/year) — all in 10% bracket
      // Annual tax: 600,000 * 0.10 = 60,000
      // Monthly: 60,000 / 12 = 5,000
      expect(calculateTaxReserve(50_000, 'bracket')).toBe(5_000);
    });

    it('calculates tax spanning multiple brackets', () => {
      // Monthly: 1,000,000 agora (₪10,000/month)
      // Annual: 12,000,000 agora (₪120,000/year)
      // Bracket 1: 8,622,000 * 0.10 = 862,200
      // Bracket 2: (12,000,000 - 8,622,000) = 3,378,000 * 0.14 = 472,920
      // Total annual: 862,200 + 472,920 = 1,335,120
      // Monthly: 1,335,120 / 12 = 111,260
      expect(calculateTaxReserve(1_000_000, 'bracket')).toBe(111_260);
    });

    it('handles income reaching higher brackets', () => {
      // Monthly: 5,000,000 agora (₪50,000/month)
      // Annual: 60,000,000 agora (₪600,000/year)
      // Bracket 1: 8,622,000 * 0.10 = 862,200
      // Bracket 2: (12,374,000 - 8,622,000) = 3,752,000 * 0.14 = 525,280
      // Bracket 3: (19,864,000 - 12,374,000) = 7,490,000 * 0.20 = 1,498,000
      // Bracket 4: (27,601,000 - 19,864,000) = 7,737,000 * 0.31 = 2,398,470
      // Bracket 5: (57,429,000 - 27,601,000) = 29,828,000 * 0.35 = 10,439,800
      // Bracket 6: (60,000,000 - 57,429,000) = 2,571,000 * 0.47 = 1,208,370
      // Total annual: 862,200 + 525,280 + 1,498,000 + 2,398,470 + 10,439,800 + 1,208,370 = 16,932,120
      // Monthly: 16,932,120 / 12 = 1,411,010
      expect(calculateTaxReserve(5_000_000, 'bracket')).toBe(1_411_010);
    });
  });

  describe('edge cases', () => {
    it('returns 0 for zero net profit', () => {
      expect(calculateTaxReserve(0, 'flat')).toBe(0);
      expect(calculateTaxReserve(0, 'bracket')).toBe(0);
    });

    it('returns 0 for negative net profit', () => {
      expect(calculateTaxReserve(-50_000, 'flat')).toBe(0);
      expect(calculateTaxReserve(-50_000, 'bracket')).toBe(0);
    });

    it('returns 0 for very small negative amount', () => {
      expect(calculateTaxReserve(-1, 'flat')).toBe(0);
    });

    it('handles 1 agora net profit in flat mode', () => {
      // 1 * 0.35 = 0.35 → rounds to 0
      expect(calculateTaxReserve(1, 'flat', 0.35)).toBe(0);
    });

    it('handles 1 agora net profit in bracket mode', () => {
      // 12 annual agora * 0.10 = 1.2 → 1 / 12 = 0.1 → rounds to 0
      expect(calculateTaxReserve(1, 'bracket')).toBe(0);
    });

    it('handles flat rate of 0', () => {
      expect(calculateTaxReserve(100_000, 'flat', 0)).toBe(0);
    });

    it('handles flat rate of 1 (100%)', () => {
      expect(calculateTaxReserve(100_000, 'flat', 1)).toBe(100_000);
    });
  });
});

describe('calculateTaxBreakdown', () => {
  it('returns empty rows for zero net profit', () => {
    const result = calculateTaxBreakdown(0, 'flat');
    expect(result.totalTaxAgora).toBe(0);
    expect(result.rows).toHaveLength(0);
    expect(result.method).toBe('flat');
  });

  it('returns empty rows for negative net profit', () => {
    const result = calculateTaxBreakdown(-50000, 'bracket');
    expect(result.totalTaxAgora).toBe(0);
    expect(result.rows).toHaveLength(0);
    expect(result.method).toBe('bracket');
  });

  it('flat mode — single row with default 35% rate', () => {
    const netProfit = 100_000; // ₪1,000 monthly
    const result = calculateTaxBreakdown(netProfit, 'flat');

    expect(result.method).toBe('flat');
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].rate).toBe(0.35);
    expect(result.rows[0].taxableAgora).toBe(100_000);
    expect(result.rows[0].taxAgora).toBe(35_000);
    expect(result.totalTaxAgora).toBe(35_000);
    expect(result.rows[0].label).toBe('35%');
  });

  it('flat mode — respects custom flat rate', () => {
    const netProfit = 200_000;
    const result = calculateTaxBreakdown(netProfit, 'flat', 0.25);

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].rate).toBe(0.25);
    expect(result.rows[0].taxAgora).toBe(50_000);
    expect(result.totalTaxAgora).toBe(50_000);
    expect(result.rows[0].label).toBe('25%');
  });

  it('bracket mode — returns multiple bracket rows', () => {
    // Monthly income that annualizes above the first bracket
    // ₪100,000/month = ₪1,200,000/year → spans multiple brackets
    const netProfit = 10_000_000; // 100,000 ILS/month in agora
    const result = calculateTaxBreakdown(netProfit, 'bracket');

    expect(result.method).toBe('bracket');
    expect(result.rows.length).toBeGreaterThan(1);
    // All rows should have positive taxable amounts
    result.rows.forEach((row) => {
      expect(row.taxableAgora).toBeGreaterThan(0);
      expect(row.taxAgora).toBeGreaterThan(0);
      expect(row.rate).toBeGreaterThan(0);
    });
  });

  it('bracket mode — only includes brackets with taxable amounts', () => {
    // Small income: ₪5,000/month = ₪60,000/year — only first bracket
    const netProfit = 500_000; // 5,000 ILS/month in agora
    const result = calculateTaxBreakdown(netProfit, 'bracket');

    // ₪60,000/year is well within the first bracket (up to ₪86,220)
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].rate).toBe(0.10);
  });

  it('bracket mode — total matches calculateTaxReserve output', () => {
    const testAmounts = [500_000, 1_000_000, 5_000_000, 10_000_000, 20_000_000];

    for (const netProfit of testAmounts) {
      const breakdown = calculateTaxBreakdown(netProfit, 'bracket');
      const reserve = calculateTaxReserve(netProfit, 'bracket');

      // Both should return the same monthly tax amount
      expect(breakdown.totalTaxAgora).toBe(reserve);
    }
  });

  it('flat mode — total matches calculateTaxReserve output', () => {
    const testAmounts = [100_000, 500_000, 1_000_000];

    for (const netProfit of testAmounts) {
      const breakdown = calculateTaxBreakdown(netProfit, 'flat', 0.35);
      const reserve = calculateTaxReserve(netProfit, 'flat', 0.35);

      expect(breakdown.totalTaxAgora).toBe(reserve);
    }
  });

  it('bracket mode — first bracket label says "up to"', () => {
    const netProfit = 500_000;
    const result = calculateTaxBreakdown(netProfit, 'bracket');
    expect(result.rows[0].label).toMatch(/^10% \(up to/);
  });

  it('bracket mode — middle bracket labels have range format', () => {
    // Income high enough to span at least 3 brackets
    const netProfit = 10_000_000; // ₪100,000/month
    const result = calculateTaxBreakdown(netProfit, 'bracket');

    // Second bracket should have range format
    expect(result.rows.length).toBeGreaterThanOrEqual(3);
    expect(result.rows[1].label).toMatch(/14% \(₪/);
    expect(result.rows[1].label).toContain('–');
  });
});
