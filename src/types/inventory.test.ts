import { describe, it, expect } from 'vitest';
import { inventoryItemSchema, createInventoryItemSchema } from './inventory';

describe('inventoryItemSchema', () => {
  const validItem = {
    id: 'item-1',
    name: 'Cardboard Sheets',
    sku: 'CBR-001',
    supplier: 'PaperInc',
    currentQty: 100,
    wacAgora: 350,
    reorderThreshold: 10,
    unit: 'sheets',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-15'),
  };

  it('validates a complete valid item', () => {
    const result = inventoryItemSchema.safeParse(validItem);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validItem);
    }
  });

  it('applies defaults for nullable/optional fields', () => {
    const minimal = {
      id: 'item-2',
      name: 'Fabric',
      unit: 'meters',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const result = inventoryItemSchema.safeParse(minimal);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sku).toBeNull();
      expect(result.data.supplier).toBeNull();
      expect(result.data.currentQty).toBe(0);
      expect(result.data.wacAgora).toBe(0);
      expect(result.data.reorderThreshold).toBeNull();
    }
  });

  it('rejects empty name', () => {
    const result = inventoryItemSchema.safeParse({ ...validItem, name: '' });
    expect(result.success).toBe(false);
  });

  it('rejects empty unit', () => {
    const result = inventoryItemSchema.safeParse({ ...validItem, unit: '' });
    expect(result.success).toBe(false);
  });

  it('rejects negative currentQty', () => {
    const result = inventoryItemSchema.safeParse({ ...validItem, currentQty: -1 });
    expect(result.success).toBe(false);
  });

  it('rejects non-integer wacAgora', () => {
    const result = inventoryItemSchema.safeParse({ ...validItem, wacAgora: 12.5 });
    expect(result.success).toBe(false);
  });

  it('rejects missing id', () => {
    const { id: _, ...noId } = validItem;
    const result = inventoryItemSchema.safeParse(noId);
    expect(result.success).toBe(false);
  });

  it('accepts zero currentQty', () => {
    const result = inventoryItemSchema.safeParse({ ...validItem, currentQty: 0 });
    expect(result.success).toBe(true);
  });

  it('accepts null sku and supplier', () => {
    const result = inventoryItemSchema.safeParse({
      ...validItem,
      sku: null,
      supplier: null,
    });
    expect(result.success).toBe(true);
  });
});

describe('createInventoryItemSchema', () => {
  const validInput = {
    name: 'New Material',
    sku: null,
    supplier: null,
    unit: 'kg',
    initialQty: 50,
    initialCostPerUnit: 12.50,
    reorderThreshold: null,
  };

  it('validates a complete valid input', () => {
    const result = createInventoryItemSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('rejects empty name', () => {
    const result = createInventoryItemSchema.safeParse({ ...validInput, name: '' });
    expect(result.success).toBe(false);
  });

  it('rejects empty unit', () => {
    const result = createInventoryItemSchema.safeParse({ ...validInput, unit: '' });
    expect(result.success).toBe(false);
  });

  it('rejects negative initialQty', () => {
    const result = createInventoryItemSchema.safeParse({ ...validInput, initialQty: -5 });
    expect(result.success).toBe(false);
  });

  it('accepts null initialCostPerUnit', () => {
    const result = createInventoryItemSchema.safeParse({
      ...validInput,
      initialCostPerUnit: null,
    });
    expect(result.success).toBe(true);
  });

  it('accepts decimal initialCostPerUnit (ILS display value)', () => {
    const result = createInventoryItemSchema.safeParse({
      ...validInput,
      initialCostPerUnit: 12.50,
    });
    expect(result.success).toBe(true);
  });

  it('rejects negative initialCostPerUnit', () => {
    const result = createInventoryItemSchema.safeParse({
      ...validInput,
      initialCostPerUnit: -5,
    });
    expect(result.success).toBe(false);
  });

  it('accepts with optional fields populated', () => {
    const result = createInventoryItemSchema.safeParse({
      ...validInput,
      sku: 'MAT-001',
      supplier: 'SupplierCo',
      reorderThreshold: 10,
    });
    expect(result.success).toBe(true);
  });
});
