import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock firebase-admin/app ──
vi.mock('firebase-admin/app', () => ({
  initializeApp: vi.fn(),
}));

// ── Mock firebase-admin/firestore ──
const mockAdd = vi.fn().mockResolvedValue({ id: 'doc-123' });
const mockGet = vi.fn().mockResolvedValue({ empty: true });
const mockLimit = vi.fn().mockReturnValue({ get: mockGet });
const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
const mockCollection = vi.fn().mockReturnValue({
  add: mockAdd,
  where: mockWhere,
});
const mockGetFirestore = vi.fn().mockReturnValue({
  collection: mockCollection,
});

vi.mock('firebase-admin/firestore', () => ({
  getFirestore: () => mockGetFirestore(),
  FieldValue: {
    serverTimestamp: vi.fn().mockReturnValue('SERVER_TIMESTAMP'),
  },
}));

// ── Mock firebase-admin/storage ──
const mockSave = vi.fn().mockResolvedValue(undefined);
const mockFile = vi.fn().mockReturnValue({ save: mockSave });
const mockBucket = vi.fn().mockReturnValue({ file: mockFile });
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

// ── Mock firebase-functions/pubsub ──
vi.mock('firebase-functions/pubsub', () => ({
  onMessagePublished: vi.fn(
    (_opts: unknown, handler: (event: unknown) => Promise<void>) => handler,
  ),
}));

// ── Mock googleapis ──
const mockMessagesGet = vi.fn();
const mockMessagesList = vi.fn();
const mockMessagesModify = vi.fn();
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
            list: mockMessagesList,
            modify: mockMessagesModify,
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

// ── Helpers ──
function createMockGmailMessage(
  messageId: string,
  toAddress: string,
  subject: string,
  from: string,
  hasAttachment = false,
) {
  const parts: Array<{
    filename?: string;
    mimeType?: string;
    body?: { attachmentId?: string };
  }> = [];

  if (hasAttachment) {
    parts.push({
      filename: 'invoice.pdf',
      mimeType: 'application/pdf',
      body: { attachmentId: 'att-001' },
    });
  }

  return {
    data: {
      id: messageId,
      payload: {
        headers: [
          { name: 'To', value: toAddress },
          { name: 'Subject', value: subject },
          { name: 'From', value: from },
        ],
        parts,
      },
    },
  };
}

function createPubSubEvent(emailAddress: string, historyId: number) {
  return {
    data: {
      message: {
        json: { emailAddress, historyId },
      },
    },
  };
}

// ── Tests ──

