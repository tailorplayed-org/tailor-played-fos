import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock firebase-admin/app ──
vi.mock('firebase-admin/app', () => ({
  initializeApp: vi.fn(),
}));

// ── Mock firebase-admin/firestore ──
const mockAuditLogAdd = vi.fn().mockResolvedValue({ id: 'audit-001' });
const mockOverheadAdd = vi.fn().mockResolvedValue({ id: 'overhead-001' });
const mockWoUpdate = vi.fn().mockResolvedValue(undefined);
const mockWoGet = vi.fn().mockResolvedValue({ exists: true });
const mockWoDocRef = { get: mockWoGet, update: mockWoUpdate };
const mockWoDoc = vi.fn().mockReturnValue(mockWoDocRef);

const mockCollection = vi.fn().mockImplementation((collectionName: string) => {
  if (collectionName === 'audit_log') {
    return { add: mockAuditLogAdd };
  }
  if (collectionName === 'work_orders') {
    return { doc: mockWoDoc };
  }
  if (collectionName === 'overhead') {
    return { add: mockOverheadAdd };
  }
  return {};
});

const mockGetFirestore = vi.fn().mockReturnValue({ collection: mockCollection });

vi.mock('firebase-admin/firestore', () => ({
  getFirestore: () => mockGetFirestore(),
  FieldValue: {
    serverTimestamp: vi.fn().mockReturnValue('SERVER_TIMESTAMP'),
    increment: vi.fn((n: number) => `INCREMENT(${n})`),
  },
}));

// ── Mock firebase-functions/logger ──
const mockLoggerInfo = vi.fn();
const mockLoggerError = vi.fn();
const mockLoggerWarn = vi.fn();
const mockLoggerDebug = vi.fn();

vi.mock('firebase-functions/logger', () => ({
  info: (...args: unknown[]) => mockLoggerInfo(...args),
  error: (...args: unknown[]) => mockLoggerError(...args),
  warn: (...args: unknown[]) => mockLoggerWarn(...args),
  debug: (...args: unknown[]) => mockLoggerDebug(...args),
}));

// ── Mock firebase-functions/params ──
vi.mock('firebase-functions/params', () => ({
  defineSecret: (name: string) => ({
    value: () => `mock-${name}`,
    name,
  }),
  defineString: (name: string, opts?: { default?: string }) => ({
    value: () => opts?.default ?? `mock-${name}`,
    name,
  }),
}));

// ── Mock firebase-functions/firestore ──
let capturedHandler: ((event: unknown) => Promise<void>) | null = null;

vi.mock('firebase-functions/firestore', () => ({
  onDocumentUpdatedWithAuthContext: vi.fn(
    (_path: string, handler: (event: unknown) => Promise<void>) => {
      capturedHandler = handler;
      return handler;
    },
  ),
}));

// ── Helpers ──

function createUpdateEvent(
  beforeData: Record<string, unknown>,
  afterData: Record<string, unknown>,
  docId = 'txn-001',
  authId: string | undefined = 'user-uid-123',
) {
  return {
    data: {
      before: { data: () => beforeData },
      after: { data: () => afterData },
    },
    params: { docId },
    authId,
  };
}

function baseTxnData(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    vendorName: 'Test Vendor',
    amountAgora: 58000,
    currency: 'ILS',
    category: 'DirectCost',
    workOrderId: 'wo-david-game',
    status: 'pending_review',
    ...overrides,
  };
}

// ── Tests ──

