# Story 2.4: Nutrition Label & Margin Calculations

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As **Gal**,
I want to see a financial "Nutrition Label" for each project showing revenue, all cost types, buffer, and net profit with a live margin,
So that I know the true profitability of every game I'm building.

## Acceptance Criteria

1. **NutritionLabel Component Layout**: `src/features/work-orders/components/NutritionLabel.tsx` renders for a Work Order and displays in order: Revenue (total), Direct Costs (sum of DirectCost transactions), Inventory Costs / Scoops (placeholder showing ₪0 until Epic 6), Overhead Allocation (proportional share from `overheadAllocationAgora` field), Unforeseen Buffer (5% of total costs), Net Profit (Revenue - all costs - buffer). Each line shows the amount formatted via `formatCurrency`.

2. **Margin Calculation with Buffer**: margin = (Revenue - Total Costs - Buffer) / Revenue × 100. Margin ≥ 30% renders in `$success` green with a healthy indicator. Margin 20–29% renders in `$warning` yellow. Margin < 20% renders in `$error` red with a warning icon. If Revenue is 0, margin shows "—" (no division by zero). A visual margin progress bar accompanies the percentage.

3. **Expandable Cost Categories**: Direct Costs and Inventory Costs sections are expandable/collapsible. Expanding Direct Costs shows individual transactions (vendor name, amount, currency, date) that contribute to the total. Expanding Inventory Costs shows "No scoops yet" placeholder until Epic 6. Expand/collapse toggles are touch-friendly (≥ 44px tap targets).

4. **Overhead Allocation Display**: Shows the Work Order's `overheadAllocationAgora` value. If no overhead exists yet (value is 0), shows ₪0. Overhead allocation calculation logic (equal split across active Production WOs) is deferred to Epic 7 — the NutritionLabel just displays whatever is stored on the WO.

5. **Buffer Calculation**: `BUFFER_PERCENTAGE = 0.05` (5% constant). `calculateBuffer(totalCostAgora): number` returns `Math.round(totalCostAgora * 0.05)`. Buffer line in the label shows this computed value. Buffer is subtracted from net profit.

6. **Margin Utility Extension**: `calculateMargin(revenueAgora, totalCostAgora, bufferAgora?)` in `src/lib/margins.ts` accepts an optional third parameter for buffer. Formula: `(revenueAgora - totalCostAgora - bufferAgora) / revenueAgora * 100`. Backward-compatible — existing callers without buffer still work. Co-located tests verify edge cases (zero revenue, zero cost, negative margin, buffer included).

7. **Shimmer Loading State**: NutritionLabel accepts a `loading` prop. When `loading` is true, amount values display a shimmer overlay (using the existing `shimmer` keyframe from `_animations.scss`). During recalculation after a transaction change, the shimmer briefly appears on affected values.

8. **Mobile Responsive**: On small viewports, the NutritionLabel renders in a single-column layout. All expand/collapse controls are touch-friendly (≥ 44px). All currency amounts are formatted with proper symbols. The component remains fully readable without horizontal scrolling.

## Tasks / Subtasks

