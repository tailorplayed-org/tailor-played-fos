# Story 4.5: Error Handling, Retry & Pipeline Resilience

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **system**,
I want graceful error handling at every stage of the pipeline with automatic retries,
So that no financial document is ever lost and failures are recoverable.

## Acceptance Criteria

1. **Scheduled Retry Function**: `functions/src/scheduled/retryFailedProcessing.ts` — a scheduled Cloud Function runs every hour via Cloud Scheduler. It queries `email_log` for documents with `status: 'unprocessed'` or `status: 'failed'` older than 1 hour. It re-triggers AI processing for each (up to 10 per run). It increments `retryCount` on each retry. After 3 failed retries, status is set to `'failed_permanent'` and the entry persists for Gal's review.

2. **Gmail API Failure Recovery**: When a Pub/Sub notification arrives but email download fails, the email_log document is created with `status: 'failed'` and `errorMessage`. The email remains in Gmail. The retry function re-downloads from Gmail on the next scheduled run.

3. **Gemini API Failure Recovery**: When AI processing fails (timeout, rate limit, parse error), the email_log status updates to `'unprocessed'`, the original document is preserved in Firebase Storage, `errorMessage` describes the failure, and the retry function retries on the next scheduled run.

4. **Currency Rate Staleness**: When currency conversion uses fallback default rates (system_config unavailable or missing), the transaction is flagged with `conversionRateStale: true`. The rate staleness will be visible in the review UI (Epic 5).

5. **Structured Logging**: Every processing stage error is logged to Cloud Logging with: function name, email_log ID, error type, error message, timestamp. No silent data loss — `email_log` always reflects true state.

6. **Pipeline Backlog Recovery**: When multiple Pub/Sub notifications arrive at once after downtime, `processDocument` processes them with limited concurrency (`maxInstances: 3`). Each email is handled independently — one failure doesn't block others. Rate limits on Gemini API are respected with delays between retries in the batch retry function.

## Tasks / Subtasks

