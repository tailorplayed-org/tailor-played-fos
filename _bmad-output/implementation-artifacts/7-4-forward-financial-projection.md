# Story 7.4: Forward Financial Projection

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As **Gal**,
I want to model the cash flow impact of a potential purchase,
so that I can answer "can we afford this?" with data instead of gut feeling.

## Acceptance Criteria

1. **Given** a Forward Projection view (accessible from the Dashboard via a prominent trigger button), **When** Gal opens it, **Then** she sees the current financial snapshot: Net Profit (current month), Tax Jar reserve (set aside), Monthly Overhead (current burn rate), Available Buffer (Net Profit − Tax Jar − Overhead), and Expected Incoming Revenue (from Work Orders in Production/Shipped status with unrealized revenue).

2. **Given** the projection input, **When** Gal enters a proposed purchase amount (e.g., ₪2,800), **Then** the system models the impact: Available Buffer after purchase, whether next month's overhead is covered, whether Tax Jar remains funded, and the number of months until the purchase is "absorbed" by incoming revenue.

3. **Given** the projection result, **When** the buffer after purchase is healthy (covers ≥ 2 months overhead + Tax Jar), **Then** the result shows a green assessment: "You have headroom. Overhead and Tax Jar are covered." **And** the recommendation is positive.

4. **Given** the projection result, **When** the buffer after purchase is tight (covers < 2 months but > 0), **Then** the result shows a yellow assessment: "Tight — next month's overhead is covered, but limited buffer." **And** the recommendation is cautious.

5. **Given** the projection result, **When** the buffer after purchase would be negative, **Then** the result shows a red assessment: "This purchase would exceed your available buffer." **And** specific numbers show: shortfall amount, when revenue would recover the position.

6. **Given** the projection view, **When** modeling a purchase, **Then** the projection factors in: current cash position, Tax Jar reserve (locked), monthly overhead burn (projected forward), and expected revenue from Work Orders with `status: 'Production'` or `status: 'Shipped'` (upcoming invoices). **And** if the purchase is for inventory (bulk buy), a note explains: "Investment consumed across future projects via Scoops — one-time hit, not recurring."

7. **Given** the projection view on mobile, **When** rendered on small viewport, **Then** the input and results stack vertically **And** the financial snapshot is scannable **And** the assessment (green/yellow/red) is prominently displayed with icon + text (never color alone).

## Tasks / Subtasks

