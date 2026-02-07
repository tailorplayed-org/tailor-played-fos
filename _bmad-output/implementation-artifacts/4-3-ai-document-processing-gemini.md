# Story 4.3: AI Document Processing with Gemini

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **system**,
I want to send financial documents to Gemini 2.5 Pro and extract structured data,
So that invoices and receipts are automatically parsed into usable financial records.

## Acceptance Criteria

1. **Firestore onCreate Trigger**: When a new `email_log` document is created with `status: 'received'`, a Firestore `onDocumentCreated` trigger fires the `processDocument` Cloud Function. The function immediately updates `email_log.status` to `'processing'`.

2. **Gemini 2.5 Pro Integration**: The Cloud Function sends the document (PDF, JPG, PNG, or HTML) to Gemini 2.5 Pro via the `@google/genai` SDK (v1.40.0). The prompt instructs Gemini to extract: vendor name, date, total amount, currency (ILS/USD/EUR), line items (description + amount each), document type (invoice, receipt, quote), and language detected (Hebrew/English/mixed). Gemini returns structured JSON via `responseMimeType: "application/json"` + `responseJsonSchema`. The API key is read from Cloud Functions environment config (ARCH-8, NFR8).

3. **Gemini Client Wrapper**: `functions/src/ai/geminiClient.ts` exports `parseFinancialDocument(documentUrl: string, mimeType: string): Promise<ParsedDocument>`. It handles PDF, JPG, PNG, and HTML content types. Timeout is set to 25 seconds (within 30s NFR4 budget, leaving 5s for Firestore writes).

4. **Hebrew Invoice Processing**: Hebrew invoices (e.g., "חשבונית מס" from a local supplier) are processed correctly — vendor name extracted in Hebrew, amounts parsed correctly (₪ symbol, Israeli number format), date parsed as DD/MM/YYYY (Israeli convention).

5. **English Invoice Processing**: English invoices (e.g., Game Crafter, USD) are processed correctly — vendor name, amounts ($ symbol), and dates extracted correctly. Currency is identified as USD.

6. **Transaction Document Creation**: A new `transactions` document is created in Firestore with: `vendorName`, `amountAgora` (converted to integer), `currency`, `date`, `category` (preliminary based on mailbox/document context), `status: 'pending_review'`, `source: 'ai'`, `aiConfidence` (from Gemini), `originalFileUrl` (Storage path from email_log), `sourceEmailRef` (email_log ID). The `email_log.status` updates to `'processed'` and `email_log.transactionId` links to the created transaction.

7. **End-to-End Performance**: Processing completes in < 30 seconds from email_log creation to pending transaction in Firestore (NFR4).

8. **Error Handling**: If Gemini fails or returns unparseable data, `email_log.status` updates to `'unprocessed'` with `errorMessage` describing the failure. The original document is preserved in Firebase Storage. No data loss occurs.

## Tasks / Subtasks

