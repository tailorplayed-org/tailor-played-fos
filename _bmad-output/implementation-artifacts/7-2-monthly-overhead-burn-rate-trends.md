# Story 7.2: Monthly Overhead Burn Rate & Trends

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As **Gal or Ben**,
I want to see the monthly overhead burn rate with trends and category proportions,
so that I can understand and control the fixed costs of the business.

## Acceptance Criteria

1. **Given** the Overhead page, **When** a "Monthly Burn" summary section renders, **Then** it shows: current month total overhead (formatted, large text), previous month total, and a delta badge (↑/↓ percentage change, green for decrease, red for increase) **And** monthly total includes: all one-time entries for the current month + all active recurring entries (monthly prorated, yearly divided by 12).

2. **Given** the Overhead page, **When** a category breakdown section renders, **Then** each category shows: category name, total amount, and a proportional visual indicator (colored segment or mini bar) showing its share of total overhead **And** categories are sorted by amount (highest first) **And** each category uses a distinct but harmonious color from the design system.

3. **Given** the Dashboard KPI card for Monthly Overhead (from Epic 3), **When** overhead data exists, **Then** the KPI card now shows real calculated data from the `overhead` Firestore collection instead of summing from transaction records **And** it displays: current month burn amount + delta badge from previous month **And** data is pulled from the same `useOverheadStore` / Firestore listener.

4. **Given** overhead burn calculation, **When** recurring items are factored in, **Then** monthly recurrence adds the full amount each month **And** yearly recurrence adds amount / 12 per month **And** items with `isActive: false` are excluded from current burn.

5. **Given** the burn rate view on mobile, **When** rendered on small viewport, **Then** monthly total and delta are prominent **And** category breakdown stacks vertically.

## Tasks / Subtasks

