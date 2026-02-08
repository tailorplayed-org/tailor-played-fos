import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock firebase-admin/app ──
vi.mock('firebase-admin/app', () => ({
  initializeApp: vi.fn(),
}));

// ── Mock firebase-admin/firestore ──
const mockTransactionAdd = vi.fn().mockResolvedValue({ id: 'txn-ai-001' });
const mockUpdate = vi.fn().mockResolvedValue(undefined);

// Mock Firestore query chain: collection().where().where().get()
const mockVendorHistoryDocs: Array<{ data: () => Record<string, unknown> }> = [];
const mockWorkOrderDocs: Array<{ id: string; data: () => Record<string, unknown> }> = [];
const mockCurrencyConfigDoc = {
  exists: false as boolean,
  data: () => ({} as Record<string, unknown>),
};

const mockWhereGet = vi.fn().mockImplementation(() =>
  Promise.resolve({ docs: mockVendorHistoryDocs }),
);
const mockWhere2 = vi.fn().mockReturnValue({ get: mockWhereGet });
const mockWhere1 = vi.fn().mockReturnValue({ where: mockWhere2 });

const mockDocGet = vi.fn().mockImplementation(() => Promise.resolve(mockCurrencyConfigDoc));
const mockDoc = vi.fn().mockReturnValue({ get: mockDocGet });

const mockCollection = vi.fn().mockImplementation((collectionName: string) => {
  if (collectionName === 'transactions') {
    return {
      add: mockTransactionAdd,
      where: mockWhere1,
    };
  }
  if (collectionName === 'work_orders') {
    return {
      get: vi.fn().mockResolvedValue({ docs: mockWorkOrderDocs }),
    };
  }
  if (collectionName === 'system_config') {
    return {
      doc: mockDoc,
    };
  }
  return { add: mockTransactionAdd };
});

const mockGetFirestore = vi.fn().mockReturnValue({ collection: mockCollection });

vi.mock('firebase-admin/firestore', () => ({
  getFirestore: () => mockGetFirestore(),
  FieldValue: {
    serverTimestamp: vi.fn().mockReturnValue('SERVER_TIMESTAMP'),
  },
}));

// ── Mock firebase-admin/storage ──
const mockDownload = vi.fn();
const mockStorageFile = vi.fn().mockReturnValue({ download: mockDownload });
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

// ── Mock firebase-functions/firestore ──
vi.mock('firebase-functions/firestore', () => ({
  onDocumentCreated: vi.fn(
    (_opts: unknown, handler: (event: unknown) => Promise<void>) => handler,
  ),
}));

// ── Mock @google/genai ──
const mockGenerateContent = vi.fn();

vi.mock('@google/genai', () => {
  class MockGoogleGenAI {
    models = { generateContent: mockGenerateContent };
  }
  return { GoogleGenAI: MockGoogleGenAI };
});

// ── Mock zod-to-json-schema ──
vi.mock('zod-to-json-schema', () => ({
  zodToJsonSchema: vi.fn().mockReturnValue({ type: 'object', properties: {} }),
}));

// ── Helpers ──

/** Mock Hebrew invoice Gemini response (with classification fields — Story 4.4) */
const hebrewInvoiceResponse = {
  vendorName: 'דפוס הנגב',
  date: '2026-01-15',
  totalAmount: 580.0,
  currency: 'ILS',
  lineItems: [
    { description: 'הדפסת קופסאות משחק', amountRaw: 480.0 },
    { description: 'למינציה', amountRaw: 100.0 },
  ],
  documentType: 'invoice',
  languageDetected: 'hebrew',
  confidence: 92,
  category: 'DirectCost',
  classificationReasoning: 'Game box printing is a direct production cost for a board game company.',
  suggestedWorkOrderId: null,
  suggestedInventoryItemId: null,
};

/** Mock English invoice Gemini response (with classification fields — Story 4.4) */
const englishInvoiceResponse = {
  vendorName: 'The Game Crafter',
  date: '2026-02-01',
  totalAmount: 125.5,
  currency: 'USD',
  lineItems: [
    { description: 'Custom card deck (200 cards)', amountRaw: 95.0 },
    { description: 'Shipping', amountRaw: 30.5 },
  ],
  documentType: 'invoice',
  languageDetected: 'english',
  confidence: 97,
  category: 'DirectCost',
  classificationReasoning: 'Custom card deck order is a direct cost for game production.',
  suggestedWorkOrderId: 'wo-david-game',
  suggestedInventoryItemId: null,
};

function createFirestoreEvent(
  status: string,
  mailbox: string,
  attachmentUrls: string[] = ['documents/msg-1/invoice.pdf'],
) {
  return {
    data: {
      data: () => ({
        status,
        mailbox,
        attachmentUrls,
        messageId: 'msg-1',
        subject: 'Invoice',
        from: 'vendor@example.com',
      }),
      ref: { update: mockUpdate },
    },
    params: { docId: 'email-log-001' },
  };
}

// ── Tests ──

