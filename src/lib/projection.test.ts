import { describe, it, expect } from 'vitest';
import {
  calculateAvailableBuffer,
  buildFinancialSnapshot,
  calculateMonthlyCoverage,
  calculateMonthsUntilAbsorbed,
  getAssessment,
  calculateProjection,
} from './projection';

describe('calculateAvailableBuffer', () => {
  it('returns profit minus tax jar and overhead', () => {
    expect(calculateAvailableBuffer(1_000_000, 200_000, 150_000)).toBe(650_000);
  });

  it('does not subtract tax jar when net profit is negative', () => {
    expect(calculateAvailableBuffer(-100_000, 200_000, 150_000)).toBe(-250_000);
  });

  it('handles zero values', () => {
    expect(calculateAvailableBuffer(0, 0, 0)).toBe(0);
  });

  it('does not subtract tax jar when net profit is exactly zero', () => {
    expect(calculateAvailableBuffer(0, 50_000, 30_000)).toBe(-30_000);
  });
});

describe('buildFinancialSnapshot', () => {
  it('returns snapshot with computed available buffer', () => {
    const snapshot = buildFinancialSnapshot(1_000_000, 200_000, 150_000, 500_000);
    expect(snapshot).toEqual({
      netProfitAgora: 1_000_000,
      taxJarAgora: 200_000,
      monthlyOverheadAgora: 150_000,
      availableBufferAgora: 650_000,
      pipelineRevenueAgora: 500_000,
    });
  });
});

describe('calculateMonthlyCoverage', () => {
  it('returns correct months of coverage', () => {
    // buffer 650k, monthly cost = 150k + 200k = 350k → 1.857
    expect(calculateMonthlyCoverage(650_000, 150_000, 200_000)).toBeCloseTo(1.857, 2);
  });

  it('returns Infinity when monthly cost is 0 and buffer is positive', () => {
    expect(calculateMonthlyCoverage(100_000, 0, 0)).toBe(Infinity);
  });

  it('returns 0 when monthly cost is 0 and buffer is 0', () => {
    expect(calculateMonthlyCoverage(0, 0, 0)).toBe(0);
  });

  it('returns 0 for negative buffer', () => {
    expect(calculateMonthlyCoverage(-100_000, 150_000, 200_000)).toBe(0);
  });

  it('returns 0 for zero buffer', () => {
    expect(calculateMonthlyCoverage(0, 150_000, 200_000)).toBe(0);
  });
});

describe('calculateMonthsUntilAbsorbed', () => {
  it('returns null when no pipeline revenue', () => {
    expect(calculateMonthsUntilAbsorbed(100_000, 0)).toBeNull();
  });

  it('returns null for negative pipeline revenue', () => {
    expect(calculateMonthsUntilAbsorbed(100_000, -50_000)).toBeNull();
  });

  it('returns correct months for given pipeline', () => {
    // purchase 280_000, pipeline 900_000, monthly pipeline = 300_000
    // ceil(280_000 / 300_000) = 1
    expect(calculateMonthsUntilAbsorbed(280_000, 900_000)).toBe(1);
  });

  it('returns higher months for larger purchase relative to pipeline', () => {
    // purchase 700_000, pipeline 900_000, monthly = 300_000
    // ceil(700_000 / 300_000) = 3
    expect(calculateMonthsUntilAbsorbed(700_000, 900_000)).toBe(3);
  });
});

describe('getAssessment', () => {
  it('returns "healthy" for >= 2 months', () => {
    expect(getAssessment(2)).toBe('healthy');
    expect(getAssessment(5.5)).toBe('healthy');
  });

  it('returns "tight" for > 0 and < 2 months', () => {
    expect(getAssessment(1.5)).toBe('tight');
    expect(getAssessment(0.1)).toBe('tight');
  });

  it('returns "negative" for <= 0', () => {
    expect(getAssessment(0)).toBe('negative');
    expect(getAssessment(-1)).toBe('negative');
  });
});

describe('calculateProjection', () => {
  const healthySnapshot = buildFinancialSnapshot(
    3_000_000, // net profit ₪30,000
    400_000,   // tax jar ₪4,000
    300_000,   // overhead ₪3,000
    1_500_000, // pipeline ₪15,000
  );
  // buffer = 3_000_000 - 400_000 - 300_000 = 2_300_000
  // monthly cost = 300_000 + 400_000 = 700_000

  it('healthy scenario: large buffer covers >= 2 months after purchase', () => {
    const result = calculateProjection(healthySnapshot, 100_000);
    expect(result.assessment).toBe('healthy');
    expect(result.bufferAfterPurchaseAgora).toBe(2_200_000);
    expect(result.shortfallAgora).toBe(0);
    expect(result.isInventoryPurchase).toBe(false);
  });

  it('tight scenario: small buffer after purchase', () => {
    // After 1_900k purchase: buffer = 2_300_000 - 1_900_000 = 400_000
    // monthly cost = 700k → 400_000/700_000 = 0.57 < 2
    const result = calculateProjection(healthySnapshot, 1_900_000);
    expect(result.assessment).toBe('tight');
    expect(result.bufferAfterPurchaseAgora).toBe(400_000);
    expect(result.shortfallAgora).toBe(0);
  });

  it('negative scenario: purchase exceeds buffer', () => {
    const result = calculateProjection(healthySnapshot, 3_000_000);
    expect(result.assessment).toBe('negative');
    expect(result.bufferAfterPurchaseAgora).toBe(-700_000);
    expect(result.shortfallAgora).toBe(700_000);
  });

  it('zero purchase returns current assessment without purchase', () => {
    const result = calculateProjection(healthySnapshot, 0);
    expect(result.bufferAfterPurchaseAgora).toBe(2_300_000);
    expect(result.shortfallAgora).toBe(0);
    expect(result.monthsUntilAbsorbed).toBeNull();
  });

  it('negative purchase returns current assessment', () => {
    const result = calculateProjection(healthySnapshot, -100);
    expect(result.bufferAfterPurchaseAgora).toBe(2_300_000);
  });

  it('shortfallAgora is positive when buffer goes negative', () => {
    const result = calculateProjection(healthySnapshot, 2_500_000);
    expect(result.bufferAfterPurchaseAgora).toBe(-200_000);
    expect(result.shortfallAgora).toBe(200_000);
  });

  it('isInventoryPurchase flag passes through', () => {
    const result = calculateProjection(healthySnapshot, 100_000, true);
    expect(result.isInventoryPurchase).toBe(true);
  });

  it('monthsUntilAbsorbed is calculated when pipeline exists', () => {
    const result = calculateProjection(healthySnapshot, 280_000);
    // pipeline 1_500_000, monthly = 500_000, ceil(280_000/500_000) = 1
    expect(result.monthsUntilAbsorbed).toBe(1);
  });

  it('monthsUntilAbsorbed is null when no pipeline revenue', () => {
    const noPipeline = buildFinancialSnapshot(2_000_000, 400_000, 300_000, 0);
    const result = calculateProjection(noPipeline, 100_000);
    expect(result.monthsUntilAbsorbed).toBeNull();
  });

  it('monthlyCoverageMonths is rounded to 1 decimal', () => {
    const result = calculateProjection(healthySnapshot, 100_000);
    const str = String(result.monthlyCoverageMonths);
    const decimals = str.includes('.') ? str.split('.')[1].length : 0;
    expect(decimals).toBeLessThanOrEqual(1);
  });
});