describe('onTransactionStatusChanged — approval side effects (Story 5.4)', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockWoGet.mockResolvedValue({ exists: true });
    // Import to register the handler
    await import('../src/triggers/onTransactionApproved.js');
  });

  it('increments directCostAgora when DirectCost approved with workOrderId (AC #2)', async () => {
    const before = baseTxnData({ status: 'pending_review' });
    const after = baseTxnData({ status: 'approved' });

    const event = createUpdateEvent(before, after);
    await capturedHandler!(event);

    expect(mockWoDoc).toHaveBeenCalledWith('wo-david-game');
    expect(mockWoUpdate).toHaveBeenCalledWith({
      directCostAgora: 'INCREMENT(58000)',
      updatedAt: 'SERVER_TIMESTAMP',
    });
  });

  it('increments revenueTotalAgora when Revenue approved with workOrderId (AC #3)', async () => {
    const before = baseTxnData({ status: 'pending_review', category: 'Revenue', amountAgora: 120000 });
    const after = baseTxnData({ status: 'approved', category: 'Revenue', amountAgora: 120000 });

    const event = createUpdateEvent(before, after);
    await capturedHandler!(event);

    expect(mockWoUpdate).toHaveBeenCalledWith({
      revenueTotalAgora: 'INCREMENT(120000)',
      updatedAt: 'SERVER_TIMESTAMP',
    });
  });

  it('increments inventoryCostAgora when InventoryRestock approved with workOrderId (AC #4)', async () => {
    const before = baseTxnData({ status: 'pending_review', category: 'InventoryRestock', amountAgora: 25000 });
    const after = baseTxnData({ status: 'approved', category: 'InventoryRestock', amountAgora: 25000 });

    const event = createUpdateEvent(before, after);
    await capturedHandler!(event);

    expect(mockWoUpdate).toHaveBeenCalledWith({
      inventoryCostAgora: 'INCREMENT(25000)',
      updatedAt: 'SERVER_TIMESTAMP',
    });
  });

  it('does NOT update Work Order for Overhead category (AC #5)', async () => {
    const before = baseTxnData({ status: 'pending_review', category: 'Overhead', workOrderId: null });
    const after = baseTxnData({ status: 'approved', category: 'Overhead', workOrderId: null });

    const event = createUpdateEvent(before, after);
    await capturedHandler!(event);

    // No WO update — Overhead tracked via transactions collection
    expect(mockWoUpdate).not.toHaveBeenCalled();
  });

  it('does NOT update Work Order for Overhead even with workOrderId (AC #5)', async () => {
    const before = baseTxnData({ status: 'pending_review', category: 'Overhead', workOrderId: 'wo-overhead-linked' });
    const after = baseTxnData({ status: 'approved', category: 'Overhead', workOrderId: 'wo-overhead-linked' });

    const event = createUpdateEvent(before, after);
    await capturedHandler!(event);

    // WO_FIELD_MAP excludes Overhead — no Firestore GET or update
    expect(mockWoGet).not.toHaveBeenCalled();
    expect(mockWoUpdate).not.toHaveBeenCalled();
  });

  it('does NOT update Work Order for Personal category (AC #6)', async () => {
    const before = baseTxnData({ status: 'pending_review', category: 'Personal', workOrderId: null });
    const after = baseTxnData({ status: 'approved', category: 'Personal', workOrderId: null });

    const event = createUpdateEvent(before, after);
    await capturedHandler!(event);

    expect(mockWoUpdate).not.toHaveBeenCalled();
  });

  it('does NOT update Work Order for Personal even with workOrderId (AC #6)', async () => {
    const before = baseTxnData({ status: 'pending_review', category: 'Personal', workOrderId: 'wo-personal-linked' });
    const after = baseTxnData({ status: 'approved', category: 'Personal', workOrderId: 'wo-personal-linked' });

    const event = createUpdateEvent(before, after);
    await capturedHandler!(event);

    // WO_FIELD_MAP excludes Personal — no Firestore GET or update
    expect(mockWoGet).not.toHaveBeenCalled();
    expect(mockWoUpdate).not.toHaveBeenCalled();
  });

  it('does NOT update Work Order when workOrderId is null (AC #11)', async () => {
    const before = baseTxnData({ status: 'pending_review', workOrderId: null });
    const after = baseTxnData({ status: 'approved', workOrderId: null });

    const event = createUpdateEvent(before, after);
    await capturedHandler!(event);

    expect(mockWoUpdate).not.toHaveBeenCalled();
  });

  it('does NOT update Work Order when workOrderId is empty string', async () => {
    const before = baseTxnData({ status: 'pending_review', workOrderId: '' });
    const after = baseTxnData({ status: 'approved', workOrderId: '' });

    const event = createUpdateEvent(before, after);
    await capturedHandler!(event);

    expect(mockWoUpdate).not.toHaveBeenCalled();
  });

  it('creates audit trail on approval (AC #7)', async () => {
    const before = baseTxnData({ status: 'pending_review' });
    const after = baseTxnData({ status: 'approved' });

    const event = createUpdateEvent(before, after, 'txn-audit-test', 'user-abc');
    await capturedHandler!(event);

    expect(mockAuditLogAdd).toHaveBeenCalledWith({
      transactionId: 'txn-audit-test',
      action: 'approved',
      actorUid: 'user-abc',
      timestamp: 'SERVER_TIMESTAMP',
      beforeSnapshot: before,
      afterSnapshot: after,
    });
  });
});