describe('geminiClient — parseFinancialDocument', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: storage download returns a buffer
    mockDownload.mockResolvedValue([Buffer.from('PDF-content')]);
  });

  it('parses Hebrew invoice correctly', async () => {
    mockGenerateContent.mockResolvedValueOnce({
      text: JSON.stringify(hebrewInvoiceResponse),
    });

    const { parseFinancialDocument } = await import(
      '../src/ai/geminiClient.js'
    );
    const result = await parseFinancialDocument(
      'documents/msg-1/invoice.pdf',
      'application/pdf',
    );

    expect(result.vendorName).toBe('דפוס הנגב');
    expect(result.currency).toBe('ILS');
    expect(result.totalAmount).toBe(580.0);
    expect(result.documentType).toBe('invoice');
    expect(result.languageDetected).toBe('hebrew');
    expect(result.confidence).toBe(92);
    expect(result.lineItems).toHaveLength(2);
    expect(result.date).toBe('2026-01-15');
  });

  it('parses English invoice correctly', async () => {
    mockGenerateContent.mockResolvedValueOnce({
      text: JSON.stringify(englishInvoiceResponse),
    });

    const { parseFinancialDocument } = await import(
      '../src/ai/geminiClient.js'
    );
    const result = await parseFinancialDocument(
      'documents/msg-2/receipt.jpg',
      'image/jpeg',
    );

    expect(result.vendorName).toBe('The Game Crafter');
    expect(result.currency).toBe('USD');
    expect(result.totalAmount).toBe(125.5);
    expect(result.documentType).toBe('invoice');
    expect(result.languageDetected).toBe('english');
    expect(result.confidence).toBe(97);
    expect(result.lineItems).toHaveLength(2);
  });

  it('throws on empty Gemini response', async () => {
    mockGenerateContent.mockResolvedValueOnce({ text: '' });

    const { parseFinancialDocument } = await import(
      '../src/ai/geminiClient.js'
    );
    await expect(
      parseFinancialDocument('documents/msg-3/doc.pdf', 'application/pdf'),
    ).rejects.toThrow('Gemini returned empty response');
  });

  it('throws on null Gemini response text', async () => {
    mockGenerateContent.mockResolvedValueOnce({ text: null });

    const { parseFinancialDocument } = await import(
      '../src/ai/geminiClient.js'
    );
    await expect(
      parseFinancialDocument('documents/msg-4/doc.pdf', 'application/pdf'),
    ).rejects.toThrow('Gemini returned empty response');
  });

  it('throws on invalid JSON from Gemini', async () => {
    mockGenerateContent.mockResolvedValueOnce({ text: 'not-json' });

    const { parseFinancialDocument } = await import(
      '../src/ai/geminiClient.js'
    );
    await expect(
      parseFinancialDocument('documents/msg-5/doc.pdf', 'application/pdf'),
    ).rejects.toThrow();
  });

  it('throws on Gemini API timeout/failure', async () => {
    mockGenerateContent.mockRejectedValueOnce(new Error('Request timed out'));

    const { parseFinancialDocument } = await import(
      '../src/ai/geminiClient.js'
    );
    await expect(
      parseFinancialDocument('documents/msg-6/doc.pdf', 'application/pdf'),
    ).rejects.toThrow('Request timed out');
  });

  it('throws when Gemini response fails Zod validation', async () => {
    const invalidResponse = {
      ...hebrewInvoiceResponse,
      confidence: 150, // Out of range (0-100)
    };
    mockGenerateContent.mockResolvedValueOnce({
      text: JSON.stringify(invalidResponse),
    });

    const { parseFinancialDocument } = await import(
      '../src/ai/geminiClient.js'
    );
    await expect(
      parseFinancialDocument('documents/msg-7/doc.pdf', 'application/pdf'),
    ).rejects.toThrow();
  });

  it('downloads document from Firebase Storage as base64', async () => {
    mockGenerateContent.mockResolvedValueOnce({
      text: JSON.stringify(hebrewInvoiceResponse),
    });

    const { parseFinancialDocument } = await import(
      '../src/ai/geminiClient.js'
    );
    await parseFinancialDocument(
      'documents/msg-8/file.png',
      'image/png',
    );

    expect(mockStorageFile).toHaveBeenCalledWith('documents/msg-8/file.png');
    expect(mockDownload).toHaveBeenCalled();
  });
});

