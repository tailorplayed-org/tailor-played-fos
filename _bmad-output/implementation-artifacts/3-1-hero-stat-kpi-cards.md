# Story 3.1: Hero Stat & KPI Cards

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As **Gal or Ben**,
I want to see the single most important number (Net Profit) front and center, with key financial indicators below it,
So that I can assess the health of the business in under 3 seconds.

## Acceptance Criteria

1. **Hero Stat Block**: Route `/` renders `DashboardPage` with a centered Hero Stat block showing: time-aware greeting line (e.g., "Good morning, Gal"), large Net Profit amount (`$text-2xl`, 40px, `$gold`, Fredoka 600 weight), label ("Net Profit — February 2026" using current month/year), and a delta badge showing % change from previous month. Delta badge is green (`$success`) for positive, red (`$error`) for negative, hidden when no previous month data exists.

2. **Net Profit Calculation**: Net Profit = sum of all `approved` Revenue transactions for current month minus sum of all `approved` cost transactions (`DirectCost` + `Overhead`) for current month. All amounts converted to ILS agora via `toIlsAgora()` before summing. Display via `formatCurrency(netProfitAgora, 'ILS')`.

3. **KPI Cards Row**: Below the Hero Stat, 4 KPI cards display in a row (desktop) or horizontal-scrollable row (mobile): **Tax Jar** (₪ amount + "set aside from net profit"), **Active Projects** (count + "in production"), **Monthly Overhead** (₪ amount + delta badge if changed from previous month), **Pending Review** (count + confidence breakdown "X green, Y to check"). Each card: `$bg-tertiary` background, `$space-md` padding, `$radius-md` border radius, `$border-subtle` border.

4. **Tax Jar KPI**: Shows current Tax Jar reserve calculated via `calculateTaxReserve(netProfitAgora, 'flat', 0.35)`. The framing is "set aside" (positive) not "owed" (per emotional design principle). Display via `formatCurrency()`.

5. **Active Projects KPI**: Count of Work Orders with `status === 'Production'`. Subtitle shows "in production". Uses `selectActiveProjects` from `useWorkOrderStore`.

6. **Monthly Overhead KPI**: Sum of all `approved` Overhead-category transactions for current month. Display via `formatCurrency()`. Delta badge shows % change from previous month (green/red).

7. **Pending Review KPI — Interactive**: Count of transactions with `status === 'pending_review'`. Shows breakdown: "X green, Y to check" (green = confidence ≥ 85%, check = confidence < 85%). Card shows warm glow border on hover (`$shadow-glow`). Clicking navigates to `/review`. When count is 0: shows "0" with "All caught up" subtitle, no glow, not clickable.

8. **Mobile Responsive (< 768px)**: Hero Stat amount reduces to 36px (from 40px desktop). KPI cards display in a horizontal scrollable row (swipeable, `overflow-x: auto`, `scroll-snap-type: x mandatory`). All cards touch-friendly with ≥ 44px height.

9. **Skeleton Loading**: While data loads, Hero Stat and KPI cards show skeleton shimmer placeholders matching approximate shape and size of real content. Uses existing `Skeleton` component from `@/components`.

10. **`useDashboardData` Hook**: Custom hook in `src/features/dashboard/hooks/useDashboardData.ts` subscribes to real-time Firestore data via `useWorkOrders()` and `useTransactions()` hooks (already exist in work-orders feature — reuse by importing from hooks barrel). Computes all dashboard metrics via `useMemo`. Returns: `netProfitAgora`, `previousMonthNetProfitAgora`, `taxJarAgora`, `activeProjectCount`, `monthlyOverheadAgora`, `previousMonthOverheadAgora`, `pendingReviewCount`, `pendingGreenCount`, `pendingCheckCount`, `loading`.

11. **`calculateTaxReserve` Utility**: Implement in `src/lib/taxJar.ts` (currently empty stub). Signature: `calculateTaxReserve(netProfitAgora: number, method: 'flat' | 'bracket', flatRate?: number): number`. Flat mode: `Math.round(netProfitAgora * flatRate)` (default 0.35). Bracket mode: Israeli 2025 progressive brackets applied to annual-equivalent amount. Co-located tests.

12. **Time-Aware Greeting**: Greeting changes based on hour: "Good morning" (5-11), "Good afternoon" (12-17), "Good evening" (18-4). User's display name comes from Firebase Auth `user.displayName` (first name extracted). Falls back to "there" if no displayName.

## Tasks / Subtasks