- [x] Task 1: Create projection calculation utilities (AC: #1, #2, #3, #4, #5, #6)
  - [x] 1.1 Create `src/lib/projection.ts` — pure projection calculation functions
  - [x] 1.2 Create `src/lib/projection.test.ts` — comprehensive unit tests
  - [x] 1.3 Update `src/lib/index.ts` barrel export

- [x] Task 2: Extend useDashboardData for pipeline revenue (AC: #1, #6)
  - [x] 2.1 Update `src/features/dashboard/hooks/useDashboardData.ts` — add pipeline revenue computation
  - [x] 2.2 Update `src/features/dashboard/hooks/useDashboardData.test.ts` — add pipeline revenue tests

- [x] Task 3: Create ForwardProjection component (AC: #1, #2, #3, #4, #5, #6, #7)
  - [x] 3.1 Create `src/features/dashboard/components/ForwardProjection.tsx` — main projection UI
  - [x] 3.2 Create `src/features/dashboard/components/ForwardProjection.module.scss` — projection panel styles
  - [x] 3.3 Create `src/features/dashboard/components/ForwardProjection.test.tsx` — component tests
  - [x] 3.4 Update `src/features/dashboard/components/index.ts` barrel export

- [x] Task 4: Integrate ForwardProjection into DashboardPage (AC: #1, #7)
  - [x] 4.1 Update `src/features/dashboard/DashboardPage.tsx` — add projection trigger + panel
  - [x] 4.2 Update `src/features/dashboard/DashboardPage.module.scss` — projection trigger button styles
  - [x] 4.3 Update `src/features/dashboard/DashboardPage.test.tsx` — integration tests

- [x] Task 5: Add i18n keys (AC: all)
  - [x] 5.1 Add `dashboard.projection.*` keys to `src/i18n/en.json`
  - [x] 5.2 Add Hebrew translations to `src/i18n/he.json`

## Dev Notes

### CRITICAL: React 19 + Zustand v5 SAFER Pattern — MUST FOLLOW

**Established in Story 7.2, enforced in Story 7.3.** The code review for Story 7.2 discovered an infinite re-render loop caused by React 19 + Zustand v5 when using selectors that return new arrays. This was fixed via the "SAFER pattern" and MUST be followed:

**THE PROBLEM:** Calling `useOverheadStore(selectCurrentMonth)` where the selector creates a `.filter()` result returns a new array reference every render, causing React 19 strict mode to trigger infinite re-renders with Zustand v5.

**THE FIX (SAFER pattern):** Read the full data from hooks/stores and derive filtered arrays via `useMemo`:
```typescript
// BAD — causes infinite re-render loop:
const activeWOs = useWorkOrderStore(selectActiveProjects);

// GOOD — SAFER pattern:
const woStore = useWorkOrderStore();
const activeWOs = useMemo(() => {
  return woStore.workOrders.filter((wo) => wo.status === 'Production' || wo.status === 'Shipped');
}, [woStore.workOrders]);
```

**Impact on this story:**
- `useDashboardData` already follows the SAFER pattern — it reads full store state and derives everything via `useMemo`. New pipeline revenue computation MUST follow the same pattern.
- The ForwardProjection component receives data as props from DashboardPage (via useDashboardData) — no direct store access needed in the component.

### CRITICAL: What Already Exists — DO NOT RECREATE

Story 7.4 leverages **extensive existing infrastructure** from Epics 1–7. The developer MUST use these existing pieces and NOT recreate them:

| Component | Location | Status | Notes |
|---|---|---|---|
| `useDashboardData` hook | `src/features/dashboard/hooks/useDashboardData.ts` | EXISTS | Already computes netProfitAgora, taxJarAgora, monthlyOverheadAgora, all subscriptions |
| `useWorkOrderStore` | `src/stores/useWorkOrderStore.ts` | EXISTS | Has `workOrders: WorkOrder[]` with `revenueTotalAgora`, `status` |
| `useTransactionStore` | `src/stores/useTransactionStore.ts` | EXISTS | Has `transactions: Transaction[]` with `workOrderId`, `category`, `status` |
| `useSystemConfigStore` | `src/stores/useSystemConfigStore.ts` | EXISTS | Has config with taxMethod, flatRate, currencyRates, osPaturThresholdAgora |
| `useOverheadStore` | `src/stores/useOverheadStore.ts` | EXISTS | Has overhead entries + `calculateBurn` utility |
| `calculateTaxReserve` | `src/lib/taxJar.ts` | EXISTS | Tax jar calculation (flat + bracket) |
| `calculateBurn` | `src/stores/useOverheadStore.ts` | EXISTS | Monthly overhead burn rate calculator |
| `formatCurrency` | `src/lib/currency.ts` | EXISTS | Currency formatting (agora → display string) |
| `toIlsAgora` | `src/lib/currency.ts` | EXISTS | Multi-currency → ILS conversion |
| `toDisplayAmount` | `src/lib/currency.ts` | EXISTS | Agora → display amount conversion |
| `toMinorUnits` | `src/lib/currency.ts` | EXISTS | Display amount → agora conversion |
| `KpiCard` | `src/features/dashboard/components/KpiCard.tsx` | EXISTS | Reusable metric card with delta support |
| `Button` | `src/components/Button/Button.tsx` | EXISTS | Standard button component |
| `Skeleton` | `src/components/Skeleton/Skeleton.tsx` | EXISTS | Loading state placeholder |
| `HeroStat` | `src/features/dashboard/components/HeroStat.tsx` | EXISTS | Net profit hero display |
| `OsPaturBanner` | `src/features/dashboard/components/OsPaturBanner.tsx` | EXISTS | Warning banner pattern reference |
| `TaxJarSettings` | `src/features/overhead/components/TaxJarSettings.tsx` | EXISTS | Settings panel pattern reference (inline toggle) |
| `WorkOrder` type | `src/types/workOrder.ts` | EXISTS | Has `revenueTotalAgora`, `directCostAgora`, `inventoryCostAgora`, `overheadAllocationAgora`, `status` |
| `Transaction` type | `src/types/transaction.ts` | EXISTS | Has `workOrderId`, `category`, `amountAgora`, `currency`, `status` |
| `DashboardPage` | `src/features/dashboard/DashboardPage.tsx` | EXISTS | Will host the projection trigger + panel |
| Firestore subscriptions | `useDashboardData.ts` | EXISTS | Already subscribes to `work_orders`, `transactions`, `overhead`, `system_config` collections |
| Stores barrel | `src/stores/index.ts` | EXISTS | Already exports all stores |
| Lib barrel | `src/lib/index.ts` | EXISTS | Already exports currency, taxJar, margins |
| Types barrel | `src/types/index.ts` | EXISTS | Already exports all types |

### Task 1: Projection Calculation Utilities

#### 1.1 — Create `src/lib/projection.ts`

This file contains ALL business logic for the forward projection feature. Pure functions, no React dependencies, fully testable.

```typescript
/**
 * Forward Financial Projection calculation utilities.
 * All monetary values in agora (integer, minor units).
 */

export type ProjectionAssessment = 'healthy' | 'tight' | 'negative';

export interface FinancialSnapshot {
  netProfitAgora: number;       // Current month net profit
  taxJarAgora: number;          // Tax reserve (locked)
  monthlyOverheadAgora: number; // Current monthly burn rate
  availableBufferAgora: number; // Net Profit - Tax Jar - Overhead
  pipelineRevenueAgora: number; // Expected incoming from Production/Shipped WOs
}

export interface ProjectionResult {
  assessment: ProjectionAssessment;
  bufferAfterPurchaseAgora: number;
  monthlyCoverageMonths: number;   // How many months of (overhead + tax jar) the buffer covers
  monthsUntilAbsorbed: number | null; // Months for pipeline revenue to recover, null if no pipeline
  shortfallAgora: number;           // 0 if no shortfall, positive if negative buffer
  isInventoryPurchase: boolean;
}

/**
 * Calculate the available buffer from the current financial position.
 * Buffer = Net Profit - Tax Jar Reserve - Monthly Overhead
 * If Net Profit is negative, buffer is negative (no tax jar subtracted).
 */
export function calculateAvailableBuffer(
  netProfitAgora: number,
  taxJarAgora: number,
  monthlyOverheadAgora: number,
): number {
  // Tax Jar is only reserved from positive profit
  const effectiveTaxJar = netProfitAgora > 0 ? taxJarAgora : 0;
  return netProfitAgora - effectiveTaxJar - monthlyOverheadAgora;
}

/**
 * Calculate the financial snapshot from dashboard metrics.
 */
export function buildFinancialSnapshot(
  netProfitAgora: number,
  taxJarAgora: number,
  monthlyOverheadAgora: number,
  pipelineRevenueAgora: number,
): FinancialSnapshot {
  return {
    netProfitAgora,
    taxJarAgora,
    monthlyOverheadAgora,
    availableBufferAgora: calculateAvailableBuffer(netProfitAgora, taxJarAgora, monthlyOverheadAgora),
    pipelineRevenueAgora,
  };
}

/**
 * Calculate how many months of recurring costs the buffer covers.
 * Recurring monthly cost = overhead + tax jar reserve.
 * Returns Infinity if monthly cost is 0.
 */
export function calculateMonthlyCoverage(
  bufferAgora: number,
  monthlyOverheadAgora: number,
  taxJarAgora: number,
): number {
  const monthlyCost = monthlyOverheadAgora + taxJarAgora;
  if (monthlyCost <= 0) return bufferAgora > 0 ? Infinity : 0;
  if (bufferAgora <= 0) return 0;
  return bufferAgora / monthlyCost;
}

/**
 * Calculate months until a purchase amount is recovered by pipeline revenue.
 * Returns null if no pipeline revenue exists.
 */
export function calculateMonthsUntilAbsorbed(
  purchaseAgora: number,
  pipelineRevenueAgora: number,
): number | null {
  if (pipelineRevenueAgora <= 0) return null;
  // Simple model: pipeline revenue spread over ~3 months (conservative)
  const monthlyPipelineRevenue = Math.round(pipelineRevenueAgora / 3);
  if (monthlyPipelineRevenue <= 0) return null;
  return Math.ceil(purchaseAgora / monthlyPipelineRevenue);
}

/**
 * Determine the assessment based on months of coverage after purchase.
 * - healthy: ≥ 2 months of overhead + tax jar covered
 * - tight: < 2 months but > 0 (positive buffer)
 * - negative: buffer would go negative
 */
export function getAssessment(monthlyCoverageMonths: number): ProjectionAssessment {
  if (monthlyCoverageMonths >= 2) return 'healthy';
  if (monthlyCoverageMonths > 0) return 'tight';
  return 'negative';
}

/**
 * Run the full forward projection calculation.
 *
 * @param snapshot - Current financial state
 * @param purchaseAgora - Proposed purchase amount in agora
 * @param isInventoryPurchase - Whether purchase is for inventory (bulk buy)
 * @returns Complete projection result with assessment
 */
export function calculateProjection(
  snapshot: FinancialSnapshot,
  purchaseAgora: number,
  isInventoryPurchase: boolean = false,
): ProjectionResult {
  if (purchaseAgora <= 0) {
    const coverage = calculateMonthlyCoverage(
      snapshot.availableBufferAgora,
      snapshot.monthlyOverheadAgora,
      snapshot.taxJarAgora,
    );
    return {
      assessment: getAssessment(coverage),
      bufferAfterPurchaseAgora: snapshot.availableBufferAgora,
      monthlyCoverageMonths: Math.round(coverage * 10) / 10,
      monthsUntilAbsorbed: null,
      shortfallAgora: 0,
      isInventoryPurchase,
    };
  }

  const bufferAfterPurchase = snapshot.availableBufferAgora - purchaseAgora;
  const coverage = calculateMonthlyCoverage(
    bufferAfterPurchase,
    snapshot.monthlyOverheadAgora,
    snapshot.taxJarAgora,
  );
  const monthsUntilAbsorbed = calculateMonthsUntilAbsorbed(
    purchaseAgora,
    snapshot.pipelineRevenueAgora,
  );

  return {
    assessment: getAssessment(coverage),
    bufferAfterPurchaseAgora: bufferAfterPurchase,
    monthlyCoverageMonths: Math.round(coverage * 10) / 10, // Round to 1 decimal
    monthsUntilAbsorbed,
    shortfallAgora: bufferAfterPurchase < 0 ? Math.abs(bufferAfterPurchase) : 0,
    isInventoryPurchase,
  };
}
```

**CRITICAL design decisions:**
- All functions are pure — no side effects, no store access, no hooks
- `calculateAvailableBuffer` only subtracts Tax Jar when net profit is positive (if negative, tax jar is 0)
- `calculateMonthsUntilAbsorbed` divides pipeline revenue by 3 months (conservative assumption — Production/Shipped WOs are expected to invoice within ~1–3 months)
- `monthlyCoverageMonths` rounds to 1 decimal for cleaner display
- Assessment thresholds: ≥ 2 months = healthy, > 0 = tight, ≤ 0 = negative (per AC #3, #4, #5)

#### 1.2 — Tests for `src/lib/projection.test.ts`

Create a comprehensive test file for all projection utilities:

1. `calculateAvailableBuffer` — returns correct buffer (profit - tax - overhead)
2. `calculateAvailableBuffer` — does not subtract tax jar when net profit is negative
3. `calculateAvailableBuffer` — handles zero values
4. `buildFinancialSnapshot` — returns correct snapshot with computed buffer
5. `calculateMonthlyCoverage` — returns correct months of coverage
6. `calculateMonthlyCoverage` — returns Infinity when monthly cost is 0
7. `calculateMonthlyCoverage` — returns 0 for negative buffer
8. `calculateMonthsUntilAbsorbed` — returns null when no pipeline revenue
9. `calculateMonthsUntilAbsorbed` — returns correct months for given pipeline
10. `getAssessment` — returns "healthy" for ≥ 2 months
11. `getAssessment` — returns "tight" for > 0 and < 2 months
12. `getAssessment` — returns "negative" for ≤ 0
13. `calculateProjection` — healthy scenario (large buffer)
14. `calculateProjection` — tight scenario (small buffer after purchase)
15. `calculateProjection` — negative scenario (purchase exceeds buffer)
16. `calculateProjection` — zero purchase returns current assessment
17. `calculateProjection` — shortfallAgora is positive when buffer goes negative
18. `calculateProjection` — isInventoryPurchase flag passes through

**Test pattern:**
```typescript
import { describe, it, expect } from 'vitest';
import {
  calculateAvailableBuffer,
  buildFinancialSnapshot,
  calculateMonthlyCoverage,
  calculateMonthsUntilAbsorbed,
  getAssessment,
  calculateProjection,
} from './projection';
```

#### 1.3 — Update barrel export

Add to `src/lib/index.ts`:
```typescript
export * from './projection';
```

### Task 2: Extend useDashboardData for Pipeline Revenue

#### 2.1 — Update `src/features/dashboard/hooks/useDashboardData.ts`

**Add pipeline revenue computation** inside the existing `useMemo` block. This calculates the total unrealized revenue from Work Orders in Production/Shipped status.

**Logic:**
```typescript
// Pipeline Revenue — unrealized revenue from Production + Shipped work orders
// For each WO: unrealized = revenueTotalAgora - sum(approved Revenue txns linked to that WO)
const pipelineWorkOrders = woStore.workOrders.filter(
  (wo) => wo.status === 'Production' || wo.status === 'Shipped',
);

const pipelineRevenueAgora = pipelineWorkOrders.reduce((sum, wo) => {
  // Find approved revenue transactions linked to this work order
  const realizedRevenue = approved
    .filter((t) => t.category === 'Revenue' && t.workOrderId === wo.id)
    .reduce((s, t) => s + toIlsAgora(t.amountAgora, t.currency, rates), 0);
  
  const unrealized = Math.max(0, wo.revenueTotalAgora - realizedRevenue);
  return sum + unrealized;
}, 0);
```

**Add to the returned metrics object:**
```typescript
return {
  // ... existing fields ...
  pipelineRevenueAgora,
};
```

**CRITICAL:** This computation runs inside the existing `useMemo` that depends on `[woStore.workOrders, txnStore.transactions, ...]`. No new dependencies needed — both `workOrders` and `transactions` are already in the dependency array.

**CRITICAL:** Use `wo.revenueTotalAgora` which is stored in agora (ILS). Revenue transactions are multi-currency so convert them via `toIlsAgora()`.

**Update the return statement** to include `pipelineRevenueAgora` in the spread metrics.

#### 2.2 — Tests for pipeline revenue

Add to `src/features/dashboard/hooks/useDashboardData.test.ts`:

1. `pipelineRevenueAgora` — returns sum of unrealized revenue from Production/Shipped WOs
2. `pipelineRevenueAgora` — subtracts approved Revenue transactions linked to WOs
3. `pipelineRevenueAgora` — returns 0 when no Production/Shipped WOs exist
4. `pipelineRevenueAgora` — clamps unrealized to 0 (never negative)
5. `pipelineRevenueAgora` — ignores Lead and Design status WOs

**Mock data patterns:**
```typescript
// Work order with partial revenue realized
const mockWO = {
  id: 'wo-1',
  clientName: 'Test Client',
  projectDescription: '',
  deadline: null,
  status: 'Production' as const,
  revenueTotalAgora: 1_000_000, // ₪10,000 expected
  directCostAgora: 300_000,
  inventoryCostAgora: 0,
  overheadAllocationAgora: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Revenue transaction linked to the WO
const mockRevenueTxn = {
  id: 'txn-1',
  vendorName: 'Test Client',
  amountAgora: 400_000, // ₪4,000 already received
  currency: 'ILS' as const,
  date: new Date(),
  category: 'Revenue' as const,
  workOrderId: 'wo-1', // Linked!
  inventoryItemId: null,
  status: 'approved' as const,
  // ... other required fields
};
// Expected: pipelineRevenueAgora = 1_000_000 - 400_000 = 600_000
```

### Task 3: ForwardProjection Component

#### 3.1 — `src/features/dashboard/components/ForwardProjection.tsx`

This is the main projection UI. It receives all data as props from DashboardPage — **no direct store access** to maintain clean component boundaries.

**Props interface:**
```typescript
interface ForwardProjectionProps {
  netProfitAgora: number;
  taxJarAgora: number;
  monthlyOverheadAgora: number;
  pipelineRevenueAgora: number;
  onClose: () => void;
}
```

**Component structure:**
```typescript
import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Calculator, X, CheckCircle, Warning, XCircle, Package } from '@phosphor-icons/react';
import { formatCurrency, toMinorUnits } from '@/lib';
import {
  buildFinancialSnapshot,
  calculateProjection,
  type FinancialSnapshot,
  type ProjectionResult,
  type ProjectionAssessment,
} from '@/lib';
import styles from './ForwardProjection.module.scss';
```

**Local state:**
```typescript
const [purchaseAmount, setPurchaseAmount] = useState(''); // Display units (e.g., "2800")
const [isInventoryPurchase, setIsInventoryPurchase] = useState(false);
```

**Computations (useMemo — SAFER pattern):**
```typescript
const snapshot = useMemo<FinancialSnapshot>(() =>
  buildFinancialSnapshot(netProfitAgora, taxJarAgora, monthlyOverheadAgora, pipelineRevenueAgora),
  [netProfitAgora, taxJarAgora, monthlyOverheadAgora, pipelineRevenueAgora],
);

const projection = useMemo<ProjectionResult | null>(() => {
  const amount = parseFloat(purchaseAmount);
  if (isNaN(amount) || amount <= 0) return null;
  const purchaseAgora = toMinorUnits(amount, 'ILS');
  return calculateProjection(snapshot, purchaseAgora, isInventoryPurchase);
}, [snapshot, purchaseAmount, isInventoryPurchase]);
```

**Assessment icon + color map:**
```typescript
const ASSESSMENT_CONFIG: Record<ProjectionAssessment, {
  icon: typeof CheckCircle;
  colorClass: string;
}> = {
  healthy: { icon: CheckCircle, colorClass: styles.assessmentHealthy },
  tight: { icon: Warning, colorClass: styles.assessmentTight },
  negative: { icon: XCircle, colorClass: styles.assessmentNegative },
};
```

**JSX structure (high-level):**
```tsx
<div className={styles.projectionPanel}>
  {/* Header with close button */}
  <div className={styles.header}>
    <div className={styles.headerTitle}>
      <Calculator size={22} weight="fill" />
      <h2>{t('dashboard.projection.title')}</h2>
    </div>
    <button onClick={onClose} className={styles.closeButton} aria-label={t('actions.cancel')}>
      <X size={20} />
    </button>
  </div>

  {/* Financial Snapshot — Always visible */}
  <div className={styles.snapshotGrid}>
    <div className={styles.snapshotItem}>
      <span className={styles.snapshotLabel}>{t('dashboard.projection.netProfit')}</span>
      <span className={styles.snapshotValue}>{formatCurrency(snapshot.netProfitAgora)}</span>
    </div>
    <div className={styles.snapshotItem}>
      <span className={styles.snapshotLabel}>{t('dashboard.projection.taxJar')}</span>
      <span className={`${styles.snapshotValue} ${styles.locked}`}>{formatCurrency(snapshot.taxJarAgora)}</span>
    </div>
    <div className={styles.snapshotItem}>
      <span className={styles.snapshotLabel}>{t('dashboard.projection.overhead')}</span>
      <span className={styles.snapshotValue}>{formatCurrency(snapshot.monthlyOverheadAgora)}</span>
    </div>
    <div className={styles.snapshotItem}>
      <span className={styles.snapshotLabel}>{t('dashboard.projection.buffer')}</span>
      <span className={`${styles.snapshotValue} ${styles.bufferValue}`}>
        {formatCurrency(snapshot.availableBufferAgora)}
      </span>
    </div>
    <div className={styles.snapshotItem}>
      <span className={styles.snapshotLabel}>{t('dashboard.projection.pipeline')}</span>
      <span className={styles.snapshotValue}>{formatCurrency(snapshot.pipelineRevenueAgora)}</span>
    </div>
  </div>

  {/* Purchase Input */}
  <div className={styles.inputSection}>
    <label htmlFor="purchase-amount" className={styles.inputLabel}>
      {t('dashboard.projection.inputLabel')}
    </label>
    <div className={styles.inputWrap}>
      <span className={styles.currencyPrefix}>₪</span>
      <input
        id="purchase-amount"
        type="number"
        min={0}
        step={100}
        value={purchaseAmount}
        onChange={(e) => setPurchaseAmount(e.target.value)}
        placeholder={t('dashboard.projection.inputPlaceholder')}
        className={styles.purchaseInput}
        autoFocus
      />
    </div>
    {/* Inventory purchase toggle */}
    <label className={styles.checkboxLabel}>
      <input
        type="checkbox"
        checked={isInventoryPurchase}
        onChange={(e) => setIsInventoryPurchase(e.target.checked)}
        className={styles.checkbox}
      />
      <Package size={16} />
      <span>{t('dashboard.projection.inventoryPurchase')}</span>
    </label>
  </div>

  {/* Projection Result */}
  {projection && (
    <div className={`${styles.result} ${ASSESSMENT_CONFIG[projection.assessment].colorClass}`}>
      <div className={styles.assessmentHeader}>
        {/* Render the assessment icon */}
        <AssessmentIcon assessment={projection.assessment} />
        <h3 className={styles.assessmentTitle}>
          {t(`dashboard.projection.assessment.${projection.assessment}`)}
        </h3>
      </div>

      <div className={styles.resultDetails}>
        <div className={styles.resultRow}>
          <span>{t('dashboard.projection.bufferAfter')}</span>
          <span className={projection.bufferAfterPurchaseAgora < 0 ? styles.negativeAmount : ''}>
            {formatCurrency(projection.bufferAfterPurchaseAgora)}
          </span>
        </div>
        <div className={styles.resultRow}>
          <span>{t('dashboard.projection.coverageMonths')}</span>
          <span>
            {projection.monthlyCoverageMonths === Infinity
              ? '∞'
              : t('dashboard.projection.months', { count: String(projection.monthlyCoverageMonths) })}
          </span>
        </div>

        {projection.shortfallAgora > 0 && (
          <div className={`${styles.resultRow} ${styles.shortfall}`}>
            <span>{t('dashboard.projection.shortfall')}</span>
            <span>{formatCurrency(projection.shortfallAgora)}</span>
          </div>
        )}

        {projection.monthsUntilAbsorbed != null && (
          <div className={styles.resultRow}>
            <span>{t('dashboard.projection.recoveryTime')}</span>
            <span>{t('dashboard.projection.months', { count: String(projection.monthsUntilAbsorbed) })}</span>
          </div>
        )}
      </div>

      {/* Inventory purchase note */}
      {projection.isInventoryPurchase && (
        <p className={styles.inventoryNote}>
          <Package size={16} />
          {t('dashboard.projection.inventoryNote')}
        </p>
      )}
    </div>
  )}
</div>
```

**Phosphor icons used:**
- `Calculator` (header icon)
- `X` (close button)
- `CheckCircle` (healthy assessment)
- `Warning` (tight assessment)
- `XCircle` (negative assessment)
- `Package` (inventory purchase note)

All from `@phosphor-icons/react`.

**CRITICAL component design decisions:**
- Component receives ALL data as props — no direct store access
- Pure computation via `useMemo` (SAFER pattern)
- `purchaseAmount` is a string (for input field), converted to agora via `toMinorUnits` for calculations
- Assessment colors use semantic tokens: `$success` (healthy/green), `$warning` (tight/yellow), `$error` (negative/red)
- Icon + text for assessment — never color alone (accessibility)
- Input has `autoFocus` for immediate interaction (per UX: < 2 minute flow)
- Inventory purchase toggle adds contextual note (per AC #6)

#### 3.2 — `src/features/dashboard/components/ForwardProjection.module.scss`

```scss
.projectionPanel {
  @include card-surface;
  padding: $space-lg;
  display: flex;
  flex-direction: column;
  gap: $space-lg;
  margin-block-end: $space-lg;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.headerTitle {
  display: flex;
  align-items: center;
  gap: $space-sm;
  color: $gold;

  h2 {
    font-size: $text-lg;
    font-weight: $font-semibold;
    margin: 0;
  }
}

.closeButton {
  @include interactive-reset;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: $radius-full;
  color: $text-muted;
  transition: background-color $transition-fast, color $transition-fast;

  &:hover {
    background: $bg-elevated;
    color: $text-primary;
  }
}

/* Financial Snapshot Grid */
.snapshotGrid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: $space-sm;
}

.snapshotItem {
  @include elevated-surface;
  padding: $space-md;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-xs;
  text-align: center;
}

.snapshotLabel {
  font-size: $text-xs;
  color: $text-muted;
  font-weight: $font-medium;
}

.snapshotValue {
  font-size: $text-sm;
  font-weight: $font-semibold;
  color: $text-primary;
}

.locked {
  color: $text-secondary;
  text-decoration: line-through;
  text-decoration-color: rgba($text-secondary, 0.4);
}

.bufferValue {
  color: $gold;
  font-size: $text-base;
}

/* Purchase Input */
.inputSection {
  display: flex;
  flex-direction: column;
  gap: $space-sm;
}

.inputLabel {
  font-size: $text-sm;
  color: $text-secondary;
  font-weight: $font-medium;
}

.inputWrap {
  display: flex;
  align-items: center;
  background: $bg-secondary;
  border: 1px solid $border-subtle;
  border-radius: $radius-md;
  overflow: hidden;
  transition: border-color $transition-fast;

  &:focus-within {
    border-color: $gold;
  }
}

.currencyPrefix {
  padding-inline-start: $space-md;
  font-size: $text-lg;
  font-weight: $font-semibold;
  color: $text-secondary;
}

.purchaseInput {
  flex: 1;
  padding: $space-md;
  font-size: $text-lg;
  font-family: $font-family;
  background: transparent;
  border: none;
  outline: none;
  color: $text-primary;
  min-height: 44px;

  &::placeholder {
    color: $text-muted;
  }
}

.checkboxLabel {
  display: flex;
  align-items: center;
  gap: $space-xs;
  font-size: $text-xs;
  color: $text-secondary;
  cursor: pointer;

  svg {
    color: $text-muted;
  }
}

.checkbox {
  accent-color: $gold;
  width: 16px;
  height: 16px;
}

/* Projection Result */
.result {
  padding: $space-lg;
  border-radius: $radius-md;
  display: flex;
  flex-direction: column;
  gap: $space-md;
}

.assessmentHealthy {
  background: rgba($success, 0.10);
  border: 1px solid rgba($success, 0.3);
}

.assessmentTight {
  background: rgba($warning, 0.10);
  border: 1px solid rgba($warning, 0.3);
}

.assessmentNegative {
  background: rgba($error, 0.10);
  border: 1px solid rgba($error, 0.3);
}

.assessmentHeader {
  display: flex;
  align-items: center;
  gap: $space-sm;
}

.assessmentTitle {
  font-size: $text-sm;
  font-weight: $font-semibold;
  margin: 0;
}

.assessmentHealthy .assessmentHeader {
  color: $success;
}

.assessmentTight .assessmentHeader {
  color: $warning;
}

.assessmentNegative .assessmentHeader {
  color: $error;
}

.resultDetails {
  display: flex;
  flex-direction: column;
  gap: $space-xs;
}

.resultRow {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: $text-sm;
  color: $text-secondary;
  padding: $space-xs 0;

  &:not(:last-child) {
    border-block-end: 1px solid rgba($border-subtle, 0.3);
  }

  span:last-child {
    font-weight: $font-semibold;
    color: $text-primary;
  }
}

.shortfall span:last-child {
  color: $error;
}

.negativeAmount {
  color: $error !important;
}

.inventoryNote {
  display: flex;
  align-items: flex-start;
  gap: $space-xs;
  font-size: $text-xs;
  color: $text-muted;
  margin: 0;
  padding-block-start: $space-xs;
  border-block-start: 1px solid rgba($border-subtle, 0.3);

  svg {
    flex-shrink: 0;
    margin-block-start: 2px;
  }
}

/* Responsive — Mobile */
@media (max-width: $bp-sm) {
  .projectionPanel {
    padding: $space-md;
    gap: $space-md;
  }

  .snapshotGrid {
    grid-template-columns: repeat(2, 1fr);
  }

  .snapshotItem:last-child {
    grid-column: 1 / -1;
  }
}

@media (max-width: $bp-md) {
  .snapshotGrid {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

**CRITICAL SCSS notes (from Story 7.1, 7.2, 7.3 learnings):**
- Use `$error` for red — `$danger` does NOT exist
- Use `$success` for green — verified `#00ba7b`
- Use `$warning` for amber — verified `#fa9700`
- CSS logical properties for RTL: `text-align: start`, `margin-block-end`, `padding-inline-start`
- Touch targets ≥ 44px on mobile (close button: 44×44, input: min-height 44px)
- No explicit `@use` — globals auto-imported via Vite `additionalData`
- Font-size tokens: `$text-lg` NOT `$font-lg`
- `$surface-secondary` does NOT exist — use `$bg-secondary` or `$bg-tertiary`
- Mixins: `@include card-surface`, `@include elevated-surface`, `@include focus-ring`, `@include interactive-reset`
- `$space-2xs` does NOT exist — use `$space-xs` (4px)

#### 3.3 — ForwardProjection Tests

**Test scenarios for `src/features/dashboard/components/ForwardProjection.test.tsx`:**

1. Renders financial snapshot with correct labels and formatted amounts
2. Renders purchase input with ₪ prefix
3. Renders inventory purchase checkbox
4. Shows no projection result when input is empty
5. Shows healthy (green) assessment when buffer covers ≥ 2 months
6. Shows tight (yellow) assessment when buffer covers < 2 months
7. Shows negative (red) assessment when purchase exceeds buffer
8. Shows shortfall amount when buffer goes negative
9. Shows recovery time when pipeline revenue exists
10. Shows inventory note when inventory checkbox is checked
11. Does not show inventory note when checkbox is unchecked
12. Calls onClose when close button is clicked
13. Formats all amounts as currency (₪)
14. Pipeline revenue shows in snapshot

**Mock pattern:**
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, string>) => {
      if (params) return `${key}(${JSON.stringify(params)})`;
      return key;
    },
  }),
}));