describe('processDocument — Firestore onCreate trigger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDownload.mockResolvedValue([Buffer.from('PDF-content')]);
  });

  it('processes received email_log and creates transaction (Hebrew ILS invoice)', async () => {
    mockGenerateContent.mockResolvedValueOnce({
      text: JSON.stringify(hebrewInvoiceResponse),
    });

    const { processDocument } = await import(
      '../src/ai/processDocument.js'
    );
    const handler = processDocument as unknown as (
      event: unknown,
    ) => Promise<void>;

    const event = createFirestoreEvent('received', 'orders');
    await handler(event);

    // Verify status transition: received → processing
    expect(mockUpdate).toHaveBeenCalledWith({ status: 'processing' });

    // Verify transaction created with correct fields (category from Gemini, not mailbox)
    expect(mockTransactionAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        vendorName: 'דפוס הנגב',
        amountAgora: 58000, // 580.00 * 100
        currency: 'ILS',
        category: 'DirectCost', // Gemini-classified (Story 4.4)
        status: 'pending_review',
        source: 'ai',
        aiConfidence: 92,
        originalFileUrl: 'documents/msg-1/invoice.pdf',
        sourceEmailRef: 'email-log-001',
        workOrderId: null,
        inventoryItemId: null,
        notes: null,
        // Classification fields (Story 4.4)
        suggestedWorkOrderId: null,
        suggestedInventoryItemId: null,
        classificationReasoning: 'Game box printing is a direct production cost for a board game company.',
        // Currency conversion fields (Story 4.4) — ILS transaction
        isEstimatedConversion: false,
        conversionRate: null,
        conversionRateDate: null,
      }),
    );

    // Verify email_log updated: processed + transactionId
    expect(mockUpdate).toHaveBeenCalledWith({
      status: 'processed',
      transactionId: 'txn-ai-001',
    });
  });

  it('processes English invoice with USD currency and estimated conversion', async () => {
    mockGenerateContent.mockResolvedValueOnce({
      text: JSON.stringify(englishInvoiceResponse),
    });

    const { processDocument } = await import(
      '../src/ai/processDocument.js'
    );
    const handler = processDocument as unknown as (
      event: unknown,
    ) => Promise<void>;

    const event = createFirestoreEvent('received', 'supplies');
    await handler(event);

    // Amount: 125.50 → 12550 agora
    expect(mockTransactionAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        vendorName: 'The Game Crafter',
        amountAgora: 12550,
        currency: 'USD',
        category: 'DirectCost', // Gemini-classified (not mailbox heuristic)
        aiConfidence: 97,
        // Classification fields (Story 4.4)
        suggestedWorkOrderId: 'wo-david-game',
        suggestedInventoryItemId: null,
        classificationReasoning: 'Custom card deck order is a direct cost for game production.',
        // Currency conversion fields (Story 4.4) — USD transaction
        isEstimatedConversion: true,
        conversionRate: 3.5, // DEFAULT_CONVERSION_RATES.USD
        conversionRateDate: expect.any(String),
      }),
    );
  });

  it('skips email_log with non-received status', async () => {
    const { processDocument } = await import(
      '../src/ai/processDocument.js'
    );
    const handler = processDocument as unknown as (
      event: unknown,
    ) => Promise<void>;

    const event = createFirestoreEvent('processing', 'orders');
    await handler(event);

    // Should not process — no update, no transaction
    expect(mockUpdate).not.toHaveBeenCalled();
    expect(mockTransactionAdd).not.toHaveBeenCalled();
  });

  it('handles null event data gracefully', async () => {
    const { processDocument } = await import(
      '../src/ai/processDocument.js'
    );
    const handler = processDocument as unknown as (
      event: unknown,
    ) => Promise<void>;

    await handler({ data: null, params: { docId: 'null-event' } });

    expect(mockUpdate).not.toHaveBeenCalled();
    expect(mockTransactionAdd).not.toHaveBeenCalled();
  });

  it('marks email_log as unprocessed on Gemini failure', async () => {
    mockGenerateContent.mockRejectedValueOnce(
      new Error('Gemini API rate limit exceeded'),
    );

    const { processDocument } = await import(
      '../src/ai/processDocument.js'
    );
    const handler = processDocument as unknown as (
      event: unknown,
    ) => Promise<void>;

    const event = createFirestoreEvent('received', 'orders');
    await handler(event);

    // Should set status to 'processing' first, then 'unprocessed' on error
    expect(mockUpdate).toHaveBeenCalledWith({ status: 'processing' });
    expect(mockUpdate).toHaveBeenCalledWith({
      status: 'unprocessed',
      errorMessage: 'Gemini API rate limit exceeded',
    });

    // Should NOT create transaction
    expect(mockTransactionAdd).not.toHaveBeenCalled();
  });

  it('marks email_log as unprocessed when no attachments', async () => {
    const { processDocument } = await import(
      '../src/ai/processDocument.js'
    );
    const handler = processDocument as unknown as (
      event: unknown,
    ) => Promise<void>;

    const event = createFirestoreEvent('received', 'orders', []);
    await handler(event);

    expect(mockUpdate).toHaveBeenCalledWith({
      status: 'unprocessed',
      errorMessage: 'No attachments found in email_log',
    });
    expect(mockTransactionAdd).not.toHaveBeenCalled();
  });

  it('marks email_log as unprocessed on invalid Gemini response', async () => {
    mockGenerateContent.mockResolvedValueOnce({ text: 'not-valid-json' });

    const { processDocument } = await import(
      '../src/ai/processDocument.js'
    );
    const handler = processDocument as unknown as (
      event: unknown,
    ) => Promise<void>;

    const event = createFirestoreEvent('received', 'expenses');
    await handler(event);

    expect(mockUpdate).toHaveBeenCalledWith({
      status: 'unprocessed',
      errorMessage: expect.any(String),
    });
    expect(mockTransactionAdd).not.toHaveBeenCalled();
  });

  it('converts amount to agora correctly (integer rounding)', async () => {
    const responseWithDecimal = {
      ...hebrewInvoiceResponse,
      totalAmount: 82.55, // Should round to 8255
    };
    mockGenerateContent.mockResolvedValueOnce({
      text: JSON.stringify(responseWithDecimal),
    });

    const { processDocument } = await import(
      '../src/ai/processDocument.js'
    );
    const handler = processDocument as unknown as (
      event: unknown,
    ) => Promise<void>;

    const event = createFirestoreEvent('received', 'orders');
    await handler(event);

    expect(mockTransactionAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        amountAgora: 8255, // Math.round(82.55 * 100)
      }),
    );
  });

  it('uses Gemini-classified category (not mailbox heuristic)', async () => {
    // Gemini classifies as Overhead regardless of mailbox
    const overheadResponse = {
      ...hebrewInvoiceResponse,
      category: 'Overhead',
      classificationReasoning: 'Office supplies are overhead expenses.',
    };
    mockGenerateContent.mockResolvedValueOnce({
      text: JSON.stringify(overheadResponse),
    });

    const { processDocument } = await import(
      '../src/ai/processDocument.js'
    );
    const handler = processDocument as unknown as (
      event: unknown,
    ) => Promise<void>;

    // Mailbox is 'orders' but Gemini says 'Overhead' — Gemini wins
    const event = createFirestoreEvent('received', 'orders');
    await handler(event);

    expect(mockTransactionAdd).toHaveBeenCalledWith(
      expect.objectContaining({ category: 'Overhead' }),
    );
  });

  it('email_log status transitions: received → processing → processed', async () => {
    mockTransactionAdd.mockResolvedValueOnce({ id: 'txn-ai-001' });
    mockGenerateContent.mockResolvedValueOnce({
      text: JSON.stringify(hebrewInvoiceResponse),
    });

    const { processDocument } = await import(
      '../src/ai/processDocument.js'
    );
    const handler = processDocument as unknown as (
      event: unknown,
    ) => Promise<void>;

    const event = createFirestoreEvent('received', 'orders');
    await handler(event);

    // Verify status updates include processing → processed
    expect(mockUpdate).toHaveBeenCalledWith({ status: 'processing' });
    expect(mockUpdate).toHaveBeenCalledWith({
      status: 'processed',
      transactionId: 'txn-ai-001',
    });
  });

  it('does not re-throw errors (no Cloud Functions auto-retry)', async () => {
    mockGenerateContent.mockRejectedValueOnce(new Error('API failure'));

    const { processDocument } = await import(
      '../src/ai/processDocument.js'
    );
    const handler = processDocument as unknown as (
      event: unknown,
    ) => Promise<void>;

    const event = createFirestoreEvent('received', 'orders');

    // Should NOT throw — resolves silently after updating email_log
    await expect(handler(event)).resolves.toBeUndefined();
  });

  it('marks email_log as unprocessed on Storage download failure', async () => {
    mockDownload.mockRejectedValueOnce(
      new Error('File not found in Storage'),
    );

    const { processDocument } = await import(
      '../src/ai/processDocument.js'
    );
    const handler = processDocument as unknown as (
      event: unknown,
    ) => Promise<void>;

    const event = createFirestoreEvent('received', 'orders');
    await handler(event);

    expect(mockUpdate).toHaveBeenCalledWith({
      status: 'unprocessed',
      errorMessage: 'File not found in Storage',
    });
    expect(mockTransactionAdd).not.toHaveBeenCalled();
  });

  it('uses Gemini category regardless of mailbox value', async () => {
    const personalResponse = {
      ...hebrewInvoiceResponse,
      category: 'Personal',
      classificationReasoning: 'This appears to be a personal purchase.',
    };
    mockGenerateContent.mockResolvedValueOnce({
      text: JSON.stringify(personalResponse),
    });

    const { processDocument } = await import(
      '../src/ai/processDocument.js'
    );
    const handler = processDocument as unknown as (
      event: unknown,
    ) => Promise<void>;

    const event = createFirestoreEvent('received', 'unknown-mailbox');
    await handler(event);

    expect(mockTransactionAdd).toHaveBeenCalledWith(
      expect.objectContaining({ category: 'Personal' }),
    );
  });

  it('marks email_log as unprocessed on invalid date from Gemini', async () => {
    const invalidDateResponse = {
      ...hebrewInvoiceResponse,
      date: 'not-a-date',
    };
    mockGenerateContent.mockResolvedValueOnce({
      text: JSON.stringify(invalidDateResponse),
    });

    const { processDocument } = await import(
      '../src/ai/processDocument.js'
    );
    const handler = processDocument as unknown as (
      event: unknown,
    ) => Promise<void>;

    const event = createFirestoreEvent('received', 'orders');
    await handler(event);

    expect(mockUpdate).toHaveBeenCalledWith({
      status: 'unprocessed',
      errorMessage: 'Invalid date from Gemini: not-a-date',
    });
    expect(mockTransactionAdd).not.toHaveBeenCalled();
  });
});

