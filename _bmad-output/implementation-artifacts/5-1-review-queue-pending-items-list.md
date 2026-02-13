# Story 5.1: Review Queue & Pending Items List

Status: done

## Story

As a **Gal (Financial Operator)**,
I want to see all pending review items in a dedicated queue with confidence indicators,
So that I know exactly what needs my attention and can prioritize yellow-flagged items.

## Acceptance Criteria

1. **Review Page List**: The Review page (`/review`) renders a list of pending transactions. Each item shows: vendor name, amount (formatted via `formatCurrency` from `@/lib/currency`), confidence indicator (green dot for `aiConfidence >= 85`, yellow "Check Me" badge via existing `ConfidenceBadge` component for < 85), relative date ("Today", "Yesterday", "3 days ago" via `relativeTime` from `@/lib/dates`), and mailbox source. Items sorted by confidence ascending (low-confidence first — needs attention).

2. **Pending Counter**: A counter displays at the top of the review list: "3 pending" (or Hebrew equivalent). This same count reflects in the Top Nav pending badge and Dashboard KPI card — all driven by the same Firestore listener data.

3. **Empty State**: When no pending items exist, a warm empty state displays: Phosphor `CheckCircle` icon + "You're all caught up!" text + timestamp of last review. Uses i18n translation keys `empty.allCaughtUp` (already exists in en.json/he.json).

4. **Real-Time Firestore Hook**: `src/features/review/hooks/usePendingReview.ts` subscribes to `transactions` collection filtered by `status: 'pending_review'` via the existing `useFirestoreCollection` hook. Data flows through `transactionSchema` Zod validation into `useTransactionStore`. The listener updates in real-time (new AI-processed items appear without refresh). Cleanup on unmount.

5. **Item Click Navigation**: When a pending item is clicked/tapped, it prepares for Ghost Text Card (Story 5.2). For this story, clicking an item opens a detail preview or highlights the selection. The list remains visible in the background on desktop.

6. **Dashboard Integration**: The pending count in the Top Nav badge and the Dashboard "Pending Review" KPI card reflects the real-time count from the same Firestore listener. The Dashboard KPI card already navigates to `/review` on click (this is already wired in `DashboardPage.tsx`). Ensure the count decrements immediately when items are confirmed/rejected (future stories consume this).

7. **Mobile Responsive**: On mobile (< 768px), the list is full-width single column. Each item row is >= 44px height with touch-friendly tap targets. Uses CSS logical properties for RTL support.

## Tasks / Subtasks

