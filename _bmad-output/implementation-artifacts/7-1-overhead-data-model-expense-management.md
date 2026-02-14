# Story 7.1: Overhead Data Model & Expense Management

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As **Gal**,
I want to track all overhead expenses by category with manual entry and AI auto-classification,
so that I have full visibility into the fixed costs of running the business.

## Acceptance Criteria

1. **Given** `src/types/overhead.ts`, **When** the Overhead type and Zod schema are created, **Then** `overheadSchema` validates: `id` (string), `category` (enum: subscriptions | software | meals | office | general), `amountAgora` (integer, required), `currency` (enum: ILS | USD | EUR, default ILS), `date` (Date, required), `description` (string, optional), `recurrence` (enum: one_time | monthly | yearly, default one_time), `source` (enum: manual | ai), `transactionId` (optional — links to AI-classified transaction if applicable), `isActive` (boolean, for recurring items), `createdAt` (Timestamp), `updatedAt` (Timestamp) **And** `Overhead` TypeScript type is inferred from schema.

2. **Given** `src/stores/useOverheadStore.ts`, **When** the Zustand store is created, **Then** it holds `overhead: Overhead[]`, `loading: boolean`, `error: string | null` **And** selectors: `selectByCategory`, `selectCurrentMonth`, `selectRecurring`.

3. **Given** `src/features/overhead/hooks/useOverhead.ts`, **When** the Firestore real-time hook is created, **Then** it subscribes to the `overhead` collection via `onSnapshot` **And** data flows through Zod validation into `useOverheadStore`.

4. **Given** the Overhead page (`/overhead`), **When** overhead entries exist, **Then** a category breakdown displays: each category (subscriptions, software, meals, office, general) with total amount for current month **And** entries are listed below by category with: description, amount (formatted), date, recurrence badge, source badge (manual / AI) **And** recurring items show a "Monthly" or "Yearly" badge.

5. **Given** the Overhead page, **When** no overhead entries exist, **Then** a warm empty state displays: "No overhead tracked yet" with hint about categories and a CTA to add an entry.

6. **Given** the Overhead page, **When** Gal clicks "Add Overhead", **Then** a form appears (React Hook Form) with: Category (dropdown, required), Amount (currency input), Date, Description, Recurrence (one-time / monthly / yearly) **And** form validates via Zod schema **And** on submit, a document is created in Firestore `overhead` with `source: 'manual'` **And** success toast confirms.

7. **Given** a transaction approved with `category: 'Overhead'` via the AI pipeline, **When** the `onTransactionApproved` Cloud Function processes it, **Then** a corresponding `overhead` document is created with `source: 'ai'` and `transactionId` linking back **And** the category is derived from the AI classification (developing@ mailbox → software, expenses@ → general, or per AI suggestion).

8. **Given** the Overhead page on mobile, **When** rendered on a small viewport, **Then** categories stack vertically with totals **And** entry rows are compact with touch-friendly targets.

## Tasks / Subtasks