describe('parsedDocumentSchema validation', () => {
  it('validates a correct parsed document', async () => {
    const { parsedDocumentSchema } = await import('../src/shared/schemas.js');

    const result = parsedDocumentSchema.safeParse(hebrewInvoiceResponse);
    expect(result.success).toBe(true);
  });

  it('rejects confidence out of range', async () => {
    const { parsedDocumentSchema } = await import('../src/shared/schemas.js');

    const invalid = { ...hebrewInvoiceResponse, confidence: 150 };
    const result = parsedDocumentSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects negative confidence', async () => {
    const { parsedDocumentSchema } = await import('../src/shared/schemas.js');

    const invalid = { ...hebrewInvoiceResponse, confidence: -5 };
    const result = parsedDocumentSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects invalid currency', async () => {
    const { parsedDocumentSchema } = await import('../src/shared/schemas.js');

    const invalid = { ...hebrewInvoiceResponse, currency: 'GBP' };
    const result = parsedDocumentSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects invalid documentType', async () => {
    const { parsedDocumentSchema } = await import('../src/shared/schemas.js');

    const invalid = { ...hebrewInvoiceResponse, documentType: 'contract' };
    const result = parsedDocumentSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects invalid languageDetected', async () => {
    const { parsedDocumentSchema } = await import('../src/shared/schemas.js');

    const invalid = { ...hebrewInvoiceResponse, languageDetected: 'arabic' };
    const result = parsedDocumentSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('accepts empty lineItems array', async () => {
    const { parsedDocumentSchema } = await import('../src/shared/schemas.js');

    const withEmpty = { ...hebrewInvoiceResponse, lineItems: [] };
    const result = parsedDocumentSchema.safeParse(withEmpty);
    expect(result.success).toBe(true);
  });

  it('rejects empty vendorName', async () => {
    const { parsedDocumentSchema } = await import('../src/shared/schemas.js');

    const invalid = { ...hebrewInvoiceResponse, vendorName: '' };
    const result = parsedDocumentSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});

// ── Story 4.4: Classification + Conversion Tests ──

describe('geminiClient — classification response parsing (Story 4.4)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDownload.mockResolvedValue([Buffer.from('PDF-content')]);
  });

  it('parses classification fields from Gemini response', async () => {
    mockGenerateContent.mockResolvedValueOnce({
      text: JSON.stringify(hebrewInvoiceResponse),
    });

    const { parseFinancialDocument } = await import('../src/ai/geminiClient.js');
    const result = await parseFinancialDocument('doc.pdf', 'application/pdf');

    expect(result.category).toBe('DirectCost');
    expect(result.classificationReasoning).toBe(
      'Game box printing is a direct production cost for a board game company.',
    );
    expect(result.suggestedWorkOrderId).toBeNull();
    expect(result.suggestedInventoryItemId).toBeNull();
  });

  it('parses suggestedWorkOrderId from Gemini response', async () => {
    mockGenerateContent.mockResolvedValueOnce({
      text: JSON.stringify(englishInvoiceResponse),
    });

    const { parseFinancialDocument } = await import('../src/ai/geminiClient.js');
    const result = await parseFinancialDocument('doc.jpg', 'image/jpeg');

    expect(result.suggestedWorkOrderId).toBe('wo-david-game');
    expect(result.suggestedInventoryItemId).toBeNull();
  });

  it('accepts optional classificationContext parameter (backward compatible)', async () => {
    mockGenerateContent.mockResolvedValueOnce({
      text: JSON.stringify(hebrewInvoiceResponse),
    });

    const { parseFinancialDocument } = await import('../src/ai/geminiClient.js');
    // Call without context — should still work (backward compatibility)
    const result = await parseFinancialDocument('doc.pdf', 'application/pdf');
    expect(result.vendorName).toBe('דפוס הנגב');

    // Call with context — should also work
    mockGenerateContent.mockResolvedValueOnce({
      text: JSON.stringify(englishInvoiceResponse),
    });
    const resultWithCtx = await parseFinancialDocument('doc.pdf', 'application/pdf', {
      vendorHistory: [{ vendorName: 'Test', category: 'DirectCost', workOrderId: null, workOrderName: null, count: 1 }],
      workOrders: [{ id: 'wo-1', clientName: 'Client', status: 'Production' }],
    });
    expect(resultWithCtx.vendorName).toBe('The Game Crafter');
  });
});

describe('processDocument — vendor history + classification context (Story 4.4)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDownload.mockResolvedValue([Buffer.from('PDF-content')]);
    // Reset vendor history and work order mocks
    mockVendorHistoryDocs.length = 0;
    mockWorkOrderDocs.length = 0;
    mockCurrencyConfigDoc.exists = false;
  });

  it('queries vendor history and work orders before Gemini call', async () => {
    mockGenerateContent.mockResolvedValueOnce({
      text: JSON.stringify(hebrewInvoiceResponse),
    });

    const { processDocument } = await import('../src/ai/processDocument.js');
    const handler = processDocument as unknown as (event: unknown) => Promise<void>;

    const event = createFirestoreEvent('received', 'orders');
    await handler(event);

    // Verify Firestore queries were made
    expect(mockCollection).toHaveBeenCalledWith('transactions');
    expect(mockCollection).toHaveBeenCalledWith('work_orders');
    expect(mockWhere1).toHaveBeenCalledWith('status', '==', 'approved');
    expect(mockWhere2).toHaveBeenCalledWith('source', '==', 'ai');
  });

  it('passes vendor history context to classification (high confidence scenario)', async () => {
    // Set up vendor history: Game Crafter linked to wo-david-game 3 times
    mockVendorHistoryDocs.push(
      { data: () => ({ vendorName: 'The Game Crafter', category: 'DirectCost', workOrderId: 'wo-david-game', source: 'ai', status: 'approved' }) },
      { data: () => ({ vendorName: 'The Game Crafter', category: 'DirectCost', workOrderId: 'wo-david-game', source: 'ai', status: 'approved' }) },
      { data: () => ({ vendorName: 'The Game Crafter', category: 'DirectCost', workOrderId: 'wo-david-game', source: 'ai', status: 'approved' }) },
    );

    // High-confidence response from Gemini (known vendor)
    const highConfidenceResponse = {
      ...englishInvoiceResponse,
      confidence: 95,
      classificationReasoning: 'Matched to David\'s Game — vendor linked 3 times previously.',
    };
    mockGenerateContent.mockResolvedValueOnce({
      text: JSON.stringify(highConfidenceResponse),
    });

    const { processDocument } = await import('../src/ai/processDocument.js');
    const handler = processDocument as unknown as (event: unknown) => Promise<void>;

    const event = createFirestoreEvent('received', 'orders');
    await handler(event);

    expect(mockTransactionAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        aiConfidence: 95,
        suggestedWorkOrderId: 'wo-david-game',
      }),
    );
  });

  it('handles low confidence for new/unknown vendor', async () => {
    // No vendor history — new vendor
    mockVendorHistoryDocs.length = 0;

    const lowConfidenceResponse = {
      ...hebrewInvoiceResponse,
      confidence: 60,
      classificationReasoning: 'New vendor with no history. Category inferred from document content.',
    };
    mockGenerateContent.mockResolvedValueOnce({
      text: JSON.stringify(lowConfidenceResponse),
    });

    const { processDocument } = await import('../src/ai/processDocument.js');
    const handler = processDocument as unknown as (event: unknown) => Promise<void>;

    const event = createFirestoreEvent('received', 'orders');
    await handler(event);

    expect(mockTransactionAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        aiConfidence: 60,
        classificationReasoning: 'New vendor with no history. Category inferred from document content.',
      }),
    );
  });

  it('sets suggestedInventoryItemId for restock classification', async () => {
    // Gemini classifies as InventoryRestock (but suggestedInventoryItemId stays null — no inventory yet)
    const restockResponse = {
      ...hebrewInvoiceResponse,
      category: 'InventoryRestock',
      classificationReasoning: 'Generic card stock purchase for inventory.',
      suggestedInventoryItemId: null,
    };
    mockGenerateContent.mockResolvedValueOnce({
      text: JSON.stringify(restockResponse),
    });

    const { processDocument } = await import('../src/ai/processDocument.js');
    const handler = processDocument as unknown as (event: unknown) => Promise<void>;

    const event = createFirestoreEvent('received', 'supplies');
    await handler(event);

    expect(mockTransactionAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'InventoryRestock',
        suggestedInventoryItemId: null,
      }),
    );
  });

  it('gracefully degrades when classification context queries fail', async () => {
    // Make vendor history query fail
    mockWhereGet.mockRejectedValueOnce(new Error('Firestore permission denied'));

    mockGenerateContent.mockResolvedValueOnce({
      text: JSON.stringify(hebrewInvoiceResponse),
    });

    const { processDocument } = await import('../src/ai/processDocument.js');
    const handler = processDocument as unknown as (event: unknown) => Promise<void>;

    const event = createFirestoreEvent('received', 'orders');
    await handler(event);

    // Should still create transaction despite context query failure
    expect(mockTransactionAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        vendorName: 'דפוס הנגב',
        category: 'DirectCost',
      }),
    );
  });

  it('enriches vendor history with work order names from parallel query', async () => {
    // Set up vendor history with a workOrderId
    mockVendorHistoryDocs.push(
      { data: () => ({ vendorName: 'The Game Crafter', category: 'DirectCost', workOrderId: 'wo-david', source: 'ai', status: 'approved' }) },
    );

    // Set up work orders with matching id
    mockWorkOrderDocs.push(
      { id: 'wo-david', data: () => ({ clientName: "David's Game", status: 'Production' }) },
    );

    mockGenerateContent.mockResolvedValueOnce({
      text: JSON.stringify(englishInvoiceResponse),
    });

    const { processDocument } = await import('../src/ai/processDocument.js');
    const handler = processDocument as unknown as (event: unknown) => Promise<void>;

    const event = createFirestoreEvent('received', 'orders');
    await handler(event);

    // Verify Gemini was called (context enrichment happens before the call)
    expect(mockGenerateContent).toHaveBeenCalled();
    // Transaction should be created successfully
    expect(mockTransactionAdd).toHaveBeenCalled();
  });

  it('stores classificationReasoning on transaction', async () => {
    mockGenerateContent.mockResolvedValueOnce({
      text: JSON.stringify(hebrewInvoiceResponse),
    });

    const { processDocument } = await import('../src/ai/processDocument.js');
    const handler = processDocument as unknown as (event: unknown) => Promise<void>;

    const event = createFirestoreEvent('received', 'orders');
    await handler(event);

    expect(mockTransactionAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        classificationReasoning: 'Game box printing is a direct production cost for a board game company.',
      }),
    );
  });
});