- [x] Task 1: Email Log Schema Updates (AC: #1, #2)
  - [x] Add `'failed_permanent'` to `EMAIL_STATUSES` in `functions/src/shared/schemas.ts`
  - [x] Add `retryCount: z.number().int()` to server-side `emailLogSchema`
  - [x] Add `updatedAt: z.any()` to server-side `emailLogSchema`
  - [x] Mirror all changes to client-side `src/types/email.ts`: `'failed_permanent'` in `EMAIL_STATUSES`, `retryCount: z.number().int()`, `updatedAt: z.date()`
  - [x] Update all test fixtures that create EmailLog objects

- [x] Task 2: Transaction Schema Updates (AC: #4)
  - [x] Add `conversionRateStale: z.boolean()` to server-side `transactionSchema` in `functions/src/shared/schemas.ts`
  - [x] Add `conversionRateStale: z.boolean()` to client-side `transactionSchema` in `src/types/transaction.ts`
  - [x] Update ALL test fixtures that create Transaction objects (search for `sourceEmailRef` in tests to find them all)

- [x] Task 3: Update `onEmailReceived` — Add retryCount + updatedAt (AC: #2, #5)
  - [x] Add `retryCount: 0` and `updatedAt: FieldValue.serverTimestamp()` to both email_log creation paths (success path and error/catch path)
  - [x] Update `functions/tests/email.test.ts` with new expected fields

- [x] Task 4: Update `processDocument` — Add updatedAt, conversionRateStale, concurrency (AC: #3, #4, #5, #6)
  - [x] Add `updatedAt: FieldValue.serverTimestamp()` to ALL `emailLogRef.update()` calls (processing, processed, unprocessed, error)
  - [x] Modify `getConversionRates` to return `usedDefaults: boolean` flag
  - [x] Set `conversionRateStale = isEstimatedConversion && usedDefaults` on the transaction document
  - [x] Add `maxInstances: 3` to `onDocumentCreated` options for backlog handling
  - [x] Extract core AI processing logic into `runAIProcessing()` helper (shared with retry function)
  - [x] Update `functions/tests/ai.test.ts` for updatedAt, conversionRateStale, and extracted helper

- [x] Task 5: Create `retryFailedProcessing` Scheduled Cloud Function (AC: #1, #2, #3, #6)
  - [x] Create `functions/src/scheduled/retryFailedProcessing.ts`
  - [x] Import `onSchedule` from `firebase-functions/scheduler`
  - [x] Schedule: `'every 60 minutes'`, secrets: `[geminiApiKey, gmailClientId, gmailClientSecret, gmailRefreshToken]`
  - [x] Query `email_log` for `status in ['unprocessed', 'failed']` — filter in-memory for age > 1 hour AND retryCount < 3
  - [x] For each candidate (up to 10, sequential):
    - Increment `retryCount`, set `updatedAt`
    - If `retryCount >= 3`: set `status: 'failed_permanent'`, log warning, skip processing
    - If `status === 'failed'` AND `attachmentUrls.length === 0`: re-download from Gmail using `messageId`, upload to Storage, update `attachmentUrls`
    - Call `runAIProcessing()` helper to process/reprocess
    - On success: update email_log to `'processed'` + link transactionId
    - On failure: update email_log to `'unprocessed'` + errorMessage
    - Add 2-second delay between items (Gemini rate limit protection)
  - [x] Idempotency check: before processing, check if transaction with `sourceEmailRef === docId` already exists
  - [x] Each item error-handled independently — one failure doesn't block others

- [x] Task 6: Export New Function (AC: #1)
  - [x] Add `export { retryFailedProcessing } from './scheduled/retryFailedProcessing.js';` to `functions/src/index.ts`

- [x] Task 7: Tests (AC: all)
  - [x] Create `functions/tests/scheduled.test.ts` with:
    - Test: queries unprocessed email_logs older than 1 hour
    - Test: queries failed email_logs older than 1 hour
    - Test: skips email_logs newer than 1 hour
    - Test: increments retryCount on each retry
    - Test: sets `failed_permanent` after 3 retries (retryCount >= 3)
    - Test: processes up to 10 items per run
    - Test: skips items where transaction already exists (idempotency)
    - Test: re-downloads from Gmail for failed emails with no attachments
    - Test: successfully reprocesses unprocessed email with existing attachments
    - Test: handles processing failure gracefully (one failure doesn't block next)
    - Test: handles empty query result (no retries needed)
    - Test: backward compatibility — handles email_logs without retryCount field (defaults to 0)
  - [x] Update `functions/tests/ai.test.ts`:
    - Test: `conversionRateStale = true` when using default conversion rates
    - Test: `conversionRateStale = false` when using system_config rates
    - Test: `updatedAt` is set in all email_log updates
    - Update existing test fixtures for new `conversionRateStale` field
  - [x] Update `functions/tests/email.test.ts`:
    - Test: email_log creation includes `retryCount: 0` and `updatedAt`
    - Update existing test fixtures
  - [x] Update client test fixtures for `conversionRateStale` on Transaction objects:
    - `src/types/transaction.test.ts`
    - `src/features/dashboard/hooks/useDashboardData.test.ts`
    - `src/features/work-orders/hooks/useTransactionActions.test.ts`

- [x] Task 8: Build Verification (AC: all)
  - [x] `cd functions && npx tsc --noEmit` — zero TypeScript errors in functions
  - [x] `npm run test` — all client-side tests pass, zero regressions
  - [x] `cd functions && npm run test` — all functions tests pass

## Dev Notes

### Architecture Compliance

- **Cloud Functions 2nd Gen**: Use `onSchedule` from `firebase-functions/scheduler` for the retry function. Use `onDocumentCreated` from `firebase-functions/firestore` for processDocument (existing). [Source: architecture.md#Cloud-Functions-Inventory]
- **`@google/genai` SDK (NOT `@google/generative-ai`)**: Continue using `@google/genai` v1.40.0. Import: `import { GoogleGenAI } from '@google/genai'`. Model: `"gemini-2.5-pro"`. [Source: Story 4.3 + 4.4 learnings]
- **Firebase Admin SDK**: `getFirestore()` from `firebase-admin/firestore` for all Firestore operations. [Source: architecture.md#Cloud-Functions-Boundary]
- **Separate npm package**: `functions/` has its own `package.json`. No new npm dependencies needed. [Source: architecture.md#Cloud-Functions-Boundary]
- **NodeNext module resolution**: ALL relative imports in `functions/` MUST use `.js` extensions: `../config.js`, `../shared/schemas.js`, `./geminiClient.js`, `../../scheduled/retryFailedProcessing.js`. [Source: functions/tsconfig.json]
- **Naming conventions**: Cloud Functions: `camelCase`, verb-first. Firestore collections: `snake_case`. Document fields: `camelCase`. Boolean fields: prefix with `is` or `has`. [Source: architecture.md#Naming-Patterns]
- **Error handling**: Cloud Logging via `firebase-functions/logger`. Never `console.log`. Nested try-catch for resilience. [Source: architecture.md#Error-Handling, Story 4.3/4.4 learnings]
- **Co-located tests**: Functions tests in `functions/tests/`. Client tests co-located with source. [Source: architecture.md#Testing-Standards]

### Critical Technical Constraints

- **No new npm dependencies needed** — this story uses existing `firebase-functions` scheduler APIs, `@google/genai`, and `googleapis` (Gmail client).

- **ONE new Cloud Function**: `retryFailedProcessing` — must be exported from `functions/src/index.ts`.

- **Packages already installed in `functions/`:**
  - `firebase-admin@^13.4.0` — Firestore, Storage admin SDK
  - `firebase-functions@^6.3.2` — 2nd gen Cloud Functions API (includes `firebase-functions/scheduler`)
  - `googleapis@^171.4.0` — Gmail API client (for re-downloading failed emails)
  - `zod@^4.3.6` — Schema validation
  - `@google/genai` (v1.40.0) — Gemini SDK
  - `zod-to-json-schema` (v3.25.1) — Zod to JSON Schema
  - `vitest@^4.0.18` — Test runner (dev)
  - `typescript@~5.9.3` — TypeScript compiler

- **NEW file to CREATE:**
  - `functions/src/scheduled/retryFailedProcessing.ts` — Scheduled retry Cloud Function

- **Existing `functions/` files to MODIFY:**
  - `functions/src/index.ts` — Add export for `retryFailedProcessing`
  - `functions/src/shared/schemas.ts` — Add `failed_permanent` to EMAIL_STATUSES, add `retryCount` + `updatedAt` to emailLogSchema, add `conversionRateStale` to transactionSchema
  - `functions/src/email/onEmailReceived.ts` — Add `retryCount: 0` + `updatedAt` to email_log creation
  - `functions/src/ai/processDocument.ts` — Add `updatedAt` to all email_log updates, add `conversionRateStale` to transaction, add `maxInstances: 3`, extract reusable processing helper
  - `functions/tests/ai.test.ts` — Update fixtures, add conversionRateStale + updatedAt tests
  - `functions/tests/email.test.ts` — Update fixtures, add retryCount + updatedAt tests

- **Existing client files to MODIFY:**
  - `src/types/email.ts` — Add `failed_permanent`, `retryCount`, `updatedAt`
  - `src/types/transaction.ts` — Add `conversionRateStale`
  - `src/types/transaction.test.ts` — Update fixture
  - `src/features/dashboard/hooks/useDashboardData.test.ts` — Update Transaction fixture
  - `src/features/work-orders/hooks/useTransactionActions.test.ts` — Update expected objects
  - `src/features/work-orders/hooks/useTransactionActions.ts` — Add `conversionRateStale: false` default for manual transactions

- **Files NOT to modify:**
  - `functions/src/ai/geminiClient.ts` — No changes needed
  - `functions/src/email/gmailClient.ts` — Already has all needed exports (getEmailById, getAttachments)
  - `functions/src/shared/currency.ts` — No changes needed
  - `functions/src/shared/types.ts` — No new types needed (retry types stay local to retryFailedProcessing)
  - `functions/src/config.ts` — All secrets already defined (gmailClientId, gmailClientSecret, gmailRefreshToken, geminiApiKey)
  - Any React components, pages, stores, or route files

### Scheduled Function Design

```typescript
// functions/src/scheduled/retryFailedProcessing.ts
import { onSchedule } from 'firebase-functions/scheduler';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import * as logger from 'firebase-functions/logger';
import { geminiApiKey, gmailClientId, gmailClientSecret, gmailRefreshToken } from '../config.js';
import { getEmailById, getAttachments } from '../email/gmailClient.js';
import { getStorage } from 'firebase-admin/storage';
import { runAIProcessing } from '../ai/processDocument.js';

const MAX_RETRIES = 3;
const MAX_ITEMS_PER_RUN = 10;
const RETRY_DELAY_MS = 2000; // 2s between items to respect Gemini rate limits
const ONE_HOUR_MS = 60 * 60 * 1000;

export const retryFailedProcessing = onSchedule(
  {
    schedule: 'every 60 minutes',
    secrets: [geminiApiKey, gmailClientId, gmailClientSecret, gmailRefreshToken],
    timeoutSeconds: 300, // 5 min max for batch processing
  },
  async (event) => {
    const db = getFirestore();

    // Query candidates — filter in-memory to avoid composite index requirement
    const snapshot = await db.collection('email_log')
      .where('status', 'in', ['unprocessed', 'failed'])
      .get();

    const oneHourAgo = new Date(Date.now() - ONE_HOUR_MS);
    const candidates = snapshot.docs.filter(doc => {
      const data = doc.data();
      const retryCount = (data.retryCount as number) ?? 0;
      // Use updatedAt if available, fall back to receivedAt
      const lastUpdate = data.updatedAt?.toDate?.() ?? data.receivedAt?.toDate?.() ?? new Date(0);
      return retryCount < MAX_RETRIES && lastUpdate < oneHourAgo;
    }).slice(0, MAX_ITEMS_PER_RUN);

    if (candidates.length === 0) {
      logger.info('retryFailedProcessing: No retry candidates found');
      return;
    }

    logger.info(`retryFailedProcessing: Processing ${candidates.length} candidates`);
    let successCount = 0;
    let failCount = 0;
    let permanentFailCount = 0;

    for (const doc of candidates) {
      const data = doc.data();
      const docId = doc.id;
      const currentRetryCount = ((data.retryCount as number) ?? 0) + 1;

      try {
        // Check if already at max retries → mark permanent failure
        if (currentRetryCount >= MAX_RETRIES) {
          await doc.ref.update({
            status: 'failed_permanent',
            retryCount: currentRetryCount,
            updatedAt: FieldValue.serverTimestamp(),
          });
          logger.warn('retryFailedProcessing: Marked as failed_permanent', {
            docId, retryCount: currentRetryCount,
          });
          permanentFailCount++;
          continue;
        }

        // Increment retryCount
        await doc.ref.update({
          retryCount: currentRetryCount,
          updatedAt: FieldValue.serverTimestamp(),
        });

        // Idempotency: check if transaction already exists
        const existingTxn = await db.collection('transactions')
          .where('sourceEmailRef', '==', docId)
          .limit(1)
          .get();
        if (!existingTxn.empty) {
          await doc.ref.update({
            status: 'processed',
            transactionId: existingTxn.docs[0].id,
            updatedAt: FieldValue.serverTimestamp(),
          });
          successCount++;
          continue;
        }

        // Handle failed emails with no attachments — re-download from Gmail
        let attachmentUrls: string[] = (data.attachmentUrls as string[]) ?? [];
        if (attachmentUrls.length === 0 && data.messageId) {
          // Re-download from Gmail
          const message = await getEmailById(data.messageId as string);
          const attachments = await getAttachments(data.messageId as string, message);
          const storage = getStorage();
          const bucket = storage.bucket();
          const newPaths: string[] = [];
          for (const att of attachments) {
            const storagePath = `documents/${data.messageId}/${att.filename}`;
            await bucket.file(storagePath).save(att.data, { contentType: att.mimeType });
            newPaths.push(storagePath);
          }
          attachmentUrls = newPaths;
          await doc.ref.update({ attachmentUrls: newPaths });
        }

        if (attachmentUrls.length === 0) {
          throw new Error('No attachments available after re-download attempt');
        }

        // Re-run AI processing
        await doc.ref.update({ status: 'processing', updatedAt: FieldValue.serverTimestamp() });
        const result = await runAIProcessing(db, attachmentUrls[0], docId);
        await doc.ref.update({
          status: 'processed',
          transactionId: result.transactionId,
          updatedAt: FieldValue.serverTimestamp(),
          errorMessage: null,
        });
        successCount++;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.error('retryFailedProcessing: Item failed', { docId, error: errorMsg });
        try {
          await doc.ref.update({
            status: 'unprocessed',
            errorMessage: errorMsg,
            updatedAt: FieldValue.serverTimestamp(),
          });
        } catch (updateErr) {
          logger.error('retryFailedProcessing: Failed to update error status', { docId });
        }
        failCount++;
      }

      // Delay between items for rate limit protection
      if (candidates.indexOf(doc) < candidates.length - 1) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
      }
    }

    logger.info('retryFailedProcessing: Run complete', {
      total: candidates.length, successCount, failCount, permanentFailCount,
    });
  },
);
```

### Extracted Processing Helper Design

```typescript
// Add to functions/src/ai/processDocument.ts (exported for retry use)

/**
 * Core AI processing logic: download from Storage → Gemini → create transaction.
 * Used by both the onCreate trigger and the retry scheduled function.
 */
export async function runAIProcessing(
  db: FirebaseFirestore.Firestore,
  documentUrl: string,
  sourceEmailRefId: string,
): Promise<{ transactionId: string }> {
  const mimeType = guessMimeType(documentUrl);

  // Query classification context (graceful degradation)
  let classificationContext: ClassificationContext = { vendorHistory: [], workOrders: [] };
  try {
    const [vendorHistory, workOrders] = await Promise.all([
      getVendorHistory(db),
      getActiveWorkOrders(db),
    ]);
    for (const entry of vendorHistory) {
      if (entry.workOrderId) {
        const matchedWo = workOrders.find(wo => wo.id === entry.workOrderId);
        if (matchedWo) entry.workOrderName = matchedWo.clientName;
      }
    }
    classificationContext = { vendorHistory, workOrders };
  } catch (contextError) {
    logger.warn('Classification context failed, proceeding without', {
      error: contextError instanceof Error ? contextError.message : String(contextError),
    });
  }

  // Call Gemini
  const parsed = await parseFinancialDocument(documentUrl, mimeType, classificationContext);

  // Convert + validate
  const amountAgora = Math.round(parsed.totalAmount * 100);
  const parsedDate = new Date(parsed.date);
  if (isNaN(parsedDate.getTime())) {
    throw new Error(`Invalid date from Gemini: ${parsed.date}`);
  }

  // Currency conversion
  const isEstimatedConversion = parsed.currency !== 'ILS';
  let conversionRate: number | null = null;
  let conversionRateDate: string | null = null;
  let conversionRateStale = false;

  if (isEstimatedConversion) {
    const { rates, date, usedDefaults } = await getConversionRates(db);
    conversionRate = rates[parsed.currency] ?? DEFAULT_CONVERSION_RATES[parsed.currency as keyof typeof DEFAULT_CONVERSION_RATES];
    conversionRateDate = date ?? new Date().toISOString().split('T')[0];
    conversionRateStale = usedDefaults;
  }

  // Create transaction
  const transactionRef = await db.collection('transactions').add({
    vendorName: parsed.vendorName,
    amountAgora,
    currency: parsed.currency,
    date: parsedDate,
    category: parsed.category,
    workOrderId: null,
    inventoryItemId: null,
    status: 'pending_review',
    aiConfidence: parsed.confidence,
    originalFileUrl: documentUrl,
    source: 'ai',
    sourceEmailRef: sourceEmailRefId,
    notes: null,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    suggestedWorkOrderId: parsed.suggestedWorkOrderId,
    suggestedInventoryItemId: parsed.suggestedInventoryItemId,
    classificationReasoning: parsed.classificationReasoning,
    isEstimatedConversion,
    conversionRate,
    conversionRateDate,
    conversionRateStale,
  });

  return { transactionId: transactionRef.id };
}
```

### Updated `getConversionRates` Design

```typescript
// Modify existing function in processDocument.ts — add usedDefaults flag

export async function getConversionRates(
  db: FirebaseFirestore.Firestore,
): Promise<{ rates: Record<string, number>; date: string | null; usedDefaults: boolean }> {
  try {
    const configDoc = await db.collection('system_config').doc('currency').get();
    if (configDoc.exists) {
      const data = configDoc.data();
      return {
        rates: (data?.currencyRates as Record<string, number>) ?? {},
        date: (data?.updatedAt as string) ?? null,
        usedDefaults: false,
      };
    }
  } catch (error) {
    logger.warn('Failed to load currency rates from system_config, using defaults', {
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return {
    rates: { ...DEFAULT_CONVERSION_RATES },
    date: null,
    usedDefaults: true,
  };
}
```

### Updated `processDocument` Handler Design

After extracting `runAIProcessing`, the trigger handler becomes a thin wrapper:

```typescript
export const processDocument = onDocumentCreated(
  {
    document: 'email_log/{docId}',
    secrets: [geminiApiKey],
    maxInstances: 3, // Limit concurrency for backlog recovery
  },
  async (event) => {
    const db = getFirestore();
    const snapshot = event.data;
    if (!snapshot) { logger.error('No data in event'); return; }

    const emailLogData = snapshot.data();
    const emailLogRef = snapshot.ref;

    if (emailLogData.status !== 'received') {
      logger.info('Skipping — status is not received', { status: emailLogData.status });
      return;
    }

    try {
      await emailLogRef.update({ status: 'processing', updatedAt: FieldValue.serverTimestamp() });

      const attachmentUrls: string[] = emailLogData.attachmentUrls ?? [];
      if (attachmentUrls.length === 0) throw new Error('No attachments found in email_log');

      const result = await runAIProcessing(db, attachmentUrls[0], event.params.docId);

      await emailLogRef.update({
        status: 'processed',
        transactionId: result.transactionId,
        updatedAt: FieldValue.serverTimestamp(),
      });

      logger.info('Document processed successfully', {
        emailLogId: event.params.docId,
        transactionId: result.transactionId,
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error('processDocument failed', { docId: event.params.docId, error: errorMsg });
      try {
        await emailLogRef.update({
          status: 'unprocessed',
          errorMessage: errorMsg,
          updatedAt: FieldValue.serverTimestamp(),
        });
      } catch (updateError) {
        logger.error('Failed to update email_log error status', {
          docId: event.params.docId,
          originalError: errorMsg,
          updateError: updateError instanceof Error ? updateError.message : String(updateError),
        });
      }
    }
  },
);
```

### Email Log Schema Changes

```typescript
// functions/src/shared/schemas.ts — Update EMAIL_STATUSES and emailLogSchema

export const EMAIL_STATUSES = [
  'received',
  'processing',
  'processed',
  'unprocessed',
  'failed',
  'failed_permanent', // NEW: After 3 retries, permanently failed
] as const;

export const emailLogSchema = z.object({
  messageId: z.string(),
  mailbox: z.enum(DESIGNATED_MAILBOXES),
  receivedAt: z.any(), // Firestore Timestamp
  status: z.enum(EMAIL_STATUSES),
  attachmentUrls: z.array(z.string()),
  subject: z.string(),
  from: z.string(),
  transactionId: z.string().nullable(),
  errorMessage: z.string().nullable(),
  paperlessForwarded: z.boolean(),
  retryCount: z.number().int(),       // NEW: Number of retry attempts (0 = first processing)
  updatedAt: z.any(),                 // NEW: Firestore Timestamp — last status change
});
```

```typescript
// src/types/email.ts — Mirror changes (client-side uses z.date() for timestamps)

export const EMAIL_STATUSES = [
  'received',
  'processing',
  'processed',
  'unprocessed',
  'failed',
  'failed_permanent', // NEW: After 3 retries, permanently failed
] as const;

// Add to emailLogSchema:
retryCount: z.number().int(),  // NEW
updatedAt: z.date(),           // NEW
```

### Transaction Schema Changes

```typescript
// Add to BOTH server (functions/src/shared/schemas.ts) and client (src/types/transaction.ts):

conversionRateStale: z.boolean(),  // NEW: true when using fallback/stale conversion rates
```

**CRITICAL**: Update `useTransactionActions.ts` to include `conversionRateStale: false` (or calculate based on currency) when creating manual transactions:
```typescript
// In the createTransaction function, add to the Firestore write:
conversionRateStale: false, // Manual transactions don't use stale rates
```

### onEmailReceived Changes

```typescript
// Add to BOTH email_log creation paths in onEmailReceived.ts:

// Success path (status: 'received'):
retryCount: 0,
updatedAt: FieldValue.serverTimestamp(),

// Error/catch path (status: 'failed'):
retryCount: 0,
updatedAt: FieldValue.serverTimestamp(),
```

### Project Structure Notes

**NEW file:**

| File | Purpose |
|---|---|
| `functions/src/scheduled/retryFailedProcessing.ts` | Hourly scheduled function: queries failed/unprocessed email_logs, retries AI processing, handles permanent failures |

**Files to MODIFY:**

| File | Change |
|---|---|
| `functions/src/index.ts` | Add export for `retryFailedProcessing` |
| `functions/src/shared/schemas.ts` | Add `failed_permanent` to EMAIL_STATUSES, add `retryCount` + `updatedAt` to emailLogSchema, add `conversionRateStale` to transactionSchema |
| `functions/src/email/onEmailReceived.ts` | Add `retryCount: 0` + `updatedAt` to email_log writes (both paths) |
| `functions/src/ai/processDocument.ts` | Extract `runAIProcessing()` helper, add `updatedAt` to email_log updates, add `conversionRateStale` to transaction, add `maxInstances: 3`, update `getConversionRates` to return `usedDefaults` flag |
| `functions/tests/ai.test.ts` | Update fixtures, add conversionRateStale + updatedAt tests |
| `functions/tests/email.test.ts` | Update fixtures, add retryCount + updatedAt expected fields |
| `src/types/email.ts` | Add `failed_permanent`, `retryCount`, `updatedAt` |
| `src/types/transaction.ts` | Add `conversionRateStale` |
| `src/types/transaction.test.ts` | Update fixture with `conversionRateStale` |
| `src/features/dashboard/hooks/useDashboardData.test.ts` | Update Transaction fixture with `conversionRateStale` |
| `src/features/work-orders/hooks/useTransactionActions.ts` | Add `conversionRateStale: false` to manual transaction creation |
| `src/features/work-orders/hooks/useTransactionActions.test.ts` | Update expected transaction with `conversionRateStale` |

**Files NOT to modify:**
- `functions/src/ai/geminiClient.ts` — No changes needed
- `functions/src/email/gmailClient.ts` — Already exports all needed functions
- `functions/src/shared/currency.ts` — No changes needed
- `functions/src/shared/types.ts` — No new types needed
- `functions/src/config.ts` — All secrets already defined
- Any React components, pages, or route files — server-side story (except `useTransactionActions.ts` for defaults)

### Previous Story Intelligence (Story 4.4)

**Key patterns and learnings from Story 4.4:**

- **`initializeApp()` is already called** at the top of `functions/src/index.ts`. Do NOT call it again.
- **Import paths require `.js` extension**: `../config.js`, `../shared/schemas.js`, `./geminiClient.js`. Without them, NodeNext module resolution fails at runtime.
- **`vi.mock` pattern for external dependencies** in tests. Mock `@google/genai`, `firebase-admin/firestore`, `firebase-admin/storage`, `firebase-functions/logger`.
- **Firestore mock patterns**: `mockCollection` handles routing to different collection mocks. Supports `.where().where().get()` chain, `.doc().get()`, and collection-level `.get()`. The retry function needs similar mocking for `email_log` queries.
- **`FieldValue.serverTimestamp()` for timestamps** — use in `createdAt`, `updatedAt`.
- **Zod 4 `.default()` creates type divergence** — DO NOT use `.default()`. Define all fields explicitly.
- **Test counts**: 725 tests total (635 client + 85 functions + 5 from code review). Zero regressions required.
- **`zod-to-json-schema` v3.25.1 has Zod 3 types** — cast via `as unknown as Parameters<typeof zodToJsonSchema>[0]`.
- **Nested try-catch** — processDocument uses nested try-catch to prevent stuck 'processing' state. Apply same pattern in retry function.
- **`sass-embedded` dispatcher race condition on `npm run build`** is pre-existing — not a regression.

**From Story 4.4 code review fixes:**
- Try-catch resilience for classification context queries (degrade gracefully)
- Vendor history enriched with work order names
- Shipped work orders excluded from context
- Type guards in getActiveWorkOrders

### Git Intelligence

**Most recent commits:**
- `aba880e` — Implement Story 4.4: Transaction Classification & Confidence Scoring with code review fixes
- `db4c7bb` — Implement Story 4.3: AI Document Processing with Gemini with code review fixes
- `4a761e3` — Implement Story 4.2: Paperless Auto-Forward with code review fixes
- `95177a4` — Implement Story 4.1: Gmail API Integration & Email Detection with code review fixes

**Established code patterns:**
- Single comprehensive commit per story
- `vi.mock` for external dependencies in tests
- Test structure: `describe` blocks by function/component, `it`/`test` cases for success/error paths
- Barrel exports NOT used for functions (flat imports from direct paths)
- `vi.clearAllMocks()` in `beforeEach`

**Files modified in Stories 4.3/4.4 that this story also modifies:**
- `functions/src/ai/processDocument.ts` — extracting helper, adding updatedAt + conversionRateStale
- `functions/src/shared/schemas.ts` — extending emailLogSchema + transactionSchema
- `functions/tests/ai.test.ts` — adding new tests, updating fixtures
- `functions/tests/email.test.ts` — updating fixtures
- `src/types/transaction.ts` — adding conversionRateStale
- `src/types/email.ts` — adding retryCount, updatedAt, failed_permanent

### Potential Pitfalls to Avoid

1. **DO NOT forget `.js` extensions** in function imports. All relative imports in `functions/src/` must use `.js` extensions.

2. **DO NOT call `initializeApp()` again** — it's already called in `functions/src/index.ts`.

3. **DO NOT use `z.number().int().default(0)` or any `.default()`** on Zod schemas. Zod 4 `.default()` creates type divergence. Write `0` explicitly in document creation.

4. **DO NOT use `console.log`** in Cloud Functions. Use `firebase-functions/logger`.

5. **DO NOT create composite Firestore indexes** — the retry function queries `email_log` by `status in [...]` then filters age + retryCount in memory. This avoids needing a composite index for the small dataset.

6. **DO NOT re-throw errors** in the retry function's per-item handler. Each item is independent. Log the error and continue to the next item.

7. **DO NOT query inventory collection** — `src/types/inventory.ts` is empty (Epic 6). `suggestedInventoryItemId` stays null.

8. **Handle backward compatibility** — existing email_log documents may not have `retryCount` or `updatedAt`. Default `retryCount` to 0 and use `receivedAt` as fallback for age calculation.

9. **Idempotency is CRITICAL** — before reprocessing, always check if a transaction with matching `sourceEmailRef` already exists. If it does, just update email_log to 'processed' and link the transaction.

10. **Delay between retries** — add 2-second delay between items in the retry batch to respect Gemini API rate limits. Use `await new Promise(resolve => setTimeout(resolve, 2000))`.

11. **Gmail secrets needed for retry** — the retry function needs ALL four secrets (Gemini + Gmail) because it may need to re-download attachments from Gmail for `failed` emails. Include all in the `secrets` array.

12. **`onSchedule` import path**: `import { onSchedule } from 'firebase-functions/scheduler';` — NOT from `firebase-functions/v2/scheduler`.

13. **Test fixture updates are CRITICAL** — every test that creates a Transaction object must include `conversionRateStale`. Search for `sourceEmailRef` across all test files. Every test that creates an EmailLog must include `retryCount` and `updatedAt`.

14. **`conversionRateStale` for manual transactions** — Manual transactions created via `useTransactionActions.ts` should default to `conversionRateStale: false`. For manual non-ILS transactions, the user explicitly enters the amount, so the rate is not "stale."

15. **ILS transactions: `conversionRateStale: false`** — Only non-ILS transactions can have stale rates. ILS transactions always have `isEstimatedConversion: false` AND `conversionRateStale: false`.

16. **Firestore `Timestamp.toDate()`** — When reading `updatedAt` or `receivedAt` from Firestore in the retry function, use `.toDate()` to convert Firestore Timestamp to JS Date for comparison. Handle the case where the value might be a `FieldValue.serverTimestamp()` sentinel (not yet resolved).

17. **`maxInstances: 3` on processDocument** — This limits concurrent executions for backlog recovery. Set to 3 (not 1) to allow reasonable throughput while preventing Gemini rate limit abuse.

### Cross-Story Context

This is **Story 4.5** — the fifth and final story in Epic 4 (Email Ingestion & AI Document Processing):

- **Epic 1** (DONE): Project scaffold, design system, auth, app shell, i18n, shared components
- **Epic 2** (DONE): Work Order CRUD, status lifecycle, manual transactions, Nutrition Label, detail page
- **Epic 3** (DONE): Dashboard, KPI cards, project health table, real-time data layer
- **Epic 4** (IN PROGRESS):
  - Story 4.1 (REVIEW): Gmail API Integration & Email Detection — pipeline foundation
  - Story 4.2 (DONE): Paperless Auto-Forward — infrastructure + audit tracking
  - Story 4.3 (DONE): AI Document Processing with Gemini — processDocument Cloud Function
  - Story 4.4 (DONE): Transaction Classification & Confidence Scoring — Gemini classification
  - **Story 4.5 (this)**: Error Handling, Retry & Pipeline Resilience — retry function, error recovery
- **Epic 5** (BACKLOG): Ghost Text Review & Transaction Approval — reads `transactions` with `status: 'pending_review'`

**This story completes the email ingestion pipeline.** It adds the final resilience layer: automatic retries for failed processing, graceful degradation for unavailable services, and permanent failure tracking. After this story, the pipeline handles: email receipt → AI extraction → classification → error recovery → retry → permanent failure tracking.

**Pipeline state machine after this story:**
```
Email arrives → onEmailReceived (4.1)
  → SUCCESS: email_log{status:'received', retryCount:0}
    → processDocument (4.3+4.4)
      → SUCCESS: email_log{status:'processed'} + transaction{status:'pending_review'}
      → FAILURE: email_log{status:'unprocessed', errorMessage}
        → retryFailedProcessing (4.5, hourly)
          → retryCount < 3: re-process → SUCCESS or increment retry
          → retryCount >= 3: email_log{status:'failed_permanent'}
  → FAILURE: email_log{status:'failed', retryCount:0}
    → retryFailedProcessing (4.5, hourly)
      → re-download from Gmail + re-process
```

**Upstream dependencies (already done):**
- Story 4.1 created `onEmailReceived` with zero-email-loss error handling
- Story 4.3 created `processDocument` with basic error → 'unprocessed' flow
- Story 4.4 extended `processDocument` with classification + currency conversion

**Downstream dependencies:**
- Epic 5 (Ghost Text Review) will display `failed_permanent` email_logs in the review queue so Gal can see permanently failed documents
- Epic 5 will show `conversionRateStale` flag on transactions with estimated conversion rates

**What this story does NOT include (deferred):**
- UI for viewing `failed_permanent` items (Epic 5)
- UI for `conversionRateStale` display (Epic 5)
- Live currency rate API integration (deferred — uses manual rates from `system_config` or defaults)
- Gmail Watch renewal (requires separate setup, not part of pipeline resilience)

### References

- [Source: planning-artifacts/epics.md#Story-4.5] — Full acceptance criteria with BDD scenarios
- [Source: planning-artifacts/epics.md#Epic-4] — Epic context for email ingestion pipeline
- [Source: planning-artifacts/architecture.md#Cloud-Functions-Inventory] — retryFailedProcessing function spec
- [Source: planning-artifacts/architecture.md#Cloud-Functions-Boundary] — Separate npm package, shared schemas
- [Source: planning-artifacts/architecture.md#Firestore-Collections] — email_log, transactions, system_config
- [Source: planning-artifacts/architecture.md#Naming-Patterns] — camelCase, boolean `is` prefix
- [Source: planning-artifacts/architecture.md#Error-Handling] — Cloud Functions error patterns, Cloud Logging
- [Source: implementation-artifacts/4-4-transaction-classification-confidence-scoring.md] — Previous story: implementation details, code patterns, test fixtures, Firestore mock patterns
- [Source: functions/src/ai/processDocument.ts] — Current processDocument code (to be refactored)
- [Source: functions/src/email/onEmailReceived.ts] — Current onEmailReceived code (to be modified)
- [Source: functions/src/email/gmailClient.ts] — Gmail API wrapper (getEmailById, getAttachments — used by retry)
- [Source: functions/src/shared/schemas.ts] — Current emailLogSchema + transactionSchema (to be extended)
- [Source: functions/src/config.ts] — All secrets already defined
- [Source: functions/tests/ai.test.ts] — Current AI tests (Firestore mock patterns to replicate for scheduled tests)
- [Source: functions/tests/email.test.ts] — Current email tests (to be updated with new fields)
- [Source: src/types/email.ts] — Client email schema (to be extended)
- [Source: src/types/transaction.ts] — Client transaction schema (to be extended)
- [Source: src/lib/currency.ts] — Currency utilities: DEFAULT_CONVERSION_RATES, isEstimatedCurrency

## Dev Agent Record

### Agent Model Used

Claude claude-4.6-opus (Cursor IDE)

### Debug Log References

- Fixed missing `afterEach` import in `scheduled.test.ts`
- Fixed `mockRunAIProcessing` mock chaining issue — switched to `mockImplementation` with call counter for multi-doc tests
- Fixed client-side `email.test.ts` fixtures missing `retryCount` and `updatedAt` fields
- Extended timeout for "processes up to 10 items per run" test (60s) due to 2s rate-limit delays between items

### Completion Notes List

- **Task 1**: Added `failed_permanent` to EMAIL_STATUSES, `retryCount` (z.number().int()) and `updatedAt` (z.any() server / z.date() client) to emailLogSchema on both server and client
- **Task 2**: Added `conversionRateStale: z.boolean()` to transactionSchema on both server and client
- **Task 3**: Added `retryCount: 0` and `updatedAt: FieldValue.serverTimestamp()` to both success and error email_log creation paths in onEmailReceived
- **Task 4**: Refactored processDocument — extracted `runAIProcessing()` helper, added `updatedAt` to all email_log updates, updated `getConversionRates()` to return `usedDefaults` flag, set `conversionRateStale` on transactions, added `maxInstances: 3`
- **Task 5**: Created `retryFailedProcessing` scheduled Cloud Function — hourly retry of failed/unprocessed emails with 3-retry limit, idempotency checks, Gmail re-download for failed emails, 2s delays between items
- **Task 6**: Exported `retryFailedProcessing` from `functions/src/index.ts`
- **Task 7**: Created 12 new scheduled tests, added 6 new ai.test.ts tests (conversionRateStale + updatedAt), updated all email/transaction test fixtures across server and client
- **Task 8**: Zero TypeScript errors, 635 client tests pass, 107 functions tests pass (742 total, up from 725)
- Added `conversionRateStale: false` default to manual transactions in `useTransactionActions.ts`

### Change Log

- **2026-02-08**: Implemented Story 4.5 — Error Handling, Retry & Pipeline Resilience. Created retryFailedProcessing scheduled function, added pipeline resilience with automatic retries, currency rate staleness tracking, and permanent failure handling.

### File List

**New files:**
- `functions/src/scheduled/retryFailedProcessing.ts`
- `functions/tests/scheduled.test.ts`

**Modified files:**
- `functions/src/index.ts`
- `functions/src/shared/schemas.ts`
- `functions/src/email/onEmailReceived.ts`
- `functions/src/ai/processDocument.ts`
- `functions/tests/ai.test.ts`
- `functions/tests/email.test.ts`
- `src/types/email.ts`
- `src/types/email.test.ts`
- `src/types/transaction.ts`
- `src/types/transaction.test.ts`
- `src/features/dashboard/hooks/useDashboardData.test.ts`
- `src/features/work-orders/hooks/useTransactionActions.ts`
- `src/features/work-orders/hooks/useTransactionActions.test.ts`