describe('onTransactionStatusChanged — rejection handling (Story 5.4)', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockWoGet.mockResolvedValue({ exists: true });
    await import('../src/triggers/onTransactionApproved.js');
  });

  it('creates audit trail on rejection — no Work Order update (AC #8)', async () => {
    const before = baseTxnData({ status: 'pending_review' });
    const after = baseTxnData({ status: 'rejected' });

    const event = createUpdateEvent(before, after, 'txn-reject-001', 'user-xyz');
    await capturedHandler!(event);

    // Audit trail created
    expect(mockAuditLogAdd).toHaveBeenCalledWith({
      transactionId: 'txn-reject-001',
      action: 'rejected',
      actorUid: 'user-xyz',
      timestamp: 'SERVER_TIMESTAMP',
      beforeSnapshot: before,
      afterSnapshot: after,
    });

    // NO Work Order update for rejections
    expect(mockWoUpdate).not.toHaveBeenCalled();
  });

  it('rejection with pending_review guard — only from pending_review (AC #8)', async () => {
    const before = baseTxnData({ status: 'pending_review' });
    const after = baseTxnData({ status: 'rejected' });

    const event = createUpdateEvent(before, after);
    await capturedHandler!(event);

    expect(mockAuditLogAdd).toHaveBeenCalledTimes(1);
  });
});

describe('onTransactionStatusChanged — idempotency guards (Story 5.4)', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockWoGet.mockResolvedValue({ exists: true });
    await import('../src/triggers/onTransactionApproved.js');
  });

  it('returns early when event.data is null', async () => {
    const event = { data: null, params: { docId: 'txn-null' }, authId: 'user-123' };
    await capturedHandler!(event);

    expect(mockWoUpdate).not.toHaveBeenCalled();
    expect(mockAuditLogAdd).not.toHaveBeenCalled();
    expect(mockLoggerError).toHaveBeenCalledWith('No data in event');
  });

  it('no-op when status does not change — before === after (AC #12)', async () => {
    const before = baseTxnData({ status: 'approved' });
    const after = baseTxnData({ status: 'approved' });

    const event = createUpdateEvent(before, after);
    await capturedHandler!(event);

    expect(mockWoUpdate).not.toHaveBeenCalled();
    expect(mockAuditLogAdd).not.toHaveBeenCalled();
  });

  it('no-op when status is neither approved nor rejected (e.g., in_progress)', async () => {
    const before = baseTxnData({ status: 'pending_review' });
    const after = baseTxnData({ status: 'in_progress' });

    const event = createUpdateEvent(before, after);
    await capturedHandler!(event);

    expect(mockWoUpdate).not.toHaveBeenCalled();
    expect(mockAuditLogAdd).not.toHaveBeenCalled();
  });

  it('no-op when transition is not from pending_review', async () => {
    const before = baseTxnData({ status: 'approved' });
    const after = baseTxnData({ status: 'rejected' });

    const event = createUpdateEvent(before, after);
    await capturedHandler!(event);

    expect(mockWoUpdate).not.toHaveBeenCalled();
    expect(mockAuditLogAdd).not.toHaveBeenCalled();
    expect(mockLoggerInfo).toHaveBeenCalledWith(
      'Skipping — transition not from pending_review',
      expect.objectContaining({
        beforeStatus: 'approved',
        afterStatus: 'rejected',
      }),
    );
  });
});