describe('processDocument — currency conversion (Story 4.4)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDownload.mockResolvedValue([Buffer.from('PDF-content')]);
    mockVendorHistoryDocs.length = 0;
    mockWorkOrderDocs.length = 0;
    mockCurrencyConfigDoc.exists = false;
  });

  it('ILS transaction has isEstimatedConversion: false', async () => {
    mockGenerateContent.mockResolvedValueOnce({
      text: JSON.stringify(hebrewInvoiceResponse), // ILS
    });

    const { processDocument } = await import('../src/ai/processDocument.js');
    const handler = processDocument as unknown as (event: unknown) => Promise<void>;

    const event = createFirestoreEvent('received', 'orders');
    await handler(event);

    expect(mockTransactionAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        isEstimatedConversion: false,
        conversionRate: null,
        conversionRateDate: null,
      }),
    );
  });

  it('USD transaction has isEstimatedConversion: true with conversionRate', async () => {
    mockGenerateContent.mockResolvedValueOnce({
      text: JSON.stringify(englishInvoiceResponse), // USD
    });

    const { processDocument } = await import('../src/ai/processDocument.js');
    const handler = processDocument as unknown as (event: unknown) => Promise<void>;

    const event = createFirestoreEvent('received', 'orders');
    await handler(event);

    expect(mockTransactionAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        isEstimatedConversion: true,
        conversionRate: 3.5, // DEFAULT_CONVERSION_RATES.USD
        conversionRateDate: expect.any(String),
      }),
    );
  });

  it('EUR transaction uses fallback conversion rates', async () => {
    const eurResponse = {
      ...hebrewInvoiceResponse,
      currency: 'EUR',
      totalAmount: 200.0,
    };
    mockGenerateContent.mockResolvedValueOnce({
      text: JSON.stringify(eurResponse),
    });

    const { processDocument } = await import('../src/ai/processDocument.js');
    const handler = processDocument as unknown as (event: unknown) => Promise<void>;

    const event = createFirestoreEvent('received', 'orders');
    await handler(event);

    expect(mockTransactionAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        isEstimatedConversion: true,
        conversionRate: 3.8, // DEFAULT_CONVERSION_RATES.EUR
        conversionRateDate: expect.any(String),
      }),
    );
  });

  it('uses system_config rates when available', async () => {
    // Set up system_config/currency doc
    mockCurrencyConfigDoc.exists = true;
    mockCurrencyConfigDoc.data = () => ({
      currencyRates: { USD: 4.0, EUR: 4.2, ILS: 1 },
      updatedAt: '2026-02-01',
    });

    mockGenerateContent.mockResolvedValueOnce({
      text: JSON.stringify(englishInvoiceResponse), // USD
    });

    const { processDocument } = await import('../src/ai/processDocument.js');
    const handler = processDocument as unknown as (event: unknown) => Promise<void>;

    const event = createFirestoreEvent('received', 'orders');
    await handler(event);

    expect(mockTransactionAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        isEstimatedConversion: true,
        conversionRate: 4.0, // From system_config
        conversionRateDate: '2026-02-01',
      }),
    );
  });
});

