# Story 2.5: Work Order Detail Page

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As **Gal**,
I want a complete detail view for each Work Order that assembles all financial data in one place,
So that I can drill into any project and understand its full financial picture.

## Acceptance Criteria

1. **Route & Page Assembly**: Route `/work-orders/:id` renders `WorkOrderDetailPage` with: project header (client name, description, deadline), Status Stepper (current phase highlighted), Nutrition Label (full financial breakdown), and linked Transactions list. All data loads via existing hooks (`useWorkOrders`, `useTransactions`). Work Order is looked up via `selectWorkOrderById(id)` from `useWorkOrderStore`.

2. **Back Navigation**: Browser back returns to the Work Orders list with scroll position preserved. A visible back button or breadcrumb (e.g., `ArrowLeft` icon + "Work Orders" link) navigates to `/work-orders`. Use `useNavigate()` from React Router.

3. **Project Header**: Shows client name (`$text-xl`, `$gold`), project description (`$text-base`, `$text-primary`), deadline (formatted `DD/MM/YYYY` if set, hidden if null), and an Edit button (`variant="secondary"`, `PencilSimple` icon). Clicking Edit opens `WorkOrderForm` with current values pre-filled for inline editing.

4. **Status Stepper Integration**: The existing `StatusStepper` component renders below the header, showing the full lifecycle (Lead → Design → Production → Shipped) with the current phase highlighted. Clicking a step changes the status via `useWorkOrderActions.updateWorkOrder`. Status changes persist to Firestore immediately.

5. **Nutrition Label Integration**: The `NutritionLabel` component (from Story 2.4) renders with the current Work Order and its linked transactions. Pass `loading` prop when transactions are still loading. NutritionLabel shows revenue, costs, buffer, net profit, and margin with full expand/collapse support.

6. **Transactions List**: When transactions linked to this Work Order exist, display them in a clean list sorted by date (newest first). Each row shows: date (formatted via `toLocaleDateString(i18n.language)`), vendor name, amount (formatted via `formatCurrency(amountAgora, currency)`), and category badge (via `Badge` component with appropriate color). Transactions are filtered using `selectByWorkOrder(id)` selector from `useTransactionStore`.

7. **Empty Transactions State**: When no transactions are linked, show an empty state: "No costs or revenue tracked yet" with a hint about adding transactions manually, and an "Add Transaction" CTA button.

8. **Add Transaction from Detail Page**: An "Add Transaction" button is always visible. Clicking it opens the `TransactionForm` with `defaultWorkOrderId={id}` so the Work Order is pre-selected in the linkage field. On successful submission, the form closes and the Nutrition Label updates in real-time via Firestore listener.

9. **Invalid Work Order Handling**: When the URL `:id` doesn't match any Work Order (after loading completes), display an error state: `WarningCircle` icon + "Work Order not found" text + "Back to Work Orders" link navigating to `/work-orders`.

10. **Mobile Responsive**: On small viewports (< `$bp-sm`), sections stack vertically: Header → Status Stepper → Nutrition Label → Transactions. All sections are fully functional with touch-friendly controls (≥ 44px tap targets). Transaction list simplifies layout.

## Tasks / Subtasks