describe('gmailClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getEmailById', () => {
    it('fetches a full email message by ID', async () => {
      const mockMessage = createMockGmailMessage(
        'msg-123',
        'orders@tailorplayed.com',
        'Invoice #1234',
        'vendor@example.com',
      );
      mockMessagesGet.mockResolvedValueOnce(mockMessage);

      const { getEmailById } = await import('../src/email/gmailClient.js');
      const result = await getEmailById('msg-123');

      expect(mockMessagesGet).toHaveBeenCalledWith({
        userId: 'me',
        id: 'msg-123',
        format: 'full',
      });
      expect(result.id).toBe('msg-123');
    });

    it('throws with context on Gmail API failure', async () => {
      mockMessagesGet.mockRejectedValueOnce(new Error('API quota exceeded'));

      const { getEmailById } = await import('../src/email/gmailClient.js');
      await expect(getEmailById('msg-fail')).rejects.toThrow(
        'Failed to fetch email msg-fail: API quota exceeded',
      );
    });
  });

  describe('getAttachments', () => {
    it('downloads all attachments from a message', async () => {
      const mockMessage = createMockGmailMessage(
        'msg-456',
        'orders@tailorplayed.com',
        'Invoice',
        'vendor@example.com',
        true,
      );

      const base64Data = Buffer.from('PDF content').toString('base64');
      mockAttachmentsGet.mockResolvedValueOnce({
        data: { data: base64Data },
      });

      const { getAttachments } = await import('../src/email/gmailClient.js');
      const attachments = await getAttachments('msg-456', mockMessage.data);

      expect(attachments).toHaveLength(1);
      expect(attachments[0].filename).toBe('invoice.pdf');
      expect(attachments[0].mimeType).toBe('application/pdf');
      expect(attachments[0].data).toBeInstanceOf(Buffer);
      // Should NOT call messages.get (message already provided)
      expect(mockMessagesGet).not.toHaveBeenCalled();
    });

    it('returns empty array for messages without attachments', async () => {
      const mockMessage = createMockGmailMessage(
        'msg-789',
        'orders@tailorplayed.com',
        'No attachments',
        'vendor@example.com',
        false,
      );

      const { getAttachments } = await import('../src/email/gmailClient.js');
      const attachments = await getAttachments('msg-789', mockMessage.data);

      expect(attachments).toHaveLength(0);
    });

    it('throws with context on attachment download failure', async () => {
      const mockMessage = createMockGmailMessage(
        'msg-err',
        'orders@tailorplayed.com',
        'Error test',
        'vendor@example.com',
        true,
      );
      mockAttachmentsGet.mockRejectedValueOnce(new Error('Download failed'));

      const { getAttachments } = await import('../src/email/gmailClient.js');
      await expect(getAttachments('msg-err', mockMessage.data)).rejects.toThrow(
        'Failed to fetch attachments for msg-err',
      );
    });
  });

  describe('markAsRead', () => {
    it('removes UNREAD label from message', async () => {
      mockMessagesModify.mockResolvedValueOnce({});

      const { markAsRead } = await import('../src/email/gmailClient.js');
      await markAsRead('msg-read');

      expect(mockMessagesModify).toHaveBeenCalledWith({
        userId: 'me',
        id: 'msg-read',
        requestBody: {
          removeLabelIds: ['UNREAD'],
        },
      });
    });

    it('throws with context on Gmail API failure', async () => {
      mockMessagesModify.mockRejectedValueOnce(new Error('Modify failed'));

      const { markAsRead } = await import('../src/email/gmailClient.js');
      await expect(markAsRead('msg-fail')).rejects.toThrow(
        'Failed to mark email msg-fail as read',
      );
    });
  });

  describe('listUnreadMessages', () => {
    it('lists unread messages from inbox', async () => {
      mockMessagesList.mockResolvedValueOnce({
        data: {
          messages: [{ id: 'msg-1' }, { id: 'msg-2' }],
        },
      });

      const { listUnreadMessages } = await import(
        '../src/email/gmailClient.js'
      );
      const messages = await listUnreadMessages();

      expect(messages).toHaveLength(2);
      expect(mockMessagesList).toHaveBeenCalledWith({
        userId: 'me',
        q: 'is:unread',
        maxResults: 50,
      });
    });

    it('returns empty array when no unread messages', async () => {
      mockMessagesList.mockResolvedValueOnce({
        data: { messages: undefined },
      });

      const { listUnreadMessages } = await import(
        '../src/email/gmailClient.js'
      );
      const messages = await listUnreadMessages();

      expect(messages).toHaveLength(0);
    });
  });
});