describe('getVendorHistory — unit tests (Story 4.4)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockVendorHistoryDocs.length = 0;
  });

  it('returns empty array when no approved transactions', async () => {
    const { getVendorHistory } = await import('../src/ai/processDocument.js');
    const db = mockGetFirestore();
    const result = await getVendorHistory(db);
    expect(result).toEqual([]);
  });

  it('aggregates vendor history correctly', async () => {
    mockVendorHistoryDocs.push(
      { data: () => ({ vendorName: 'VendorA', category: 'DirectCost', workOrderId: 'wo-1' }) },
      { data: () => ({ vendorName: 'VendorA', category: 'DirectCost', workOrderId: 'wo-1' }) },
      { data: () => ({ vendorName: 'VendorB', category: 'Overhead', workOrderId: null }) },
    );

    const { getVendorHistory } = await import('../src/ai/processDocument.js');
    const db = mockGetFirestore();
    const result = await getVendorHistory(db);

    expect(result).toHaveLength(2);

    const vendorA = result.find(e => e.vendorName === 'VendorA');
    expect(vendorA).toBeDefined();
    expect(vendorA!.count).toBe(2);
    expect(vendorA!.workOrderId).toBe('wo-1');

    const vendorB = result.find(e => e.vendorName === 'VendorB');
    expect(vendorB).toBeDefined();
    expect(vendorB!.count).toBe(1);
    expect(vendorB!.workOrderId).toBeNull();
  });

  it('skips entries with empty vendorName', async () => {
    mockVendorHistoryDocs.push(
      { data: () => ({ vendorName: '', category: 'DirectCost', workOrderId: null }) },
      { data: () => ({ vendorName: 'RealVendor', category: 'Overhead', workOrderId: null }) },
    );

    const { getVendorHistory } = await import('../src/ai/processDocument.js');
    const db = mockGetFirestore();
    const result = await getVendorHistory(db);

    expect(result).toHaveLength(1);
    expect(result[0].vendorName).toBe('RealVendor');
  });
});

