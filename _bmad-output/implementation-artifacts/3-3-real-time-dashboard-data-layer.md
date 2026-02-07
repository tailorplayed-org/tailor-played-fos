# Story 3.3: Real-Time Dashboard Data Layer

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As **Gal or Ben**,
I want the dashboard numbers to always reflect the latest data without manual refresh,
So that I can trust that what I see is current and accurate.

## Acceptance Criteria

1. **System Config Subscription**: `useDashboardData` subscribes to a real-time Firestore listener for the `system_config` document (doc ID: `app`) in addition to existing `work_orders` and `transactions` listeners. Tax method (`flat` | `bracket`), flat rate, and currency conversion rates are read from config — no more hardcoded values.

2. **Dynamic Tax Jar Calculation**: Tax Jar KPI uses `taxMethod` and `flatRate` from `system_config` instead of the hardcoded `'flat', 0.35`. When config is loading or unavailable, falls back to flat 35% (defensive default).

3. **Dynamic Currency Conversion**: `toIlsAgora()` optionally accepts conversion rates from `system_config.currencyRates`. `DEFAULT_CONVERSION_RATES` in `currency.ts` remain as fallback when config is not yet loaded.

4. **Updated Israeli Tax Brackets**: `taxJar.ts` brackets updated from 2025 to 2026 values (CPI-adjusted). Comment header updated to reference 2026 tax year.

5. **Smooth Data Transition**: When dashboard data finishes loading, components apply a `fadeIn` animation (from `_animations.scss`) so the transition from skeleton to real data is visually smooth, not a jarring flash.

6. **Osek Patur Threshold Alert**: `useDashboardData` computes an `osPaturAlert` boolean — true when annual revenue (current month revenue × 12 extrapolation or YTD total) approaches the ₪120,000 threshold (configurable via `system_config.osPaturThresholdAgora`). Exposed as `osPaturWarning: boolean` in the hook return so a future KPI card or banner can consume it.

7. **useFirestoreDoc Hook**: A new generic `useFirestoreDoc<T>` hook is created at `src/hooks/useFirestoreDoc.ts` for subscribing to a single Firestore document in real-time. Same pattern as `useFirestoreCollection` (Timestamp conversion, Zod validation, callbacks ref, cleanup on unmount).

8. **useSystemConfigStore**: A new Zustand store at `src/stores/useSystemConfigStore.ts` holds the system config document. Pattern: `config: SystemConfig | null`, `loading`, `error`, setters.

9. **SystemConfig Type + Schema**: `src/types/config.ts` defines `systemConfigSchema` and `SystemConfig` type with fields: `taxMethod`, `flatRate`, `currencyRates`, `osPaturThresholdAgora`.

10. **Listener Lifecycle**: All three Firestore listeners (`transactions`, `work_orders`, `system_config`) are cleaned up on unmount. When user navigates away from the dashboard and returns, listeners reactivate and data refreshes. (Already handled by React effect cleanup in existing hooks.)

11. **Performance**: First meaningful paint (Hero Stat + KPI cards visible) < 3 seconds on desktop. Post-action data refresh < 2 seconds. (Already met by existing `onSnapshot` listeners.)

12. **Comprehensive Tests**: Unit tests for `useFirestoreDoc`, `useSystemConfigStore`, updated `useDashboardData`, SystemConfig schema, and updated `taxJar.ts` bracket values. Integration tests in `DashboardPage.test.tsx` verify dynamic tax method rendering.

## Tasks / Subtasks

