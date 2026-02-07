import { describe, it, expect } from 'vitest';
import {
  transactionSchema,
  createTransactionSchema,
  TRANSACTION_CATEGORIES,
  TRANSACTION_STATUSES,
  TRANSACTION_SOURCES,
} from './transaction';

describe('transactionSchema', () => {
  const validTransaction = {
    id: 'txn-1',
    vendorName: 'Acme Supplies',
    amountAgora: 8200,
    currency: 'ILS' as const,
    date: new Date('2026-02-01'),
    category: 'DirectCost' as const,
    workOrderId: 'wo-1',
    inventoryItemId: null,
    status: 'approved' as const,
    aiConfidence: null,
    originalFileUrl: null,
    source: 'manual' as const,
    notes: 'Test transaction',
    createdAt: new Date('2026-02-01'),
    updatedAt: new Date('2026-02-01'),
  };

  it('parses a valid transaction', () => {
    const result = transactionSchema.parse(validTransaction);
    expect(result).toEqual(validTransaction);
  });

  it('rejects missing required field vendorName', () => {
    const invalid = { ...validTransaction, vendorName: '' };
    expect(() => transactionSchema.parse(invalid)).toThrow();
  });

  it('rejects non-integer amountAgora', () => {
    const invalid = { ...validTransaction, amountAgora: 82.5 };
    expect(() => transactionSchema.parse(invalid)).toThrow();
  });

  it('validates category enum values', () => {
    for (const category of TRANSACTION_CATEGORIES) {
      const result = transactionSchema.parse({ ...validTransaction, category });
      expect(result.category).toBe(category);
    }
  });

  it('rejects invalid category', () => {
    const invalid = { ...validTransaction, category: 'InvalidCategory' };
    expect(() => transactionSchema.parse(invalid)).toThrow();
  });

  it('validates status enum values', () => {
    for (const status of TRANSACTION_STATUSES) {
      const result = transactionSchema.parse({ ...validTransaction, status });
      expect(result.status).toBe(status);
    }
  });

  it('rejects invalid status', () => {
    const invalid = { ...validTransaction, status: 'invalid_status' };
    expect(() => transactionSchema.parse(invalid)).toThrow();
  });

  it('validates currency enum values', () => {
    for (const currency of ['ILS', 'USD', 'EUR'] as const) {
      const result = transactionSchema.parse({ ...validTransaction, currency });
      expect(result.currency).toBe(currency);
    }
  });

  it('rejects invalid currency', () => {
    const invalid = { ...validTransaction, currency: 'GBP' };
    expect(() => transactionSchema.parse(invalid)).toThrow();
  });

  it('validates source enum values', () => {
    for (const source of TRANSACTION_SOURCES) {
      const result = transactionSchema.parse({ ...validTransaction, source });
      expect(result.source).toBe(source);
    }
  });

  it('allows nullable optional fields', () => {
    const result = transactionSchema.parse({
      ...validTransaction,
      workOrderId: null,
      inventoryItemId: null,
      aiConfidence: null,
      originalFileUrl: null,
      notes: null,
    });
    expect(result.workOrderId).toBeNull();
    expect(result.inventoryItemId).toBeNull();
    expect(result.aiConfidence).toBeNull();
    expect(result.originalFileUrl).toBeNull();
    expect(result.notes).toBeNull();
  });

  it('accepts string values for nullable string fields', () => {
    const result = transactionSchema.parse({
      ...validTransaction,
      workOrderId: 'wo-123',
      originalFileUrl: 'https://example.com/file.pdf',
      notes: 'Some notes',
    });
    expect(result.workOrderId).toBe('wo-123');
    expect(result.originalFileUrl).toBe('https://example.com/file.pdf');
    expect(result.notes).toBe('Some notes');
  });

  it('accepts numeric aiConfidence', () => {
    const result = transactionSchema.parse({ ...validTransaction, aiConfidence: 0.95 });
    expect(result.aiConfidence).toBe(0.95);
  });
});

describe('createTransactionSchema', () => {
  const validInput = {
    vendorName: 'Acme Supplies',
    amount: 82.5,
    currency: 'ILS' as const,
    date: new Date('2026-02-01'),
    category: 'DirectCost' as const,
    workOrderId: null,
    notes: null,
  };

  it('parses valid form input', () => {
    const result = createTransactionSchema.parse(validInput);
    expect(result).toEqual(validInput);
  });

  it('rejects empty vendorName', () => {
    const invalid = { ...validInput, vendorName: '' };
    expect(() => createTransactionSchema.parse(invalid)).toThrow();
  });

  it('rejects zero amount', () => {
    const invalid = { ...validInput, amount: 0 };
    expect(() => createTransactionSchema.parse(invalid)).toThrow();
  });

  it('rejects negative amount', () => {
    const invalid = { ...validInput, amount: -10 };
    expect(() => createTransactionSchema.parse(invalid)).toThrow();
  });

  it('accepts positive decimal amount', () => {
    const result = createTransactionSchema.parse({ ...validInput, amount: 0.01 });
    expect(result.amount).toBe(0.01);
  });

  it('allows nullable workOrderId and notes', () => {
    const result = createTransactionSchema.parse(validInput);
    expect(result.workOrderId).toBeNull();
    expect(result.notes).toBeNull();
  });

  it('accepts string workOrderId', () => {
    const result = createTransactionSchema.parse({ ...validInput, workOrderId: 'wo-1' });
    expect(result.workOrderId).toBe('wo-1');
  });

  it('accepts string notes', () => {
    const result = createTransactionSchema.parse({ ...validInput, notes: 'Test note' });
    expect(result.notes).toBe('Test note');
  });
});
