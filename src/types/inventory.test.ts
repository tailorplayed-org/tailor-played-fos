import { describe, it, expect } from 'vitest';
import {
  inventoryItemSchema,
  createInventoryItemSchema,
  inventoryLogSchema,
  restockInputSchema,
  scoopInputSchema,
} from './inventory';

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

describe('inventoryLogSchema', () => {
  const validLog = {
    id: 'log-1',
    itemId: 'item-1',
    action: 'restock' as const,
    qtyChange: 50,
    costSnapshotAgora: 25000,
    wacBeforeAgora: 350,
    wacAfterAgora: 400,
    workOrderRef: null,
    reason: null,
    actorUid: 'user-123',
    timestamp: new Date('2026-02-14'),
  };

  it('validates a complete restock log entry', () => {
    const result = inventoryLogSchema.safeParse(validLog);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validLog);
    }
  });

  it('applies defaults for nullable fields', () => {
    const minimal = {
      id: 'log-2',
      itemId: 'item-1',
      action: 'restock',
      qtyChange: 10,
      costSnapshotAgora: 5000,
      wacBeforeAgora: 0,
      wacAfterAgora: 500,
      actorUid: 'user-1',
      timestamp: new Date(),
    };
    const result = inventoryLogSchema.safeParse(minimal);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.workOrderRef).toBeNull();
      expect(result.data.reason).toBeNull();
    }
  });

  it('accepts consume action with negative qtyChange', () => {
    const result = inventoryLogSchema.safeParse({
      ...validLog,
      action: 'consume',
      qtyChange: -10,
      workOrderRef: 'wo-123',
    });
    expect(result.success).toBe(true);
  });

  it('accepts waste action with reason', () => {
    const result = inventoryLogSchema.safeParse({
      ...validLog,
      action: 'waste',
      qtyChange: -5,
      reason: 'Expired material',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid action', () => {
    const result = inventoryLogSchema.safeParse({
      ...validLog,
      action: 'invalid',
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-integer costSnapshotAgora', () => {
    const result = inventoryLogSchema.safeParse({
      ...validLog,
      costSnapshotAgora: 100.5,
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-integer wacBeforeAgora', () => {
    const result = inventoryLogSchema.safeParse({
      ...validLog,
      wacBeforeAgora: 350.5,
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-integer wacAfterAgora', () => {
    const result = inventoryLogSchema.safeParse({
      ...validLog,
      wacAfterAgora: 400.5,
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing actorUid', () => {
    const { actorUid: _, ...noActor } = validLog;
    const result = inventoryLogSchema.safeParse(noActor);
    expect(result.success).toBe(false);
  });

  it('rejects missing itemId', () => {
    const { itemId: _, ...noItemId } = validLog;
    const result = inventoryLogSchema.safeParse(noItemId);
    expect(result.success).toBe(false);
  });
});

describe('restockInputSchema', () => {
  const validInput = {
    itemId: 'item-1',
    quantity: 50,
    totalCostIls: 125.00,
  };

  it('validates a complete restock input', () => {
    const result = restockInputSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('rejects empty itemId', () => {
    const result = restockInputSchema.safeParse({ ...validInput, itemId: '' });
    expect(result.success).toBe(false);
  });

  it('rejects zero quantity', () => {
    const result = restockInputSchema.safeParse({ ...validInput, quantity: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects negative quantity', () => {
    const result = restockInputSchema.safeParse({ ...validInput, quantity: -5 });
    expect(result.success).toBe(false);
  });

  it('rejects zero totalCostIls', () => {
    const result = restockInputSchema.safeParse({ ...validInput, totalCostIls: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects negative totalCostIls', () => {
    const result = restockInputSchema.safeParse({ ...validInput, totalCostIls: -10 });
    expect(result.success).toBe(false);
  });

  it('accepts decimal totalCostIls (ILS display value)', () => {
    const result = restockInputSchema.safeParse({
      ...validInput,
      totalCostIls: 82.50,
    });
    expect(result.success).toBe(true);
  });

  it('accepts small positive quantity', () => {
    const result = restockInputSchema.safeParse({
      ...validInput,
      quantity: 0.5,
    });
    expect(result.success).toBe(true);
  });
});

describe('scoopInputSchema', () => {
  const validInput = {
    itemId: 'item-1',
    quantity: 10,
    workOrderId: 'wo-1',
  };

  it('validates a complete scoop input', () => {
    const result = scoopInputSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validInput);
    }
  });

  it('rejects empty itemId', () => {
    const result = scoopInputSchema.safeParse({ ...validInput, itemId: '' });
    expect(result.success).toBe(false);
  });

  it('rejects empty workOrderId', () => {
    const result = scoopInputSchema.safeParse({ ...validInput, workOrderId: '' });
    expect(result.success).toBe(false);
  });

  it('rejects zero quantity', () => {
    const result = scoopInputSchema.safeParse({ ...validInput, quantity: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects negative quantity', () => {
    const result = scoopInputSchema.safeParse({ ...validInput, quantity: -5 });
    expect(result.success).toBe(false);
  });

  it('accepts decimal quantity', () => {
    const result = scoopInputSchema.safeParse({ ...validInput, quantity: 2.5 });
    expect(result.success).toBe(true);
  });

  it('rejects missing itemId', () => {
    const { itemId: _, ...noItemId } = validInput;
    const result = scoopInputSchema.safeParse(noItemId);
    expect(result.success).toBe(false);
  });

  it('rejects missing workOrderId', () => {
    const { workOrderId: _, ...noWoId } = validInput;
    const result = scoopInputSchema.safeParse(noWoId);
    expect(result.success).toBe(false);
  });

  it('rejects missing quantity', () => {
    const { quantity: _, ...noQty } = validInput;
    const result = scoopInputSchema.safeParse(noQty);
    expect(result.success).toBe(false);
  });
});
