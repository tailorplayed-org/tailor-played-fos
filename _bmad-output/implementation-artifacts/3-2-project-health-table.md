# Story 3.2: Project Health Table

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As **Gal or Ben**,
I want to see all active projects in a scannable list with margin health indicators,
So that I can instantly identify which projects are profitable and which need attention.

## Acceptance Criteria

1. **Project Health Section**: Below the KPI cards on `DashboardPage`, render a Project Health section containing project rows. Each row shows: Phosphor icon (in tinted rounded rect), project name + current phase (status), revenue amount, total cost, and margin percentage with a mini progress bar. Rows are sorted by status priority (Production → Design → Lead), then by margin ascending (lowest first, so at-risk projects surface).

2. **Margin Color Coding — Healthy (≥ 30%)**: Margin percentage text and bar fill use `$success` green. No additional indicator icon needed.

3. **Margin Color Coding — Watch (20-29%)**: Margin percentage text and bar fill use `$warning` yellow. A small caution icon (Phosphor `Warning`) appears next to the percentage.

4. **Margin Color Coding — Danger (< 20%)**: Margin percentage text and bar fill use `$error` red. A warning icon (Phosphor `WarningCircle`) appears next to the percentage. The entire row gets a subtle red-tinted border (`rgba($error, 0.3)`).

5. **Row Click Navigation**: Clicking/tapping a row navigates to `/work-orders/:id` (Work Order detail page). Desktop rows show a hover state (background shift + border highlight). Rows are keyboard accessible (Enter/Space triggers navigation, focus-visible ring).

6. **Empty State**: When no Work Orders exist, the Project Health section shows: "No projects yet — create your first Work Order" with a CTA button linking to `/work-orders`. Use the existing `Button` component from `@/components`.

7. **Mobile Responsive (< 768px)**: Rows simplify to: icon + name + margin percentage (revenue and cost columns hidden). Rows remain tappable with ≥ 44px height.

8. **Skeleton Loading**: While data loads, show 3 skeleton row placeholders matching approximate shape and size of real rows. Use existing `Skeleton` component from `@/components`.

9. **Shipped Work Orders Excluded**: Only show Work Orders with status `Lead`, `Design`, or `Production`. Shipped projects are complete and not shown in the health table.

10. **Margin Calculation**: For each Work Order: `totalCost = directCostAgora + inventoryCostAgora + overheadAllocationAgora`. Margin = `calculateMargin(revenueTotalAgora, totalCost)` from `@/lib`. Status = `getMarginStatus(margin)` from `@/lib`. Revenue 0 → margin displays as "—".

11. **Section Header**: Project Health section has a header with title "Project Health" and a subtitle showing the count of active projects (e.g., "3 projects").

## Tasks / Subtasks