const defaultProps = {
  netProfitAgora: 820_000,    // ₪8,200
  taxJarAgora: 287_000,       // ₪2,870
  monthlyOverheadAgora: 320_000, // ₪3,200
  pipelineRevenueAgora: 1_400_000, // ₪14,000
  onClose: vi.fn(),
};
```

#### 3.4 — Update barrel export

Add to `src/features/dashboard/components/index.ts`:
```typescript
export { ForwardProjection } from './ForwardProjection';
```

### Task 4: Integrate into DashboardPage

#### 4.1 — Update `src/features/dashboard/DashboardPage.tsx`

**New imports to ADD:**
```typescript
import { ChartLineUp } from '@phosphor-icons/react';
import { ForwardProjection } from './components';
```

**New state:**
```typescript
const [showProjection, setShowProjection] = useState(false);
```

**Add `pipelineRevenueAgora` to destructured metrics:**
```typescript
const {
  // ... existing fields ...
  pipelineRevenueAgora,
  // ... rest ...
} = useDashboardData();
```

**Add projection trigger button.** Place it after the KPI row section, before the ProjectList. This button is the prominent "Can I afford this?" entry point:

```tsx
{/* Forward Projection Trigger */}
<div className={loaded ? styles.fadeIn : undefined}>
  <button
    className={styles.projectionTrigger}
    onClick={() => setShowProjection((prev) => !prev)}
    aria-expanded={showProjection}
  >
    <ChartLineUp size={20} weight="bold" />
    <span>{t('dashboard.projection.triggerLabel')}</span>
  </button>
