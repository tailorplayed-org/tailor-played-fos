import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ── Mock firebase-admin/app ──
vi.mock('firebase-admin/app', () => ({
  initializeApp: vi.fn(),
}));

// ── Mock firebase-admin/firestore ──

// email_log docs for retry candidates
let mockEmailLogDocs: Array<{
  id: string;
  ref: { update: ReturnType<typeof vi.fn> };
  data: () => Record<string, unknown>;
}> = [];

// Transaction existence check (idempotency)
const mockTxnQueryGet = vi.fn().mockResolvedValue({ empty: true, docs: [] });
const mockTxnQueryLimit = vi.fn().mockReturnValue({ get: mockTxnQueryGet });
const mockTxnQueryWhere = vi.fn().mockReturnValue({ limit: mockTxnQueryLimit });

// Email log status query
const mockEmailLogGet = vi.fn().mockImplementation(() =>
  Promise.resolve({ docs: mockEmailLogDocs }),
);
const mockEmailLogWhere = vi.fn().mockReturnValue({ get: mockEmailLogGet });

const mockCollection = vi.fn().mockImplementation((collectionName: string) => {
  if (collectionName === 'email_log') {
    return { where: mockEmailLogWhere };
  }
  if (collectionName === 'transactions') {
    return {
      where: mockTxnQueryWhere,
      add: vi.fn().mockResolvedValue({ id: 'txn-retry-001' }),
    };
  }
  return {};
});

const mockGetFirestore = vi.fn().mockReturnValue({ collection: mockCollection });

vi.mock('firebase-admin/firestore', () => ({
  getFirestore: () => mockGetFirestore(),
  FieldValue: {
    serverTimestamp: vi.fn().mockReturnValue('SERVER_TIMESTAMP'),
  },
}));

// ── Mock firebase-admin/storage ──
const mockSave = vi.fn().mockResolvedValue(undefined);
const mockStorageFile = vi.fn().mockReturnValue({ save: mockSave });
const mockBucket = vi.fn().mockReturnValue({ file: mockStorageFile });
const mockGetStorage = vi.fn().mockReturnValue({ bucket: mockBucket });

vi.mock('firebase-admin/storage', () => ({
  getStorage: () => mockGetStorage(),
}));

