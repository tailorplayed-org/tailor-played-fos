import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock firebase-admin/app ──
vi.mock('firebase-admin/app', () => ({
  initializeApp: vi.fn(),
}));

// ── Mock firebase-admin/firestore ──
const mockTransactionAdd = vi.fn().mockResolvedValue({ id: 'txn-ai-001' });
const mockCollection = vi.fn().mockReturnValue({ add: mockTransactionAdd });
const mockGetFirestore = vi.fn().mockReturnValue({ collection: mockCollection });
const mockUpdate = vi.fn().mockResolvedValue(undefined);

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

/** Mock Hebrew invoice Gemini response */
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
};

/** Mock English invoice Gemini response */
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

  it('processes received email_log and creates transaction (Hebrew invoice)', async () => {
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

    // Verify transaction created with correct fields
    expect(mockTransactionAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        vendorName: 'דפוס הנגב',
        amountAgora: 58000, // 580.00 * 100
        currency: 'ILS',
        category: 'DirectCost', // orders mailbox → DirectCost
        status: 'pending_review',
        source: 'ai',
        aiConfidence: 92,
        originalFileUrl: 'documents/msg-1/invoice.pdf',
        sourceEmailRef: 'email-log-001',
        workOrderId: null,
        inventoryItemId: null,
        notes: null,
      }),
    );

    // Verify email_log updated: processed + transactionId
    expect(mockUpdate).toHaveBeenCalledWith({
      status: 'processed',
      transactionId: 'txn-ai-001',
    });
  });

  it('processes English invoice with USD currency', async () => {
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
        category: 'InventoryRestock', // supplies mailbox
        aiConfidence: 97,
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

  it('maps mailbox to correct category', async () => {
    const mailboxTests = [
      { mailbox: 'orders', expected: 'DirectCost' },
      { mailbox: 'supplies', expected: 'InventoryRestock' },
      { mailbox: 'expenses', expected: 'Overhead' },
      { mailbox: 'developing', expected: 'DirectCost' },
    ];

    for (const { mailbox, expected } of mailboxTests) {
      vi.clearAllMocks();
      mockDownload.mockResolvedValue([Buffer.from('PDF')]);
      mockTransactionAdd.mockResolvedValue({ id: 'txn-cat' });
      mockGenerateContent.mockResolvedValueOnce({
        text: JSON.stringify(hebrewInvoiceResponse),
      });

      const { processDocument } = await import(
        '../src/ai/processDocument.js'
      );
      const handler = processDocument as unknown as (
        event: unknown,
      ) => Promise<void>;

      const event = createFirestoreEvent('received', mailbox);
      await handler(event);

      expect(mockTransactionAdd).toHaveBeenCalledWith(
        expect.objectContaining({ category: expected }),
      );
    }
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

    // Verify exact order of status updates
    const updateCalls = mockUpdate.mock.calls;
    expect(updateCalls[0][0]).toEqual({ status: 'processing' });
    expect(updateCalls[1][0]).toEqual({
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

  it('falls back to DirectCost for unknown mailbox', async () => {
    mockGenerateContent.mockResolvedValueOnce({
      text: JSON.stringify(hebrewInvoiceResponse),
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
      expect.objectContaining({ category: 'DirectCost' }),
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
    };

    const result = transactionSchema.safeParse(validTxn);
    expect(result.success).toBe(true);
  });
});
