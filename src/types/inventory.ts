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
