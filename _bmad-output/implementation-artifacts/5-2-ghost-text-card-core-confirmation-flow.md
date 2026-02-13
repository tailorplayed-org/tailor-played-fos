# Story 5.2: Ghost Text Card — Core Confirmation Flow

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **Gal (Financial Operator)**,
I want to see AI-classified invoice details in a focused card and confirm correct suggestions with a single keystroke,
So that I can process each item in under 5 seconds when the AI is right.

## Acceptance Criteria

1. **Ghost Text Card Rendering**: When a pending item is selected from the ReviewQueue, a focused review card renders (centered, ~500px wide on desktop) with:
   - Header: Phosphor `FileText` icon + vendor name + date + amount with currency symbol (and "Estimated" badge via existing `Badge` component if `isEstimatedConversion === true`)
   - Body: Ghost Text fields for Category and Project (dashed `$border-subtle` border, italic `$text-muted` text, `$bg-tertiary` background)
   - Confidence bar: visual progress bar + percentage number (green `$success` for `aiConfidence >= 85`, yellow `$warning` for < 85)
   - AI reasoning bubble: 1-2 sentence explanation from `classificationReasoning` field ("Matched to David's Game — vendor linked 3 times previously")
   - Actions: Confirm (primary, shortcut "Enter"), Edit (secondary, shortcut "E"), Reject (danger, shortcut "Del")
   - Footer: "View original document →" link (opens `originalFileUrl` from Firebase Storage in new tab)

2. **Confirmation Flow (Enter)**: When Gal presses Enter (or clicks Confirm) on a high-confidence item:
   - The card shows a brief gold glow pulse (`$shadow-glow`, 200ms animation)
   - Ghost Text fields transition from muted to solid (`$text-muted` → `$text-primary`, border from dashed to solid, `fadeIn`)
   - The card slides down and fades out (300ms `slideDown` + `fadeOut`)
   - The transaction `status` updates to `'approved'` in Firestore via `updateDoc`
   - A success toast appears: `t('review.ghostText.confirmed')` ("Transaction confirmed")
   - The next pending item's card auto-loads if items remain; otherwise empty state

3. **Card Overlay & Entrance**: When the Ghost Text Card opens:
   - The background dims (`$bg-primary` at 70% opacity overlay, covering the full viewport)
   - The card uses `scaleIn` animation (300ms) on entrance
   - Focus is trapped inside the card (keyboard Tab stays within card boundaries)
   - Click on the overlay closes the card without action

4. **Keyboard Navigation**: When the Ghost Text Card is open:
   - `Enter` — confirms all fields as shown (triggers approval)
   - `E` — enters edit mode (placeholder for Story 5.3, show toast "Edit mode coming soon" for this story)
   - `Delete` — initiates reject flow (placeholder for Story 5.3, show toast "Reject mode coming soon" for this story)
   - `Escape` — closes the card without action (returns to pending queue)
   - `→` (ArrowRight) — navigates to the next pending item without closing flow
   - `←` (ArrowLeft) — navigates to the previous pending item

5. **View Original Document**: When "View original document →" is clicked:
   - The original document (PDF/image) opens in a new tab using the `originalFileUrl` from the transaction
   - If `originalFileUrl` is null, the link is hidden

6. **Post-Confirmation Updates**: After a card dissolves on confirmation:
   - The pending count badge in TopNav decrements (automatic via shared `useTransactionStore`)
   - Dashboard KPIs update in real-time (automatic via shared Firestore listeners)
   - The next pending item's Ghost Text Card auto-loads if items remain

7. **Mobile Responsive**: On mobile (< 768px):
   - The Ghost Text Card is full-width with appropriate padding
   - Action buttons are full-width, stacked vertically
   - Touch targets >= 44px height
   - CSS logical properties for RTL support throughout

## Tasks / Subtasks

