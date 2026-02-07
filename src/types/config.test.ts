import { describe, it, expect } from 'vitest';
import { systemConfigSchema } from './config';

describe('systemConfigSchema', () => {
  const validConfig = {
    taxMethod: 'flat' as const,
    flatRate: 0.35,
    currencyRates: { ILS: 1, USD: 3.5, EUR: 3.8 },
    osPaturThresholdAgora: 12_000_000,
  };

  it('parses a valid flat config', () => {
    const result = systemConfigSchema.safeParse(validConfig);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.taxMethod).toBe('flat');
      expect(result.data.flatRate).toBe(0.35);
      expect(result.data.currencyRates.USD).toBe(3.5);
      expect(result.data.osPaturThresholdAgora).toBe(12_000_000);
    }
  });

  it('parses a valid bracket config', () => {
    const result = systemConfigSchema.safeParse({
      ...validConfig,
      taxMethod: 'bracket',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.taxMethod).toBe('bracket');
    }
  });

  it('rejects invalid taxMethod', () => {
    const result = systemConfigSchema.safeParse({
      ...validConfig,
      taxMethod: 'progressive',
    });
    expect(result.success).toBe(false);
  });

  it('rejects flatRate below 0', () => {
    const result = systemConfigSchema.safeParse({
      ...validConfig,
      flatRate: -0.1,
    });
    expect(result.success).toBe(false);
  });

  it('rejects flatRate above 1', () => {
    const result = systemConfigSchema.safeParse({
      ...validConfig,
      flatRate: 1.5,
    });
    expect(result.success).toBe(false);
  });

  it('accepts flatRate at boundary 0', () => {
    const result = systemConfigSchema.safeParse({
      ...validConfig,
      flatRate: 0,
    });
    expect(result.success).toBe(true);
  });

  it('accepts flatRate at boundary 1', () => {
    const result = systemConfigSchema.safeParse({
      ...validConfig,
      flatRate: 1,
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing currencyRates fields', () => {
    const result = systemConfigSchema.safeParse({
      ...validConfig,
      currencyRates: { ILS: 1, USD: 3.5 }, // EUR missing
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-integer osPaturThresholdAgora', () => {
    const result = systemConfigSchema.safeParse({
      ...validConfig,
      osPaturThresholdAgora: 12_000_000.5,
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing required fields', () => {
    const result = systemConfigSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('rejects null taxMethod', () => {
    const result = systemConfigSchema.safeParse({
      ...validConfig,
      taxMethod: null,
    });
    expect(result.success).toBe(false);
  });
});