- [x] Task 1: Extend `useDashboardData` hook to return work orders (AC: #1, #9)
  - [x] Add `workOrders: WorkOrder[]` to hook return value from `woStore.workOrders`
  - [x] No additional Firestore subscriptions needed (work_orders already subscribed)

- [x] Task 2: Create `ProjectRow` component (AC: #1, #2, #3, #4, #5, #7, #8, #10)
  - [x] Create `src/features/dashboard/components/ProjectRow.tsx`
  - [x] Create `src/features/dashboard/components/ProjectRow.module.scss`
  - [x] Props: `workOrder: WorkOrder`, `onClick: () => void`, `loading?: boolean`
  - [x] Phosphor `Briefcase` icon in tinted rounded rect background
  - [x] Name + status/phase text
  - [x] Revenue amount via `formatCurrency()`
  - [x] Total cost via `formatCurrency()`
  - [x] Margin percentage + mini bar (color-coded)
  - [x] Status icons: `Warning` for watch, `WarningCircle` for danger
  - [x] Red-tinted border on danger rows
  - [x] Hover state + keyboard navigation
  - [x] Mobile: hide revenue/cost columns
  - [x] Skeleton variant when `loading=true`
  - [x] Export from `src/features/dashboard/components/index.ts`

- [x] Task 3: Create `ProjectList` component (AC: #1, #6, #8, #9, #11)
  - [x] Create `src/features/dashboard/components/ProjectList.tsx`
  - [x] Create `src/features/dashboard/components/ProjectList.module.scss`
  - [x] Props: `workOrders: WorkOrder[]`, `loading: boolean`
  - [x] Filter out Shipped work orders
  - [x] Sort: Production → Design → Lead, then by margin ascending
  - [x] Section header with title + count
  - [x] Empty state with CTA button
  - [x] Skeleton loading: render 3 skeleton ProjectRows
  - [x] Export from `src/features/dashboard/components/index.ts`

- [x] Task 4: Integrate into `DashboardPage` (AC: #1)
  - [x] Add `ProjectList` below KPI row in `DashboardPage.tsx`
  - [x] Pass `workOrders` and `loading` from `useDashboardData`

- [x] Task 5: i18n Translation Keys (AC: #6, #11)
  - [x] Add `dashboard.projectHealth` namespace to `src/i18n/en.json`
  - [x] Add matching keys to `src/i18n/he.json`
  - [x] Keys: title, subtitle count, empty state title, empty state cta, status labels, margin "no revenue", column headers

- [x] Task 6: Tests (AC: all)
  - [x] Create `src/features/dashboard/components/ProjectRow.test.tsx`
  - [x] Create `src/features/dashboard/components/ProjectList.test.tsx`
  - [x] Update `src/features/dashboard/DashboardPage.test.tsx` — add project health integration

- [x] Task 7: Build Verification (AC: all)
  - [x] `tsc --noEmit` — zero TypeScript errors
  - [x] `npm run lint` — zero warnings
  - [x] `npm run test` — all tests pass, zero regressions
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
  - `react-router@^7.13.0` — `useNavigate` available
  - `firebase@^12.9.0` — Firestore, Auth
  - `zustand@^5.0.11` — client-side state management
  - `zod@^4.3.6` — schema validation
  - `@phosphor-icons/react@^2.1.10` — icon library
  - `i18next@^25.8.4`, `react-i18next@^16.5.4` — i18n
  - `sass@^1.97.3` — SCSS compilation
  - `vitest@^4.0.18` — test runner

- **NO NEW npm dependencies needed** — everything required for Story 3.2 is already installed.

- **Existing files to MODIFY:**
  - `src/features/dashboard/DashboardPage.tsx` — add ProjectList below KPI row
  - `src/features/dashboard/DashboardPage.test.tsx` — add project health integration tests
  - `src/features/dashboard/components/index.ts` — add ProjectList, ProjectRow exports
  - `src/features/dashboard/hooks/useDashboardData.ts` — add workOrders return
  - `src/i18n/en.json` — add `dashboard.projectHealth` keys
  - `src/i18n/he.json` — add `dashboard.projectHealth` keys

- **Files to CREATE:**
  - `src/features/dashboard/components/ProjectRow.tsx`
  - `src/features/dashboard/components/ProjectRow.module.scss`
  - `src/features/dashboard/components/ProjectRow.test.tsx`
  - `src/features/dashboard/components/ProjectList.tsx`
  - `src/features/dashboard/components/ProjectList.module.scss`
  - `src/features/dashboard/components/ProjectList.test.tsx`

- **Files NOT to modify:**
  - `src/router.tsx` — route `/` already registered with `DashboardPage`
  - `src/features/dashboard/index.ts` — already re-exports `./components` and `./hooks`
  - `src/stores/*` — Zustand stores are complete
  - `src/types/*` — WorkOrder type is complete with all needed fields
  - `src/lib/currency.ts` — currency utilities are complete
  - `src/lib/margins.ts` — margin utilities (`calculateMargin`, `getMarginStatus`, `calculateBuffer`) are complete
  - `src/components/*` — Skeleton, Button components are complete
  - `src/hooks/useFirestoreCollection.ts` — generic Firestore listener is complete
  - `src/features/dashboard/components/HeroStat.tsx` — do not modify
  - `src/features/dashboard/components/KpiCard.tsx` — do not modify

- **SCSS auto-import**: `_variables.scss` and `_mixins.scss` are auto-imported via Vite `additionalData` into every `.module.scss` file. All tokens and mixins are available without `@use` statements.

- **Test infrastructure**: Vitest + React Testing Library. CSS module mocks and react-i18next mocks already configured globally. Use `vi.mock` for Phosphor icons to avoid jsdom hangs. 534 tests currently passing.

### Extending useDashboardData Hook

The hook already subscribes to `work_orders` Firestore collection and stores data in `woStore.workOrders`. Simply add the work orders array to the return value:

```typescript
// src/features/dashboard/hooks/useDashboardData.ts
// ADD to return object (after ...metrics):
return {
  ...metrics,
  workOrders: woStore.workOrders,  // NEW — expose for ProjectList
  loading: woStore.loading || txnStore.loading,
};
```

**CRITICAL**: Do NOT use a filtered/sorted version in useMemo — return the raw array and let ProjectList handle sorting/filtering. This avoids unnecessary recomputation and keeps the hook focused on data subscription.

### ProjectRow Component Design

```typescript
// src/features/dashboard/components/ProjectRow.tsx
import type { WorkOrder } from '@/types';

interface ProjectRowProps {
  workOrder: WorkOrder;
  onClick: () => void;
  loading?: boolean;
}
```

**Visual layout (Desktop):**
```
┌─────────────────────────────────────────────────────────────────┐
│ [🔲] │  Client Name          │  ₪12,000  │  ₪7,200   │ 40% ███│
│ icon │  Production            │  Revenue   │  Cost      │ margin │
└─────────────────────────────────────────────────────────────────┘
```

**Visual layout (Mobile):**
```
┌──────────────────────────────────┐
│ [🔲]  Client Name      40% ███  │
│  icon  Production               │
└──────────────────────────────────┘
```

**Margin bar implementation:**
```scss
.marginBar {
  inline-size: 60px;
  block-size: 4px;
  border-radius: $radius-full;
  background-color: rgba($text-muted, 0.2);
  overflow: hidden;
}

.marginBarFill {
  block-size: 100%;
  border-radius: $radius-full;
  transition: inline-size $transition-fast;
}
```

**Status priority for sorting:**
```typescript
const STATUS_PRIORITY: Record<string, number> = {
  Production: 0,
  Design: 1,
  Lead: 2,
};
```

**Margin calculation per row:**
```typescript
import { calculateMargin, getMarginStatus } from '@/lib';
import type { WorkOrder } from '@/types';

function getWorkOrderMargin(wo: WorkOrder) {
  const totalCost = wo.directCostAgora + wo.inventoryCostAgora + wo.overheadAllocationAgora;
  const margin = calculateMargin(wo.revenueTotalAgora, totalCost);
  const status = getMarginStatus(margin);
  return { margin, status, totalCost };
}
```

**Row CSS classes by margin status:**
```typescript
const statusClassMap: Record<MarginStatus, string> = {
  healthy: styles.healthy,
  watch: styles.watch,
  danger: styles.danger,
};
```

**Danger row red border:**
```scss
.danger {
  border-color: rgba($error, 0.3);
}
```

**Icon container (tinted rounded rect):**
```scss
.iconContainer {
  @include flex-center;
  inline-size: 40px;
  block-size: 40px;
  border-radius: $radius-sm;
  background-color: $bg-elevated;
  color: $text-secondary;
  flex-shrink: 0;
}
```

**Hover/interactive state:**
```scss
.row {
  @include interactive-reset;
  display: flex;
  align-items: center;
  gap: $space-md;
  padding: $space-md;
  border: 1px solid $border-subtle;
  border-radius: $radius-md;
  inline-size: 100%;
  text-align: start;
  transition: background-color $transition-fast, border-color $transition-fast;

  &:hover {
    background-color: $bg-elevated;
    border-color: $gold-light;
  }

  &:focus-visible {
    @include focus-ring;
  }
}
```

### ProjectList Component Design

```typescript
// src/features/dashboard/components/ProjectList.tsx
import type { WorkOrder } from '@/types';

interface ProjectListProps {
  workOrders: WorkOrder[];
  loading: boolean;
}
```

**Sorting logic (inside useMemo):**
```typescript
const sortedProjects = useMemo(() => {
  return workOrders
    .filter((wo) => wo.status !== 'Shipped')
    .map((wo) => {
      const totalCost = wo.directCostAgora + wo.inventoryCostAgora + wo.overheadAllocationAgora;
      const margin = calculateMargin(wo.revenueTotalAgora, totalCost);
      return { ...wo, margin };
    })
    .sort((a, b) => {
      const priorityDiff = (STATUS_PRIORITY[a.status] ?? 99) - (STATUS_PRIORITY[b.status] ?? 99);
      if (priorityDiff !== 0) return priorityDiff;
      return a.margin - b.margin; // Lowest margin first
    });
}, [workOrders]);
```

**Empty state:**
```tsx
<div className={styles.emptyState}>
  <Briefcase size={48} className={styles.emptyIcon} />
  <p className={styles.emptyTitle}>{t('dashboard.projectHealth.emptyTitle')}</p>
  <Button onClick={() => navigate('/work-orders')}>
    {t('dashboard.projectHealth.emptyCta')}
  </Button>
</div>
```

**Section header:**
```tsx
<div className={styles.header}>
  <h2 className={styles.title}>{t('dashboard.projectHealth.title')}</h2>
  <span className={styles.count}>
    {t('dashboard.projectHealth.count', { count: sortedProjects.length })}
  </span>
</div>
```

### DashboardPage Integration

Add ProjectList below the KPI row:

```tsx
// In DashboardPage.tsx — add after kpiRow div
<ProjectList workOrders={workOrders} loading={loading} />
```

Add `workOrders` to the destructured hook return:
```tsx
const {
  // ...existing fields...
  workOrders,  // NEW
  loading,
} = useDashboardData();
```

### i18n Keys to Add

**English (`src/i18n/en.json`) — add to `dashboard` namespace:**

```json
{
  "dashboard": {
    "projectHealth": {
      "title": "Project Health",
      "count": "{{count}} projects",
      "count_one": "{{count}} project",
      "emptyTitle": "No projects yet — create your first Work Order",
      "emptyCta": "Create Work Order",
      "revenue": "Revenue",
      "cost": "Cost",
      "margin": "Margin",
      "noRevenue": "—",
      "status": {
        "Lead": "Lead",
        "Design": "Design",
        "Production": "Production"
      }
    }
  }
}
```

**Hebrew (`src/i18n/he.json`) — add to `dashboard` namespace:**

```json
{
  "dashboard": {
    "projectHealth": {
      "title": "בריאות פרויקטים",
      "count": "{{count}} פרויקטים",
      "count_one": "פרויקט {{count}}",
      "emptyTitle": "אין פרויקטים עדיין — צרו את הזמנת העבודה הראשונה",
      "emptyCta": "צור הזמנת עבודה",
      "revenue": "הכנסות",
      "cost": "עלות",
      "margin": "מרווח",
      "noRevenue": "—",
      "status": {
        "Lead": "ליד",
        "Design": "עיצוב",
        "Production": "ייצור"
      }
    }
  }
}
```

### Previous Story Intelligence (Story 3.1)

**Key patterns established in Story 3.1:**
- `useMemo` for all derived data to avoid React 19 + Zustand v5 subscription conflicts
- `@include card-surface` for card-like containers
- `@include interactive-reset` for clickable non-button elements
- CSS logical properties throughout — no `left`/`right`
- `font-variant-numeric: tabular-nums` for aligned numeric amounts
- Touch targets ≥ 44px for interactive elements
- `$transition-fast` for hover effects
- `Skeleton` component for loading states
- `formatCurrency(amountAgora, currency)` for all amount display
- `useNavigate()` from React Router for programmatic navigation
- `useTranslation()` for all text
- Auth user from `auth.currentUser` via `@/services` (not from auth feature)
- `getDelta` extracted to shared export from HeroStat (DRY pattern)

**Critical learnings from Stories 1.1-3.1:**
- Zod 4 `.default()` creates input/output type divergence — DO NOT use `.default()` on form schemas
- SCSS: `$bp-sm` (640px), `$bp-md` (768px), `$bp-lg` (1024px) — NOT `$breakpoint-sm`
- SCSS: `$text-lg` not `$font-size-lg`, `$font-semibold` not `$font-weight-semibold`
- `$space-2xs` does NOT exist — use `$space-xs` (4px) as smallest spacing
- `$radius-xs` does NOT exist — smallest is `$radius-sm` (8px) or `2px` literal
- Phosphor icon dynamic imports in jsdom cause slow module loading — use `vi.mock` for all icons
- `src/__mocks__/react-i18next.ts` mock returns translation key as string (with `|key=value` for interpolation)
- `src/__mocks__/css-module.ts` provides Proxy-based CSS module mock
- React 19 + Zustand v5 `useSyncExternalStore` infinite loop when using both `useStore()` and `useStore(selector)` — derive filtered data via `useMemo` from raw arrays
- `getDelta` returns `null` when value is 0 (no misleading "0%" display)
- `@include interactive-reset` MUST be added to clickable non-button div elements
- `min-block-size: 44px` for mobile touch targets
- `aria-label` on interactive elements for accessibility
- 534 tests currently passing

### Git Intelligence

**Recent commits (most recent first):**
- `dee3ef6` — Implement Story 3.1: Hero Stat & KPI Cards with code review fixes
- `bf63da3` — Fix Firestore documents dropped due to null server timestamps
- `2bd0e12` — Implement Story 2.5: Work Order Detail Page with code review fixes
- `1de4d30` — Implement Story 2.4: Nutrition Label & Margin Calculations with code review fixes
- `26bc9de` — Implement Story 2.3: Manual Transaction Entry & Cost/Revenue Linkage with code review fixes

**Established code patterns:**
- Single comprehensive commit per story
- Components use `vi.mock('@phosphor-icons/react', ...)` pattern in tests
- `useMemo` for derived data to avoid Zustand subscription issues
- `@include card-surface` for card containers
- All amounts formatted with `formatCurrency()`
- CSS logical properties throughout
- Error toast handling: `try/catch` with empty catch blocks
- `await import()` pattern for components with Phosphor icons in tests

### Phosphor Icons for this Story

```typescript
import { Briefcase, Warning, WarningCircle } from '@phosphor-icons/react';
// Briefcase → Project icon in tinted rounded rect (matches Active Projects KPI)
// Warning → Caution icon for watch margin (20-29%)
// WarningCircle → Warning icon for danger margin (< 20%)
```

**Test mock must include these icons plus all existing dashboard icons:**
```typescript
vi.mock('@phosphor-icons/react', () => {
  const iconStub = (name: string) =>
    function MockIcon({ size, className }: { size?: number; className?: string }) {
      return <svg data-testid={`icon-${name}`} className={className} />;
    };
  return {
    // Existing dashboard icons
    CurrencyCircleDollar: iconStub('CurrencyCircleDollar'),
    Briefcase: iconStub('Briefcase'),
    Receipt: iconStub('Receipt'),
    Tray: iconStub('Tray'),
    // NEW for Project Health
    Warning: iconStub('Warning'),
    WarningCircle: iconStub('WarningCircle'),
    // Layout/shared icons
    CheckCircle: iconStub('CheckCircle'),
    XCircle: iconStub('XCircle'),
    Info: iconStub('Info'),
    X: iconStub('X'),
    Bell: iconStub('Bell'),
    ChartBar: iconStub('ChartBar'),
    ClipboardText: iconStub('ClipboardText'),
    GearSix: iconStub('GearSix'),
    MagnifyingGlass: iconStub('MagnifyingGlass'),
  };
});
```

### Existing Utilities to Reuse

**From `@/lib/margins`:**
```typescript
calculateMargin(revenueAgora, totalCostAgora, bufferAgora?) → number
getMarginStatus(marginPercent) → 'healthy' | 'watch' | 'danger'
// Thresholds: ≥30% healthy, 20-29% watch, <20% danger
```

**From `@/lib/currency`:**
```typescript
formatCurrency(amountAgora, currency) → string  // "₪8,200.00"
```

**From `@/types/workOrder`:**
```typescript
interface WorkOrder {
  id: string;
  clientName: string;
  projectDescription: string;
  deadline: Date | null;
  status: 'Lead' | 'Design' | 'Production' | 'Shipped';
  revenueTotalAgora: number;
  directCostAgora: number;
  inventoryCostAgora: number;
  overheadAllocationAgora: number;
  createdAt: Date;
  updatedAt: Date;
}
```

**From `@/components`:**
```typescript
Skeleton  // { variant, width, height, className }
Button    // Primary CTA button for empty state
```

### Potential Pitfalls to Avoid

1. **DO NOT install any npm packages** — everything needed is already installed.

2. **DO NOT import from other feature modules** — use `@/components`, `@/stores`, `@/lib`, `@/types` for shared code.

3. **DO NOT use `@use` in `.module.scss` files** — tokens and mixins are auto-imported via Vite.

4. **DO NOT use `$space-2xs` or `$radius-xs`** — they don't exist. Smallest spacing is `$space-xs` (4px), smallest radius is `$radius-sm` (8px).

5. **DO NOT use `left`/`right` in CSS** — use CSS logical properties only (`inline-start`, `inline-end`, `margin-inline`, `padding-inline`).

6. **Beware dual Zustand subscription** — The `useDashboardData` hook already uses the SAFER pattern (single `useWorkOrderStore()` call). When adding `workOrders` to the return, return `woStore.workOrders` directly — do NOT call `useWorkOrderStore(s => s.workOrders)` separately.

7. **Margin display for 0 revenue** — When `revenueTotalAgora === 0`, `calculateMargin` returns 0. Display "—" instead of "0%" to indicate no meaningful margin data.

8. **Sort stability** — `Array.sort` is stable in modern browsers. The two-level sort (status priority then margin) will work correctly.

9. **Test i18n mock behavior** — The global mock returns the translation key. For keys with interpolation like `t('dashboard.projectHealth.count', { count: 3 })`, the mock outputs `dashboard.projectHealth.count|count=3`. Write assertions accordingly.

10. **Phosphor icon mocking in tests** — Must `vi.mock('@phosphor-icons/react', ...)` BEFORE importing the component. Use `await import()` for the component. Include ALL icons used transitively (by Button, Layout, etc.) to avoid jsdom hangs.

11. **Do NOT show margin bar for 0 revenue** — When revenue is 0, the margin is meaningless. Show "—" and an empty/hidden bar.

12. **Clickable row accessibility** — Use `@include interactive-reset` on the button/div, add `role="link"` (since it navigates), `tabIndex={0}`, `aria-label` with project name and margin status, and handle both Enter and Space key events.

13. **DashboardPage test update** — The existing `DashboardPage.test.tsx` mocks `useDashboardData`. Add `workOrders` to the mock data to test ProjectList integration. Add a few mock WorkOrder objects.

14. **Skeleton count** — Show 3 skeleton rows during loading (not the actual count, which is unknown).

### Cross-Story Context

This is **Story 3.2 — the second story in Epic 3** (Dashboard & Project Health):

- **Epic 1** (DONE): Project scaffold, design system, auth, app shell, i18n, shared components
- **Epic 2** (DONE): Work Order CRUD, status lifecycle, manual transactions, Nutrition Label, detail page
- **Epic 3** (IN PROGRESS):
  - Story 3.1 (DONE): Hero Stat + KPI Cards — the "at a glance" financial cockpit
  - **Story 3.2 (this)**: Project Health Table — scannable project list with margin indicators
  - Story 3.3 (next): Real-time Dashboard Data Layer — optimized subscriptions, enhanced tax jar

**After this story**: The Dashboard will show Net Profit hero stat, 4 KPI cards, AND a Project Health Table with all active projects and their margin health. Story 3.3 will optimize the data layer for real-time performance.

### Project Structure Notes

**Files to CREATE:**

| File | Purpose |
|---|---|
| `src/features/dashboard/components/ProjectRow.tsx` | Individual project row component |
| `src/features/dashboard/components/ProjectRow.module.scss` | Project row styles |
| `src/features/dashboard/components/ProjectRow.test.tsx` | Project row tests |
| `src/features/dashboard/components/ProjectList.tsx` | Project health section container |
| `src/features/dashboard/components/ProjectList.module.scss` | Project list styles |
| `src/features/dashboard/components/ProjectList.test.tsx` | Project list tests |

**Files to MODIFY:**

| File | Change |
|---|---|
| `src/features/dashboard/hooks/useDashboardData.ts` | Add `workOrders` to return value |
| `src/features/dashboard/DashboardPage.tsx` | Add ProjectList below KPI row |
| `src/features/dashboard/DashboardPage.test.tsx` | Add project health integration tests |
| `src/features/dashboard/components/index.ts` | Add ProjectList, ProjectRow exports |
| `src/i18n/en.json` | Add `dashboard.projectHealth` keys |
| `src/i18n/he.json` | Add `dashboard.projectHealth` keys |

**Files NOT to modify:**
- `src/router.tsx` — route already registered
- `src/features/dashboard/index.ts` — already re-exports components and hooks
- `src/stores/*` — complete with selectors
- `src/types/*` — WorkOrder type has all fields needed
- `src/lib/margins.ts` — `calculateMargin`, `getMarginStatus` already implemented
- `src/lib/currency.ts` — `formatCurrency` already implemented
- `src/components/*` — Skeleton, Button components complete
- `src/hooks/useFirestoreCollection.ts` — generic listener complete
- `src/features/dashboard/components/HeroStat.tsx` — unchanged
- `src/features/dashboard/components/KpiCard.tsx` — unchanged

### References

- [Source: planning-artifacts/epics.md#Story-3.2] — Full acceptance criteria
- [Source: planning-artifacts/epics.md#Epic-3] — Epic context and story sequence
- [Source: planning-artifacts/architecture.md#Frontend-Architecture] — Component architecture, state management
- [Source: planning-artifacts/architecture.md#Implementation-Patterns] — Naming, structure, data flow
- [Source: planning-artifacts/architecture.md#Enforcement-Guidelines] — CSS logical properties, co-located tests
- [Source: planning-artifacts/architecture.md#Project-Structure] — Directory tree: ProjectRow.tsx, ProjectList.tsx in dashboard components
- [Source: planning-artifacts/ux-design-specification.md#Project-List] — "Icon Cards with Margin Bars" visual spec
- [Source: planning-artifacts/ux-design-specification.md#Project-Row] — Component anatomy and states
- [Source: planning-artifacts/ux-design-specification.md#Responsive-Strategy] — Desktop/tablet/mobile layouts for project list
- [Source: planning-artifacts/ux-design-specification.md#Component-Strategy] — Phase 3 implementation: ProjectRow, Margin Bar
- [Source: implementation-artifacts/3-1-hero-stat-kpi-cards.md] — Previous story patterns, SCSS token learnings, test infrastructure

## Dev Agent Record

### Agent Model Used

Claude claude-4.6-opus (Cursor IDE)

### Debug Log References

- DashboardPage test `renders all 4 KPI Phosphor icons` needed fix: `getByTestId('icon-Briefcase')` → `getAllByTestId` due to Briefcase icon now appearing in both KPI card and ProjectRow components.
- `npm run build` fails inside Cursor sandbox due to `sass-embedded` dispatcher issue — passes correctly outside sandbox.

### Completion Notes List

- Task 1: Added `workOrders: woStore.workOrders` to `useDashboardData` return value. No new subscriptions needed — work_orders collection already subscribed.
- Task 2: Created `ProjectRow` component with button element, Briefcase icon in tinted rect, client name + status, revenue/cost amounts (desktop only), margin percentage + mini bar with color-coded status (healthy/watch/danger), Warning/WarningCircle icons, red-tinted border for danger rows, skeleton loading variant, mobile responsive (hides revenue/cost columns), keyboard accessible with aria-label.
- Task 3: Created `ProjectList` component with useMemo sorting (Production → Design → Lead, then margin ascending), Shipped filter, section header with title + active count, empty state with Briefcase icon + CTA button navigating to /work-orders, 3 skeleton row placeholders during loading, aria-busy attribute.
- Task 4: Integrated ProjectList below KPI row in DashboardPage. Destructured workOrders from useDashboardData.
- Task 5: Added `dashboard.projectHealth` i18n keys to both en.json and he.json — title, count (with plural forms), emptyTitle, emptyCta, revenue, cost, margin, noRevenue, status labels.
- Task 6: Created 11 ProjectRow tests (rendering, margin states, icons, click, keyboard, skeleton, accessibility), 10 ProjectList tests (header, filtering, sorting, navigation, empty state, skeleton, loading), 5 DashboardPage integration tests (project health section, count, empty state, navigation, skeleton rows). Total: 560 tests passing (26 new).
- Task 7: tsc zero errors, lint zero new errors (1 pre-existing HeroStat warning), 560 tests pass, build succeeds.

### Change Log

- 2026-02-07: Implemented Story 3.2 — Project Health Table with margin indicators, sorting, filtering, empty/loading states, mobile responsive layout, i18n (en/he), and comprehensive tests (26 new, 560 total passing).

### File List

**Created:**
- `src/features/dashboard/components/ProjectRow.tsx`
- `src/features/dashboard/components/ProjectRow.module.scss`
- `src/features/dashboard/components/ProjectRow.test.tsx`
- `src/features/dashboard/components/ProjectList.tsx`
- `src/features/dashboard/components/ProjectList.module.scss`
- `src/features/dashboard/components/ProjectList.test.tsx`

**Modified:**
- `src/features/dashboard/hooks/useDashboardData.ts` — added workOrders to return value
- `src/features/dashboard/DashboardPage.tsx` — added ProjectList below KPI row
- `src/features/dashboard/DashboardPage.test.tsx` — added project health integration tests, WarningCircle mock, workOrders mock data, margin lib mocks
- `src/features/dashboard/components/index.ts` — added ProjectRow, ProjectList exports
- `src/i18n/en.json` — added dashboard.projectHealth namespace
- `src/i18n/he.json` — added dashboard.projectHealth namespace
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — 3-2 status: ready-for-dev → in-progress → review