</div>

{/* Forward Projection Panel */}
{showProjection && (
  <ForwardProjection
    netProfitAgora={netProfitAgora}
    taxJarAgora={taxJarAgora}
    monthlyOverheadAgora={monthlyOverheadAgora}
    pipelineRevenueAgora={pipelineRevenueAgora}
    onClose={() => setShowProjection(false)}
  />
)}
```

**Placement in JSX (between KPI row and ProjectList):**
```tsx
<div className={styles.page}>
  {/* HeroStat */}
  {/* OsPaturBanner */}
  {/* KPI Row */}

  {/* NEW: Projection trigger + panel */}
  <div className={loaded ? styles.fadeIn : undefined}>
    <button ... />
  </div>
  {showProjection && <ForwardProjection ... />}

  {/* ProjectList */}
</div>
```

**Phosphor icons:** Import `ChartLineUp` from `@phosphor-icons/react`. This icon represents financial growth/projection and is visually distinct from existing dashboard icons (CurrencyCircleDollar, Briefcase, Receipt, Tray).

#### 4.2 — DashboardPage SCSS additions

Add to `src/features/dashboard/DashboardPage.module.scss`:

```scss
.projectionTrigger {
  @include interactive-reset;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $space-sm;
  width: 100%;
  padding: $space-md $space-lg;
  background: $bg-secondary;
  border: 1px dashed rgba($gold, 0.3);
  border-radius: $radius-md;
  color: $text-secondary;
  font-size: $text-sm;
  font-weight: $font-medium;
  font-family: $font-family;
  transition: background-color $transition-fast, color $transition-fast, border-color $transition-fast;
  min-height: 44px;

  &:hover {
    background: $bg-tertiary;
    color: $gold;
    border-color: rgba($gold, 0.5);
  }

  &[aria-expanded="true"] {
    background: $bg-tertiary;
    color: $gold;
    border-color: $gold;
    border-style: solid;
  }
}
```

**Design rationale:** A full-width dashed-border button evokes "add/model something" and stands out from the solid KPI cards above. When active, it switches to a solid gold border indicating the projection panel is open. This follows the "Worth-the-Friction" UX principle — the interaction is clearly discoverable but doesn't compete with the primary KPI row.

#### 4.3 — DashboardPage test updates

Add to `src/features/dashboard/DashboardPage.test.tsx`:

1. Renders projection trigger button
2. Clicking trigger button shows ForwardProjection panel
3. ForwardProjection receives correct props from useDashboardData
4. Clicking close in ForwardProjection hides the panel
5. Trigger button has aria-expanded attribute

**Mock update:** The useDashboardData mock must now include `pipelineRevenueAgora` in the returned value.

### Task 5: i18n Keys

#### 5.1 — English (`en.json`)

Add inside existing `dashboard` key (after `osPatur`):

```json
"projection": {
  "triggerLabel": "Can I afford this?",
  "title": "Forward Projection",
  "netProfit": "Net Profit",
  "taxJar": "Tax Jar (locked)",
  "overhead": "Monthly Overhead",
  "buffer": "Available Buffer",
  "pipeline": "Pipeline Revenue",
  "inputLabel": "Proposed Purchase",
  "inputPlaceholder": "Enter amount...",
  "inventoryPurchase": "Inventory / bulk purchase",
  "assessment": {
    "healthy": "You have headroom. Overhead and Tax Jar are covered.",
    "tight": "Tight — next month's overhead is covered, but limited buffer.",
    "negative": "This purchase would exceed your available buffer."
  },
  "bufferAfter": "Buffer After Purchase",
  "coverageMonths": "Coverage",
  "months": "{{count}} months",
  "shortfall": "Shortfall",
  "recoveryTime": "Recovery Time",
  "inventoryNote": "Investment consumed across future projects via Scoops — one-time hit, not recurring."
}
```

#### 5.2 — Hebrew (`he.json`)

Add inside existing `dashboard` key:

```json
"projection": {
  "triggerLabel": "אפשר לקנות את זה?",
  "title": "תחזית פיננסית",
  "netProfit": "רווח נקי",
  "taxJar": "צנצנת מס (נעול)",
  "overhead": "הוצאות חודשיות",
  "buffer": "באפר זמין",
  "pipeline": "הכנסות צפויות",
  "inputLabel": "רכישה מוצעת",
  "inputPlaceholder": "הכנס סכום...",
  "inventoryPurchase": "רכישת מלאי / סיטונאי",
  "assessment": {
    "healthy": "יש לך מרווח. הוצאות וצנצנת מס מכוסים.",
    "tight": "צפוף — החודש הבא מכוסה, אבל באפר מוגבל.",
    "negative": "הרכישה הזו תחרוג מהבאפר הזמין שלך."
  },
  "bufferAfter": "באפר לאחר רכישה",
  "coverageMonths": "כיסוי",
  "months": "{{count}} חודשים",
  "shortfall": "חוסר",
  "recoveryTime": "זמן התאוששות",
  "inventoryNote": "השקעה שנצרכת לאורך פרויקטים עתידיים דרך סקופים — הוצאה חד-פעמית, לא חוזרת."
}
```

### Project Structure Notes

**Files to CREATE (5 new files):**
```
src/lib/projection.ts                                           # Projection calculation utilities
src/lib/projection.test.ts                                      # Projection utility tests
src/features/dashboard/components/ForwardProjection.tsx          # Main projection UI
src/features/dashboard/components/ForwardProjection.module.scss  # Projection panel styles
src/features/dashboard/components/ForwardProjection.test.tsx     # Component tests
```

**Files to MODIFY (9 files):**
```
src/lib/index.ts                                                 # Export projection utilities
src/features/dashboard/hooks/useDashboardData.ts                 # Add pipelineRevenueAgora computation
src/features/dashboard/hooks/useDashboardData.test.ts            # Add pipeline revenue tests
src/features/dashboard/DashboardPage.tsx                         # Add projection trigger + panel
src/features/dashboard/DashboardPage.module.scss                 # Add projection trigger styles
src/features/dashboard/DashboardPage.test.tsx                    # Add projection integration tests
src/features/dashboard/components/index.ts                       # Export ForwardProjection
src/i18n/en.json                                                 # Add dashboard.projection.* keys
src/i18n/he.json                                                 # Add Hebrew translations
```

**Files that must NOT be modified:**
- `src/stores/useWorkOrderStore.ts` — store is unchanged, already has all needed fields
- `src/stores/useTransactionStore.ts` — store is unchanged
- `src/stores/useOverheadStore.ts` — store is unchanged, `calculateBurn` already exported
- `src/stores/useSystemConfigStore.ts` — store is unchanged
- `src/stores/index.ts` — already exports all stores
- `src/types/index.ts` — already exports all types
- `src/types/workOrder.ts` — WorkOrder type already has `revenueTotalAgora`, `status`
- `src/types/transaction.ts` — Transaction type already has `workOrderId`, `category`
- `src/types/config.ts` — SystemConfig is unchanged
- `src/router.tsx` — no new routes needed (projection is inline in DashboardPage)
- `src/hooks/useFirestoreDoc.ts` — unchanged
- `src/hooks/useFirestoreCollection.ts` — unchanged
- `src/lib/currency.ts` — unchanged, `formatCurrency`, `toMinorUnits`, `toIlsAgora` already exported
- `src/lib/taxJar.ts` — unchanged, `calculateTaxReserve` already used by useDashboardData
- `functions/` — no Cloud Function changes

### Existing Components to Reuse

| Component | Location | Usage |
|---|---|---|
| `useDashboardData` | `src/features/dashboard/hooks/useDashboardData.ts` | All financial metrics + new pipeline revenue |
| `calculateTaxReserve` | `src/lib/taxJar.ts` | Already used by useDashboardData for Tax Jar |
| `calculateBurn` | `src/stores/useOverheadStore.ts` | Already used by useDashboardData for overhead |
| `formatCurrency` | `src/lib/currency.ts` | Amount formatting in agora → display |
| `toMinorUnits` | `src/lib/currency.ts` | Display amount → agora conversion (purchase input) |
| `toIlsAgora` | `src/lib/currency.ts` | Multi-currency transaction → ILS (pipeline revenue) |
| `toDisplayAmount` | `src/lib/currency.ts` | Agora → display amount (if needed) |
| `KpiCard` | `src/features/dashboard/components/KpiCard.tsx` | Pattern reference for metric display |
| `OsPaturBanner` | `src/features/dashboard/components/OsPaturBanner.tsx` | Pattern reference for colored assessment banner |
| `TaxJarSettings` | `src/features/overhead/components/TaxJarSettings.tsx` | Pattern reference for inline panel (toggle open/close) |
| `Button` | `src/components/Button/Button.tsx` | Standard button if needed |
| `Skeleton` | `src/components/Skeleton/Skeleton.tsx` | Loading states |

### Critical Import Patterns

```typescript
// Types
import type { WorkOrder, Transaction, SystemConfig } from '@/types';

