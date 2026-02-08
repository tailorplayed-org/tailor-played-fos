# Story 4.4: Transaction Classification & Confidence Scoring

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **system**,
I want to classify each transaction into a category and suggest project/inventory linkage with confidence scores,
So that Gal reviews pre-classified suggestions instead of starting from scratch.

## Acceptance Criteria

1. **Extended Gemini Classification Prompt**: The Gemini processing prompt (from Story 4.3) is extended to also instruct Gemini to: classify into a category (DirectCost, InventoryRestock, Overhead, Personal), assign a classification confidence score (0-100%), suggest a Work Order match based on vendor history and email context, suggest an Inventory item match for restock-type transactions. Classification reasoning (1-2 sentences) is included in the response.

2. **Known Vendor — High Confidence**: When a transaction is from a known vendor (e.g., "Game Crafter" linked to "David's Game" 3 times before), confidence is high (>= 85%), the Work Order suggestion matches the historical pattern, and reasoning states the match (e.g., "Matched to David's Game — vendor linked 3 times previously").

3. **New/Ambiguous Vendor — Lower Confidence**: When a transaction is from a new or ambiguous vendor, confidence is lower (< 85%), the transaction is flagged with `aiConfidence < 85`, and the category may be suggested with lower certainty.

4. **Non-ILS Currency Conversion**: When a transaction has non-ILS currency (USD or EUR), the original amount and currency are preserved, an estimated ILS equivalent is available via `conversionRate`, `isEstimatedConversion: true` is set, and `conversionRate` + `conversionRateDate` are stored.

5. **Photo Receipt Handling**: Photo receipts (camera capture sent via email) are handled with the same pipeline as PDF/image attachments. Gemini's vision capability extracts text from the photo with equivalent reliability.

6. **Transaction Document Fields**: The `transactions` document created by AI processing includes all classification fields: `category` (Gemini-classified, replacing mailbox heuristic), `aiConfidence` (classification confidence), `suggestedWorkOrderId`, `suggestedInventoryItemId`, `classificationReasoning`, `isEstimatedConversion`, `conversionRate`, `conversionRateDate`.

## Tasks / Subtasks