- [x] Task 1: Create `usePendingReview` hook (AC: #4, #6)
  - [x] Create `src/features/review/hooks/usePendingReview.ts`
  - [x] Use existing `useFirestoreCollection` hook with `transactionSchema`
  - [x] Filter query: `where('status', '==', 'pending_review')`, order by `createdAt desc`
  - [x] Wire data into `useTransactionStore` via `setTransactions` (merge with existing, don't overwrite approved/rejected)
  - [x] Return `{ pendingTransactions, loading, error }` — use `selectPendingReview` selector from store
  - [x] Export from `src/features/review/hooks/index.ts`
  - [x] Create co-located test: `usePendingReview.test.ts`

- [x] Task 2: Create `ReviewQueue` component (AC: #1, #2, #3)
  - [x] Create `src/features/review/components/ReviewQueue.tsx`
  - [x] Create `src/features/review/components/ReviewQueue.module.scss`
  - [x] Render pending counter at top: "{count} pending" using i18n key
  - [x] Render list of `ReviewQueueItem` components (Task 3)
  - [x] Sort items by `aiConfidence` ascending (yellow first)
  - [x] Render empty state when no items: `CheckCircle` icon + `t('empty.allCaughtUp')` + last review timestamp
  - [x] Render loading skeleton when `loading === true` (use existing `Skeleton` component)
  - [x] Export from `src/features/review/components/index.ts`
  - [x] Create co-located test: `ReviewQueue.test.tsx`

- [x] Task 3: Create `ReviewQueueItem` component (AC: #1, #5, #7)
  - [x] Create `src/features/review/components/ReviewQueueItem.tsx`
  - [x] Create `src/features/review/components/ReviewQueueItem.module.scss`
  - [x] Render: vendor name, formatted amount (`formatCurrency(amountAgora, currency)`), `ConfidenceBadge` (existing component), relative date (`relativeTime(date)`), mailbox source badge
  - [x] Handle click/tap — emit `onSelect(transactionId)` callback
  - [x] Selected state: highlight with `$bg-elevated` background + `$gold` left border
  - [x] Mobile: full-width, min-height 44px, touch-friendly
  - [x] RTL: CSS logical properties throughout (`padding-inline-start`, `border-inline-start`)
  - [x] Export from `src/features/review/components/index.ts`
  - [x] Create co-located test: `ReviewQueueItem.test.tsx`

- [x] Task 4: Update `ReviewPage` — replace placeholder (AC: #1, #2, #3, #5)
  - [x] Replace placeholder content in `src/features/review/ReviewPage.tsx` with `ReviewQueue` component
  - [x] Call `usePendingReview()` hook
  - [x] Pass data and handlers to `ReviewQueue`
  - [x] Track `selectedTransactionId` in local state
  - [x] Update `ReviewPage.module.scss` — remove placeholder styles, add review page layout
  - [x] Update existing test `ReviewPage.test.tsx`

- [x] Task 5: Add i18n keys for review feature (AC: #1, #2, #3)
  - [x] Add to `src/i18n/en.json`:
    - `review.queue.pendingCount`: "{{count}} pending"
    - `review.queue.pendingCountOne`: "1 pending"
    - `review.queue.sortedByAttention`: "Sorted by attention needed"
    - `review.queue.lastReviewAt`: "Last reviewed {{time}}"
    - `review.queue.mailboxSource`: "via {{mailbox}}"
  - [x] Add matching Hebrew translations to `src/i18n/he.json`:
    - `review.queue.pendingCount`: "{{count}} ממתינים"
    - `review.queue.pendingCountOne`: "1 ממתין"
    - `review.queue.sortedByAttention`: "ממוין לפי דחיפות"
    - `review.queue.lastReviewAt`: "נבדק לאחרונה {{time}}"
    - `review.queue.mailboxSource`: "דרך {{mailbox}}"

- [x] Task 6: Ensure pending count syncs across app (AC: #6)
  - [x] Verify `useDashboardData` in `src/features/dashboard/hooks/useDashboardData.ts` correctly reads pending count from `useTransactionStore` via `selectPendingReview`
  - [x] Verify Top Nav pending badge reads from the same store selector
  - [x] If the Dashboard currently computes pending count independently, refactor to use the shared store selector so both Dashboard and Review page show consistent counts
  - [x] Verify KPI card click navigates to `/review` (already wired — just confirm)

## Dev Notes

### Architecture & Patterns

- **Data flow**: Firestore `transactions` collection → `onSnapshot` listener in `usePendingReview` → Zod `transactionSchema` parse → `useTransactionStore` → React components via `selectPendingReview` selector
- **State management**: Use existing `useTransactionStore` Zustand store — it already has `selectPendingReview` selector filtering by `status === 'pending_review'`. Do NOT create a separate store for review data.
- **Real-time updates**: The `useFirestoreCollection` hook handles listener lifecycle (subscribe on mount, unsubscribe on cleanup). New items from the AI pipeline (`processDocument` Cloud Function) will appear automatically.
- **Feature isolation**: `src/features/review/` is self-contained. Import shared components from `@/components`, stores from `@/stores`, utilities from `@/lib`, types from `@/types`. NEVER import from other feature directories.

### Existing Components to Reuse (DO NOT recreate)

| Component | Location | Usage |
|---|---|---|
| `ConfidenceBadge` | `@/components/Badge` | Show green/yellow confidence indicator on each item |
| `Badge` | `@/components/Badge` | For mailbox source badge |
| `Skeleton` | `@/components/Skeleton` | Loading state skeleton screens |
| `Card` | `@/components/Card` | Wrap the review queue if needed |
| `toast` | `@/components/Toast` (re-exports from useUIStore) | Error notifications |

### Existing Utilities to Use (DO NOT recreate)

| Utility | Location | Usage |
|---|---|---|
| `formatCurrency(amountAgora, currency)` | `@/lib/currency` | Format transaction amounts |
| `relativeTime(date)` | `@/lib/dates` | "Today", "Yesterday", "3 days ago" |
| `useFirestoreCollection` | `@/hooks` | Real-time Firestore listener |
| `transactionSchema` | `@/types/transaction` | Zod validation for Firestore docs |
| `selectPendingReview` | `@/stores/useTransactionStore` | Selector for pending transactions |

### Existing Store (DO NOT recreate)

`useTransactionStore` already exists with:
- `transactions: Transaction[]` — holds all loaded transactions
- `selectPendingReview` — filters `status === 'pending_review'`
- `selectByWorkOrder(woId)` — filters by work order
- `selectByCategory(category)` — filters by category
- `setTransactions`, `setLoading`, `setError` — actions

### Transaction Type (already defined in `src/types/transaction.ts`)

Key fields for this story:
- `id: string`
- `vendorName: string`
- `amountAgora: number` (integer — display via `formatCurrency`)
- `currency: 'ILS' | 'USD' | 'EUR'`
- `date: Date`
- `category: 'DirectCost' | 'InventoryRestock' | 'Overhead' | 'Revenue' | 'Personal'`
- `status: 'pending_review' | 'approved' | 'rejected'`
- `aiConfidence: number` (0-100, used by `ConfidenceBadge`)
- `source: 'manual' | 'ai'`
- `sourceEmailRef: string | null`
- `isEstimatedConversion: boolean`
- `conversionRateStale: boolean`
- `classificationReasoning: string | null`

### Firestore Query Pattern

```typescript
import { collection, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/services';

const q = query(
  collection(db, 'transactions'),
  where('status', '==', 'pending_review'),
  orderBy('createdAt', 'desc')
);
```

Then pass `q` to `useFirestoreCollection` which handles `onSnapshot` subscription, Zod parsing, and cleanup.

**IMPORTANT**: The `useFirestoreCollection` hook accepts `onData`, `onError`, `onLoading` callbacks. Follow the pattern from `useDashboardData.ts` — use `useMemo` for computed values derived from store data to avoid React 19 + Zustand re-render loops.

### Sorting Logic

Client-side sort after Firestore query (Firestore orders by `createdAt`, but we want display sorted by confidence ascending):

```typescript
const sorted = useMemo(
  () => [...pendingTransactions].sort((a, b) => a.aiConfidence - b.aiConfidence),
  [pendingTransactions]
);
```

Low-confidence items (yellow "Check Me") appear first — they need the most attention.

### SCSS Patterns

- Use SCSS Modules (`.module.scss`) — import as `styles`
- Reference design tokens: `@use '@/styles/variables' as *;` and `@use '@/styles/mixins' as *;`
- Dashboard density: use `$space-md` (16px) for card padding, `$text-sm` (16px) for list item text
- RTL: use CSS logical properties exclusively (`padding-inline-start`, `margin-inline-end`, `border-inline-start`). Never use `left`/`right`.
- Touch targets: min 44px height on all interactive elements
- Hover effects: `150ms` transition, `translateY(-1px)` lift, `$bg-elevated` background
- Focus: `@include focus-ring` mixin for keyboard navigation
- Selected state: `$bg-elevated` + `$gold` inline-start border (2-3px solid)

### Naming Conventions

- Component files: `PascalCase.tsx` + `PascalCase.module.scss`
- SCSS class names: `camelCase` (e.g., `.queueItem`, `.vendorName`, `.confidenceWrapper`)
- Hook files: `camelCase.ts` (e.g., `usePendingReview.ts`)
- i18n keys: dot-notation nested (e.g., `review.queue.pendingCount`)
- Test files: co-located `*.test.tsx` next to the component

### Testing Standards

- Co-located tests next to the component (e.g., `ReviewQueue.test.tsx` next to `ReviewQueue.tsx`)
- Use Vitest + React Testing Library
- Test: renders loading skeleton, renders list of items, renders empty state, sorts by confidence
- Mock Firestore: mock `useFirestoreCollection` or the store directly
- Run `tsc --noEmit` before considering complete — zero TypeScript errors

### Project Structure Notes

New files to create:
```
src/features/review/
  components/
    ReviewQueue.tsx           # Main queue list component
    ReviewQueue.module.scss
    ReviewQueue.test.tsx
    ReviewQueueItem.tsx       # Individual pending item row
    ReviewQueueItem.module.scss
    ReviewQueueItem.test.tsx
    index.ts                  # Update barrel export
  hooks/
    usePendingReview.ts       # Firestore listener hook
    usePendingReview.test.ts
    index.ts                  # Update barrel export
  ReviewPage.tsx              # Update existing — replace placeholder
  ReviewPage.module.scss      # Update existing — replace placeholder styles
  ReviewPage.test.tsx         # Update existing — test real page
```

Files to modify:
```
src/i18n/en.json              # Add review.queue.* keys
src/i18n/he.json              # Add review.queue.* keys (Hebrew translations)
```

Files that already exist and should NOT be modified:
```
src/stores/useTransactionStore.ts    # Already has selectPendingReview
src/types/transaction.ts             # Already has full schema
src/components/Badge/ConfidenceBadge.tsx  # Already handles >= 85% logic
src/hooks/useFirestoreCollection.ts  # Already handles onSnapshot lifecycle
src/router.tsx                       # /review route already exists
```

### Previous Story Learnings (from Epics 1-4)

1. **React 19 + Zustand**: Use `useMemo` for derived computations from store data. Direct `.filter()` in render can cause re-render loops. See `useDashboardData.ts` pattern.
2. **Firestore Timestamps**: `useFirestoreCollection` converts Firestore `Timestamp` to JS `Date` automatically via Zod transform. No manual conversion needed.
3. **i18n pluralization**: react-i18next supports `_one`, `_other` suffixes for pluralization. Use `t('review.queue.pendingCount', { count })`.
4. **SCSS Module types**: `vite-plugin-sass-dts` auto-generates `.d.scss.ts` type files. No manual type declarations needed for SCSS modules.
5. **Store merging**: When the review hook loads pending transactions, merge them into the store alongside any previously loaded transactions. Don't overwrite the entire `transactions` array.
6. **Dashboard KPI sync**: The Dashboard's `useDashboardData` hook already reads from `useTransactionStore`. If pending transactions are in the store, the Dashboard KPI card will automatically reflect the correct count. Verify this works — don't duplicate the listener.

### Git Intelligence (Recent Commits)

Recent work completed all Epic 4 stories (Gmail API, Paperless Auto-Forward, AI Document Processing, Transaction Classification, Error Handling). Key patterns established:
- Cloud Functions follow the pattern: trigger function → process → create/update Firestore document → client listeners pick up changes automatically
- Transaction documents created by `processDocument` Cloud Function have `status: 'pending_review'` — these are the items this story will display
- `sourceEmailRef` links transactions back to email_log entries
- `classificationReasoning` field contains the AI's explanation for its classification (will be used in Story 5.2's Ghost Text Card)

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Epic 5, Story 5.1]
- [Source: _bmad-output/planning-artifacts/architecture.md — Frontend Architecture, Feature Module Structure, State Management Patterns]
- [Source: _bmad-output/planning-artifacts/architecture.md — Naming Patterns, Data Flow Patterns]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — Ghost Text Review flow, Review Page layout, Mobile adaptation]
- [Source: _bmad-output/planning-artifacts/prd.md — FR23, FR24, FR28, FR29, FR30]
- [Source: src/features/dashboard/ — Established patterns for hooks, stores, components]
- [Source: src/stores/useTransactionStore.ts — Existing store with selectPendingReview]
- [Source: src/types/transaction.ts — Full Transaction schema]
- [Source: src/hooks/useFirestoreCollection.ts — Real-time listener pattern]
- [Source: src/components/Badge/ConfidenceBadge.tsx — Existing confidence display]

## Dev Agent Record

### Agent Model Used

Claude (Cursor IDE)

### Debug Log References

- No blockers or debug issues encountered during implementation.

### Completion Notes List

- **Task 1**: Created `usePendingReview` hook following the `useDashboardData.ts` pattern. Subscribes to `transactions` collection via `useFirestoreCollection`, wires into `useTransactionStore`, and derives pending items via `useMemo` (React 19 + Zustand safe). Sorts by `aiConfidence` ascending so low-confidence items appear first. 6 unit tests passing.
- **Task 2**: Created `ReviewQueue` component with pending counter header, list rendering, loading skeleton (4 shimmer rows using existing `Skeleton` component), and empty state (Phosphor `CheckCircle` icon + "You're all caught up!" + optional last review timestamp). 6 unit tests passing.
- **Task 3**: Created `ReviewQueueItem` component rendering vendor name, formatted amount, `ConfidenceBadge`, relative date, and optional mailbox source badge. Uses `<button>` for accessibility with `aria-pressed` for selected state. CSS uses logical properties throughout for RTL. 44px min-height for touch targets. 6 unit tests passing.
- **Task 4**: Replaced `ReviewPage` placeholder with real implementation. Uses `usePendingReview` hook, renders `ReviewQueue`, tracks `selectedTransactionId` in local state. Card-surface layout with max-width 720px. 4 unit tests passing.
- **Task 5**: Added `review.queue.*` i18n keys to both `en.json` and `he.json` with proper react-i18next pluralization suffix (`_one`).
- **Task 6**: Verified Dashboard KPI card navigates to `/review` on click. Wired `PageShell` to read pending count from `useTransactionStore` and pass to `TopNav` — badge now shows real-time count. Dashboard, TopNav, and ReviewPage all read from the same shared Zustand store for consistency.
- **Additional**: Implemented `relativeTime()` utility in `src/lib/dates.ts` — was referenced in story Dev Notes but did not exist. Returns "Today", "Yesterday", "X days ago" strings.

### File List

New files:
- `src/features/review/hooks/usePendingReview.ts`
- `src/features/review/hooks/usePendingReview.test.ts`
- `src/features/review/components/ReviewQueue.tsx`
- `src/features/review/components/ReviewQueue.module.scss`
- `src/features/review/components/ReviewQueue.test.tsx`
- `src/features/review/components/ReviewQueueItem.tsx`
- `src/features/review/components/ReviewQueueItem.module.scss`
- `src/features/review/components/ReviewQueueItem.test.tsx`

Modified files:
- `src/features/review/ReviewPage.tsx` (replaced placeholder with ReviewQueue)
- `src/features/review/ReviewPage.module.scss` (replaced placeholder styles with page layout)
- `src/features/review/ReviewPage.test.tsx` (updated tests for real implementation)
- `src/features/review/hooks/index.ts` (added usePendingReview export)
- `src/features/review/components/index.ts` (added ReviewQueue, ReviewQueueItem exports)
- `src/i18n/en.json` (added review.queue.* keys)
- `src/i18n/he.json` (added review.queue.* Hebrew translations)
- `src/lib/dates.ts` (added relativeTime utility)
- `src/components/Layout/PageShell.tsx` (wired pendingCount from store to TopNav)

## Change Log

- 2026-02-13: Story 5.1 implemented — Review Queue & Pending Items List. All 6 tasks complete. 22 new tests added (6 hook + 12 component + 4 page). Full test suite: 655 tests passing, 0 regressions. `tsc --noEmit` clean.
- 2026-02-13: Code review completed — 7 issues found (1 HIGH, 4 MEDIUM, 2 LOW), all fixed:
  - H1: Added error state UI to ReviewPage (WarningCircle icon + error text + role="alert")
  - M1: Internationalized `relativeTime()` — added optional `t` function parameter + `dates.relative.*` i18n keys (EN + HE)
  - M2: Replaced duplicated `pending_review` filter in `usePendingReview` with shared `selectPendingReview` selector
  - M3: Changed `PageShell.tsx` from full store subscription to targeted `(state) => state.transactions` selector, reducing unnecessary re-renders
  - M4: Replaced fragile `rerender()` in ReviewPage test with idiomatic `waitFor()` from React Testing Library
  - L1: Fixed `ReviewQueue.test.tsx` type safety — replaced `as never[]` casts with properly-typed `makeTxn` factory using `Transaction` type
  - L2: Added `aria-label` to `ReviewQueueItem` button for screen reader accessibility
  - Added 2 new tests for error state (24 review tests total). `tsc --noEmit` clean. Status → done.