// Stores (NEVER import these in ForwardProjection component — only in hooks/pages)
import { useWorkOrderStore, useTransactionStore, useSystemConfigStore, useOverheadStore, calculateBurn } from '@/stores';

// Lib utilities
import { formatCurrency, toMinorUnits, toIlsAgora } from '@/lib';
import { calculateTaxReserve } from '@/lib';
import {
  buildFinancialSnapshot,
  calculateProjection,
  calculateAvailableBuffer,
  type FinancialSnapshot,
  type ProjectionResult,
  type ProjectionAssessment,
} from '@/lib';

// Phosphor icons
import { Calculator, ChartLineUp, X, CheckCircle, Warning, XCircle, Package } from '@phosphor-icons/react';

// i18n
import { useTranslation } from 'react-i18next';
```

### Testing Patterns

**Framework:** Vitest + React Testing Library
**Co-located:** `*.test.ts` / `*.test.tsx` next to source files

**ForwardProjection test setup:**
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, string>) => {
      if (params) return `${key}(${JSON.stringify(params)})`;
      return key;
    },
  }),
}));

const defaultProps = {
  netProfitAgora: 820_000,       // ₪8,200
  taxJarAgora: 287_000,          // ₪2,870
  monthlyOverheadAgora: 320_000, // ₪3,200
  pipelineRevenueAgora: 1_400_000, // ₪14,000
  onClose: vi.fn(),
};
```

