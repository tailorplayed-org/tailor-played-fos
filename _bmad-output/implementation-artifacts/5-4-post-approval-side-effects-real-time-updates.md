# Story 5.4: Post-Approval Side Effects & Real-Time Updates

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As **the system**,
I want confirmed transactions to automatically update all related financial data,
So that the dashboard, Nutrition Labels, and Tax Jar always reflect the latest truth.

## Acceptance Criteria

1. **Approval Trigger**: When a transaction document in Firestore changes `status` from `'pending_review'` to `'approved'`, the `onTransactionApproved` Cloud Function (`functions/src/triggers/onTransactionApproved.ts`) triggers via `onDocumentUpdated`.

2. **DirectCost Side Effect**: When an approved transaction has `category: 'DirectCost'` and a `workOrderId`, the linked Work Order's `directCostAgora` is atomically incremented by `amountAgora`, and the Work Order's `updatedAt` is set to `FieldValue.serverTimestamp()`. The Nutrition Label on any open client recalculates via real-time Firestore listener.

3. **Revenue Side Effect**: When an approved transaction has `category: 'Revenue'` and a `workOrderId`, the linked Work Order's `revenueTotalAgora` is atomically incremented by `amountAgora`.

4. **InventoryRestock Side Effect**: When an approved transaction has `category: 'InventoryRestock'` and a `workOrderId`, the linked Work Order's `inventoryCostAgora` is atomically incremented by `amountAgora`.

5. **Overhead Side Effect**: When an approved transaction has `category: 'Overhead'`, no Work Order update is needed — overhead is already tracked via the transactions collection and the dashboard computes overhead totals directly from approved transactions. (Overhead management in Epic 7 will add more handling.)

6. **Personal Side Effect**: When an approved transaction has `category: 'Personal'`, no financial side effect occurs — personal expenses are excluded from all business calculations.

7. **Audit Trail**: When any transaction approval completes, an audit trail document is created in the `audit_log` collection with: `transactionId`, `action: 'approved'`, `actorUid` (from auth context), `timestamp` (server-generated), `beforeSnapshot` (transaction data before update), `afterSnapshot` (transaction data after update).

8. **Rejection Audit Trail**: When a transaction changes status to `'rejected'`, an audit trail document is created with `action: 'rejected'` and the same before/after snapshots. No financial side effects for rejections.

9. **Performance**: The entire trigger completes within 2 seconds (FR31, NFR2).

10. **Dashboard Real-Time Updates**: When the dashboard is open and a transaction is approved, the existing Firestore `onSnapshot` listeners detect Work Order and transaction changes — Net Profit KPI updates, Tax Jar recalculates, Project Health Table margin updates, and Pending Review count decrements. All without manual refresh.

11. **Batch Approval Safety**: When multiple transactions are approved simultaneously (Approve All in Story 5.5), each trigger processes independently. Work Order totals reflect the sum of all approved amounts. No race conditions occur because `FieldValue.increment()` is used for atomic counter updates.

12. **Idempotency Guard**: The function includes guards to prevent duplicate processing — if the status didn't actually change (before === after), the function returns early. If the Work Order doesn't exist, the error is logged but doesn't crash the function.

## Tasks / Subtasks