- [x] Task 1: Create `GhostTextCard` component (AC: #1, #3, #7)
  - [x] Create `src/features/review/components/GhostTextCard.tsx`
  - [x] Create `src/features/review/components/GhostTextCard.module.scss`
  - [x] Render header section: Phosphor `FileText` icon, vendor name, formatted date (`relativeTime`), formatted amount (`formatCurrency`), "Estimated" `Badge` conditionally
  - [x] Render Ghost Text fields for Category and Project (read-only display for this story — editing deferred to 5.3)
  - [x] Render confidence bar: colored progress bar (`$success`/`$warning`) + percentage text
  - [x] Render AI reasoning bubble: `classificationReasoning` text in a muted styled box
  - [x] Render action buttons: Confirm (`Button` variant="primary", shortcut="Enter"), Edit (`Button` variant="secondary", shortcut="E"), Reject (`Button` variant="danger", shortcut="Del")
  - [x] Render footer: "View original document →" link (conditional on `originalFileUrl`)
  - [x] Apply `scaleIn` entrance animation (300ms)
  - [x] Mobile: full-width card, stacked buttons, 44px min touch targets
  - [x] Export from `src/features/review/components/index.ts`
  - [x] Create co-located test: `GhostTextCard.test.tsx`

- [x] Task 2: Create `GhostTextOverlay` component (AC: #3)
  - [x] Create `src/features/review/components/GhostTextOverlay.tsx`
  - [x] Create `src/features/review/components/GhostTextOverlay.module.scss`
  - [x] Render full-viewport overlay with `$bg-primary` at 70% opacity
  - [x] Render `GhostTextCard` centered within the overlay
  - [x] Use React portal (`createPortal`) to render overlay at document body level
  - [x] Implement focus trap: Tab/Shift+Tab cycle within card boundaries
  - [x] Close on overlay background click (not on card click)
  - [x] Apply `fadeIn` animation on overlay entrance
  - [x] Export from `src/features/review/components/index.ts`
  - [x] Create co-located test: `GhostTextOverlay.test.tsx`

- [x] Task 3: Create `useGhostTextKeyboard` hook (AC: #4)
  - [x] Create `src/features/review/hooks/useGhostTextKeyboard.ts`
  - [x] Register `keydown` listener on `document` when card is open
  - [x] Handle `Enter` → call `onConfirm` callback
  - [x] Handle `e` / `E` → call `onEdit` callback (placeholder toast for this story)
  - [x] Handle `Delete` → call `onReject` callback (placeholder toast for this story)
  - [x] Handle `Escape` → call `onClose` callback
  - [x] Handle `ArrowRight` → call `onNext` callback
  - [x] Handle `ArrowLeft` → call `onPrevious` callback
  - [x] Ignore key events when an input/textarea is focused (for future Story 5.3 edit mode)
  - [x] Cleanup listener on unmount or when card closes
  - [x] Export from `src/features/review/hooks/index.ts`
  - [x] Create co-located test: `useGhostTextKeyboard.test.ts`

- [x] Task 4: Create `useConfirmTransaction` hook (AC: #2, #6)
  - [x] Create `src/features/review/hooks/useConfirmTransaction.ts`
  - [x] Accept `transactionId: string` parameter
  - [x] Use `updateDoc` from `firebase/firestore` to set `status: 'approved'` and `updatedAt: serverTimestamp()`
  - [x] Return `{ confirm, isConfirming }` — `confirm` is the async action, `isConfirming` is loading state
  - [x] On success: call `toast.success(t('review.ghostText.confirmed'))`
  - [x] On error: call `toast.error(t('review.ghostText.confirmError'))`, do NOT close card
  - [x] Export from `src/features/review/hooks/index.ts`
  - [x] Create co-located test: `useConfirmTransaction.test.ts`

- [x] Task 5: Update `ReviewPage` to integrate Ghost Text Card (AC: #1, #2, #3, #4, #6)
  - [x] Import `GhostTextOverlay` component
  - [x] When `selectedTransactionId` is set, render `GhostTextOverlay` with the selected transaction
  - [x] Wire `onConfirm` → call `useConfirmTransaction`, then trigger card exit animation, then advance to next item or clear selection
  - [x] Wire `onClose` → clear `selectedTransactionId`
  - [x] Wire `onNext` / `onPrevious` → navigate through `pendingTransactions` array by index
  - [x] Wire `onEdit` / `onReject` → show placeholder toast (Story 5.3)
  - [x] Update `ReviewPage.module.scss` if needed for overlay integration
  - [x] Update `ReviewPage.test.tsx` with new test cases

- [x] Task 6: Add i18n keys for Ghost Text Card (AC: #1, #2)
  - [x] Add to `src/i18n/en.json`:
    - `review.ghostText.confirmed`: "Transaction confirmed"
    - `review.ghostText.confirmError`: "Failed to confirm transaction"
    - `review.ghostText.confirm`: "Confirm"
    - `review.ghostText.edit`: "Edit"
    - `review.ghostText.reject`: "Reject"
    - `review.ghostText.viewOriginal`: "View original document"
    - `review.ghostText.aiReasoning`: "AI Reasoning"
    - `review.ghostText.confidence`: "Confidence"
    - `review.ghostText.category`: "Category"
    - `review.ghostText.project`: "Project"
    - `review.ghostText.estimated`: "Estimated"
    - `review.ghostText.editComingSoon`: "Edit mode coming in next update"
    - `review.ghostText.rejectComingSoon`: "Reject mode coming in next update"
    - `review.ghostText.noMoreItems`: "No more pending items"
  - [x] Add matching Hebrew translations to `src/i18n/he.json`:
    - `review.ghostText.confirmed`: "העסקה אושרה"
    - `review.ghostText.confirmError`: "שגיאה באישור העסקה"
    - `review.ghostText.confirm`: "אישור"
    - `review.ghostText.edit`: "עריכה"
    - `review.ghostText.reject`: "דחייה"
    - `review.ghostText.viewOriginal`: "צפייה במסמך המקורי"
    - `review.ghostText.aiReasoning`: "נימוק AI"
    - `review.ghostText.confidence`: "רמת ביטחון"
    - `review.ghostText.category`: "קטגוריה"
    - `review.ghostText.project`: "פרויקט"
    - `review.ghostText.estimated`: "מוערך"
    - `review.ghostText.editComingSoon`: "מצב עריכה יגיע בעדכון הבא"
    - `review.ghostText.rejectComingSoon`: "מצב דחייה יגיע בעדכון הבא"
    - `review.ghostText.noMoreItems`: "אין עוד פריטים ממתינים"

- [x] Task 7: Add confirmation animation keyframes (AC: #2)
  - [x] Add `goldGlow` keyframe to `src/styles/_animations.scss` (brief `$shadow-glow` pulse, 200ms)
  - [x] Add `fadeOut` keyframe to `src/styles/_animations.scss` (opacity 1 → 0)
  - [x] Add `slideDownFadeOut` keyframe to `src/styles/_animations.scss` (combines translateY + opacity for card exit)
  - [x] Use in `GhostTextCard.module.scss` for the confirmation sequence

## Dev Notes

### Architecture & Patterns

- **Data flow**: User selects item in `ReviewQueue` → `selectedTransactionId` set in `ReviewPage` → `GhostTextOverlay` renders with selected `Transaction` object → User presses Enter → `useConfirmTransaction` calls `updateDoc` on Firestore → `onSnapshot` listener in `usePendingReview` picks up the status change → item removed from pending list automatically → next item auto-selected
- **State management**: NO new Zustand store needed. Use existing `useTransactionStore` for transaction data. Card-local state (animation phase, confirming) lives in component `useState`. The `selectedTransactionId` is managed in `ReviewPage`.
- **Real-time updates**: When `updateDoc` sets `status: 'approved'`, the existing `usePendingReview` hook's Firestore listener will automatically remove the item from the pending list. The Dashboard and TopNav also update automatically via shared `useTransactionStore`. NO manual store updates needed after Firestore write.
- **Feature isolation**: All new files go under `src/features/review/`. Import shared components from `@/components`, stores from `@/stores`, utilities from `@/lib`, types from `@/types`, services from `@/services`. NEVER import from other feature directories.

### Existing Components to Reuse (DO NOT recreate)

| Component | Location | Usage |
|---|---|---|
| `Button` | `@/components/Button` | Confirm (primary), Edit (secondary), Reject (danger) action buttons. Supports `variant`, `size`, `loading`, `shortcut` props. |
| `Badge` | `@/components/Badge` | "Estimated" badge for non-ILS currency conversion display |
| `ConfidenceBadge` | `@/components/Badge` | Show green/yellow confidence indicator (already used in ReviewQueueItem) |
| `Card` | `@/components/Card` | Base card styling (optional — may use custom card styling for Ghost Text specific design) |
| `toast` | `@/stores/useUIStore` | `toast.success()`, `toast.error()`, `toast.info()` for notifications. Import: `import { toast } from '@/stores/useUIStore'` |

### Existing Utilities to Use (DO NOT recreate)

| Utility | Location | Usage |
|---|---|---|
| `formatCurrency(amountAgora, currency)` | `@/lib/currency` | Format transaction amount in card header |
| `relativeTime(date, undefined, t)` | `@/lib/dates` | Format date in card header ("Today", "Yesterday") |
| `useFirestoreCollection` | `@/hooks` | Already used by `usePendingReview` — DO NOT add another listener |
| `transactionSchema` | `@/types/transaction` | Already used — no new schema needed |
| `selectPendingReview` | `@/stores/useTransactionStore` | Already filters pending items |

### Existing Store (DO NOT recreate or modify)

`useTransactionStore` already has everything needed:
- `transactions: Transaction[]` — holds all loaded transactions
- `selectPendingReview` — filters `status === 'pending_review'`
- `setTransactions`, `setLoading`, `setError` — actions (driven by `usePendingReview` hook)

The store will auto-update when the Firestore document changes status. Do NOT manually remove items from the store after confirmation.

### Transaction Fields Used in This Story

From `src/types/transaction.ts` — key fields for Ghost Text Card:
- `id: string` — document ID for Firestore `updateDoc`
- `vendorName: string` — display in card header
- `amountAgora: number` — display via `formatCurrency(amountAgora, currency)`
- `currency: 'ILS' | 'USD' | 'EUR'` — currency symbol
- `date: Date` — display via `relativeTime(date)`
- `category: TransactionCategory` — Ghost Text field display (e.g., "Direct Cost")
- `suggestedWorkOrderId: string | null` — Ghost Text field for Project mapping
- `workOrderId: string | null` — confirmed work order link
- `status: 'pending_review' | 'approved' | 'rejected'` — update to `'approved'` on confirm
- `aiConfidence: number | null` — confidence bar percentage and color
- `classificationReasoning: string | null` — AI reasoning bubble text
- `originalFileUrl: string | null` — "View original document" link
- `isEstimatedConversion: boolean` — show "Estimated" badge if true
- `conversionRateStale: boolean` — additional warning indicator if true

### Firestore Update Pattern

Use `updateDoc` directly (NOT `setDoc`) to update only the status field:

```typescript
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/services';

await updateDoc(doc(db, 'transactions', transactionId), {
  status: 'approved',
  updatedAt: serverTimestamp(),
});
```

Do NOT update the store manually. The `usePendingReview` hook's `onSnapshot` listener will detect the Firestore change and update the store automatically. The pending count will decrement, and the item will disappear from the review queue.

### Work Order Name Resolution

To display the Project name in the Ghost Text field (instead of just the ID), read from `useWorkOrderStore`:

```typescript
import { useWorkOrderStore, selectWorkOrderById } from '@/stores';

const workOrder = useWorkOrderStore(selectWorkOrderById(transaction.suggestedWorkOrderId ?? ''));
const projectName = workOrder?.name ?? transaction.suggestedWorkOrderId ?? '—';
```

If `useWorkOrderStore` has not been populated yet (no work orders loaded), display the raw ID or a dash. Do NOT create a separate Firestore query to resolve work order names.

### Focus Trap Implementation

Implement focus trap without a third-party library. Pattern:

```typescript
// Get all focusable elements inside the card
const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
const focusableElements = cardRef.current?.querySelectorAll(focusableSelector);
const first = focusableElements?.[0] as HTMLElement;
const last = focusableElements?.[focusableElements.length - 1] as HTMLElement;

// On Tab at last element → focus first; on Shift+Tab at first → focus last
```

Auto-focus the Confirm button when the card opens for keyboard-first flow.

### Animation Sequence for Confirmation

The confirmation has a 3-phase animation sequence:

1. **Phase 1 — Gold Glow** (0-200ms): Apply `$shadow-glow` box-shadow pulse via CSS class toggle
2. **Phase 2 — Text Solidify** (200-400ms): Ghost Text fields transition `$text-muted` → `$text-primary`, border dashed → solid, using CSS `transition` (not keyframe)
3. **Phase 3 — Card Exit** (400-700ms): Card slides down + fades out via `slideDownFadeOut` keyframe

Manage phases via `useState<'idle' | 'glowing' | 'solidifying' | 'exiting'>` and `setTimeout` chains. After the `exiting` phase completes (listen for `animationend` event or setTimeout 300ms), call `onConfirmComplete` to advance to next item.

### Keyboard Shortcut Behavior

- Key listeners should be on `document` level (not on the card element) for global capture
- ONLY register listeners when the Ghost Text Card overlay is visible
- Ignore key events when `event.target` is an `<input>`, `<textarea>`, or `<select>` (for future Story 5.3 edit mode)
- `Enter` should NOT fire if the Confirm button is already in loading state (`isConfirming`)
- `ArrowRight` / `ArrowLeft`: find current item index in `pendingTransactions`, advance/retreat by 1, wrap around at boundaries or stop

### Arrow Key Navigation Logic

```typescript
// In ReviewPage: compute next/previous transaction
const currentIndex = pendingTransactions.findIndex(t => t.id === selectedTransactionId);

const handleNext = () => {
  if (currentIndex < pendingTransactions.length - 1) {
    setSelectedTransactionId(pendingTransactions[currentIndex + 1].id);
  } else {
    toast.info(t('review.ghostText.noMoreItems'));
  }
};

const handlePrevious = () => {
  if (currentIndex > 0) {
    setSelectedTransactionId(pendingTransactions[currentIndex - 1].id);
  }
};
```

### Portal Rendering

Use `createPortal` from `react-dom` to render the overlay at `document.body` level. This ensures the overlay sits above all other content regardless of stacking context:

```typescript
import { createPortal } from 'react-dom';

return createPortal(
  <div className={styles.overlay} onClick={onClose}>
    <div className={styles.card} onClick={(e) => e.stopPropagation()}>
      {/* card content */}
    </div>
  </div>,
  document.body
);
```

### SCSS Patterns

- Use SCSS Modules (`.module.scss`) — import as `styles`
- Reference design tokens: `@use '@/styles/variables' as *;` and `@use '@/styles/mixins' as *;` — **NOTE:** `_variables.scss` is auto-imported via Vite `additionalData`, so tokens like `$gold`, `$bg-primary` are available without explicit `@use`. Only `@use` mixins explicitly.
- Ghost Text field default state: dashed `$border-subtle` border, `$text-muted` italic text, `$bg-tertiary` background
- Ghost Text field confirmed state: solid `$gold` border, `$text-primary` normal weight text
- Overlay: `position: fixed; inset: 0; z-index: 100; background: rgba($bg-primary, 0.7)`
- Card: `position: relative; z-index: 101; max-width: 500px; width: 100%` within a flex-center overlay
- Confidence bar: progress element or div with `$success`/`$warning` background, `$radius-full` for pill shape
- RTL: use CSS logical properties exclusively (`padding-inline-start`, `margin-inline-end`, `border-inline-start`). NEVER use `left`/`right`.
- Touch targets: min 44px height on all interactive elements
- Transitions: use `$transition-fast` (150ms) for hover effects, `$transition-normal` (300ms) for card animations

### Category Display Names

Map `TransactionCategory` values to user-friendly display names via i18n:

```typescript
const CATEGORY_LABELS: Record<TransactionCategory, string> = {
  DirectCost: t('categories.directCost'),
  InventoryRestock: t('categories.inventoryRestock'),
  Overhead: t('categories.overhead'),
  Revenue: t('categories.revenue'),
  Personal: t('categories.personal'),
};
```

Check if these i18n keys already exist in `en.json`/`he.json`. If not, add them. The categories likely already have translations from Story 2.3 (manual transaction entry).

### Naming Conventions

- Component files: `PascalCase.tsx` + `PascalCase.module.scss`
- SCSS class names: `camelCase` (e.g., `.ghostTextCard`, `.confidenceBar`, `.actionButtons`, `.aiReasoning`)
- Hook files: `camelCase.ts` (e.g., `useGhostTextKeyboard.ts`, `useConfirmTransaction.ts`)
- i18n keys: dot-notation nested (e.g., `review.ghostText.confirmed`)
- Test files: co-located `*.test.tsx` / `*.test.ts` next to the component/hook

### Testing Standards

- Co-located tests next to the component (e.g., `GhostTextCard.test.tsx` alongside `GhostTextCard.tsx`)
- Use Vitest + React Testing Library
- **GhostTextCard tests**: renders all sections (header, fields, confidence, reasoning, actions, footer), conditional "Estimated" badge, conditional "View original" link, hidden when `originalFileUrl` is null
- **GhostTextOverlay tests**: renders overlay with backdrop, closes on overlay click, does NOT close on card click, traps focus, entrance animation class applied
- **useGhostTextKeyboard tests**: fires `onConfirm` on Enter, fires `onClose` on Escape, fires `onNext`/`onPrevious` on arrow keys, does NOT fire when input is focused, cleans up listener on unmount
- **useConfirmTransaction tests**: calls `updateDoc` with correct args, shows success toast, shows error toast on failure, sets `isConfirming` during operation
- **ReviewPage integration**: selecting item opens overlay, confirming closes overlay, Escape closes overlay, arrow keys navigate between items
- Mock Firestore: mock `firebase/firestore` module (`updateDoc`, `doc`, `serverTimestamp`)
- Run `tsc --noEmit` before considering complete — zero TypeScript errors

### Project Structure Notes

New files to create:
```
src/features/review/
  components/
    GhostTextCard.tsx             # Main Ghost Text review card
    GhostTextCard.module.scss     # Card styling with animations
    GhostTextCard.test.tsx        # Card rendering tests
    GhostTextOverlay.tsx          # Full-screen overlay with focus trap
    GhostTextOverlay.module.scss  # Overlay styling
    GhostTextOverlay.test.tsx     # Overlay behavior tests
    index.ts                      # Update barrel — add GhostTextCard, GhostTextOverlay
  hooks/
    useGhostTextKeyboard.ts       # Keyboard shortcut handler
    useGhostTextKeyboard.test.ts  # Keyboard hook tests
    useConfirmTransaction.ts      # Firestore approve action
    useConfirmTransaction.test.ts # Confirm hook tests
    index.ts                      # Update barrel — add new hooks
```

Files to modify:
```
src/features/review/ReviewPage.tsx          # Integrate GhostTextOverlay on item select
src/features/review/ReviewPage.module.scss  # Minor layout adjustments if needed
src/features/review/ReviewPage.test.tsx     # Add Ghost Text integration tests
src/i18n/en.json                            # Add review.ghostText.* keys
src/i18n/he.json                            # Add review.ghostText.* Hebrew translations
src/styles/_animations.scss                 # Add goldGlow, fadeOut, slideDownFadeOut keyframes
```

Files that already exist and should NOT be modified (unless adding barrel exports):
```
src/stores/useTransactionStore.ts          # Already has what's needed
src/stores/useWorkOrderStore.ts            # Read-only — use selectWorkOrderById
src/stores/useUIStore.ts                   # toast.success/error already available
src/types/transaction.ts                   # Already has full schema
src/components/Button/Button.tsx           # Already supports variant + shortcut
src/components/Badge/ConfidenceBadge.tsx   # Already handles >= 85% logic
src/components/Badge/Badge.tsx             # Already supports color prop
src/hooks/useFirestoreCollection.ts        # Already in use by usePendingReview
src/services/firebase.ts                   # Already exports db
src/router.tsx                             # /review route already exists
```

### Previous Story Learnings (from Story 5.1)

1. **React 19 + Zustand**: Use `useMemo` for derived computations from store data. Direct `.filter()` in render causes re-render loops. The `usePendingReview` hook already follows this pattern — do not change it.
2. **Firestore Timestamps**: `useFirestoreCollection` converts Firestore `Timestamp` to JS `Date` automatically via Zod transform. When writing back, use `serverTimestamp()` from `firebase/firestore`.
3. **Store merging**: `usePendingReview` wires data into `useTransactionStore.setTransactions()`. When a transaction is confirmed, the listener automatically removes it from the pending list. No manual store manipulation needed.
4. **Button component**: Already has `shortcut` prop that renders a `<kbd>` element with the keyboard shortcut text. Use it: `<Button variant="primary" shortcut="Enter">{t('review.ghostText.confirm')}</Button>`.
5. **Toast usage**: Import `toast` object from `@/stores/useUIStore`. Call `toast.success(message)` directly — no hook needed.
6. **PageShell pending count**: `PageShell.tsx` already reads pending count from `useTransactionStore` and passes to `TopNav`. When transactions are confirmed, the count auto-decrements. No wiring needed.
7. **SCSS auto-import**: `_variables.scss` is auto-imported via Vite `additionalData`. Do NOT add `@use '@/styles/variables'` in `.module.scss` files — it will cause duplicate CSS. Mixins DO need explicit `@use '@/styles/mixins' as *;`.
8. **relativeTime i18n**: The `relativeTime()` utility in `src/lib/dates.ts` accepts an optional `t` function parameter for internationalized date strings. Always pass `t` from `useTranslation()`.

### Git Intelligence (Recent Commits)

Most recent commit: `3d2f189 Implement Story 5.1: Review Queue & Pending Items List with code review fixes`. Key patterns from Story 5.1:
- `ReviewPage.tsx` uses `usePendingReview()` hook and manages `selectedTransactionId` via `useState`
- `ReviewQueueItem` uses `<button>` for accessibility with `aria-pressed` for selected state
- `ConfidenceBadge` is reused from `@/components/Badge` — same component used in Ghost Text Card
- Error state with `WarningCircle` icon + `role="alert"` added during code review
- `PageShell.tsx` reads from `useTransactionStore` with targeted selector `(state) => state.transactions` to reduce re-renders

### Scope Boundaries

**IN scope for this story:**
- Ghost Text Card rendering with all fields
- Confirm flow (Enter key / click) with Firestore update
- Card overlay with focus trap
- Keyboard shortcuts (Enter, Esc, arrows)
- Card entrance/exit animations
- Auto-advance to next pending item
- Placeholder stubs for Edit (E key) and Reject (Del key) — toast only

**OUT of scope (deferred to later stories):**
- Story 5.3: Field editing (searchable dropdowns for Category/Project), reject confirmation dialog
- Story 5.4: Cloud Function side effects (`onTransactionApproved` trigger)
- Story 5.5: Batch approval ("Approve All"), full-screen mobile Ghost Text with swipe

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Epic 5, Story 5.2]
- [Source: _bmad-output/planning-artifacts/architecture.md — Frontend Architecture, State Management, Component Patterns, Animation Tiers]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — Ghost Text Review Flow, Card Design, Keyboard Navigation, Animation Sequences]
- [Source: _bmad-output/planning-artifacts/prd.md — FR24, FR25, FR28, FR31]
- [Source: _bmad-output/implementation-artifacts/5-1-review-queue-pending-items-list.md — Previous Story Learnings, Existing Components, Store Patterns]
- [Source: src/features/review/ — Established patterns for ReviewPage, ReviewQueue, usePendingReview]
- [Source: src/stores/useTransactionStore.ts — Existing store with selectPendingReview]
- [Source: src/stores/useWorkOrderStore.ts — selectWorkOrderById for project name resolution]
- [Source: src/stores/useUIStore.ts — toast.success/error convenience functions]
- [Source: src/types/transaction.ts — Full Transaction schema including AI fields]
- [Source: src/components/Button/Button.tsx — variant + shortcut prop support]
- [Source: src/components/Badge/ConfidenceBadge.tsx — Confidence display logic]
- [Source: src/styles/_variables.scss — Design tokens: $shadow-glow, $text-muted, $border-subtle, etc.]
- [Source: src/styles/_animations.scss — Existing keyframes: scaleIn, fadeIn, slideDown, pulse]

## Change Log

- **2026-02-13**: Implemented Story 5.2 — Ghost Text Card core confirmation flow. Created GhostTextCard, GhostTextOverlay components, useGhostTextKeyboard and useConfirmTransaction hooks, integrated into ReviewPage, added i18n keys (EN+HE), and confirmation animation keyframes. All 7 tasks complete, 55 new tests added (706 total pass), zero TypeScript errors.
- **2026-02-13**: Code review fixes (7 issues: 2 HIGH, 3 MEDIUM, 2 LOW). Added setTimeout cleanup in handleConfirm to prevent memory leaks on unmount. Added aria-modal="true" to dialog for screen reader compliance. Moved Firestore confirm() before exit animation to prevent visual glitch on error. Refactored useGhostTextKeyboard to use refs for stable callbacks, eliminating listener churn. Used ref guard in useConfirmTransaction to stabilize confirm callback identity. Fixed error re-throw to preserve original error. Added empty transactionId guard. Added token sync comment to goldGlow keyframe. 706/706 tests pass, zero TypeScript errors.

## Dev Agent Record

### Agent Model Used

Claude claude-4.6-opus (Cursor Agent)

### Debug Log References

No issues encountered during implementation.

### Completion Notes List

- **Task 1**: Created `GhostTextCard` component with header (FileText icon, vendor, date, amount, estimated badge), ghost text fields (category + project with work order name resolution), confidence bar (green/yellow), AI reasoning bubble, action buttons (Confirm/Edit/Reject with keyboard shortcuts), and conditional "View original document" link. Fully responsive with stacked buttons on mobile. 18 tests.
- **Task 2**: Created `GhostTextOverlay` component using React portal at `document.body`. Implements full-viewport dimmed backdrop (`rgba($bg-primary, 0.7)`), focus trap (Tab/Shift+Tab cycling), auto-focus on first button, and close-on-overlay-click (not on card click). 8 tests.
- **Task 3**: Created `useGhostTextKeyboard` hook with document-level keydown listener that only registers when overlay is open. Handles Enter, E, Delete, Escape, ArrowRight, ArrowLeft. Ignores key events on input/textarea/select elements. Prevents Enter when isConfirming. 13 tests.
- **Task 4**: Created `useConfirmTransaction` hook. Calls `updateDoc` to set `status: 'approved'` + `serverTimestamp()`. Returns `{ confirm, isConfirming }`. Shows success/error toasts. Prevents double-confirm. 6 tests.
- **Task 5**: Updated `ReviewPage` to integrate GhostTextOverlay. Wired all callbacks: confirm with 3-phase animation sequence (glow→solidify→exit), close (clear selection), next/previous (array navigation with boundary toast), edit/reject (placeholder toasts). Added 4 new integration tests (10 total). No changes to ReviewPage.module.scss needed.
- **Task 6**: Added 14 i18n keys under `review.ghostText.*` in both `en.json` and `he.json`.
- **Task 7**: Added `goldGlow`, `fadeOut`, and `slideDownFadeOut` keyframes to `_animations.scss`. Used in `GhostTextCard.module.scss` confirmation phases.

### File List

New files:
- `src/features/review/components/GhostTextCard.tsx`
- `src/features/review/components/GhostTextCard.module.scss`
- `src/features/review/components/GhostTextCard.test.tsx`
- `src/features/review/components/GhostTextOverlay.tsx`
- `src/features/review/components/GhostTextOverlay.module.scss`
- `src/features/review/components/GhostTextOverlay.test.tsx`
- `src/features/review/hooks/useGhostTextKeyboard.ts`
- `src/features/review/hooks/useGhostTextKeyboard.test.ts`
- `src/features/review/hooks/useConfirmTransaction.ts`
- `src/features/review/hooks/useConfirmTransaction.test.ts`

Modified files:
- `src/features/review/ReviewPage.tsx`
- `src/features/review/ReviewPage.test.tsx`
- `src/features/review/components/index.ts`
- `src/features/review/hooks/index.ts`
- `src/i18n/en.json`
- `src/i18n/he.json`
- `src/styles/_animations.scss`
