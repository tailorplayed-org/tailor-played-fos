import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock firebase-admin/app ──
vi.mock('firebase-admin/app', () => ({
  initializeApp: vi.fn(),
}));

// ── Mock firebase-admin/firestore ──
const mockUpdate = vi.fn().mockResolvedValue(undefined);
const mockLogsGet = vi.fn();
const mockOrderBy = vi.fn().mockReturnValue({ get: mockLogsGet });
const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy });

const mockCollection = vi.fn().mockReturnValue({ where: mockWhere });
const mockGetFirestore = vi.fn().mockReturnValue({ collection: mockCollection });

vi.mock('firebase-admin/firestore', () => ({
  getFirestore: () => mockGetFirestore(),
  FieldValue: {
    serverTimestamp: vi.fn().mockReturnValue('SERVER_TIMESTAMP'),
  },
}));

// ── Mock firebase-functions/logger ──
const mockLoggerInfo = vi.fn();
const mockLoggerWarn = vi.fn();

vi.mock('firebase-functions/logger', () => ({
  info: (...args: unknown[]) => mockLoggerInfo(...args),
  warn: (...args: unknown[]) => mockLoggerWarn(...args),
  error: vi.fn(),
  debug: vi.fn(),
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
  onDocumentWritten: vi.fn(
    (_path: string, handler: (event: unknown) => Promise<void>) => {
      capturedHandler = handler;
      return handler;
    },
  ),
  // Also mock onDocumentUpdatedWithAuthContext to prevent import errors from index.ts
  onDocumentUpdatedWithAuthContext: vi.fn(
    (_path: string, handler: (event: unknown) => Promise<void>) => handler,
  ),
}));

// ── Helpers ──

function createLogEntry(overrides: Record<string, unknown> = {}) {
  return {
    action: 'restock',
    qtyChange: 50,
    costSnapshotAgora: 25000,
    itemId: 'item-001',
    wacBeforeAgora: 0,
    wacAfterAgora: 500,
    ...overrides,
  };
}

function createWriteEvent(
  beforeData: Record<string, unknown> | null,
  afterData: Record<string, unknown> | null,
  docId = 'item-001',
) {
  return {
    data: {
      before: beforeData ? { data: () => beforeData } : undefined,
      after: afterData
        ? {
            data: () => afterData,
            ref: { update: mockUpdate },
          }
        : undefined,
    },
    params: { docId },
  };
}

// ── Tests ──

describe('verifyWAC Cloud Function (Story 6.2)', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    // Import to register the handler
    await import('../src/triggers/verifyWAC.js');
  });

  it('skips verification when document is deleted (after is null)', async () => {
    const event = {
      data: { before: { data: () => ({ wacAgora: 500 }) }, after: undefined },
      params: { docId: 'item-001' },
    };
    await capturedHandler!(event);

    expect(mockCollection).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('skips verification when wacAgora did not change (prevents infinite loop)', async () => {
    const event = createWriteEvent(
      { wacAgora: 500, currentQty: 100 },
      { wacAgora: 500, currentQty: 150 },
    );
    await capturedHandler!(event);

    expect(mockCollection).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('skips verification when no log entries exist (initial create)', async () => {
    mockLogsGet.mockResolvedValue({ empty: true, docs: [] });

    const event = createWriteEvent(null, { wacAgora: 500, currentQty: 50 });
    await capturedHandler!(event);

    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('does not overwrite when client WAC matches server WAC (within 1 agora)', async () => {
    // Single restock: 50 units, 25000 agora → WAC = 500
    mockLogsGet.mockResolvedValue({
      empty: false,
      docs: [{ data: () => createLogEntry() }],
    });

    const event = createWriteEvent(
      { wacAgora: 0 },
      { wacAgora: 500, currentQty: 50 },
    );
    await capturedHandler!(event);

    expect(mockUpdate).not.toHaveBeenCalled();
    expect(mockLoggerInfo).toHaveBeenCalledWith(
      expect.stringContaining('WAC verified'),
    );
  });

  it('overwrites client WAC when divergence exceeds 1 agora', async () => {
    // Server WAC should be 500, client says 600
    mockLogsGet.mockResolvedValue({
      empty: false,
      docs: [{ data: () => createLogEntry() }],
    });

    const event = createWriteEvent(
      { wacAgora: 0 },
      { wacAgora: 600, currentQty: 50 },
    );
    await capturedHandler!(event);

    expect(mockUpdate).toHaveBeenCalledWith({ wacAgora: 500 });
    expect(mockLoggerWarn).toHaveBeenCalledWith(
      expect.stringContaining('WAC divergence'),
    );
  });

  it('replays multiple restock entries correctly', async () => {
    // Restock 1: 100 units @ 35000 agora → WAC = 350
    // Restock 2: 50 units @ 20000 agora → WAC = (100*350 + 20000) / 150 = 367
    mockLogsGet.mockResolvedValue({
      empty: false,
      docs: [
        { data: () => createLogEntry({ qtyChange: 100, costSnapshotAgora: 35000 }) },
        { data: () => createLogEntry({ qtyChange: 50, costSnapshotAgora: 20000 }) },
      ],
    });

    const event = createWriteEvent(
      { wacAgora: 350 },
      { wacAgora: 367, currentQty: 150 },
    );
    await capturedHandler!(event);

    // Server replay: (100*0 + 35000)/100 = 350, then (100*350 + 20000)/150 = 366.67 → 367
    expect(mockUpdate).not.toHaveBeenCalled();
    expect(mockLoggerInfo).toHaveBeenCalledWith(
      expect.stringContaining('WAC verified'),
    );
  });

  it('handles consume entries (WAC stays, qty decreases)', async () => {
    // Restock: 100 units @ 50000 agora → WAC = 500
    // Consume: -20 units → qty = 80, WAC stays 500
    mockLogsGet.mockResolvedValue({
      empty: false,
      docs: [
        { data: () => createLogEntry({ qtyChange: 100, costSnapshotAgora: 50000 }) },
        { data: () => createLogEntry({ action: 'consume', qtyChange: -20, costSnapshotAgora: 0 }) },
      ],
    });

    const event = createWriteEvent(
      { wacAgora: 0 },
      { wacAgora: 500, currentQty: 80 },
    );
    await capturedHandler!(event);

    // Server replay: WAC = 500 (consume doesn't change WAC)
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('queries inventory_log with correct item ID and ordering', async () => {
    mockLogsGet.mockResolvedValue({ empty: true, docs: [] });

    const event = createWriteEvent(null, { wacAgora: 500 }, 'item-xyz');
    await capturedHandler!(event);

    expect(mockCollection).toHaveBeenCalledWith('inventory_log');
    expect(mockWhere).toHaveBeenCalledWith('itemId', '==', 'item-xyz');
    expect(mockOrderBy).toHaveBeenCalledWith('timestamp', 'asc');
  });

  it('proceeds with verification on first write (before is null)', async () => {
    // New document created — wacAgora changed from nothing to 500
    mockLogsGet.mockResolvedValue({
      empty: false,
      docs: [{ data: () => createLogEntry() }],
    });

    const event = createWriteEvent(null, { wacAgora: 500 });
    await capturedHandler!(event);

    // Should verify (before is null, so guard passes)
    expect(mockCollection).toHaveBeenCalled();
  });
});