- [x] Task 1: Add `sourceEmailRef` field to transaction schema (AC: #6)
  - [x] Add `sourceEmailRef: z.string().nullable()` to `transactionSchema` in `src/types/transaction.ts`
  - [x] Add `sourceEmailRef: z.string().nullable()` to server schema in `functions/src/shared/schemas.ts`
  - [x] Update existing test fixtures that create Transaction objects

- [x] Task 2: Add Gemini API key config + ParsedDocument schema (AC: #2, #3)
  - [x] Add `geminiApiKey = defineSecret('GEMINI_API_KEY')` to `functions/src/config.ts`
  - [x] Add `ParsedDocument` Zod schema + type to `functions/src/shared/schemas.ts`
  - [x] Add `ParsedLineItem` type to `functions/src/shared/types.ts`

- [x] Task 3: Install `@google/genai` + `zod-to-json-schema` in functions (AC: #2)
  - [x] `cd functions && npm install @google/genai zod-to-json-schema`
  - [x] Verify both packages install correctly

- [x] Task 4: Implement `functions/src/ai/geminiClient.ts` — Gemini wrapper (AC: #2, #3, #4, #5)
  - [x] Create `GoogleGenAI` client with API key from config
  - [x] Implement `parseFinancialDocument(documentUrl, mimeType)` function
  - [x] Build extraction prompt for Hebrew + English financial documents
  - [x] Use structured output (responseMimeType + responseJsonSchema from Zod)
  - [x] Set 25s timeout on Gemini call
  - [x] Download document from Firebase Storage into memory for Gemini
  - [x] Parse and validate Gemini response against ParsedDocument schema
  - [x] Handle errors: timeout, rate limit, parse failure

- [x] Task 5: Implement `functions/src/ai/processDocument.ts` — Firestore trigger (AC: #1, #6, #7, #8)
  - [x] Use `onDocumentCreated` from `firebase-functions/firestore` on `email_log/{docId}`
  - [x] Guard: only process documents with `status: 'received'`
  - [x] Update email_log status to `'processing'`
  - [x] Download document from Firebase Storage
  - [x] Call `parseFinancialDocument` with document content
  - [x] Convert parsed amount to agora (integer) using currency utility
  - [x] Create `transactions` document with all required fields
  - [x] Update email_log: `status: 'processed'`, `transactionId`
  - [x] Error path: update email_log `status: 'unprocessed'`, set `errorMessage`

- [x] Task 6: Update `functions/src/index.ts` — export processDocument (AC: all)
  - [x] Import and re-export `processDocument`

- [x] Task 7: Tests (AC: all)
  - [x] Create `functions/tests/ai.test.ts` — test processDocument + geminiClient
  - [x] Test successful parse of Hebrew invoice mock
  - [x] Test successful parse of English invoice mock
  - [x] Test transaction creation with correct field mapping
  - [x] Test email_log status transitions (received → processing → processed)
  - [x] Test error handling (Gemini timeout, parse failure, invalid response)
  - [x] Test amount-to-agora conversion
  - [x] Update `src/types/transaction.test.ts` — test sourceEmailRef field
  - [x] Ensure all existing tests pass (zero regressions)

- [x] Task 8: Build Verification (AC: all)
  - [x] `cd functions && npx tsc --noEmit` — zero TypeScript errors in functions
  - [x] `npm run test` — all client-side tests pass, zero regressions
  - [x] `cd functions && npm run test` — all functions tests pass

## Dev Notes

### Architecture Compliance

- **Cloud Functions 2nd Gen**: Use `onDocumentCreated` from `firebase-functions/firestore` (NOT the deprecated 1st gen `functions.firestore.document().onCreate()`). This is the 2nd gen Firestore trigger API from `firebase-functions@^6.3.2`. [Source: architecture.md#Cloud-Functions-Inventory]
- **`@google/genai` SDK (NOT `@google/generative-ai`)**: The old `@google/generative-ai` package is **DEPRECATED** (EOL August 2025). The new official SDK is `@google/genai` v1.40.0. Entry point: `new GoogleGenAI({ apiKey })`. Model name: `"gemini-2.5-pro"`. [Source: npmjs.com/@google/genai, ai.google.dev/gemini-api/docs/structured-output]
- **Structured Output via JSON Schema**: Use `responseMimeType: "application/json"` + `responseJsonSchema` (from `zod-to-json-schema`). Do NOT use the old "function calling" approach for data extraction. [Source: ai.google.dev/gemini-api/docs/structured-output]
- **Firebase Admin SDK**: `getFirestore()` from `firebase-admin/firestore`, `getStorage()` from `firebase-admin/storage`. Already initialized in `functions/src/index.ts` via `initializeApp()`. [Source: architecture.md#Cloud-Functions-Boundary]
- **Separate npm package**: `functions/` has its own `package.json`. No shared runtime with client. Zod schemas shared via manual copy. [Source: architecture.md#Cloud-Functions-Boundary]
- **NodeNext module resolution**: ALL relative imports in `functions/` MUST use `.js` extensions: `../config.js`, `../shared/schemas.js`, `./geminiClient.js`. Without them, runtime fails with `ERR_MODULE_NOT_FOUND`. [Source: functions/tsconfig.json]
- **Naming conventions**: Cloud Functions: `camelCase`, verb-first → `processDocument`. Firestore collections: `snake_case` → `email_log`, `transactions`. Document fields: `camelCase` → `sourceEmailRef`, `aiConfidence`. [Source: architecture.md#Naming-Patterns]
- **Integer currency**: All amounts stored in agora/cents (integer). Use the currency conversion utility pattern: `Math.round(parsedAmount * 100)` for ILS (agora), USD (cents), EUR (cents). [Source: architecture.md#Data-Integrity, lib/currency.ts]
- **Data flow**: Firestore document → Zod schema parse → TypeScript type → Zustand store → React component. Server-side: raw data → Zod validation → Firestore write. [Source: architecture.md#Data-Flow-Patterns]
- **Error handling**: Failed AI parses → `status: 'unprocessed'` preserved with error. Cloud Logging via `firebase-functions/logger`. Never `console.log`. [Source: architecture.md#Error-Handling]
- **Co-located tests**: Functions tests in `functions/tests/`. Client tests co-located: `src/types/transaction.test.ts`. [Source: architecture.md#Testing-Standards]
- **Security**: Gemini API key stored as Cloud Functions secret via `defineSecret('GEMINI_API_KEY')`. Never client-side. Never committed to git. [Source: architecture.md#Authentication-Security]

### Critical Technical Constraints

- **Packages already installed in `functions/`:**
  - `firebase-admin@^13.4.0` — Firestore, Storage admin SDK
  - `firebase-functions@^6.3.2` — 2nd gen Cloud Functions API
  - `googleapis@^171.4.0` — Gmail API client (Story 4.1)
  - `zod@^4.3.6` — Schema validation
  - `vitest@^4.0.18` — Test runner (dev)
  - `typescript@~5.9.3` — TypeScript compiler

- **NEW npm dependencies needed in `functions/`:**
  - `@google/genai` (latest, currently v1.40.0) — New official Gemini SDK. **DO NOT use the deprecated `@google/generative-ai` package.**
  - `zod-to-json-schema` (latest) — Converts Zod schemas to JSON Schema for Gemini structured output. Required because `@google/genai` accepts JSON Schema, not Zod directly.

- **NO new npm dependencies needed in client `package.json`** — this story only adds server-side AI processing. Client changes limited to adding `sourceEmailRef` to transaction schema.

- **Existing `functions/` files to MODIFY:**
  - `functions/src/index.ts` — Add `processDocument` export
  - `functions/src/config.ts` — Add `geminiApiKey` secret
  - `functions/src/shared/schemas.ts` — Add `parsedDocumentSchema`, add `transactionSchema` with `sourceEmailRef`
  - `functions/src/shared/types.ts` — Add `ParsedDocument`, `ParsedLineItem` types
  - `functions/package.json` — Add `@google/genai` and `zod-to-json-schema`

- **Existing client files to MODIFY:**
  - `src/types/transaction.ts` — Add `sourceEmailRef: z.string().nullable()` to `transactionSchema`

- **Files to CREATE:**
  - `functions/src/ai/processDocument.ts` — Firestore onCreate trigger Cloud Function
  - `functions/src/ai/geminiClient.ts` — Gemini 2.5 Pro wrapper
  - `functions/tests/ai.test.ts` — AI processing tests

- **Files NOT to modify:**
  - `functions/src/email/gmailClient.ts` — Gmail API wrapper, no changes
  - `functions/src/email/onEmailReceived.ts` — Email ingestion, no changes
  - `src/types/email.ts` — Email schema, no changes for this story
  - `src/services/firebase.ts` — Client Firebase init, complete
  - Any client-side components, hooks, stores, or pages — server-side story
  - `functions/tsconfig.json` — NodeNext config is correct

### Gemini Client Design

```typescript
// functions/src/ai/geminiClient.ts
import { GoogleGenAI } from '@google/genai';
import { getStorage } from 'firebase-admin/storage';
import * as logger from 'firebase-functions/logger';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { geminiApiKey } from '../config.js';
import { parsedDocumentSchema, type ParsedDocument } from '../shared/schemas.js';

const GEMINI_MODEL = 'gemini-2.5-pro';
const GEMINI_TIMEOUT_MS = 25_000; // 25s — leaves 5s for Firestore writes within 30s NFR4 budget

/**
 * Downloads a document from Firebase Storage and sends it to Gemini 2.5 Pro
 * for structured financial data extraction (Hebrew + English bilingual).
 */
export async function parseFinancialDocument(
  documentUrl: string,
  mimeType: string
): Promise<ParsedDocument> {
  const ai = new GoogleGenAI({ apiKey: geminiApiKey.value() });

  // Download document from Firebase Storage
  const storage = getStorage();
  const bucket = storage.bucket();
  const file = bucket.file(documentUrl);
  const [buffer] = await file.download();
  const base64Data = buffer.toString('base64');

  // Build extraction prompt
  const prompt = buildExtractionPrompt();

  // Call Gemini with structured output
  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: [
      {
        role: 'user',
        parts: [
          { inlineData: { mimeType, data: base64Data } },
          { text: prompt },
        ],
      },
    ],
    config: {
      responseMimeType: 'application/json',
      responseJsonSchema: zodToJsonSchema(parsedDocumentSchema),
      // timeout handled via AbortController
    },
  });

  // Parse and validate response
  const rawText = response.text;
  if (!rawText) {
    throw new Error('Gemini returned empty response');
  }

  const parsed = JSON.parse(rawText);
  const validated = parsedDocumentSchema.parse(parsed);

  logger.info('Document parsed successfully', {
    vendorName: validated.vendorName,
    currency: validated.currency,
    documentType: validated.documentType,
    languageDetected: validated.languageDetected,
  });

  return validated;
}

function buildExtractionPrompt(): string {
  return `You are a financial document parser for a small business (TailorPlayed — custom board game company).
Extract structured data from this financial document. The document may be in Hebrew, English, or mixed.

EXTRACTION RULES:
- vendorName: Extract the vendor/supplier/company name exactly as written (preserve Hebrew characters)
- date: Extract the document date in ISO 8601 format (YYYY-MM-DD). For Israeli dates (DD/MM/YYYY), convert correctly.
- totalAmount: Extract the total amount as a decimal number (e.g., 82.50, not 8250). Include tax if it's part of the total.
- currency: Identify the currency. Use "ILS" for ₪/שקל/שח, "USD" for $/dollars, "EUR" for €/euros. Default to "ILS" if unclear.
- lineItems: Extract individual line items with description and amount. If no line items are visible, return an empty array.
- documentType: Classify as "invoice", "receipt", or "quote" based on document headers and content.
- languageDetected: "hebrew", "english", or "mixed" based on the primary language of the document.
- confidence: Your confidence in the extraction accuracy (0-100). Lower confidence for blurry images, partial documents, or ambiguous fields.

IMPORTANT:
- For Hebrew documents: ₪ or שקל or שח means ILS currency
- Israeli date format is DD/MM/YYYY — convert to YYYY-MM-DD
- Amounts should be the final total including VAT/tax if present
- If you cannot extract a field, use reasonable defaults (empty string for text, 0 for numbers, empty array for lineItems)`;
}
```

**CRITICAL NOTES:**
- `GoogleGenAI` is the entry point from `@google/genai` (NOT `GoogleGenerativeAI` from the deprecated package)
- `geminiApiKey.value()` reads the secret at function execution time (secrets available only during execution in Cloud Functions)
- Documents are downloaded from Firebase Storage as buffers, base64-encoded, and sent as `inlineData` with the correct `mimeType`
- The `responseJsonSchema` uses `zodToJsonSchema()` to convert the Zod schema to JSON Schema format that Gemini accepts
- The 25s timeout should be enforced via AbortController or request-level timeout configuration

### ParsedDocument Schema Design

```typescript
// Add to functions/src/shared/schemas.ts
export const parsedLineItemSchema = z.object({
  description: z.string(),
  amountRaw: z.number(), // Raw decimal amount (not agora)
});

export const parsedDocumentSchema = z.object({
  vendorName: z.string(),
  date: z.string(), // ISO 8601 format: YYYY-MM-DD
  totalAmount: z.number(), // Raw decimal (e.g., 82.50) — converted to agora later
  currency: z.enum(['ILS', 'USD', 'EUR']),
  lineItems: z.array(parsedLineItemSchema),
  documentType: z.enum(['invoice', 'receipt', 'quote']),
  languageDetected: z.enum(['hebrew', 'english', 'mixed']),
  confidence: z.number().min(0).max(100),
});

export type ParsedDocument = z.infer<typeof parsedDocumentSchema>;
export type ParsedLineItem = z.infer<typeof parsedLineItemSchema>;
```

**CRITICAL**: This schema is used for Gemini structured output. It defines what Gemini extracts. The `totalAmount` is a raw decimal (82.50), NOT agora. Conversion to agora happens in `processDocument` when creating the Firestore transaction document.

### processDocument Cloud Function Design

```typescript
// functions/src/ai/processDocument.ts
import { onDocumentCreated } from 'firebase-functions/firestore';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import * as logger from 'firebase-functions/logger';
import { parseFinancialDocument } from './geminiClient.js';
import { geminiApiKey } from '../config.js';

// Category heuristic based on mailbox context (refined in Story 4.4)
const MAILBOX_CATEGORY_MAP: Record<string, string> = {
  orders: 'DirectCost',
  supplies: 'InventoryRestock',
  expenses: 'Overhead',
  developing: 'DirectCost',
};

export const processDocument = onDocumentCreated(
  {
    document: 'email_log/{docId}',
    secrets: [geminiApiKey],
  },
  async (event) => {
    const db = getFirestore();
    const snapshot = event.data;
    if (!snapshot) {
      logger.error('No data in event');
      return;
    }

    const emailLogData = snapshot.data();
    const emailLogRef = snapshot.ref;

    // Guard: only process 'received' status
    if (emailLogData.status !== 'received') {
      logger.info('Skipping email_log — status is not received', {
        status: emailLogData.status,
        docId: event.params.docId,
      });
      return;
    }

    try {
      // 1. Update status to 'processing'
      await emailLogRef.update({ status: 'processing' });

      // 2. Get first attachment URL
      const attachmentUrls: string[] = emailLogData.attachmentUrls ?? [];
      if (attachmentUrls.length === 0) {
        throw new Error('No attachments found in email_log');
      }
      const documentUrl = attachmentUrls[0]; // Process first attachment
      const mimeType = guessMimeType(documentUrl);

      // 3. Call Gemini for AI extraction
      const parsed = await parseFinancialDocument(documentUrl, mimeType);

      // 4. Convert amount to agora (integer)
      const amountAgora = Math.round(parsed.totalAmount * 100);

      // 5. Determine preliminary category from mailbox
      const category = MAILBOX_CATEGORY_MAP[emailLogData.mailbox] ?? 'DirectCost';

      // 6. Parse date
      const parsedDate = new Date(parsed.date);

      // 7. Create transaction document
      const transactionRef = await db.collection('transactions').add({
        vendorName: parsed.vendorName,
        amountAgora,
        currency: parsed.currency,
        date: parsedDate,
        category,
        workOrderId: null,       // Set by Story 4.4 classification
        inventoryItemId: null,   // Set by Story 4.4 classification
        status: 'pending_review',
        aiConfidence: parsed.confidence,
        originalFileUrl: documentUrl,
        source: 'ai',
        sourceEmailRef: event.params.docId,
        notes: null,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      // 8. Update email_log: processed + transaction link
      await emailLogRef.update({
        status: 'processed',
        transactionId: transactionRef.id,
      });

      logger.info('Document processed successfully', {
        emailLogId: event.params.docId,
        transactionId: transactionRef.id,
        vendorName: parsed.vendorName,
        amountAgora,
        currency: parsed.currency,
        confidence: parsed.confidence,
      });

    } catch (error) {
      // Error path: mark as 'unprocessed', preserve error details
      logger.error('processDocument failed', {
        docId: event.params.docId,
        error: error instanceof Error ? error.message : String(error),
      });

      await emailLogRef.update({
        status: 'unprocessed',
        errorMessage: error instanceof Error ? error.message : String(error),
      });
      // Do NOT re-throw — let retry function (Story 4.5) handle retries
    }
  }
);

function guessMimeType(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf': return 'application/pdf';
    case 'jpg':
    case 'jpeg': return 'image/jpeg';
    case 'png': return 'image/png';
    case 'html': return 'text/html';
    default: return 'application/octet-stream';
  }
}
```

**CRITICAL IMPLEMENTATION NOTES:**

1. **Status guard**: `processDocument` only processes email_log documents with `status: 'received'`. Other statuses (failed, processing, processed) are skipped. This prevents reprocessing and handles idempotency.

2. **No re-throw on error**: Unlike `onEmailReceived` which re-throws to trigger Cloud Functions retry, `processDocument` catches errors and sets `status: 'unprocessed'`. The retry scheduled function (Story 4.5) handles retries explicitly. Re-throwing would cause Cloud Functions automatic retry which may conflict with the retry strategy.

3. **Amount conversion**: `Math.round(parsed.totalAmount * 100)` converts decimal to agora. This works for ILS (agora), USD (cents), and EUR (cents). Rounding handles floating-point precision.

4. **Mailbox-based category**: Preliminary category is derived from the email mailbox. Story 4.4 will refine this with Gemini-based classification, vendor history, and confidence scoring.

5. **First attachment only**: For MVP, process only the first attachment. Multiple attachments could be handled in a future enhancement or Story 4.5.

6. **Date parsing**: `new Date(parsed.date)` parses the ISO 8601 string from Gemini. The prompt instructs Gemini to return ISO format (YYYY-MM-DD).

### Transaction Schema Update

```typescript
// Add to src/types/transaction.ts
export const transactionSchema = z.object({
  id: z.string(),
  vendorName: z.string().min(1, 'Vendor name is required'),
  amountAgora: z.number().int(),
  currency: z.enum(['ILS', 'USD', 'EUR']),
  date: z.date(),
  category: z.enum(TRANSACTION_CATEGORIES),
  workOrderId: z.string().nullable(),
  inventoryItemId: z.string().nullable(),
  status: z.enum(TRANSACTION_STATUSES),
  aiConfidence: z.number().nullable(),
  originalFileUrl: z.string().nullable(),
  source: z.enum(TRANSACTION_SOURCES),
  sourceEmailRef: z.string().nullable(), // Links to email_log document ID (Story 4.3)
  notes: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
```

**CRITICAL**: The server-side transaction schema in `functions/src/shared/schemas.ts` must also add `sourceEmailRef`. Use `z.any()` for timestamp fields on the server side (same pattern as email_log).

### Functions Index Update

```typescript
// functions/src/index.ts
import { initializeApp } from 'firebase-admin/app';

// Initialize Firebase Admin SDK (must be first, before function imports)
initializeApp();

// Export Cloud Functions
export { onEmailReceived } from './email/onEmailReceived.js';
export { processDocument } from './ai/processDocument.js';
```

### Config Update

```typescript
// Add to functions/src/config.ts
import { defineSecret, defineString } from 'firebase-functions/params';

// Gmail OAuth credentials (Story 4.1)
export const gmailClientId = defineSecret('GMAIL_CLIENT_ID');
export const gmailClientSecret = defineSecret('GMAIL_CLIENT_SECRET');
export const gmailRefreshToken = defineSecret('GMAIL_REFRESH_TOKEN');

// Email config (Story 4.1)
export const gmailUserEmail = defineString('GMAIL_USER_EMAIL', {
  default: 'orders@tailorplayed.com',
});

// Paperless config (Story 4.2)
export const paperlessEmail = defineString('PAPERLESS_EMAIL', {
  default: '',
});

// Gemini AI config (Story 4.3)
export const geminiApiKey = defineSecret('GEMINI_API_KEY');
```

**IMPORTANT**: Use `defineSecret` (not `defineString`) for the Gemini API key. Secrets are encrypted at rest. The `processDocument` function must declare `secrets: [geminiApiKey]` in its options.

### Project Structure Notes

**Files to CREATE:**

| File | Purpose |
|---|---|
| `functions/src/ai/processDocument.ts` | Firestore onCreate trigger: AI document processing |
| `functions/src/ai/geminiClient.ts` | Gemini 2.5 Pro wrapper (parseFinancialDocument) |
| `functions/tests/ai.test.ts` | AI processing tests |

**Files to MODIFY:**

| File | Change |
|---|---|
| `src/types/transaction.ts` | Add `sourceEmailRef: z.string().nullable()` to transactionSchema |
| `functions/src/index.ts` | Add `processDocument` export |
| `functions/src/config.ts` | Add `geminiApiKey` secret via `defineSecret` |
| `functions/src/shared/schemas.ts` | Add `parsedDocumentSchema`, `parsedLineItemSchema`, server-side `transactionSchema` with `sourceEmailRef` |
| `functions/src/shared/types.ts` | Add `ParsedDocument`, `ParsedLineItem` type exports |
| `functions/package.json` | Add `@google/genai`, `zod-to-json-schema` |

**Files NOT to modify:**

- `functions/src/email/gmailClient.ts` — Gmail wrapper, no changes
- `functions/src/email/onEmailReceived.ts` — Email ingestion, no changes
- `functions/tsconfig.json` — NodeNext config is correct
- `src/types/email.ts` — Email schema, no changes
- `src/types/index.ts` — Already exports `./transaction`
- Any client-side components, hooks, stores, or pages — server-side story

### Previous Story Intelligence (Stories 4.1 + 4.2)

**Key patterns and learnings:**

- **`initializeApp()` is already called** at the top of `functions/src/index.ts`. Do NOT call it again. Just add the new export.
- **Import paths require `.js` extension**: `../config.js`, `../shared/schemas.js`, `./geminiClient.js`. Without them, NodeNext module resolution fails at runtime.
- **`vi.mock` pattern for external dependencies** in tests. Mock `@google/genai`, `firebase-admin/firestore`, `firebase-admin/storage`, `firebase-functions/logger`.
- **OAuth2 mock pitfall**: `vi.fn().mockImplementation()` arrow functions are NOT constructors in Vitest — use `class MockClass` pattern for `GoogleGenAI` mock.
- **`FieldValue.serverTimestamp()` for timestamps** — use in `createdAt`, `updatedAt` fields.
- **Zod 4 `.default()` creates type divergence** — DO NOT use `.default()` on schemas. Define all fields explicitly.
- **Test counts**: 629 client-side tests + 25 functions tests = 654 total currently passing. Zero regressions required.
- **`getAttachments(messageId, message)` in gmailClient.ts** takes both params to avoid double API call. Don't break this.
- **`convertTimestamps` utility** on client side handles Firestore Timestamp → JS Date conversion before Zod validation.
- **Vitest config** for functions already exists at `functions/vitest.config.ts`.
- **`sass-embedded` dispatcher race condition on `npm run build`** is pre-existing — not a regression.

**From Story 4.2 specifically:**
- `paperlessForwarded: true` is set unconditionally on all email_log documents (both success + error paths)
- 629 client + 25 functions = 654 total tests passing

### Git Intelligence

**Most recent commits:**
- `4a761e3` — Implement Story 4.2: Paperless Auto-Forward with code review fixes
- `95177a4` — Implement Story 4.1: Gmail API Integration & Email Detection with code review fixes
- `7db541a` — Implement Story 3.3: Real-Time Dashboard Data Layer with code review fixes

**Established code patterns:**
- Single comprehensive commit per story
- `vi.mock` for external dependencies in tests
- Test structure: `describe` blocks by function/component, `it`/`test` cases for success/error paths
- Barrel exports with `index.ts` for every directory
- `useMemo` for all derived data in hooks

**Files modified in Story 4.1/4.2 that are relevant:**
- `functions/src/index.ts` — needs processDocument export added
- `functions/src/config.ts` — needs geminiApiKey secret added
- `functions/src/shared/schemas.ts` — needs parsedDocumentSchema added
- `functions/src/shared/types.ts` — needs ParsedDocument types added

### Latest Technical Information

**@google/genai v1.40.0 (NEW — replaces deprecated @google/generative-ai):**
- `new GoogleGenAI({ apiKey })` — create client instance
- `ai.models.generateContent({ model, contents, config })` — generate content
- Structured output: `config.responseMimeType = "application/json"` + `config.responseJsonSchema` accepts JSON Schema object
- Use `zod-to-json-schema` to convert Zod schemas: `zodToJsonSchema(myZodSchema)`
- Model name: `"gemini-2.5-pro"` for Gemini 2.5 Pro
- Supports inline data: `{ inlineData: { mimeType: "application/pdf", data: base64String } }`
- Supports image inputs: JPG, PNG via inlineData
- Response: `response.text` returns the JSON string
- **CRITICAL**: Import is `import { GoogleGenAI } from '@google/genai'` (NOT `GoogleGenerativeAI`)
- Requires Node.js 20+ (functions already configured for Node 20)

**Gemini 2.5 Pro Document Processing:**
- Supports PDF (up to 1000 pages), JPG, PNG, HTML natively
- OCR capability for scanned documents and photos
- Bilingual (Hebrew + English) extraction
- Structured JSON output guaranteed to match provided schema
- 1,048,576 input tokens, 65,535 output tokens
- Confidence scoring is not built-in to the API — must be requested in the prompt

**firebase-functions v6.3.2 (2nd gen Cloud Functions):**
- `onDocumentCreated(pathOrOptions, handler)` — Firestore onCreate for 2nd gen
- Handler receives `event` with `event.data` (DocumentSnapshot) and `event.params`
- Secrets: pass in options `{ document: 'path/{id}', secrets: [secretRef] }`
- Logger: `import * as logger from 'firebase-functions/logger'`

**zod-to-json-schema (latest):**
- `import { zodToJsonSchema } from 'zod-to-json-schema'`
- Converts Zod schema → JSON Schema object compatible with Gemini's `responseJsonSchema`
- Works with Zod 4 (version alignment with project's zod@^4.3.6)

### Potential Pitfalls to Avoid

1. **DO NOT use `@google/generative-ai`** — it is DEPRECATED (EOL August 2025). The import is `@google/genai`, class is `GoogleGenAI` (not `GoogleGenerativeAI`). This is the #1 most likely mistake.

2. **DO NOT forget `.js` extensions** in function imports. `../config.js`, `../shared/schemas.js`, `./geminiClient.js`. Runtime fails with `ERR_MODULE_NOT_FOUND` without them.

3. **DO NOT use `console.log`** in Cloud Functions. Use `firebase-functions/logger` for structured logging.

4. **DO NOT call `initializeApp()` again** in processDocument or geminiClient. It's already called in `functions/src/index.ts`.

5. **DO NOT re-throw errors** in processDocument's catch block. Set `status: 'unprocessed'` and return. The retry function (Story 4.5) handles retries. Re-throwing triggers Cloud Functions automatic retry which conflicts with the retry strategy.

6. **DO NOT use `z.number().default(0)` or any `.default()`** on Zod schemas. Zod 4 `.default()` creates input/output type divergence. Define all fields explicitly.

7. **DO NOT store signed URLs** for documents. Use Firebase Storage paths (e.g., `documents/{emailId}/invoice.pdf`). Signed URLs expire.

8. **DO NOT modify `functions/src/email/onEmailReceived.ts`** or `functions/src/email/gmailClient.ts`. This story adds a NEW function, it does not modify the email ingestion pipeline.

9. **Handle missing/empty Gemini responses**: Gemini may return empty text, null candidates, or malformed JSON. Validate with Zod parse and catch errors.

10. **Amount precision**: `Math.round(parsed.totalAmount * 100)` handles floating-point. Do NOT use `parseInt` or `Math.floor` — `Math.round` is the correct conversion.

11. **`processDocument` must declare `secrets`**: The function options must include `secrets: [geminiApiKey]` so the secret is available at runtime. Without this, `geminiApiKey.value()` will fail.

12. **Gemini model name**: Use `"gemini-2.5-pro"` (with the dash and dots). NOT `"gemini-2.5-pro-latest"` or other variations.

13. **Test mocking for `GoogleGenAI`**: The class constructor pattern requires careful mocking. Use `vi.mock('@google/genai', () => ({ GoogleGenAI: vi.fn().mockImplementation(() => ({ models: { generateContent: vi.fn() } })) }))` or a class-based mock similar to the OAuth2 mock pattern from Story 4.1.

14. **Firebase Storage download**: Use `bucket.file(path).download()` which returns `[Buffer]`. Convert to base64 with `buffer.toString('base64')`. Do NOT use getSignedUrl for the download path.

15. **`onDocumentCreated` event shape**: The event has `event.data` (DocumentSnapshot, can be null), `event.params` (route params like `docId`), and `event.id`. Always null-check `event.data` before accessing.

### Cross-Story Context

This is **Story 4.3** — the third story in Epic 4 (Email Ingestion & AI Document Processing):

- **Epic 1** (DONE): Project scaffold, design system, auth, app shell, i18n, shared components
- **Epic 2** (DONE): Work Order CRUD, status lifecycle, manual transactions, Nutrition Label, detail page
- **Epic 3** (DONE): Dashboard, KPI cards, project health table, real-time data layer
- **Epic 4** (IN PROGRESS):
  - Story 4.1 (REVIEW): Gmail API Integration & Email Detection — pipeline foundation
  - Story 4.2 (DONE): Paperless Auto-Forward — infrastructure + audit tracking
  - **Story 4.3 (this)**: AI Document Processing with Gemini — `processDocument` Cloud Function
  - Story 4.4 (BACKLOG): Transaction Classification & Confidence Scoring — extends Gemini prompt
  - Story 4.5 (BACKLOG): Error Handling, Retry & Pipeline Resilience — retry function

**This story is the AI brain of the email-to-transaction pipeline.** It receives email_log documents (created by Story 4.1), sends their attachments to Gemini 2.5 Pro, and creates `transactions` documents that flow into the Review Queue (Epic 5).

**Pipeline state machine after this story:**
```
Email arrives → onEmailReceived (4.1) → email_log{status:'received'} → processDocument (4.3) → email_log{status:'processed'} + transactions{status:'pending_review'}
```

**Downstream dependencies:**
- Story 4.4 EXTENDS `processDocument` with classification, confidence scoring, vendor history matching, and work order suggestions. It does NOT create a new function — it modifies the Gemini prompt and adds fields to the transaction document.
- Story 4.5 creates `retryFailedProcessing` that queries `email_log` where `status: 'unprocessed'` and re-triggers processing.
- Epic 5 (Review Queue) reads `transactions` with `status: 'pending_review'` for the Ghost Text UI.

**What this story does NOT include (deferred to Story 4.4):**
- Sophisticated category classification based on vendor history
- Work Order suggestion matching
- Inventory item suggestion matching
- `classificationReasoning` field
- Currency conversion with `isEstimatedConversion` flag
- Conversion rate tracking

### References

- [Source: planning-artifacts/epics.md#Story-4.3] — Full acceptance criteria with BDD scenarios
- [Source: planning-artifacts/epics.md#Epic-4] — Epic context for email ingestion pipeline
- [Source: planning-artifacts/architecture.md#Cloud-Functions-Inventory] — processDocument function spec
- [Source: planning-artifacts/architecture.md#Cloud-Functions-Boundary] — Separate npm package, shared schemas
- [Source: planning-artifacts/architecture.md#Firestore-Collections] — transactions, email_log collections
- [Source: planning-artifacts/architecture.md#Authentication-Security] — API key protection via defineSecret
- [Source: planning-artifacts/architecture.md#Naming-Patterns] — camelCase functions, snake_case collections
- [Source: planning-artifacts/architecture.md#Data-Flow-Patterns] — Firestore → Zod → Zustand → React
- [Source: planning-artifacts/architecture.md#Error-Handling] — Cloud Functions error patterns
- [Source: planning-artifacts/architecture.md#Data-Integrity] — Integer currency (agora/cents)
- [Source: implementation-artifacts/4-1-gmail-api-integration-email-detection.md] — Previous story: code patterns, test infrastructure
- [Source: implementation-artifacts/4-2-paperless-auto-forward.md] — Previous story: schema update patterns, test fixture updates
- [Source: functions/src/index.ts] — Current function exports (onEmailReceived)
- [Source: functions/src/config.ts] — Current config (Gmail OAuth + Paperless)
- [Source: functions/src/shared/schemas.ts] — Current server schemas (emailLogSchema)
- [Source: functions/src/shared/types.ts] — Current server types
- [Source: functions/package.json] — Current dependencies
- [Source: src/types/transaction.ts] — Current transaction schema (missing sourceEmailRef)
- [Source: https://ai.google.dev/gemini-api/docs/structured-output] — Gemini structured output docs
- [Source: https://www.npmjs.com/package/@google/genai] — New Gemini SDK (v1.40.0)
- [Source: https://ai.google.dev/gemini-api/docs/document-processing] — Gemini document processing docs

## Dev Agent Record

### Agent Model Used

Claude claude-4.6-opus (Cursor)

### Debug Log References

- zod-to-json-schema v3.25.1 has Zod 3 TypeScript types; cast via `as unknown as Parameters<typeof zodToJsonSchema>[0]` for Zod 4 compatibility (runtime works fine)
- mockTransactionAdd return value carried across test cases in mailbox-category iteration; fixed by resetting mock in status-transition test

### Completion Notes List

- Task 1: Added `sourceEmailRef: z.string().nullable()` to client `transactionSchema`, server-side `transactionSchema` (new), and updated all 4 test fixture files (transaction.test.ts, useDashboardData.test.ts, useTransactionActions.test.ts, useTransactionActions.ts hook)
- Task 2: Added `geminiApiKey = defineSecret('GEMINI_API_KEY')` to config.ts; added `parsedDocumentSchema`, `parsedLineItemSchema` with types to schemas.ts; exported `ParsedDocument`, `ParsedLineItem`, `Transaction` from types.ts
- Task 3: Installed `@google/genai@^1.40.0` and `zod-to-json-schema@^3.25.1` in functions/package.json
- Task 4: Created `geminiClient.ts` with `parseFinancialDocument()` — downloads from Storage, sends base64 to Gemini 2.5 Pro, uses structured JSON output with schema validation, 25s AbortController timeout, bilingual extraction prompt
- Task 5: Created `processDocument.ts` — `onDocumentCreated` trigger on `email_log/{docId}`, guards on status='received', transitions processing→processed, creates transaction with all required fields, error path sets 'unprocessed' without re-throw
- Task 6: Added `processDocument` export to `functions/src/index.ts`
- Task 7: Created 28 comprehensive AI tests (Hebrew/English parse, status transitions, error handling, amount conversion, mailbox category mapping, schema validation); added 2 sourceEmailRef tests to client transaction.test.ts
- Task 8: Zero TypeScript errors, 631 client tests + 53 functions tests = 684 total, zero regressions

### Change Log

- 2026-02-07: Implemented Story 4.3 — AI Document Processing with Gemini. Added processDocument Cloud Function, geminiClient wrapper, ParsedDocument schema, sourceEmailRef field, 30 new tests (684 total).
- 2026-02-07: Code Review — Fixed 6 issues (3 MEDIUM, 3 LOW): (M1) Added nested try-catch in processDocument error handler to prevent stuck 'processing' state, (M2) Added date validation before Firestore write to catch invalid Gemini dates, (M3) Added Storage download failure test, (L1) Added unknown mailbox fallback test, (L2) Added invalid date from Gemini test, (L3) Added .min(1) to parsedDocumentSchema vendorName + rejection test. Total: 631 client + 57 functions = 688 tests, zero regressions.

### File List

**Created:**
- `functions/src/ai/geminiClient.ts` — Gemini 2.5 Pro wrapper (parseFinancialDocument)
- `functions/src/ai/processDocument.ts` — Firestore onCreate trigger Cloud Function
- `functions/tests/ai.test.ts` — 28 AI processing tests

**Modified:**
- `src/types/transaction.ts` — Added `sourceEmailRef: z.string().nullable()`
- `src/types/transaction.test.ts` — Added sourceEmailRef to fixture + 2 new tests
- `src/features/work-orders/hooks/useTransactionActions.ts` — Added `sourceEmailRef: null` to manual transaction creation
- `src/features/work-orders/hooks/useTransactionActions.test.ts` — Added sourceEmailRef to expected object
- `src/features/dashboard/hooks/useDashboardData.test.ts` — Added sourceEmailRef to inline type + fixture
- `functions/src/index.ts` — Added processDocument export
- `functions/src/config.ts` — Added geminiApiKey secret
- `functions/src/shared/schemas.ts` — Added transactionSchema, parsedDocumentSchema, parsedLineItemSchema
- `functions/src/shared/types.ts` — Added ParsedDocument, ParsedLineItem, Transaction type exports
- `functions/package.json` — Added @google/genai, zod-to-json-schema dependencies
- `functions/package-lock.json` — Updated lock file