describe('onEmailReceived', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: no existing email_log entries (fresh messages)
    mockGet.mockResolvedValue({ empty: true });
  });

  it('processes unread messages on Pub/Sub notification', async () => {
    // Setup: 1 unread message
    mockMessagesList.mockResolvedValueOnce({
      data: { messages: [{ id: 'msg-new-1' }] },
    });

    // Mock getEmailById (single call — getAttachments reuses the fetched message)
    const mockMessage = createMockGmailMessage(
      'msg-new-1',
      'orders@tailorplayed.com',
      'New Invoice',
      'vendor@example.com',
      false,
    );
    mockMessagesGet.mockResolvedValueOnce(mockMessage);
    mockMessagesModify.mockResolvedValueOnce({});

    const { onEmailReceived } = await import(
      '../src/email/onEmailReceived.js'
    );

    // onEmailReceived is the handler function (mocked onMessagePublished returns handler)
    const handler = onEmailReceived as unknown as (
      event: unknown,
    ) => Promise<void>;
    await handler(
      createPubSubEvent('orders@tailorplayed.com', 12345),
    );

    // Verify email_log document was created
    expect(mockAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        messageId: 'msg-new-1',
        mailbox: 'orders',
        status: 'received',
        subject: 'New Invoice',
        from: 'vendor@example.com',
        transactionId: null,
        errorMessage: null,
      }),
    );
  });

  it('uploads attachments to Firebase Storage', async () => {
    mockMessagesList.mockResolvedValueOnce({
      data: { messages: [{ id: 'msg-att-1' }] },
    });

    const mockMessage = createMockGmailMessage(
      'msg-att-1',
      'supplies@tailorplayed.com',
      'Receipt with attachment',
      'supplier@example.com',
      true,
    );
    // Single call for getEmailById — getAttachments reuses the fetched message
    mockMessagesGet.mockResolvedValueOnce(mockMessage);

    const base64Data = Buffer.from('PDF data').toString('base64');
    mockAttachmentsGet.mockResolvedValueOnce({
      data: { data: base64Data },
    });
    mockMessagesModify.mockResolvedValueOnce({});

    const { onEmailReceived } = await import(
      '../src/email/onEmailReceived.js'
    );
    const handler = onEmailReceived as unknown as (
      event: unknown,
    ) => Promise<void>;
    await handler(
      createPubSubEvent('supplies@tailorplayed.com', 12346),
    );

    // Verify storage upload
    expect(mockFile).toHaveBeenCalledWith('documents/msg-att-1/invoice.pdf');
    expect(mockSave).toHaveBeenCalledWith(expect.any(Buffer), {
      contentType: 'application/pdf',
    });

    // Verify email_log includes attachment paths
    expect(mockAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        attachmentUrls: ['documents/msg-att-1/invoice.pdf'],
        mailbox: 'supplies',
      }),
    );
  });

  it('skips duplicate messages (idempotent)', async () => {
    mockMessagesList.mockResolvedValueOnce({
      data: { messages: [{ id: 'msg-dup' }] },
    });

    // Simulate existing email_log for this messageId
    mockGet.mockResolvedValueOnce({ empty: false });

    const { onEmailReceived } = await import(
      '../src/email/onEmailReceived.js'
    );
    const handler = onEmailReceived as unknown as (
      event: unknown,
    ) => Promise<void>;
    await handler(createPubSubEvent('orders@tailorplayed.com', 12347));

    // Should NOT create a new email_log
    expect(mockAdd).not.toHaveBeenCalled();
    // Should NOT call getEmailById (skipped)
    expect(mockMessagesGet).not.toHaveBeenCalled();
  });

  it('creates email_log on error for zero email loss', async () => {
    mockMessagesList.mockResolvedValueOnce({
      data: { messages: [{ id: 'msg-error' }] },
    });

    // getEmailById will fail
    mockMessagesGet.mockRejectedValueOnce(new Error('Gmail API down'));

    const { onEmailReceived } = await import(
      '../src/email/onEmailReceived.js'
    );
    const handler = onEmailReceived as unknown as (
      event: unknown,
    ) => Promise<void>;

    // Should throw (for Cloud Functions retry) but still create email_log
    await expect(
      handler(createPubSubEvent('orders@tailorplayed.com', 12348)),
    ).rejects.toThrow();

    // Verify error email_log was created with 'failed' status and error message
    expect(mockAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        messageId: 'msg-error',
        status: 'failed',
        errorMessage: expect.stringContaining('Gmail API down'),
      }),
    );
  });

  it('handles no unread messages gracefully', async () => {
    mockMessagesList.mockResolvedValueOnce({
      data: { messages: undefined },
    });

    const { onEmailReceived } = await import(
      '../src/email/onEmailReceived.js'
    );
    const handler = onEmailReceived as unknown as (
      event: unknown,
    ) => Promise<void>;
    await handler(createPubSubEvent('orders@tailorplayed.com', 12349));

    // No email_log created, no errors
    expect(mockAdd).not.toHaveBeenCalled();
    expect(mockMessagesGet).not.toHaveBeenCalled();
  });

  it('detects mailbox from To header correctly', async () => {
    const mailboxTests = [
      { address: 'orders@tailorplayed.com', expected: 'orders' },
      { address: 'supplies@tailorplayed.com', expected: 'supplies' },
      { address: 'developing@tailorplayed.com', expected: 'developing' },
      { address: 'expenses@tailorplayed.com', expected: 'expenses' },
    ];

    for (const { address, expected } of mailboxTests) {
      vi.clearAllMocks();
      mockGet.mockResolvedValue({ empty: true });

      mockMessagesList.mockResolvedValueOnce({
        data: { messages: [{ id: `msg-${expected}` }] },
      });

      const mockMessage = createMockGmailMessage(
        `msg-${expected}`,
        address,
        'Test',
        'sender@example.com',
        false,
      );
      mockMessagesGet.mockResolvedValueOnce(mockMessage);
      mockMessagesModify.mockResolvedValueOnce({});

      const { onEmailReceived } = await import(
        '../src/email/onEmailReceived.js'
      );
      const handler = onEmailReceived as unknown as (
        event: unknown,
      ) => Promise<void>;
      await handler(createPubSubEvent(address, 99999));

      expect(mockAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          mailbox: expected,
        }),
      );
    }
  });

  it('detects mailbox from Delivered-To header when To is non-designated', async () => {
    vi.clearAllMocks();
    mockGet.mockResolvedValue({ empty: true });

    mockMessagesList.mockResolvedValueOnce({
      data: { messages: [{ id: 'msg-delivered-to' }] },
    });

    // Message where To header is external, but Delivered-To is a designated mailbox
    const mockMessage = {
      data: {
        id: 'msg-delivered-to',
        payload: {
          headers: [
            { name: 'To', value: 'external-list@googlegroups.com' },
            { name: 'Delivered-To', value: 'supplies@tailorplayed.com' },
            { name: 'Subject', value: 'Forwarded invoice' },
            { name: 'From', value: 'vendor@example.com' },
          ],
          parts: [],
        },
      },
    };
    mockMessagesGet.mockResolvedValueOnce(mockMessage);
    mockMessagesModify.mockResolvedValueOnce({});

    const { onEmailReceived } = await import(
      '../src/email/onEmailReceived.js'
    );
    const handler = onEmailReceived as unknown as (
      event: unknown,
    ) => Promise<void>;
    await handler(createPubSubEvent('supplies@tailorplayed.com', 99998));

    expect(mockAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        mailbox: 'supplies',
      }),
    );
  });
});