**DashboardPage test mock update:**
The existing `useDashboardData` mock must be extended with `pipelineRevenueAgora`:
```typescript
vi.mock('./hooks', () => ({
  useDashboardData: vi.fn(() => ({
    // ... existing mocked fields ...
    pipelineRevenueAgora: 1_400_000,
  })),
}));
```

**Projection utility tests (pure functions — no mocks needed):**
```typescript
import { describe, it, expect } from 'vitest';
import { calculateProjection, buildFinancialSnapshot, getAssessment } from './projection';

describe('calculateProjection', () => {
  it('healthy: large buffer covers ≥ 2 months', () => {
    const snapshot = buildFinancialSnapshot(1_000_000, 200_000, 150_000, 500_000);
    const result = calculateProjection(snapshot, 100_000);
    expect(result.assessment).toBe('healthy');
    expect(result.bufferAfterPurchaseAgora).toBeGreaterThan(0);
    expect(result.shortfallAgora).toBe(0);
  });
});
```

### Cross-Epic Context

- **Story 7.1 (done):** Created overhead data model, store, page. Overhead data used for monthly burn rate in projection.
- **Story 7.2 (done):** Added burn rate delta and category proportions. `calculateBurn` function used in `useDashboardData`.
- **Story 7.3 (done):** Tax Jar configuration + Osek Patur alert. Tax Jar reserve is a key input to the projection (locked/reserved funds).
- **Epic 3 (Stories 3.1–3.3, done):** Dashboard KPI cards, hero stat, project health table. Forward Projection integrates alongside these.
- **Epic 2 (done):** Work Orders with `revenueTotalAgora` and status lifecycle. Pipeline revenue derived from Production/Shipped WOs.
- **Epic 5 (done):** Transaction approval with `workOrderId` linkage. Approved Revenue transactions reduce unrealized pipeline revenue.