describe('getActiveWorkOrders — unit tests (Story 4.4)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWorkOrderDocs.length = 0;
  });

  it('returns empty array when no work orders', async () => {
    const { getActiveWorkOrders } = await import('../src/ai/processDocument.js');
    const db = mockGetFirestore();
    const result = await getActiveWorkOrders(db);
    expect(result).toEqual([]);
  });

  it('returns work order summaries for active statuses', async () => {
    mockWorkOrderDocs.push(
      { id: 'wo-1', data: () => ({ clientName: 'Client A', status: 'Production' }) },
      { id: 'wo-2', data: () => ({ clientName: 'Client B', status: 'Design' }) },
    );

    const { getActiveWorkOrders } = await import('../src/ai/processDocument.js');
    const db = mockGetFirestore();
    const result = await getActiveWorkOrders(db);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ id: 'wo-1', clientName: 'Client A', status: 'Production' });
    expect(result[1]).toEqual({ id: 'wo-2', clientName: 'Client B', status: 'Design' });
  });

  it('excludes Shipped work orders from classification context', async () => {
    mockWorkOrderDocs.push(
      { id: 'wo-1', data: () => ({ clientName: 'Active Project', status: 'Production' }) },
      { id: 'wo-2', data: () => ({ clientName: 'Completed Project', status: 'Shipped' }) },
      { id: 'wo-3', data: () => ({ clientName: 'New Lead', status: 'Lead' }) },
    );

    const { getActiveWorkOrders } = await import('../src/ai/processDocument.js');
    const db = mockGetFirestore();
    const result = await getActiveWorkOrders(db);

    expect(result).toHaveLength(2);
    expect(result.find(wo => wo.id === 'wo-2')).toBeUndefined();
    expect(result[0].clientName).toBe('Active Project');
    expect(result[1].clientName).toBe('New Lead');
  });

  it('handles work orders with missing fields gracefully', async () => {
    mockWorkOrderDocs.push(
      { id: 'wo-1', data: () => ({}) }, // No clientName or status
    );

    const { getActiveWorkOrders } = await import('../src/ai/processDocument.js');
    const db = mockGetFirestore();
    const result = await getActiveWorkOrders(db);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ id: 'wo-1', clientName: '', status: 'Lead' });
  });
});

describe('getConversionRates — unit tests (Story 4.4)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCurrencyConfigDoc.exists = false;
  });

  it('returns default rates when system_config does not exist', async () => {
    const { getConversionRates } = await import('../src/ai/processDocument.js');
    const db = mockGetFirestore();
    const result = await getConversionRates(db);

    expect(result.rates).toEqual({ ILS: 1, USD: 3.5, EUR: 3.8 });
    expect(result.date).toBeNull();
  });

  it('returns system_config rates when available', async () => {
    mockCurrencyConfigDoc.exists = true;
    mockCurrencyConfigDoc.data = () => ({
      currencyRates: { USD: 4.0, EUR: 4.2, ILS: 1 },
      updatedAt: '2026-02-01',
    });

    const { getConversionRates } = await import('../src/ai/processDocument.js');
    const db = mockGetFirestore();
    const result = await getConversionRates(db);

    expect(result.rates).toEqual({ USD: 4.0, EUR: 4.2, ILS: 1 });
    expect(result.date).toBe('2026-02-01');
  });

  it('falls back to defaults when Firestore query throws', async () => {
    mockDocGet.mockRejectedValueOnce(new Error('Firestore permission denied'));

    const { getConversionRates } = await import('../src/ai/processDocument.js');
    const db = mockGetFirestore();
    const result = await getConversionRates(db);

    // Should fall back to default rates, not throw
    expect(result.rates).toEqual({ ILS: 1, USD: 3.5, EUR: 3.8 });
    expect(result.date).toBeNull();
  });
});