describe('emailLogSchema (server-side)', () => {
  it('validates a correct email_log document', async () => {
    const { emailLogSchema } = await import('../src/shared/schemas.js');

    const validDoc = {
      messageId: 'msg-123',
      mailbox: 'orders',
      receivedAt: { seconds: 1707350400, nanoseconds: 0 }, // Firestore Timestamp-like
      status: 'received',
      attachmentUrls: ['documents/msg-123/invoice.pdf'],
      subject: 'Invoice',
      from: 'vendor@example.com',
      transactionId: null,
      errorMessage: null,
    };

    const result = emailLogSchema.safeParse(validDoc);
    expect(result.success).toBe(true);
  });

  it('rejects invalid mailbox in server schema', async () => {
    const { emailLogSchema } = await import('../src/shared/schemas.js');

    const invalidDoc = {
      messageId: 'msg-123',
      mailbox: 'invalid',
      receivedAt: new Date(),
      status: 'received',
      attachmentUrls: [],
      subject: 'Test',
      from: 'test@test.com',
      transactionId: null,
      errorMessage: null,
    };

    const result = emailLogSchema.safeParse(invalidDoc);
    expect(result.success).toBe(false);
  });

  it('rejects invalid status in server schema', async () => {
    const { emailLogSchema } = await import('../src/shared/schemas.js');

    const invalidDoc = {
      messageId: 'msg-123',
      mailbox: 'orders',
      receivedAt: new Date(),
      status: 'invalid-status',
      attachmentUrls: [],
      subject: 'Test',
      from: 'test@test.com',
      transactionId: null,
      errorMessage: null,
    };

    const result = emailLogSchema.safeParse(invalidDoc);
    expect(result.success).toBe(false);
  });

  it('accepts Firestore Timestamp for receivedAt (z.any)', async () => {
    const { emailLogSchema } = await import('../src/shared/schemas.js');

    const firestoreTimestamp = {
      seconds: 1707350400,
      nanoseconds: 0,
      toDate: () => new Date(1707350400 * 1000),
    };

    const validDoc = {
      messageId: 'msg-ts',
      mailbox: 'expenses',
      receivedAt: firestoreTimestamp,
      status: 'processing',
      attachmentUrls: [],
      subject: 'Expense',
      from: 'vendor@example.com',
      transactionId: null,
      errorMessage: null,
    };

    const result = emailLogSchema.safeParse(validDoc);
    expect(result.success).toBe(true);
  });
});

describe('DESIGNATED_MAILBOXES and EMAIL_STATUSES (server-side)', () => {
  it('server-side DESIGNATED_MAILBOXES matches client-side', async () => {
    const { DESIGNATED_MAILBOXES } = await import('../src/shared/schemas.js');

    expect(DESIGNATED_MAILBOXES).toEqual([
      'orders',
      'supplies',
      'developing',
      'expenses',
    ]);
  });

  it('server-side EMAIL_STATUSES matches client-side', async () => {
    const { EMAIL_STATUSES } = await import('../src/shared/schemas.js');

    expect(EMAIL_STATUSES).toEqual([
      'received',
      'processing',
      'processed',
      'unprocessed',
      'failed',
    ]);
  });
});