### Git Intelligence (from Epic 7 implementation)

Recent commits:
- `5a5d462` — Implement Story 7.3: Tax Jar Configuration & Osek Patur Alert with code review fixes
- `446c835` — Fix infinite re-render loop in OverheadPage (React 19 + Zustand v5)
- `0873822` — Implement Story 7.2: Monthly Overhead Burn Rate & Trends with code review fixes
- `73b2fa6` — Implement Story 7.1: Overhead Data Model & Expense Management with code review fixes
- `d6321ee` — Fix undefined $surface-secondary SCSS variable in 4 files
- `3a7fe9d` — Fix undefined SCSS variables: replace $font-* with $text-* for font-size tokens

**Learnings from Epic 7 stories (all applied in this story):**

1. **[CRITICAL] React 19 + Zustand v5 SAFER pattern** — No selectors returning new arrays. Use `useMemo` from full store state. ForwardProjection receives all data as props (cleanest solution).
2. **[CRITICAL] SCSS variable gotchas** — `$danger` doesn't exist (use `$error`), `$surface-secondary` doesn't exist (use `$bg-secondary`), `$space-2xs` doesn't exist (use `$space-xs`), `$font-lg` doesn't exist (use `$text-lg`).
3. **[HIGH] Code review test deletion pattern** — Story 7.3 code review found the dev agent replaced all existing tests in `taxJar.test.ts`. This story creates NEW test files (`projection.test.ts`, `ForwardProjection.test.tsx`) — no risk of deleting existing tests. When modifying existing test files (`useDashboardData.test.ts`, `DashboardPage.test.tsx`), ADD tests — never replace.
4. **[MEDIUM] Touch target minimum** — 44px on all interactive elements (Story 7.3 code review caught 28px dismiss button).
5. **[LOW] CSS logical properties** — Always use `text-align: start`, `margin-block-end`, `padding-inline-start` for RTL support.
6. **[LOW] Firestore write pattern** — Not applicable to this story (no writes needed — projection is read-only computation).

### Zod v4 Reminders (from Story 7.1)

- No schema changes needed for this story — all types are unchanged
- If you need to validate projection input, use plain TypeScript (no Zod needed for simple number validation)

### SCSS Token Reference (Quick Look-Up)