- [x] Task 1: Extend `parsedDocumentSchema` with classification fields (AC: #1, #6)
  - [x] Add `category: z.enum(TRANSACTION_CATEGORIES)` to `parsedDocumentSchema` in `functions/src/shared/schemas.ts`
  - [x] Add `classificationReasoning: z.string()` to `parsedDocumentSchema`
  - [x] Add `suggestedWorkOrderId: z.string().nullable()` to `parsedDocumentSchema`
  - [x] Add `suggestedInventoryItemId: z.string().nullable()` to `parsedDocumentSchema`
  - [x] Update `zod-to-json-schema` output to include new fields for Gemini structured output

- [x] Task 2: Extend transaction schemas with classification + conversion fields (AC: #4, #6)
  - [x] Add to server-side `transactionSchema` in `functions/src/shared/schemas.ts`:
    - `suggestedWorkOrderId: z.string().nullable()`
    - `suggestedInventoryItemId: z.string().nullable()`
    - `classificationReasoning: z.string().nullable()`
    - `isEstimatedConversion: z.boolean()`
    - `conversionRate: z.number().nullable()`
    - `conversionRateDate: z.string().nullable()`
  - [x] Add same fields to client-side `transactionSchema` in `src/types/transaction.ts`
  - [x] Update all existing test fixtures that create Transaction objects (search for `sourceEmailRef` in tests to find them all)

- [x] Task 3: Implement vendor history + work order context querying in `processDocument.ts` (AC: #2, #3)
  - [x] Add `getVendorHistory(db, vendorName)` helper: queries `transactions` collection for approved transactions with matching `vendorName`, returns array of `{ category, workOrderId, count }`
  - [x] Add `getActiveWorkOrders(db)` helper: queries `work_orders` collection, returns array of `{ id, clientName, status }`
  - [x] Call these AFTER initial Gemini extraction (two-pass approach): first call extracts vendor name, second call classifies with context
  - [x] OR pass all known vendors + work orders to Gemini in a single call (single-pass approach — preferred if vendor list is small)

- [x] Task 4: Extend `geminiClient.ts` — classification prompt + context (AC: #1, #2, #3, #5)
  - [x] Add `ClassificationContext` interface: `{ vendorHistory: VendorHistoryEntry[], workOrders: WorkOrderSummary[], inventoryItems: InventoryItemSummary[] }`
  - [x] Update `parseFinancialDocument` signature to accept optional `classificationContext` parameter
  - [x] Extend `buildExtractionPrompt()` to `buildExtractionAndClassificationPrompt(context?)` — include classification instructions, vendor history, work order list, inventory item list
  - [x] Update the Gemini response schema (`responseJsonSchema`) to include classification fields
  - [x] Handle the case where no context is available (new system with no history) — Gemini should still classify based on document content alone

- [x] Task 5: Update `processDocument.ts` — classification flow + currency conversion (AC: #1-6)
  - [x] Remove `MAILBOX_CATEGORY_MAP` heuristic (replaced by Gemini classification)
  - [x] Before Gemini call: query Firestore for vendor history (all unique vendors from approved transactions) and active work orders
  - [x] Pass classification context to `parseFinancialDocument`
  - [x] Use Gemini-returned `category` instead of mailbox heuristic
  - [x] Set `suggestedWorkOrderId`, `suggestedInventoryItemId`, `classificationReasoning` from Gemini response
  - [x] Implement currency conversion logic:
    - For ILS: `isEstimatedConversion = false`, `conversionRate = null`, `conversionRateDate = null`
    - For USD/EUR: query `system_config` for `currencyRates` (fallback to `DEFAULT_CONVERSION_RATES`), set `isEstimatedConversion = true`, store `conversionRate` and `conversionRateDate`
  - [x] Write all new fields to the transaction document

- [x] Task 6: Tests (AC: all)
  - [x] Test Gemini classification response parsing (category, reasoning, suggestions)
  - [x] Test vendor history query returns correct aggregated data
  - [x] Test high-confidence classification for known vendor with history
  - [x] Test low-confidence classification for new/unknown vendor
  - [x] Test `suggestedWorkOrderId` is set from Gemini response
  - [x] Test `suggestedInventoryItemId` is set for restock-type classification
  - [x] Test `classificationReasoning` is stored on transaction
  - [x] Test currency conversion: ILS transaction has `isEstimatedConversion: false`
  - [x] Test currency conversion: USD transaction has `isEstimatedConversion: true`, `conversionRate` set
  - [x] Test currency conversion: EUR transaction with fallback rates
  - [x] Test backward compatibility: existing extraction still works
  - [x] Test schema validation for new `parsedDocumentSchema` fields
  - [x] Test schema validation for new `transactionSchema` fields
  - [x] Update all existing test fixtures with new fields
  - [x] Ensure all existing tests pass (zero regressions)

- [x] Task 7: Build Verification (AC: all)
  - [x] `cd functions && npx tsc --noEmit` — zero TypeScript errors in functions
  - [x] `npm run test` — all client-side tests pass, zero regressions
  - [x] `cd functions && npm run test` — all functions tests pass

## Dev Notes

### Architecture Compliance

- **Cloud Functions 2nd Gen**: Continue using `onDocumentCreated` from `firebase-functions/firestore`. No new Cloud Functions created — this story MODIFIES `processDocument`, not creates a new function. [Source: architecture.md#Cloud-Functions-Inventory]
- **`@google/genai` SDK (NOT `@google/generative-ai`)**: Continue using `@google/genai` v1.40.0. Import: `import { GoogleGenAI } from '@google/genai'`. Model: `"gemini-2.5-pro"`. [Source: architecture.md, Story 4.3 learnings]
- **Structured Output via JSON Schema**: Continue using `responseMimeType: "application/json"` + `responseJsonSchema` (from `zod-to-json-schema`). The extended `parsedDocumentSchema` with classification fields must be converted via `zodToJsonSchema()`. [Source: ai.google.dev/gemini-api/docs/structured-output]
- **Firebase Admin SDK**: `getFirestore()` from `firebase-admin/firestore` for vendor history and work order queries. [Source: architecture.md#Cloud-Functions-Boundary]
- **Separate npm package**: `functions/` has its own `package.json`. Zod schemas shared via manual copy. [Source: architecture.md#Cloud-Functions-Boundary]
- **NodeNext module resolution**: ALL relative imports in `functions/` MUST use `.js` extensions: `../config.js`, `../shared/schemas.js`, `./geminiClient.js`. [Source: functions/tsconfig.json]
- **Naming conventions**: Cloud Functions: `camelCase`, verb-first. Firestore collections: `snake_case`. Document fields: `camelCase`. Boolean fields: prefix with `is` or `has`. Reference fields: suffix with `Id` or `Ref`. Integer currency: suffix with `Agora`. [Source: architecture.md#Naming-Patterns]
- **Integer currency**: All amounts stored in agora/cents (integer). `Math.round(parsedAmount * 100)` for conversion. Currency conversion uses rates from `system_config` or `DEFAULT_CONVERSION_RATES` fallback. [Source: architecture.md#Data-Integrity, lib/currency.ts]
- **Error handling**: Failed classifications still create the transaction with lower confidence. Cloud Logging via `firebase-functions/logger`. Never `console.log`. [Source: architecture.md#Error-Handling]
- **Co-located tests**: Functions tests in `functions/tests/`. Client tests co-located. [Source: architecture.md#Testing-Standards]

### Critical Technical Constraints

- **No new npm dependencies needed** — this story extends existing AI processing using the same `@google/genai` and `zod-to-json-schema` packages from Story 4.3.

- **No new Cloud Functions** — this story modifies `processDocument` and `geminiClient`, not creates new functions. `functions/src/index.ts` needs NO changes.

- **Packages already installed in `functions/`:**
  - `firebase-admin@^13.4.0` — Firestore, Storage admin SDK
  - `firebase-functions@^6.3.2` — 2nd gen Cloud Functions API
  - `googleapis@^171.4.0` — Gmail API client (Story 4.1)
  - `zod@^4.3.6` — Schema validation
  - `@google/genai` (v1.40.0) — Gemini SDK (Story 4.3)
  - `zod-to-json-schema` (v3.25.1) — Zod → JSON Schema (Story 4.3)
  - `vitest@^4.0.18` — Test runner (dev)
  - `typescript@~5.9.3` — TypeScript compiler

- **Existing `functions/` files to MODIFY:**
  - `functions/src/ai/processDocument.ts` — Add vendor history query, classification context, currency conversion, new transaction fields
  - `functions/src/ai/geminiClient.ts` — Extend prompt with classification, add context parameter, extend schema
  - `functions/src/shared/schemas.ts` — Add classification fields to `parsedDocumentSchema` and `transactionSchema`
  - `functions/src/shared/types.ts` — Add new type exports (`ClassificationContext`, `VendorHistoryEntry`, `WorkOrderSummary`)
  - `functions/tests/ai.test.ts` — Add classification, vendor history, currency conversion tests

- **Existing client files to MODIFY:**
  - `src/types/transaction.ts` — Add classification + conversion fields to `transactionSchema`
  - Test fixtures that create Transaction objects (search for `sourceEmailRef` to find all):
    - `src/types/transaction.test.ts`
    - `src/features/dashboard/hooks/useDashboardData.test.ts`
    - `src/features/work-orders/hooks/useTransactionActions.test.ts`
    - `src/features/work-orders/hooks/useTransactionActions.ts` (manual creation hook)

- **Files NOT to modify:**
  - `functions/src/index.ts` — No new exports needed
  - `functions/src/config.ts` — No new secrets/params needed
  - `functions/src/email/gmailClient.ts` — Gmail wrapper, no changes
  - `functions/src/email/onEmailReceived.ts` — Email ingestion, no changes
  - `src/types/email.ts` — Email schema, no changes
  - `functions/tsconfig.json` — NodeNext config is correct
  - Any React components, pages, or route files — server-side story

### Extended ParsedDocument Schema Design

```typescript
// Update in functions/src/shared/schemas.ts
// ADD these fields to parsedDocumentSchema:

export const parsedDocumentSchema = z.object({
  // --- Existing extraction fields (Story 4.3) ---
  vendorName: z.string().min(1),
  date: z.string(), // ISO 8601 format: YYYY-MM-DD
  totalAmount: z.number(), // Raw decimal (e.g., 82.50) — converted to agora later
  currency: z.enum(['ILS', 'USD', 'EUR']),
  lineItems: z.array(parsedLineItemSchema),
  documentType: z.enum(['invoice', 'receipt', 'quote']),
  languageDetected: z.enum(['hebrew', 'english', 'mixed']),
  confidence: z.number().min(0).max(100), // Now reflects OVERALL confidence (extraction + classification)

  // --- NEW classification fields (Story 4.4) ---
  category: z.enum(TRANSACTION_CATEGORIES), // AI-classified category
  classificationReasoning: z.string(), // 1-2 sentence explanation
  suggestedWorkOrderId: z.string().nullable(), // Matched from provided context (Firestore ID)
  suggestedInventoryItemId: z.string().nullable(), // Matched from provided context (Firestore ID)
});
```

**CRITICAL**: `TRANSACTION_CATEGORIES` is already defined in `schemas.ts` (server-side copy). Use the same constant. The Gemini prompt must list the exact enum values so Gemini returns valid values.

### Extended Transaction Schema Design

```typescript
// Update in functions/src/shared/schemas.ts AND src/types/transaction.ts
// ADD these fields to transactionSchema:

// --- NEW fields (Story 4.4) ---
suggestedWorkOrderId: z.string().nullable(),    // AI suggestion — user confirms in Ghost Text (Epic 5)
suggestedInventoryItemId: z.string().nullable(), // AI suggestion for restock items
classificationReasoning: z.string().nullable(),  // AI reasoning for category/project match
isEstimatedConversion: z.boolean(),              // true for non-ILS currencies
conversionRate: z.number().nullable(),           // Rate used (e.g., 3.5 for USD→ILS)
conversionRateDate: z.string().nullable(),       // ISO date when rate was recorded
```

**CRITICAL FIELD DISTINCTIONS:**
- `workOrderId` = CONFIRMED link (set when user approves in Ghost Text review, Epic 5)
- `suggestedWorkOrderId` = AI SUGGESTION (set by this story, shown as Ghost Text for user to confirm/edit)
- `inventoryItemId` = CONFIRMED link (set on approval)
- `suggestedInventoryItemId` = AI SUGGESTION (set by this story)
- `category` = Now Gemini-classified (was mailbox heuristic in 4.3). Still an AI suggestion until user confirms.

### Classification Context Design

```typescript
// Add to functions/src/shared/types.ts

/** Vendor history entry for AI classification context */
export interface VendorHistoryEntry {
  vendorName: string;
  category: string;
  workOrderId: string | null;
  workOrderName: string | null;
  count: number; // Number of times this vendor → workOrder pairing occurred
}

/** Work order summary for AI classification context */
export interface WorkOrderSummary {
  id: string;
  clientName: string;
  status: string;
}

/** Full classification context passed to Gemini */
export interface ClassificationContext {
  vendorHistory: VendorHistoryEntry[];
  workOrders: WorkOrderSummary[];
}
```

**NOTE on inventory**: `src/types/inventory.ts` is currently empty (Epic 6). Until Epic 6 implements inventory, `suggestedInventoryItemId` will always be `null`. The Gemini prompt should still mention inventory categories but note no inventory items exist yet. DO NOT query a non-existent inventory collection.

### Gemini Prompt Extension Design

The `buildExtractionPrompt()` function in `geminiClient.ts` must be extended to `buildExtractionAndClassificationPrompt(context?)`:

```typescript
function buildExtractionAndClassificationPrompt(context?: ClassificationContext): string {
  let prompt = `You are a financial document parser and classifier for a small business (TailorPlayed — custom board game company).
Extract structured data AND classify this financial document. The document may be in Hebrew, English, or mixed.

EXTRACTION RULES:
[... existing extraction rules from Story 4.3 ...]

CLASSIFICATION RULES:
- category: Classify into exactly one of: "DirectCost", "InventoryRestock", "Overhead", "Personal"
  * DirectCost: Materials, production costs, and services directly tied to client projects (game printing, component manufacturing, design services)
  * InventoryRestock: Purchases of stock materials not tied to a specific project (card stock, dice, game boxes, generic components)
  * Overhead: Business expenses not tied to production (software subscriptions, office supplies, meals, shipping supplies, marketing)
  * Personal: Non-business purchases that arrived in business email (rare, flag for rejection)
- classificationReasoning: 1-2 sentences explaining WHY you chose this category and work order match. Reference vendor history if available.
- suggestedWorkOrderId: If the transaction likely relates to a specific work order/project, return the work order ID from the list below. Return null if no match or uncertain.
- suggestedInventoryItemId: If this is an InventoryRestock purchase and matches a known inventory item, return the item ID. Return null if no match or N/A.
- confidence: Overall confidence (0-100) considering BOTH extraction accuracy AND classification certainty. Lower confidence for: new vendors, ambiguous categories, blurry documents, missing context.`;

  // Add vendor history context if available
  if (context?.vendorHistory.length) {
    prompt += `\n\nKNOWN VENDOR HISTORY (use for classification and work order matching):`;
    for (const entry of context.vendorHistory) {
      prompt += `\n- "${entry.vendorName}" → typically ${entry.category}`;
      if (entry.workOrderName) {
        prompt += `, linked to project "${entry.workOrderName}" (${entry.count} times)`;
      }
    }
  } else {
    prompt += `\n\nNO VENDOR HISTORY AVAILABLE — classify based on document content and mailbox context only.`;
  }

  // Add active work orders
  if (context?.workOrders.length) {
    prompt += `\n\nACTIVE WORK ORDERS (for project suggestion — use ID in suggestedWorkOrderId):`;
    for (const wo of context.workOrders) {
      prompt += `\n- id: "${wo.id}", project: "${wo.clientName}", status: ${wo.status}`;
    }
  } else {
    prompt += `\n\nNO ACTIVE WORK ORDERS — set suggestedWorkOrderId to null.`;
  }

  // Note about inventory
  prompt += `\n\nINVENTORY: No inventory items available yet. Set suggestedInventoryItemId to null.`;

  return prompt;
}
```

**CRITICAL PROMPT NOTES:**
- The prompt must list exact enum values for `category` so Gemini returns valid values that pass Zod validation.
- Work order IDs are passed in the prompt so Gemini can return a valid Firestore ID (not just a name that needs fuzzy matching).
- Vendor history is aggregated BEFORE the Gemini call — we query `transactions` for all approved transactions, group by vendor name, and count work order associations.

### processDocument Classification Flow Design

```typescript
// Updated flow in processDocument.ts:

// 1. Update status to 'processing' (existing)
// 2. Get attachment URL + mime type (existing)
// 3. NEW: Query classification context from Firestore
//    a. Query 'transactions' where status='approved', group by vendorName
//    b. For each vendor: most common category, most common workOrderId, count
//    c. Query 'work_orders' collection for active orders (id, clientName, status)
// 4. Call Gemini with extended prompt + classification context
// 5. Use Gemini-returned category (REPLACES mailbox heuristic)
// 6. Handle currency conversion:
//    a. ILS: isEstimatedConversion=false, conversionRate=null
//    b. USD/EUR: Query system_config for currencyRates, fallback to DEFAULT_CONVERSION_RATES
//       Set isEstimatedConversion=true, conversionRate, conversionRateDate
// 7. Create transaction with ALL fields (existing + new classification + conversion)
// 8. Update email_log (existing)
```

**CRITICAL: Remove MAILBOX_CATEGORY_MAP** — The mailbox heuristic (`orders → DirectCost`, etc.) is no longer needed. Gemini now classifies based on document content + vendor history + work order context, which is far more accurate. The mailbox can still be included in the Gemini prompt as a hint but should NOT override Gemini's classification.

### Vendor History Query Design

```typescript
// Helper function in processDocument.ts

async function getVendorHistory(db: FirebaseFirestore.Firestore): Promise<VendorHistoryEntry[]> {
  // Query all approved transactions for vendor history
  const snapshot = await db.collection('transactions')
    .where('status', '==', 'approved')
    .where('source', '==', 'ai')
    .get();

  // Aggregate by vendor name
  const vendorMap = new Map<string, Map<string, { category: string; workOrderId: string | null; count: number }>>();

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const vendor = data.vendorName as string;
    if (!vendorMap.has(vendor)) vendorMap.set(vendor, new Map());

    const key = `${data.category}|${data.workOrderId ?? 'none'}`;
    const existing = vendorMap.get(vendor)!.get(key);
    if (existing) {
      existing.count++;
    } else {
      vendorMap.get(vendor)!.set(key, {
        category: data.category,
        workOrderId: data.workOrderId,
        count: 1,
      });
    }
  }

  // Flatten to entries array — one entry per vendor+workOrder combination
  const entries: VendorHistoryEntry[] = [];
  for (const [vendorName, combos] of vendorMap) {
    for (const combo of combos.values()) {
      entries.push({
        vendorName,
        category: combo.category,
        workOrderId: combo.workOrderId,
        workOrderName: null, // Enriched with work order name below
        count: combo.count,
      });
    }
  }

  return entries;
}
```

**Performance note**: This queries ALL approved AI transactions. For a small business like TailorPlayed, this is fine (< 1000 transactions). If scale becomes an issue, add a Firestore composite index on `status + source` and limit to last 6 months.

### Currency Conversion Design

```typescript
// In processDocument.ts

async function getConversionRates(
  db: FirebaseFirestore.Firestore,
): Promise<{ rates: Record<string, number>; date: string | null }> {
  try {
    const configDoc = await db.collection('system_config').doc('currency').get();
    if (configDoc.exists) {
      const data = configDoc.data();
      return {
        rates: data?.currencyRates ?? {},
        date: data?.updatedAt ?? null,
      };
    }
  } catch (error) {
    logger.warn('Failed to load currency rates from system_config, using defaults', {
      error: error instanceof Error ? error.message : String(error),
    });
  }

  // Fallback to hardcoded defaults
  return {
    rates: { USD: 3.5, EUR: 3.8, ILS: 1 },
    date: null,
  };
}

// Usage in processDocument:
const isEstimatedConversion = parsed.currency !== 'ILS';
let conversionRate: number | null = null;
let conversionRateDate: string | null = null;

if (isEstimatedConversion) {
  const { rates, date } = await getConversionRates(db);
  conversionRate = rates[parsed.currency] ?? DEFAULT_CONVERSION_RATES[parsed.currency];
  conversionRateDate = date ?? new Date().toISOString().split('T')[0];
}
```

**CRITICAL**: `DEFAULT_CONVERSION_RATES` is defined in `src/lib/currency.ts`. For the server side, either import from a shared location or define server-side defaults. Since `functions/src/shared/currency.ts` is a placeholder, ADD the defaults there.

### Updated Transaction Document Fields

The transaction document written by `processDocument` will now include:

```typescript
await db.collection('transactions').add({
  // --- Existing fields (unchanged) ---
  vendorName: parsed.vendorName,
  amountAgora,
  currency: parsed.currency,
  date: parsedDate,
  workOrderId: null,       // Confirmed link — set by Ghost Text approval (Epic 5)
  inventoryItemId: null,   // Confirmed link — set by Ghost Text approval (Epic 5)
  status: 'pending_review',
  originalFileUrl: documentUrl,
  source: 'ai',
  sourceEmailRef: event.params.docId,
  notes: null,
  createdAt: FieldValue.serverTimestamp(),
  updatedAt: FieldValue.serverTimestamp(),

  // --- Updated fields (now from Gemini classification) ---
  category: parsed.category,                   // Was mailbox heuristic, now Gemini-classified
  aiConfidence: parsed.confidence,             // Now includes classification confidence

  // --- NEW classification fields ---
  suggestedWorkOrderId: parsed.suggestedWorkOrderId,
  suggestedInventoryItemId: parsed.suggestedInventoryItemId,
  classificationReasoning: parsed.classificationReasoning,

  // --- NEW currency conversion fields ---
  isEstimatedConversion,
  conversionRate,
  conversionRateDate,
});
```

### Client-Side Transaction Schema Update

```typescript
// Add to src/types/transaction.ts transactionSchema:
suggestedWorkOrderId: z.string().nullable(),
suggestedInventoryItemId: z.string().nullable(),
classificationReasoning: z.string().nullable(),
isEstimatedConversion: z.boolean(),
conversionRate: z.number().nullable(),
conversionRateDate: z.string().nullable(),
```

**CRITICAL**: The `createTransactionSchema` (for manual transaction creation in `useTransactionActions.ts`) does NOT need these fields — they are AI-only fields. Manual transactions should set them to defaults when writing to Firestore:
- `suggestedWorkOrderId: null`
- `suggestedInventoryItemId: null`
- `classificationReasoning: null`
- `isEstimatedConversion: false` (manual ILS entry) or calculate based on currency
- `conversionRate: null`
- `conversionRateDate: null`

The `useTransactionActions.ts` hook's `createTransaction` function already writes to Firestore directly — update the fields it writes.

### Project Structure Notes

**Files to MODIFY:**

| File | Change |
|---|---|
| `functions/src/ai/geminiClient.ts` | Extend `parseFinancialDocument` with classification context param; extend prompt with classification instructions, vendor history, work order list; update Gemini response schema |
| `functions/src/ai/processDocument.ts` | Remove `MAILBOX_CATEGORY_MAP`; add vendor history + work order query helpers; add currency conversion helpers; pass context to Gemini; write new classification + conversion fields to transaction |
| `functions/src/shared/schemas.ts` | Add classification fields to `parsedDocumentSchema`; add classification + conversion fields to `transactionSchema` |
| `functions/src/shared/types.ts` | Add `VendorHistoryEntry`, `WorkOrderSummary`, `ClassificationContext` interfaces |
| `functions/src/shared/currency.ts` | Add `DEFAULT_CONVERSION_RATES` constant (server-side copy from `src/lib/currency.ts`) |
| `functions/tests/ai.test.ts` | Add classification tests, vendor history tests, currency conversion tests, update existing test fixtures |
| `src/types/transaction.ts` | Add classification + conversion fields to `transactionSchema` |
| `src/types/transaction.test.ts` | Add new fields to fixtures + validation tests |
| `src/features/dashboard/hooks/useDashboardData.test.ts` | Add new fields to Transaction fixtures |
| `src/features/work-orders/hooks/useTransactionActions.test.ts` | Add new fields to expected objects |
| `src/features/work-orders/hooks/useTransactionActions.ts` | Add new default fields when creating manual transactions |

**Files NOT to modify:**

- `functions/src/index.ts` — No new exports needed (processDocument already exported)
- `functions/src/config.ts` — No new secrets/params needed
- `functions/src/email/gmailClient.ts` — Gmail wrapper, no changes
- `functions/src/email/onEmailReceived.ts` — Email ingestion, no changes
- `src/types/email.ts` — Email schema, no changes
- `functions/tsconfig.json` — NodeNext config is correct
- Any React components, pages, stores, or hooks (except `useTransactionActions.ts`)

### Previous Story Intelligence (Story 4.3)

**Key patterns and learnings from Story 4.3:**

- **`initializeApp()` is already called** at the top of `functions/src/index.ts`. Do NOT call it again.
- **Import paths require `.js` extension**: `../config.js`, `../shared/schemas.js`, `./geminiClient.js`. Without them, NodeNext module resolution fails at runtime.
- **`vi.mock` pattern for external dependencies** in tests. Mock `@google/genai`, `firebase-admin/firestore`, `firebase-admin/storage`, `firebase-functions/logger`.
- **`GoogleGenAI` mock pattern**: Use `class MockGoogleGenAI` with `models.generateContent` mock.
- **`FieldValue.serverTimestamp()` for timestamps** — use in `createdAt`, `updatedAt`.
- **Zod 4 `.default()` creates type divergence** — DO NOT use `.default()` on schemas. Define all fields explicitly.
- **Test counts**: 631 client-side tests + 57 functions tests = 688 total currently passing. Zero regressions required.
- **`zod-to-json-schema` v3.25.1 has Zod 3 types** — cast via `as unknown as Parameters<typeof zodToJsonSchema>[0]` for Zod 4 compatibility (runtime works fine).
- **Nested try-catch in error handler** — processDocument uses nested try-catch to prevent stuck 'processing' state if even the error update fails.
- **Date validation** — validate `new Date(parsed.date)` with `isNaN(parsedDate.getTime())` before Firestore write.
- **`sass-embedded` dispatcher race condition on `npm run build`** is pre-existing — not a regression.

**From Story 4.3 code review fixes:**
- Nested try-catch in error handler to prevent stuck 'processing' state
- Date validation before Firestore write
- Storage download failure test
- Unknown mailbox fallback test
- Invalid date from Gemini test
- `.min(1)` on vendorName in parsedDocumentSchema

### Git Intelligence

**Most recent commits:**
- `db4c7bb` — Implement Story 4.3: AI Document Processing with Gemini with code review fixes
- `4a761e3` — Implement Story 4.2: Paperless Auto-Forward with code review fixes
- `95177a4` — Implement Story 4.1: Gmail API Integration & Email Detection with code review fixes

**Established code patterns:**
- Single comprehensive commit per story
- `vi.mock` for external dependencies in tests
- Test structure: `describe` blocks by function/component, `it`/`test` cases for success/error paths
- Barrel exports with `index.ts` for every directory
- `useMemo` for all derived data in hooks
- `vi.clearAllMocks()` in `beforeEach`

**Files modified in Story 4.3 that this story also modifies:**
- `functions/src/ai/processDocument.ts` — adding classification + currency logic
- `functions/src/ai/geminiClient.ts` — extending prompt + parameters
- `functions/src/shared/schemas.ts` — extending schemas
- `functions/src/shared/types.ts` — adding new interfaces
- `functions/tests/ai.test.ts` — adding classification tests
- `src/types/transaction.ts` — adding new fields

### Latest Technical Information

**@google/genai v1.40.0 (same as Story 4.3):**
- `new GoogleGenAI({ apiKey })` — create client
- `ai.models.generateContent({ model, contents, config })` — generate content
- Structured output: `config.responseMimeType = "application/json"` + `config.responseJsonSchema`
- Use `zodToJsonSchema()` with Zod 4 cast: `zodToJsonSchema(schema as unknown as Parameters<typeof zodToJsonSchema>[0])`
- `response.text` returns JSON string
- **IMPORTANT**: Extending the schema with classification fields will change the JSON Schema sent to Gemini. Test that Gemini returns valid structured output for ALL new fields.

**Gemini 2.5 Pro Classification Capability:**
- Gemini can classify documents into categories when given explicit category definitions in the prompt
- Confidence scoring works well when the prompt explains what affects confidence (vendor familiarity, document clarity, category ambiguity)
- Providing vendor history in the prompt context significantly improves classification accuracy and confidence
- Work order matching works by providing IDs+names in the prompt — Gemini returns the ID

**Firestore Querying in Cloud Functions:**
- `db.collection('transactions').where('status', '==', 'approved').get()` — queries all approved transactions
- `db.collection('work_orders').get()` — queries all work orders
- These are executed BEFORE the Gemini call, adding ~1-3s to processing time. Within the 30s NFR4 budget (Gemini itself takes 5-15s, Firestore queries + writes take 2-5s).
- Consider adding composite index for `status + source` if query becomes slow.

### Potential Pitfalls to Avoid

1. **DO NOT create a new Cloud Function** — this story modifies `processDocument`, not creates a new function. No new exports in `functions/src/index.ts`.

2. **DO NOT forget `.js` extensions** in function imports. `../config.js`, `../shared/schemas.js`, `./geminiClient.js`.

3. **DO NOT keep `MAILBOX_CATEGORY_MAP`** as the primary classification — Gemini classification replaces it entirely. You may keep mailbox as a HINT in the Gemini prompt but not as the final category source.

4. **DO NOT query inventory collection** — `src/types/inventory.ts` is empty (Epic 6). The inventory collection does not exist yet. Set `suggestedInventoryItemId` to null always. Include inventory in the prompt structure for future compatibility.

5. **DO NOT use `z.number().default(0)` or any `.default()`** on Zod schemas. Zod 4 `.default()` creates type divergence.

6. **DO NOT use `console.log`** in Cloud Functions. Use `firebase-functions/logger`.

7. **DO NOT re-throw errors** in processDocument's catch block. Set `status: 'unprocessed'` and return.

8. **DO NOT store signed URLs** for documents. Use Firebase Storage paths.

9. **Handle empty vendor history gracefully** — When the system is new or no transactions have been approved yet, the vendor history will be empty. Gemini should still classify based on document content alone. The prompt should handle this case.

10. **Handle missing `system_config/currency` document** — The currency rates document may not exist yet. Fall back to `DEFAULT_CONVERSION_RATES` (`USD: 3.5`, `EUR: 3.8`).

11. **Amount precision**: Continue using `Math.round(parsed.totalAmount * 100)` for agora conversion. The `conversionRate` field stores the rate used, not the converted amount.

12. **Test fixture updates are CRITICAL** — Every test that creates a Transaction object must include the new fields. Search for `sourceEmailRef` across all test files to find them (it was added in Story 4.3 and is present in all fixtures).

13. **Mock Firestore queries in tests** — The new vendor history and work order queries need to be mocked. Use the existing `mockCollection` pattern but add support for `.where().get()` chaining.

14. **`parseFinancialDocument` backward compatibility** — The context parameter should be OPTIONAL so existing tests don't break. When no context is provided, the prompt should still work (extraction only, no classification context).

15. **Gemini model name**: Use `"gemini-2.5-pro"`. NOT `"gemini-2.5-pro-latest"`.

16. **`onDocumentCreated` event shape**: `event.data` (DocumentSnapshot, can be null), `event.params` (route params like `docId`). Always null-check.

17. **ILS transactions need `isEstimatedConversion: false`** — For ILS, don't skip the field — explicitly set it to `false`. The schema requires a boolean, not nullable.

### Cross-Story Context

This is **Story 4.4** — the fourth story in Epic 4 (Email Ingestion & AI Document Processing):

- **Epic 1** (DONE): Project scaffold, design system, auth, app shell, i18n, shared components
- **Epic 2** (DONE): Work Order CRUD, status lifecycle, manual transactions, Nutrition Label, detail page
- **Epic 3** (DONE): Dashboard, KPI cards, project health table, real-time data layer
- **Epic 4** (IN PROGRESS):
  - Story 4.1 (REVIEW): Gmail API Integration & Email Detection — pipeline foundation
  - Story 4.2 (DONE): Paperless Auto-Forward — infrastructure + audit tracking
  - Story 4.3 (DONE): AI Document Processing with Gemini — `processDocument` Cloud Function
  - **Story 4.4 (this)**: Transaction Classification & Confidence Scoring — extends Gemini with classification
  - Story 4.5 (BACKLOG): Error Handling, Retry & Pipeline Resilience — retry function

**This story enhances the AI brain of the pipeline.** It takes the basic extraction from Story 4.3 and adds intelligent classification: category assignment, work order suggestions, vendor history matching, and currency handling. The output flows into the Ghost Text review UI (Epic 5) where Gal confirms or edits the AI suggestions.

**Pipeline state machine after this story:**
```
Email arrives → onEmailReceived (4.1) → email_log{status:'received'} → processDocument (4.3+4.4) → email_log{status:'processed'} + transactions{status:'pending_review', category: AI-classified, suggestedWorkOrderId: AI-suggested, aiConfidence: 0-100}
```

**Upstream dependencies (already done):**
- Story 4.3 created `processDocument` with basic extraction + preliminary mailbox-based category
- Story 4.3 created `geminiClient.ts` with `parseFinancialDocument`
- Story 4.3 created `parsedDocumentSchema` for Gemini output

**Downstream dependencies:**
- Story 4.5 creates `retryFailedProcessing` — no impact on classification
- Epic 5 (Ghost Text Review) reads `transactions` with `status: 'pending_review'` and displays `suggestedWorkOrderId`, `category`, `classificationReasoning`, `aiConfidence` as Ghost Text fields for user review. The new fields from this story are REQUIRED for the Ghost Text UI to work properly.

**What this story does NOT include (deferred):**
- Ghost Text UI for reviewing classifications (Epic 5)
- `onTransactionApproved` Cloud Function for post-approval side effects (Epic 5, Story 5.4)
- Inventory data model (Epic 6) — `suggestedInventoryItemId` will be null until then
- Live currency rate API integration (deferred — uses manual rates from `system_config` or defaults)

### References

- [Source: planning-artifacts/epics.md#Story-4.4] — Full acceptance criteria with BDD scenarios
- [Source: planning-artifacts/epics.md#Epic-4] — Epic context for email ingestion pipeline
- [Source: planning-artifacts/architecture.md#Cloud-Functions-Inventory] — processDocument function spec
- [Source: planning-artifacts/architecture.md#Cloud-Functions-Boundary] — Separate npm package, shared schemas
- [Source: planning-artifacts/architecture.md#Firestore-Collections] — transactions, work_orders, system_config
- [Source: planning-artifacts/architecture.md#Naming-Patterns] — camelCase, boolean `is` prefix, `Id` suffix, `Agora` suffix
- [Source: planning-artifacts/architecture.md#Data-Integrity] — Integer currency (agora/cents)
- [Source: planning-artifacts/architecture.md#Data-Flow-Patterns] — Firestore → Zod → Zustand → React
- [Source: planning-artifacts/architecture.md#Error-Handling] — Cloud Functions error patterns
- [Source: implementation-artifacts/4-3-ai-document-processing-gemini.md] — Previous story: complete implementation details, code patterns, test fixtures, pitfalls
- [Source: functions/src/ai/processDocument.ts] — Current processDocument code (to be modified)
- [Source: functions/src/ai/geminiClient.ts] — Current geminiClient code (to be modified)
- [Source: functions/src/shared/schemas.ts] — Current parsedDocumentSchema + transactionSchema (to be extended)
- [Source: functions/src/shared/types.ts] — Current server types (to be extended)
- [Source: functions/tests/ai.test.ts] — Current AI tests (to be extended)
- [Source: src/types/transaction.ts] — Current client transaction schema (to be extended)
- [Source: src/lib/currency.ts] — Currency utilities: toMinorUnits, toIlsAgora, DEFAULT_CONVERSION_RATES, isEstimatedCurrency
- [Source: src/types/workOrder.ts] — WorkOrder schema (id, clientName, status)
- [Source: src/types/inventory.ts] — Empty placeholder (Epic 6)

## Dev Agent Record

### Agent Model Used

Claude claude-4.6-opus (Cursor)

### Debug Log References

- Tests failed initially after Task 3 because `MAILBOX_CATEGORY_MAP` was removed but handler still referenced it. Fixed by implementing Tasks 3-5 together (tightly coupled: helpers, geminiClient, handler).
- Firestore mock needed updating to support `.where().where().get()` chain, `.doc().get()`, and collection-level `.get()` for vendor history, work order, and currency config queries.

### Completion Notes List

- **Task 1**: Added `category`, `classificationReasoning`, `suggestedWorkOrderId`, `suggestedInventoryItemId` to `parsedDocumentSchema`. Gemini structured output now includes classification fields via `zod-to-json-schema`.
- **Task 2**: Added 6 new fields to both server-side and client-side `transactionSchema`: `suggestedWorkOrderId`, `suggestedInventoryItemId`, `classificationReasoning`, `isEstimatedConversion`, `conversionRate`, `conversionRateDate`. Updated all test fixtures (5 test files). Updated `useTransactionActions.ts` to write default values for manual transactions.
- **Task 3**: Implemented `getVendorHistory()`, `getActiveWorkOrders()`, and `getConversionRates()` helpers in `processDocument.ts`. Added `VendorHistoryEntry`, `WorkOrderSummary`, `ClassificationContext` interfaces to `types.ts`. Added `DEFAULT_CONVERSION_RATES` to server-side `currency.ts`.
- **Task 4**: Replaced `buildExtractionPrompt()` with `buildExtractionAndClassificationPrompt(context?)` in `geminiClient.ts`. Extended prompt with category definitions, vendor history, work order list, inventory note. Made `classificationContext` parameter optional for backward compatibility.
- **Task 5**: Removed `MAILBOX_CATEGORY_MAP` entirely — Gemini now classifies categories. Added `Promise.all` for parallel vendor history + work order queries. Added currency conversion logic (ILS: no conversion, USD/EUR: query `system_config` with fallback to defaults). Transaction document now includes all classification + conversion fields.
- **Task 6**: Added 32 new tests (85 functions + 635 client = 720 total). Covers: classification parsing, vendor history aggregation, high/low confidence, work order suggestions, inventory item suggestions, classification reasoning, ILS/USD/EUR conversion, system_config rates, fallback rates, schema validation for all new fields, backward compatibility.
- **Task 7**: `tsc --noEmit` — zero errors. All 720 tests pass. Zero regressions.

### Change Log

- 2026-02-08: Implemented Story 4.4 — Transaction Classification & Confidence Scoring. Replaced mailbox heuristic with Gemini AI classification. Added vendor history context, work order suggestions, currency conversion. 32 new tests added (720 total).
- 2026-02-08: Code review fixes — 7 issues found (4 MEDIUM, 3 LOW), all fixed. Added try-catch resilience for classification context queries, enriched vendor history with work order names, stored conversionRate for manual non-ILS transactions, filtered out Shipped work orders from context, added type guards in getActiveWorkOrders. 5 new tests added (725 total).

### File List

**Modified:**
- `functions/src/ai/geminiClient.ts` — Extended with classification prompt, context parameter, classification instructions
- `functions/src/ai/processDocument.ts` — Removed MAILBOX_CATEGORY_MAP, added vendor history/work order/currency helpers, full classification + conversion flow
- `functions/src/shared/schemas.ts` — Added classification fields to parsedDocumentSchema + conversion fields to transactionSchema
- `functions/src/shared/types.ts` — Added VendorHistoryEntry, WorkOrderSummary, ClassificationContext interfaces
- `functions/src/shared/currency.ts` — Added DEFAULT_CONVERSION_RATES (server-side copy)
- `functions/tests/ai.test.ts` — Updated fixtures, added 28 new tests for classification + conversion
- `src/types/transaction.ts` — Added classification + conversion fields to client transactionSchema
- `src/types/transaction.test.ts` — Updated fixture, added 4 new field validation tests
- `src/features/work-orders/hooks/useTransactionActions.ts` — Added default AI-only field values for manual transactions
- `src/features/work-orders/hooks/useTransactionActions.test.ts` — Updated expected transaction object with new fields
- `src/features/dashboard/hooks/useDashboardData.test.ts` — Updated mock type + createTransaction fixture with new fields
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — Story status: ready-for-dev → in-progress → review