describe('onTransactionStatusChanged — error handling (Story 5.4)', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockWoGet.mockResolvedValue({ exists: true });
    await import('../src/triggers/onTransactionApproved.js');
  });

  it('logs warning when Work Order not found — does not crash (AC #12)', async () => {
    mockWoGet.mockResolvedValueOnce({ exists: false });

    const before = baseTxnData({ status: 'pending_review' });
    const after = baseTxnData({ status: 'approved' });

    const event = createUpdateEvent(before, after);
    await capturedHandler!(event);

    // Should NOT throw
    expect(mockLoggerWarn).toHaveBeenCalledWith(
      'Work Order not found for transaction side effect',
      { workOrderId: 'wo-david-game' },
    );

    // Audit trail should still be created
    expect(mockAuditLogAdd).toHaveBeenCalled();
  });

  it('audit trail error does not block main function', async () => {
    mockAuditLogAdd.mockRejectedValueOnce(new Error('Firestore write failed'));

    const before = baseTxnData({ status: 'pending_review' });
    const after = baseTxnData({ status: 'approved' });

    const event = createUpdateEvent(before, after);

    // Should NOT throw despite audit trail failure
    await expect(capturedHandler!(event)).resolves.toBeUndefined();

    // WO update should still happen
    expect(mockWoUpdate).toHaveBeenCalled();

    // Error should be logged
    expect(mockLoggerError).toHaveBeenCalledWith(
      'Failed to create audit log',
      expect.objectContaining({ transactionId: 'txn-001' }),
    );
  });

  it('WO update error does not block audit trail creation', async () => {
    mockWoUpdate.mockRejectedValueOnce(new Error('Firestore update failed'));

    const before = baseTxnData({ status: 'pending_review' });
    const after = baseTxnData({ status: 'approved' });

    const event = createUpdateEvent(before, after);

    // Should NOT throw
    await expect(capturedHandler!(event)).resolves.toBeUndefined();

    // Error logged
    expect(mockLoggerError).toHaveBeenCalledWith(
      'Failed to update Work Order totals',
      expect.objectContaining({
        transactionId: 'txn-001',
        workOrderId: 'wo-david-game',
      }),
    );

    // Audit trail should still be created
    expect(mockAuditLogAdd).toHaveBeenCalled();
  });
});

describe('onTransactionStatusChanged — batch approval safety (Story 5.4)', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockWoGet.mockResolvedValue({ exists: true });
    await import('../src/triggers/onTransactionApproved.js');
  });

  it('uses FieldValue.increment for atomic counter updates (AC #11)', async () => {
    const { FieldValue } = await import('firebase-admin/firestore');

    const before = baseTxnData({ status: 'pending_review', amountAgora: 58000 });
    const after = baseTxnData({ status: 'approved', amountAgora: 58000 });

    const event = createUpdateEvent(before, after);
    await capturedHandler!(event);

    // Verify FieldValue.increment was called with correct amount
    expect(FieldValue.increment).toHaveBeenCalledWith(58000);
  });
});

describe('onTransactionStatusChanged — actorUid handling (Story 5.4)', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockWoGet.mockResolvedValue({ exists: true });
    await import('../src/triggers/onTransactionApproved.js');
  });

  it('extracts actorUid from auth context', async () => {
    const before = baseTxnData({ status: 'pending_review' });
    const after = baseTxnData({ status: 'approved' });

    const event = createUpdateEvent(before, after, 'txn-actor', 'user-uid-123');
    await capturedHandler!(event);

    expect(mockAuditLogAdd).toHaveBeenCalledWith(
      expect.objectContaining({ actorUid: 'user-uid-123' }),
    );
  });

  it('falls back to "system" when authId is undefined', async () => {
    const before = baseTxnData({ status: 'pending_review' });
    const after = baseTxnData({ status: 'approved' });

    // Manually construct event without authId to test fallback
    const event = {
      data: {
        before: { data: () => before },
        after: { data: () => after },
      },
      params: { docId: 'txn-no-auth' },
      // authId intentionally omitted → undefined
    };
    await capturedHandler!(event);

    expect(mockAuditLogAdd).toHaveBeenCalledWith(
      expect.objectContaining({ actorUid: 'system' }),
    );
  });
});

