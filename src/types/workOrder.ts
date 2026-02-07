import { z } from 'zod';

export const WORK_ORDER_STATUSES = ['Lead', 'Design', 'Production', 'Shipped'] as const;
export type WorkOrderStatus = (typeof WORK_ORDER_STATUSES)[number];

export const workOrderSchema = z.object({
  id: z.string(),
  clientName: z.string().min(1, 'Client name is required'),
  projectDescription: z.string().default(''),
  deadline: z.date().nullable().default(null),
  status: z.enum(WORK_ORDER_STATUSES).default('Lead'),
  revenueTotalAgora: z.number().int().default(0),
  directCostAgora: z.number().int().default(0),
  inventoryCostAgora: z.number().int().default(0),
  overheadAllocationAgora: z.number().int().default(0),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type WorkOrder = z.infer<typeof workOrderSchema>;

// Form input schema — subset for create/edit (no id, computed costs, timestamps)
// No .default() — form provides defaults via defaultValues to avoid Zod 4 input/output type divergence
export const createWorkOrderSchema = z.object({
  clientName: z.string().min(1, 'Client name is required'),
  projectDescription: z.string(),
  deadline: z.date().nullable(),
  status: z.enum(WORK_ORDER_STATUSES),
});

export type CreateWorkOrderInput = z.infer<typeof createWorkOrderSchema>;