- [x] Task 1: Implement `calculateTaxReserve` in `src/lib/taxJar.ts` (AC: #4, #11)
  - [x] Replace empty stub with full implementation
  - [x] `calculateTaxReserve(netProfitAgora, method, flatRate?)` — flat mode applies rate (default 35%), bracket mode applies Israeli progressive brackets
  - [x] Export from `src/lib/index.ts` (already re-exports `./taxJar`)
  - [x] Co-located test `src/lib/taxJar.test.ts`: flat mode with various amounts, bracket mode with known amounts, zero/negative net profit edge cases

- [x] Task 2: Create `HeroStat` component (AC: #1, #2, #9, #12)
  - [x] Create `src/features/dashboard/components/HeroStat.tsx`
  - [x] Create `src/features/dashboard/components/HeroStat.module.scss`
  - [x] Props: `netProfitAgora: number`, `previousMonthNetProfitAgora: number | null`, `userName: string`, `loading: boolean`
  - [x] Time-aware greeting (morning/afternoon/evening) + user first name
  - [x] Large Net Profit display via `formatCurrency(netProfitAgora, 'ILS')`
  - [x] Label: "Net Profit — {Month} {Year}" using `Intl.DateTimeFormat`
  - [x] Delta badge: % change from previous month, green (`$success`) or red (`$error`)
  - [x] Skeleton state when `loading` is true
  - [x] Export from `src/features/dashboard/components/index.ts`

- [x] Task 3: Create `KpiCard` component (AC: #3, #9)
  - [x] Create `src/features/dashboard/components/KpiCard.tsx`
  - [x] Create `src/features/dashboard/components/KpiCard.module.scss`
  - [x] Props: `label: string`, `value: string`, `subtitle?: string`, `delta?: { value: number; type: 'positive' | 'negative' }`, `onClick?: () => void`, `glowOnHover?: boolean`, `loading?: boolean`, `icon?: React.ReactNode`
  - [x] Design system density tokens: `$bg-tertiary`, `$space-md` padding, `$radius-md`, `$border-subtle`
  - [x] Large value display (`$text-xl`, `$gold`, `$font-semibold`)
  - [x] Delta badge with green/red coloring and ▲/▼ arrows
  - [x] Clickable variant with `$shadow-glow` on hover
  - [x] Skeleton state when `loading` is true
  - [x] Export from `src/features/dashboard/components/index.ts`

- [x] Task 4: Create `useDashboardData` hook (AC: #2, #4, #5, #6, #7, #10)
  - [x] Create `src/features/dashboard/hooks/useDashboardData.ts`
  - [x] Used SAFER pattern: `useFirestoreCollection` from `@/hooks` with `useWorkOrderStore`/`useTransactionStore` from `@/stores` — respects feature boundaries
  - [x] Hook activates its own Firestore subscriptions via `useFirestoreCollection` — works even when navigating directly to Dashboard
  - [x] Compute via `useMemo`: net profit (current month), previous month net profit, tax jar, active projects count, monthly overhead, previous month overhead, pending review count + breakdown
  - [x] Current month filter: compare transaction `date` to current calendar month (user's local timezone)
  - [x] Export from `src/features/dashboard/hooks/index.ts`

- [x] Task 5: Replace `DashboardPage` component (AC: #1, #3, #7, #8)
  - [x] Replace placeholder `src/features/dashboard/DashboardPage.tsx` with full implementation
  - [x] Replace placeholder `src/features/dashboard/DashboardPage.module.scss` with full styles
  - [x] Compose: HeroStat + KPI cards row (Tax Jar, Active Projects, Monthly Overhead, Pending Review)
  - [x] Pending Review card: `onClick` navigates to `/review` when count > 0
  - [x] Desktop: KPI cards in CSS Grid row (4 columns)
  - [x] Mobile (< 768px): horizontal scroll with `scroll-snap-type: x mandatory`
  - [x] Get user info from `auth.currentUser` via `@/services` (shared infra, avoids feature boundary violation)
  - [x] All text via i18n `t()` function

- [x] Task 6: i18n Translation Keys (AC: all)
  - [x] Add `dashboard` namespace to `src/i18n/en.json` (top-level, alongside `workOrders`, `transactions`)
  - [x] Add matching keys to `src/i18n/he.json` with Hebrew translations
  - [x] Keys: greeting variants, net profit label, kpi labels, delta labels, empty states, pending breakdown

- [x] Task 7: Tests (AC: all)
  - [x] Create `src/lib/taxJar.test.ts` — flat mode, bracket mode, edge cases (15 tests)
  - [x] Create `src/features/dashboard/components/HeroStat.test.tsx` — rendering, greeting, delta badge, loading (13 tests)
  - [x] Create `src/features/dashboard/components/KpiCard.test.tsx` — rendering, variants, click, glow, loading (12 tests)
  - [x] Replace `src/features/dashboard/DashboardPage.test.tsx` — full integration with mocked hooks/stores (10 tests)

- [x] Task 8: Build Verification (AC: all)
  - [x] `tsc --noEmit` — zero TypeScript errors
  - [x] `npm run lint` — zero warnings
  - [x] `npm run test` — 533 tests pass (486 existing + 47 new, zero regressions)
  - [x] `npm run build` — succeeds

## Dev Notes

### Architecture Compliance

- **SCSS Modules only**: All component styling via `*.module.scss`. Tokens and mixins are auto-imported via Vite `additionalData` — use `$gold`, `$bg-tertiary`, `$success`, `$warning`, `$error`, `$text-primary`, `$text-secondary`, `$text-muted`, `@include card-surface`, `@include focus-ring`, `@include interactive-reset`, etc. directly in `.module.scss` files without explicit `@use` statements. [Source: architecture.md#Implementation-Patterns]
- **CSS Logical Properties ONLY**: NEVER use `left`/`right`/`text-align: left`. Use `inline-start`/`inline-end`, `margin-inline`, `padding-inline`, `text-align: start`. All components must work in both RTL and LTR. [Source: architecture.md#Enforcement-Guidelines]
- **Path aliases**: `@/` prefix for all imports. Import from `@/components`, `@/lib`, `@/stores`, `@/types`, etc. [Source: architecture.md#Structure-Patterns]
- **Barrel exports**: Every directory exports through `index.ts`. Consumers import from the directory, not individual files. [Source: architecture.md#Structure-Patterns]
- **Co-located tests**: `*.test.tsx` next to the component file, NOT in `__tests__/`. [Source: architecture.md#Structure-Patterns]
- **Naming conventions**: Components PascalCase, SCSS modules PascalCase, SCSS class names camelCase, hooks `use` prefix, utility functions camelCase, types PascalCase no `I` prefix, constants UPPER_SNAKE_CASE. [Source: architecture.md#Naming-Patterns]
- **Feature module boundaries**: Features in `src/features/` are self-contained. Features import from `@/components`, `@/stores`, `@/lib`, `@/types`. Features NEVER import from other features directly. [Source: architecture.md#Architectural-Boundaries]
- **Data flow**: Firestore document → Zod schema parse → TypeScript type → Zustand store → React component. Never access Firestore directly from components. [Source: architecture.md#Data-Flow-Patterns]
- **Currency**: All math happens in agora/cents. Formatting to display happens at the component level via `formatCurrency()`. NEVER do raw arithmetic on display amounts. [Source: architecture.md#Data-Flow-Patterns]
- **No white (#fff) text**: All text uses gold scale tokens (`$text-primary`, `$text-secondary`, `$text-muted`). [Source: architecture.md#Design-System-Foundation]
- **Phosphor Icons**: `@phosphor-icons/react` v2.1.10. Sole icon source. No emojis in UI. [Source: architecture.md#Implementation-Patterns]

### Critical Technical Constraints

- **Packages already installed** (DO NOT run npm install):
  - `react@^19.2.0`, `react-dom@^19.2.0`
  - `react-router@^7.13.0` — routes already registered, `useNavigate` available
  - `firebase@^12.9.0` — Firestore, Auth
  - `zustand@^5.0.11` — client-side state management
  - `zod@^4.3.6` — schema validation
  - `@phosphor-icons/react@^2.1.10` — icon library
  - `i18next@^25.8.4`, `react-i18next@^16.5.4` — i18n
  - `sass@^1.97.3` — SCSS compilation
  - `vitest@^4.0.18` — test runner

- **NO NEW npm dependencies needed** — everything required for Story 3.1 is already installed.

- **Existing files to REPLACE (overwrite placeholder content):**
  - `src/features/dashboard/DashboardPage.tsx` — replace placeholder with full implementation
  - `src/features/dashboard/DashboardPage.module.scss` — replace placeholder styles with full styles
  - `src/features/dashboard/DashboardPage.test.tsx` — replace placeholder tests with comprehensive tests
  - `src/lib/taxJar.ts` — replace empty stub with full implementation

- **Existing files to MODIFY:**
  - `src/features/dashboard/components/index.ts` — add exports for HeroStat, KpiCard
  - `src/features/dashboard/hooks/index.ts` — add export for useDashboardData
  - `src/i18n/en.json` — add `dashboard` namespace
  - `src/i18n/he.json` — add `dashboard` namespace

- **Files to CREATE:**
  - `src/features/dashboard/components/HeroStat.tsx`
  - `src/features/dashboard/components/HeroStat.module.scss`
  - `src/features/dashboard/components/HeroStat.test.tsx`
  - `src/features/dashboard/components/KpiCard.tsx`
  - `src/features/dashboard/components/KpiCard.module.scss`
  - `src/features/dashboard/components/KpiCard.test.tsx`
  - `src/features/dashboard/hooks/useDashboardData.ts`
  - `src/lib/taxJar.test.ts`

- **Files NOT to modify:**
  - `src/router.tsx` — route `/` already registered with `DashboardPage`
  - `src/features/dashboard/index.ts` — already exports `DashboardPage` and re-exports `./components` and `./hooks`
  - `src/stores/*` — Zustand stores are complete with selectors
  - `src/types/*` — WorkOrder and Transaction types are complete
  - `src/lib/currency.ts` — currency utilities are complete
  - `src/lib/margins.ts` — margin utilities are complete
  - `src/components/*` — Skeleton, Button, Badge, Card all complete
  - `src/hooks/useFirestoreCollection.ts` — generic Firestore listener is complete

- **SCSS auto-import**: `_variables.scss` and `_mixins.scss` are auto-imported via Vite `additionalData` into every `.module.scss` file. All tokens and mixins are available without `@use` statements.

- **Test infrastructure**: Vitest + React Testing Library. CSS module mocks and react-i18next mocks already configured globally. Use `await import()` for components with Phosphor icons to avoid jsdom hangs. 486 tests currently passing.

### Feature Boundary Solution: Dashboard Data Subscriptions

**Problem**: The dashboard needs `work_orders` and `transactions` data, but `useWorkOrders()` and `useTransactions()` hooks live in `src/features/work-orders/hooks/`. Importing them in the dashboard would violate the feature boundary rule ("Features NEVER import from other features directly").

**Solution**: Create `useDashboardData` hook that directly uses the shared infrastructure:
- `useFirestoreCollection` from `@/hooks` (shared hook)
- `useWorkOrderStore` + `useTransactionStore` from `@/stores` (shared stores)
- `workOrderSchema` + `transactionSchema` from `@/types` (shared types)

This follows the same pattern as `useWorkOrders()` and `useTransactions()` but is owned by the dashboard feature. The hook subscribes to both collections and computes all dashboard metrics.

```typescript
// src/features/dashboard/hooks/useDashboardData.ts
import { useMemo } from 'react';
import { useFirestoreCollection } from '@/hooks';
import { useWorkOrderStore, useTransactionStore, selectActiveProjects, selectPendingReview } from '@/stores';
import { workOrderSchema, transactionSchema } from '@/types';
import type { Transaction } from '@/types';
import { formatCurrency, toIlsAgora, calculateTaxReserve } from '@/lib';

export function useDashboardData() {
  // Subscribe to Firestore collections (same pattern as useWorkOrders/useTransactions)
  const woStore = useWorkOrderStore();
  const txnStore = useTransactionStore();

  useFirestoreCollection('work_orders', workOrderSchema, {
    onData: woStore.setWorkOrders,
    onError: woStore.setError,
    onLoading: woStore.setLoading,
  });

  useFirestoreCollection('transactions', transactionSchema, {
    onData: txnStore.setTransactions,
    onError: txnStore.setError,
    onLoading: txnStore.setLoading,
  });

  // Read from stores via selectors
  const workOrders = useWorkOrderStore((s) => s.workOrders);
  const transactions = useTransactionStore((s) => s.transactions);
  const activeProjects = useWorkOrderStore(selectActiveProjects);
  const pendingReview = useTransactionStore(selectPendingReview);
  const woLoading = useWorkOrderStore((s) => s.loading);
  const txnLoading = useTransactionStore((s) => s.loading);

  // Compute dashboard metrics
  const metrics = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const isCurrentMonth = (t: Transaction) =>
      t.date.getMonth() === currentMonth && t.date.getFullYear() === currentYear;
    const isPrevMonth = (t: Transaction) =>
      t.date.getMonth() === prevMonth && t.date.getFullYear() === prevYear;

    const approved = transactions.filter((t) => t.status === 'approved');

    // Net Profit: Revenue - (DirectCost + Overhead) for current month
    const currentMonthApproved = approved.filter(isCurrentMonth);
    const currentRevenue = currentMonthApproved
      .filter((t) => t.category === 'Revenue')
      .reduce((sum, t) => sum + toIlsAgora(t.amountAgora, t.currency), 0);
    const currentCosts = currentMonthApproved
      .filter((t) => t.category === 'DirectCost' || t.category === 'Overhead')
      .reduce((sum, t) => sum + toIlsAgora(t.amountAgora, t.currency), 0);
    const netProfitAgora = currentRevenue - currentCosts;

    // Previous month Net Profit for delta
    const prevMonthApproved = approved.filter(isPrevMonth);
    const prevRevenue = prevMonthApproved
      .filter((t) => t.category === 'Revenue')
      .reduce((sum, t) => sum + toIlsAgora(t.amountAgora, t.currency), 0);
    const prevCosts = prevMonthApproved
      .filter((t) => t.category === 'DirectCost' || t.category === 'Overhead')
      .reduce((sum, t) => sum + toIlsAgora(t.amountAgora, t.currency), 0);
    const prevNetProfitAgora = prevRevenue - prevCosts;
    const hasPreviousMonth = prevMonthApproved.length > 0;

    // Tax Jar — 35% flat rate of net profit (only if positive)
    const taxJarAgora = netProfitAgora > 0 ? calculateTaxReserve(netProfitAgora, 'flat', 0.35) : 0;

    // Monthly Overhead — sum of Overhead category for current month
    const monthlyOverheadAgora = currentMonthApproved
      .filter((t) => t.category === 'Overhead')
      .reduce((sum, t) => sum + toIlsAgora(t.amountAgora, t.currency), 0);
    const prevMonthOverheadAgora = prevMonthApproved
      .filter((t) => t.category === 'Overhead')
      .reduce((sum, t) => sum + toIlsAgora(t.amountAgora, t.currency), 0);

    // Pending Review breakdown
    const pendingGreenCount = pendingReview.filter((t) => (t.aiConfidence ?? 0) >= 85).length;
    const pendingCheckCount = pendingReview.length - pendingGreenCount;

    return {
      netProfitAgora,
      previousMonthNetProfitAgora: hasPreviousMonth ? prevNetProfitAgora : null,
      taxJarAgora,
      activeProjectCount: activeProjects.length,
      monthlyOverheadAgora,
      previousMonthOverheadAgora: hasPreviousMonth ? prevMonthOverheadAgora : null,
      pendingReviewCount: pendingReview.length,
      pendingGreenCount,
      pendingCheckCount,
    };
  }, [transactions, activeProjects, pendingReview]);

  return {
    ...metrics,
    loading: woLoading || txnLoading,
  };
}
```

**CRITICAL**: This hook calls `useWorkOrderStore()` to get setters AND `useWorkOrderStore(selector)` to read data. Story 2.5 discovered that using both patterns in the same component causes React 19 + Zustand v5 infinite loops due to `useSyncExternalStore` reference comparison. **Mitigation**: The `useFirestoreCollection` hook receives stable function references from the store (the setters never change), while the selectors (`selectActiveProjects`, `selectPendingReview`) return new arrays on every call. To avoid issues:
- Pass setters to `useFirestoreCollection` via a stable ref pattern (the hook already uses `callbacksRef`)
- Read store data through selectors in the component that calls `useDashboardData` rather than inside the hook itself

**ALTERNATIVE SAFER PATTERN** — if the dual-subscription issue occurs, derive all metrics from the raw arrays returned by the store instead of using parameterized selectors:
```typescript
const workOrders = useWorkOrderStore((s) => s.workOrders);
const transactions = useTransactionStore((s) => s.transactions);
// Derive activeProjects and pendingReview in useMemo instead of selectors
```

### HeroStat Component Design

```typescript
// src/features/dashboard/components/HeroStat.tsx
interface HeroStatProps {
  netProfitAgora: number;
  previousMonthNetProfitAgora: number | null;
  userName: string;
  loading: boolean;
}
```

**Visual layout:**
```
┌─────────────────────────────────────────────┐
│            Good morning, Gal                 │
│                                              │
│              ₪8,200.00                       │
│                                              │
│      Net Profit — February 2026              │
│           ▲ 14% from January     [green]     │
└─────────────────────────────────────────────┘
```

**Greeting logic:**
```typescript
function getGreeting(t: TFunction): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return t('dashboard.greeting.morning');
  if (hour >= 12 && hour < 18) return t('dashboard.greeting.afternoon');
  return t('dashboard.greeting.evening');
}

function getFirstName(displayName: string | null): string {
  if (!displayName) return '';
  return displayName.split(' ')[0];
}
```

**Delta badge:**
```typescript
function getDelta(current: number, previous: number | null): { value: number; type: 'positive' | 'negative' } | null {
  if (previous === null || previous === 0) return null;
  const change = ((current - previous) / Math.abs(previous)) * 100;
  return {
    value: Math.abs(Math.round(change)),
    type: change >= 0 ? 'positive' : 'negative',
  };
}
```

**Month label:**
```typescript
// "Net Profit — February 2026"
const monthLabel = new Intl.DateTimeFormat(i18n.language, { month: 'long', year: 'numeric' }).format(new Date());
```

### KpiCard Component Design

```typescript
// src/features/dashboard/components/KpiCard.tsx
interface KpiCardProps {
  label: string;
  value: string;
  subtitle?: string;
  delta?: { value: number; type: 'positive' | 'negative' } | null;
  onClick?: () => void;
  glowOnHover?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
}
```

**Visual layout:**
```
┌──────────────────────┐
│  💰 Tax Jar           │
│                       │
│     ₪2,870.00        │
│                       │
│  set aside from net   │
│  profit               │
└──────────────────────┘
```

**CSS for glow variant (Pending Review card):**
```scss
.card {
  @include card-surface;
  padding: $space-md;
  border-radius: $radius-md;
  // Override card-surface radius
}

.clickable {
  cursor: pointer;
  transition: box-shadow $transition-fast, transform $transition-fast;

  &:hover {
    @include gold-glow;
    transform: translateY(-1px);
  }

  &:focus-visible {
    @include focus-ring;
  }
}
```

### DashboardPage Layout Design

**Desktop (1024px+):**
```
┌─────────────────────────────────────────────┐
│                                              │
│            [   HERO STAT   ]                 │
│                                              │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌────┐│
│  │ Tax Jar │ │ Active  │ │ Monthly │ │Pend││
│  │         │ │Projects │ │Overhead │ │Rev ││
│  └─────────┘ └─────────┘ └─────────┘ └────┘│
│                                              │
└─────────────────────────────────────────────┘
```

**Mobile (< 768px):**
```
┌──────────────────────┐
│                       │
│   [ HERO STAT ]       │
│   (36px amount)       │
│                       │
│ ← ┌───┐ ┌───┐ ┌───┐ →│  (horizontal scroll)
│   │KPI│ │KPI│ │KPI│   │
│   └───┘ └───┘ └───┘   │
│                       │
└──────────────────────┘
```

**SCSS Layout:**
```scss
.page {
  display: flex;
  flex-direction: column;
  gap: $space-xl;
  max-inline-size: 1080px;
  margin-inline: auto;
  padding: $space-lg;
}

.kpiRow {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: $space-md;
}

// Mobile: horizontal scroll
@media (max-width: $bp-md) {
  .page {
    padding: $space-md;
    gap: $space-lg;
  }

  .kpiRow {
    display: flex;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
    gap: $space-sm;
    padding-block-end: $space-sm; // scrollbar space

    // Hide scrollbar
    scrollbar-width: none;
    &::-webkit-scrollbar { display: none; }
  }
}
```

### `calculateTaxReserve` Implementation

```typescript
// src/lib/taxJar.ts

/**
 * Israeli 2025 progressive income tax brackets (annual amounts in agora).
 * Brackets are indexed to inflation annually. These are the current brackets.
 * Source: Israel Tax Authority, updated for 2025 tax year.
 */
const ISRAELI_TAX_BRACKETS: Array<{ upToAgora: number; rate: number }> = [
  { upToAgora: 8_412_000, rate: 0.10 },   // 0 – ₪84,120
  { upToAgora: 12_072_000, rate: 0.14 },   // ₪84,121 – ₪120,720
  { upToAgora: 19_380_000, rate: 0.20 },   // ₪120,721 – ₪193,800
  { upToAgora: 26_928_000, rate: 0.31 },   // ₪193,801 – ₪269,280
  { upToAgora: 56_028_000, rate: 0.35 },   // ₪269,281 – ₪560,280
  { upToAgora: 72_156_000, rate: 0.47 },   // ₪560,281 – ₪721,560
  { upToAgora: Infinity, rate: 0.50 },      // ₪721,561+
];

const DEFAULT_FLAT_RATE = 0.35;

/**
 * Calculate tax reserve amount for the Tax Jar.
 *
 * @param netProfitAgora - Net profit in agora (integer)
 * @param method - 'flat' applies a single rate; 'bracket' applies Israeli progressive brackets
 * @param flatRate - Rate for flat mode (default 0.35 = 35%)
 * @returns Tax reserve amount in agora (integer, rounded)
 */
export function calculateTaxReserve(
  netProfitAgora: number,
  method: 'flat' | 'bracket',
  flatRate: number = DEFAULT_FLAT_RATE,
): number {
  if (netProfitAgora <= 0) return 0;

  if (method === 'flat') {
    return Math.round(netProfitAgora * flatRate);
  }

  // Bracket mode — progressive taxation
  // Input is monthly, annualize first, then de-annualize result
  const annualizedAgora = netProfitAgora * 12;
  let tax = 0;
  let remaining = annualizedAgora;
  let prevCeiling = 0;

  for (const bracket of ISRAELI_TAX_BRACKETS) {
    const bracketSize = bracket.upToAgora - prevCeiling;
    const taxableInBracket = Math.min(remaining, bracketSize);
    tax += taxableInBracket * bracket.rate;
    remaining -= taxableInBracket;
    prevCeiling = bracket.upToAgora;
    if (remaining <= 0) break;
  }

  // Return monthly equivalent
  return Math.round(tax / 12);
}
```

### i18n Keys to Add

**English (`src/i18n/en.json`) — add `dashboard` namespace:**

```json
{
  "dashboard": {
    "greeting": {
      "morning": "Good morning",
      "afternoon": "Good afternoon",
      "evening": "Good evening"
    },
    "greetingName": "{{greeting}}, {{name}}",
    "greetingAnonymous": "{{greeting}}",
    "netProfitLabel": "Net Profit — {{monthYear}}",
    "deltaFromPrevious": "{{direction}} {{value}}% from {{month}}",
    "deltaUp": "▲",
    "deltaDown": "▼",
    "kpi": {
      "taxJar": "Tax Jar",
      "taxJarSubtitle": "set aside from net profit",
      "activeProjects": "Active Projects",
      "activeProjectsSubtitle": "in production",
      "monthlyOverhead": "Monthly Overhead",
      "pendingReview": "Pending Review",
      "pendingBreakdown": "{{green}} green, {{check}} to check",
      "allCaughtUp": "All caught up"
    }
  }
}
```

**Hebrew (`src/i18n/he.json`) — add `dashboard` namespace:**

```json
{
  "dashboard": {
    "greeting": {
      "morning": "בוקר טוב",
      "afternoon": "צהריים טובים",
      "evening": "ערב טוב"
    },
    "greetingName": "{{greeting}}, {{name}}",
    "greetingAnonymous": "{{greeting}}",
    "netProfitLabel": "רווח נקי — {{monthYear}}",
    "deltaFromPrevious": "{{direction}} {{value}}% מ{{month}}",
    "deltaUp": "▲",
    "deltaDown": "▼",
    "kpi": {
      "taxJar": "צנצנת מס",
      "taxJarSubtitle": "הופרש מרווח נקי",
      "activeProjects": "פרויקטים פעילים",
      "activeProjectsSubtitle": "בייצור",
      "monthlyOverhead": "תקורה חודשית",
      "pendingReview": "ממתינים לבדיקה",
      "pendingBreakdown": "{{green}} ירוקים, {{check}} לבדיקה",
      "allCaughtUp": "הכל מעודכן"
    }
  }
}
```

### Previous Story Intelligence (Story 2.5 / Epic 2)

**Key patterns established:**
- `useMemo` for all derived data to avoid React 19 + Zustand v5 subscription conflicts
- `@include card-surface` for card-like containers
- `@include interactive-reset` for clickable non-button elements
- CSS logical properties throughout — no `left`/`right`
- `font-variant-numeric: tabular-nums` for aligned amounts
- Touch targets ≥ 44px for interactive elements
- `$transition-fast` for hover effects
- Skeleton component for loading states
- `formatCurrency(amountAgora, currency)` for all amount display
- `useNavigate()` from React Router for programmatic navigation
- `useTranslation()` for all text

**Critical learnings from Stories 1.1-2.5:**
- Zod 4 `.default()` creates input/output type divergence with `zodResolver` — DO NOT use `.default()` on form schemas
- SCSS variable is `$bp-sm` (640px), `$bp-md` (768px), `$bp-lg` (1024px) — NOT `$breakpoint-sm`
- SCSS tokens: use `$text-lg` not `$font-size-lg`, use `$font-semibold` not `$font-weight-semibold`
- `$space-2xs` does NOT exist — use `$space-xs` (4px) as smallest spacing token
- `$radius-xs` does NOT exist — smallest radius is `$radius-sm` (8px) or use `2px` literal
- Phosphor icon dynamic imports in jsdom cause slow module loading — use `beforeAll` with 30s timeout or `vi.mock`
- `await import()` pattern for Phosphor icon imports in tests
- `src/__mocks__/react-i18next.ts` mock returns translation key as string (with `|key=value` for interpolation params)
- `src/__mocks__/css-module.ts` provides Proxy-based CSS module mock
- React 19 + Zustand v5 `useSyncExternalStore` infinite loop when using both `useStore()` (returns full state) and `useStore(selector)` in the same component — `.filter()` selectors create new references. **Fix**: derive filtered data via `useMemo` from raw arrays
- 486 tests currently passing

### Git Intelligence

**Recent commits (most recent first):**
- `bf63da3` — Fix Firestore documents dropped due to null server timestamps
- `2bd0e12` — Implement Story 2.5: Work Order Detail Page with code review fixes
- `1de4d30` — Implement Story 2.4: Nutrition Label & Margin Calculations with code review fixes
- `26bc9de` — Implement Story 2.3: Manual Transaction Entry & Cost/Revenue Linkage with code review fixes
- `5691072` — Implement Story 2.2: Work Order Status Lifecycle & List View with code review fixes
- `c05296d` — Implement Story 2.1: Work Order Data Model & CRUD with code review fixes
- `c3f5157` — Implement Story 1.6: Core Shared UI Components & Currency Utilities with code review fixes

**Established code patterns:**
- Single comprehensive commit per story
- Components use Phosphor Icons (imported at top level or via `vi.mock` in tests)
- `useMemo` for derived data to avoid Zustand subscription issues
- `@include card-surface` mixin for card-like containers
- All amounts formatted with `formatCurrency()`
- Tests use `vi.mock('@phosphor-icons/react', ...)` pattern
- CSS logical properties throughout
- Error toast handling: `try/catch` with empty catch blocks (toasts shown by action hooks)

### Phosphor Icons for this Story

```typescript
import { TrendUp, TrendDown, CurrencyCircleDollar, Briefcase, Receipt, Tray, ChartBar, ArrowRight } from '@phosphor-icons/react';
// TrendUp → positive delta arrow (alternative to text ▲)
// TrendDown → negative delta arrow (alternative to text ▼)
// CurrencyCircleDollar → Tax Jar icon (or Jar if available)
// Briefcase → Active Projects icon
// Receipt → Monthly Overhead icon
// Tray → Pending Review icon (matches nav icon)
// ChartBar → Dashboard main icon (already used in placeholder)
// ArrowRight → Navigate to review
```

**Note**: Check available Phosphor icons. If `Jar` or `PiggyBank` icons exist, prefer those for Tax Jar. The icon choice should feel warm and aligned with the "set aside" framing.

### Potential Pitfalls to Avoid

1. **DO NOT install any npm packages** — everything needed is already installed.

2. **DO NOT import from other feature modules** — use `@/hooks`, `@/stores`, `@/types`, `@/lib` for shared code. The dashboard hook must subscribe to Firestore independently, not import `useWorkOrders()` from work-orders feature.

3. **DO NOT modify Zustand stores** — `useWorkOrderStore`, `useTransactionStore` are complete with all needed selectors (`selectActiveProjects`, `selectPendingReview`).

4. **DO NOT modify the router** — route `/` is already registered with `DashboardPage`.

5. **Beware dual Zustand subscription** — If the `useDashboardData` hook calls both `useWorkOrderStore()` (for setters) and `useWorkOrderStore(selector)` (for derived data), you may hit the React 19 infinite loop. **Safest approach**: call `useWorkOrderStore()` once, destructure what you need, and derive filtered data via `useMemo` from the raw `workOrders` array.

6. **DO NOT use `$space-2xs` or `$radius-xs`** — they don't exist. Smallest spacing is `$space-xs` (4px). Smallest radius is `$radius-sm` (8px) or use `2px` literal.

7. **DO NOT use `left`/`right` in CSS** — use CSS logical properties only.

8. **DO NOT use `@use` in `.module.scss` files** — tokens and mixins are auto-imported via Vite.

9. **Month boundary calculation** — "Current month" is determined by user's local timezone via `new Date()`. Be careful with the date comparison — compare `getMonth()` and `getFullYear()` of transaction dates. Remember Firestore `Timestamp` fields are already converted to JS `Date` objects by the Zod schema + `useFirestoreCollection` hook.

10. **Delta calculation edge cases** — When `previousMonthNetProfitAgora` is 0, avoid division by zero. When there are no transactions in the previous month, don't show the delta badge at all (return `null`). When the previous month had negative profit and current is positive, the percentage can be misleading — consider showing just the direction arrow.

11. **`calculateTaxReserve` with negative/zero input** — Must return 0 when `netProfitAgora <= 0`. Tax Jar makes no sense for losses.

12. **Horizontal scroll on mobile** — Use `scroll-snap-type: x mandatory` with `scroll-snap-align: start` on each KPI card. Hide scrollbar with `scrollbar-width: none` and `::-webkit-scrollbar { display: none; }`. Ensure cards have a fixed min-width on mobile.

13. **Test i18n mock behavior** — The global mock returns the translation key as the rendered text. For keys with interpolation like `t('dashboard.greetingName', { greeting: '...', name: '...' })`, the mock outputs `dashboard.greetingName|greeting=...|name=...`. Write test assertions accordingly.

14. **Firebase Auth `user.displayName`** — This comes from Google Auth and is the full name. Extract first name with `displayName.split(' ')[0]`. Handle `null` displayName gracefully.

15. **`useAuth` hook is in auth feature** — To get the user for the greeting, you need the Firebase Auth user. The `useAuth()` hook is in `src/features/auth/hooks/useAuth.ts`. Importing it in Dashboard would violate feature boundaries. **Solutions**: (a) Access Firebase Auth directly via `src/services/auth.ts` `onAuthStateChanged`, (b) Create a minimal `useCurrentUser` hook in `src/hooks/` (shared), or (c) Accept that auth is a cross-cutting concern and access it through the auth context/guard. **Recommended**: The `AuthGuard` component in `src/features/auth/AuthGuard.tsx` likely already provides the user — check if it passes user via context or outlet context. If not, create a minimal shared hook in `src/hooks/useCurrentUser.ts` that uses `onAuthStateChanged` from `@/services/auth`.

16. **`toIlsAgora` for multi-currency** — All dashboard calculations must convert non-ILS transactions to ILS agora before summing. Use `toIlsAgora(amountAgora, currency)` from `@/lib/currency`.

### Cross-Story Context

This is **Story 3.1 — the first story in Epic 3** (Dashboard & Project Health). It creates the dashboard's core visual components:

- **Epic 1** (DONE): Project scaffold, design system, auth, app shell, i18n, shared components
- **Epic 2** (DONE): Work Order CRUD, status lifecycle, manual transactions, Nutrition Label, detail page
- **Epic 3 (this)**: Dashboard & Project Health
  - **Story 3.1 (this)**: Hero Stat + KPI Cards — the "at a glance" financial cockpit
  - Story 3.2 (next): Project Health Table — scannable project list with margin indicators
  - Story 3.3 (last): Real-time Dashboard Data Layer — optimized subscriptions, enhanced tax jar, delta calculations

**After this story**: The Dashboard will show Net Profit, Tax Jar, Active Projects, Monthly Overhead, and Pending Review count. The next story (3.2) adds the Project Health Table below the KPIs.

### Project Structure Notes

**Files to CREATE:**

| File | Purpose |
|---|---|
| `src/features/dashboard/components/HeroStat.tsx` | Hero stat component |
| `src/features/dashboard/components/HeroStat.module.scss` | Hero stat styles |
| `src/features/dashboard/components/HeroStat.test.tsx` | Hero stat tests |
| `src/features/dashboard/components/KpiCard.tsx` | KPI card component |
| `src/features/dashboard/components/KpiCard.module.scss` | KPI card styles |
| `src/features/dashboard/components/KpiCard.test.tsx` | KPI card tests |
| `src/features/dashboard/hooks/useDashboardData.ts` | Dashboard data hook |
| `src/lib/taxJar.test.ts` | Tax jar calculation tests |

**Files to REPLACE:**

| File | Action |
|---|---|
| `src/features/dashboard/DashboardPage.tsx` | Replace placeholder with full dashboard |
| `src/features/dashboard/DashboardPage.module.scss` | Replace placeholder styles |
| `src/features/dashboard/DashboardPage.test.tsx` | Replace placeholder tests |
| `src/lib/taxJar.ts` | Replace empty stub with implementation |

**Files to MODIFY:**

| File | Change |
|---|---|
| `src/features/dashboard/components/index.ts` | Add HeroStat, KpiCard exports |
| `src/features/dashboard/hooks/index.ts` | Add useDashboardData export |
| `src/i18n/en.json` | Add `dashboard` namespace |
| `src/i18n/he.json` | Add `dashboard` namespace |

**Files NOT to modify:**
- `src/router.tsx` — route already registered
- `src/features/dashboard/index.ts` — already re-exports components and hooks
- `src/stores/*` — complete with selectors
- `src/types/*` — types complete
- `src/lib/currency.ts`, `src/lib/margins.ts` — utilities complete
- `src/components/*` — Skeleton, Button, Badge all complete
- `src/hooks/useFirestoreCollection.ts` — generic listener complete

### References

- [Source: planning-artifacts/epics.md#Story-3.1] — Full acceptance criteria with BDD format
- [Source: planning-artifacts/epics.md#Epic-3] — Epic context and story sequence
- [Source: planning-artifacts/architecture.md#Frontend-Architecture] — Component architecture, state management
- [Source: planning-artifacts/architecture.md#Implementation-Patterns] — Naming, structure, data flow
- [Source: planning-artifacts/architecture.md#Enforcement-Guidelines] — CSS logical properties, co-located tests
- [Source: planning-artifacts/architecture.md#Project-Structure] — Full directory tree with dashboard components
- [Source: planning-artifacts/ux-design-specification.md#Hero-Number] — Blink-inspired portfolio-style hero stat
- [Source: planning-artifacts/ux-design-specification.md#KPI-Cards] — Clean row of 4 KPI cards specification
- [Source: planning-artifacts/ux-design-specification.md#Responsive-Strategy] — Desktop/tablet/mobile layouts, horizontal scroll KPIs
- [Source: planning-artifacts/ux-design-specification.md#Component-Strategy] — HeroStat and KpiCard component specs
- [Source: planning-artifacts/ux-design-specification.md#Color-System] — Design tokens, semantic colors
- [Source: planning-artifacts/ux-design-specification.md#Typography-System] — Font sizes, weights for dashboard
- [Source: planning-artifacts/ux-design-specification.md#Spacing-Layout] — Dashboard density adaptations
- [Source: planning-artifacts/ux-design-specification.md#Loading-State-Patterns] — Skeleton shimmer for initial load
- [Source: implementation-artifacts/2-5-work-order-detail-page.md] — Previous story patterns, Zustand dual-subscription fix, SCSS token learnings

## Dev Agent Record

### Agent Model Used

Claude claude-4.6-opus (Cursor)

### Debug Log References

- SCSS build: `$text-md` and `$font-display` tokens don't exist — replaced with `$text-base` and `$font-family`
- DashboardPage test: Proxy-based Phosphor icon mock caused jsdom hang — switched to explicit icon list
- `sass-embedded` "closed dispatcher" race condition in sandboxed environment — resolved by running build with full permissions

### Completion Notes List

- ✅ Task 1: Implemented `calculateTaxReserve` with flat mode (configurable rate, default 35%) and bracket mode (Israeli 2025 progressive brackets, annualized calculation). 15 unit tests covering flat, bracket, and edge cases.
- ✅ Task 2: Created `HeroStat` component with time-aware greeting (morning/afternoon/evening), formatted net profit display via `formatCurrency`, delta badge with positive/negative coloring, and skeleton loading state. Mobile-responsive (36px amount on mobile).
- ✅ Task 3: Created `KpiCard` component with label/value/subtitle, optional delta badge, optional icon, clickable variant with keyboard support and gold glow on hover, skeleton loading state. Mobile scroll-snap alignment.
- ✅ Task 4: Created `useDashboardData` hook using the SAFER pattern — single `useWorkOrderStore()`/`useTransactionStore()` call per store to avoid React 19 + Zustand v5 dual-subscription infinite loops. Hook owns its own Firestore subscriptions via `useFirestoreCollection`. All metrics derived via `useMemo` from raw arrays.
- ✅ Task 5: Replaced placeholder `DashboardPage` with full implementation — HeroStat + 4 KPI cards (Tax Jar, Active Projects, Monthly Overhead, Pending Review). Desktop: CSS Grid 4-column. Mobile: horizontal scroll with snap. User name from `auth.currentUser` (shared infra, not auth feature import).
- ✅ Task 6: Added `dashboard` i18n namespace to both `en.json` and `he.json` — greeting variants, net profit label, delta labels, KPI labels/subtitles, pending breakdown, all caught up state.
- ✅ Task 7: 47 new tests total — `taxJar.test.ts` (15), `HeroStat.test.tsx` (13), `KpiCard.test.tsx` (12), `DashboardPage.test.tsx` (10). All co-located per architecture.
- ✅ Task 8: `tsc --noEmit` clean, `npm run lint` clean, 533/533 tests pass (zero regressions), `npm run build` succeeds.

### Implementation Decisions

- **Auth access**: Used `auth.currentUser?.displayName` from `@/services` instead of importing `useAuth` from auth feature — respects feature boundary rule while leveraging AuthGuard's login guarantee.
- **Zustand dual-subscription avoidance**: Used single `useWorkOrderStore()` call and derived `activeProjects`, `pendingReview` in `useMemo` instead of using `selectActiveProjects`/`selectPendingReview` selectors — prevents React 19 infinite loop.
- **Delta badge design**: Returns `null` when previous month is `null` or `0` (avoids division by zero and misleading deltas).

### File List

**Created:**
- `src/features/dashboard/components/HeroStat.tsx`
- `src/features/dashboard/components/HeroStat.module.scss`
- `src/features/dashboard/components/HeroStat.test.tsx`
- `src/features/dashboard/components/KpiCard.tsx`
- `src/features/dashboard/components/KpiCard.module.scss`
- `src/features/dashboard/components/KpiCard.test.tsx`
- `src/features/dashboard/hooks/useDashboardData.ts`
- `src/lib/taxJar.test.ts`

**Replaced (overwritten placeholders):**
- `src/features/dashboard/DashboardPage.tsx`
- `src/features/dashboard/DashboardPage.module.scss`
- `src/features/dashboard/DashboardPage.test.tsx`
- `src/lib/taxJar.ts`

**Modified:**
- `src/features/dashboard/components/index.ts` — added HeroStat, KpiCard exports
- `src/features/dashboard/hooks/index.ts` — added useDashboardData export
- `src/i18n/en.json` — added `dashboard` namespace
- `src/i18n/he.json` — added `dashboard` namespace

## Senior Developer Review (AI)

**Reviewer:** Galelbaz on 2026-02-07
**Outcome:** Approved with fixes applied

### Findings (7 total: 2 High, 4 Medium, 1 Low)

**HIGH — Fixed:**
- H1: `getDelta` function was duplicated in `HeroStat.tsx` and `DashboardPage.tsx` (DRY violation). **Fix:** Exported from HeroStat, re-exported via barrel, imported in DashboardPage.
- H2: `getDelta` returned misleading "▲ 0%" when `current === previous`. **Fix:** Added `value === 0 → return null` guard.

**MEDIUM — Fixed:**
- M1: Missing `@include interactive-reset` on clickable KpiCard div. **Fix:** Added mixin to `.clickable` class.
- M2: No explicit `min-block-size: 44px` for mobile touch targets (AC #8). **Fix:** Added to mobile media query.
- M3: `useDashboardData` useMemo used `new Date()` inside memo with stale deps on month boundary. **Fix:** Moved `currentMonth`/`currentYear` outside useMemo, added to dependency array.
- M4: Missing `aria-label` on clickable KpiCard Pending Review button. **Fix:** Added `ariaLabel` prop to KpiCard, applied on Pending Review card with i18n key `dashboard.kpi.pendingReviewAction`.

**LOW — Documented:**
- L1: Test count documentation says "47 new tests" but actual count is 50 (15+13+12+10). Difference is 3 replaced placeholder tests.

### Verification
- `tsc --noEmit`: zero errors
- `npm run test`: 534 tests pass (534 = 533 previous + 1 new aria-label test, zero regressions)

## Change Log

- 2026-02-07: Code review fixes — deduplicated getDelta, fixed 0% delta bug, added interactive-reset/min-touch-target/aria-label to KpiCard, fixed useMemo stale date, added pendingReviewAction i18n key. 534 tests pass.
- 2026-02-07: Story 3.1 implemented — Hero Stat & KPI Cards dashboard with calculateTaxReserve utility, HeroStat component, KpiCard component, useDashboardData hook, full DashboardPage, i18n keys (EN+HE), 47 new tests (533 total, zero regressions)