describe('onTransactionStatusChanged — overhead creation (Story 7.1)', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockWoGet.mockResolvedValue({ exists: true });
    await import('../src/triggers/onTransactionApproved.js');
  });

  it('creates overhead document when Overhead-category transaction is approved (AC #7)', async () => {
    const before = baseTxnData({ status: 'pending_review', category: 'Overhead', workOrderId: null, vendorName: 'Adobe Inc' });
    const after = baseTxnData({ status: 'approved', category: 'Overhead', workOrderId: null, vendorName: 'Adobe Inc' });

    const event = createUpdateEvent(before, after, 'txn-overhead-001');
    await capturedHandler!(event);

    expect(mockOverheadAdd).toHaveBeenCalledWith({
      category: 'general',
      amountAgora: 58000,
      currency: 'ILS',
      date: expect.anything(),
      description: 'Adobe Inc',
      recurrence: 'one_time',
      source: 'ai',
      transactionId: 'txn-overhead-001',
      isActive: true,
      createdAt: 'SERVER_TIMESTAMP',
      updatedAt: 'SERVER_TIMESTAMP',
    });
  });

  it('sets description to null when vendorName is absent', async () => {
    const before = baseTxnData({ status: 'pending_review', category: 'Overhead', workOrderId: null, vendorName: undefined });
    const after = baseTxnData({ status: 'approved', category: 'Overhead', workOrderId: null, vendorName: undefined });

    const event = createUpdateEvent(before, after, 'txn-overhead-002');
    await capturedHandler!(event);

    expect(mockOverheadAdd).toHaveBeenCalledWith(
      expect.objectContaining({ description: null }),
    );
  });

  it('does NOT create overhead for non-Overhead categories', async () => {
    const before = baseTxnData({ status: 'pending_review', category: 'DirectCost' });
    const after = baseTxnData({ status: 'approved', category: 'DirectCost' });

    const event = createUpdateEvent(before, after);
    await capturedHandler!(event);

    expect(mockOverheadAdd).not.toHaveBeenCalled();
  });

  it('overhead creation error does not block approval flow', async () => {
    mockOverheadAdd.mockRejectedValueOnce(new Error('Overhead write failed'));

    const before = baseTxnData({ status: 'pending_review', category: 'Overhead', workOrderId: null });
    const after = baseTxnData({ status: 'approved', category: 'Overhead', workOrderId: null });

    const event = createUpdateEvent(before, after, 'txn-overhead-err');

    // Should NOT throw
    await expect(capturedHandler!(event)).resolves.toBeUndefined();

    // Error logged
    expect(mockLoggerError).toHaveBeenCalledWith(
      'Failed to create overhead document',
      expect.objectContaining({ transactionId: 'txn-overhead-err' }),
    );

    // Audit trail still created
    expect(mockAuditLogAdd).toHaveBeenCalled();
  });

  it('does NOT create overhead on rejection', async () => {
    const before = baseTxnData({ status: 'pending_review', category: 'Overhead', workOrderId: null });
    const after = baseTxnData({ status: 'rejected', category: 'Overhead', workOrderId: null });

    const event = createUpdateEvent(before, after);
    await capturedHandler!(event);

    expect(mockOverheadAdd).not.toHaveBeenCalled();
  });
});

describe('auditLogSchema validation (Story 5.4)', () => {
  it('validates a correct audit log document', async () => {
    const { auditLogSchema } = await import('../src/shared/schemas.js');

    const validDoc = {
      transactionId: 'txn-001',
      action: 'approved' as const,
      actorUid: 'user-123',
      timestamp: 'SERVER_TIMESTAMP',
      beforeSnapshot: { status: 'pending_review', category: 'DirectCost' },
      afterSnapshot: { status: 'approved', category: 'DirectCost' },
    };

    const result = auditLogSchema.safeParse(validDoc);
    expect(result.success).toBe(true);
  });

  it('validates rejected action', async () => {
    const { auditLogSchema } = await import('../src/shared/schemas.js');

    const validDoc = {
      transactionId: 'txn-002',
      action: 'rejected' as const,
      actorUid: 'system',
      timestamp: 'SERVER_TIMESTAMP',
      beforeSnapshot: { status: 'pending_review' },
      afterSnapshot: { status: 'rejected' },
    };

    const result = auditLogSchema.safeParse(validDoc);
    expect(result.success).toBe(true);
  });

  it('rejects invalid action value', async () => {
    const { auditLogSchema } = await import('../src/shared/schemas.js');

    const invalid = {
      transactionId: 'txn-003',
      action: 'deleted',
      actorUid: 'user-123',
      timestamp: 'SERVER_TIMESTAMP',
      beforeSnapshot: {},
      afterSnapshot: {},
    };

    const result = auditLogSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects missing transactionId', async () => {
    const { auditLogSchema } = await import('../src/shared/schemas.js');

    const invalid = {
      action: 'approved',
      actorUid: 'user-123',
      timestamp: 'SERVER_TIMESTAMP',
      beforeSnapshot: {},
      afterSnapshot: {},
    };

    const result = auditLogSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});
