import { describe, it, expect } from 'vitest';
import {
  workOrderSchema,
  createWorkOrderSchema,
  WORK_ORDER_STATUSES,
  type WorkOrder,
  type CreateWorkOrderInput,
} from './workOrder';

describe('workOrderSchema', () => {
  const validWorkOrder = {
    id: 'wo-123',
    clientName: "David's Game",
    projectDescription: 'Custom board game',
    deadline: new Date('2026-06-01'),
    status: 'Design' as const,
    revenueTotalAgora: 50000,
    directCostAgora: 20000,
    inventoryCostAgora: 5000,
    overheadAllocationAgora: 3000,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('parses a valid work order', () => {
    const result = workOrderSchema.safeParse(validWorkOrder);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.clientName).toBe("David's Game");
      expect(result.data.status).toBe('Design');
    }
  });

  it('requires clientName to be non-empty', () => {
    const result = workOrderSchema.safeParse({ ...validWorkOrder, clientName: '' });
    expect(result.success).toBe(false);
  });

  it('fails when clientName is missing', () => {
    const { clientName: _unused, ...withoutName } = validWorkOrder;
    void _unused;
    const result = workOrderSchema.safeParse(withoutName);
    expect(result.success).toBe(false);
  });

  it('validates status enum values', () => {
    for (const status of WORK_ORDER_STATUSES) {
      const result = workOrderSchema.safeParse({ ...validWorkOrder, status });
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid status values', () => {
    const result = workOrderSchema.safeParse({ ...validWorkOrder, status: 'Invalid' });
    expect(result.success).toBe(false);
  });

  it('applies default values for optional fields', () => {
    const minimal = {
      id: 'wo-min',
      clientName: 'Test Client',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const result = workOrderSchema.safeParse(minimal);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.projectDescription).toBe('');
      expect(result.data.deadline).toBeNull();
      expect(result.data.status).toBe('Lead');
      expect(result.data.revenueTotalAgora).toBe(0);
      expect(result.data.directCostAgora).toBe(0);
      expect(result.data.inventoryCostAgora).toBe(0);
      expect(result.data.overheadAllocationAgora).toBe(0);
    }
  });

  it('enforces Agora fields as integers', () => {
    const withFloat = { ...validWorkOrder, revenueTotalAgora: 100.5 };
    const result = workOrderSchema.safeParse(withFloat);
    expect(result.success).toBe(false);
  });

  it('allows nullable deadline', () => {
    const result = workOrderSchema.safeParse({ ...validWorkOrder, deadline: null });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.deadline).toBeNull();
    }
  });

  it('accepts Date objects for deadline', () => {
    const deadline = new Date('2026-12-25');
    const result = workOrderSchema.safeParse({ ...validWorkOrder, deadline });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.deadline).toEqual(deadline);
    }
  });

  it('infers correct TypeScript type', () => {
    const result = workOrderSchema.safeParse(validWorkOrder);
    if (result.success) {
      const wo: WorkOrder = result.data;
      expect(wo.id).toBe('wo-123');
    }
  });
});

describe('createWorkOrderSchema', () => {
  it('parses valid form input', () => {
    const input = {
      clientName: 'Rina Wedding Game',
      projectDescription: 'Wedding board game',
      deadline: new Date('2026-08-15'),
      status: 'Production' as const,
    };
    const result = createWorkOrderSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.clientName).toBe('Rina Wedding Game');
      expect(result.data.status).toBe('Production');
    }
  });

  it('requires all form fields', () => {
    const input = { clientName: 'Minimal Client' };
    const result = createWorkOrderSchema.safeParse(input);
    // Without defaults, all fields are required
    expect(result.success).toBe(false);
  });

  it('parses complete form input', () => {
    const input = {
      clientName: 'Test Client',
      projectDescription: '',
      deadline: null,
      status: 'Lead' as const,
    };
    const result = createWorkOrderSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('requires clientName', () => {
    const result = createWorkOrderSchema.safeParse({
      projectDescription: '',
      deadline: null,
      status: 'Lead',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty clientName', () => {
    const result = createWorkOrderSchema.safeParse({
      clientName: '',
      projectDescription: '',
      deadline: null,
      status: 'Lead',
    });
    expect(result.success).toBe(false);
  });

  it('does not include id, cost fields, or timestamps', () => {
    const input: CreateWorkOrderInput = {
      clientName: 'Test',
      projectDescription: '',
      deadline: null,
      status: 'Lead',
    };
    // These fields should not exist on the type
    expect('id' in input).toBe(false);
    expect('revenueTotalAgora' in input).toBe(false);
    expect('createdAt' in input).toBe(false);
  });
});

describe('WORK_ORDER_STATUSES', () => {
  it('contains exactly 4 statuses', () => {
    expect(WORK_ORDER_STATUSES).toHaveLength(4);
  });

  it('contains Lead, Design, Production, Shipped', () => {
    expect(WORK_ORDER_STATUSES).toEqual(['Lead', 'Design', 'Production', 'Shipped']);
  });
});