describe('parsedDocumentSchema — classification field validation (Story 4.4)', () => {
  it('validates all classification fields', async () => {
    const { parsedDocumentSchema } = await import('../src/shared/schemas.js');

    const valid = { ...hebrewInvoiceResponse };
    const result = parsedDocumentSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('rejects invalid category enum value', async () => {
    const { parsedDocumentSchema } = await import('../src/shared/schemas.js');

    const invalid = { ...hebrewInvoiceResponse, category: 'InvalidCategory' };
    const result = parsedDocumentSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('accepts nullable suggestedWorkOrderId', async () => {
    const { parsedDocumentSchema } = await import('../src/shared/schemas.js');

    const withNull = { ...hebrewInvoiceResponse, suggestedWorkOrderId: null };
    const result = parsedDocumentSchema.safeParse(withNull);
    expect(result.success).toBe(true);
  });

  it('accepts string suggestedWorkOrderId', async () => {
    const { parsedDocumentSchema } = await import('../src/shared/schemas.js');

    const withId = { ...hebrewInvoiceResponse, suggestedWorkOrderId: 'wo-123' };
    const result = parsedDocumentSchema.safeParse(withId);
    expect(result.success).toBe(true);
  });

  it('accepts nullable suggestedInventoryItemId', async () => {
    const { parsedDocumentSchema } = await import('../src/shared/schemas.js');

    const withNull = { ...hebrewInvoiceResponse, suggestedInventoryItemId: null };
    const result = parsedDocumentSchema.safeParse(withNull);
    expect(result.success).toBe(true);
  });

  it('requires classificationReasoning as string', async () => {
    const { parsedDocumentSchema } = await import('../src/shared/schemas.js');

    const invalid = { ...hebrewInvoiceResponse, classificationReasoning: 123 };
    const result = parsedDocumentSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});

describe('server-side transactionSchema — classification + conversion fields (Story 4.4)', () => {
  it('validates transaction with all new fields', async () => {
    const { transactionSchema } = await import('../src/shared/schemas.js');

    const validTxn = {
      vendorName: 'Test Vendor',
      amountAgora: 5000,
      currency: 'USD',
      date: new Date(),
      category: 'DirectCost',
      workOrderId: null,
      inventoryItemId: null,
      status: 'pending_review',
      aiConfidence: 90,
      originalFileUrl: 'doc.pdf',
      source: 'ai',
      sourceEmailRef: 'email-123',
      notes: null,
      createdAt: 'SERVER_TIMESTAMP',
      updatedAt: 'SERVER_TIMESTAMP',
      suggestedWorkOrderId: 'wo-1',
      suggestedInventoryItemId: null,
      classificationReasoning: 'Known vendor with direct cost history.',
      isEstimatedConversion: true,
      conversionRate: 3.5,
      conversionRateDate: '2026-02-01',
    };

    const result = transactionSchema.safeParse(validTxn);
    expect(result.success).toBe(true);
  });

  it('rejects non-boolean isEstimatedConversion', async () => {
    const { transactionSchema } = await import('../src/shared/schemas.js');

    const invalid = {
      vendorName: 'Test',
      amountAgora: 1000,
      currency: 'ILS',
      date: new Date(),
      category: 'DirectCost',
      workOrderId: null,
      inventoryItemId: null,
      status: 'approved',
      aiConfidence: null,
      originalFileUrl: null,
      source: 'manual',
      sourceEmailRef: null,
      notes: null,
      createdAt: 'SERVER_TIMESTAMP',
      updatedAt: 'SERVER_TIMESTAMP',
      suggestedWorkOrderId: null,
      suggestedInventoryItemId: null,
      classificationReasoning: null,
      isEstimatedConversion: 'yes', // Should be boolean
      conversionRate: null,
      conversionRateDate: null,
    };

    const result = transactionSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('accepts null classification fields for manual transactions', async () => {
    const { transactionSchema } = await import('../src/shared/schemas.js');

    const manualTxn = {
      vendorName: 'Manual Vendor',
      amountAgora: 1000,
      currency: 'ILS',
      date: new Date(),
      category: 'Overhead',
      workOrderId: null,
      inventoryItemId: null,
      status: 'approved',
      aiConfidence: null,
      originalFileUrl: null,
      source: 'manual',
      sourceEmailRef: null,
      notes: null,
      createdAt: 'SERVER_TIMESTAMP',
      updatedAt: 'SERVER_TIMESTAMP',
      suggestedWorkOrderId: null,
      suggestedInventoryItemId: null,
      classificationReasoning: null,
      isEstimatedConversion: false,
      conversionRate: null,
      conversionRateDate: null,
    };

    const result = transactionSchema.safeParse(manualTxn);
    expect(result.success).toBe(true);
  });
});

describe('server-side transactionSchema with sourceEmailRef', () => {
  it('validates transaction with sourceEmailRef string', async () => {
    const { transactionSchema } = await import('../src/shared/schemas.js');

    const validTxn = {
      vendorName: 'Test Vendor',
      amountAgora: 5000,
      currency: 'ILS',
      date: new Date(),
      category: 'DirectCost',
      workOrderId: null,
      inventoryItemId: null,
      status: 'pending_review',
      aiConfidence: 85,
      originalFileUrl: 'documents/msg-1/invoice.pdf',
      source: 'ai',
      sourceEmailRef: 'email-log-123',
      notes: null,
      createdAt: 'SERVER_TIMESTAMP',
      updatedAt: 'SERVER_TIMESTAMP',
      suggestedWorkOrderId: 'wo-123',
      suggestedInventoryItemId: null,
      classificationReasoning: 'Matched to existing project based on vendor history.',
      isEstimatedConversion: false,
      conversionRate: null,
      conversionRateDate: null,
    };

    const result = transactionSchema.safeParse(validTxn);
    expect(result.success).toBe(true);
  });

  it('validates transaction with null sourceEmailRef', async () => {
    const { transactionSchema } = await import('../src/shared/schemas.js');

    const validTxn = {
      vendorName: 'Manual Vendor',
      amountAgora: 1000,
      currency: 'USD',
      date: new Date(),
      category: 'Overhead',
      workOrderId: null,
      inventoryItemId: null,
      status: 'approved',
      aiConfidence: null,
      originalFileUrl: null,
      source: 'manual',
      sourceEmailRef: null,
      notes: null,
      createdAt: 'SERVER_TIMESTAMP',
      updatedAt: 'SERVER_TIMESTAMP',
      suggestedWorkOrderId: null,
      suggestedInventoryItemId: null,
      classificationReasoning: null,
      isEstimatedConversion: true,
      conversionRate: 3.5,
      conversionRateDate: '2026-02-01',
    };

    const result = transactionSchema.safeParse(validTxn);
    expect(result.success).toBe(true);
  });
});
