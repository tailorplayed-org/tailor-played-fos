import { describe, it, expect } from 'vitest';
import { overheadSchema, createOverheadSchema } from './overhead';

describe('overheadSchema', () => {
  const validOverhead = {
    id: 'oh-1',
    category: 'software',
    amountAgora: 8200,
    currency: 'ILS',
    date: new Date('2026-01-15'),
    description: 'Adobe subscription',
    recurrence: 'monthly',
    source: 'manual',
    transactionId: null,
    isActive: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-15'),
  };

  it('validates complete overhead document with all fields', () => {
    const result = overheadSchema.safeParse(validOverhead);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.category).toBe('software');
      expect(result.data.amountAgora).toBe(8200);
    }
  });

  it('rejects missing category', () => {
    const { category: _, ...incomplete } = validOverhead;
    const result = overheadSchema.safeParse(incomplete);
    expect(result.success).toBe(false);
  });

  it('rejects invalid category', () => {
    const result = overheadSchema.safeParse({ ...validOverhead, category: 'invalid' });
    expect(result.success).toBe(false);
  });

  it('rejects non-integer amountAgora', () => {
    const result = overheadSchema.safeParse({ ...validOverhead, amountAgora: 82.5 });
    expect(result.success).toBe(false);
  });

  it('defaults currency to ILS when not provided', () => {
    const { currency: _, ...withoutCurrency } = validOverhead;
    const result = overheadSchema.safeParse(withoutCurrency);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.currency).toBe('ILS');
    }
  });

  it('defaults recurrence to one_time when not provided', () => {
    const { recurrence: _, ...withoutRecurrence } = validOverhead;
    const result = overheadSchema.safeParse(withoutRecurrence);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.recurrence).toBe('one_time');
    }
  });

  it('defaults isActive to true', () => {
    const { isActive: _, ...withoutActive } = validOverhead;
    const result = overheadSchema.safeParse(withoutActive);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isActive).toBe(true);
    }
  });

  it('accepts nullable description and transactionId', () => {
    const result = overheadSchema.safeParse({
      ...validOverhead,
      description: null,
      transactionId: null,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBeNull();
      expect(result.data.transactionId).toBeNull();
    }
  });

  it('validates source is manual or ai', () => {
    const manualResult = overheadSchema.safeParse({ ...validOverhead, source: 'manual' });
    expect(manualResult.success).toBe(true);

    const aiResult = overheadSchema.safeParse({ ...validOverhead, source: 'ai' });
    expect(aiResult.success).toBe(true);

    const invalidResult = overheadSchema.safeParse({ ...validOverhead, source: 'other' });
    expect(invalidResult.success).toBe(false);
  });
});

describe('createOverheadSchema', () => {
  const validInput = {
    category: 'meals',
    amountIls: 82,
    date: '2026-01-15',
    description: 'Team lunch',
    recurrence: 'one_time',
  };

  it('validates complete form input', () => {
    const result = createOverheadSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.category).toBe('meals');
      expect(result.data.amountIls).toBe(82);
    }
  });

  it('rejects missing category', () => {
    const { category: _, ...noCategory } = validInput;
    const result = createOverheadSchema.safeParse(noCategory);
    expect(result.success).toBe(false);
  });

  it('rejects non-positive amount', () => {
    const result = createOverheadSchema.safeParse({ ...validInput, amountIls: 0 });
    expect(result.success).toBe(false);

    const negativeResult = createOverheadSchema.safeParse({ ...validInput, amountIls: -10 });
    expect(negativeResult.success).toBe(false);
  });

  it('rejects empty date string', () => {
    const result = createOverheadSchema.safeParse({ ...validInput, date: '' });
    expect(result.success).toBe(false);
  });

  it('defaults description to empty string', () => {
    const { description: _, ...noDesc } = validInput;
    const result = createOverheadSchema.safeParse(noDesc);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBe('');
    }
  });
});