- [x] Task 1: Create Overhead type, Zod schema, and form input schema (AC: #1)
  - [x] 1.1 Implement `overheadSchema` + `Overhead` type in `src/types/overhead.ts`
  - [x] 1.2 Implement `createOverheadSchema` + `CreateOverheadInput` form schema
  - [x] 1.3 Create `src/types/overhead.test.ts` with schema validation tests
  - [x] 1.4 Update `src/types/index.ts` barrel export
- [x] Task 2: Create Zustand store with selectors (AC: #2)
  - [x] 2.1 Implement `useOverheadStore` in `src/stores/useOverheadStore.ts`
  - [x] 2.2 Add selectors: `selectByCategory`, `selectCurrentMonth`, `selectRecurring`
  - [x] 2.3 Update `src/stores/index.ts` barrel export
- [x] Task 3: Create Firestore real-time hook (AC: #3)
  - [x] 3.1 Implement `useOverhead` in `src/features/overhead/hooks/useOverhead.ts`
  - [x] 3.2 Update `src/features/overhead/hooks/index.ts` barrel export
- [x] Task 4: Build CategoryBreakdown component (AC: #4, #8)
  - [x] 4.1 Create `src/features/overhead/components/CategoryBreakdown.tsx`
  - [x] 4.2 Create `src/features/overhead/components/CategoryBreakdown.module.scss`
  - [x] 4.3 Create `src/features/overhead/components/CategoryBreakdown.test.tsx`
- [x] Task 5: Build OverheadForm component (AC: #6)
  - [x] 5.1 Create `src/features/overhead/components/OverheadForm.tsx`
  - [x] 5.2 Create `src/features/overhead/components/OverheadForm.module.scss`
  - [x] 5.3 Create `src/features/overhead/components/OverheadForm.test.tsx`
- [x] Task 6: Rebuild OverheadPage — replace placeholder (AC: #4, #5, #6, #8)
  - [x] 6.1 Rewrite `src/features/overhead/OverheadPage.tsx` with full functionality
  - [x] 6.2 Rewrite `src/features/overhead/OverheadPage.module.scss`
  - [x] 6.3 Rewrite `src/features/overhead/OverheadPage.test.tsx`
  - [x] 6.4 Update `src/features/overhead/components/index.ts` barrel export
- [x] Task 7: Update Cloud Function for AI overhead creation (AC: #7)
  - [x] 7.1 Add overhead document creation to `functions/src/triggers/onTransactionApproved.ts`
  - [x] 7.2 Update `functions/tests/triggers.test.ts` with overhead creation tests
- [x] Task 8: Add i18n keys (AC: #1–#8)
  - [x] 8.1 Add `overhead.*` keys to `src/i18n/en.json`
  - [x] 8.2 Add Hebrew translations to `src/i18n/he.json`

## Dev Notes

### Overhead Schema — `src/types/overhead.ts`

**Replace the empty placeholder with full implementation:**

```typescript
import { z } from 'zod';

export const OVERHEAD_CATEGORIES = ['subscriptions', 'software', 'meals', 'office', 'general'] as const;
export const OVERHEAD_RECURRENCE = ['one_time', 'monthly', 'yearly'] as const;
export const OVERHEAD_SOURCE = ['manual', 'ai'] as const;

export const overheadSchema = z.object({
  id: z.string(),
  category: z.enum(OVERHEAD_CATEGORIES),
  amountAgora: z.number().int(),
  currency: z.enum(['ILS', 'USD', 'EUR']).default('ILS'),
  date: z.date(),
  description: z.string().nullable().default(null),
  recurrence: z.enum(OVERHEAD_RECURRENCE).default('one_time'),
  source: z.enum(OVERHEAD_SOURCE),
  transactionId: z.string().nullable().default(null),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Overhead = z.infer<typeof overheadSchema>;
```

**Form input schema (separate, no `.default()` per Zod v4 pattern):**

```typescript
export const createOverheadSchema = z.object({
  category: z.enum(OVERHEAD_CATEGORIES, { error: 'Category is required' }),
  amountIls: z.number().positive({ error: 'Amount must be greater than 0' }),
  date: z.string().min(1, { error: 'Date is required' }),
  description: z.string().default(''),
  recurrence: z.enum(OVERHEAD_RECURRENCE),
});

export type CreateOverheadInput = z.infer<typeof createOverheadSchema>;
```

**CRITICAL:**
- `amountIls` is a display value in ILS — convert to agora via `toMinorUnits()` on submit (same pattern as RestockForm's `totalCostIls`)
- `date` is a string (from HTML `<input type="date">`) — convert to Firestore Timestamp on submit
- `description` uses `.default('')` NOT `.nullable()` because react-hook-form text inputs use empty string
- No `.default()` on `category` — form requires explicit selection

### Zustand Store — `src/stores/useOverheadStore.ts`

**Replace the empty placeholder. Follow `useInventoryStore` pattern exactly:**

```typescript
import { create } from 'zustand';
import type { Overhead } from '@/types';

interface OverheadStore {
  overhead: Overhead[];
  loading: boolean;
  error: string | null;
  setOverhead: (items: Overhead[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useOverheadStore = create<OverheadStore>((set) => ({
  overhead: [],
  loading: true,
  error: null,
  setOverhead: (overhead) => set({ overhead, loading: false, error: null }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error, loading: false }),
}));

// Selectors (OUTSIDE store per architecture pattern)
export const selectByCategory = (category: string) => (state: OverheadStore) =>
  state.overhead.filter((item) => item.category === category);

export const selectCurrentMonth = (state: OverheadStore) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  return state.overhead.filter((item) => {
    // Include one-time entries from current month
    if (item.recurrence === 'one_time') {
      return item.date.getFullYear() === year && item.date.getMonth() === month;
    }
    // Include all active recurring entries (they contribute every month)
    return item.isActive;
  });
};

export const selectRecurring = (state: OverheadStore) =>
  state.overhead.filter((item) => item.recurrence !== 'one_time' && item.isActive);
```

**CRITICAL:** `selectCurrentMonth` includes one-time entries for the current month PLUS all active recurring entries regardless of their original date. This matches the epics AC: "monthly total includes all one-time entries for the current month + all active recurring entries."

### Firestore Hook — `src/features/overhead/hooks/useOverhead.ts`

**Follow `useInventory` hook pattern exactly:**

```typescript
import { useFirestoreCollection } from '@/hooks';
import { useOverheadStore } from '@/stores';
import { overheadSchema } from '@/types';

export function useOverhead() {
  const { setOverhead, setLoading, setError } = useOverheadStore();

  useFirestoreCollection('overhead', overheadSchema, {
    onData: setOverhead,
    onError: setError,
    onLoading: setLoading,
  });

  return useOverheadStore();
}
```

### CategoryBreakdown Component

**Location:** `src/features/overhead/components/CategoryBreakdown.tsx`

**This displays the category-by-category breakdown with totals.**

**Props interface:**
```typescript
interface CategoryBreakdownProps {
  overhead: Overhead[];
  loading?: boolean;
}
```

**Behavior:**
- Groups overhead entries by category
- Calculates total for each category (current month entries only — use `selectCurrentMonth` logic)
- Sorts categories by total amount (highest first)
- Each category row shows: category icon + name, total amount (formatted via `formatCurrency`), entry count
- Categories use semantically meaningful icons from Phosphor:

| Category | Icon | Import |
|----------|------|--------|
| `subscriptions` | `Repeat` | `@phosphor-icons/react` |
| `software` | `Desktop` | `@phosphor-icons/react` |
| `meals` | `ForkKnife` | `@phosphor-icons/react` |
| `office` | `Buildings` | `@phosphor-icons/react` |
| `general` | `DotsThreeCircle` | `@phosphor-icons/react` |

**Category color mapping:** Use the semantic color tokens. Since overhead is an expense, all categories use the same base color (`$text-primary`) with the accent being category-specific background tinting. Keep it simple — no per-category colors needed for MVP. Just use `$bg-tertiary` backgrounds with category icon colors. But to provide visual distinction:

```typescript
const CATEGORY_CONFIG: Record<string, { icon: React.ComponentType<IconProps>; color: string }> = {
  subscriptions: { icon: Repeat, color: '#e879f9' },    // purple-ish
  software:      { icon: Desktop, color: '#60a5fa' },    // blue
  meals:         { icon: ForkKnife, color: '#f97316' },  // orange
  office:        { icon: Buildings, color: '#34d399' },   // green
  general:       { icon: DotsThreeCircle, color: '#a78bfa' }, // violet
};
```

Define these as local constants (not global SCSS variables) — they're category-specific UI decoration, not design system tokens.

**SCSS patterns:** Use `@include card-surface` for each category card. Stack vertically on mobile. Grid on desktop (2 columns).

### OverheadForm Component

**Location:** `src/features/overhead/components/OverheadForm.tsx`

**Follow RestockForm pattern exactly for layout, SCSS, and form handling.**

**Props interface:**
```typescript
interface OverheadFormProps {
  onSubmit: (data: CreateOverheadInput) => Promise<void>;
  onCancel: () => void;
}
```

**Form fields (React Hook Form + zodResolver):**

1. **Category:** `Select` (required, searchable, no default — must choose). Options: subscriptions, software, meals, office, general. Labels from i18n: `overhead.categories.subscriptions`, etc.
2. **Amount:** `Input` type="number", step="0.01", min=0. Uses `setValueAs: toNumberOrZero` (same pattern as RestockForm). This is the ILS display value — convert to agora on submit.
3. **Date:** `Input` type="date". Default to today. Use `defaultValues: { date: new Date().toISOString().split('T')[0] }`.
4. **Description:** `Input` type="text". Optional. Placeholder: "e.g., Adobe subscription, Team lunch, Office supplies".
5. **Recurrence:** `Select`. Options: one_time (default), monthly, yearly. Labels from i18n.
6. **Actions:** Cancel (ghost) + "Add Overhead" (primary).

**Form submission handler in OverheadPage (NOT in the form component itself):**

```typescript
const handleAddOverhead = useCallback(async (data: CreateOverheadInput) => {
  await addDoc(collection(db, 'overhead'), {
    category: data.category,
    amountAgora: toMinorUnits(data.amountIls),
    currency: 'ILS',
    date: Timestamp.fromDate(new Date(data.date)),
    description: data.description || null,
    recurrence: data.recurrence,
    source: 'manual',
    transactionId: null,
    isActive: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  toast.success(t('overhead.addSuccess'));
  setFormMode({ type: 'closed' });
}, [t]);
```

**CRITICAL:** 
- `amountIls` → `toMinorUnits(data.amountIls)` for agora conversion. Import `toMinorUnits` from `@/lib/currency`.
- `date` string → `Timestamp.fromDate(new Date(data.date))`. Import `Timestamp` from `firebase/firestore`.
- `description` empty string → `null` when writing to Firestore (same pattern as waste `workOrderId`).
- `source: 'manual'` — always for user-entered overhead.
- Use `addDoc` (not `setDoc`) — Firestore auto-generates the document ID.

**SCSS:** Copy `RestockForm.module.scss` structure. Same `@include card-surface`, same `.fields` layout, same `.actions` with mobile column-reverse.

### OverheadPage — Full Replacement

**Replace the placeholder `OverheadPage.tsx` entirely.**

**Page state management:**
```typescript
type FormMode = { type: 'closed' } | { type: 'create' };

export function OverheadPage() {
  const { t } = useTranslation();
  const { overhead, loading } = useOverhead();
  const [formMode, setFormMode] = useState<FormMode>({ type: 'closed' });

  // Current month entries (for totals and display)
  const currentMonthEntries = useOverheadStore(selectCurrentMonth);
  const totalMonthlyAgora = currentMonthEntries.reduce((sum, item) => {
    if (item.recurrence === 'monthly') return sum + item.amountAgora;
    if (item.recurrence === 'yearly') return sum + Math.round(item.amountAgora / 12);
    return sum + item.amountAgora; // one_time
  }, 0);

  // ... handlers, render
}
```

**Page layout:**
1. **Header:** Page title ("Overhead") + "Add Overhead" button (primary, `Plus` icon)
2. **Monthly Total Summary:** Large formatted amount showing current month total overhead
3. **CategoryBreakdown component** — shows per-category totals
4. **Entry list** — all overhead entries grouped by category, sorted by date (newest first)
5. **OverheadForm** — shown when formMode is 'create'
6. **Empty state** — when no overhead entries exist

**Entry list item display:**
```
[Category Icon] [Description] | [Amount formatted] | [Date] | [Recurrence badge] | [Source badge]
```

Recurrence badge: `StatusBadge` or simple styled span — "Monthly" / "Yearly" / no badge for one-time.
Source badge: "AI" (with `$info` blue) or "Manual" (muted).

**Render blocks:**
```tsx
{overhead.length === 0 && !loading && (
  <div className={styles.emptyState}>
    <Receipt size={48} className={styles.emptyIcon} />
    <h2 className={styles.emptyTitle}>{t('overhead.emptyTitle')}</h2>
    <p className={styles.emptyDescription}>{t('overhead.emptyDescription')}</p>
    <Button onClick={() => setFormMode({ type: 'create' })}>
      <Plus size={18} weight="bold" />
      {t('overhead.addButton')}
    </Button>
  </div>
)}

{formMode.type === 'create' && (
  <OverheadForm
    onSubmit={handleAddOverhead}
    onCancel={() => setFormMode({ type: 'closed' })}
  />
)}

{overhead.length > 0 && (
  <>
    <CategoryBreakdown overhead={currentMonthEntries} loading={loading} />
    {/* Entry list by category */}
    {OVERHEAD_CATEGORIES.map((cat) => {
      const catEntries = overhead.filter((e) => e.category === cat);
      if (catEntries.length === 0) return null;
      return (
        <section key={cat} className={styles.categorySection}>
          <h3 className={styles.categoryTitle}>{t(`overhead.categories.${cat}`)}</h3>
          {catEntries
            .sort((a, b) => b.date.getTime() - a.date.getTime())
            .map((entry) => (
              <OverheadEntryRow key={entry.id} entry={entry} />
            ))}
        </section>
      );
    })}
  </>
)}
```

**OverheadEntryRow** — inline sub-component in OverheadPage (or separate file if it gets complex):

```tsx
function OverheadEntryRow({ entry }: { entry: Overhead }) {
  const { t, i18n } = useTranslation();
  return (
    <div className={styles.entryRow}>
      <span className={styles.entryDescription}>
        {entry.description || t(`overhead.categories.${entry.category}`)}
      </span>
      <span className={styles.entryAmount}>
        {formatCurrency(entry.amountAgora, entry.currency)}
      </span>
      <span className={styles.entryDate}>
        {entry.date.toLocaleDateString(i18n.language)}
      </span>
      {entry.recurrence !== 'one_time' && (
        <span className={styles.recurrenceBadge}>
          {t(`overhead.recurrence.${entry.recurrence}`)}
        </span>
      )}
      <span className={`${styles.sourceBadge} ${entry.source === 'ai' ? styles.sourceAi : styles.sourceManual}`}>
        {entry.source === 'ai' ? 'AI' : t('overhead.sourceManual')}
      </span>
    </div>
  );
}
```

### Cloud Function Update — `onTransactionApproved.ts`

**Add overhead document creation when an Overhead-category transaction is approved.**

**Location:** `functions/src/triggers/onTransactionApproved.ts`

Currently, the `handleApproval` function only updates Work Order totals (skipping Overhead category). Add a new function to create overhead documents:

```typescript
/**
 * Create an overhead document when an Overhead-category transaction is approved.
 * Maps the transaction to the overhead collection with source: 'ai'.
 */
async function createOverheadFromTransaction(
  db: FirebaseFirestore.Firestore,
  transactionId: string,
  afterData: Record<string, unknown>,
): Promise<void> {
  const category = afterData.category as string;
  if (category !== 'Overhead') return;

  const amountAgora = afterData.amountAgora as number;
  const currency = (afterData.currency as string) ?? 'ILS';
  const date = afterData.date ?? FieldValue.serverTimestamp();
  const vendorName = afterData.vendorName as string | undefined;

  // Map mailbox-based category to overhead category
  // Default to 'general' — the user can recategorize on the Overhead page if needed
  const overheadCategory = 'general';

  await db.collection('overhead').add({
    category: overheadCategory,
    amountAgora,
    currency,
    date,
    description: vendorName ?? null,
    recurrence: 'one_time',
    source: 'ai',
    transactionId,
    isActive: true,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  logger.info('Overhead document created from transaction', { transactionId, amountAgora });
}
```

**Call this from `handleApproval`:**

```typescript
async function handleApproval(
  db: FirebaseFirestore.Firestore,
  transactionId: string,
  beforeData: Record<string, unknown>,
  afterData: Record<string, unknown>,
  actorUid: string,
): Promise<void> {
  // ... existing code ...

  const operations: Promise<void>[] = [];

  // Update Work Order totals if applicable
  if (workOrderId && category && amountAgora !== undefined) {
    operations.push(
      updateWorkOrderTotals(db, workOrderId, category, amountAgora).catch((error) => {
        logger.error('Failed to update Work Order totals', { /* ... */ });
      }),
    );
  }

  // NEW: Create overhead document for Overhead-category transactions
  if (category === 'Overhead' && amountAgora !== undefined) {
    operations.push(
      createOverheadFromTransaction(db, transactionId, afterData).catch((error) => {
        logger.error('Failed to create overhead document', {
          transactionId,
          error: error instanceof Error ? error.message : String(error),
        });
      }),
    );
  }

  // Create audit trail
  operations.push(
    createAuditLog(db, transactionId, 'approved', actorUid, beforeData, afterData),
  );

  await Promise.allSettled(operations);
}
```

**CRITICAL:** The overhead creation is fire-and-forget (`.catch()` logs error but doesn't throw). Same pattern as WO update and audit trail. Errors never block the approval flow.

**Default overhead category is `'general'`** — the AC says "the category is derived from the AI classification (developing@ mailbox → software, expenses@ → general, or per AI suggestion)." For now, use 'general' as the default. The AI doesn't currently output an overhead sub-category, so this is a safe default. Users can manually recategorize later (a future enhancement, not this story).

### Project Structure Notes

**New files to create:**
```
src/types/overhead.test.ts                                    # Schema validation tests
src/features/overhead/components/CategoryBreakdown.tsx         # Category breakdown display
src/features/overhead/components/CategoryBreakdown.module.scss # Category breakdown styles
src/features/overhead/components/CategoryBreakdown.test.tsx    # CategoryBreakdown tests
src/features/overhead/components/OverheadForm.tsx              # Add overhead form
src/features/overhead/components/OverheadForm.module.scss      # Form styles
src/features/overhead/components/OverheadForm.test.tsx         # OverheadForm tests
src/features/overhead/hooks/useOverhead.ts                     # Firestore real-time hook
```

**Files to modify (replace placeholders or update):**
```
src/types/overhead.ts                                  # Replace placeholder with full schema
src/types/index.ts                                     # Add overhead exports
src/stores/useOverheadStore.ts                         # Replace placeholder with full store
src/stores/index.ts                                    # Add useOverheadStore + selector exports
src/features/overhead/OverheadPage.tsx                 # Replace placeholder with full page
src/features/overhead/OverheadPage.module.scss         # Replace placeholder styles
src/features/overhead/OverheadPage.test.tsx             # Replace placeholder tests
src/features/overhead/components/index.ts              # Add component exports
src/features/overhead/hooks/index.ts                   # Add useOverhead export
src/i18n/en.json                                       # Add overhead.* keys
src/i18n/he.json                                       # Add Hebrew translations
functions/src/triggers/onTransactionApproved.ts         # Add overhead creation logic
functions/tests/triggers.test.ts                        # Add overhead creation tests
```

**Files that already exist and must NOT be recreated:**

| Component | Location | Reuse For |
|---|---|---|
| `Button` | `src/components/Button/Button.tsx` | Form actions, header buttons. Variants: `primary`, `secondary`, `danger`, `ghost`. Sizes: `sm`, `md`, `lg` |
| `Input` | `src/components/Input/Input.tsx` | Amount, Date, Description fields. Props: `label`, `error`, `helperText`, `hideLabel` |
| `Select` | `src/components/Input/Select.tsx` | Category, Recurrence dropdowns. Props: `options` (`{value, label}[]`), `value`, `onChange`, `label`, `searchable`, `error` |
| `Card` | `src/components/Card/Card.tsx` | Optional wrapper for category cards |
| `Skeleton` | `src/components/Skeleton/Skeleton.tsx` | Loading states |
| `toast` | `src/stores/useUIStore.ts` | Success/error notifications (`toast.success(msg)`, `toast.error(msg)`) |
| `formatCurrency` | `src/lib/currency.ts` | Amount display — `formatCurrency(amountAgora, currency)` → "₪82.00" |
| `toMinorUnits` | `src/lib/currency.ts` | ILS display → agora conversion — `toMinorUnits(amountIls)` |
| `useFirestoreCollection` | `src/hooks/useFirestoreCollection.ts` | Generic real-time collection listener — used in `useOverhead` hook |
| `db` | `src/services/firebase.ts` | Firestore instance |
| `auth` | `src/services/firebase.ts` | Current user for actor context |
| `Receipt` | `@phosphor-icons/react` | Overhead page icon (already used in placeholder) |

### Critical Import Patterns (from Story 6.1–6.4)

```typescript
// Types + schemas (from src/types/overhead.ts)
import type { Overhead, CreateOverheadInput } from '@/types';
import { overheadSchema, createOverheadSchema, OVERHEAD_CATEGORIES, OVERHEAD_RECURRENCE } from '@/types';

// Store + selectors
import { useOverheadStore, selectByCategory, selectCurrentMonth, selectRecurring } from '@/stores';

// Currency
import { formatCurrency, toMinorUnits } from '@/lib/currency';

// Firestore (for form submission in OverheadPage)
import { addDoc, collection, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '@/services';

// Forms
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

// Components
import { Button, Input, Select } from '@/components';

// Icons (Phosphor only — SOLE icon source per architecture)
import { Receipt, Plus, Repeat, Desktop, ForkKnife, Buildings, DotsThreeCircle } from '@phosphor-icons/react';

// Router (not needed for this story — no links out)
// i18n
import { useTranslation } from 'react-i18next';

// Toast
import { toast } from '@/stores/useUIStore';
```

### Testing Patterns (from Story 6.1–6.4)

**Framework:** Vitest + React Testing Library
**Co-located:** `*.test.ts` / `*.test.tsx` next to source files
**SCSS auto-import:** Global variables/mixins auto-imported — no explicit `@use` statements in `.module.scss` files

**Mock Firestore (for OverheadPage form submission tests):**
```typescript
vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual('firebase/firestore');
  return {
    ...actual,
    addDoc: vi.fn().mockResolvedValue({ id: 'new-overhead-id' }),
    collection: vi.fn((_, name) => ({ path: name })),
    serverTimestamp: vi.fn(() => 'mock-server-timestamp'),
    Timestamp: { fromDate: vi.fn((d: Date) => d) },
  };
});
```

**Schema test scenarios (overheadSchema):**
1. Validates complete overhead document with all fields
2. Rejects missing `category`
3. Rejects invalid `category` (not in enum)
4. Rejects non-integer `amountAgora`
5. Defaults `currency` to 'ILS' when not provided
6. Defaults `recurrence` to 'one_time' when not provided
7. Defaults `isActive` to true
8. Accepts nullable `description` and `transactionId`
9. Validates `source` is 'manual' or 'ai'

**Schema test scenarios (createOverheadSchema):**
1. Validates complete form input
2. Rejects missing category
3. Rejects non-positive amount
4. Rejects empty date string
5. Defaults `description` to empty string

**CategoryBreakdown test scenarios:**
1. Renders all categories with correct totals
2. Sorts categories by amount (highest first)
3. Shows category icon and name
4. Formats amounts via `formatCurrency`
5. Shows entry count per category
6. Handles empty overhead array (no categories rendered)
7. Loading state shows skeletons

**OverheadForm test scenarios:**
1. Renders all form fields (category, amount, date, description, recurrence)
2. Date defaults to today
3. Requires category selection — shows error when submitting without
4. Requires positive amount — shows error for 0 or negative
5. Calls onSubmit with correct data shape
6. Calls onCancel when cancel button clicked
7. Disables submit button while submitting
8. Description is optional — can submit without it

**OverheadPage test scenarios:**
1. Shows loading skeleton initially
2. Renders CategoryBreakdown when overhead entries exist
3. Renders entry rows with correct data (description, amount, date, badges)
4. Shows empty state when no entries
5. Opens form when "Add Overhead" clicked
6. Hides form when cancel clicked
7. Shows recurrence badge for monthly/yearly items
8. Shows source badge (AI vs Manual)

### SCSS Patterns

- Use `$error` for red/destructive — `$danger` does NOT exist
- Use `$info` (`#2a7eff`) for AI source badge — it exists in the token set
- CSS logical properties for RTL (`margin-inline-start`, `padding-inline-end`)
- Touch targets ≥ 44px on mobile
- Follow `RestockForm.module.scss` patterns for OverheadForm
- Use `@include card-surface` for category breakdown cards and form
- No explicit `@use` statements — globals auto-imported via Vite `additionalData`
- **Variable names:** Use `$text-lg` NOT `$font-lg`, `$text-sm` NOT `$font-sm`, etc. The font-size tokens are `$text-*`, font-weight tokens are `$font-*`
- **`$surface-secondary` does NOT exist** — use `$bg-secondary` or `$bg-tertiary` instead (see git commit `d6321ee`)
- Breakpoint: use `$bp-sm` (640px) for mobile vs desktop separation
- Animations: `slideDown` keyframe from `_animations.scss` for form appearance

**OverheadPage SCSS structure:**
```scss
.page {
  display: flex;
  flex-direction: column;
  gap: $space-lg;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.pageTitle {
  font-size: $text-xl;
  font-weight: $font-semibold;
  color: $gold;
}

.monthlyTotal {
  @include card-surface;
  padding: $space-lg;
  text-align: center;
}

.monthlyTotalLabel {
  font-size: $text-sm;
  color: $text-secondary;
  margin-block-end: $space-xs;
}

.monthlyTotalAmount {
  font-size: $text-2xl;
  font-weight: $font-semibold;
  color: $gold;
}

.categorySection {
  margin-block-end: $space-md;
}

.categoryTitle {
  font-size: $text-lg;
  font-weight: $font-semibold;
  color: $text-primary;
  margin-block-end: $space-sm;
}

.entryRow {
  display: flex;
  align-items: center;
  gap: $space-sm;
  padding: $space-sm $space-md;
  border-radius: $radius-md;
  background: $bg-secondary;
  min-block-size: 44px;
  margin-block-end: $space-xs;

  @media (max-width: $bp-sm) {
    flex-wrap: wrap;
  }
}

.entryDescription {
  flex: 1;
  @include truncate;
  font-weight: $font-medium;
}

.entryAmount {
  font-weight: $font-semibold;
  white-space: nowrap;
}

.entryDate {
  color: $text-muted;
  font-size: $text-xs;
}

.recurrenceBadge {
  font-size: $text-xs;
  padding: 2px $space-sm;
  border-radius: $radius-full;
  background: $bg-tertiary;
  color: $text-secondary;
}

.sourceBadge {
  font-size: $text-xs;
  padding: 2px $space-sm;
  border-radius: $radius-full;
}

.sourceAi {
  background: rgba($info, 0.15);
  color: $info;
}

.sourceManual {
  background: $bg-tertiary;
  color: $text-muted;
}

.emptyState {
  @include flex-column-center;
  padding: $space-3xl $space-xl;
  gap: $space-md;
}

.emptyIcon {
  color: $text-muted;
}

.emptyTitle {
  font-size: $text-xl;
  font-weight: $font-semibold;
  color: $gold;
}

.emptyDescription {
  color: $text-secondary;
  font-size: $text-base;
  max-width: 400px;
  text-align: center;
}
```

### i18n Keys to Add

**English (`en.json`) — add a new top-level `overhead` object (distinct from existing `pages.overhead`):**

```json
"overhead": {
  "pageTitle": "Overhead",
  "addButton": "Add Overhead",
  "monthlyTotalLabel": "Current Month Total",
  "emptyTitle": "No overhead tracked yet",
  "emptyDescription": "Track your business expenses by category — subscriptions, software, meals, office, and general costs.",
  "addSuccess": "Overhead entry added",
  "addError": "Failed to add overhead entry",
  "categories": {
    "subscriptions": "Subscriptions",
    "software": "Software",
    "meals": "Meals",
    "office": "Office",
    "general": "General"
  },
  "recurrence": {
    "one_time": "One-time",
    "monthly": "Monthly",
    "yearly": "Yearly"
  },
  "source": {
    "manual": "Manual",
    "ai": "AI"
  },
  "sourceManual": "Manual",
  "form": {
    "title": "Add Overhead",
    "category": "Category",
    "categoryRequired": "Category is required",
    "amount": "Amount (ILS)",
    "amountError": "Amount must be greater than 0",
    "date": "Date",
    "dateRequired": "Date is required",
    "description": "Description",
    "descriptionPlaceholder": "e.g., Adobe subscription, Team lunch, Office supplies",
    "recurrence": "Recurrence",
    "submit": "Add Overhead",
    "cancel": "Cancel"
  },
  "breakdown": {
    "title": "Category Breakdown",
    "entries": "{{count}} entries"
  }
}
```

**Hebrew (`he.json`) — same structure:**

```json
"overhead": {
  "pageTitle": "הוצאות קבועות",
  "addButton": "הוסף הוצאה",
  "monthlyTotalLabel": "סה\"כ חודש נוכחי",
  "emptyTitle": "אין הוצאות קבועות עדיין",
  "emptyDescription": "עקוב אחר הוצאות העסק לפי קטגוריה — מנויים, תוכנה, ארוחות, משרד והוצאות כלליות.",
  "addSuccess": "הוצאה נוספה",
  "addError": "שגיאה בהוספת הוצאה",
  "categories": {
    "subscriptions": "מנויים",
    "software": "תוכנה",
    "meals": "ארוחות",
    "office": "משרד",
    "general": "כללי"
  },
  "recurrence": {
    "one_time": "חד פעמי",
    "monthly": "חודשי",
    "yearly": "שנתי"
  },
  "source": {
    "manual": "ידני",
    "ai": "AI"
  },
  "sourceManual": "ידני",
  "form": {
    "title": "הוסף הוצאה",
    "category": "קטגוריה",
    "categoryRequired": "קטגוריה היא שדה חובה",
    "amount": "סכום (₪)",
    "amountError": "הסכום חייב להיות גדול מ-0",
    "date": "תאריך",
    "dateRequired": "תאריך הוא שדה חובה",
    "description": "תיאור",
    "descriptionPlaceholder": "לדוגמה: מנוי Adobe, ארוחת צוות, ציוד משרדי",
    "recurrence": "תדירות",
    "submit": "הוסף הוצאה",
    "cancel": "ביטול"
  },
  "breakdown": {
    "title": "פילוח לפי קטגוריה",
    "entries": "{{count}} רשומות"
  }
}
```

### Cross-Epic Context

- **Epic 3 (Story 3.1):** Dashboard already has a KPI card for "Monthly Overhead" pulling from `useDashboardData`. Currently it computes overhead from `transactions` with `category === 'Overhead'`. Story 7.2 will update this to use the `overhead` collection for more accurate burn rate. Do NOT change the dashboard in this story.
- **Epic 5 (Story 5.4):** `onTransactionApproved` handles transaction approvals. This story adds overhead document creation to it.
- **Epic 2 (Story 2.4):** NutritionLabel shows `overheadAllocationAgora` from the Work Order. This is a per-project overhead allocation, separate from the global overhead tracking. Do NOT modify NutritionLabel.
- **Story 7.2:** Monthly burn rate & trends will build on top of the overhead collection created here. Will add burn rate calculations (monthly → full amount, yearly → /12) and trend comparisons.
- **Story 7.3:** Tax Jar config will use `system_config` collection. Not related to this story.
- **Story 7.4:** Forward projection will factor in monthly overhead burn rate. Depends on Story 7.2.

### Zod v4 Reminders

- Use `{ error: "message" }` NOT `{ message: "message" }` for custom error strings
- Use `z.string().default('')` for optional description (form uses empty string)
- No `.default()` on `createOverheadSchema` fields that the form provides via `defaultValues` — EXCEPT `description` which defaults to empty string
- `overheadSchema` (Firestore document) CAN use `.default()` since it's parsing incoming data, not form input

### Performance

- Overhead collection loads ALL documents via `useFirestoreCollection` and filters client-side. For a 2-user system with expected < 100 overhead entries per month, this is trivially fast.
- `selectCurrentMonth` selector runs on every store update — O(n) where n = total overhead entries. Negligible.
- Category breakdown grouping is O(n). No performance concerns.

### Auth Guard

- Form submission doesn't need explicit auth check — Firestore Security Rules protect writes (same `isAdmin()` pattern as all other collections).
- The `useOverhead` hook uses `useFirestoreCollection` which handles auth implicitly through Firestore listener permissions.

### Firestore Security Rules

The `overhead` collection needs the same rules as other collections. Check `firestore.rules` — if it uses a wildcard match like `match /{document=**}` with `isAdmin()`, no changes needed. If rules are per-collection, add:

```
match /overhead/{docId} {
  allow read, write: if isAdmin();
}
```

### References

- [Source: epics.md — Epic 7, Story 7.1: Overhead Data Model & Expense Management]
- [Source: architecture.md — Data Architecture: overhead collection (category, amountAgora, recurrence, source)]
- [Source: architecture.md — Frontend Architecture: src/features/overhead/ (OverheadTable, CategoryBreakdown, OverheadForm)]
- [Source: architecture.md — State Management: One store per domain — useOverheadStore]
- [Source: architecture.md — Naming: Integer currency fields suffix with Agora, camelCase for code]
- [Source: architecture.md — Cloud Functions: onTransactionApproved trigger]
- [Source: architecture.md — Data Flow: Firestore → Zod → Store → Component]
- [Source: ux-design-specification.md — Overhead is primary nav item, KPI card metric]
- [Source: ux-design-specification.md — Empty states: warm tone, clear action CTA]
- [Source: ux-design-specification.md — Mobile: stacked layout, 44px touch targets, bottom nav]
- [Source: 6-4-audit-log-waste-tracking.md — RestockForm pattern, testing patterns, SCSS patterns, Zod v4 nuances]
- [Source: 6-1-inventory-data-model-item-management.md — toNumberOrZero pattern, schema test patterns, store pattern]
- [Source: functions/src/triggers/onTransactionApproved.ts — Current Overhead handling (skips WO update, no overhead doc creation)]

## Dev Agent Record

### Agent Model Used

Claude claude-4.6-opus (via Cursor)

### Debug Log References

No debug issues encountered.

### Completion Notes List

- **Task 1:** Implemented `overheadSchema` and `createOverheadSchema` with full Zod validation in `src/types/overhead.ts`. Schema tests cover all 14 scenarios (defaults, nullable fields, enum validation, integer checks). Barrel export already existed.
- **Task 2:** Implemented `useOverheadStore` Zustand store with `selectByCategory`, `selectCurrentMonth`, `selectRecurring` selectors. `selectCurrentMonth` correctly includes one-time entries from current month + all active recurring entries. 11 store tests pass.
- **Task 3:** Implemented `useOverhead` Firestore real-time hook following the `useInventory` pattern exactly. Uses `useFirestoreCollection` with Zod validation pipeline.
- **Task 4:** Built `CategoryBreakdown` component with Phosphor duotone icons, per-category color config, amount formatting via `formatCurrency`, and responsive grid layout (2-col desktop, 1-col mobile). 7 tests pass.
- **Task 5:** Built `OverheadForm` with React Hook Form + zodResolver, following RestockForm pattern. Fields: Category (Select), Amount (number), Date (defaults to today), Description (optional), Recurrence (Select). `toNumberOrZero` pattern for amount. 7 tests pass.
- **Task 6:** Replaced placeholder OverheadPage with full implementation: monthly total card (with yearly/12 proration), CategoryBreakdown, entry list grouped by category sorted newest-first, empty state, form toggle. OverheadEntryRow displays recurrence badge and source badge (AI vs Manual). 8 tests pass.
- **Task 7:** Added `createOverheadFromTransaction` to `onTransactionApproved.ts`. Creates overhead document with `source: 'ai'` and default `category: 'general'` when Overhead-category transaction approved. Fire-and-forget pattern (error logged, never blocks approval). 5 new tests added, all 31 triggers tests pass.
- **Task 8:** Added complete `overhead.*` i18n keys to both `en.json` and `he.json` covering all UI strings.

### Change Log

- 2026-02-14: Story 7.1 implementation complete — all 8 tasks done, all tests passing

### File List

**New files:**
- `src/types/overhead.test.ts` — Schema validation tests (14 tests)
- `src/stores/useOverheadStore.test.ts` — Store + selector tests (11 tests)
- `src/features/overhead/hooks/useOverhead.ts` — Firestore real-time hook
- `src/features/overhead/components/CategoryBreakdown.tsx` — Category breakdown display
- `src/features/overhead/components/CategoryBreakdown.module.scss` — Category breakdown styles
- `src/features/overhead/components/CategoryBreakdown.test.tsx` — CategoryBreakdown tests (7 tests)
- `src/features/overhead/components/OverheadForm.tsx` — Add overhead form
- `src/features/overhead/components/OverheadForm.module.scss` — Form styles
- `src/features/overhead/components/OverheadForm.test.tsx` — OverheadForm tests (7 tests)

**Modified files:**
- `src/types/overhead.ts` — Replaced placeholder with full schema + types
- `src/stores/useOverheadStore.ts` — Replaced placeholder with full store + selectors
- `src/features/overhead/OverheadPage.tsx` — Replaced placeholder with full page
- `src/features/overhead/OverheadPage.module.scss` — Replaced placeholder styles
- `src/features/overhead/OverheadPage.test.tsx` — Replaced placeholder tests (8 tests)
- `src/features/overhead/components/index.ts` — Added component exports
- `src/features/overhead/hooks/index.ts` — Added useOverhead export
- `src/i18n/en.json` — Added overhead.* keys
- `src/i18n/he.json` — Added Hebrew translations
- `functions/src/triggers/onTransactionApproved.ts` — Added createOverheadFromTransaction + call in handleApproval
- `functions/tests/triggers.test.ts` — Added 5 overhead creation tests + mockOverheadAdd
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — Status: in-progress → review