- [x] Task 1: Replace WorkOrderDetailPage Component (AC: #1, #2, #3, #4, #5, #6, #7, #8, #9, #10)
  - [x] Replace placeholder `src/features/work-orders/WorkOrderDetailPage.tsx` with full implementation
  - [x] Extract `id` from URL params via `useParams<{ id: string }>()`
  - [x] Load data via `useWorkOrders()` and `useTransactions()` hooks (already subscribed at page level)
  - [x] Derive Work Order via `useMemo` with `workOrders.find()` (avoids dual Zustand subscription issue)
  - [x] Filter transactions via `useMemo` with `transactions.filter()` (avoids dual Zustand subscription issue)
  - [x] Sort transactions by date (newest first) with `useMemo`
  - [x] Manage local UI state: `showEditForm`, `showTransactionForm`
  - [x] Implement back navigation with `ArrowLeft` icon + `useNavigate()`
  - [x] Implement project header section with client name, description, deadline, edit button
  - [x] Integrate `StatusStepper` with `onStatusChange` via `useWorkOrderActions.updateWorkOrder`
  - [x] Integrate `NutritionLabel` with `workOrder`, `transactions`, and `loading` props
  - [x] Implement transactions list with date, vendor, amount, category badge
  - [x] Implement empty transactions state with CTA
  - [x] Implement "Add Transaction" button opening `TransactionForm` with `defaultWorkOrderId`
  - [x] Implement not-found error state for invalid Work Order IDs
  - [x] Implement loading skeleton state
  - [x] All text via i18n `t()` function
  - [x] All amounts via `formatCurrency()`

- [x] Task 2: WorkOrderDetailPage SCSS Styles (AC: #1, #2, #3, #10)
  - [x] Replace placeholder `src/features/work-orders/WorkOrderDetailPage.module.scss` with full styles
  - [x] Page layout: vertical stacking with `$space-lg` gap between sections
  - [x] Back navigation: inline-flex, clickable area ≥ 44px, `$text-secondary` color, hover `$gold`
  - [x] Header section: client name `$text-xl` `$gold`, description `$text-base` `$text-primary`, deadline `$text-sm` `$text-muted`
  - [x] Transactions list: `@include card-surface` container, rows with subtle border separators
  - [x] Transaction row: flex layout (date, vendor, amount, badge), hover state
  - [x] Empty state: centered, muted text, CTA button
  - [x] Error state: centered, `$error` icon, muted text, link back
  - [x] Loading skeleton state
  - [x] Mobile responsive: single-column, sections full width, touch targets ≥ 44px
  - [x] CSS logical properties throughout — no `left`/`right`

- [x] Task 3: i18n Translation Keys (AC: all)
  - [x] Replace existing `pages.workOrderDetail` placeholder keys in `src/i18n/en.json` with comprehensive detail page keys
  - [x] Add `workOrderDetail` namespace to `src/i18n/en.json`:
    - `backToList`, `editWorkOrder`, `deadline`
    - `transactionsTitle`, `noTransactions`, `noTransactionsHint`, `addTransaction`
    - `notFound`, `notFoundDescription`, `backToWorkOrders`
  - [x] Add matching keys to `src/i18n/he.json` with Hebrew translations
  - [x] Do NOT modify existing keys in other namespaces (workOrders, transactions, nutritionLabel)

- [x] Task 4: Replace Tests (AC: all)
  - [x] Replace placeholder `src/features/work-orders/WorkOrderDetailPage.test.tsx` with comprehensive tests
  - [x] Tests:
    - Renders project header with client name, description, deadline
    - Renders StatusStepper with current status
    - Renders NutritionLabel component
    - Renders transaction list sorted by date (newest first)
    - Shows transaction details: vendor name, formatted amount, category badge
    - Shows empty transactions state when no transactions linked
    - Shows "Add Transaction" button
    - Opens TransactionForm with pre-selected Work Order when "Add Transaction" clicked
    - Shows not-found error state for invalid Work Order ID
    - Shows back navigation link
    - Opens edit form when Edit button clicked
    - Shows loading skeleton while data loads
    - Hides deadline display when deadline is null

- [x] Task 5: Build Verification (AC: all)
  - [x] `tsc --noEmit` — zero TypeScript errors
  - [x] `npm run lint` — zero warnings
  - [x] `npm run test` — all tests pass (468 existing + 17 new + 1 updated = 486, zero regressions)
  - [x] `npm run build` — succeeds

## Dev Notes

### Architecture Compliance

- **SCSS Modules only**: All component styling via `*.module.scss`. Tokens and mixins are auto-imported via Vite `additionalData` — use `$gold`, `$bg-tertiary`, `$success`, `$warning`, `$error`, `$text-primary`, `$text-secondary`, `$text-muted`, `@include card-surface`, `@include focus-ring`, `@include interactive-reset`, etc. directly in `.module.scss` files without explicit `@use` statements. [Source: architecture.md#Implementation-Patterns]
- **CSS Logical Properties ONLY**: NEVER use `left`/`right`/`text-align: left`. Use `inline-start`/`inline-end`, `margin-inline`, `padding-inline`, `text-align: start`. All components must work in both RTL and LTR. [Source: architecture.md#Enforcement-Guidelines]
- **Path aliases**: `@/` prefix for all imports. Import from `@/components`, `@/lib`, `@/stores`, `@/types`, etc. [Source: architecture.md#Structure-Patterns]
- **Barrel exports**: Every directory exports through `index.ts`. Consumers import from the directory, not individual files. `import { Button, Card, Badge, Skeleton } from '@/components'` — NOT from individual files. [Source: architecture.md#Structure-Patterns]
- **Co-located tests**: `*.test.tsx` next to the component file, NOT in `__tests__/`. [Source: architecture.md#Structure-Patterns]
- **Naming conventions**: Components PascalCase, SCSS modules PascalCase, SCSS class names camelCase, hooks `use` prefix, utility functions camelCase, types PascalCase no `I` prefix, constants UPPER_SNAKE_CASE. [Source: architecture.md#Naming-Patterns]
- **Feature module boundaries**: Features in `src/features/` are self-contained. Features import from `@/components`, `@/stores`, `@/lib`, `@/types`. Features NEVER import from other features directly. [Source: architecture.md#Architectural-Boundaries]
- **Data flow**: Firestore document → Zod schema parse → TypeScript type → Zustand store → React component. Never access Firestore directly from components. [Source: architecture.md#Data-Flow-Patterns]
- **Currency**: All math happens in agora/cents. Formatting to display happens at the component level via `formatCurrency()`. NEVER do raw arithmetic on display amounts. [Source: architecture.md#Data-Flow-Patterns]
- **No white (#fff) text**: All text uses gold scale tokens (`$text-primary`, `$text-secondary`, `$text-muted`). [Source: architecture.md#Naming-Patterns]
- **Phosphor Icons**: `@phosphor-icons/react` v2.1.10. Use for icons. [Source: architecture.md#Implementation-Patterns]

### Critical Technical Constraints

- **Packages already installed** (DO NOT run npm install):
  - `react@^19.2.0`, `react-dom@^19.2.0`
  - `react-router@^7` — routes already registered, `useParams`, `useNavigate` available
  - `firebase@^12.9.0` — Firestore, Auth
  - `zustand@^5.0.11` — client-side state management
  - `zod@^4.3.6` — schema validation
  - `react-hook-form@^7.71.1` + `@hookform/resolvers@^5.2.2` — form handling
  - `@phosphor-icons/react@^2.1.10` — icon library
  - `i18next@^25.8.4`, `react-i18next@^16.5.4` — i18n
  - `sass@^1.87.0` — SCSS compilation

- **NO NEW npm dependencies needed** — everything required for Story 2.5 is already installed.

- **Existing files to REPLACE (overwrite placeholder content):**
  - `src/features/work-orders/WorkOrderDetailPage.tsx` — replace placeholder with full implementation
  - `src/features/work-orders/WorkOrderDetailPage.module.scss` — replace placeholder styles with full styles
  - `src/features/work-orders/WorkOrderDetailPage.test.tsx` — replace placeholder tests with comprehensive tests
  - `src/i18n/en.json` — replace `pages.workOrderDetail` placeholder keys, add `workOrderDetail` namespace
  - `src/i18n/he.json` — replace `pages.workOrderDetail` placeholder keys, add `workOrderDetail` namespace

- **Files NOT to modify:**
  - `src/router.tsx` — route `work-orders/:id` already registered with `WorkOrderDetailPage`
  - `src/features/work-orders/index.ts` — already exports `WorkOrderDetailPage`
  - `src/features/work-orders/components/*` — NutritionLabel, StatusStepper, TransactionForm, WorkOrderForm are all complete
  - `src/features/work-orders/hooks/*` — all hooks are complete (useWorkOrders, useTransactions, useWorkOrderActions, useTransactionActions)
  - `src/stores/*` — Zustand stores are complete with selectors
  - `src/types/*` — WorkOrder and Transaction types are complete
  - `src/lib/*` — currency, margins, dates utilities are complete
  - `src/components/*` — Button, Card, Badge, StatusBadge, Skeleton, Input, Select all complete

- **SCSS auto-import**: `_variables.scss` and `_mixins.scss` are auto-imported via Vite `additionalData` into every `.module.scss` file. All tokens and mixins are available without `@use` statements.

- **Test infrastructure**: Vitest + React Testing Library. CSS module mocks and react-i18next mocks already configured globally. Use `await import()` for components with Phosphor icons to avoid jsdom hangs. Use `MemoryRouter` wrapping for route-aware component tests. 468 tests currently passing.

### WorkOrderDetailPage Component Design

```typescript
// src/features/work-orders/WorkOrderDetailPage.tsx

// Imports pattern — follow WorkOrdersPage.tsx exactly
import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, PencilSimple, Plus, Receipt, WarningCircle } from '@phosphor-icons/react';
import { Button, Card, Badge, Skeleton } from '@/components';
import { useWorkOrders, useWorkOrderActions, useTransactions, useTransactionActions } from './hooks';
import { StatusStepper, NutritionLabel, TransactionForm, WorkOrderForm } from './components';
import { formatCurrency } from '@/lib';
import { useWorkOrderStore, selectWorkOrderById } from '@/stores';
import { useTransactionStore, selectByWorkOrder } from '@/stores';
import type { WorkOrderStatus, CreateWorkOrderInput, CreateTransactionInput } from '@/types';
import styles from './WorkOrderDetailPage.module.scss';
```

**Component Structure:**
```
┌────────────────────────────────────────────────────────────┐
│ ← Back to Work Orders                                      │
│                                                            │
│ ┌────────────────────────────────────────────────────────┐ │
│ │  HEADER                                                │ │
│ │  Client Name (gold, xl)              [Edit] button     │ │
│ │  Project description (base, text-primary)              │ │
│ │  📅 DD/MM/YYYY (sm, text-muted)                       │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                            │
│ ┌────────────────────────────────────────────────────────┐ │
│ │  STATUS STEPPER                                        │ │
│ │  ● Lead → ● Design → ◉ Production → ○ Shipped         │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                            │
│ ┌────────────────────────────────────────────────────────┐ │
│ │  📊 NUTRITION LABEL                                    │ │
│ │  Revenue                      ₪15,000.00               │ │
│ │  ─────────────────────────────────                     │ │
│ │  ▸ Direct Costs               ₪5,000.00               │ │
│ │  ▸ Inventory Costs                ₪0.00               │ │
│ │    Overhead Allocation        ₪1,000.00               │ │
│ │  ─────────────────────────────────                     │ │
│ │  Total Costs                  ₪6,000.00               │ │
│ │  Buffer (5%)                    ₪300.00               │ │
│ │  ─────────────────────────────────                     │ │
│ │  Net Profit                   ₪8,700.00               │ │
│ │  Margin                        ✅ 58%                  │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                            │
│ ┌────────────────────────────────────────────────────────┐ │
│ │  TRANSACTIONS         [+ Add Transaction]              │ │
│ │                                                        │ │
│ │  07/02/2026  Supplier A   ₪2,000.00   DirectCost      │ │
│ │  05/02/2026  Vendor B     ₪1,500.00   Revenue         │ │
│ │  03/02/2026  Material Co  ₪1,500.00   DirectCost      │ │
│ └────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

**Data access pattern:**
```typescript
// In the component:
export function WorkOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  // Hooks subscribe to Firestore — data flows into Zustand stores
  const { loading: woLoading, error: woError } = useWorkOrders();
  const { transactions, loading: txnLoading } = useTransactions();

  // Select specific WO and its transactions from stores
  const workOrder = useWorkOrderStore(selectWorkOrderById(id ?? ''));
  const woTransactions = useTransactionStore(selectByWorkOrder(id ?? ''));

  // Actions
  const { updateWorkOrder } = useWorkOrderActions();
  const { createTransaction } = useTransactionActions();

  // Local state
  const [showEditForm, setShowEditForm] = useState(false);
  const [showTransactionForm, setShowTransactionForm] = useState(false);

  // Sort transactions newest first
  const sortedTransactions = useMemo(
    () => [...woTransactions].sort((a, b) => b.date.getTime() - a.date.getTime()),
    [woTransactions],
  );

  const isLoading = woLoading || txnLoading;

  // Not found: show after loading completes and WO not in store
  if (!isLoading && !workOrder && !woError) {
    return <NotFoundState />;
  }

  // ...render full detail page
}
```

**Transaction category → Badge color mapping:**
```typescript
const CATEGORY_BADGE_COLOR: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
  DirectCost: 'error',
  Revenue: 'success',
  InventoryRestock: 'warning',
  Overhead: 'info',
  Personal: 'default',
};
```

**Status change handler (same pattern as WorkOrdersPage):**
```typescript
const handleStatusChange = async (newStatus: WorkOrderStatus) => {
  if (!workOrder) return;
  try {
    await updateWorkOrder(
      workOrder.id,
      { status: newStatus },
      t('workOrders.toast.statusChanged', { status: t(`workOrders.status.${newStatus}`) }),
    );
  } catch {
    // Error toast already shown by useWorkOrderActions
  }
};
```

**Edit handler:**
```typescript
const handleEdit = async (data: CreateWorkOrderInput) => {
  if (!workOrder) return;
  try {
    await updateWorkOrder(workOrder.id, data);
    setShowEditForm(false);
  } catch {
    // Error toast already shown
  }
};
```

**Transaction creation handler:**
```typescript
const handleCreateTransaction = async (data: CreateTransactionInput) => {
  try {
    await createTransaction(data);
    setShowTransactionForm(false);
  } catch {
    // Error toast already shown
  }
};
```

**Date display format:**
```typescript
// For deadline display (DD/MM/YYYY format per AC):
workOrder.deadline?.toLocaleDateString(i18n.language, {
  day: '2-digit', month: '2-digit', year: 'numeric'
})

// For transaction dates in the list:
txn.date.toLocaleDateString(i18n.language)
```

### WorkOrderDetailPage SCSS Design

```scss
// src/features/work-orders/WorkOrderDetailPage.module.scss

.page {
  display: flex;
  flex-direction: column;
  gap: $space-lg;
  max-inline-size: 800px;
  margin-inline: auto;
  padding: $space-lg;
}

// Back navigation
.backNav {
  @include interactive-reset;
  display: inline-flex;
  align-items: center;
  gap: $space-xs;
  color: $text-secondary;
  font-size: $text-sm;
  padding: $space-xs $space-sm;
  border-radius: $radius-sm;
  min-block-size: 44px; // Touch target
  transition: color $transition-fast;

  &:hover {
    color: $gold;
  }
}

// Header section
.headerSection {
  @include card-surface;
  padding: $space-md;
}

.headerTop {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: $space-md;
}

.headerInfo {
  flex: 1;
  min-inline-size: 0;
}

.clientName {
  font-size: $text-xl;
  font-weight: $font-semibold;
  color: $gold;
  margin: 0 0 $space-xs;
}

.description {
  font-size: $text-base;
  color: $text-primary;
  margin: 0 0 $space-xs;
}

.deadline {
  font-size: $text-sm;
  color: $text-muted;
  display: flex;
  align-items: center;
  gap: $space-xs;
}

// Transactions section
.transactionsSection {
  @include card-surface;
  padding: $space-md;
}

.transactionsHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-block-end: $space-md;
}

.transactionsTitle {
  font-size: $text-lg;
  font-weight: $font-semibold;
  color: $text-primary;
  margin: 0;
}

.transactionsList {
  list-style: none;
  padding: 0;
  margin: 0;
}

.transactionRow {
  display: flex;
  align-items: center;
  gap: $space-md;
  padding-block: $space-sm;
  border-block-end: 1px solid $border-subtle;

  &:last-child {
    border-block-end: none;
  }
}

.transactionDate {
  font-size: $text-sm;
  color: $text-muted;
  white-space: nowrap;
  min-inline-size: 80px;
}

.transactionVendor {
  flex: 1;
  font-size: $text-sm;
  color: $text-primary;
  @include truncate;
}

.transactionAmount {
  font-size: $text-sm;
  font-weight: $font-medium;
  color: $text-primary;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.transactionBadge {
  flex-shrink: 0;
}

// Empty state
.emptyTransactions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-sm;
  padding: $space-xl;
  text-align: center;
}

.emptyText {
  font-size: $text-base;
  color: $text-muted;
  margin: 0;
}

.emptyHint {
  font-size: $text-sm;
  color: $text-muted;
  margin: 0;
}

// Error / Not Found state
.errorState {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-md;
  padding: $space-2xl $space-lg;
  text-align: center;
}

.errorIcon {
  color: $error;
}

.errorTitle {
  font-size: $text-lg;
  font-weight: $font-semibold;
  color: $text-primary;
  margin: 0;
}

.errorDescription {
  font-size: $text-base;
  color: $text-muted;
  margin: 0;
}

.errorLink {
  @include interactive-reset;
  color: $gold;
  font-size: $text-sm;
  text-decoration: underline;
  min-block-size: 44px;
  display: inline-flex;
  align-items: center;

  &:hover {
    color: $gold-light;
  }
}

// Loading skeleton
.skeletonPage {
  display: flex;
  flex-direction: column;
  gap: $space-lg;
}

.skeletonHeader {
  @include card-surface;
  padding: $space-md;
}

.skeletonTransactions {
  @include card-surface;
  padding: $space-md;
}

// Form section
.formSection {
  @include card-surface;
  padding: $space-md;
}

// Mobile responsive
@media (max-width: $bp-sm) {
  .page {
    padding: $space-md;
    gap: $space-md;
  }

  .headerTop {
    flex-direction: column;
  }

  .transactionRow {
    flex-wrap: wrap;
    gap: $space-xs;
  }

  .transactionDate {
    min-inline-size: auto;
  }

  .transactionBadge {
    inline-size: 100%;
    margin-block-start: $space-xs;
  }
}
```

**Key SCSS patterns:**
- Uses `@include card-surface` for section containers (consistent with NutritionLabel)
- Uses `@include interactive-reset` for clickable non-button elements
- Uses `@include truncate` for long vendor names
- All logical properties — no `left`/`right`
- `font-variant-numeric: tabular-nums` for aligned amounts
- Touch targets ≥ 44px for interactive elements
- `$transition-fast` for hover effects
- Mobile: wraps transaction rows, stacks header

### i18n Keys to Add

**English (`src/i18n/en.json`) — update `pages.workOrderDetail` and add `workOrderDetail` namespace:**

Replace existing `pages.workOrderDetail`:
```json
{
  "pages": {
    "workOrderDetail": {
      "title": "Work Order Detail"
    }
  }
}
```

Add new `workOrderDetail` namespace (top-level, alongside `workOrders`, `transactions`, `nutritionLabel`):
```json
{
  "workOrderDetail": {
    "backToList": "Work Orders",
    "editWorkOrder": "Edit Work Order",
    "deadline": "Deadline: {{date}}",
    "transactionsTitle": "Transactions",
    "noTransactions": "No costs or revenue tracked yet",
    "noTransactionsHint": "Add transactions manually to track your project finances",
    "addTransaction": "Add Transaction",
    "notFound": "Work Order not found",
    "notFoundDescription": "The Work Order you're looking for doesn't exist or may have been removed.",
    "backToWorkOrders": "Back to Work Orders"
  }
}
```

**Hebrew (`src/i18n/he.json`) — matching structure:**

Replace existing `pages.workOrderDetail`:
```json
{
  "pages": {
    "workOrderDetail": {
      "title": "פרטי הזמנת עבודה"
    }
  }
}
```

Add new `workOrderDetail` namespace:
```json
{
  "workOrderDetail": {
    "backToList": "הזמנות עבודה",
    "editWorkOrder": "ערוך הזמנת עבודה",
    "deadline": "תאריך יעד: {{date}}",
    "transactionsTitle": "תנועות",
    "noTransactions": "אין עלויות או הכנסות שנרשמו עדיין",
    "noTransactionsHint": "הוסף תנועות ידנית כדי לעקוב אחר הכספים של הפרויקט",
    "addTransaction": "הוסף תנועה",
    "notFound": "הזמנת עבודה לא נמצאה",
    "notFoundDescription": "הזמנת העבודה שחיפשת לא קיימת או שהוסרה.",
    "backToWorkOrders": "חזרה להזמנות עבודה"
  }
}
```

**Note**: Remove the `placeholder` key from `pages.workOrderDetail` since it's no longer a placeholder page. Do NOT modify existing keys in `workOrders`, `transactions`, or `nutritionLabel` namespaces.

### Previous Story Intelligence (Story 2.4)

**Key patterns established:**
- `NutritionLabel` component is a pure display component: receives `workOrder: WorkOrder`, `transactions: Transaction[]`, `loading?: boolean` — renders full financial breakdown
- `NutritionLabelProps` exported from `src/features/work-orders/components/index.ts`
- `calculateMargin`, `calculateBuffer`, `getMarginStatus`, `BUFFER_PERCENTAGE` all in `src/lib/margins.ts`
- `formatCurrency(amountAgora, currency?)` for all amount display
- `@include card-surface` for card-like containers
- CSS logical properties throughout
- Phosphor Icons: `CaretRight`, `CheckCircle`, `WarningCircle`, `ChartBar` already used
- Shimmer pattern via `shimmer` keyframe for loading states

**Critical learnings from Stories 2.1-2.4:**
- Zod 4 `.default()` creates input/output type divergence with `zodResolver` — DO NOT use `.default()` on form schemas
- SCSS variable is `$bp-sm` not `$breakpoint-sm` — use `$bp-sm` for breakpoint media queries
- SCSS tokens: use `$text-lg` not `$font-size-lg`, use `$font-semibold` not `$font-weight-semibold`
- `$space-2xs` does NOT exist — use `$space-xs` (4px) as smallest spacing token
- `$radius-xs` does NOT exist — use `2px` literal for small border-radius values
- Phosphor icon dynamic imports in jsdom cause slow module loading — use `beforeAll` with 30s timeout
- `await import()` pattern for Phosphor icon imports in tests
- `src/__mocks__/react-i18next.ts` mock returns translation key as string (with `|key=value` for interpolation params)
- `src/__mocks__/css-module.ts` provides Proxy-based CSS module mock
- `MemoryRouter` wrapping for route-aware tests
- 468 tests currently passing

**Story 2.4 completion notes:**
- NutritionLabel component complete with all financial lines, expandable sections, shimmer loading, margin bar
- `calculateMargin` extended with backward-compatible `bufferAgora = 0` third parameter
- `BUFFER_PERCENTAGE = 0.05` and `calculateBuffer` utility added
- 468 tests passing (441 existing + 27 new)

### Git Intelligence

**Recent commits (most recent first):**
- `1de4d30` — Implement Story 2.4: Nutrition Label & Margin Calculations with code review fixes
- `26bc9de` — Implement Story 2.3: Manual Transaction Entry & Cost/Revenue Linkage with code review fixes
- `5691072` — Implement Story 2.2: Work Order Status Lifecycle & List View with code review fixes
- `c05296d` — Implement Story 2.1: Work Order Data Model & CRUD with code review fixes
- `c3f5157` — Implement Story 1.6: Core Shared UI Components & Currency Utilities with code review fixes

**Story 2.4 changes (10 files):**
- Created NutritionLabel component, SCSS styles, tests
- Extended margin utilities with buffer support
- Added i18n keys for nutrition label
- 468 tests passing

**Established code patterns:**
- Single comprehensive commit per story
- Components use Phosphor Icons (imported at top level)
- Inline helper components within page files (WorkOrderCard is inside WorkOrdersPage.tsx)
- `useMemo` for derived data
- `@include card-surface` mixin for card-like containers
- All amounts formatted with `formatCurrency()`
- Tests use `beforeAll` with dynamic `await import()` for Phosphor icon modules
- CSS logical properties throughout
- `MemoryRouter` + `Routes` + `Route` pattern for testing routed components
- Error toast handling: `try/catch` with empty catch blocks (toasts shown by action hooks)

### Potential Pitfalls to Avoid

1. **DO NOT install any npm packages** — everything needed is already installed.

2. **DO NOT modify any component files** — NutritionLabel, StatusStepper, TransactionForm, WorkOrderForm are all complete and tested. Use them as-is via their existing props interfaces.

3. **DO NOT modify any hook files** — useWorkOrders, useTransactions, useWorkOrderActions, useTransactionActions are all complete. The Firestore subscriptions are already active when you call the hooks.

4. **DO NOT modify Zustand stores** — the stores and selectors (`selectWorkOrderById`, `selectByWorkOrder`) already exist and work correctly.

5. **DO NOT modify the router** — the route `work-orders/:id` is already registered with `WorkOrderDetailPage` in `src/router.tsx`.

6. **DO NOT modify the feature barrel export** — `src/features/work-orders/index.ts` already exports `WorkOrderDetailPage`.

7. **TransactionForm has `defaultWorkOrderId` prop** — use it! The `TransactionForm` component already accepts `defaultWorkOrderId?: string` which pre-selects the Work Order in the dropdown. Pass the current WO's `id` when opening the form from the detail page.

8. **Use the correct store access pattern** — The selector pattern for Zustand is:
   ```typescript
   const workOrder = useWorkOrderStore(selectWorkOrderById(id ?? ''));
   const woTransactions = useTransactionStore(selectByWorkOrder(id ?? ''));
   ```
   These selectors return `undefined` / `[]` respectively when no match is found.

9. **Do NOT use `useParams` with a generic incorrectly** — The correct pattern is `useParams<{ id: string }>()` which gives `id: string | undefined`.

10. **Handle the loading → not-found transition correctly** — The WO may not be in the store yet while loading. Only show the not-found state when `!isLoading && !workOrder`. During loading, show the skeleton. Otherwise, you'll flash a not-found state on initial render.

11. **DO NOT use `left`/`right` in CSS** — use CSS logical properties only.

12. **DO NOT use `@use` in `.module.scss` files** — tokens and mixins are auto-imported via Vite.

13. **DO NOT use `$space-2xs` or `$radius-xs`** — they don't exist. Smallest spacing is `$space-xs` (4px). Smallest radius is `$radius-sm` (8px) or use `2px`/`3px` literal.

14. **BE CAREFUL with Phosphor icon imports in tests** — Use `await import()` pattern for the component and mock `@phosphor-icons/react` with `vi.mock`. Follow the exact pattern from the existing placeholder test.

15. **Test i18n mock behavior** — The global mock returns the translation key as the rendered text. For keys with interpolation like `t('workOrderDetail.deadline', { date: '...' })`, the mock outputs `workOrderDetail.deadline|date=...`. Write test assertions accordingly.

16. **StatusStepper's `onStatusChange` must call `updateWorkOrder` with the toast message** — Follow the exact pattern from `WorkOrdersPage.tsx`:
    ```typescript
    await updateWorkOrder(
      workOrder.id,
      { status: newStatus },
      t('workOrders.toast.statusChanged', { status: t(`workOrders.status.${newStatus}`) }),
    );
    ```

17. **Transaction badge colors** — Map transaction categories to Badge colors: `DirectCost → 'error'`, `Revenue → 'success'`, `InventoryRestock → 'warning'`, `Overhead → 'info'`, `Personal → 'default'`. Use the `Badge` component from `@/components` with `color` prop.

18. **Existing `pages.workOrderDetail.placeholder` key must be REMOVED** — The i18n test at `src/i18n/config.test.ts` line 88-92 tests the placeholder interpolation. This test will need updating or the placeholder key needs to stay alongside new keys. Check the test before modifying i18n keys.

19. **DO NOT create duplicate scroll-to-top behavior** — React Router already handles navigation. The browser back button naturally restores scroll position for same-session navigation.

### Cross-Story Context (Epic 2)

This is the **fifth and final story in Epic 2** — it creates the Work Order Detail Page that brings together all previous components:

- **Story 2.1** (DONE) created the Work Order data model, CRUD operations, basic list view, and form. WorkOrder type, Zustand store, Firestore hooks.
- **Story 2.2** (DONE) enhanced the list view with StatusStepper, margin utilities, icon card layout, sorting. Margin calculations show simplified margin without buffer.
- **Story 2.3** (DONE) created the transaction infrastructure — Transaction type, store, hooks, manual entry form, cost/revenue linkage with atomic Firestore batch writes.
- **Story 2.4** (DONE) created the NutritionLabel component with expandable cost breakdown, 5% buffer calculation, shimmer loading state, and extended margin utilities with buffer support.
- **This story (2.5)** is the culmination — the Work Order Detail Page assembles: header, StatusStepper, NutritionLabel, transaction list, and transaction creation into one cohesive detail view at `/work-orders/:id`.

**After this story, Epic 2 is functionally complete** — Gal can create Work Orders, track status, enter transactions, see financial breakdowns, and drill into any project's full financial picture.

### Existing Components Reference

**StatusStepper** (`src/features/work-orders/components/StatusStepper.tsx`):
```typescript
interface StatusStepperProps {
  currentStatus: WorkOrderStatus;
  onStatusChange: (newStatus: WorkOrderStatus) => void;
  disabled?: boolean;
}
```

**NutritionLabel** (`src/features/work-orders/components/NutritionLabel.tsx`):
```typescript
interface NutritionLabelProps {
  workOrder: WorkOrder;
  transactions: Transaction[];
  loading?: boolean;
}
```

**TransactionForm** (`src/features/work-orders/components/TransactionForm.tsx`):
```typescript
interface TransactionFormProps {
  onSubmit: (data: CreateTransactionInput) => Promise<void>;
  onCancel: () => void;
  defaultWorkOrderId?: string;  // ← USE THIS to pre-select the WO
}
```

**WorkOrderForm** (`src/features/work-orders/components/WorkOrderForm.tsx`):
```typescript
interface WorkOrderFormProps {
  onSubmit: (data: CreateWorkOrderInput) => Promise<void>;
  onCancel: () => void;
  isEdit?: boolean;
  defaultValues?: CreateWorkOrderInput;
}
```

**Badge** (`src/components/Badge/Badge.tsx`):
```typescript
interface BadgeProps {
  label: string;
  color: 'success' | 'warning' | 'error' | 'info' | 'default';
  className?: string;
}
```

**Button** (`src/components/Button/Button.tsx`):
```typescript
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  shortcut?: string;
}
```

**Skeleton** (`src/components/Skeleton/Skeleton.tsx`):
```typescript
// Props: width, height, variant ('text' | 'circular' | 'rectangular')
```

**Phosphor Icons for this story:**
```typescript
import { ArrowLeft, PencilSimple, Plus, Receipt, WarningCircle, CalendarBlank } from '@phosphor-icons/react';
// ArrowLeft → back navigation
// PencilSimple → edit button (same as WorkOrdersPage)
// Plus or Receipt → add transaction button
// WarningCircle → not-found error state (same as WorkOrdersPage)
// CalendarBlank → deadline display (optional)
```

### Project Structure Notes

**Files to REPLACE (overwrite existing placeholder):**

| File | Action | Notes |
|---|---|---|
| `src/features/work-orders/WorkOrderDetailPage.tsx` | REPLACE | Full detail page component |
| `src/features/work-orders/WorkOrderDetailPage.module.scss` | REPLACE | Full page styles |
| `src/features/work-orders/WorkOrderDetailPage.test.tsx` | REPLACE | Comprehensive tests |

**Files to MODIFY:**

| File | Action | Notes |
|---|---|---|
| `src/i18n/en.json` | MODIFY | Replace `pages.workOrderDetail` placeholder, add `workOrderDetail` namespace |
| `src/i18n/he.json` | MODIFY | Replace `pages.workOrderDetail` placeholder, add `workOrderDetail` namespace |

**Files NOT to modify:**
- `src/router.tsx` — route already registered
- `src/features/work-orders/index.ts` — already exports WorkOrderDetailPage
- `src/features/work-orders/components/*` — all components complete
- `src/features/work-orders/hooks/*` — all hooks complete
- `src/stores/*` — stores and selectors complete
- `src/types/*` — types complete
- `src/lib/*` — utilities complete
- `src/components/*` — shared components complete

### Test Design Notes

The test file should mock:
```typescript
vi.mock('@phosphor-icons/react', () => ({
  ArrowLeft: ({ className }: { size?: number; className?: string }) => (
    <svg data-testid="icon-ArrowLeft" className={className} />
  ),
  PencilSimple: ({ className }: { size?: number; className?: string }) => (
    <svg data-testid="icon-PencilSimple" className={className} />
  ),
  // ... etc for each icon used
  WarningCircle: ({ className }: { size?: number; className?: string }) => (
    <svg data-testid="icon-WarningCircle" className={className} />
  ),
  Receipt: ({ className }: { size?: number; className?: string }) => (
    <svg data-testid="icon-Receipt" className={className} />
  ),
  Plus: ({ className }: { size?: number; className?: string }) => (
    <svg data-testid="icon-Plus" className={className} />
  ),
  // Icons used by child components (StatusStepper, NutritionLabel) — must also be mocked
  CheckCircle: ({ className }: { size?: number; weight?: string }) => (
    <svg data-testid="icon-CheckCircle" className={className} />
  ),
  Circle: ({ className }: { size?: number; weight?: string }) => (
    <svg data-testid="icon-Circle" className={className} />
  ),
  CaretRight: ({ className }: { size?: number; weight?: string }) => (
    <svg data-testid="icon-CaretRight" className={className} />
  ),
  ChartBar: ({ className }: { size?: number; weight?: string }) => (
    <svg data-testid="icon-ChartBar" className={className} />
  ),
  CalendarBlank: ({ className }: { size?: number; className?: string }) => (
    <svg data-testid="icon-CalendarBlank" className={className} />
  ),
}));
```

Mock stores:
```typescript
vi.mock('@/stores', () => ({
  useWorkOrderStore: vi.fn(),
  selectWorkOrderById: vi.fn((id: string) => vi.fn()),
  useTransactionStore: vi.fn(),
  selectByWorkOrder: vi.fn((id: string) => vi.fn()),
}));
```

Mock hooks:
```typescript
vi.mock('./hooks', () => ({
  useWorkOrders: vi.fn(() => ({ workOrders: [], loading: false, error: null })),
  useWorkOrderActions: vi.fn(() => ({ createWorkOrder: vi.fn(), updateWorkOrder: vi.fn() })),
  useTransactions: vi.fn(() => ({ transactions: [], loading: false, error: null })),
  useTransactionActions: vi.fn(() => ({ createTransaction: vi.fn() })),
}));
```

Use `MemoryRouter` with initial entries for route params:
```typescript
render(
  <MemoryRouter initialEntries={['/work-orders/wo-123']}>
    <Routes>
      <Route path="/work-orders/:id" element={<WorkOrderDetailPage />} />
    </Routes>
  </MemoryRouter>,
);
```

**Important**: The existing i18n config test at `src/i18n/config.test.ts` (line 88-92) tests the `pages.workOrderDetail.placeholder` key with interpolation. Since we're removing the `placeholder` key, check if this test needs updating. If so, update the assertion to use the new `pages.workOrderDetail.title` key (no interpolation needed).

### References

- [Source: planning-artifacts/epics.md#Story-2.5] — Full acceptance criteria with BDD format
- [Source: planning-artifacts/epics.md#Epic-2] — Epic context and story sequence
- [Source: planning-artifacts/architecture.md#Frontend-Architecture] — Component architecture, state management
- [Source: planning-artifacts/architecture.md#Implementation-Patterns] — Naming, structure, data flow
- [Source: planning-artifacts/architecture.md#Enforcement-Guidelines] — CSS logical properties, co-located tests
- [Source: planning-artifacts/architecture.md#Project-Structure] — Full directory tree
- [Source: planning-artifacts/ux-design-specification.md#Navigation-Patterns] — Breadcrumb/back navigation, SPA routing
- [Source: planning-artifacts/ux-design-specification.md#Responsive-Patterns] — Desktop/tablet/mobile layouts
- [Source: implementation-artifacts/2-4-nutrition-label-margin-calculations.md] — Previous story patterns, NutritionLabel interface, SCSS token learnings, debug learnings
- [Source: implementation-artifacts/2-3-manual-transaction-entry-cost-revenue-linkage.md] — TransactionForm interface with defaultWorkOrderId, transaction types, currency utilities
- [Source: implementation-artifacts/2-2-work-order-status-lifecycle-list-view.md] — StatusStepper interface, margin utility patterns, WorkOrderCard layout
- [Source: implementation-artifacts/2-1-work-order-data-model-crud.md] — WorkOrder type, Zustand store, Firestore hooks, WorkOrderForm interface

## Dev Agent Record

### Agent Model Used

Claude claude-4.6-opus-high-thinking (Cursor Agent)

### Debug Log References

- Discovered React 19 + Zustand v5 `useSyncExternalStore` infinite loop when using both `useWorkOrderStore()` (via hook mock) and `useWorkOrderStore(selector)` in the same component. The `.filter()` selector creates new array references on every call, which `Object.is` comparison detects as changed, causing forced re-renders. **Fix**: Derived WO and transactions from hook return values via `useMemo` instead of direct store selectors, following the existing `WorkOrdersPage` pattern. This avoids dual Zustand subscriptions in the same component.

### Completion Notes List

- **Task 1**: Replaced placeholder `WorkOrderDetailPage.tsx` with full implementation. Component renders: back navigation, project header (client name, description, deadline with `CalendarBlank` icon, edit button), `StatusStepper`, `NutritionLabel`, transactions list with category badges, empty/loading/not-found states. Data derived from hook return values via `useMemo` to avoid React 19 + Zustand v5 subscription conflicts.
- **Task 2**: Replaced placeholder SCSS with full styles. All CSS logical properties, `@include card-surface` for sections, `@include interactive-reset` for clickable elements, `@include truncate` for vendor names, `font-variant-numeric: tabular-nums` for amounts, mobile-responsive with `$bp-sm` breakpoint, touch targets >= 44px.
- **Task 3**: Removed `pages.workOrderDetail.placeholder` key, kept `pages.workOrderDetail.title`. Added `workOrderDetail` top-level namespace with 10 keys (backToList, editWorkOrder, deadline, transactionsTitle, noTransactions, noTransactionsHint, addTransaction, notFound, notFoundDescription, backToWorkOrders) in both en.json and he.json. Updated i18n config test to use new `workOrderDetail.deadline` interpolation test instead of removed `placeholder` key.
- **Task 4**: 16 comprehensive tests covering all ACs: project header rendering, deadline visibility, edit form, StatusStepper integration, NutritionLabel rendering, transaction list sorting, transaction details, filtering by WO, empty state, add transaction button/form, not-found state, back navigation, loading skeleton, loading-vs-not-found priority. Uses same mock pattern as WorkOrdersPage test (hooks return real store state).
- **Task 5**: All verification gates pass. `tsc --noEmit` clean, `npm run lint` clean (fixed unused `Card` import), 485 tests pass (468 + 16 new + 1 updated), `npm run build` succeeds.

### Change Log

- 2026-02-07: Implemented Story 2.5 — Work Order Detail Page with all ACs satisfied, 16 new tests, 485 total tests passing
- 2026-02-07: Code review fixes — Fixed variable shadowing (`t` → `txn` in filter callback), converted CSS margin shorthand to logical properties, added StatusStepper disabled state during async status update, added StatusStepper interaction test (17 tests, 486 total passing), documented sprint-status.yaml in File List

### File List

**Replaced (overwritten placeholder content):**
- `src/features/work-orders/WorkOrderDetailPage.tsx` — Full detail page component
- `src/features/work-orders/WorkOrderDetailPage.module.scss` — Full page styles
- `src/features/work-orders/WorkOrderDetailPage.test.tsx` — 16 comprehensive tests

**Modified:**
- `src/i18n/en.json` — Removed placeholder key, added `workOrderDetail` namespace (10 keys)
- `src/i18n/he.json` — Removed placeholder key, added `workOrderDetail` namespace (10 keys)
- `src/i18n/config.test.ts` — Updated interpolation test for new `workOrderDetail.deadline` key
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — Updated story 2-5 status