- [x] Task 1: Extend Margin Utilities with Buffer Support (AC: #5, #6)
  - [x] Add `BUFFER_PERCENTAGE = 0.05` constant to `src/lib/margins.ts`
  - [x] Add `calculateBuffer(totalCostAgora: number): number` function — returns `Math.round(totalCostAgora * BUFFER_PERCENTAGE)`
  - [x] Update `calculateMargin` signature to `calculateMargin(revenueAgora: number, totalCostAgora: number, bufferAgora: number = 0): number`
  - [x] Update formula: `(revenueAgora - totalCostAgora - bufferAgora) / revenueAgora * 100`
  - [x] Verify backward compatibility: existing callers pass 0 args for buffer, behavior unchanged
  - [x] Export `BUFFER_PERCENTAGE` and `calculateBuffer` from `src/lib/margins.ts`
  - [x] Verify `src/lib/index.ts` already exports `./margins` (it does)
  - [x] Update `src/lib/margins.test.ts` with new tests:
    - `calculateBuffer` returns 5% of total cost
    - `calculateBuffer` returns 0 for 0 cost
    - `calculateBuffer` rounds to nearest integer
    - `calculateMargin` with buffer: reduces margin correctly
    - `calculateMargin` with buffer=0: same as without buffer (backward compat)
    - `calculateMargin` with buffer: zero revenue returns 0

- [x] Task 2: NutritionLabel Component (AC: #1, #2, #3, #4, #7, #8)
  - [x] Create `src/features/work-orders/components/NutritionLabel.tsx`
  - [x] Props interface: `workOrder: WorkOrder`, `transactions: Transaction[]`, `loading?: boolean`
  - [x] Compute derived values:
    - `directCostTransactions`: filter transactions where `category === 'DirectCost'` and `workOrderId === workOrder.id`
    - `revenueAgora`: from `workOrder.revenueTotalAgora`
    - `directCostAgora`: from `workOrder.directCostAgora`
    - `inventoryCostAgora`: from `workOrder.inventoryCostAgora`
    - `overheadAgora`: from `workOrder.overheadAllocationAgora`
    - `totalCostAgora`: `directCostAgora + inventoryCostAgora + overheadAgora`
    - `bufferAgora`: `calculateBuffer(totalCostAgora)`
    - `netProfitAgora`: `revenueAgora - totalCostAgora - bufferAgora`
    - `margin`: `calculateMargin(revenueAgora, totalCostAgora, bufferAgora)`
    - `marginStatus`: `getMarginStatus(margin)`
    - `hasRevenue`: `revenueAgora > 0`
  - [x] Revenue line: label + formatted amount
  - [x] Direct Costs line: expandable — label + amount, click expands to show individual transactions
  - [x] Inventory Costs line: expandable — label + amount, click expands to show "No scoops yet" placeholder
  - [x] Overhead Allocation line: label + amount (static, no expansion)
  - [x] Separator divider
  - [x] Total Costs line: label + summed amount
  - [x] Buffer line: label with "(5%)" + computed amount
  - [x] Separator divider
  - [x] Net Profit line: label + amount (bold, primary color)
  - [x] Margin display: percentage with color-coded status icon + margin progress bar
  - [x] Expand state: `expandedDirectCosts: boolean`, `expandedInventoryCosts: boolean` via `useState`
  - [x] Loading state: when `loading=true`, show shimmer overlay on amount values
  - [x] Shimmer uses same gradient/animation as Skeleton component pattern
  - [x] Margin status icon: CheckCircle (healthy), Warning (watch/danger)
  - [x] All text via i18n `t()` function
  - [x] All amounts via `formatCurrency()`
  - [x] All CSS via logical properties

- [x] Task 3: NutritionLabel SCSS Styles (AC: #1, #2, #7, #8)
  - [x] Create `src/features/work-orders/components/NutritionLabel.module.scss`
  - [x] Card-like container using `@include card-surface`
  - [x] Row layout: label on start, amount on end (flexbox with `justify-content: space-between`)
  - [x] Expandable sections: chevron rotation on toggle
  - [x] Nested transaction list: indented, smaller font, muted text
  - [x] Divider lines: `$border-subtle`
  - [x] Net Profit row: larger font, `$gold` color, font-weight `$font-semibold`
  - [x] Margin bar: same pattern as WorkOrderCard margin bar but wider
  - [x] Color classes: `.marginHealthy` (`$success`), `.marginWatch` (`$warning`), `.marginDanger` (`$error`)
  - [x] Shimmer overlay: `.shimmer` class using `shimmer` keyframe animation with `linear-gradient` background
  - [x] Mobile responsive: single-column, stacked layout below `$bp-sm`
  - [x] Touch targets: expand/collapse buttons minimum 44px tap area
  - [x] CSS logical properties throughout — no `left`/`right`
  - [x] Reduce motion: respect `prefers-reduced-motion` for shimmer

- [x] Task 4: i18n Translation Keys (AC: all)
  - [x] Add `nutritionLabel` namespace to `src/i18n/en.json`:
    - `title`, `revenue`, `directCosts`, `inventoryCosts`, `overheadAllocation`, `buffer`, `totalCosts`, `netProfit`, `margin`
    - `noTransactions`, `noScoops`, `expand`, `collapse`
    - Transaction detail labels: `vendor`, `amount`, `date`
  - [x] Add `nutritionLabel` namespace to `src/i18n/he.json` with Hebrew translations
  - [x] Do NOT modify existing keys in other namespaces

- [x] Task 5: Update Barrel Exports (AC: all)
  - [x] Add `NutritionLabel` to `src/features/work-orders/components/index.ts` export

- [x] Task 6: Tests (AC: all)
  - [x] Create `src/features/work-orders/components/NutritionLabel.test.tsx`
  - [x] Tests:
    - Renders all financial lines in correct order (Revenue, Direct Costs, Inventory, Overhead, Total, Buffer, Net Profit)
    - Formats all amounts via formatCurrency
    - Shows correct margin percentage with color class
    - Shows "—" when revenue is 0
    - Expanding Direct Costs shows individual transactions
    - Expanding Inventory Costs shows "No scoops yet" placeholder
    - Buffer is 5% of total costs
    - Net Profit = Revenue - Total Costs - Buffer
    - Margin uses color: green ≥30%, yellow 20-29%, red <20%
    - Warning icon shows for danger margin
    - Shimmer overlay shows when loading=true
    - Shimmer does not show when loading=false or undefined
    - Handles empty transactions array (all zeros)
    - Handles WO with only revenue (no costs)
    - Mobile: expand/collapse buttons have accessible labels

- [x] Task 7: Build Verification (AC: all)
  - [x] `tsc --noEmit` — zero TypeScript errors
  - [x] `npm run lint` — zero warnings
  - [x] `npm run test` — all tests pass (existing 441 + new tests, zero regressions)
  - [x] `npm run build` — succeeds

## Dev Notes

### Architecture Compliance

- **SCSS Modules only**: All component styling via `*.module.scss`. Tokens and mixins are auto-imported via Vite `additionalData` — use `$gold`, `$success`, `$warning`, `$error`, `@include card-surface`, `@include focus-ring`, etc. directly in `.module.scss` files without explicit `@use` statements. [Source: architecture.md#Implementation-Patterns]
- **CSS Logical Properties ONLY**: NEVER use `left`/`right`/`text-align: left`. Use `inline-start`/`inline-end`, `margin-inline`, `padding-inline`, `text-align: start`. All components must work in both RTL and LTR. [Source: architecture.md#Enforcement-Guidelines]
- **Path aliases**: `@/` prefix for all imports. Import from `@/components`, `@/lib`, `@/stores`, `@/types`, etc. [Source: architecture.md#Structure-Patterns]
- **Barrel exports**: Every directory exports through `index.ts`. Consumers import from the directory, not individual files. `import { Button, Card, Badge } from '@/components'` — NOT `import { Button } from '@/components/Button/Button'`. [Source: architecture.md#Structure-Patterns]
- **Co-located tests**: `*.test.tsx` / `*.test.ts` next to the component file, NOT in `__tests__/`. [Source: architecture.md#Structure-Patterns]
- **Naming conventions**: Components PascalCase (`NutritionLabel.tsx`), SCSS modules PascalCase (`NutritionLabel.module.scss`), SCSS class names camelCase (`.costRow`, `.marginBar`), hooks `use` prefix, utility functions camelCase (`calculateBuffer`), types PascalCase no `I` prefix, constants UPPER_SNAKE_CASE (`BUFFER_PERCENTAGE`). [Source: architecture.md#Naming-Patterns]
- **Feature module boundaries**: Features in `src/features/` are self-contained. Features import from `@/components`, `@/stores`, `@/lib`, `@/types`. Features NEVER import from other features directly. [Source: architecture.md#Architectural-Boundaries]
- **Data flow**: Firestore document → Zod schema parse → TypeScript type → Zustand store → React component. Never access Firestore directly from components. [Source: architecture.md#Data-Flow-Patterns]
- **Currency**: All math happens in agora/cents. Formatting to display happens at the component level via `formatCurrency()`. NEVER do raw arithmetic on display amounts. [Source: architecture.md#Data-Flow-Patterns]
- **No white (#fff) text**: All text uses gold scale tokens (`$text-primary`, `$text-secondary`, `$text-muted`). [Source: architecture.md#Naming-Patterns]
- **Phosphor Icons**: `@phosphor-icons/react` v2.1.10. Use for icons. [Source: architecture.md#Implementation-Patterns]

### Critical Technical Constraints

- **Packages already installed** (DO NOT run npm install):
  - `react@^19.2.0`, `react-dom@^19.2.0`
  - `firebase@^12.9.0` — Firestore, Auth, Functions, Storage (modular tree-shakeable API)
  - `zustand@^5.0.11` — client-side state management
  - `zod@^4.3.6` — schema validation and TypeScript inference
  - `react-hook-form@^7.71.1` + `@hookform/resolvers@^5.2.2` — form handling
  - `@phosphor-icons/react@^2.1.10` — icon library
  - `i18next@^25.8.4`, `react-i18next@^16.5.4` — i18n
  - `sass@^1.87.0` — SCSS compilation (Vite native support)

- **NO NEW npm dependencies needed** — everything required for Story 2.4 is already installed.

- **Existing files to MODIFY:**
  - `src/lib/margins.ts` — add `BUFFER_PERCENTAGE`, `calculateBuffer()`, extend `calculateMargin` with optional `bufferAgora` parameter
  - `src/lib/margins.test.ts` — add tests for buffer calculation and extended margin function
  - `src/features/work-orders/components/index.ts` — add `NutritionLabel` export
  - `src/i18n/en.json` — add `nutritionLabel` namespace keys
  - `src/i18n/he.json` — add `nutritionLabel` namespace keys

- **New files to CREATE:**
  - `src/features/work-orders/components/NutritionLabel.tsx`
  - `src/features/work-orders/components/NutritionLabel.module.scss`
  - `src/features/work-orders/components/NutritionLabel.test.tsx`

- **Files NOT to modify:**
  - `src/types/workOrder.ts` — WorkOrder already has `revenueTotalAgora`, `directCostAgora`, `inventoryCostAgora`, `overheadAllocationAgora`
  - `src/types/transaction.ts` — Transaction type already complete
  - `src/stores/useWorkOrderStore.ts` — no store changes
  - `src/stores/useTransactionStore.ts` — no store changes
  - `src/features/work-orders/WorkOrdersPage.tsx` — NutritionLabel integration happens in Story 2.5 (Work Order Detail Page)
  - `src/features/work-orders/WorkOrderDetailPage.tsx` — belongs to Story 2.5
  - `src/lib/currency.ts` — no changes needed
  - `src/lib/index.ts` — already exports `./margins`
  - `src/components/**` — no shared component changes needed

- **SCSS auto-import**: `_variables.scss` and `_mixins.scss` are auto-imported via Vite `additionalData` into every `.module.scss` file. Tokens (`$gold`, `$bg-tertiary`, `$success`, `$warning`, `$error`, `$text-primary`, `$text-secondary`, `$text-muted`, `$border-subtle`, etc.) and mixins (`@include card-surface`, `@include focus-ring`, `@include interactive-reset`, `@include motion-safe`, etc.) are available without `@use` statements.

- **Shimmer pattern**: The existing `shimmer` keyframe is defined in `_animations.scss` and used by the Skeleton component:
  ```scss
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  ```
  Apply shimmer to amount elements: `background-image: linear-gradient(90deg, $bg-tertiary 25%, $bg-elevated 50%, $bg-tertiary 75%); background-size: 200% 100%; animation: shimmer 1.5s ease-in-out infinite;`

- **Test infrastructure**: Vitest + React Testing Library. CSS module mocks and react-i18next mocks already configured globally. Use `await import()` for components with Phosphor icons to avoid jsdom hangs. Use `MemoryRouter` wrapping for route-aware component tests. 441 tests currently passing.

### NutritionLabel Component Design

```typescript
// src/features/work-orders/components/NutritionLabel.tsx

interface NutritionLabelProps {
  workOrder: WorkOrder;
  transactions: Transaction[];
  loading?: boolean;
}
```

**Component Structure:**
```
┌─────────────────────────────────────────────────────────┐
│  📊 Nutrition Label                                     │
│                                                         │
│  Revenue                                ₪15,000.00      │
│  ─────────────────────────────────────────────────────  │
│  ▸ Direct Costs                          ₪5,000.00      │
│  ▸ Inventory Costs (Scoops)                  ₪0.00      │
│    Overhead Allocation                   ₪1,000.00      │
│  ─────────────────────────────────────────────────────  │
│  Total Costs                             ₪6,000.00      │
│  Unforeseen Buffer (5%)                    ₪300.00      │
│  ─────────────────────────────────────────────────────  │
│  Net Profit                              ₪8,700.00      │
│  Margin                                   ✅ 58%        │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░                       │
└─────────────────────────────────────────────────────────┘
```

**When Direct Costs is expanded:**
```
│  ▾ Direct Costs                          ₪5,000.00      │
│    ├ Supplier A          02/01/2026       ₪2,000.00     │
│    ├ Vendor B            02/03/2026       ₪1,500.00     │
│    └ Material Co         02/05/2026       ₪1,500.00     │
```

**Computed values logic:**
```typescript
// Inside component
const directCostTransactions = useMemo(() =>
  transactions.filter(t => t.category === 'DirectCost' && t.workOrderId === workOrder.id),
  [transactions, workOrder.id]
);

const revenueAgora = workOrder.revenueTotalAgora;
const directCostAgora = workOrder.directCostAgora;
const inventoryCostAgora = workOrder.inventoryCostAgora;
const overheadAgora = workOrder.overheadAllocationAgora;
const totalCostAgora = directCostAgora + inventoryCostAgora + overheadAgora;
const bufferAgora = calculateBuffer(totalCostAgora);
const netProfitAgora = revenueAgora - totalCostAgora - bufferAgora;
const margin = calculateMargin(revenueAgora, totalCostAgora, bufferAgora);
const marginStatus = getMarginStatus(margin);
const hasRevenue = revenueAgora > 0;
```

**Expand/collapse pattern:**
```typescript
const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

const toggleSection = (section: string) => {
  setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
};
```

**Shimmer loading pattern:**
```typescript
// Amount display with optional shimmer
function AmountCell({ amount, loading }: { amount: number; loading?: boolean }) {
  if (loading) {
    return <span className={styles.shimmer} aria-hidden="true" />;
  }
  return <span>{formatCurrency(amount)}</span>;
}
```

### Margin Utility Extension Design

```typescript
// src/lib/margins.ts — updated

export const BUFFER_PERCENTAGE = 0.05; // 5% unforeseen buffer

/**
 * Calculate the unforeseen buffer amount (5% of total costs).
 * All amounts in agora (integer).
 */
export function calculateBuffer(totalCostAgora: number): number {
  return Math.round(totalCostAgora * BUFFER_PERCENTAGE);
}

/**
 * Calculate margin percentage from revenue, total costs, and optional buffer.
 * Returns 0 if revenue is 0 (prevents division by zero).
 * All amounts in agora (integer).
 *
 * Formula: (revenue - totalCost - buffer) / revenue × 100
 *
 * Backward compatible: bufferAgora defaults to 0.
 */
export function calculateMargin(
  revenueAgora: number,
  totalCostAgora: number,
  bufferAgora: number = 0
): number {
  if (revenueAgora === 0) return 0;
  return ((revenueAgora - totalCostAgora - bufferAgora) / revenueAgora) * 100;
}
```

**Key design decisions:**
- `bufferAgora` defaults to `0` making the function backward compatible
- Existing callers in `WorkOrderCard` pass only 2 args → buffer is 0 → same behavior as before
- `NutritionLabel` will pass `calculateBuffer(totalCost)` as the third arg for the "true" margin with buffer
- `calculateBuffer` rounds to nearest integer to maintain agora precision
- `BUFFER_PERCENTAGE` is exported as a constant for use in the NutritionLabel display ("5%")

### NutritionLabel SCSS Design

```scss
// src/features/work-orders/components/NutritionLabel.module.scss

.container {
  @include card-surface;
  padding: $space-md;
}

.header {
  display: flex;
  align-items: center;
  gap: $space-sm;
  margin-block-end: $space-md;
}

.title {
  font-size: $text-lg;
  font-weight: $font-semibold;
  color: $gold;
  margin: 0;
}

// Financial rows
.row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-block: $space-sm;
  min-block-size: 36px; // Comfortable touch targets
}

.expandableRow {
  @include interactive-reset;
  display: flex;
  justify-content: space-between;
  align-items: center;
  inline-size: 100%;
  padding-block: $space-sm;
  min-block-size: 44px; // ≥44px touch target per AC
  border-radius: $radius-sm;

  &:hover {
    background-color: rgba($gold, 0.05);
  }
}

.label {
  font-size: $text-sm;
  color: $text-secondary;
  display: flex;
  align-items: center;
  gap: $space-xs;
}

.amount {
  font-size: $text-sm;
  color: $text-primary;
  font-weight: $font-medium;
  font-variant-numeric: tabular-nums;
}

// Shimmer on amounts
.shimmer {
  display: inline-block;
  inline-size: 80px;
  block-size: 16px;
  border-radius: $radius-sm;
  background-color: $bg-tertiary;
  background-image: linear-gradient(90deg, $bg-tertiary 25%, $bg-elevated 50%, $bg-tertiary 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    background-image: none;
  }
}

// Chevron for expandable sections
.chevron {
  transition: transform $transition-fast;
  color: $text-muted;
}

.chevronExpanded {
  transform: rotate(90deg);
}

// Expanded transaction list
.transactionList {
  padding-inline-start: $space-lg;
  margin-block-end: $space-sm;
}

.transactionItem {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-block: $space-xs;
  font-size: $text-xs;
  color: $text-muted;
  border-block-end: 1px solid rgba($border-subtle, 0.3);

  &:last-child {
    border-block-end: none;
  }
}

.transactionVendor {
  flex: 1;
  @include truncate;
}

.transactionDate {
  margin-inline: $space-sm;
  white-space: nowrap;
}

.transactionAmount {
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.placeholder {
  padding-inline-start: $space-lg;
  padding-block: $space-xs;
  font-size: $text-xs;
  color: $text-muted;
  font-style: italic;
}

// Dividers
.divider {
  block-size: 1px;
  background-color: $border-subtle;
  margin-block: $space-xs;
}

// Net profit row (emphasized)
.netProfitRow {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-block: $space-sm;
}

.netProfitLabel {
  font-size: $text-base;
  font-weight: $font-semibold;
  color: $gold;
}

.netProfitAmount {
  font-size: $text-base;
  font-weight: $font-semibold;
  color: $gold;
  font-variant-numeric: tabular-nums;
}

// Margin display
.marginSection {
  display: flex;
  flex-direction: column;
  gap: $space-xs;
  padding-block-start: $space-sm;
}

.marginRow {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.marginLabel {
  font-size: $text-sm;
  color: $text-secondary;
  display: flex;
  align-items: center;
  gap: $space-xs;
}

.marginValue {
  font-size: $text-lg;
  font-weight: $font-semibold;
}

.marginHealthy { color: $success; }
.marginWatch { color: $warning; }
.marginDanger { color: $error; }

.marginBar {
  inline-size: 100%;
  block-size: 6px;
  background-color: rgba($text-muted, 0.15);
  border-radius: 3px;
  overflow: hidden;
}

.marginBarFill {
  block-size: 100%;
  border-radius: 3px;
  transition: inline-size $transition-normal;

  &.marginHealthy { background-color: $success; }
  &.marginWatch { background-color: $warning; }
  &.marginDanger { background-color: $error; }
}

// Mobile responsive
@media (max-width: $bp-sm) {
  .container {
    padding: $space-sm;
  }

  .row, .netProfitRow, .marginRow {
    gap: $space-xs;
  }

  .transactionItem {
    flex-wrap: wrap;
  }

  .transactionDate {
    display: none;
  }
}
```

**Key SCSS patterns:**
- Uses `@include card-surface` for the container (consistent with other cards)
- Uses `@include interactive-reset` for expandable row buttons
- Uses `@include truncate` for long vendor names
- All logical properties — no `left`/`right`
- `font-variant-numeric: tabular-nums` for aligned numbers
- `$transition-fast` for chevron rotation, `$transition-normal` for margin bar
- Touch targets ≥ 44px for expandable rows
- Shimmer respects `prefers-reduced-motion`

### i18n Keys to Add

**English (`src/i18n/en.json`) — new `nutritionLabel` namespace:**
```json
{
  "nutritionLabel": {
    "title": "Nutrition Label",
    "revenue": "Revenue",
    "directCosts": "Direct Costs",
    "inventoryCosts": "Inventory Costs (Scoops)",
    "overheadAllocation": "Overhead Allocation",
    "buffer": "Unforeseen Buffer (5%)",
    "totalCosts": "Total Costs",
    "netProfit": "Net Profit",
    "margin": "Margin",
    "noTransactions": "No direct costs yet",
    "noScoops": "No scoops yet",
    "expand": "Expand {{section}}",
    "collapse": "Collapse {{section}}"
  }
}
```

**Hebrew (`src/i18n/he.json`) — new `nutritionLabel` namespace:**
```json
{
  "nutritionLabel": {
    "title": "תווית תזונה",
    "revenue": "הכנסות",
    "directCosts": "עלויות ישירות",
    "inventoryCosts": "עלויות מלאי (סקופים)",
    "overheadAllocation": "הקצאת תקורה",
    "buffer": "חיץ בלתי צפוי (5%)",
    "totalCosts": "סה\"כ עלויות",
    "netProfit": "רווח נקי",
    "margin": "מרווח",
    "noTransactions": "אין עלויות ישירות עדיין",
    "noScoops": "אין סקופים עדיין",
    "expand": "הרחב {{section}}",
    "collapse": "כווץ {{section}}"
  }
}
```

**Note**: Add as a NEW `nutritionLabel` namespace alongside the existing namespaces. Do NOT modify existing keys.

### Previous Story Intelligence (Story 2.3)

**Key patterns established:**
- `Transaction` type fully defined with `category`, `workOrderId`, `amountAgora`, `currency`, `vendorName`, `date`
- Transaction categories: `DirectCost`, `InventoryRestock`, `Overhead`, `Revenue`, `Personal`
- `useTransactionStore` with `selectByWorkOrder(woId)` selector — can be used to filter transactions per WO
- `formatCurrency(amountAgora, currency?)` for all amount display
- `toIlsAgora()` for converting non-ILS amounts to ILS equivalents
- `isEstimatedCurrency()` for flagging non-ILS amounts
- `calculateMargin(revenueAgora, totalCostAgora)` — WILL BE EXTENDED with optional buffer param
- `getMarginStatus(margin)` — healthy/watch/danger thresholds unchanged
- WorkOrderCard already computes `totalCost = directCostAgora + inventoryCostAgora + overheadAllocationAgora` and `calculateMargin(revenue, totalCost)` — this pattern continues to work after the backward-compatible buffer extension
- `useMemo` for derived data in components (follow same pattern for NutritionLabel computed values)

**Critical learnings from Stories 2.1-2.3:**
- Zod 4 `.default()` creates input/output type divergence with `zodResolver` — DO NOT use `.default()` on form schemas
- SCSS variable is `$bp-sm` not `$breakpoint-sm` — use `$bp-sm` for breakpoint media queries
- SCSS tokens: use `$text-lg` not `$font-size-lg`, use `$font-semibold` not `$font-weight-semibold`
- `$space-2xs` does NOT exist — use `$space-xs` (4px) as smallest spacing token
- `$radius-xs` does NOT exist — use `2px` literal for small border-radius values
- Phosphor icon dynamic imports in jsdom cause slow module loading — use `beforeAll` with 30s timeout
- `await import()` pattern for Phosphor icon imports in tests
- `src/__mocks__/react-i18next.ts` mock returns translation key as string
- `src/__mocks__/css-module.ts` provides Proxy-based CSS module mock
- `MemoryRouter` wrapping for route-aware tests
- 441 tests currently passing

**Story 2.3 Debug Log Learnings:**
- SCSS tokens: `$font-size-lg` → `$text-lg`, `$font-weight-semibold` → `$font-semibold`
- React Compiler lint: `watch()` from react-hook-form triggers lint warning → use `useWatch()` instead
- Multiple `role="alert"` elements in tests → use `getAllByRole('alert')`
- Build flake: `sass-embedded` "Tried writing to closed dispatcher" — transient sandbox issue

### Git Intelligence

**Recent commits (most recent first):**
- `26bc9de` — Implement Story 2.3: Manual Transaction Entry & Cost/Revenue Linkage with code review fixes
- `5691072` — Implement Story 2.2: Work Order Status Lifecycle & List View with code review fixes
- `c05296d` — Implement Story 2.1: Work Order Data Model & CRUD with code review fixes
- `c3f5157` — Implement Story 1.6: Core Shared UI Components & Currency Utilities with code review fixes

**Story 2.3 changes (22 files, 2130 insertions):**
- Created Transaction type system with Zod schemas
- Created Zustand transaction store with selectors
- Created useTransactions hook (Firestore listener)
- Created useTransactionActions (writeBatch for atomic transaction + WO update)
- Created TransactionForm component
- Added currency conversion utilities (toIlsAgora, isEstimatedCurrency)
- Integrated into WorkOrdersPage (transaction form, real count per card)
- Added full i18n support (EN/HE)
- 49 new tests, 441 total passing after code review fixes

**Established code patterns:**
- Single comprehensive commit per story
- Components use Phosphor Icons (imported at top level)
- Inline components within page files (WorkOrderCard is inside WorkOrdersPage.tsx)
- `useMemo` for derived data
- Card uses `<Card>` shared component with `className={styles.card}`
- `@include card-surface` mixin for card-like containers
- All amounts formatted with `formatCurrency()`
- Tests use `beforeAll` with dynamic `await import()` for Phosphor icon modules
- CSS logical properties throughout

### Potential Pitfalls to Avoid

1. **DO NOT forget the backward-compatible `bufferAgora = 0` default** — The existing `WorkOrderCard` calls `calculateMargin(revenue, totalCost)` with 2 args. If you break the signature, the card breaks. The third parameter MUST default to 0.

2. **DO NOT use WO fields and transaction sums interchangeably for the summary** — Use the WO's `directCostAgora` for the summary line (authoritative source, atomically updated). Use the filtered transactions array for the expandable detail list. They should match, but the WO field is the single source of truth for the total.

3. **DO NOT build overhead allocation calculation** — The NutritionLabel just displays `workOrder.overheadAllocationAgora`. The actual overhead calculation (equal split across active Production WOs) is an Epic 7 concern. For now it's always 0.

4. **DO NOT build inventory scoop display** — The Inventory Costs section shows `workOrder.inventoryCostAgora` (currently 0) and the expand shows "No scoops yet" placeholder. Actual scoops are Epic 6.

5. **DO NOT integrate NutritionLabel into any page** — This story creates the component. Story 2.5 (Work Order Detail Page) integrates it into the detail view.

6. **DO NOT use `left`/`right` in CSS** — use CSS logical properties only.

7. **DO NOT use `@use` in `.module.scss` files** — tokens and mixins are auto-imported via Vite.

8. **DO NOT use `$space-2xs` or `$radius-xs`** — they don't exist. Smallest spacing is `$space-xs` (4px). Smallest radius is `$radius-sm` (8px) or use `2px`/`3px` literal.

9. **DO NOT forget `prefers-reduced-motion` for shimmer** — The shimmer animation must be disabled for users who prefer reduced motion. Follow the Skeleton component pattern.

10. **DO NOT forget tabular-nums for amount alignment** — Use `font-variant-numeric: tabular-nums` on all currency amount elements so digits align vertically.

11. **DO NOT compute margin without buffer in NutritionLabel** — The NutritionLabel MUST use `calculateMargin(revenue, totalCost, buffer)` with the buffer. This is the "true" margin. The WorkOrderCard's simpler margin (without buffer) is intentionally different — it's a quick-glance approximation.

12. **DO NOT forget to handle negative net profit** — When costs + buffer exceed revenue, net profit is negative. Display it with the error/danger color. The margin will also be negative.

13. **BE CAREFUL with Phosphor icon imports in tests** — Use `beforeAll` with `await import()` pattern to avoid jsdom hangs. Icons used: `CaretRight` (chevron), `CheckCircle` (healthy margin), `Warning`/`WarningCircle` (danger margin), `ChartBar` or similar for the title icon.

14. **DO NOT modify the WorkOrderCard margin calculation** — The card deliberately uses the simpler 2-arg `calculateMargin` without buffer. This is by design — the card shows a quick estimate, the NutritionLabel shows the full picture with buffer.

15. **REMEMBER: NutritionLabel is a pure display component** — It receives data via props (WorkOrder + Transaction[]), computes derived values, and renders. It does NOT fetch data or subscribe to Firestore. The parent component (in Story 2.5) handles data fetching.

16. **DO NOT use `margin` as a CSS class name** — It conflicts with CSS `margin` property in some tooling. Use `marginSection`, `marginRow`, `marginValue` instead.

### Cross-Story Context (Epic 2)

This is the **fourth story in Epic 2** — it creates the financial breakdown visualization:

- **Story 2.1** (DONE) created the Work Order data model, CRUD operations, basic list view, and form. WorkOrder type has cost/revenue fields (default 0).
- **Story 2.2** (DONE) enhanced the list view with StatusStepper, margin utilities, icon card layout, sorting. Margin calculations show simplified margin without buffer.
- **Story 2.3** (DONE) created the transaction infrastructure — Transaction type, store, hooks, manual entry form, cost/revenue linkage with atomic Firestore batch writes. This made the cost fields on WOs actually update when transactions are added.
- **This story (2.4)** creates the full Nutrition Label component with expandable cost breakdown, 5% buffer calculation, shimmer loading state, and extends margin utilities with buffer support. The NutritionLabel is the "source of truth" financial view for a Work Order.
- **Story 2.5** (next) will create the Work Order Detail Page at `/work-orders/:id` which integrates the NutritionLabel, StatusStepper, transaction list, and "Add Transaction" button pre-linked to the WO. That's where NutritionLabel gets displayed.

**This story's scope**: NutritionLabel component + SCSS styles + margin utility buffer extension + i18n + tests. A self-contained, testable component ready for integration in Story 2.5.

### Project Structure Notes

**New files to create:**

| File | Type | Notes |
|---|---|---|
| `src/features/work-orders/components/NutritionLabel.tsx` | NEW | Full financial breakdown component |
| `src/features/work-orders/components/NutritionLabel.module.scss` | NEW | Component styles |
| `src/features/work-orders/components/NutritionLabel.test.tsx` | NEW | Component tests |

**Files to modify:**

| File | Action | Notes |
|---|---|---|
| `src/lib/margins.ts` | EXTEND | Add `BUFFER_PERCENTAGE`, `calculateBuffer()`, extend `calculateMargin` with optional buffer |
| `src/lib/margins.test.ts` | ADD TESTS | Buffer calculation tests, extended margin function tests |
| `src/features/work-orders/components/index.ts` | ADD EXPORT | `NutritionLabel` |
| `src/i18n/en.json` | ADD KEYS | `nutritionLabel` namespace |
| `src/i18n/he.json` | ADD KEYS | `nutritionLabel` namespace |

**Files NOT to modify:**
- `src/types/workOrder.ts` — schema unchanged, fields already exist
- `src/types/transaction.ts` — type already complete
- `src/stores/useWorkOrderStore.ts` — store unchanged
- `src/stores/useTransactionStore.ts` — store unchanged
- `src/features/work-orders/WorkOrdersPage.tsx` — NutritionLabel is NOT added to any page in this story
- `src/features/work-orders/WorkOrderDetailPage.tsx` — belongs to Story 2.5
- `src/lib/currency.ts` — no changes needed
- `src/lib/index.ts` — already exports `./margins`
- `src/components/**` — no shared component changes

### Existing Code Reference

**WorkOrderCard margin pattern (backward compat reference):**
```typescript
// In WorkOrdersPage.tsx — this code must continue working after calculateMargin extension
const totalCost = order.directCostAgora + order.inventoryCostAgora + order.overheadAllocationAgora;
const margin = calculateMargin(order.revenueTotalAgora, totalCost);
// ↑ This passes 2 args. After extension, bufferAgora defaults to 0. Behavior unchanged.
```

**Shimmer pattern from Skeleton component (reference):**
```scss
// src/components/Skeleton/Skeleton.module.scss — follow this shimmer pattern
.skeleton {
  background-color: $bg-tertiary;
  background-image: linear-gradient(90deg, $bg-tertiary 25%, $bg-elevated 50%, $bg-tertiary 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    background-image: none;
    background-color: $bg-tertiary;
  }
}
```

**Phosphor Icons for NutritionLabel:**
```typescript
import { CaretRight, CheckCircle, WarningCircle, ChartBar } from '@phosphor-icons/react';
// CaretRight → expand/collapse chevron (rotate 90° when expanded)
// CheckCircle → healthy margin indicator
// WarningCircle → danger margin indicator
// ChartBar → section title icon
```

**Amount display with currency:**
```typescript
import { formatCurrency } from '@/lib';
// formatCurrency(amountAgora, currency?) → "₪82.00", "$142.50"
// For NutritionLabel, all amounts are in ILS agora (WO fields are ILS)
// Individual transactions in expand may be in original currency
```

**Transaction amount display in expand section:**
```typescript
// For individual transactions in the expandable list:
// Show amount in ORIGINAL currency: formatCurrency(txn.amountAgora, txn.currency)
// If non-ILS, could optionally show ILS equivalent
```

### References

- [Source: planning-artifacts/epics.md#Story-2.4] — Full acceptance criteria with BDD format
- [Source: planning-artifacts/epics.md#Epic-2] — Epic context and story sequence
- [Source: planning-artifacts/prd.md#FR12] — Nutrition Label view requirement
- [Source: planning-artifacts/prd.md#FR15] — Real-time margin calculations requirement
- [Source: planning-artifacts/prd.md#NFR2] — Post-action refresh < 2s
- [Source: planning-artifacts/architecture.md#Data-Architecture] — Firestore collections, integer currency
- [Source: planning-artifacts/architecture.md#Implementation-Patterns] — Naming, structure, data flow
- [Source: planning-artifacts/architecture.md#Frontend-Architecture] — Component architecture, state management
- [Source: planning-artifacts/architecture.md#Enforcement-Guidelines] — CSS logical properties, co-located tests
- [Source: planning-artifacts/architecture.md#Project-Structure] — Full directory tree
- [Source: planning-artifacts/ux-design-specification.md#NutritionLabel] — Built on ContactInfoCard pattern with $success/$warning/$error for margin indicators
- [Source: planning-artifacts/ux-design-specification.md#Financial-Semantic-Colors] — Success/warning/error color semantics
- [Source: planning-artifacts/ux-design-specification.md#Emotional-Design] — "Pride → Nutrition Label is proof that good decisions compound"
- [Source: planning-artifacts/ux-design-specification.md#Critical-Success-Moments] — "First-Time Setup Payoff: Nutrition Label calculates a real margin"
- [Source: implementation-artifacts/2-3-manual-transaction-entry-cost-revenue-linkage.md] — Previous story patterns, transaction types, currency utilities, debug learnings
- [Source: implementation-artifacts/2-2-work-order-status-lifecycle-list-view.md] — Margin utility patterns, card layout, SCSS token learnings

## Dev Agent Record

### Agent Model Used

Claude (Cursor Agent)

### Debug Log References

- sass-embedded "Tried writing to closed dispatcher" build flake in sandbox — resolved by running build outside sandbox (known transient issue, not related to code changes)

### Completion Notes List

- Task 1: Extended `calculateMargin` with backward-compatible `bufferAgora = 0` third parameter. Added `BUFFER_PERCENTAGE` constant and `calculateBuffer` function. 7 new tests in margins.test.ts (23 total).
- Task 2: Created NutritionLabel pure display component with all financial lines, expandable Direct Costs/Inventory sections, shimmer loading state, margin progress bar with color-coded status icons.
- Task 3: Created SCSS module with card-surface container, 44px touch targets, shimmer animation with prefers-reduced-motion, CSS logical properties throughout, mobile responsive layout below $bp-sm.
- Task 4: Added `nutritionLabel` namespace to en.json and he.json with 12 keys each. No existing keys modified.
- Task 5: Added NutritionLabel + NutritionLabelProps exports to barrel index.
- Task 6: Created 20 component tests covering all ACs — financial line rendering, formatCurrency, margin colors, expand/collapse, shimmer, edge cases (zero revenue, no costs, negative profit, transaction filtering).
- Task 7: tsc 0 errors, lint 0 warnings, 468 tests pass (441 existing + 27 new), build succeeds.

### Change Log

- 2026-02-07: Implemented Story 2.4 — NutritionLabel component with financial breakdown, buffer calculation, margin utilities extension, i18n, SCSS styles, and comprehensive tests.

### File List

**New files:**
- `src/features/work-orders/components/NutritionLabel.tsx`
- `src/features/work-orders/components/NutritionLabel.module.scss`
- `src/features/work-orders/components/NutritionLabel.test.tsx`

**Modified files:**
- `src/lib/margins.ts` — added BUFFER_PERCENTAGE, calculateBuffer, extended calculateMargin with optional bufferAgora
- `src/lib/margins.test.ts` — added 6 new tests for buffer and extended margin
- `src/features/work-orders/components/index.ts` — added NutritionLabel export
- `src/i18n/en.json` — added nutritionLabel namespace
- `src/i18n/he.json` — added nutritionLabel namespace
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — status updated to review