**Colors:** `$success` (#00ba7b / green), `$warning` (#fa9700 / amber), `$error` (#ff4d6d / red), `$gold` (#fcb700), `$info` (#2a7eff)
**Backgrounds:** `$bg-primary` → `$bg-secondary` → `$bg-tertiary` → `$bg-elevated` (dark to light)
**Text:** `$text-primary` (#ffd54f), `$text-secondary` (70% opacity), `$text-muted` (50% opacity)
**Spacing:** `$space-xs` (4), `$space-sm` (8), `$space-md` (16), `$space-lg` (24), `$space-xl` (32)
**Font sizes:** `$text-xs` (14px), `$text-sm` (16px), `$text-base` (18px), `$text-lg` (20px), `$text-xl` (30px), `$text-2xl` (40px)
**Font weights:** `$font-regular` (400), `$font-medium` (500), `$font-semibold` (600)
**Breakpoints:** `$bp-sm` (640px), `$bp-md` (768px), `$bp-lg` (1024px)
**Radii:** `$radius-sm` (8), `$radius-md` (12), `$radius-lg` (16), `$radius-xl` (24), `$radius-full` (9999)
**Transitions:** `$transition-fast` (150ms), `$transition-normal` (300ms), `$transition-slow` (500ms)
**Mixins:** `@include card-surface`, `@include elevated-surface`, `@include focus-ring`, `@include interactive-reset`

### Performance

- `buildFinancialSnapshot` + `calculateProjection` are O(1) — simple arithmetic. Called once per input change — negligible.
- Pipeline revenue computation in `useDashboardData` is O(w × t) where w = work orders and t = transactions. For a small business (< 100 WOs, < 1000 txns), this is well under 1ms.
- `useMemo` prevents recalculation unless store data actually changes.
- No new Firestore subscriptions — all data comes from existing subscriptions in `useDashboardData`.
- ForwardProjection component is conditionally rendered (`showProjection && ...`) — zero cost when hidden.

### Accessibility Notes

- Projection trigger button has `aria-expanded` attribute
- Close button has `aria-label`
- Assessment uses icon + text + color — never color alone
- Color semantics: green (`$success`) = healthy, amber (`$warning`) = caution, red (`$error`) = alert
- Purchase input has associated `<label>` via `htmlFor`/`id`
- Checkbox uses native `<input type="checkbox">` for keyboard accessibility
- All interactive elements have `focus-visible` ring via `@include interactive-reset`
- `role="alert"` is NOT used here (projection is user-initiated, not system-initiated like OsPaturBanner)
- Number input has `min={0}` and `step={100}` for better UX

### UX Design Alignment

**From UX Spec:**
- "Can I Afford This?" is a **Critical Success Moment** — under 60 seconds from dashboard to answer
- Forward projection is a **"Worth-the-Friction" interaction** — complexity earned by value
- Projections are **drill-down views** — not shown by default, activated on demand
- **"Empower, Never Alarm"** — green/yellow/red are informative, not stressful. The green "headroom" message is encouraging; the red "exceed buffer" is factual, not alarming.

**Journey 3 flow (from UX Spec):**
1. Ben asks "Can we afford ₪2,800?"
2. Gal opens Dashboard (sees Net Profit in HeroStat)
3. Clicks "Can I afford this?" button
4. Enters ₪2,800
5. System shows: buffer after purchase, overhead covered, Tax Jar safe
6. Gal decides: "Go for it. We have headroom."
7. Total time: < 2 minutes

### References

- [Source: epics.md — Epic 7, Story 7.4: Forward Financial Projection]
- [Source: prd.md — FR6: Gal can view a forward financial projection showing cash flow impact of a potential purchase over the next 3–6 months]
- [Source: prd.md — Journey 3: The Spending Decision (Forward Projection)]
- [Source: architecture.md — Forward Projection component not named — Will be component in `src/features/dashboard/components/`]
- [Source: architecture.md — State Management: One store per domain, no business logic in stores]
- [Source: architecture.md — Feature Module Boundaries: Features never import from other features]
- [Source: architecture.md — Data Flow: Firestore → Zod → Store → Component]
- [Source: ux-design-specification.md — Journey 3: Spending Decision flow diagram]
- [Source: ux-design-specification.md — Critical Success Moments: "Can I Afford This?" Answer]
- [Source: ux-design-specification.md — Worth-the-Friction: Forward projection modeling]
- [Source: ux-design-specification.md — Drill-Down Views: Projections are not on main dashboard surface]
- [Source: ux-design-specification.md — Emotional Design: "Empower, Never Alarm"]
- [Source: ux-design-specification.md — Financial Semantic Colors: $success/$warning/$error for assessment]
- [Source: src/features/dashboard/hooks/useDashboardData.ts — Existing dashboard metrics computation]
- [Source: src/types/workOrder.ts — WorkOrder.revenueTotalAgora, WorkOrder.status]
- [Source: src/types/transaction.ts — Transaction.workOrderId, Transaction.category]
- [Source: src/lib/currency.ts — formatCurrency, toMinorUnits, toIlsAgora]
- [Source: src/lib/taxJar.ts — calculateTaxReserve]
- [Source: src/stores/useOverheadStore.ts — calculateBurn]
- [Source: 7-3-tax-jar-configuration-osek-patur-alert.md — SAFER pattern, SCSS patterns, test patterns]
- [Source: git commit 446c835 — Fix infinite re-render loop (React 19 + Zustand v5)]

## Dev Agent Record

### Agent Model Used

Claude claude-4.6-opus (Cursor Agent)

### Debug Log References

- Fixed test scenario values: healthySnapshot netProfit increased from 2M to 3M agora to correctly produce "healthy" assessment (buffer/monthlyCost >= 2).

### Completion Notes List

- **Task 1:** Created `src/lib/projection.ts` with 6 pure functions: `calculateAvailableBuffer`, `buildFinancialSnapshot`, `calculateMonthlyCoverage`, `calculateMonthsUntilAbsorbed`, `getAssessment`, `calculateProjection`. All monetary values in agora (integer). 27 unit tests passing.
- **Task 2:** Extended `useDashboardData` with `pipelineRevenueAgora` computation. Filters Production/Shipped WOs, subtracts realized Revenue transactions per WO, clamps to 0. Added 5 tests to existing test file (no existing tests modified). 24 total tests passing.
- **Task 3:** Created `ForwardProjection` component with financial snapshot grid, purchase input (₪ prefix), inventory toggle, and tri-color assessment (healthy/tight/negative with icon + text). SCSS uses `$success`/`$warning`/`$error` tokens. Responsive grid: 5-col → 3-col → 2-col. 15 component tests passing.
- **Task 4:** Integrated into DashboardPage with "Can I afford this?" trigger button (dashed gold border, ChartLineUp icon). Toggle open/close with `aria-expanded`. ForwardProjection receives all data as props from useDashboardData. 5 new integration tests + all 21 existing tests passing (26 total).
- **Task 5:** Added `dashboard.projection.*` i18n keys to both `en.json` and `he.json`. 17 keys covering labels, assessments, and the inventory note.

### Change Log

- 2026-02-14: Implemented Story 7.4 — Forward Financial Projection (all 5 tasks, all ACs satisfied)

### File List

**New files (5):**
- `src/lib/projection.ts`
- `src/lib/projection.test.ts`
- `src/features/dashboard/components/ForwardProjection.tsx`
- `src/features/dashboard/components/ForwardProjection.module.scss`
- `src/features/dashboard/components/ForwardProjection.test.tsx`

**Modified files (9):**
- `src/lib/index.ts`
- `src/features/dashboard/hooks/useDashboardData.ts`
- `src/features/dashboard/hooks/useDashboardData.test.ts`
- `src/features/dashboard/DashboardPage.tsx`
- `src/features/dashboard/DashboardPage.module.scss`
- `src/features/dashboard/DashboardPage.test.tsx`
- `src/features/dashboard/components/index.ts`
- `src/i18n/en.json`
- `src/i18n/he.json`
