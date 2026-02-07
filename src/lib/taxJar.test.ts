import { describe, it, expect } from 'vitest';
import { calculateTaxReserve } from './taxJar';

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
      // Bracket 1: 8,412,000 * 0.10 = 841,200
      // Bracket 2: (12,000,000 - 8,412,000) = 3,588,000 * 0.14 = 502,320
      // Total annual: 841,200 + 502,320 = 1,343,520
      // Monthly: 1,343,520 / 12 = 111,960
      expect(calculateTaxReserve(1_000_000, 'bracket')).toBe(111_960);
    });

    it('handles income reaching higher brackets', () => {
      // Monthly: 5,000,000 agora (₪50,000/month)
      // Annual: 60,000,000 agora (₪600,000/year)
      // Bracket 1: 8,412,000 * 0.10 = 841,200
      // Bracket 2: 3,660,000 * 0.14 = 512,400
      // Bracket 3: 7,308,000 * 0.20 = 1,461,600
      // Bracket 4: 7,548,000 * 0.31 = 2,339,880
      // Bracket 5: 29,100,000 * 0.35 = 10,185,000
      // Bracket 6: (60,000,000 - 56,028,000) = 3,972,000 * 0.47 = 1,866,840
      // Total annual: 841,200 + 512,400 + 1,461,600 + 2,339,880 + 10,185,000 + 1,866,840 = 17,206,920
      // Monthly: 17,206,920 / 12 = 1,433,910
      expect(calculateTaxReserve(5_000_000, 'bracket')).toBe(1_433_910);
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
