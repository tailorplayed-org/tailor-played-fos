import { z } from 'zod';

export const inventoryItemSchema = z.object({
  id: z.string(),
  name: z.string().min(1, { error: 'Name is required' }),
  sku: z.string().nullable().default(null),
  supplier: z.string().nullable().default(null),
  currentQty: z.number().min(0).default(0),
  wacAgora: z.number().int().default(0),
  reorderThreshold: z.number().nullable().default(null),
  unit: z.string().min(1, { error: 'Unit is required' }),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type InventoryItem = z.infer<typeof inventoryItemSchema>;

// Form input schema — subset for create/edit (no id, computed costs, timestamps)
// No .default() — form provides defaults via defaultValues to avoid Zod 4 input/output type divergence
// initialCostPerUnit is in ILS display value — convert to agora via toMinorUnits() on submit
export const createInventoryItemSchema = z.object({
  name: z.string().min(1, { error: 'Name is required' }),
  sku: z.string().nullable(),
  supplier: z.string().nullable(),
  unit: z.string().min(1, { error: 'Unit is required' }),
  initialQty: z.number().min(0),
  initialCostPerUnit: z.number().min(0).nullable(),
  reorderThreshold: z.number().min(0).nullable(),
});

export type CreateInventoryItemInput = z.infer<typeof createInventoryItemSchema>;

// --- Inventory Log (Story 6.2) ---

export const INVENTORY_LOG_ACTIONS = ['restock', 'consume', 'waste'] as const;

export const inventoryLogSchema = z.object({
  id: z.string(),
  itemId: z.string(),
  action: z.enum(INVENTORY_LOG_ACTIONS),
  qtyChange: z.number(), // positive for restock, negative for consume/waste
  costSnapshotAgora: z.number().int(), // total cost of this action in agora
  wacBeforeAgora: z.number().int(),
  wacAfterAgora: z.number().int(),
  workOrderRef: z.string().nullable().default(null), // only for consume/waste
  reason: z.string().nullable().default(null), // only for waste
  actorUid: z.string(),
  timestamp: z.date(),
});

export type InventoryLogEntry = z.infer<typeof inventoryLogSchema>;

// --- Restock Form Input (Story 6.2) ---
// No .default() — form provides defaults via defaultValues to avoid Zod 4 input/output type divergence
// totalCostIls is in ILS display value — convert to agora via toMinorUnits() on submit

export const restockInputSchema = z.object({
  itemId: z.string().min(1, { error: 'Material is required' }),
  quantity: z.number().positive({ error: 'Quantity must be greater than 0' }),
  totalCostIls: z.number().positive({ error: 'Total cost must be greater than 0' }),
});

export type RestockInput = z.infer<typeof restockInputSchema>;
