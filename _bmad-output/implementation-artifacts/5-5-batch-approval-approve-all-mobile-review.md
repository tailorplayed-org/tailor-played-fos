# Story 5.5: Batch Approval (Approve All) & Mobile Review

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As **Gal**,
I want to batch-approve all high-confidence items at once and review on mobile with full functionality,
So that I can clear a backlog in seconds and process items from anywhere.

## Acceptance Criteria

1. **Approve All Bar Visibility**: Given the Review page with ≥ 2 high-confidence items (`aiConfidence ≥ 85`), when the page loads, then a sticky bottom bar appears showing: count of eligible items (e.g., "9 items ready"), total amount summary (formatted via `formatCurrency`), and an "Approve All" primary button. The bar uses `$bg-elevated` background with `$gold` `border-top`.

2. **Approve All Confirmation**: Given the Approve All bar, when Gal clicks "Approve All", then a confirmation summary displays: "Approve 9 items totaling ₪X,XXX?" with Confirm and Cancel buttons (Bit-style explicit confirmation). Only items with `aiConfidence ≥ 85` are included — yellow items (< 85%) are always excluded.

3. **Pre-Batch Browse**: Given Gal browses pending items before batch-approving (FR30), when she scrolls through the green items in the list, then she can review vendor names, amounts, and categories without opening each card. She can open any individual item to inspect before deciding on Approve All.

4. **Batch Processing Execution**: Given batch approval is confirmed, when the items are processed, then all eligible transactions update to `status: 'approved'` in Firestore via `writeBatch`. The Approve All button shows a spinner during processing. On completion: a success toast shows "9 items approved". The pending list updates to show only remaining yellow items (if any). All Cloud Function side effects (Story 5.4 `onTransactionStatusChanged`) trigger for each approved item.

5. **Mobile Full-Screen Ghost Text**: Given the Review page on mobile (< 768px), when a pending item is tapped, then a full-screen Ghost Text Card renders (fills the viewport). A back arrow is visible at the top with "Review 1 of 3" counter. Invoice preview is collapsible (tap to expand/collapse). Ghost Text fields are stacked vertically, full-width. "Confirm" is a full-width primary button at the bottom. "Edit" and "Reject" are secondary buttons in a row below Confirm.

6. **Mobile Confirm Flow**: Given mobile Ghost Text review, when Gal taps Confirm, then the same confirmation flow executes (status update, side effects, toast). The view transitions to the next pending item (or "All caught up" if none remain).

7. **Mobile Approve All Bar**: Given mobile with batch-eligible items, when the Approve All bar renders, then it appears as a sticky bar above the bottom navigation (`BottomNav`). Touch targets are ≥ 44px. The same confirmation summary appears before executing.

8. **Approve All Bar Hidden State**: Given fewer than 2 high-confidence items, when the page loads, then the Approve All bar is hidden. As items are approved individually and the count drops below 2, the bar disappears.

9. **Error Handling**: Given a batch approval fails (e.g., network error), when the batch `commit()` throws, then an error toast is shown, the spinner stops, and the bar returns to its default state. Partially committed items still process (Firestore `writeBatch` is atomic — all or nothing).

10. **Accessibility**: All interactive elements have ≥ 44px touch targets. The Approve All bar is announced to screen readers. Focus management returns to the review queue after batch approval. Keyboard navigation works for the confirmation dialog.

## Tasks / Subtasks