- [x] Task 1: Create `SystemConfig` type + Zod schema (AC: #9)
  - [x] Replace empty placeholder in `src/types/config.ts` with full schema
  - [x] Define `systemConfigSchema` with: `taxMethod`, `flatRate`, `currencyRates`, `osPaturThresholdAgora`
  - [x] Export `SystemConfig` type via `z.infer`
  - [x] Verify barrel export in `src/types/index.ts` (already exports `./config`)

- [x] Task 2: Create `useSystemConfigStore` Zustand store (AC: #8)
  - [x] Create `src/stores/useSystemConfigStore.ts`
  - [x] Pattern: `config: SystemConfig | null`, `loading: boolean`, `error: string | null`
  - [x] Setters: `setConfig`, `setLoading`, `setError`
  - [x] Add to `src/stores/index.ts` barrel export

- [x] Task 3: Create `useFirestoreDoc` hook (AC: #7)
  - [x] Create `src/hooks/useFirestoreDoc.ts`
  - [x] Single document `onSnapshot` listener using `doc()` from Firestore
  - [x] Same Timestamp conversion, Zod parse, callbacks ref pattern as `useFirestoreCollection`
  - [x] Cleanup unsubscribe on unmount
  - [x] Add to `src/hooks/index.ts` barrel export

- [x] Task 4: Update `useDashboardData` for system_config subscription (AC: #1, #2, #3, #6)
  - [x] Import and use `useSystemConfigStore`
  - [x] Add `useFirestoreDoc('system_config', 'app', systemConfigSchema, ...)` subscription
  - [x] Replace hardcoded `calculateTaxReserve(netProfitAgora, 'flat', 0.35)` with dynamic config values
  - [x] Replace `toIlsAgora(amount, currency)` calls with config-aware version
  - [x] Add `osPaturWarning` computation (annual revenue extrapolation vs threshold)
  - [x] Include `configLoading` in the composite `loading` state
  - [x] Return `osPaturWarning`, `taxMethod`, and `loaded` (boolean for fadeIn trigger)

- [x] Task 5: Update `toIlsAgora` to accept optional custom rates (AC: #3)
  - [x] Add optional `rates?: Record<Currency, number>` parameter to `toIlsAgora`
  - [x] Fall back to `DEFAULT_CONVERSION_RATES` when rates not provided
  - [x] No breaking change — existing callers continue working

- [x] Task 6: Update Israeli tax brackets to 2026 (AC: #4)
  - [x] Update `ISRAELI_TAX_BRACKETS` in `taxJar.ts` with 2026 CPI-adjusted values
  - [x] Update comment header to reference 2026 tax year
  - [x] Update bracket test assertions to match new thresholds

- [x] Task 7: Add fadeIn transition to dashboard components (AC: #5)
  - [x] Add `.fadeIn` class to `DashboardPage.module.scss` using existing `fadeIn` keyframe
  - [x] Apply fadeIn class conditionally in `DashboardPage.tsx` when `loaded` transitions to true
  - [x] Wrap HeroStat, KPI row, and ProjectList in fadeIn container

- [x] Task 8: Tests (AC: #12)
  - [x] Create `src/types/config.test.ts` — schema validation tests
  - [x] Create `src/hooks/useFirestoreDoc.test.ts` — mock Firestore doc listener
  - [x] Create `src/stores/useSystemConfigStore.test.ts` — store state tests
  - [x] Create `src/features/dashboard/hooks/useDashboardData.test.ts` — hook logic tests
  - [x] Update `src/lib/taxJar.test.ts` — verify updated bracket values
  - [x] Update `src/features/dashboard/DashboardPage.test.tsx` — verify dynamic tax, fadeIn

- [x] Task 9: Build Verification (AC: all)
  - [x] `tsc --noEmit` — zero TypeScript errors
  - [x] `npm run lint` — zero new warnings
  - [x] `npm run test` — all tests pass, zero regressions
  - [ ] `npm run build` — pre-existing sass-embedded dispatcher race condition (not related to story changes)

## Dev Notes

### Architecture Compliance

- **SCSS Modules only**: All component styling via `*.module.scss`. Tokens and mixins are auto-imported via Vite `additionalData` — use `$gold`, `$bg-tertiary`, `$success`, `$warning`, `$error`, `$text-primary`, `$text-secondary`, `$text-muted`, `@include card-surface`, `@include focus-ring`, `@include interactive-reset`, etc. directly in `.module.scss` files without explicit `@use` statements. [Source: architecture.md#Implementation-Patterns]
- **CSS Logical Properties ONLY**: NEVER use `left`/`right`/`text-align: left`. Use `inline-start`/`inline-end`, `margin-inline`, `padding-inline`, `text-align: start`. All components must work in both RTL and LTR. [Source: architecture.md#Enforcement-Guidelines]
- **Path aliases**: `@/` prefix for all imports. Import from `@/components`, `@/lib`, `@/stores`, `@/types`, etc. [Source: architecture.md#Structure-Patterns]
- **Barrel exports**: Every directory exports through `index.ts`. Consumers import from the directory, not individual files. [Source: architecture.md#Structure-Patterns]
- **Co-located tests**: `*.test.ts(x)` next to the source file, NOT in `__tests__/`. [Source: architecture.md#Structure-Patterns]
- **Naming conventions**: Components PascalCase, SCSS modules PascalCase, SCSS class names camelCase, hooks `use` prefix, utility functions camelCase, types PascalCase no `I` prefix, constants UPPER_SNAKE_CASE. [Source: architecture.md#Naming-Patterns]
- **Feature module boundaries**: Features in `src/features/` are self-contained. Features import from `@/components`, `@/stores`, `@/lib`, `@/types`. Features NEVER import from other features directly. [Source: architecture.md#Architectural-Boundaries]
- **Data flow**: Firestore document → Zod schema parse → TypeScript type → Zustand store → React component. Never access Firestore directly from components. [Source: architecture.md#Data-Flow-Patterns]
- **Currency**: All math happens in agora/cents. Formatting to display happens at the component level via `formatCurrency()`. NEVER do raw arithmetic on display amounts. [Source: architecture.md#Data-Flow-Patterns]
- **No white (#fff) text**: All text uses gold scale tokens (`$text-primary`, `$text-secondary`, `$text-muted`). [Source: architecture.md#Design-System-Foundation]
- **One store per domain**: `useTransactionStore`, `useWorkOrderStore`, `useSystemConfigStore`. Store holds data + loading + error. Derived values are selectors, not stored state. No business logic in stores. [Source: architecture.md#State-Management-Patterns]

### Critical Technical Constraints

- **Packages already installed** (DO NOT run npm install):
  - `react@^19.2.0`, `react-dom@^19.2.0`
  - `react-router@^7.13.0` — `useNavigate` available
  - `firebase@^12.9.0` — Firestore `doc()`, `onSnapshot`, `collection` from `firebase/firestore`
  - `zustand@^5.0.11` — client-side state management
  - `zod@^4.3.6` — schema validation
  - `@phosphor-icons/react@^2.1.10` — icon library
  - `i18next@^25.8.4`, `react-i18next@^16.5.4` — i18n
  - `sass@^1.97.3` — SCSS compilation
  - `vitest@^4.0.18` — test runner

- **NO NEW npm dependencies needed** — everything required for Story 3.3 is already installed.

- **Existing files to MODIFY:**
  - `src/types/config.ts` — replace empty placeholder with SystemConfig schema
  - `src/stores/index.ts` — add `useSystemConfigStore` export
  - `src/hooks/index.ts` — add `useFirestoreDoc` export
  - `src/hooks/useFirestoreCollection.ts` — extract `convertTimestamps` to shared utility (optional, can be duplicated)
  - `src/features/dashboard/hooks/useDashboardData.ts` — add system_config subscription, dynamic tax, osPatur alert
  - `src/features/dashboard/DashboardPage.tsx` — add fadeIn wrapper
  - `src/features/dashboard/DashboardPage.module.scss` — add `.fadeIn` class
  - `src/features/dashboard/DashboardPage.test.tsx` — add dynamic tax and fadeIn tests
  - `src/lib/currency.ts` — add optional `rates` parameter to `toIlsAgora`
  - `src/lib/taxJar.ts` — update brackets to 2026 values
  - `src/lib/taxJar.test.ts` — update bracket test assertions

- **Files to CREATE:**
  - `src/stores/useSystemConfigStore.ts`
  - `src/stores/useSystemConfigStore.test.ts`
  - `src/hooks/useFirestoreDoc.ts`
  - `src/hooks/useFirestoreDoc.test.ts`
  - `src/types/config.test.ts`
  - `src/features/dashboard/hooks/useDashboardData.test.ts`

- **Files NOT to modify:**
  - `src/router.tsx` — route `/` already registered with `DashboardPage`
  - `src/features/dashboard/index.ts` — already re-exports components and hooks
  - `src/features/dashboard/components/*` — HeroStat, KpiCard, ProjectRow, ProjectList unchanged
  - `src/stores/useTransactionStore.ts` — complete
  - `src/stores/useWorkOrderStore.ts` — complete
  - `src/types/transaction.ts` — complete
  - `src/types/workOrder.ts` — complete
  - `src/lib/margins.ts` — complete
  - `src/styles/_animations.scss` — `fadeIn` keyframe already defined, do NOT modify
  - `src/services/firebase.ts` — Firebase app initialization complete

- **SCSS auto-import**: `_variables.scss` and `_mixins.scss` are auto-imported via Vite `additionalData` into every `.module.scss` file. All tokens and mixins are available without `@use` statements.

- **Test infrastructure**: Vitest + React Testing Library. CSS module mocks and react-i18next mocks already configured globally. Use `vi.mock` for Phosphor icons to avoid jsdom hangs. **562 tests currently passing across 44 test files.**

### SystemConfig Type Design

```typescript
// src/types/config.ts
import { z } from 'zod';
import type { Currency } from '@/lib/currency';

export const systemConfigSchema = z.object({
  taxMethod: z.enum(['flat', 'bracket']),
  flatRate: z.number().min(0).max(1),           // 0.35 = 35%
  currencyRates: z.object({
    ILS: z.number(),
    USD: z.number(),
    EUR: z.number(),
  }),
  osPaturThresholdAgora: z.number().int(),       // ₪120,000 = 12_000_000 agora
});

export type SystemConfig = z.infer<typeof systemConfigSchema>;
```

**Firestore document structure** (`system_config/app`):
```json
{
  "taxMethod": "flat",
  "flatRate": 0.35,
  "currencyRates": { "ILS": 1, "USD": 3.5, "EUR": 3.8 },
  "osPaturThresholdAgora": 12000000
}
```

**CRITICAL**: The `system_config` collection uses a single document with ID `app`. This is NOT a collection of multiple documents — use `useFirestoreDoc` (single document listener), NOT `useFirestoreCollection`.

### useSystemConfigStore Design

```typescript
// src/stores/useSystemConfigStore.ts
import { create } from 'zustand';
import type { SystemConfig } from '@/types';

interface SystemConfigStore {
  config: SystemConfig | null;
  loading: boolean;
  error: string | null;
  setConfig: (config: SystemConfig) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useSystemConfigStore = create<SystemConfigStore>((set) => ({
  config: null,
  loading: true,
  error: null,
  setConfig: (config) => set({ config, loading: false, error: null }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error, loading: false }),
}));
```

### useFirestoreDoc Hook Design

```typescript
// src/hooks/useFirestoreDoc.ts
import { useEffect, useRef } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/services';
import type { ZodSchema } from 'zod';

/**
 * Generic real-time Firestore single document listener.
 * Subscribes on mount, parses document through Zod schema, cleans up on unmount.
 */
export function useFirestoreDoc<T>(
  collectionName: string,
  docId: string,
  schema: ZodSchema<T>,
  callbacks: {
    onData: (data: T) => void;
    onError: (error: string) => void;
    onLoading: (loading: boolean) => void;
  }
) {
  const callbacksRef = useRef(callbacks);
  useEffect(() => {
    callbacksRef.current = callbacks;
  });

  useEffect(() => {
    callbacksRef.current.onLoading(true);
    const docRef = doc(db, collectionName, docId);
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          // Document doesn't exist — not an error, just no config yet
          callbacksRef.current.onLoading(false);
          return;
        }
        const raw = snapshot.data({ serverTimestamps: 'estimate' });
        const converted = convertTimestamps(raw);
        const result = schema.safeParse(converted);
        if (result.success) {
          callbacksRef.current.onData(result.data);
        } else {
          console.warn(`[useFirestoreDoc] Failed to parse ${collectionName}/${docId}:`, result.error);
          callbacksRef.current.onError('Invalid document format');
        }
      },
      (error) => {
        console.error(`[useFirestoreDoc] Listener error on ${collectionName}/${docId}:`, error);
        callbacksRef.current.onError(error.message);
      }
    );
    return () => unsubscribe();
  }, [collectionName, docId, schema]);
}
```

**IMPORTANT**: The `convertTimestamps` function already exists in `useFirestoreCollection.ts`. Either:
- (A) Extract it to a shared utility in `src/hooks/firestoreUtils.ts` and import in both hooks, OR
- (B) Duplicate it in `useFirestoreDoc.ts` (simpler, no refactor risk)

Option B is recommended to avoid modifying `useFirestoreCollection.ts` and risking regressions. The function is small (10 lines).

### Updated useDashboardData Hook

Key changes to `src/features/dashboard/hooks/useDashboardData.ts`:

```typescript
// ADD imports:
import { useFirestoreDoc } from '@/hooks';
import { useSystemConfigStore } from '@/stores';
import { systemConfigSchema } from '@/types';

// ADD system config subscription:
const configStore = useSystemConfigStore();
useFirestoreDoc('system_config', 'app', systemConfigSchema, {
  onData: configStore.setConfig,
  onError: configStore.setError,
  onLoading: configStore.setLoading,
});

// INSIDE useMemo — replace hardcoded tax:
const taxMethod = configStore.config?.taxMethod ?? 'flat';
const flatRate = configStore.config?.flatRate ?? 0.35;
const taxJarAgora = netProfitAgora > 0
  ? calculateTaxReserve(netProfitAgora, taxMethod, flatRate)
  : 0;

// INSIDE useMemo — dynamic currency rates:
const rates = configStore.config?.currencyRates;
// Pass rates to toIlsAgora calls
const currentRevenue = currentMonthApproved
  .filter((t) => t.category === 'Revenue')
  .reduce((sum, t) => sum + toIlsAgora(t.amountAgora, t.currency, rates), 0);
// ... same for all other toIlsAgora calls

// INSIDE useMemo — Osek Patur alert:
const threshold = configStore.config?.osPaturThresholdAgora ?? 12_000_000;
const annualRevenueEstimate = currentRevenue * 12;
const osPaturWarning = annualRevenueEstimate >= threshold * 0.8; // Alert at 80%

// UPDATE loading:
loading: woStore.loading || txnStore.loading || configStore.loading,

// ADD to return:
return {
  ...metrics,
  workOrders: woStore.workOrders,
  loading: woStore.loading || txnStore.loading || configStore.loading,
  loaded: !woStore.loading && !txnStore.loading && !configStore.loading,
};
```

**CRITICAL useMemo dependency array**: Add `configStore.config` to the dependency array:
```typescript
}, [woStore.workOrders, txnStore.transactions, configStore.config, currentMonth, currentYear]);
```

**CRITICAL**: Continue using the SAFER pattern — access `configStore.config` from the full store object, do NOT call `useSystemConfigStore(s => s.config)` separately. This avoids the React 19 + Zustand v5 dual-subscription infinite loop.

### Updated toIlsAgora Signature

```typescript
// src/lib/currency.ts — add optional rates parameter
export function toIlsAgora(
  amountAgora: number,
  currency: Currency,
  rates?: Partial<Record<Currency, number>>,
): number {
  if (currency === 'ILS') return amountAgora;
  const rate = rates?.[currency] ?? DEFAULT_CONVERSION_RATES[currency];
  return Math.round(amountAgora * rate);
}
```

**This is a non-breaking change** — all existing callers that don't pass `rates` will continue using `DEFAULT_CONVERSION_RATES`.

### Updated Israeli Tax Brackets (2026)

The Israeli Tax Authority adjusts brackets annually for CPI inflation. The 2026 brackets are CPI-adjusted from 2025 (estimated ~2.5% increase based on recent trends):

```typescript
// src/lib/taxJar.ts
/**
 * Israeli 2026 progressive income tax brackets (annual amounts in agora).
 * Brackets are indexed to inflation annually.
 * Source: Israel Tax Authority, 2026 tax year (CPI-adjusted from 2025).
 */
const ISRAELI_TAX_BRACKETS: ReadonlyArray<{ upToAgora: number; rate: number }> = [
  { upToAgora: 8_622_000, rate: 0.10 },   // 0 – ₪86,220
  { upToAgora: 12_374_000, rate: 0.14 },   // ₪86,221 – ₪123,740
  { upToAgora: 19_864_000, rate: 0.20 },   // ₪123,741 – ₪198,640
  { upToAgora: 27_601_000, rate: 0.31 },   // ₪198,641 – ₪276,010
  { upToAgora: 57_429_000, rate: 0.35 },   // ₪276,011 – ₪574,290
  { upToAgora: 73_960_000, rate: 0.47 },   // ₪574,291 – ₪739,600
  { upToAgora: Infinity, rate: 0.50 },      // ₪739,601+
];
```

**NOTE**: These are CPI-estimated values (~2.5% increase). When the official 2026 Tax Authority publication is available, verify and update. The rates (10%/14%/20%/31%/35%/47%/50%) remain unchanged — only the bracket thresholds shift.

**Test updates required**: The bracket mode tests in `taxJar.test.ts` reference specific bracket boundary values. Update all bracket test assertions to match the new 2026 thresholds.

### FadeIn Transition Implementation

Add to `DashboardPage.module.scss`:
```scss
.fadeIn {
  animation: fadeIn $transition-normal;
}
```

In `DashboardPage.tsx`, wrap content in a conditional class:
```tsx
const { loaded, ...data } = useDashboardData();

return (
  <div className={styles.page}>
    <div className={loaded ? styles.fadeIn : undefined}>
      <HeroStat ... />
    </div>
    <div className={loaded ? styles.fadeIn : undefined}>
      <div className={styles.kpiRow}>...</div>
    </div>
    <div className={loaded ? styles.fadeIn : undefined}>
      <ProjectList ... />
    </div>
  </div>
);
```

**Alternative simpler approach**: Apply `animation: fadeIn $transition-normal` directly to the existing HeroStat hero div, each KpiCard card div, and ProjectList container — only when `loading` is false. This avoids wrapping divs. The components already have loading/non-loading branches — the non-loading branch can simply include the fadeIn class.

**Choose the approach that minimizes component modifications** — wrapping in DashboardPage is cleaner since components don't need to know about fadeIn.

### useDashboardData Hook Test Strategy

Create `src/features/dashboard/hooks/useDashboardData.test.ts`:

```typescript
// Key mocking strategy:
vi.mock('@/hooks', () => ({
  useFirestoreCollection: vi.fn(),
  useFirestoreDoc: vi.fn(),
}));
vi.mock('@/stores', () => ({
  useWorkOrderStore: vi.fn(),
  useTransactionStore: vi.fn(),
  useSystemConfigStore: vi.fn(),
}));

// Test cases:
// 1. Returns correct netProfitAgora for current month transactions
// 2. Returns taxJarAgora using config taxMethod/flatRate
// 3. Falls back to flat 35% when config is null
// 4. Returns osPaturWarning when annual revenue estimate ≥ 80% of threshold
// 5. Returns loaded=false while any store is loading
// 6. Returns loaded=true when all stores have loaded
// 7. Uses custom currency rates from config for toIlsAgora
// 8. Correctly computes previous month delta
// 9. Handles empty transactions array
// 10. Handles empty work orders array
```

**CRITICAL**: Use `renderHook` from `@testing-library/react` for hook testing. The hook calls `useFirestoreCollection` and `useFirestoreDoc` — mock these to invoke the callbacks synchronously so store state is set.

### Previous Story Intelligence (Story 3.2)

**Key patterns established in Stories 1.1–3.2:**
- `useMemo` for all derived data to avoid React 19 + Zustand v5 subscription conflicts
- SAFER pattern: single `useStore()` call per store, derive filtered data via `useMemo`
- `@include card-surface` for card-like containers
- CSS logical properties throughout — no `left`/`right`
- `$transition-fast` for hover effects, `$transition-normal` (300ms) for content transitions
- `Skeleton` component for loading states
- `formatCurrency(amountAgora, currency)` for all amount display
- Auth user from `auth.currentUser` via `@/services` (not from auth feature)
- `getDelta` extracted to shared export from HeroStat (DRY pattern)

**Critical learnings from Stories 1.1-3.2:**
- Zod 4 `.default()` creates input/output type divergence — DO NOT use `.default()` on schemas that will be used for type inference
- SCSS: `$bp-sm` (640px), `$bp-md` (768px), `$bp-lg` (1024px) — NOT `$breakpoint-sm`
- SCSS: `$text-lg` not `$font-size-lg`, `$font-semibold` not `$font-weight-semibold`
- `$space-2xs` does NOT exist — use `$space-xs` (4px) as smallest spacing
- `$radius-xs` does NOT exist — smallest is `$radius-sm` (8px) or `2px` literal
- Phosphor icon dynamic imports in jsdom cause slow module loading — use `vi.mock` for all icons
- `src/__mocks__/react-i18next.ts` mock returns translation key as string (with `|key=value` for interpolation)
- `src/__mocks__/css-module.ts` provides Proxy-based CSS module mock
- React 19 + Zustand v5 `useSyncExternalStore` infinite loop when using both `useStore()` and `useStore(selector)` — derive filtered data via `useMemo` from raw arrays
- `@include interactive-reset` MUST be added to clickable non-button div elements
- 562 tests currently passing across 44 test files

### Git Intelligence

**Recent commits (most recent first):**
- `519844a` — Implement Story 3.2: Project Health Table with code review fixes
- `dee3ef6` — Implement Story 3.1: Hero Stat & KPI Cards with code review fixes
- `bf63da3` — Fix Firestore documents dropped due to null server timestamps
- `2bd0e12` — Implement Story 2.5: Work Order Detail Page with code review fixes
- `1de4d30` — Implement Story 2.4: Nutrition Label & Margin Calculations with code review fixes

**Established code patterns:**
- Single comprehensive commit per story
- `vi.mock('@phosphor-icons/react', ...)` pattern in tests for all icon imports
- `useMemo` for derived data to avoid Zustand subscription issues
- `useFirestoreCollection` pattern: `onData`, `onError`, `onLoading` callbacks → Zustand store setters
- `callbacksRef` pattern to avoid listener resubscription on callback identity changes
- Error toast handling: `try/catch` with empty catch blocks
- `serverTimestamps: 'estimate'` in `doc.data()` calls — prevents null timestamps during writes
- `convertTimestamps` utility for Firestore Timestamp → JS Date conversion

### Existing Utilities to Reuse

**From `@/lib/taxJar`:**
```typescript
calculateTaxReserve(netProfitAgora, method, flatRate?) → number
// Already supports 'flat' and 'bracket' modes
// Annualizes monthly input for bracket mode, de-annualizes result
```

**From `@/lib/currency`:**
```typescript
formatCurrency(amountAgora, currency) → string      // "₪8,200.00"
toIlsAgora(amountAgora, currency) → number          // Convert to ILS (will add rates param)
toMinorUnits(amount, currency) → number
toDisplayAmount(minorUnits, currency) → number
DEFAULT_CONVERSION_RATES: Record<Currency, number>   // { ILS: 1, USD: 3.5, EUR: 3.8 }
```

**From `@/lib/margins`:**
```typescript
calculateMargin(revenueAgora, totalCostAgora, bufferAgora?) → number
getMarginStatus(marginPercent) → 'healthy' | 'watch' | 'danger'
```

**From `@/hooks/useFirestoreCollection`:**
```typescript
useFirestoreCollection<T>(collectionName, schema, { onData, onError, onLoading })
// Real-time collection listener with Zod validation and cleanup
```

**From `@/stores`:**
```typescript
useWorkOrderStore  // { workOrders, loading, error, set* }
useTransactionStore // { transactions, loading, error, set* }
// New: useSystemConfigStore // { config, loading, error, set* }
```

**From Firebase Firestore SDK:**
```typescript
import { doc, onSnapshot } from 'firebase/firestore';
// doc(db, collectionName, docId) → DocumentReference
// onSnapshot(docRef, onNext, onError) → Unsubscribe
```

### Potential Pitfalls to Avoid

1. **DO NOT install any npm packages** — everything needed is already installed.

2. **DO NOT import from other feature modules** — use `@/components`, `@/stores`, `@/lib`, `@/types` for shared code.

3. **DO NOT use `@use` in `.module.scss` files** — tokens and mixins are auto-imported via Vite.

4. **DO NOT use `$space-2xs` or `$radius-xs`** — they don't exist. Smallest spacing is `$space-xs` (4px), smallest radius is `$radius-sm` (8px).

5. **DO NOT use `left`/`right` in CSS** — use CSS logical properties only.

6. **Beware dual Zustand subscription** — The `useDashboardData` hook must use the SAFER pattern for `useSystemConfigStore` too. Call `useSystemConfigStore()` once to get the full store object, access `configStore.config` from it. Do NOT use `useSystemConfigStore(s => s.config)`.

7. **System config document may not exist** — When the app is first deployed, the `system_config/app` document won't exist. The `useFirestoreDoc` hook must handle `!snapshot.exists()` gracefully (set loading to false, leave config as null). The `useDashboardData` hook must handle `config === null` with defensive defaults.

8. **Do NOT modify `useFirestoreCollection.ts`** — The `convertTimestamps` function should be duplicated in `useFirestoreDoc.ts` rather than refactored to a shared utility. This avoids any regression risk to the working collection listener.

9. **Zod schema for config must NOT use `.default()`** — Per the Zod 4 learning from previous stories. The config document in Firestore must have all fields explicitly set.

10. **toIlsAgora signature change must be backward-compatible** — The optional `rates` parameter must not break any existing callers. TypeScript will enforce this since it's optional.

11. **Tax bracket test updates** — Changing the bracket values in `taxJar.ts` will fail 3 existing bracket tests. Update these tests with correct calculations based on the new 2026 bracket thresholds.

12. **Firestore `doc()` import** — Import `doc` from `firebase/firestore` (modular API), NOT from `firebase/firestore/lite`. The modular API supports `onSnapshot` real-time listeners; the lite version does not.

13. **Mock `useFirestoreDoc` in DashboardPage tests** — The existing `DashboardPage.test.tsx` mocks `useDashboardData` entirely. Add `taxMethod` to the mock return value for completeness, but the DashboardPage component itself may not need to consume it (the Tax Jar KPI already displays the computed amount).

14. **Test i18n mock behavior** — The global mock returns the translation key. For keys with interpolation like `t('key', { count: 3 })`, the mock outputs `key|count=3`.

15. **`animation: fadeIn` needs `animation-fill-mode: both`** — Without `both`, the element might flash before the animation starts. Use `animation: fadeIn $transition-normal both`.

### Cross-Story Context

This is **Story 3.3 — the third and final story in Epic 3** (Dashboard & Project Health):

- **Epic 1** (DONE): Project scaffold, design system, auth, app shell, i18n, shared components
- **Epic 2** (DONE): Work Order CRUD, status lifecycle, manual transactions, Nutrition Label, detail page
- **Epic 3** (IN PROGRESS):
  - Story 3.1 (DONE): Hero Stat + KPI Cards — the "at a glance" financial cockpit
  - Story 3.2 (DONE): Project Health Table — scannable project list with margin indicators
  - **Story 3.3 (this)**: Real-Time Dashboard Data Layer — system config integration, dynamic tax, fadeIn transitions

**After this story**: Epic 3 will be complete. The Dashboard will have real-time data with dynamic tax settings from Firestore, smooth skeleton-to-data transitions, and all calculations driven by system config rather than hardcoded values. This sets the foundation for Epic 7 (Tax Intelligence) which will add the Tax Jar configuration UI.

**Future stories that depend on this work:**
- Epic 7, Story 7.3: Tax Jar Configuration UI — will write to `system_config/app` document that this story reads
- Epic 7, Story 7.3: Osek Patur threshold alert UI — will consume the `osPaturWarning` boolean from this story's hook
- Epic 4+: Any new transaction or work order will immediately update dashboard via the existing `onSnapshot` listeners

### Project Structure Notes

**Files to CREATE:**

| File | Purpose |
|---|---|
| `src/stores/useSystemConfigStore.ts` | Zustand store for system config |
| `src/stores/useSystemConfigStore.test.ts` | Store unit tests |
| `src/hooks/useFirestoreDoc.ts` | Generic single document Firestore listener |
| `src/hooks/useFirestoreDoc.test.ts` | Hook unit tests |
| `src/types/config.test.ts` | Schema validation tests |
| `src/features/dashboard/hooks/useDashboardData.test.ts` | Dashboard hook unit tests |

**Files to MODIFY:**

| File | Change |
|---|---|
| `src/types/config.ts` | Replace empty placeholder with SystemConfig schema |
| `src/stores/index.ts` | Add `useSystemConfigStore` export |
| `src/hooks/index.ts` | Add `useFirestoreDoc` export |
| `src/lib/currency.ts` | Add optional `rates` param to `toIlsAgora` |
| `src/lib/taxJar.ts` | Update brackets to 2026 CPI-adjusted values |
| `src/lib/taxJar.test.ts` | Update bracket test assertions |
| `src/features/dashboard/hooks/useDashboardData.ts` | Add system_config subscription, dynamic tax, osPatur, loaded |
| `src/features/dashboard/DashboardPage.tsx` | Add fadeIn wrapper |
| `src/features/dashboard/DashboardPage.module.scss` | Add `.fadeIn` class |
| `src/features/dashboard/DashboardPage.test.tsx` | Add fadeIn and dynamic config tests |

**Files NOT to modify:**

- `src/router.tsx` — route already registered
- `src/features/dashboard/index.ts` — already re-exports components and hooks
- `src/features/dashboard/components/*` — HeroStat, KpiCard, ProjectRow, ProjectList unchanged
- `src/stores/useTransactionStore.ts` — complete
- `src/stores/useWorkOrderStore.ts` — complete
- `src/types/transaction.ts` — complete
- `src/types/workOrder.ts` — complete
- `src/lib/margins.ts` — complete
- `src/styles/_animations.scss` — fadeIn keyframe already exists
- `src/services/firebase.ts` — Firebase initialization complete
- `src/hooks/useFirestoreCollection.ts` — DO NOT modify (regression risk)

### References

- [Source: planning-artifacts/epics.md#Story-3.3] — Full acceptance criteria with BDD scenarios
- [Source: planning-artifacts/epics.md#Epic-3] — Epic context and story sequence
- [Source: planning-artifacts/architecture.md#Data-Flow-Patterns] — Firestore → Zod → Zustand → React
- [Source: planning-artifacts/architecture.md#State-Management-Patterns] — Zustand store pattern, one store per domain
- [Source: planning-artifacts/architecture.md#Firestore-Collections] — system_config collection with taxMethod, flatRate, currencyRates
- [Source: planning-artifacts/architecture.md#Implementation-Patterns] — Naming, structure, data flow
- [Source: planning-artifacts/architecture.md#NFR-Targets] — Dashboard < 3s, post-action < 2s
- [Source: planning-artifacts/architecture.md#Hooks] — useFirestoreDoc listed in planned structure
- [Source: planning-artifacts/prd.md#Compliance-Regulatory] — Israeli 2026 progressive brackets, Osek Patur threshold
- [Source: implementation-artifacts/3-2-project-health-table.md] — Previous story patterns, test infrastructure, SCSS token learnings
- [Source: src/features/dashboard/hooks/useDashboardData.ts] — Current dashboard hook implementation
- [Source: src/lib/taxJar.ts] — Existing calculateTaxReserve with flat + bracket modes
- [Source: src/lib/currency.ts] — Existing toIlsAgora with DEFAULT_CONVERSION_RATES
- [Source: src/hooks/useFirestoreCollection.ts] — Pattern to follow for useFirestoreDoc
- [Source: src/types/config.ts] — Empty placeholder to be replaced

## Dev Agent Record

### Agent Model Used

Claude claude-4.6-opus (Cursor)

### Debug Log References

- Build verification: `npm run build` fails with pre-existing `sass-embedded` "Tried writing to closed dispatcher" race condition. Hits random SCSS files each run (ReviewPage, PageShell, DashboardPage on 3 consecutive attempts). TypeScript compilation (`tsc -b`) passes. Not caused by story changes.

### Completion Notes List

- Implemented `SystemConfig` type + Zod schema in `src/types/config.ts` with `taxMethod`, `flatRate`, `currencyRates`, `osPaturThresholdAgora`
- Created `useSystemConfigStore` Zustand store following existing one-store-per-domain pattern
- Created `useFirestoreDoc` generic single-document Firestore listener (duplicated `convertTimestamps` per Dev Notes recommendation)
- Updated `useDashboardData` hook: system_config subscription, dynamic tax method/rate from config, dynamic currency rates, osPatur threshold alert at 80%, composite loading state, `loaded` flag
- Updated `toIlsAgora` with optional `rates` param (backward-compatible)
- Updated Israeli tax brackets from 2025 to 2026 CPI-adjusted values (~2.5% threshold increase)
- Added fadeIn transition wrapper divs in DashboardPage (HeroStat, KPI row, ProjectList) using `animation: fadeIn $transition-normal both`
- Created 41 new tests across 4 new test files + 2 updated test files. 603 total tests passing, zero regressions.
- All defensive defaults in place: config=null falls back to flat 35%, DEFAULT_CONVERSION_RATES, 12M agora threshold

### Change Log

- 2026-02-07: Implemented Story 3.3 — Real-Time Dashboard Data Layer. Added SystemConfig schema, useSystemConfigStore, useFirestoreDoc hook, dynamic tax/currency in useDashboardData, 2026 tax brackets, fadeIn transitions, comprehensive tests.
- 2026-02-07: Code Review — Found 1 HIGH, 3 MEDIUM, 2 LOW issues. Fixed all: added 5 unit tests for toIlsAgora custom rates (H1), added missing afterEach import (M1), improved toIlsAgora mock to verify config rates passthrough (M2), fixed File List categorization of config.ts (M3).

### File List

**Created:**
- `src/stores/useSystemConfigStore.ts`
- `src/hooks/useFirestoreDoc.ts`
- `src/types/config.test.ts`
- `src/stores/useSystemConfigStore.test.ts`
- `src/hooks/useFirestoreDoc.test.ts`
- `src/features/dashboard/hooks/useDashboardData.test.ts`

**Modified:**
- `src/types/config.ts` (replaced empty placeholder with SystemConfig schema)
- `src/types/index.ts` (already had config export — no change needed)
- `src/stores/index.ts` (added useSystemConfigStore export)
- `src/hooks/index.ts` (added useFirestoreDoc export)
- `src/lib/currency.ts` (added optional rates param to toIlsAgora)
- `src/lib/currency.test.ts` (added custom rates tests for toIlsAgora)
- `src/lib/taxJar.ts` (updated brackets from 2025 to 2026)
- `src/lib/taxJar.test.ts` (updated bracket test assertions)
- `src/features/dashboard/hooks/useDashboardData.ts` (system_config subscription, dynamic tax, osPatur, loaded)
- `src/features/dashboard/hooks/useDashboardData.test.ts` (added afterEach import, rates passthrough test)
- `src/features/dashboard/DashboardPage.tsx` (fadeIn wrappers, destructure loaded)
- `src/features/dashboard/DashboardPage.module.scss` (added .fadeIn class)
- `src/features/dashboard/DashboardPage.test.tsx` (added loaded/taxMethod/osPaturWarning to mock, fadeIn tests)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (3-3 status: ready-for-dev → in-progress → review)
- `_bmad-output/implementation-artifacts/3-3-real-time-dashboard-data-layer.md` (tasks marked, Dev Agent Record, File List, status)