- [x] Task 1: Add burn rate utility and previous-month selector to store (AC: #1, #4)
  - [x] 1.1 Add `calculateBurn(entries: Overhead[]): number` utility to `src/stores/useOverheadStore.ts`
  - [x] 1.2 Add `selectPreviousMonth` selector to `src/stores/useOverheadStore.ts`
  - [x] 1.3 Update `src/stores/index.ts` barrel export with new exports
  - [x] 1.4 Add tests to `src/stores/useOverheadStore.test.ts`
- [x] Task 2: Enhance Monthly Burn Summary with delta badge (AC: #1, #4, #5)
  - [x] 2.1 Update `src/features/overhead/OverheadPage.tsx` — add previous month computation and delta badge
  - [x] 2.2 Update `src/features/overhead/OverheadPage.module.scss` — add delta badge and previous month styles
  - [x] 2.3 Update `src/features/overhead/OverheadPage.test.tsx` — add delta badge tests
- [x] Task 3: Add proportional visual indicator to CategoryBreakdown (AC: #2, #5)
  - [x] 3.1 Update `src/features/overhead/components/CategoryBreakdown.tsx` — add percentage bar and label
  - [x] 3.2 Update `src/features/overhead/components/CategoryBreakdown.module.scss` — add proportion bar styles
  - [x] 3.3 Update `src/features/overhead/components/CategoryBreakdown.test.tsx` — add proportion bar tests
- [x] Task 4: Update Dashboard KPI to use overhead collection (AC: #3)
  - [x] 4.1 Update `src/features/dashboard/hooks/useDashboardData.ts` — subscribe to overhead Firestore, compute burn from overhead collection
  - [x] 4.2 Update `src/features/dashboard/DashboardPage.tsx` — invert delta sense for overhead KPI
  - [x] 4.3 Update `src/features/dashboard/DashboardPage.test.tsx` — update overhead KPI assertions
- [x] Task 5: Add i18n keys (AC: #1, #2, #3)
  - [x] 5.1 Add `overhead.burn.*` keys to `src/i18n/en.json`
  - [x] 5.2 Add Hebrew translations to `src/i18n/he.json`

## Dev Notes

### Burn Rate Calculation Utility — `src/stores/useOverheadStore.ts`

**Add `calculateBurn` and `selectPreviousMonth` to the existing store file.**

```typescript
/**
 * Calculate monthly burn rate from overhead entries.
 * Rules:
 * - one_time: full amountAgora
 * - monthly: full amountAgora
 * - yearly: Math.round(amountAgora / 12)
 * Entries should already be filtered to the target period.
 */
export function calculateBurn(entries: Overhead[]): number {
  return entries.reduce((sum, item) => {
    if (item.recurrence === 'yearly') return sum + Math.round(item.amountAgora / 12);
    return sum + item.amountAgora; // one_time + monthly
  }, 0);
}

export const selectPreviousMonth = (state: OverheadStore) => {
  const now = new Date();
  const prevMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
  const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  return state.overhead.filter((item) => {
    if (item.recurrence === 'one_time') {
      return item.date.getFullYear() === prevYear && item.date.getMonth() === prevMonth;
    }
    return item.isActive;
  });
};
```

**CRITICAL:**
- `calculateBurn` is a pure function that takes pre-filtered entries. Both OverheadPage and `useDashboardData` use this for consistent burn calculation.
- `selectPreviousMonth` uses the same logic as `selectCurrentMonth` but for the previous month (handles year boundary: Jan → Dec of prior year).
- For recurring entries: both `selectCurrentMonth` and `selectPreviousMonth` return ALL active recurring entries (regardless of their `date` field) because recurring items contribute every month.
- `isActive: false` items are excluded from burn calculation by the selectors.

**Update `src/stores/index.ts` barrel export:**
```typescript
export { selectPreviousMonth, calculateBurn } from './useOverheadStore';
```
(Add to existing exports — do NOT replace them.)

### Store Tests — `src/stores/useOverheadStore.test.ts`

**Add these test scenarios to the existing test file:**

1. `calculateBurn` returns 0 for empty array
2. `calculateBurn` sums one_time entries at full amount
3. `calculateBurn` sums monthly entries at full amount
4. `calculateBurn` prorates yearly entries to amount / 12 (rounded)
5. `calculateBurn` handles mixed recurrence correctly
6. `selectPreviousMonth` returns one-time entries from previous month only
7. `selectPreviousMonth` returns active recurring entries regardless of date
8. `selectPreviousMonth` excludes inactive recurring entries
9. `selectPreviousMonth` handles January → December year boundary

### OverheadPage Enhancement — Delta Badge

**Update `src/features/overhead/OverheadPage.tsx`:**

Add previous month computation and delta badge to the monthly total card.

**New imports:**
```typescript
import { useOverheadStore, selectCurrentMonth, selectPreviousMonth, calculateBurn } from '@/stores';
```

**New computations (replace the existing `totalMonthlyAgora` inline computation):**
```typescript
const currentMonthEntries = useOverheadStore(selectCurrentMonth);
const previousMonthEntries = useOverheadStore(selectPreviousMonth);

const currentBurnAgora = useMemo(() => calculateBurn(currentMonthEntries), [currentMonthEntries]);
const previousBurnAgora = useMemo(() => calculateBurn(previousMonthEntries), [previousMonthEntries]);

// Delta for overhead: decrease = positive (green), increase = negative (red)
// This is INVERTED from revenue delta because lower costs are good
const burnDelta = useMemo(() => {
  if (previousBurnAgora === 0) return null;
  const change = ((currentBurnAgora - previousBurnAgora) / Math.abs(previousBurnAgora)) * 100;
  const value = Math.abs(Math.round(change));
  if (value === 0) return null;
  // INVERTED: increase = negative (red), decrease = positive (green)
  return {
    value,
    type: (change >= 0 ? 'negative' : 'positive') as 'positive' | 'negative',
    direction: change >= 0 ? 'up' : 'down' as 'up' | 'down',
  };
}, [currentBurnAgora, previousBurnAgora]);
```

**CRITICAL — Delta Color Inversion for Costs:**
For overhead, spending MORE than last month is BAD (red), spending LESS is GOOD (green). This is the opposite of revenue/profit delta. The `getDelta` utility in `HeroStat.tsx` treats increase as 'positive' (green). For overhead, we INVERT:
- Overhead increase → `type: 'negative'` → renders red
- Overhead decrease → `type: 'positive'` → renders green

**Updated Monthly Burn Summary JSX (replaces the existing `.monthlyTotal` card):**
```tsx
<div className={styles.burnSummary}>
  <span className={styles.burnLabel}>{t('overhead.burn.currentMonth')}</span>
  <span className={styles.burnAmount}>{formatCurrency(currentBurnAgora)}</span>

  {burnDelta && (
    <span
      className={`${styles.burnDelta} ${
        burnDelta.type === 'positive' ? styles.burnDeltaPositive : styles.burnDeltaNegative
      }`}
    >
      {burnDelta.direction === 'up' ? '↑' : '↓'} {burnDelta.value}%
    </span>
  )}

  {previousBurnAgora > 0 && (
    <span className={styles.burnPreviousMonth}>
      {t('overhead.burn.previousMonth')}: {formatCurrency(previousBurnAgora)}
    </span>
  )}
</div>
```

**Remove the old `totalMonthlyAgora` useMemo** — it's replaced by `currentBurnAgora` which uses `calculateBurn`.

**Also update the `CategoryBreakdown` call** — pass current month entries (already done, no change needed).

### OverheadPage SCSS — Delta Badge Styles

**Add to `src/features/overhead/OverheadPage.module.scss`:**

Replace the existing `.monthlyTotal`, `.monthlyTotalLabel`, `.monthlyTotalAmount` with:

```scss
// ── Burn Summary (replaces monthlyTotal) ──
.burnSummary {
  @include card-surface;
  padding: $space-lg;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-xs;
}

.burnLabel {
  font-size: $text-sm;
  color: $text-secondary;
}

.burnAmount {
  font-size: $text-2xl;
  font-weight: $font-semibold;
  color: $gold;
}

.burnDelta {
  display: inline-flex;
  align-items: center;
  gap: $space-2xs;
  font-size: $text-sm;
  font-weight: $font-medium;
  padding: 2px $space-sm;
  border-radius: $radius-full;
}

.burnDeltaPositive {
  color: $success;
  background: rgba($success, 0.12);
}

.burnDeltaNegative {
  color: $error;
  background: rgba($error, 0.12);
}

.burnPreviousMonth {
  font-size: $text-xs;
  color: $text-muted;
}
```

**CRITICAL SCSS notes from Story 7.1:**
- Use `$error` for red/destructive — `$danger` does NOT exist
- Use `$success` for green — verify this token exists, if not use a green value or check `_variables.scss`
- CSS logical properties for RTL
- No explicit `@use` — globals auto-imported
- Variable names: `$text-lg` NOT `$font-lg` for font-size tokens

**Verify `$success` token exists:** Check `src/styles/_variables.scss` for the success color token. If it doesn't exist, use `#34d399` (green-400 equivalent) inline OR use `$positive` if that's the token name. The architecture uses `$error` for red, so there should be a corresponding green token.

### CategoryBreakdown Enhancement — Proportional Visual Indicator

**Update `src/features/overhead/components/CategoryBreakdown.tsx`:**

Add a proportional mini bar showing each category's share of total overhead.

**Compute total for proportions:**
```typescript
const totalOverhead = categoryTotals.reduce((sum, cat) => sum + cat.total, 0);
```

**Add to each category card (after `entryCount`):**
```tsx
{totalOverhead > 0 && (
  <div className={styles.proportionBar}>
    <div
      className={styles.proportionFill}
      style={{
        width: `${Math.round((total / totalOverhead) * 100)}%`,
        backgroundColor: config.color,
      }}
    />
  </div>
)}
<span className={styles.proportionLabel}>
  {totalOverhead > 0 ? `${Math.round((total / totalOverhead) * 100)}%` : '0%'}
</span>
```

**Updated card JSX:**
```tsx
<div key={category} className={styles.card} data-testid={`category-card-${category}`}>
  <div className={styles.cardHeader}>
    <span className={styles.iconWrap} style={{ color: config.color }}>
      <Icon size={24} weight="duotone" />
    </span>
    <span className={styles.categoryName}>{t(`overhead.categories.${category}`)}</span>
  </div>
  <span className={styles.categoryTotal}>{formatCurrency(total)}</span>
  <span className={styles.entryCount}>
    {t('overhead.breakdown.entries', { count })}
  </span>
  {totalOverhead > 0 && (
    <>
      <div className={styles.proportionBar}>
        <div
          className={styles.proportionFill}
          style={{
            width: `${Math.round((total / totalOverhead) * 100)}%`,
            backgroundColor: config.color,
          }}
        />
      </div>
      <span className={styles.proportionLabel}>
        {Math.round((total / totalOverhead) * 100)}%
      </span>
    </>
  )}
</div>
```

### CategoryBreakdown SCSS — Proportion Bar Styles

**Add to `src/features/overhead/components/CategoryBreakdown.module.scss`:**

```scss
.proportionBar {
  width: 100%;
  height: 6px;
  border-radius: $radius-full;
  background: $bg-tertiary;
  overflow: hidden;
  margin-block-start: $space-xs;
}

.proportionFill {
  height: 100%;
  border-radius: $radius-full;
  transition: width 0.3s ease;
  min-width: 2px; // Always show a sliver even for tiny percentages
}

.proportionLabel {
  font-size: $text-xs;
  color: $text-muted;
  font-weight: $font-medium;
}
```

### Dashboard KPI Update — Use Overhead Collection

**Update `src/features/dashboard/hooks/useDashboardData.ts`:**

The current dashboard computes monthly overhead from transaction sums (`approved.filter(t => t.category === 'Overhead')`). Story 7.2 AC #3 requires using the `overhead` Firestore collection instead for accurate burn rate with recurring item proration.

**New imports:**
```typescript
import { useOverheadStore } from '@/stores';
import { overheadSchema } from '@/types';
import { calculateBurn } from '@/stores';
```

**Add overhead subscription (after existing `useFirestoreCollection` calls):**
```typescript
const ohStore = useOverheadStore();

useFirestoreCollection('overhead', overheadSchema, {
  onData: ohStore.setOverhead,
  onError: ohStore.setError,
  onLoading: ohStore.setLoading,
});
```

**Replace the transaction-based overhead calculation in the `useMemo`:**

```typescript
// REPLACE these lines:
// const monthlyOverheadAgora = currentMonthApproved
//   .filter((t) => t.category === 'Overhead')
//   .reduce((sum, t) => sum + toIlsAgora(t.amountAgora, t.currency, rates), 0);
// const previousMonthOverheadAgora = prevMonthApproved
//   .filter((t) => t.category === 'Overhead')
//   .reduce((sum, t) => sum + toIlsAgora(t.amountAgora, t.currency, rates), 0);

// WITH overhead-collection-based calculation:
const currentMonthOverhead = ohStore.overhead.filter((item) => {
  if (item.recurrence === 'one_time') {
    return item.date.getFullYear() === currentYear && item.date.getMonth() === currentMonth;
  }
  return item.isActive;
});
const prevMonthOverhead = ohStore.overhead.filter((item) => {
  if (item.recurrence === 'one_time') {
    return item.date.getFullYear() === prevYear && item.date.getMonth() === prevMonth;
  }
  return item.isActive;
});
const monthlyOverheadAgora = calculateBurn(currentMonthOverhead);
const previousMonthOverheadAgora = calculateBurn(prevMonthOverhead);
```

**CRITICAL:** Add `ohStore.overhead` to the `useMemo` dependency array:
```typescript
}, [woStore.workOrders, txnStore.transactions, ohStore.overhead, configStore.config, currentMonth, currentYear]);
```

**Also update the `loading` return:**
```typescript
loading: woStore.loading || txnStore.loading || ohStore.loading || configStore.loading,
loaded: !woStore.loading && !txnStore.loading && !ohStore.loading && !configStore.loading,
```

**IMPORTANT:** Keep overhead in the Net Profit formula as-is (still uses transaction sums for `netProfitAgora`). The Net Profit calculation is `Revenue - (DirectCost + Overhead)` from approved transactions. This is correct — the overhead KPI card is what changes to show burn rate from the `overhead` collection.

### Dashboard Delta Inversion for Overhead

**Update `src/features/dashboard/DashboardPage.tsx`:**

The current code uses `getDelta` which returns 'positive' for increases (green). For overhead costs, increase = BAD (red), decrease = GOOD (green). Invert the result.

**Replace:**
```typescript
const overheadDelta = getDelta(monthlyOverheadAgora, previousMonthOverheadAgora);
```

**With:**
```typescript
const rawOverheadDelta = getDelta(monthlyOverheadAgora, previousMonthOverheadAgora);
const overheadDelta = rawOverheadDelta
  ? {
      value: rawOverheadDelta.value,
      type: (rawOverheadDelta.type === 'positive' ? 'negative' : 'positive') as 'positive' | 'negative',
    }
  : null;
```

This inverts the delta sense for overhead specifically. All other KPIs keep their normal delta semantics.

### i18n Keys

**English (`en.json`) — add `overhead.burn` sub-object inside the existing `overhead` object:**

```json
"burn": {
  "currentMonth": "Current Month Burn",
  "previousMonth": "Previous Month",
  "noChange": "No change",
  "increase": "increase",
  "decrease": "decrease"
}
```

**Hebrew (`he.json`) — same structure:**

```json
"burn": {
  "currentMonth": "צריכה חודשית נוכחית",
  "previousMonth": "חודש קודם",
  "noChange": "ללא שינוי",
  "increase": "עלייה",
  "decrease": "ירידה"
}
```

**Also update the existing `overhead.monthlyTotalLabel` key usage.** The OverheadPage now uses `overhead.burn.currentMonth` instead of `overhead.monthlyTotalLabel`. The old key can remain for backward compatibility but won't be referenced.

### Project Structure Notes

**Files to modify:**
```
src/stores/useOverheadStore.ts                    # Add calculateBurn, selectPreviousMonth
src/stores/useOverheadStore.test.ts               # Add 9 new test scenarios
src/stores/index.ts                               # Update barrel exports
src/features/overhead/OverheadPage.tsx             # Add delta badge, use calculateBurn
src/features/overhead/OverheadPage.module.scss     # Add burn summary + delta styles
src/features/overhead/OverheadPage.test.tsx        # Add delta badge tests
src/features/overhead/components/CategoryBreakdown.tsx      # Add proportional bar
src/features/overhead/components/CategoryBreakdown.module.scss  # Add proportion bar styles
src/features/overhead/components/CategoryBreakdown.test.tsx  # Add proportion bar tests
src/features/dashboard/hooks/useDashboardData.ts   # Subscribe to overhead, use calculateBurn
src/features/dashboard/DashboardPage.tsx           # Invert overhead delta sense
src/features/dashboard/DashboardPage.test.tsx      # Update overhead KPI assertions
src/i18n/en.json                                   # Add overhead.burn.* keys
src/i18n/he.json                                   # Add Hebrew translations
```

**No new files to create** — this story only modifies existing files.

**Files that must NOT be modified:**
- `src/types/overhead.ts` — schema is unchanged
- `src/features/overhead/components/OverheadForm.tsx` — form is unchanged
- `src/features/overhead/hooks/useOverhead.ts` — hook is unchanged
- `functions/` — no Cloud Function changes in this story

### Existing Components to Reuse

| Component | Location | Usage |
|---|---|---|
| `formatCurrency` | `src/lib/currency.ts` | Amount formatting — `formatCurrency(amountAgora, currency)` |
| `calculateBurn` | `src/stores/useOverheadStore.ts` (NEW) | Shared burn rate calculation for OverheadPage + Dashboard |
| `selectCurrentMonth` | `src/stores/useOverheadStore.ts` | Already used in OverheadPage |
| `selectPreviousMonth` | `src/stores/useOverheadStore.ts` (NEW) | Previous month entries for delta |
| `useOverheadStore` | `src/stores/useOverheadStore.ts` | Store used by both OverheadPage and Dashboard |
| `getDelta` | `src/features/dashboard/components/HeroStat.tsx` | Only used by Dashboard (cannot import in overhead feature due to cross-feature boundary) |
| `KpiCard` | `src/features/dashboard/components/KpiCard.tsx` | Already renders overhead KPI with delta prop |
| `Skeleton` | `src/components/Skeleton/Skeleton.tsx` | Loading states |
| `useFirestoreCollection` | `src/hooks/useFirestoreCollection.ts` | Firestore subscription in useDashboardData |
| `overheadSchema` | `src/types/overhead.ts` | For Firestore collection subscription |

### Critical Import Patterns

```typescript
// Store + selectors + utility (from src/stores/useOverheadStore.ts)
import { useOverheadStore, selectCurrentMonth, selectPreviousMonth, calculateBurn } from '@/stores';

// Currency
import { formatCurrency } from '@/lib/currency';

// Types
import type { Overhead } from '@/types';
import { overheadSchema } from '@/types';

// i18n
import { useTranslation } from 'react-i18next';
```

### Testing Patterns

**Framework:** Vitest + React Testing Library
**Co-located:** `*.test.ts` / `*.test.tsx` next to source files

**Store test scenarios (`useOverheadStore.test.ts` — ADD to existing file):**

1. `calculateBurn` — returns 0 for empty entries
2. `calculateBurn` — sums one_time at full amount
3. `calculateBurn` — sums monthly at full amount
4. `calculateBurn` — prorates yearly to amount/12 (rounded)
5. `calculateBurn` — handles mixed recurrence (one_time + monthly + yearly)
6. `selectPreviousMonth` — returns one-time entries from previous month
7. `selectPreviousMonth` — returns active recurring entries
8. `selectPreviousMonth` — excludes isActive=false entries
9. `selectPreviousMonth` — handles January boundary (returns December of prior year)

**OverheadPage test scenarios (ADD to existing test file):**

1. Shows delta badge when previous month has data (green for decrease, red for increase)
2. Shows previous month amount below current
3. Hides delta badge when no previous month data
4. Uses `calculateBurn` for total (verifies yearly proration)

**CategoryBreakdown test scenarios (ADD to existing test file):**

1. Shows proportion bar for each category
2. Proportion bar width matches percentage of total
3. Shows percentage label text
4. Proportion bar is not rendered when total is 0

**Dashboard test scenarios (UPDATE existing overhead KPI test):**

1. Monthly Overhead KPI uses overhead collection data (not transaction sums)
2. Overhead delta is inverted (decrease = green, increase = red)

### Cross-Epic Context

- **Story 7.1 (done):** Created the overhead data model, store, page, form, and Cloud Function integration. Story 7.2 builds directly on all of this.
- **Epic 3 (Story 3.1–3.3):** Dashboard already has the Monthly Overhead KPI card. Story 7.2 changes its data source from transactions to the overhead collection. The KpiCard component itself is NOT modified — only the data flowing into it changes.
- **Story 7.3 (next):** Tax Jar configuration will use `system_config` collection. Not related to this story.
- **Story 7.4 (future):** Forward projection will factor in monthly overhead burn rate from `calculateBurn`. This utility is being created now for reuse.

### Zod v4 Reminders (from Story 7.1)

- Use `{ error: "message" }` NOT `{ message: "message" }` for custom error strings
- `overheadSchema` uses `.default()` since it's parsing incoming data
- No schema changes needed in this story

### SCSS Patterns (from Story 7.1)

- Use `$error` for red/destructive — `$danger` does NOT exist
- Use `$success` for green (verify token exists; if not check `_variables.scss`)
- CSS logical properties for RTL (`margin-inline-start`, `padding-inline-end`)
- Touch targets ≥ 44px on mobile
- No explicit `@use` statements — globals auto-imported via Vite `additionalData`
- Variable names: `$text-lg` NOT `$font-lg` for font-size
- `$surface-secondary` does NOT exist — use `$bg-secondary` or `$bg-tertiary`
- Breakpoint: use `$bp-sm` (640px) for mobile vs desktop separation

### Performance

- `calculateBurn` is O(n) where n = entries passed. Called twice per render (current + previous month) — negligible.
- `selectPreviousMonth` is O(n) over all overhead entries — same as existing `selectCurrentMonth`. No concerns.
- Dashboard now subscribes to one additional Firestore collection (`overhead`). Expected < 100 entries/month. Negligible impact.
- Proportion percentage calculation in CategoryBreakdown is O(1) per category — no concerns.

### References

- [Source: epics.md — Epic 7, Story 7.2: Monthly Overhead Burn Rate & Trends]
- [Source: architecture.md — State Management: One store per domain — useOverheadStore]
- [Source: architecture.md — Data Flow: Firestore → Zod → Store → Component]
- [Source: architecture.md — Feature Module Boundaries: Features never import from other features]
- [Source: architecture.md — Frontend: KPI cards on Dashboard]
- [Source: ux-design-specification.md — KPI Cards: big numbers, color-coded changes, delta badges]
- [Source: 7-1-overhead-data-model-expense-management.md — All implementation patterns, SCSS conventions, testing patterns]
- [Source: src/features/dashboard/hooks/useDashboardData.ts — Current transaction-based overhead calculation]
- [Source: src/features/dashboard/components/HeroStat.tsx — getDelta utility]

## Dev Agent Record

### Agent Model Used

Claude claude-4.6-opus (Cursor)

### Debug Log References

- Fixed useDashboardData.test.ts — added `useOverheadStore`, `calculateBurn`, and `overheadSchema` to mocks after new imports broke existing tests.
- 2 pre-existing timeout flakes in Toast.test.tsx and Input.test.tsx (unrelated to this story).

### Completion Notes List

- **Task 1:** Added `calculateBurn` pure function (O(n), handles one_time/monthly/yearly proration) and `selectPreviousMonth` selector (mirrors selectCurrentMonth for prior month with year boundary). Barrel export unchanged since `export *` already covers new exports. 9 new test scenarios added (all pass).
- **Task 2:** Replaced `.monthlyTotal` card with `.burnSummary` containing delta badge (inverted: increase=red, decrease=green) and previous month amount. Removed inline `totalMonthlyAgora` useMemo in favor of `calculateBurn(currentMonthEntries)`. Updated SCSS with burn summary, delta positive/negative styles using `$success`/`$error` tokens. 5 new test scenarios added.
- **Task 3:** Added proportional mini bar (`proportionBar` + `proportionFill` + `proportionLabel`) to each category card. Computed `totalOverhead` for percentage, styled with category color inline. 4 new test scenarios added.
- **Task 4:** Dashboard `useDashboardData` now subscribes to `overhead` Firestore collection and computes KPI burn rate via `calculateBurn` instead of summing transaction records. Delta inverted in `DashboardPage.tsx` so overhead increase shows red. Updated `loading`/`loaded` to include `ohStore`. Updated test mock to include `useOverheadStore` and `calculateBurn`. 2 new test scenarios added.
- **Task 5:** Added `overhead.burn.*` i18n keys (currentMonth, previousMonth, noChange, increase, decrease) in both `en.json` and `he.json`.

### Senior Developer Review (AI)

**Reviewer:** Galelbaz on 2026-02-14
**Outcome:** Approved (after fixes)

**Issues Found & Fixed (7 total: 2 HIGH, 3 MEDIUM, 2 LOW):**

1. **[HIGH][FIXED]** `$space-2xs` undefined SCSS token in `OverheadPage.module.scss:48` → Replaced with `$space-xs` (4px). Would have broken production build.
2. **[HIGH][FIXED]** `CategoryBreakdown.tsx:42` summed raw `amountAgora` without prorating yearly entries (÷12), causing inconsistency with burn summary total → Added proration logic matching `calculateBurn`.
3. **[MEDIUM][FIXED]** Missing overhead store tests in `useDashboardData.test.ts` → Added 3 tests: overhead burn calculation, previous month overhead, and `ohStore.loading` composite state.
4. **[MEDIUM][FIXED]** OverheadPage delta badge tests didn't verify CSS class assignment → Added `burnDeltaPositive`/`burnDeltaNegative` class assertions.
5. **[MEDIUM][FIXED]** `ohStore.loading` not tested in composite loading state → Added dedicated test.
6. **[LOW][FIXED]** Dead `overhead.monthlyTotalLabel` i18n key removed from both `en.json` and `he.json`.
7. **[LOW][FIXED]** `selectPreviousMonth` January boundary test strengthened with `vi.useFakeTimers()` mocking date to January 2026, verifying December 2025 entries are returned while November 2025 and January 2026 entries are excluded.

### Change Log

- 2026-02-14: Story 7.2 implementation complete — monthly burn rate with delta badge, category proportion bars, dashboard overhead KPI updated to use overhead collection, i18n keys added.
- 2026-02-14: Code review complete — 7 issues found and fixed (2 HIGH, 3 MEDIUM, 2 LOW). Status → done.

### File List

- src/stores/useOverheadStore.ts (modified — added calculateBurn, selectPreviousMonth)
- src/stores/useOverheadStore.test.ts (modified — 9 new tests for calculateBurn and selectPreviousMonth)
- src/features/overhead/OverheadPage.tsx (modified — burn summary with delta badge)
- src/features/overhead/OverheadPage.module.scss (modified — replaced monthlyTotal with burnSummary styles)
- src/features/overhead/OverheadPage.test.tsx (modified — 5 new delta badge tests, updated mock)
- src/features/overhead/components/CategoryBreakdown.tsx (modified — proportional bar and label)
- src/features/overhead/components/CategoryBreakdown.module.scss (modified — proportion bar styles)
- src/features/overhead/components/CategoryBreakdown.test.tsx (modified — 4 new proportion bar tests)
- src/features/dashboard/hooks/useDashboardData.ts (modified — overhead collection subscription, calculateBurn)
- src/features/dashboard/hooks/useDashboardData.test.ts (modified — added overhead store/schema mocks)
- src/features/dashboard/DashboardPage.tsx (modified — inverted overhead delta)
- src/features/dashboard/DashboardPage.test.tsx (modified — 2 new overhead delta inversion tests)
- src/i18n/en.json (modified — overhead.burn.* keys)
- src/i18n/he.json (modified — overhead.burn.* Hebrew translations)
- _bmad-output/implementation-artifacts/sprint-status.yaml (modified — 7-2 status: review)