// ── Mock firebase-functions/logger ──
vi.mock('firebase-functions/logger', () => ({
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
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

// ── Mock firebase-functions/scheduler ──
vi.mock('firebase-functions/scheduler', () => ({
  onSchedule: vi.fn(
    (_opts: unknown, handler: () => Promise<void>) => handler,
  ),
}));

// ── Mock firebase-functions/firestore (needed by processDocument import chain) ──
vi.mock('firebase-functions/firestore', () => ({
  onDocumentCreated: vi.fn(
    (_opts: unknown, handler: (event: unknown) => Promise<void>) => handler,
  ),
}));

// ── Mock @google/genai (needed by geminiClient import chain) ──
vi.mock('@google/genai', () => {
  class MockGoogleGenAI {
    models = { generateContent: vi.fn() };
  }
  return { GoogleGenAI: MockGoogleGenAI };
});

// ── Mock zod-to-json-schema ──
vi.mock('zod-to-json-schema', () => ({
  zodToJsonSchema: vi.fn().mockReturnValue({ type: 'object', properties: {} }),
}));

// ── Mock googleapis (needed by gmailClient import) ──
const mockMessagesGet = vi.fn();
const mockAttachmentsGet = vi.fn();
vi.mock('googleapis', () => {
  class MockOAuth2 {
    setCredentials = vi.fn();
  }
  return {
    google: {
      auth: {
        OAuth2: MockOAuth2,
      },
      gmail: vi.fn().mockReturnValue({
        users: {
          messages: {
            get: mockMessagesGet,
            list: vi.fn(),
            modify: vi.fn(),
            attachments: {
              get: mockAttachmentsGet,
            },
          },
        },
      }),
    },
    gmail_v1: {},
  };
});

// ── Mock runAIProcessing directly (isolate retry logic from AI processing) ──
const mockRunAIProcessing = vi.fn();
vi.mock('../src/ai/processDocument.js', () => ({
  runAIProcessing: (...args: unknown[]) => mockRunAIProcessing(...args),
}));

// ── Helpers ──

const TWO_HOURS_AGO = () => new Date(Date.now() - 2 * 60 * 60 * 1000);

function createEmailLogDoc(
  id: string,
  overrides: Partial<{
    status: string;
    retryCount: number;
    updatedAt: { toDate: () => Date } | null;
    receivedAt: { toDate: () => Date } | null;
    attachmentUrls: string[];
    messageId: string;
  }> = {},
) {
  const docUpdate = vi.fn().mockResolvedValue(undefined);

  return {
    id,
    ref: { update: docUpdate },
    data: () => ({
      status: 'unprocessed',
      retryCount: 0,
      updatedAt: { toDate: TWO_HOURS_AGO },
      receivedAt: { toDate: TWO_HOURS_AGO },
      attachmentUrls: ['documents/msg-1/invoice.pdf'],
      messageId: 'msg-1',
      subject: 'Invoice',
      from: 'vendor@example.com',
      ...overrides,
    }),
  };
}

async function runRetryHandler() {
  const { retryFailedProcessing } = await import('../src/scheduled/retryFailedProcessing.js');
  const handler = retryFailedProcessing as unknown as () => Promise<void>;
  await handler();
}

// ── Tests ──

describe('retryFailedProcessing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEmailLogDocs = [];
    mockTxnQueryGet.mockResolvedValue({ empty: true, docs: [] });
    mockRunAIProcessing.mockResolvedValue({ transactionId: 'txn-retry-001' });
  });

  it('queries unprocessed email_logs older than 1 hour', async () => {
    const doc = createEmailLogDoc('email-1', { status: 'unprocessed' });
    mockEmailLogDocs = [doc];

    await runRetryHandler();

    expect(mockEmailLogWhere).toHaveBeenCalledWith('status', 'in', ['unprocessed', 'failed']);
    expect(mockRunAIProcessing).toHaveBeenCalled();
  });

  it('queries failed email_logs older than 1 hour', async () => {
    const doc = createEmailLogDoc('email-2', { status: 'failed' });
    mockEmailLogDocs = [doc];

    await runRetryHandler();

    expect(mockRunAIProcessing).toHaveBeenCalled();
  });

  it('skips email_logs newer than 1 hour', async () => {
    const recentDate = new Date(Date.now() - 30 * 60 * 1000); // 30 min ago
    const doc = createEmailLogDoc('email-3', {
      status: 'unprocessed',
      updatedAt: { toDate: () => recentDate },
    });
    mockEmailLogDocs = [doc];

    await runRetryHandler();

    // Should not process — too recent
    expect(mockRunAIProcessing).not.toHaveBeenCalled();
  });

  it('increments retryCount on each retry', async () => {
    const doc = createEmailLogDoc('email-4', { status: 'unprocessed', retryCount: 1 });
    mockEmailLogDocs = [doc];

    await runRetryHandler();

    // retryCount goes from 1 → 2
    expect(doc.ref.update).toHaveBeenCalledWith(
      expect.objectContaining({ retryCount: 2 }),
    );
  });

  it('sets failed_permanent after 3 retries (retryCount >= 3)', async () => {
    const doc = createEmailLogDoc('email-5', { status: 'unprocessed', retryCount: 2 });
    mockEmailLogDocs = [doc];

    await runRetryHandler();

    // retryCount goes 2 → 3 → at max → failed_permanent
    expect(doc.ref.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'failed_permanent',
        retryCount: 3,
      }),
    );
    // Should NOT call runAIProcessing for permanent failures
    expect(mockRunAIProcessing).not.toHaveBeenCalled();
  });

  it('processes up to 10 items per run', async () => {
    vi.useFakeTimers();
    // Create 12 candidates
    const docs = Array.from({ length: 12 }, (_, i) =>
      createEmailLogDoc(`email-${i}`, { status: 'unprocessed' }),
    );
    mockEmailLogDocs = docs;

    const promise = runRetryHandler();
    await vi.runAllTimersAsync();
    await promise;
    vi.useRealTimers();

    // Only first 10 should be processed (runAIProcessing called max 10 times)
    expect(mockRunAIProcessing).toHaveBeenCalledTimes(10);
  });

  it('skips items where transaction already exists (idempotency)', async () => {
    const doc = createEmailLogDoc('email-idem', { status: 'unprocessed' });
    mockEmailLogDocs = [doc];
    mockTxnQueryGet.mockResolvedValue({
      empty: false,
      docs: [{ id: 'existing-txn-001' }],
    });

    await runRetryHandler();

    // Should update to processed without calling runAIProcessing
    expect(mockRunAIProcessing).not.toHaveBeenCalled();
    expect(doc.ref.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'processed',
        transactionId: 'existing-txn-001',
      }),
    );
  });

  it('re-downloads from Gmail for failed emails with no attachments', async () => {
    const doc = createEmailLogDoc('email-redownload', {
      status: 'failed',
      attachmentUrls: [],
      messageId: 'msg-redownload',
    });
    mockEmailLogDocs = [doc];

    // Mock Gmail re-download
    mockMessagesGet.mockResolvedValueOnce({
      data: {
        id: 'msg-redownload',
        payload: {
          headers: [],
          parts: [{
            filename: 'invoice.pdf',
            mimeType: 'application/pdf',
            body: { attachmentId: 'att-001' },
          }],
        },
      },
    });
    const base64Data = Buffer.from('PDF content').toString('base64');
    mockAttachmentsGet.mockResolvedValueOnce({
      data: { data: base64Data },
    });

    await runRetryHandler();

    // Should upload to storage and update attachmentUrls in Firestore
    expect(mockSave).toHaveBeenCalled();
    expect(doc.ref.update).toHaveBeenCalledWith(
      expect.objectContaining({
        attachmentUrls: ['documents/msg-redownload/invoice.pdf'],
      }),
    );
    expect(mockRunAIProcessing).toHaveBeenCalled();
  });

  it('successfully reprocesses unprocessed email with existing attachments', async () => {
    const doc = createEmailLogDoc('email-reprocess', {
      status: 'unprocessed',
      attachmentUrls: ['documents/msg-1/invoice.pdf'],
    });
    mockEmailLogDocs = [doc];

    await runRetryHandler();

    expect(mockRunAIProcessing).toHaveBeenCalledWith(
      expect.anything(),
      'documents/msg-1/invoice.pdf',
      'email-reprocess',
    );
    expect(doc.ref.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'processed',
        transactionId: 'txn-retry-001',
      }),
    );
  });

  it('handles processing failure gracefully (one failure does not block next)', async () => {
    vi.useFakeTimers();
    const doc1 = createEmailLogDoc('email-fail', { status: 'unprocessed' });
    const doc2 = createEmailLogDoc('email-success', { status: 'unprocessed' });
    mockEmailLogDocs = [doc1, doc2];

    // First call fails, second succeeds
    let callCount = 0;
    mockRunAIProcessing.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return Promise.reject(new Error('Gemini timeout'));
      return Promise.resolve({ transactionId: 'txn-ok' });
    });

    const promise = runRetryHandler();
    await vi.runAllTimersAsync();
    await promise;
    vi.useRealTimers();

    // First doc should be marked unprocessed with error
    expect(doc1.ref.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'unprocessed',
        errorMessage: 'Gemini timeout',
      }),
    );
    // Second doc should be processed successfully
    expect(doc2.ref.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'processed',
        transactionId: 'txn-ok',
      }),
    );
  });

  it('handles empty query result (no retries needed)', async () => {
    mockEmailLogDocs = [];

    await runRetryHandler();

    expect(mockRunAIProcessing).not.toHaveBeenCalled();
  });

  it('handles re-download yielding zero attachments (no files in email)', async () => {
    const doc = createEmailLogDoc('email-no-att', {
      status: 'failed',
      attachmentUrls: [],
      messageId: 'msg-no-att',
    });
    mockEmailLogDocs = [doc];

    // Mock Gmail re-download — email has no attachment parts
    mockMessagesGet.mockResolvedValueOnce({
      data: {
        id: 'msg-no-att',
        payload: {
          headers: [],
          parts: [], // No attachments
        },
      },
    });

    await runRetryHandler();

    // Should NOT call runAIProcessing — no attachments to process
    expect(mockRunAIProcessing).not.toHaveBeenCalled();
    // Should mark as unprocessed with error message
    expect(doc.ref.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'unprocessed',
        errorMessage: 'No attachments available after re-download attempt',
      }),
    );
  });

  it('backward compatibility — handles email_logs without retryCount field (defaults to 0)', async () => {
    const docUpdate = vi.fn().mockResolvedValue(undefined);
    const doc = {
      id: 'email-legacy',
      ref: { update: docUpdate },
      data: () => ({
        status: 'unprocessed',
        // retryCount missing — should default to 0
        updatedAt: { toDate: TWO_HOURS_AGO },
        receivedAt: { toDate: TWO_HOURS_AGO },
        attachmentUrls: ['documents/msg-1/invoice.pdf'],
        messageId: 'msg-1',
      }),
    };
    mockEmailLogDocs = [doc];

    await runRetryHandler();

    // retryCount should be treated as 0 → incremented to 1
    expect(docUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ retryCount: 1 }),
    );
    expect(mockRunAIProcessing).toHaveBeenCalled();
  });
});