- [x] Task 1: Create `onTransactionApproved` Cloud Function (AC: #1, #2, #3, #4, #5, #6, #9, #11, #12)
  - [x] Create `functions/src/triggers/onTransactionApproved.ts`
  - [x] Use `onDocumentUpdatedWithAuthContext` from `firebase-functions/firestore` to capture actor UID
  - [x] Guard: only process when `before.status !== after.status` AND `after.status === 'approved'`
  - [x] Guard: verify `before.status === 'pending_review'` (expected transition)
  - [x] Extract `category`, `amountAgora`, `workOrderId` from `after` snapshot
  - [x] Category-based routing: DirectCost → increment `directCostAgora`, Revenue → increment `revenueTotalAgora`, InventoryRestock → increment `inventoryCostAgora`
  - [x] Use `FieldValue.increment(amountAgora)` for atomic counter updates on the Work Order document
  - [x] Set `updatedAt: FieldValue.serverTimestamp()` on the updated Work Order
  - [x] Skip Work Order update if `workOrderId` is null or empty
  - [x] Skip Work Order update for `Overhead` and `Personal` categories
  - [x] Verify Work Order exists before update — log warning if missing, don't crash
  - [x] Log success with structured data: `transactionId`, `category`, `workOrderId`, `amountAgora`

- [x] Task 2: Create `onTransactionRejected` handler (AC: #8)
  - [x] In the same file, handle rejection: when `after.status === 'rejected'`
  - [x] No financial side effects — only audit trail creation
  - [x] Guard: verify `before.status === 'pending_review'` (expected transition)

- [x] Task 3: Create audit trail logging (AC: #7, #8)
  - [x] Create helper function `createAuditLog` in `functions/src/triggers/onTransactionApproved.ts`
  - [x] Write to `audit_log` collection with: `transactionId`, `action` ('approved' | 'rejected'), `actorUid`, `timestamp: FieldValue.serverTimestamp()`, `beforeSnapshot` (full before data), `afterSnapshot` (full after data)
  - [x] `actorUid` from `event.authId` (via `onDocumentUpdatedWithAuthContext`) — fallback to `'system'` if unavailable
  - [x] Audit trail creation is fire-and-forget — errors logged but don't block the main function

- [x] Task 4: Export the new Cloud Function (AC: #1)
  - [x] Add export to `functions/src/index.ts`: `export { onTransactionStatusChanged } from './triggers/onTransactionApproved.js'`
  - [x] The function handles both approval and rejection in a single `onDocumentUpdated` trigger

- [x] Task 5: Add server-side audit log schema (AC: #7, #8)
  - [x] Add `auditLogSchema` to `functions/src/shared/schemas.ts`
  - [x] Fields: `transactionId: string`, `action: 'approved' | 'rejected'`, `actorUid: string`, `timestamp: any` (Firestore Timestamp), `beforeSnapshot: object`, `afterSnapshot: object`
  - [x] Export `AuditLog` type from `functions/src/shared/types.ts`

- [x] Task 6: Write Cloud Function tests (AC: #1–#12)
  - [x] Create `functions/tests/triggers.test.ts`
  - [x] Test: approved DirectCost with workOrderId → `directCostAgora` incremented
  - [x] Test: approved Revenue with workOrderId → `revenueTotalAgora` incremented
  - [x] Test: approved InventoryRestock with workOrderId → `inventoryCostAgora` incremented
  - [x] Test: approved Overhead → no Work Order update
  - [x] Test: approved Personal → no Work Order update
  - [x] Test: approved with null workOrderId → no Work Order update, no error
  - [x] Test: rejected transaction → only audit trail, no Work Order update
  - [x] Test: status change from `pending_review` to `approved` creates audit trail document
  - [x] Test: status change to `rejected` creates audit trail document with `action: 'rejected'`
  - [x] Test: no-op when status doesn't change (before === after)
  - [x] Test: no-op when `after.status` is not `approved` or `rejected` (e.g., `in_progress`)
  - [x] Test: Work Order not found → logs warning, doesn't crash
  - [x] Test: audit trail error doesn't block main function
  - [x] Test: batch scenario — multiple increments don't interfere (FieldValue.increment is atomic)
  - [x] Test: `actorUid` extracted from auth context, falls back to `'system'`

- [x] Task 7: Verify real-time client-side updates work (AC: #10)
  - [x] Verify NO client-side code changes needed — existing `useFirestoreCollection` listeners on `work_orders` and `transactions` propagate changes automatically
  - [x] Verify `useDashboardData` recomputes KPIs when transaction store updates (it already does via `useMemo` dependency on `txnStore.transactions`)
  - [x] Verify `selectPendingReview` selector automatically excludes newly approved items
  - [x] Run `tsc --noEmit` from functions directory — zero TypeScript errors

## Dev Notes

### Architecture & Patterns

- **Trigger type**: `onDocumentUpdatedWithAuthContext` from `firebase-functions/firestore` — provides `event.data.before` and `event.data.after` snapshots plus `event.authId` for the actor UID
- **Atomic counters**: Use `FieldValue.increment(amountAgora)` for Work Order total updates — this is safe for concurrent batch approvals without needing `runTransaction`. Each increment is atomic at the Firestore level.
- **Single trigger, dual handling**: One `onDocumentUpdated` trigger handles both approval and rejection by checking `after.status`. This is more efficient than two separate triggers on the same collection.
- **Infinite loop prevention**: The function only reacts to status changes (`before.status !== after.status`), so updating `updatedAt` on the Work Order doesn't re-trigger this function (it watches `transactions`, not `work_orders`).
- **Fire-and-forget audit**: Audit trail creation uses `Promise.all` or sequential writes but errors in audit logging don't throw — they're logged via `firebase-functions/logger`.

### Cloud Function File Pattern

Follow the exact pattern from `functions/src/ai/processDocument.ts`:
- Import from `firebase-functions/firestore` (NOT `firebase-functions/v2/firestore`)
- Import `getFirestore`, `FieldValue` from `firebase-admin/firestore`
- Import `* as logger` from `firebase-functions/logger`
- Use `.js` extension in import paths (NodeNext module resolution)
- Export the function as a named export

### `onDocumentUpdatedWithAuthContext` API

```typescript
import { onDocumentUpdatedWithAuthContext } from 'firebase-functions/firestore';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import * as logger from 'firebase-functions/logger';

export const onTransactionStatusChanged = onDocumentUpdatedWithAuthContext(
  'transactions/{docId}',
  async (event) => {
    const before = event.data.before.data();
    const after = event.data.after.data();
    const transactionId = event.params.docId;
    const actorUid = event.authId ?? 'system';

    // Guard: only process actual status changes
    if (before.status === after.status) return;

    if (after.status === 'approved') {
      await handleApproval(transactionId, before, after, actorUid);
    } else if (after.status === 'rejected') {
      await handleRejection(transactionId, before, after, actorUid);
    }
  },
);
```

### Work Order Update Pattern

```typescript
const db = getFirestore();

async function updateWorkOrderTotals(
  workOrderId: string,
  category: string,
  amountAgora: number,
): Promise<void> {
  const woRef = db.collection('work_orders').doc(workOrderId);

  // Verify Work Order exists
  const woDoc = await woRef.get();
  if (!woDoc.exists) {
    logger.warn('Work Order not found for transaction side effect', { workOrderId });
    return;
  }

  const fieldMap: Record<string, string> = {
    DirectCost: 'directCostAgora',
    Revenue: 'revenueTotalAgora',
    InventoryRestock: 'inventoryCostAgora',
  };

  const field = fieldMap[category];
  if (!field) return; // Overhead, Personal — no WO update

  await woRef.update({
    [field]: FieldValue.increment(amountAgora),
    updatedAt: FieldValue.serverTimestamp(),
  });
}
```

### Audit Trail Document Structure

```typescript
// Collection: audit_log
{
  transactionId: string,        // Reference to the transaction document
  action: 'approved' | 'rejected',
  actorUid: string,             // From auth context, or 'system' fallback
  timestamp: Timestamp,         // FieldValue.serverTimestamp()
  beforeSnapshot: {             // Full transaction data before change
    status: 'pending_review',
    category: 'DirectCost',
    amountAgora: 58000,
    workOrderId: 'wo-david-game',
    // ... all other transaction fields
  },
  afterSnapshot: {              // Full transaction data after change
    status: 'approved',
    // ... all other transaction fields
  },
}
```

### Existing Components — NO Changes Needed

| Component | Location | Why No Change |
|---|---|---|
| `useFirestoreCollection` | `@/hooks/useFirestoreCollection.ts` | Already subscribes to `work_orders` and `transactions` via `onSnapshot`. Cloud Function updates to Work Order docs auto-propagate. |
| `useDashboardData` | `@/features/dashboard/hooks/useDashboardData.ts` | Already computes KPIs from `txnStore.transactions` and `woStore.workOrders` via `useMemo`. When Cloud Function updates the Work Order, the store updates, and the memo recomputes. |
| `selectPendingReview` | `@/stores/useTransactionStore.ts` | Filters `status === 'pending_review'`. When a transaction is approved/rejected, Firestore listener updates the store, and the selector automatically excludes the changed item. |
| `useWorkOrderStore` | `@/stores/useWorkOrderStore.ts` | Receives updates via `useFirestoreCollection` listener. When Cloud Function increments `directCostAgora`, the store auto-updates. |
| `NutritionLabel` | `@/features/work-orders/components/NutritionLabel.tsx` | Computes margin from Work Order fields. When `directCostAgora` or `revenueTotalAgora` change via Cloud Function, the component re-renders with new values. |

### Existing Cloud Functions to Reference

| Function | File | Pattern to Follow |
|---|---|---|
| `processDocument` | `functions/src/ai/processDocument.ts` | `onDocumentCreated` trigger with options object. Uses `getFirestore()`, `FieldValue.serverTimestamp()`, structured logging. |
| `onEmailReceived` | `functions/src/email/onEmailReceived.ts` | Pub/Sub trigger. Error handling pattern with try/catch. |
| `retryFailedProcessing` | `functions/src/scheduled/retryFailedProcessing.ts` | Scheduled function. Batch processing pattern. |

### Firestore Update Pattern with FieldValue.increment

`FieldValue.increment()` is atomic — multiple concurrent calls on the same field correctly sum up. This is critical for batch approval (Story 5.5) where 9+ transactions may be approved simultaneously, each triggering the Cloud Function independently.

```typescript
// Safe for concurrent execution — no race conditions
await woRef.update({
  directCostAgora: FieldValue.increment(58000), // Transaction 1
});
// Concurrent:
await woRef.update({
  directCostAgora: FieldValue.increment(12550), // Transaction 2
});
// Result: directCostAgora = original + 58000 + 12550 ✓
```

No `runTransaction` needed — `FieldValue.increment()` handles atomicity at the Firestore server level.

### Category → Work Order Field Mapping

| Transaction Category | Work Order Field | Side Effect |
|---|---|---|
| `DirectCost` | `directCostAgora` | Increment by `amountAgora` |
| `Revenue` | `revenueTotalAgora` | Increment by `amountAgora` |
| `InventoryRestock` | `inventoryCostAgora` | Increment by `amountAgora` |
| `Overhead` | — | No WO update (dashboard computes from transactions) |
| `Personal` | — | No financial side effect |

### Error Handling Strategy

- **Work Order not found**: Log warning via `logger.warn()`, don't throw. Transaction was still approved — the linkage just failed.
- **Audit trail write failure**: Log error via `logger.error()`, don't throw. The approval/rejection side effect already completed.
- **Unexpected status transition** (e.g., `approved` → `approved`): Return early, no action.
- **Missing fields**: Defensive checks for `workOrderId`, `category`, `amountAgora` with fallback logging.

### Import Pattern for Cloud Functions

```typescript
// Correct import paths (NodeNext module resolution — .js extensions required)
import { onDocumentUpdatedWithAuthContext } from 'firebase-functions/firestore';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import * as logger from 'firebase-functions/logger';
```

**IMPORTANT**: The project uses `firebase-functions@^6.3.2` which exports from `firebase-functions/firestore` (NOT `firebase-functions/v2/firestore`). Check the existing `processDocument.ts` import: it uses `firebase-functions/firestore` → follow same pattern.

### Testing Patterns

Follow `functions/tests/ai.test.ts` mock patterns:
- Mock `firebase-admin/app` with `initializeApp: vi.fn()`
- Mock `firebase-admin/firestore` with `getFirestore`, `FieldValue.increment`, `FieldValue.serverTimestamp`
- Mock `firebase-functions/logger` with `info`, `error`, `warn`, `debug`
- Mock `firebase-functions/params` with `defineSecret`, `defineString`
- Mock `firebase-functions/firestore` with `onDocumentUpdatedWithAuthContext` that extracts the handler

**Test event factory:**
```typescript
function createUpdateEvent(
  beforeData: Record<string, unknown>,
  afterData: Record<string, unknown>,
  docId = 'txn-001',
  authId = 'user-uid-123',
) {
  return {
    data: {
      before: { data: () => beforeData },
      after: { data: () => afterData, ref: { /* ... */ } },
    },
    params: { docId },
    authId,
  };
}
```

### Transaction Fields Used by This Story

From `functions/src/shared/schemas.ts` — the `transactionSchema`:
- `status: 'pending_review' | 'approved' | 'rejected'` — the trigger field
- `category: 'DirectCost' | 'InventoryRestock' | 'Overhead' | 'Revenue' | 'Personal'` — determines which WO field to update
- `amountAgora: number` (integer) — the increment amount
- `workOrderId: string | null` — the target Work Order for side effects
- `updatedAt: Timestamp` — set by the client on approval/rejection

### Work Order Fields Updated by This Story

From `src/types/workOrder.ts` — the `workOrderSchema`:
- `directCostAgora: number` (integer, default 0) — incremented for DirectCost transactions
- `revenueTotalAgora: number` (integer, default 0) — incremented for Revenue transactions
- `inventoryCostAgora: number` (integer, default 0) — incremented for InventoryRestock transactions
- `updatedAt: Date` — set via `FieldValue.serverTimestamp()` after increment

### Previous Story Learnings (from Story 5.3)

1. **Firestore update pattern**: `updateDoc` with `serverTimestamp()` works correctly. The `usePendingReview` listener auto-removes approved/rejected items. No manual store manipulation needed.
2. **SCSS auto-import**: Not relevant to this story (no frontend changes).
3. **Toast usage**: Not relevant (no frontend changes).
4. **Store selectors**: `selectPendingReview` already filters by `status === 'pending_review'` — approved items automatically disappear from the review queue.
5. **`useConfirmTransaction` updates `status: 'approved'` on the client**: This client-side write triggers the Cloud Function we're building here. The Cloud Function then updates Work Order totals.
6. **`useRejectTransaction` updates `status: 'rejected'`**: This triggers the rejection path in our Cloud Function (audit trail only, no financial side effects).

### Git Intelligence (Recent Commits)

Most recent commits:
- `13d8da0` — Implement Story 5.3: Ghost Text Field Editing & Rejection with code review fixes
- `45b651b` — Implement Story 5.2: Ghost Text Card Core Confirmation Flow with code review fixes
- `ac5fc7d` — Fix SCSS error: use `$error` token instead of undefined `$danger`
- `3d2f189` — Implement Story 5.1: Review Queue & Pending Items List with code review fixes
- `475decc` — Implement Story 4.5: Error Handling, Retry & Pipeline Resilience with code review fixes

Key patterns from Epic 4 (Cloud Functions):
- `onDocumentCreated` trigger pattern in `processDocument.ts` — follow same import structure
- `FieldValue.serverTimestamp()` for all timestamp fields
- Structured logging with `firebase-functions/logger`
- Error handling: try/catch with detailed log context, no re-throw for non-critical failures
- Mock patterns in `functions/tests/ai.test.ts` — reuse same mock setup approach

### Naming Conventions

- Cloud Function file: `camelCase.ts` (e.g., `onTransactionApproved.ts`)
- Function export name: `camelCase` (e.g., `onTransactionStatusChanged`)
- Collection name: `snake_case` (e.g., `audit_log`)
- Document fields: `camelCase` (e.g., `transactionId`, `actorUid`, `beforeSnapshot`)
- Test file: `triggers.test.ts` in `functions/tests/`

### Project Structure Notes

New files to create:
```
functions/
  src/
    triggers/
      onTransactionApproved.ts    # Cloud Function: onDocumentUpdatedWithAuthContext on transactions
  tests/
    triggers.test.ts              # Tests for transaction approval/rejection triggers
```

Files to modify:
```
functions/src/index.ts            # Add export for onTransactionStatusChanged
functions/src/shared/schemas.ts   # Add auditLogSchema
functions/src/shared/types.ts     # Add AuditLog type export
```

Files that already exist and should NOT be modified:
```
src/hooks/useFirestoreCollection.ts       # Already handles real-time updates
src/stores/useTransactionStore.ts         # selectPendingReview already works
src/stores/useWorkOrderStore.ts           # Auto-updates via onSnapshot listener
src/features/dashboard/hooks/useDashboardData.ts  # Already recomputes KPIs
src/features/review/hooks/useConfirmTransaction.ts  # Triggers the approval
src/features/review/hooks/useRejectTransaction.ts   # Triggers the rejection
```

### Scope Boundaries

**IN scope for this story:**
- `onTransactionStatusChanged` Cloud Function (handles both approval and rejection)
- Work Order total atomic increments (DirectCost, Revenue, InventoryRestock)
- Audit trail document creation in `audit_log` collection
- Auth context capture for actor UID
- Idempotency guards and error handling
- Cloud Function tests
- Schema + type additions for audit log

**OUT of scope (deferred to later stories):**
- Story 5.5: Batch Approval UI ("Approve All" button, mobile review) — the Cloud Function here handles batch approvals at the trigger level, but the UI is in 5.5
- Epic 6: Inventory management side effects (WAC recalculation on InventoryRestock approval)
- Epic 7: Overhead expense creation from AI-classified Overhead transactions
- Client-side UI changes — none needed, real-time listeners already propagate everything
- `verifyWAC` Cloud Function — separate function for inventory story (Epic 6)
- Email notification on approval — not in requirements

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Epic 5, Story 5.4, lines 1422-1467]
- [Source: _bmad-output/planning-artifacts/architecture.md — Cloud Functions Inventory (onTransactionApproved), Data Architecture, Audit Trail pattern]
- [Source: _bmad-output/planning-artifacts/prd.md — FR31 (real-time financial data update within 2s)]
- [Source: _bmad-output/planning-artifacts/architecture.md — NFR: Data Integrity (audit trails, integer currency, referential integrity)]
- [Source: functions/src/ai/processDocument.ts — Cloud Function trigger pattern, FieldValue usage, error handling]
- [Source: functions/src/shared/schemas.ts — transactionSchema, TRANSACTION_CATEGORIES, TRANSACTION_STATUSES]
- [Source: functions/src/shared/types.ts — Transaction type, server-side type exports]
- [Source: functions/src/config.ts — Firebase Functions params pattern]
- [Source: functions/tests/ai.test.ts — Cloud Function test mocking pattern]
- [Source: src/types/workOrder.ts — WorkOrder schema with directCostAgora, revenueTotalAgora, inventoryCostAgora fields]
- [Source: src/types/transaction.ts — Client-side Transaction type with category, workOrderId, amountAgora]
- [Source: src/hooks/useFirestoreCollection.ts — Real-time Firestore listener that propagates changes to stores]
- [Source: src/features/dashboard/hooks/useDashboardData.ts — Dashboard KPI computation from stores]
- [Source: src/stores/useTransactionStore.ts — selectPendingReview filters pending_review status]
- [Source: src/stores/useWorkOrderStore.ts — Work Order store auto-updated by Firestore listeners]
- [Source: _bmad-output/implementation-artifacts/5-3-ghost-text-field-editing-rejection.md — Previous story learnings, Firestore update patterns]
- [Source: Firebase docs — onDocumentUpdatedWithAuthContext API, FieldValue.increment() for atomic counters]

## Dev Agent Record

### Agent Model Used

Claude claude-4.6-opus-high-thinking

### Debug Log References

- Fixed TypeScript strict check: added `event.data` null guard (TS18048)
- Fixed Zod v4 compatibility: replaced `z.record(z.unknown())` with `z.record(z.string(), z.any())` for auditLogSchema
- Fixed test for actorUid fallback: explicit `undefined` arg triggers JS default parameter — constructed event object without authId property instead

### Completion Notes List

- Created `onTransactionStatusChanged` Cloud Function handling both approval and rejection in a single `onDocumentUpdated` trigger
- Approval side effects: DirectCost → increment `directCostAgora`, Revenue → increment `revenueTotalAgora`, InventoryRestock → increment `inventoryCostAgora` on linked Work Order using atomic `FieldValue.increment()`
- Overhead and Personal categories: no Work Order updates (correct per ACs #5, #6)
- Audit trail: `createAuditLog` helper writes to `audit_log` collection with full before/after snapshots, fire-and-forget (errors logged, not thrown)
- Idempotency guards: no-op when status unchanged, no-op when transition not from `pending_review`
- Added `auditLogSchema` and `AuditLog` type to shared schemas/types
- 23 tests covering all ACs including error handling, batch safety, and actorUid fallback
- All 131 tests pass (0 regressions), `tsc --noEmit` zero errors
- Verified no client-side changes needed: existing `onSnapshot` listeners, `useMemo` KPIs, `selectPendingReview` selector all propagate Cloud Function updates automatically

### File List

- `functions/src/triggers/onTransactionApproved.ts` (new) — Cloud Function: onDocumentUpdatedWithAuthContext trigger
- `functions/tests/triggers.test.ts` (new) — 23 tests for transaction approval/rejection triggers
- `functions/src/index.ts` (modified) — Added export for onTransactionStatusChanged
- `functions/src/shared/schemas.ts` (modified) — Added auditLogSchema, AUDIT_LOG_ACTIONS, AuditLog type
- `functions/src/shared/types.ts` (modified) — Added AuditLog type re-export

### Change Log

- 2026-02-13: Implemented Story 5.4 — Post-Approval Side Effects & Real-Time Updates. Created onTransactionStatusChanged Cloud Function with category-based Work Order total updates (atomic FieldValue.increment), audit trail logging, rejection handling, and comprehensive tests. All 12 acceptance criteria satisfied.