- [x] Task 1: Create `useBatchApproval` hook (AC: #1, #2, #4, #8, #9)
  - [x] Create `src/features/review/hooks/useBatchApproval.ts`
  - [x] Accept `pendingTransactions` array as parameter
  - [x] Compute `batchEligible` via `useMemo`: filter `aiConfidence >= 85`
  - [x] Compute `totalAmountAgora` via `useMemo`: sum of `batchEligible.map(t => t.amountAgora)`
  - [x] State: `isBatchApproving: boolean`, `showBatchConfirm: boolean`
  - [x] `requestBatchApproval()` → sets `showBatchConfirm = true`
  - [x] `cancelBatchApproval()` → sets `showBatchConfirm = false`
  - [x] `confirmBatchApproval()` → uses `writeBatch(db)` from `firebase/firestore`:
    - For each eligible transaction: `batch.update(doc(db, 'transactions', txn.id), { status: 'approved', updatedAt: serverTimestamp() })`
    - `await batch.commit()`
    - Show success toast: `t('review.batchApproval.success', { count })`
    - Set `showBatchConfirm = false`
  - [x] Error handling: catch on `commit()`, show error toast, reset state
  - [x] Return `{ batchEligible, totalAmountIlsAgora, isBatchApproving, showBatchConfirm, requestBatchApproval, cancelBatchApproval, confirmBatchApproval }`

- [x] Task 2: Create `ApproveAllBar` component (AC: #1, #2, #3, #7, #8, #10)
  - [x] Create `src/features/review/components/ApproveAllBar.tsx`
  - [x] Create `src/features/review/components/ApproveAllBar.module.scss`
  - [x] Props: `batchEligible: Transaction[]`, `totalAmountAgora: number`, `isBatchApproving: boolean`, `showBatchConfirm: boolean`, `onApproveAll: () => void`, `onConfirm: () => void`, `onCancel: () => void`
  - [x] Render nothing if `batchEligible.length < 2`
  - [x] Default state: sticky bottom bar with count + total amount + "Approve All" button
  - [x] Confirmation state: replace bar content with summary text + Confirm + Cancel buttons
  - [x] Processing state: Spinner inside Approve All / Confirm button, buttons disabled
  - [x] Styling: `position: sticky`, `bottom: 0` (desktop) / `bottom: $bottom-nav-height` (mobile), `$bg-elevated` background, `border-top: 2px solid $gold`, `$radius-lg` top corners, `$shadow-lg`
  - [x] Mobile: adjust bottom offset to sit above `BottomNav` (64px or `$bottom-nav-height`)
  - [x] All buttons ≥ 44px height
  - [x] `aria-live="polite"` for the bar count announcement

- [x] Task 3: Create mobile Ghost Text view (AC: #5, #6, #10)
  - [x] Modify `src/features/review/ReviewPage.tsx` to detect mobile via `useMediaQuery` or `window.matchMedia('(max-width: 767px)')`
  - [x] Create `src/features/review/components/MobileGhostTextView.tsx`
  - [x] Create `src/features/review/components/MobileGhostTextView.module.scss`
  - [x] Props: same as `GhostTextCard` plus `currentIndex: number`, `totalCount: number`, `onBack: () => void` (navigation handled by confirm/reject flow in ReviewPage)
  - [x] Full-screen layout: fixed position, fills viewport, `$bg-primary` background
  - [x] Header: back arrow (ArrowLeft icon) + "Review {{current}} of {{total}}" counter
  - [x] Collapsible invoice preview section (if `originalFileUrl` exists) — tap to toggle
  - [x] Ghost Text fields: stacked vertically, full-width
  - [x] Action buttons: "Confirm" as full-width primary button at bottom, "Edit" and "Reject" as secondary buttons in a row below
  - [x] Transition to next pending item on confirm, or show "All caught up" state

- [x] Task 4: Integrate into ReviewPage (AC: #1–#10)
  - [x] Import and wire `useBatchApproval` hook in `ReviewPage`
  - [x] Pass `pendingTransactions` to `useBatchApproval`
  - [x] Render `ApproveAllBar` below the `ReviewQueue` content
  - [x] Conditional rendering: mobile → `MobileGhostTextView`, desktop → `GhostTextOverlay`
  - [x] Track `currentIndex` and `totalCount` for mobile review counter
  - [x] Wire handleBack for mobile (close full-screen view)

- [x] Task 5: Add i18n translation keys (AC: #1, #2, #4, #5, #6)
  - [x] Add to `src/i18n/en.json` under `review.batchApproval.*`
  - [x] Add to `src/i18n/he.json` under `review.batchApproval.*`
  - [x] Add mobile review counter keys

- [x] Task 6: Write component and hook tests (AC: #1–#10)
  - [x] Create `src/features/review/hooks/useBatchApproval.test.ts`
  - [x] Create `src/features/review/components/ApproveAllBar.test.tsx`
  - [x] Create `src/features/review/components/MobileGhostTextView.test.tsx`
  - [x] Test: bar hidden when < 2 eligible items
  - [x] Test: bar visible when ≥ 2 eligible items with correct count and total
  - [x] Test: only `aiConfidence >= 85` items included in batch
  - [x] Test: confirmation dialog appears on "Approve All" click
  - [x] Test: `writeBatch` called with correct updates on confirm
  - [x] Test: success toast shown after batch commit
  - [x] Test: error toast shown on batch failure
  - [x] Test: spinner shown during batch processing
  - [x] Test: mobile view renders full-screen with counter
  - [x] Test: mobile back arrow closes view
  - [x] Test: mobile confirm advances to next item
  - [x] Test: "All caught up" shown when no more items

- [x] Task 7: Update barrel exports
  - [x] Add `ApproveAllBar` and `MobileGhostTextView` to `src/features/review/components/index.ts`
  - [x] Add `useBatchApproval` to `src/features/review/hooks/index.ts`

## Dev Notes

### Architecture & Patterns

- **Feature boundary**: All new code goes in `src/features/review/`. No cross-feature imports.
- **Firestore batch writes**: Use `writeBatch` from `firebase/firestore` (modular API). Max 500 writes per batch — more than enough for our use case. `writeBatch` is atomic: all succeed or all fail.
- **Batch triggers**: Each `status: 'approved'` update triggers `onTransactionStatusChanged` Cloud Function (Story 5.4) independently. Work Order totals update via `FieldValue.increment()` — safe for concurrent execution, no race conditions.
- **Real-time propagation**: `usePendingReview` uses `onSnapshot` listener on `transactions` collection. Approved items automatically disappear from the pending list via `selectPendingReview` filter (`status === 'pending_review'`). No manual store manipulation needed.
- **No new stores**: Reuse `useTransactionStore` and `useWorkOrderStore`. The `useBatchApproval` hook is purely a local-state + Firestore interaction hook.

### Existing Components to REUSE (Do NOT Recreate)

| Component | Location | Reuse For |
|---|---|---|
| `GhostTextCard` | `src/features/review/components/GhostTextCard.tsx` | Reuse inside `MobileGhostTextView` — same card component, different layout wrapper |
| `GhostTextField` | `src/features/review/components/GhostTextField.tsx` | Already used by GhostTextCard — no changes |
| `GhostTextOverlay` | `src/features/review/components/GhostTextOverlay.tsx` | Keep for desktop — only mobile gets `MobileGhostTextView` |
| `ReviewQueue` | `src/features/review/components/ReviewQueue.tsx` | Keep as-is — no changes needed |
| `ReviewQueueItem` | `src/features/review/components/ReviewQueueItem.tsx` | Keep as-is — no changes needed |
| `RejectConfirmDialog` | `src/features/review/components/RejectConfirmDialog.tsx` | Keep as-is — used inside GhostTextCard |
| `ConfidenceBadge` | `src/components/Badge/ConfidenceBadge.tsx` | Keep for queue items |
| `BottomNav` | `src/components/Layout/BottomNav.tsx` | Reference only — Approve All bar sits above it on mobile |
| `Button` | `src/components/Button/Button.tsx` | Use for all buttons in ApproveAllBar |
| `toast` | `src/stores/useUIStore.ts` | Use `toast.success()` and `toast.error()` for batch feedback |
| `formatCurrency` | `src/lib/currency.ts` | Use for total amount display in Approve All bar |

### Critical Import Patterns

```typescript
// Firestore batch operations — CORRECT import path
import { writeBatch, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/services';

// Currency formatting
import { formatCurrency } from '@/lib';

// Transaction types
import type { Transaction, TransactionCategory } from '@/types';

// Store selectors
import { useTransactionStore, selectPendingReview } from '@/stores';

// Toast
import { toast } from '@/stores/useUIStore';

// i18n
import { useTranslation } from 'react-i18next';

// Icons (use Phosphor — no emojis)
import { ArrowLeft, CheckCircle, SpinnerGap, Lightning } from '@phosphor-icons/react';
```

### `writeBatch` Usage Pattern

```typescript
import { writeBatch, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/services';

async function batchApproveTransactions(transactionIds: string[]): Promise<void> {
  const batch = writeBatch(db);

  for (const txnId of transactionIds) {
    const txnRef = doc(db, 'transactions', txnId);
    batch.update(txnRef, {
      status: 'approved',
      updatedAt: serverTimestamp(),
    });
  }

  await batch.commit(); // Atomic: all or nothing
}
```

### `useBatchApproval` Hook Pattern

```typescript
export function useBatchApproval(pendingTransactions: Transaction[]) {
  const { t } = useTranslation();
  const [isBatchApproving, setIsBatchApproving] = useState(false);
  const [showBatchConfirm, setShowBatchConfirm] = useState(false);

  const batchEligible = useMemo(
    () => pendingTransactions.filter((tx) => (tx.aiConfidence ?? 0) >= 85),
    [pendingTransactions],
  );

  const totalAmountAgora = useMemo(
    () => batchEligible.reduce((sum, tx) => sum + (tx.amountAgora ?? 0), 0),
    [batchEligible],
  );

  // ... requestBatchApproval, cancelBatchApproval, confirmBatchApproval

  return {
    batchEligible,
    totalAmountAgora,
    isBatchApproving,
    showBatchConfirm,
    requestBatchApproval,
    cancelBatchApproval,
    confirmBatchApproval,
  };
}
```

### ApproveAllBar Styling Requirements

```scss
// ApproveAllBar.module.scss
@use '@/styles/variables' as *;
@use '@/styles/mixins' as *;

.bar {
  position: sticky;
  bottom: 0;
  background: $bg-elevated;
  border-top: 2px solid $gold;
  border-radius: $radius-lg $radius-lg 0 0;
  padding: $space-md $space-lg;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $space-md;
  box-shadow: $shadow-lg;
  z-index: 10;

  // Mobile: sit above BottomNav
  @media (max-width: 767px) {
    bottom: 64px; // BottomNav height
    border-radius: 0;
  }
}

.count {
  color: $text-primary;
  font-weight: $font-semibold;
  font-size: $text-base;
}

.amount {
  color: $text-secondary;
  font-size: $text-sm;
}

.approveButton {
  min-height: 44px;
  min-width: 44px; // Touch target
}
```

### MobileGhostTextView Layout Requirements

```scss
// MobileGhostTextView.module.scss
@use '@/styles/variables' as *;

.fullScreen {
  position: fixed;
  inset: 0;
  background: $bg-primary;
  z-index: 100;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.header {
  display: flex;
  align-items: center;
  gap: $space-sm;
  padding: $space-md;
  border-bottom: 1px solid $border-subtle;

  .backButton {
    min-width: 44px;
    min-height: 44px;
    background: transparent;
    border: none;
    color: $text-primary;
    cursor: pointer;
  }

  .counter {
    color: $text-secondary;
    font-size: $text-sm;
  }
}

.cardContainer {
  flex: 1;
  padding: $space-md;
  overflow-y: auto;
}

.actions {
  padding: $space-md;
  display: flex;
  flex-direction: column;
  gap: $space-sm;

  .confirmButton {
    width: 100%;
    min-height: 48px; // Larger for primary mobile action
  }

  .secondaryRow {
    display: flex;
    gap: $space-sm;

    > * {
      flex: 1;
      min-height: 44px;
    }
  }
}
```

### Mobile Detection Pattern

Use CSS media queries for styling and a simple hook or `window.matchMedia` for component switching:

```typescript
// In ReviewPage.tsx
const [isMobile, setIsMobile] = useState(
  () => typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches,
);

useEffect(() => {
  const mql = window.matchMedia('(max-width: 767px)');
  const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
  mql.addEventListener('change', handler);
  return () => mql.removeEventListener('change', handler);
}, []);
```

If a `useMediaQuery` hook already exists in `src/hooks/`, use that instead. Check before creating a new one.

### Confidence Threshold

The confidence threshold for batch approval is **85%** (`aiConfidence >= 85`). This is defined in the PRD (FR29) and UX spec. Use a named constant:

```typescript
const BATCH_APPROVAL_CONFIDENCE_THRESHOLD = 85;
```

### Transaction Fields Used

From `src/types/transaction.ts`:
- `id: string` — Firestore document ID
- `status: 'pending_review' | 'approved' | 'rejected'` — updated by batch
- `aiConfidence: number | null` — determines batch eligibility (≥ 85)
- `amountAgora: number` — integer currency for total display
- `currency: 'ILS' | 'USD' | 'EUR'` — for `formatCurrency` display
- `vendorName: string` — shown in queue items
- `category: TransactionCategory` — shown in queue items
- `updatedAt: Date` — set to `serverTimestamp()` on approval
- `originalFileUrl: string | null` — for collapsible invoice preview on mobile

### i18n Keys to Add

**English (`en.json`):**
```json
{
  "review": {
    "batchApproval": {
      "itemsReady": "{{count}} items ready",
      "itemsReady_one": "1 item ready",
      "totalAmount": "totaling {{amount}}",
      "approveAll": "Approve All",
      "confirmTitle": "Approve {{count}} items totaling {{amount}}?",
      "confirm": "Confirm",
      "cancel": "Cancel",
      "success": "{{count}} items approved",
      "success_one": "1 item approved",
      "error": "Failed to batch approve"
    },
    "mobile": {
      "reviewCounter": "Review {{current}} of {{total}}",
      "back": "Back",
      "allCaughtUp": "All caught up!",
      "allCaughtUpMessage": "No more pending items to review",
      "invoicePreview": "Invoice preview",
      "tapToExpand": "Tap to expand",
      "tapToCollapse": "Tap to collapse"
    }
  }
}
```

**Hebrew (`he.json`):**
```json
{
  "review": {
    "batchApproval": {
      "itemsReady": "{{count}} פריטים מוכנים",
      "itemsReady_one": "פריט אחד מוכן",
      "totalAmount": "בסך {{amount}}",
      "approveAll": "אשר הכל",
      "confirmTitle": "לאשר {{count}} פריטים בסך {{amount}}?",
      "confirm": "אישור",
      "cancel": "ביטול",
      "success": "{{count}} פריטים אושרו",
      "success_one": "פריט אחד אושר",
      "error": "אישור קבוצתי נכשל"
    },
    "mobile": {
      "reviewCounter": "סקירה {{current}} מתוך {{total}}",
      "back": "חזרה",
      "allCaughtUp": "הכל מעודכן!",
      "allCaughtUpMessage": "אין עוד פריטים ממתינים לסקירה",
      "invoicePreview": "תצוגת חשבונית",
      "tapToExpand": "לחץ להרחבה",
      "tapToCollapse": "לחץ לכיווץ"
    }
  }
}
```

### Previous Story Intelligence (from Story 5.4)

1. **Firestore update pattern**: `updateDoc` with `serverTimestamp()` works correctly. The `usePendingReview` listener auto-removes approved items from the queue. No manual store manipulation needed after writes.
2. **Cloud Function triggers independently per transaction**: Each `status: 'approved'` write triggers `onTransactionStatusChanged`. Work Order totals update via `FieldValue.increment()` — atomic and concurrent-safe.
3. **Existing `onSnapshot` listeners propagate all changes**: Dashboard KPIs, Nutrition Labels, Tax Jar, Project Health Table all auto-update when Work Order totals change. No additional client-side wiring needed.
4. **`selectPendingReview` selector**: Already filters `status === 'pending_review'`. Approved items disappear from the queue automatically.
5. **AC #11 from Story 5.4 explicitly covers batch safety**: "When multiple transactions are approved simultaneously (Approve All in Story 5.5), each trigger processes independently. Work Order totals reflect the sum of all approved amounts. No race conditions occur because `FieldValue.increment()` is used."
6. **`useConfirmTransaction` hook**: Uses `updateDoc` (single document). Batch approval needs `writeBatch` (multiple documents). Do NOT reuse `useConfirmTransaction` for batch — create the new `useBatchApproval` hook.
7. **Toast patterns**: `toast.success(message)` and `toast.error(message)` from `@/stores/useUIStore`. Batch success should use: `toast.success(t('review.batchApproval.success', { count }))`.
8. **SCSS auto-import**: Global SCSS partials (`_variables.scss`, `_mixins.scss`) are auto-imported via Vite `additionalData` config. Use `@use '@/styles/variables' as *` and `@use '@/styles/mixins' as *` at top of SCSS modules.
9. **Zod v4 compatibility note**: If adding any new Zod schemas, use `z.record(z.string(), z.any())` instead of `z.record(z.unknown())`.

### Git Intelligence (Recent Commits)

```
ecce50e Implement Story 5.4: Post-Approval Side Effects & Real-Time Updates with code review fixes
13d8da0 Implement Story 5.3: Ghost Text Field Editing & Rejection with code review fixes
45b651b Implement Story 5.2: Ghost Text Card Core Confirmation Flow with code review fixes
ac5fc7d Fix SCSS error: use $error token instead of undefined $danger
3d2f189 Implement Story 5.1: Review Queue & Pending Items List with code review fixes
```

Key patterns from recent commits:
- Each story follows a single-commit-with-review-fixes pattern
- SCSS token issue: `$danger` doesn't exist — always use `$error` for red/destructive colors
- All Epic 5 components are under `src/features/review/`
- Tests are co-located with components (`.test.tsx` next to `.tsx`)

### Testing Patterns

Follow existing Epic 5 test patterns:
- **Framework**: Vitest + React Testing Library
- **Co-located**: `ApproveAllBar.test.tsx` next to `ApproveAllBar.tsx`
- **Mock Firestore**: Mock `firebase/firestore` — `writeBatch`, `doc`, `updateDoc`, `serverTimestamp`
- **Mock i18n**: Mock `react-i18next` with `useTranslation` returning a passthrough `t` function
- **Mock toast**: Mock `@/stores/useUIStore` toast functions
- **Test rendering**: Use `render` from `@testing-library/react`, `screen` queries, `fireEvent`/`userEvent`

**Mock writeBatch pattern:**
```typescript
const mockUpdate = vi.fn();
const mockCommit = vi.fn().mockResolvedValue(undefined);
vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual('firebase/firestore');
  return {
    ...actual,
    writeBatch: vi.fn(() => ({
      update: mockUpdate,
      commit: mockCommit,
    })),
    doc: vi.fn((_, collection, id) => ({ path: `${collection}/${id}` })),
    serverTimestamp: vi.fn(() => 'mock-server-timestamp'),
  };
});
```

### Project Structure Notes

New files to create:
```
src/features/review/
  components/
    ApproveAllBar.tsx              # Sticky bottom bar for batch approval
    ApproveAllBar.module.scss      # Styles for Approve All bar
    ApproveAllBar.test.tsx         # Tests for Approve All bar
    MobileGhostTextView.tsx        # Full-screen mobile review view
    MobileGhostTextView.module.scss # Styles for mobile view
    MobileGhostTextView.test.tsx   # Tests for mobile view
  hooks/
    useBatchApproval.ts            # Batch approval hook with writeBatch
    useBatchApproval.test.ts       # Tests for batch approval hook
```

Files to modify:
```
src/features/review/ReviewPage.tsx          # Add ApproveAllBar, mobile detection, MobileGhostTextView
src/features/review/ReviewPage.module.scss  # Add mobile-specific styles (if needed)
src/features/review/components/index.ts     # Export ApproveAllBar, MobileGhostTextView
src/features/review/hooks/index.ts          # Export useBatchApproval
src/i18n/en.json                            # Add review.batchApproval.* and review.mobile.* keys
src/i18n/he.json                            # Add Hebrew translations
```

Files that already exist and should NOT be modified (unless absolutely necessary):
```
src/features/review/components/GhostTextCard.tsx       # Reuse as-is inside MobileGhostTextView
src/features/review/components/GhostTextOverlay.tsx    # Keep for desktop
src/features/review/components/ReviewQueue.tsx          # Keep as-is
src/features/review/components/ReviewQueueItem.tsx      # Keep as-is
src/features/review/hooks/useConfirmTransaction.ts     # Keep for single-item confirm
src/features/review/hooks/useRejectTransaction.ts      # Keep for single-item reject
src/features/review/hooks/usePendingReview.ts          # Keep as-is — returns sorted pending items
src/features/review/hooks/useGhostTextKeyboard.ts      # Keep as-is
src/stores/useTransactionStore.ts                      # Keep as-is — selectPendingReview already works
src/stores/useWorkOrderStore.ts                        # Keep as-is — auto-updates via onSnapshot
src/components/Layout/BottomNav.tsx                    # Reference only — don't modify
```

### Scope Boundaries

**IN scope for this story:**
- `ApproveAllBar` component (sticky bottom bar with confirmation dialog)
- `useBatchApproval` hook (Firestore `writeBatch` logic)
- `MobileGhostTextView` component (full-screen mobile review)
- Mobile detection and conditional rendering in `ReviewPage`
- i18n keys for batch approval and mobile review
- Tests for all new components and hooks
- Touch target compliance (≥ 44px)

**OUT of scope (do NOT implement):**
- Swipe gestures for confirm/reject on mobile (mentioned as "optional gesture" in UX spec)
- Changes to the existing `GhostTextCard` component internals
- Changes to the existing `GhostTextOverlay` for desktop
- Changes to Cloud Functions (batch triggers already handled by Story 5.4)
- Changes to Zustand stores or store selectors
- Changes to `BottomNav` component
- Changes to Firestore security rules
- E2E tests or Playwright tests

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Epic 5, Story 5.5]
- [Source: _bmad-output/planning-artifacts/architecture.md — Cloud Functions Inventory (onTransactionApproved), Review feature structure, ApproveAllBar component reference]
- [Source: _bmad-output/planning-artifacts/prd.md — FR29 (batch-approve high-confidence items), FR30 (browse before batch), FR48 (mobile parity)]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — Approve All Bar (sticky bottom, confirmation summary), Mobile Ghost Text (full-screen, Review 1 of 3), Touch targets (44px), Feedback patterns (batch success toast)]
- [Source: _bmad-output/implementation-artifacts/5-4-post-approval-side-effects-real-time-updates.md — AC#11 batch safety, FieldValue.increment atomicity, audit trail triggers independently per item]
- [Source: src/features/review/ReviewPage.tsx — Current review page structure, handler patterns, animation phases]
- [Source: src/features/review/hooks/useConfirmTransaction.ts — Single-item confirm pattern with updateDoc, toast, error handling]
- [Source: src/features/review/hooks/usePendingReview.ts — Firestore subscription, selectPendingReview, confidence sort]
- [Source: src/stores/useTransactionStore.ts — selectPendingReview selector, store interface]
- [Source: src/lib/currency.ts — formatCurrency utility for total amount display]
- [Source: src/services/index.ts — db export for Firestore instance]
- [Source: src/components/Layout/BottomNav.tsx — Bottom navigation structure, 4 items (Home, Orders, Review, More)]
- [Source: src/styles/_variables.scss — $bg-elevated, $gold, $success, $warning, $error, $shadow-lg, spacing tokens]
- [Source: Firebase docs — writeBatch API: max 500 writes, atomic commit, modular import from firebase/firestore]

## Dev Agent Record

### Agent Model Used

Claude claude-4.6-opus (Cursor IDE)

### Debug Log References

- Fixed `window.matchMedia` not available in jsdom test environment — added defensive `typeof` check before calling
- Updated `ReviewPage.test.tsx` to mock `useBatchApproval` and `writeBatch` for compatibility with new imports

### Completion Notes List

- **Task 1**: Created `useBatchApproval` hook with `writeBatch` atomic Firestore operations. Filters by `aiConfidence >= 85`, computes total, manages confirmation/loading state, uses ref guard to prevent double execution.
- **Task 2**: Created `ApproveAllBar` component with sticky positioning, confirmation state, loading spinners, 44px touch targets, `aria-live="polite"` for screen readers. Mobile-responsive with `bottom: 64px` offset above BottomNav.
- **Task 3**: Created `MobileGhostTextView` with full-screen layout, back arrow + "Review X of Y" counter, collapsible invoice preview, "All caught up" empty state. Reuses existing `GhostTextCard` inside mobile wrapper.
- **Task 4**: Integrated all new components into `ReviewPage` — mobile detection via `window.matchMedia`, conditional rendering (mobile → `MobileGhostTextView`, desktop → `GhostTextOverlay`), `ApproveAllBar` wired to `useBatchApproval`.
- **Task 5**: Added i18n keys for `review.batchApproval.*` (11 keys) and `review.mobile.*` (7 keys) in both `en.json` and `he.json`.
- **Task 6**: 41 new tests across 3 test files — 15 hook tests, 14 ApproveAllBar tests, 12 MobileGhostTextView tests. All pass.
- **Task 7**: Updated barrel exports for components and hooks.

### Change Log

- **2026-02-13**: Implemented Story 5.5 — Batch Approval (Approve All) & Mobile Review. Added `useBatchApproval` hook, `ApproveAllBar` component, `MobileGhostTextView` component, mobile detection in ReviewPage, i18n keys (EN + HE), 41 comprehensive tests. All 798 project tests pass.

### File List

**New files:**
- `src/features/review/hooks/useBatchApproval.ts`
- `src/features/review/hooks/useBatchApproval.test.ts`
- `src/features/review/components/ApproveAllBar.tsx`
- `src/features/review/components/ApproveAllBar.module.scss`
- `src/features/review/components/ApproveAllBar.test.tsx`
- `src/features/review/components/MobileGhostTextView.tsx`
- `src/features/review/components/MobileGhostTextView.module.scss`
- `src/features/review/components/MobileGhostTextView.test.tsx`

**Modified files:**
- `src/features/review/ReviewPage.tsx`
- `src/features/review/ReviewPage.test.tsx`
- `src/features/review/components/index.ts`
- `src/features/review/hooks/index.ts`
- `src/i18n/en.json`
- `src/i18n/he.json`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/5-5-batch-approval-approve-all-mobile-review.md`
