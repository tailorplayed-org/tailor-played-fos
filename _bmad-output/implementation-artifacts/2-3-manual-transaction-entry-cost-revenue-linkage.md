# Story 2.3: Manual Transaction Entry & Cost/Revenue Linkage

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As **Gal**,
I want to manually create transactions and link them to Work Orders,
So that I can track costs and revenue even before the AI email pipeline is built.

## Acceptance Criteria

1. **Transaction Type & Zod Schema**: `src/types/transaction.ts` defines `transactionSchema` validating: `id` (string), `vendorName` (string, required), `amountAgora` (integer, required), `currency` (enum: ILS | USD | EUR), `date` (Date, required), `category` (enum: DirectCost | InventoryRestock | Overhead | Revenue | Personal), `workOrderId` (string, optional), `inventoryItemId` (string, optional), `status` (enum: pending_review | approved | rejected), `aiConfidence` (number, optional), `originalFileUrl` (string, optional), `source` (enum: manual | ai), `notes` (string, optional), `createdAt` (Timestamp), `updatedAt` (Timestamp). `Transaction` TypeScript type is inferred from schema.

2. **Transaction Zustand Store**: `src/stores/useTransactionStore.ts` holds `transactions: Transaction[]`, `loading: boolean`, `error: string | null`. Selectors: `selectByWorkOrder(woId)`, `selectPendingReview`, `selectByCategory`.

3. **Manual Transaction Form**: When Gal clicks "Add Transaction" on the Work Orders page, a form appears with fields: Vendor Name (required), Amount (number input in display units), Currency (ILS default, USD/EUR options), Date (required), Category (dropdown), Work Order (searchable dropdown, optional), Notes (optional). Form uses React Hook Form with Zod validation. Amount converts to agora/cents via `toMinorUnits()` before saving.

4. **Multi-Currency Display**: Transactions with currency USD or EUR show the original amount and currency alongside the ILS equivalent. Non-ILS amounts display an "Estimated" badge (per FR22/FR49). The conversion rate used is documented.

5. **Manual Transaction Creation**: On valid form submission, a document is created in Firestore `transactions` collection with `source: 'manual'` and `status: 'approved'` (manual entries skip review). A success toast confirms the transaction was saved.

6. **Cost/Revenue Linkage — DirectCost**: If a transaction is linked to a Work Order AND the category is `DirectCost`, the Work Order's `directCostAgora` field increments by the transaction's ILS-equivalent amount atomically.

7. **Cost/Revenue Linkage — Revenue**: If a transaction is linked to a Work Order AND the category is `Revenue`, the Work Order's `revenueTotalAgora` field increments by the transaction's ILS-equivalent amount atomically.

8. **Real Transaction Count**: The WorkOrderCard on the list page shows the actual count of linked transactions (replacing the current hardcoded "0 transactions").

## Tasks / Subtasks

- [x] Task 1: Transaction Type & Zod Schema (AC: #1)
  - [x] Replace `src/types/transaction.ts` placeholder with full implementation
  - [x] Define `TRANSACTION_CATEGORIES` as const array: `['DirectCost', 'InventoryRestock', 'Overhead', 'Revenue', 'Personal']`
  - [x] Define `TransactionCategory` type from const array
  - [x] Define `TRANSACTION_STATUSES` as const array: `['pending_review', 'approved', 'rejected']`
  - [x] Define `TransactionStatus` type from const array
  - [x] Define `TRANSACTION_SOURCES` as const array: `['manual', 'ai']`
  - [x] Define `TransactionSource` type from const array
  - [x] Define `transactionSchema` with all fields per AC #1 (use z.string(), z.number().int(), z.enum(), z.date(), z.nullable())
  - [x] Define `Transaction` type inferred from schema
  - [x] Define `createTransactionSchema` for form validation (subset: vendorName, amount as display number, currency, date, category, workOrderId optional, notes optional). NO `.default()` — use form `defaultValues` instead (Zod 4 learning from Story 2.1)
  - [x] Define `CreateTransactionInput` type inferred from form schema
  - [x] Create `src/types/transaction.test.ts` — tests: valid schema parse, required fields rejection, category enum validation, status enum validation, currency enum validation
  - [x] Verify `src/types/index.ts` barrel already exports `./transaction` (it does)

- [x] Task 2: Currency Conversion Utility (AC: #4, #6, #7)
  - [x] Add `DEFAULT_CONVERSION_RATES` to `src/lib/currency.ts`: `{ ILS: 1, USD: 3.5, EUR: 3.8 }` (hardcoded defaults until `system_config` exists)
  - [x] Add `toIlsAgora(amountAgora: number, currency: Currency): number` — converts any currency minor units to ILS agora using default rates. Returns as-is for ILS
  - [x] Add `isEstimatedCurrency(currency: Currency): boolean` — returns true for non-ILS
  - [x] Update `src/lib/currency.test.ts` with new function tests: ILS passthrough, USD conversion, EUR conversion, estimated currency check

- [x] Task 3: Transaction Zustand Store (AC: #2)
  - [x] Replace `src/stores/useTransactionStore.ts` placeholder with full implementation
  - [x] Interface: `transactions: Transaction[]`, `loading: boolean`, `error: string | null`
  - [x] Actions: `setTransactions`, `setLoading`, `setError`
  - [x] Selectors (outside store): `selectByWorkOrder(woId)` — filters by workOrderId, `selectPendingReview` — filters status === 'pending_review', `selectByCategory(cat)` — filters by category
  - [x] Verify `src/stores/index.ts` barrel already exports `./useTransactionStore` (it does)

- [x] Task 4: Transaction Hooks (AC: #3, #5, #6, #7)
  - [x] Create `src/features/work-orders/hooks/useTransactions.ts` — subscribes to `transactions` collection via `useFirestoreCollection`, syncs to `useTransactionStore`. Follow exact pattern from `useWorkOrders.ts`
  - [x] Create `src/features/work-orders/hooks/useTransactionActions.ts`:
    - `createTransaction(data: CreateTransactionInput)`:
      1. Convert `data.amount` (display) to `amountAgora` via `toMinorUnits(data.amount, data.currency)`
      2. Compute `ilsAmountAgora` via `toIlsAgora(amountAgora, data.currency)` for WO linkage
      3. Use Firestore `writeBatch`:
         - Set new doc in `transactions` with `source: 'manual'`, `status: 'approved'`, `createdAt: serverTimestamp()`, `updatedAt: serverTimestamp()`
         - If `workOrderId` is set AND category === `'DirectCost'`: update WO doc with `increment(ilsAmountAgora)` on `directCostAgora`
         - If `workOrderId` is set AND category === `'Revenue'`: update WO doc with `increment(ilsAmountAgora)` on `revenueTotalAgora`
      4. Commit batch atomically
      5. Show success toast
    - Error handling: try/catch, error toast, throw error (keep form open on error)
  - [x] Update `src/features/work-orders/hooks/index.ts` barrel to export new hooks

- [x] Task 5: Transaction Form Component (AC: #3, #4)
  - [x] Create `src/features/work-orders/components/TransactionForm.tsx`
  - [x] Props: `onSubmit: (data: CreateTransactionInput) => Promise<void>`, `onCancel: () => void`, `defaultWorkOrderId?: string`
  - [x] React Hook Form + zodResolver(createTransactionSchema)
  - [x] Default values: vendorName='', amount=undefined, currency='ILS', date=today, category=undefined, workOrderId=defaultWorkOrderId or '', notes=''
  - [x] Fields layout:
    - Vendor Name: `<Input>` with `register('vendorName')`
    - Amount: `<Input type="number" step="0.01">` with `register('amount', { valueAsNumber: true })`
    - Currency: `<Select>` with Controller, options ILS/USD/EUR
    - Date: `<Input type="date">` with Controller (same pattern as WorkOrderForm)
    - Category: `<Select>` with Controller, options from TRANSACTION_CATEGORIES
    - Work Order: `<Select searchable>` with Controller, options populated from `useWorkOrderStore.workOrders` (value=id, label=clientName)
    - Notes: `<Input>` (or textarea if available) with `register('notes')`
  - [x] When currency is non-ILS, show helper text: "Amount will be converted to ~₪{estimate} ILS (estimated)"
  - [x] Action buttons: Cancel (ghost), Submit (primary, loading state)
  - [x] Create `src/features/work-orders/components/TransactionForm.module.scss`
  - [x] Update `src/features/work-orders/components/index.ts` to export TransactionForm

- [x] Task 6: WorkOrdersPage Integration (AC: #3, #5, #8)
  - [x] Add `useTransactions` call in WorkOrdersPage to subscribe to transactions collection
  - [x] Add `useTransactionActions` for `createTransaction`
  - [x] Add "Add Transaction" button in header (next to "New Work Order")
  - [x] Add `showTransactionForm: boolean` state, toggle inline form below header (similar to WorkOrderForm pattern)
  - [x] Pass `createTransaction` as `onSubmit` to TransactionForm
  - [x] Update WorkOrderCard to receive `transactionCount: number` prop
  - [x] Compute `transactionCount` per order: `selectByWorkOrder(order.id)` from transaction store
  - [x] Replace hardcoded `0` with actual count in the card

- [x] Task 7: i18n Translation Keys (AC: all)
  - [x] Add transaction form keys to `src/i18n/en.json` under `transactions` namespace
  - [x] Add transaction form keys to `src/i18n/he.json` under `transactions` namespace
  - [x] Keys needed: form labels, category names, currency names, validation messages, success/error toasts, estimated badge text, page-level labels

- [x] Task 8: Tests (AC: all)
  - [x] Create `src/features/work-orders/hooks/useTransactionActions.test.ts` — tests: creates transaction doc, sets source/status correctly, updates WO directCostAgora on DirectCost, updates WO revenueTotalAgora on Revenue, no WO update when workOrderId missing, no WO update for non-linkable categories, currency conversion for non-ILS, error handling
  - [x] Create `src/features/work-orders/components/TransactionForm.test.tsx` — tests: renders all form fields, validates required fields, calls onSubmit with correct data, shows currency helper for non-ILS, WO dropdown is searchable, cancel calls onCancel
  - [x] Update `src/features/work-orders/WorkOrdersPage.test.tsx` — tests: "Add Transaction" button visible, form toggles on click, transaction count shows real number
  - [x] Ensure all existing 388 tests still pass (zero regressions)

- [x] Task 9: Build Verification (AC: all)
  - [x] `tsc --noEmit` — zero TypeScript errors
  - [x] `npm run lint` — zero warnings
  - [x] `npm run test` — all tests pass (existing 388 + new tests, zero regressions)
  - [x] `npm run build` — succeeds

## Dev Notes

### Architecture Compliance

- **SCSS Modules only**: All component styling via `*.module.scss`. Tokens and mixins are auto-imported via Vite `additionalData` — use `$gold`, `$success`, `$warning`, `$error`, `@include card-surface`, `@include focus-ring`, etc. directly in `.module.scss` files without explicit `@use` statements. [Source: architecture.md#Implementation-Patterns]
- **CSS Logical Properties ONLY**: NEVER use `left`/`right`/`text-align: left`. Use `inline-start`/`inline-end`, `margin-inline`, `padding-inline`, `text-align: start`. All components must work in both RTL and LTR. [Source: architecture.md#Enforcement-Guidelines]
- **Path aliases**: `@/` prefix for all imports. Import from `@/components`, `@/lib`, `@/stores`, `@/types`, etc. [Source: architecture.md#Structure-Patterns]
- **Barrel exports**: Every directory exports through `index.ts`. Consumers import from the directory, not individual files. `import { Button, Card, Badge } from '@/components'` — NOT `import { Button } from '@/components/Button/Button'`. [Source: architecture.md#Structure-Patterns]
- **Co-located tests**: `*.test.tsx` / `*.test.ts` next to the component file, NOT in `__tests__/`. [Source: architecture.md#Structure-Patterns]
- **Naming conventions**: Components PascalCase (`TransactionForm.tsx`), SCSS modules PascalCase (`TransactionForm.module.scss`), SCSS class names camelCase (`.formFields`), hooks `use` prefix (`useTransactionActions`), utility functions camelCase (`toIlsAgora`), types PascalCase no `I` prefix (`Transaction`, `TransactionCategory`), constants UPPER_SNAKE_CASE (`TRANSACTION_CATEGORIES`). [Source: architecture.md#Naming-Patterns]
- **Firestore conventions**: Collection name `transactions` (snake_case, plural). Currency fields suffix with `Agora`. Timestamp fields suffix with `At`. [Source: architecture.md#Naming-Patterns]
- **Feature module boundaries**: Features in `src/features/` are self-contained. Features import from `@/components`, `@/stores`, `@/lib`, `@/types`. Features NEVER import from other features directly. [Source: architecture.md#Architectural-Boundaries]
- **Data flow**: Firestore document → Zod schema parse → TypeScript type → Zustand store → React component. Never access Firestore directly from components. [Source: architecture.md#Data-Flow-Patterns]
- **Currency**: All math happens in agora/cents. Formatting to display happens at the component level via `formatCurrency()`. NEVER do raw arithmetic on display amounts. [Source: architecture.md#Data-Flow-Patterns]
- **State management**: Zustand for domain stores. One store per domain (`useTransactionStore`). Store holds data + loading + error. Derived values are selectors, not stored state. Actions are synchronous setters. Async ops happen in hooks. [Source: architecture.md#State-Management-Patterns]
- **Form handling**: React Hook Form for complex forms. zodResolver for validation. Controller for non-native inputs (Select, date). [Source: architecture.md#Frontend-Architecture]
- **Error handling**: Toast notifications for operation failures. Try/catch in action hooks, error toast already shown by hook. Keep form open on error. [Source: architecture.md#Error-Handling-Patterns]
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

- **NO NEW npm dependencies needed** — everything required for Story 2.3 is already installed.

- **Existing files to REPLACE (placeholder):**
  - `src/types/transaction.ts` — currently `export {}`. Replace with full Transaction type, schema, and form schema.
  - `src/stores/useTransactionStore.ts` — currently `export {}`. Replace with full Zustand store.

- **Existing files to MODIFY:**
  - `src/lib/currency.ts` — add `toIlsAgora()`, `isEstimatedCurrency()`, `DEFAULT_CONVERSION_RATES`
  - `src/lib/currency.test.ts` — add tests for new functions
  - `src/features/work-orders/WorkOrdersPage.tsx` — add transaction form integration, real transaction count
  - `src/features/work-orders/WorkOrdersPage.test.tsx` — add new tests for transaction integration
  - `src/features/work-orders/hooks/index.ts` — add new hook exports
  - `src/features/work-orders/components/index.ts` — add TransactionForm export
  - `src/i18n/en.json` — add `transactions` namespace keys
  - `src/i18n/he.json` — add `transactions` namespace keys

- **New files to CREATE:**
  - `src/features/work-orders/hooks/useTransactions.ts`
  - `src/features/work-orders/hooks/useTransactionActions.ts`
  - `src/features/work-orders/hooks/useTransactionActions.test.ts`
  - `src/features/work-orders/components/TransactionForm.tsx`
  - `src/features/work-orders/components/TransactionForm.module.scss`
  - `src/features/work-orders/components/TransactionForm.test.tsx`
  - `src/types/transaction.test.ts`

- **Files NOT to modify:**
  - `src/types/workOrder.ts` — no schema changes needed. WorkOrder already has `directCostAgora`, `revenueTotalAgora`, etc.
  - `src/stores/useWorkOrderStore.ts` — no store changes. Firestore `increment()` updates the DB, listener auto-syncs to store
  - `src/features/work-orders/hooks/useWorkOrders.ts` — no changes needed
  - `src/features/work-orders/hooks/useWorkOrderActions.ts` — no changes needed (transaction actions are separate)
  - `src/features/work-orders/components/WorkOrderForm.tsx` — no changes needed
  - `src/features/work-orders/components/StatusStepper.tsx` — no changes needed
  - `src/features/work-orders/WorkOrderDetailPage.tsx` — belongs to Story 2.5
  - `src/types/index.ts` — already exports `./transaction`
  - `src/stores/index.ts` — already exports `./useTransactionStore`
  - `src/lib/index.ts` — already exports `./currency`

- **SCSS auto-import**: `_variables.scss` and `_mixins.scss` are auto-imported via Vite `additionalData` into every `.module.scss` file. Tokens (`$gold`, `$bg-tertiary`, `$success`, `$warning`, `$error`, etc.) and mixins (`@include card-surface`, `@include focus-ring`, etc.) are available without `@use` statements.

- **Toast system available**: `toast.success(msg)`, `toast.error(msg, action?)` from `@/components/Toast` — can be called outside React components.

- **Currency utilities already exist**: `formatCurrency(amountAgora, currency?)`, `toMinorUnits(amount, currency)`, `toDisplayAmount(minorUnits, currency)` from `@/lib/currency`. Reuse these.

- **Firestore batch writes**: Import `writeBatch`, `doc`, `collection`, `increment`, `serverTimestamp` from `firebase/firestore`. Use `writeBatch(db)` to atomically create transaction + update WO in one commit.

- **Select component supports searchable mode**: `<Select searchable>` from `@/components/Input` renders a portal-based dropdown with type-ahead search. Used for the Work Order linking dropdown.

- **Test infrastructure**: Vitest + React Testing Library. CSS module mocks and react-i18next mocks already configured globally. Use `await import()` for components with Phosphor icons to avoid jsdom hangs. Use `MemoryRouter` wrapping for route-aware component tests. 388 tests currently passing.

### Transaction Type & Schema Design

```typescript
// src/types/transaction.ts
import { z } from 'zod';

export const TRANSACTION_CATEGORIES = [
  'DirectCost',
  'InventoryRestock',
  'Overhead',
  'Revenue',
  'Personal',
] as const;
export type TransactionCategory = (typeof TRANSACTION_CATEGORIES)[number];

export const TRANSACTION_STATUSES = ['pending_review', 'approved', 'rejected'] as const;
export type TransactionStatus = (typeof TRANSACTION_STATUSES)[number];

export const TRANSACTION_SOURCES = ['manual', 'ai'] as const;
export type TransactionSource = (typeof TRANSACTION_SOURCES)[number];

export const transactionSchema = z.object({
  id: z.string(),
  vendorName: z.string().min(1, 'Vendor name is required'),
  amountAgora: z.number().int(),
  currency: z.enum(['ILS', 'USD', 'EUR']).default('ILS'),
  date: z.date(),
  category: z.enum(TRANSACTION_CATEGORIES),
  workOrderId: z.string().nullable().default(null),
  inventoryItemId: z.string().nullable().default(null),
  status: z.enum(TRANSACTION_STATUSES),
  aiConfidence: z.number().nullable().default(null),
  originalFileUrl: z.string().nullable().default(null),
  source: z.enum(TRANSACTION_SOURCES),
  notes: z.string().nullable().default(null),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Transaction = z.infer<typeof transactionSchema>;

// Form input schema — no .default() per Zod 4 learning
// Amount is in display units (e.g., 82.50), NOT agora — converted before saving
export const createTransactionSchema = z.object({
  vendorName: z.string().min(1, 'Vendor name is required'),
  amount: z.number().positive('Amount must be positive'),
  currency: z.enum(['ILS', 'USD', 'EUR']),
  date: z.date(),
  category: z.enum(TRANSACTION_CATEGORIES),
  workOrderId: z.string().nullable(),
  notes: z.string().nullable(),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
```

**Key design decisions:**
- `amountAgora` stores in the ORIGINAL currency's minor units (not always ILS). This preserves the original financial data.
- The `createTransactionSchema` uses `amount` (display units, e.g., 82.50) NOT `amountAgora`. The hook converts to agora before saving.
- No `.default()` on the form schema — use React Hook Form `defaultValues` instead (prevents Zod 4 input/output type divergence with zodResolver).
- `workOrderId` and `notes` are `z.string().nullable()` in form schema (not optional) — form provides null explicitly when empty.

### Transaction Store Design

```typescript
// src/stores/useTransactionStore.ts
import { create } from 'zustand';
import type { Transaction, TransactionCategory } from '@/types';

interface TransactionStore {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  setTransactions: (txns: Transaction[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useTransactionStore = create<TransactionStore>((set) => ({
  transactions: [],
  loading: true,
  error: null,
  setTransactions: (transactions) => set({ transactions, loading: false, error: null }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error, loading: false }),
}));

// Selectors (defined outside store per architecture pattern)
export const selectByWorkOrder = (woId: string) => (state: TransactionStore) =>
  state.transactions.filter((t) => t.workOrderId === woId);

export const selectPendingReview = (state: TransactionStore) =>
  state.transactions.filter((t) => t.status === 'pending_review');

export const selectByCategory = (category: TransactionCategory) => (state: TransactionStore) =>
  state.transactions.filter((t) => t.category === category);
```

### Currency Conversion Design

```typescript
// Add to src/lib/currency.ts

/**
 * Default ILS conversion rates (approximate).
 * Will be replaced by system_config values when available.
 */
export const DEFAULT_CONVERSION_RATES: Record<Currency, number> = {
  ILS: 1,
  USD: 3.5,   // 1 USD ≈ 3.5 ILS
  EUR: 3.8,   // 1 EUR ≈ 3.8 ILS
};

/**
 * Convert minor units in any currency to ILS agora.
 * For ILS, returns as-is. For USD/EUR, multiplies by conversion rate.
 */
export function toIlsAgora(amountAgora: number, currency: Currency): number {
  if (currency === 'ILS') return amountAgora;
  const rate = DEFAULT_CONVERSION_RATES[currency];
  return Math.round(amountAgora * rate);
}

/**
 * Returns true if the currency requires estimated conversion.
 */
export function isEstimatedCurrency(currency: Currency): boolean {
  return currency !== 'ILS';
}
```

### Transaction Actions Design (Cost/Revenue Linkage)

```typescript
// src/features/work-orders/hooks/useTransactionActions.ts
import { writeBatch, doc, collection, increment, serverTimestamp } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { db } from '@/services';
import { toast } from '@/components/Toast';
import { toMinorUnits, toIlsAgora } from '@/lib';
import type { CreateTransactionInput } from '@/types';

export function useTransactionActions() {
  const { t } = useTranslation();

  const createTransaction = async (data: CreateTransactionInput) => {
    try {
      const amountAgora = toMinorUnits(data.amount, data.currency);
      const ilsAmountAgora = toIlsAgora(amountAgora, data.currency);
      const batch = writeBatch(db);

      // 1. Create transaction document
      const txnRef = doc(collection(db, 'transactions'));
      batch.set(txnRef, {
        vendorName: data.vendorName,
        amountAgora,
        currency: data.currency,
        date: data.date,
        category: data.category,
        workOrderId: data.workOrderId || null,
        inventoryItemId: null,
        status: 'approved',       // Manual entries skip review
        aiConfidence: null,
        originalFileUrl: null,
        source: 'manual',
        notes: data.notes || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // 2. Update Work Order cost/revenue if linked
      if (data.workOrderId) {
        const woRef = doc(db, 'work_orders', data.workOrderId);
        if (data.category === 'DirectCost') {
          batch.update(woRef, {
            directCostAgora: increment(ilsAmountAgora),
            updatedAt: serverTimestamp(),
          });
        } else if (data.category === 'Revenue') {
          batch.update(woRef, {
            revenueTotalAgora: increment(ilsAmountAgora),
            updatedAt: serverTimestamp(),
          });
        }
        // InventoryRestock → inventoryCostAgora (handled by Scoop in Epic 6)
        // Overhead → overheadAllocationAgora (handled by overhead allocation in Epic 7)
        // Personal → no WO linkage
      }

      // 3. Atomic commit
      await batch.commit();
      toast.success(t('transactions.toast.created'));
    } catch (error) {
      toast.error(t('transactions.toast.createError'));
      throw error;
    }
  };

  return { createTransaction };
}
```

**Critical implementation notes:**
- `writeBatch` ensures transaction doc creation + WO update are ATOMIC. If either fails, both roll back.
- `increment()` is a Firestore FieldValue that atomically adds to the existing value. This prevents race conditions.
- For non-ILS transactions, `ilsAmountAgora` is the CONVERTED ILS amount used for WO linkage. The transaction document stores the ORIGINAL `amountAgora` in the original currency.
- Only `DirectCost` and `Revenue` categories update WO fields in this story. `InventoryRestock` (Epic 6 Scoop), `Overhead` (Epic 7 allocation), and `Personal` (no linkage) are handled later.

### Transaction Form Design

```typescript
// src/features/work-orders/components/TransactionForm.tsx
interface TransactionFormProps {
  onSubmit: (data: CreateTransactionInput) => Promise<void>;
  onCancel: () => void;
  defaultWorkOrderId?: string;
}
```

**Form Fields Layout:**
```
┌──────────────────────────────────────────────────────────┐
│ Vendor Name*          │ Amount*    │ Currency             │
│ [text input]          │ [number]   │ [ILS ▾]              │
│                       │            │ "~₪350 estimated"    │
├───────────────────────┼────────────┴──────────────────────┤
│ Date*                 │ Category*                         │
│ [date picker]         │ [DirectCost ▾]                    │
├───────────────────────┼───────────────────────────────────┤
│ Work Order (optional) │ Notes (optional)                  │
│ [searchable select]   │ [text input]                      │
├───────────────────────┴───────────────────────────────────┤
│                              [Cancel]  [Add Transaction]  │
└──────────────────────────────────────────────────────────┘
```

**Key UX details:**
- When currency changes to USD or EUR, show helper text below amount: "≈ ₪{converted} (estimated)"
- The conversion estimate updates live as the user types the amount
- Work Order dropdown uses `<Select searchable>` populated from `useWorkOrderStore().workOrders`
- WO dropdown shows `clientName` as label, `id` as value
- If `defaultWorkOrderId` prop is set, pre-select that WO in the dropdown (used by Story 2.5)
- Category dropdown shows human-readable labels via i18n, not raw enum values

### WorkOrdersPage Integration Design

**Changes to WorkOrdersPage.tsx:**

1. Import and call `useTransactions()` hook to subscribe to transactions collection
2. Import `useTransactionActions` for `createTransaction`
3. Add `useTransactionStore` to get transaction count per WO
4. Add "Add Transaction" button next to "New Work Order" in header
5. Add `showTransactionForm` state, toggle inline form
6. When both forms can't be open simultaneously (close one when opening the other)
7. Update WorkOrderCard to receive and display `transactionCount`

**Transaction count computation:**
```typescript
// In WorkOrdersPage, for each order:
const { transactions } = useTransactionStore();
const getTransactionCount = (woId: string) =>
  transactions.filter(t => t.workOrderId === woId).length;

// Pass to card:
<WorkOrderCard order={order} transactionCount={getTransactionCount(order.id)} ... />
```

**Card update (line 232 in current WorkOrdersPage.tsx):**
Replace: `<span className={styles.costCount}>0 {t('workOrders.card.transactions')}</span>`
With: `<span className={styles.costCount}>{transactionCount} {t('workOrders.card.transactions')}</span>`

### i18n Keys to Add

**English (`src/i18n/en.json`) — new `transactions` namespace:**
```json
{
  "transactions": {
    "addTransaction": "Add Transaction",
    "form": {
      "title": "New Transaction",
      "vendorName": "Vendor Name",
      "vendorNameRequired": "Vendor name is required",
      "amount": "Amount",
      "amountRequired": "Amount is required",
      "amountPositive": "Amount must be positive",
      "currency": "Currency",
      "date": "Date",
      "dateRequired": "Date is required",
      "category": "Category",
      "categoryRequired": "Category is required",
      "workOrder": "Work Order",
      "workOrderPlaceholder": "Select a Work Order (optional)",
      "notes": "Notes",
      "notesPlaceholder": "Optional notes",
      "cancel": "Cancel",
      "submit": "Add Transaction",
      "estimatedConversion": "≈ {{amount}} (estimated)"
    },
    "category": {
      "DirectCost": "Direct Cost",
      "InventoryRestock": "Inventory Restock",
      "Overhead": "Overhead",
      "Revenue": "Revenue",
      "Personal": "Personal"
    },
    "toast": {
      "created": "Transaction saved",
      "createError": "Failed to save transaction"
    },
    "badge": {
      "estimated": "Estimated"
    }
  }
}
```

**Hebrew (`src/i18n/he.json`) — new `transactions` namespace:**
```json
{
  "transactions": {
    "addTransaction": "הוסף עסקה",
    "form": {
      "title": "עסקה חדשה",
      "vendorName": "שם ספק",
      "vendorNameRequired": "שם ספק הוא שדה חובה",
      "amount": "סכום",
      "amountRequired": "סכום הוא שדה חובה",
      "amountPositive": "הסכום חייב להיות חיובי",
      "currency": "מטבע",
      "date": "תאריך",
      "dateRequired": "תאריך הוא שדה חובה",
      "category": "קטגוריה",
      "categoryRequired": "קטגוריה היא שדה חובה",
      "workOrder": "הזמנת עבודה",
      "workOrderPlaceholder": "בחר הזמנת עבודה (אופציונלי)",
      "notes": "הערות",
      "notesPlaceholder": "הערות אופציונליות",
      "cancel": "ביטול",
      "submit": "הוסף עסקה",
      "estimatedConversion": "≈ {{amount}} (אומדן)"
    },
    "category": {
      "DirectCost": "עלות ישירה",
      "InventoryRestock": "חידוש מלאי",
      "Overhead": "תקורה",
      "Revenue": "הכנסה",
      "Personal": "אישי"
    },
    "toast": {
      "created": "העסקה נשמרה",
      "createError": "שמירת העסקה נכשלה"
    },
    "badge": {
      "estimated": "אומדן"
    }
  }
}
```

**Note**: Add as a NEW `transactions` namespace alongside the existing `workOrders` namespace. Do NOT modify existing keys.

### Previous Story Intelligence (Story 2.2)

**Key patterns established:**
- `WorkOrdersPage.tsx` uses local state for form visibility (`showForm`, `editingOrder`)
- WorkOrderCard is an inline function component inside `WorkOrdersPage.tsx`
- `useWorkOrderActions` provides CRUD — pattern to follow for `useTransactionActions`
- Error handling: try/catch in handlers, error toast shown by hook, keep form open on error
- Card uses `Card` component from `@/components` with `className={styles.card}`
- Phosphor icons imported at top level
- `useMemo` for derived data (sorted orders)
- `expandedOrderId` pattern for toggle state — apply similar for transaction form or use simple boolean
- `useWorkOrders()` hook subscribes to collection and returns store — follow same pattern for `useTransactions()`

**Critical learnings from Stories 2.1 and 2.2:**
- Zod 4 `.default()` creates input/output type divergence with `zodResolver` — DO NOT use `.default()` on form schemas. Use `defaultValues` in `useForm()` instead.
- SCSS variable is `$bp-sm` not `$breakpoint-sm` — use `$bp-sm` for breakpoint media queries
- Phosphor icon dynamic imports in jsdom cause slow module loading — use `beforeAll` with 30s timeout for pre-loading component modules in tests
- `await import()` pattern for Phosphor icon imports in tests
- `src/__mocks__/react-i18next.ts` mock returns translation key as string
- `src/__mocks__/css-module.ts` provides Proxy-based CSS module mock
- `MemoryRouter` wrapping for route-aware tests
- 388 tests currently passing

**Story 2.2 Debug Log Learnings:**
- `$space-2xs` does NOT exist — use `$space-xs` (4px) as smallest spacing token
- `$radius-xs` does NOT exist — use `2px` literal for small border-radius values
- Always verify SCSS token names against actual `_variables.scss` before using

### Git Intelligence

**Recent commits (most recent first):**
- `5691072` — Implement Story 2.2: Work Order Status Lifecycle & List View with code review fixes
- `c05296d` — Implement Story 2.1: Work Order Data Model & CRUD with code review fixes
- `c3f5157` — Implement Story 1.6: Core Shared UI Components & Currency Utilities with code review fixes
- `65263d4` — Implement Story 1.5: Internationalization & RTL Support with code review fixes

**Story 2.2 changes (14 files, 1457 insertions):**
- Created StatusStepper component with tests
- Enhanced WorkOrderCard with icon, margin bar, sorting, stepper integration
- Added margin utility functions with tests
- Added i18n keys for status and margin

**Established code patterns:**
- Single comprehensive commit per story
- Forms use React Hook Form + zodResolver + Controller for Select/date
- Hooks follow `useFirestoreCollection` → Zustand store sync pattern
- Action hooks use try/catch + toast + throw (caller keeps form open on error)
- Tests use `beforeAll` with dynamic import for Phosphor icons

### Potential Pitfalls to Avoid

1. **DO NOT use `.default()` on the createTransactionSchema** — Use React Hook Form `defaultValues` instead. Zod 4 `.default()` creates input/output type divergence that breaks zodResolver. This was a hard-won lesson from Story 2.1.

2. **DO NOT forget `writeBatch` for atomic operations** — Transaction creation + WO update MUST be in a single batch. If you use separate `addDoc` and `updateDoc` calls, a failure between them leaves data inconsistent.

3. **DO NOT store amountAgora in ILS for all currencies** — Store in the ORIGINAL currency's minor units. The `currency` field tells you which currency. Convert to ILS only when computing WO linkage amounts. This preserves the original financial data.

4. **DO NOT modify WorkOrder type/schema** — The `directCostAgora`, `revenueTotalAgora`, etc. fields already exist. They're updated via Firestore `increment()`, not by changing the schema.

5. **DO NOT build the Transaction list display component** — That's Story 2.5 (Work Order Detail Page). This story creates the data infrastructure and form. The card just shows the count.

6. **DO NOT build Ghost Text or AI review features** — That's Epic 5. Manual transactions get `status: 'approved'` immediately.

7. **DO NOT use `left`/`right` in CSS** — use CSS logical properties only.

8. **DO NOT use `@use` in `.module.scss` files** — tokens and mixins are auto-imported via Vite.

9. **DO NOT forget to handle the case where Work Order dropdown is empty** — It's optional. When null/empty, no WO linkage occurs.

10. **DO NOT forget currency conversion for WO linkage** — If a transaction is in USD and linked to a WO, the WO's cost/revenue field must be incremented in ILS (using `toIlsAgora()`), NOT in the original currency.

11. **DO NOT forget that `increment()` from Firestore is a FieldValue** — Import it from `firebase/firestore`. It atomically adds to the current value. Do NOT read-then-write manually.

12. **DO NOT create a separate feature directory for transactions** — The transaction form and hooks live in `src/features/work-orders/` for this story. The types and store are in their shared locations (already set up as placeholders).

13. **DO NOT add InventoryRestock or Overhead cost linkage to WO fields** — `InventoryRestock` → `inventoryCostAgora` is handled by the Scoop action in Epic 6. `Overhead` → `overheadAllocationAgora` is handled by Epic 7. For now, only `DirectCost` and `Revenue` affect WO fields.

14. **DO NOT open both WorkOrderForm and TransactionForm simultaneously** — When one opens, close the other. Use separate state booleans and mutual exclusion logic.

15. **BE CAREFUL with `register('amount', { valueAsNumber: true })`** — React Hook Form's `valueAsNumber` on number inputs converts empty string to `NaN`. Handle this in validation: Zod's `z.number().positive()` will reject NaN.

16. **DO NOT forget to update the hooks barrel export** — `src/features/work-orders/hooks/index.ts` needs to export `useTransactions` and `useTransactionActions`.

17. **DO NOT forget to subscribe to transactions in WorkOrdersPage** — Call `useTransactions()` to start the real-time listener. Without it, the transaction store stays empty and counts show 0.

18. **BE CAREFUL with the form date field** — Follow the exact same pattern from WorkOrderForm: Controller + Input type="date" + formatDateForInput helper. Copy the helper or extract to shared utility.

19. **DO NOT use `Timestamp` from firebase directly in Zod schemas** — The `useFirestoreCollection` hook converts Firestore Timestamps to JS Date objects via `convertTimestamps()`. The Zod schema should use `z.date()`.

20. **REMEMBER: `serverTimestamp()` writes a placeholder** — It resolves to the actual timestamp on the server. When reading back via `onSnapshot`, the `convertTimestamps` helper in `useFirestoreCollection` converts it to a JS Date. This is already handled.

### Cross-Story Context (Epic 2)

This is the **third story in Epic 2** — it creates the financial transaction layer:

- **Story 2.1** (DONE) created the Work Order data model, CRUD operations, basic list view, and form. WorkOrder type already has cost/revenue fields (defaulting to 0).
- **Story 2.2** (DONE) enhanced the list view with StatusStepper, margin utilities, icon card layout, sorting. The margin calculations are in place but show 0% or "—" because no transactions exist yet. **This story (2.3) will "light up" the margins** — once transactions are created and linked, the cost fields update and margins become real.
- **Story 2.4** (next) will create the full Nutrition Label component with expandable cost breakdown, 5% buffer calculation, and shimmer updates. It will extend `calculateMargin` to include the optional buffer parameter.
- **Story 2.5** will create the Work Order detail page with a transaction list, Nutrition Label, StatusStepper, and "Add Transaction" button that pre-selects the WO.

**This story's scope**: Transaction type + store + hooks + manual entry form + cost/revenue linkage + multi-currency + real transaction count in cards. The foundation for all financial tracking in TP-FOS.

### Project Structure Notes

**New files to create:**

| File | Type | Notes |
|---|---|---|
| `src/features/work-orders/hooks/useTransactions.ts` | NEW | Real-time collection listener |
| `src/features/work-orders/hooks/useTransactionActions.ts` | NEW | CRUD with cost linkage |
| `src/features/work-orders/hooks/useTransactionActions.test.ts` | NEW | Action hook tests |
| `src/features/work-orders/components/TransactionForm.tsx` | NEW | Manual entry form |
| `src/features/work-orders/components/TransactionForm.module.scss` | NEW | Form styles |
| `src/features/work-orders/components/TransactionForm.test.tsx` | NEW | Form tests |
| `src/types/transaction.test.ts` | NEW | Schema validation tests |

**Files to REPLACE (placeholder):**

| File | Action | Notes |
|---|---|---|
| `src/types/transaction.ts` | REPLACE | Was `export {}` — now full type + schemas |
| `src/stores/useTransactionStore.ts` | REPLACE | Was `export {}` — now full Zustand store |

**Files to MODIFY:**

| File | Action | Notes |
|---|---|---|
| `src/lib/currency.ts` | ADD | `toIlsAgora()`, `isEstimatedCurrency()`, `DEFAULT_CONVERSION_RATES` |
| `src/lib/currency.test.ts` | ADD | Tests for new currency functions |
| `src/features/work-orders/WorkOrdersPage.tsx` | ENHANCE | Transaction form integration, real count |
| `src/features/work-orders/WorkOrdersPage.test.tsx` | ADD | Tests for transaction integration |
| `src/features/work-orders/hooks/index.ts` | ADD EXPORT | `useTransactions`, `useTransactionActions` |
| `src/features/work-orders/components/index.ts` | ADD EXPORT | `TransactionForm` |
| `src/i18n/en.json` | ADD KEYS | `transactions` namespace |
| `src/i18n/he.json` | ADD KEYS | `transactions` namespace |

**Files NOT to modify:**
- `src/types/workOrder.ts` — schema unchanged
- `src/types/index.ts` — already exports `./transaction`
- `src/stores/useWorkOrderStore.ts` — store unchanged (Firestore increment auto-syncs)
- `src/stores/index.ts` — already exports `./useTransactionStore`
- `src/lib/index.ts` — already exports `./currency`
- `src/features/work-orders/hooks/useWorkOrders.ts` — unchanged
- `src/features/work-orders/hooks/useWorkOrderActions.ts` — unchanged
- `src/features/work-orders/components/WorkOrderForm.tsx` — unchanged
- `src/features/work-orders/components/StatusStepper.tsx` — unchanged
- `src/features/work-orders/WorkOrderDetailPage.tsx` — Story 2.5
- `src/components/**` — no shared component changes needed

### Existing Code Reference

**`useFirestoreCollection` pattern (copy for useTransactions):**
```typescript
// src/features/work-orders/hooks/useTransactions.ts
import { useFirestoreCollection } from '@/hooks';
import { useTransactionStore } from '@/stores';
import { transactionSchema } from '@/types';

export function useTransactions() {
  const { setTransactions, setLoading, setError } = useTransactionStore();
  useFirestoreCollection('transactions', transactionSchema, {
    onData: setTransactions,
    onError: setError,
    onLoading: setLoading,
  });
  return useTransactionStore();
}
```

**WorkOrderForm pattern (reference for TransactionForm):**
The existing `WorkOrderForm` at `src/features/work-orders/components/WorkOrderForm.tsx` demonstrates the exact patterns to follow: `useForm` + `zodResolver` + `Controller` for Select/date + `handleSubmit` wrapper + error display + loading state on submit button.

**Firestore imports needed for useTransactionActions:**
```typescript
import { writeBatch, doc, collection, increment, serverTimestamp } from 'firebase/firestore';
```

### References

- [Source: planning-artifacts/epics.md#Story-2.3] — Full acceptance criteria with BDD format
- [Source: planning-artifacts/epics.md#Epic-2] — Epic context and story sequence
- [Source: planning-artifacts/prd.md#FR50] — Manual transaction creation requirement
- [Source: planning-artifacts/prd.md#FR13-FR14] — Revenue and cost linking to Work Orders
- [Source: planning-artifacts/prd.md#FR49] — Multi-currency display (ILS/USD/EUR)
- [Source: planning-artifacts/architecture.md#Data-Architecture] — Firestore collections, Zod schemas, integer currency
- [Source: planning-artifacts/architecture.md#Implementation-Patterns] — Naming, structure, data flow, state management
- [Source: planning-artifacts/architecture.md#Frontend-Architecture] — React Hook Form, Zustand, feature modules
- [Source: planning-artifacts/architecture.md#Enforcement-Guidelines] — tsc --noEmit, Zod validation, currency utilities, CSS logical properties
- [Source: planning-artifacts/architecture.md#State-Management] — Zustand store pattern, selectors outside store
- [Source: planning-artifacts/architecture.md#Error-Handling] — Toast notifications, Error Boundaries
- [Source: planning-artifacts/architecture.md#Project-Structure] — Full directory tree with file locations
- [Source: planning-artifacts/ux-design-specification.md#Financial-Semantic-Colors] — Success/warning/error for margins
- [Source: planning-artifacts/ux-design-specification.md#Accessibility] — Focus rings, touch targets, ARIA
- [Source: implementation-artifacts/2-2-work-order-status-lifecycle-list-view.md] — Previous story patterns, debug log, test infrastructure
- [Source: implementation-artifacts/2-1-work-order-data-model-crud.md] — Work Order CRUD patterns, Zod 4 learnings

## Dev Agent Record

### Agent Model Used

Claude claude-4.6-opus (Cursor Agent)

### Debug Log References

- SCSS token mismatch: Used `$font-size-lg` and `$font-weight-semibold` which don't exist — corrected to `$text-lg` and `$font-semibold` per `_variables.scss`.
- React Compiler lint warning: `watch()` from react-hook-form triggers `react-hooks/incompatible-library` — refactored to `useWatch()` hook for zero-warning lint.
- TransactionForm validation test: `getByRole('alert')` found multiple alerts (vendorName + amount) — fixed to `getAllByRole('alert')`.
- Build flake: `sass-embedded` "Tried writing to closed dispatcher" error was a sandbox-related transient issue, resolved by running build outside sandbox.

### Completion Notes List

- **Task 1**: Replaced `src/types/transaction.ts` placeholder with full Transaction schema, form schema, const arrays, and inferred types. 21 unit tests cover schema parsing, enum validation, nullable fields.
- **Task 2**: Added `DEFAULT_CONVERSION_RATES`, `toIlsAgora()`, `isEstimatedCurrency()` to `src/lib/currency.ts`. 12 new tests (ILS passthrough, USD/EUR conversion, rounding, zero handling, estimated flag).
- **Task 3**: Replaced `src/stores/useTransactionStore.ts` placeholder with full Zustand store + 3 selectors (`selectByWorkOrder`, `selectPendingReview`, `selectByCategory`).
- **Task 4**: Created `useTransactions` (collection listener) and `useTransactionActions` (createTransaction with writeBatch for atomic transaction+WO update). Updated hooks barrel.
- **Task 5**: Created `TransactionForm` component with React Hook Form + zodResolver, all 7 fields, currency estimate display, searchable WO dropdown. Used `useWatch` for reactive currency/amount tracking.
- **Task 6**: Integrated TransactionForm into WorkOrdersPage. Added "Add Transaction" button, mutual exclusion with WorkOrderForm, real transaction count per card via store filtering.
- **Task 7**: Added full `transactions` namespace to en.json and he.json (form labels, categories, toasts, badges, validation messages).
- **Task 8**: Created `useTransactionActions.test.ts` (8 tests), `TransactionForm.test.tsx` (6 tests), updated `WorkOrdersPage.test.tsx` (3 new tests). 49 new tests total. 437/437 all passing.
- **Task 9**: `tsc --noEmit` zero errors, `npm run lint` zero warnings, 437 tests passing, `npm run build` succeeds.

### File List

**New files:**
- `src/types/transaction.test.ts`
- `src/features/work-orders/hooks/useTransactions.ts`
- `src/features/work-orders/hooks/useTransactionActions.ts`
- `src/features/work-orders/hooks/useTransactionActions.test.ts`
- `src/features/work-orders/components/TransactionForm.tsx`
- `src/features/work-orders/components/TransactionForm.module.scss`
- `src/features/work-orders/components/TransactionForm.test.tsx`

**Replaced (placeholder → full implementation):**
- `src/types/transaction.ts`
- `src/stores/useTransactionStore.ts`

**Modified:**
- `src/lib/currency.ts` — added `DEFAULT_CONVERSION_RATES`, `toIlsAgora()`, `isEstimatedCurrency()`
- `src/lib/currency.test.ts` — added 12 new tests for currency conversion
- `src/lib/dates.ts` — extracted `formatDateForInput()` shared utility (was duplicated in form components)
- `src/features/work-orders/WorkOrdersPage.tsx` — transaction form integration, real count, "Add Transaction" button, memoized transaction counts
- `src/features/work-orders/WorkOrdersPage.module.scss` — added `.headerActions` style
- `src/features/work-orders/WorkOrdersPage.test.tsx` — added 4 transaction-related tests (including mutual exclusion)
- `src/features/work-orders/components/WorkOrderForm.tsx` — imports `formatDateForInput` from `@/lib` (removed local duplicate)
- `src/features/work-orders/hooks/index.ts` — added `useTransactions`, `useTransactionActions` exports
- `src/features/work-orders/components/index.ts` — added `TransactionForm` export
- `src/i18n/en.json` — added `transactions` namespace (removed unused badge.estimated key)
- `src/i18n/he.json` — added `transactions` namespace (removed unused badge.estimated key)

### Senior Developer Review (AI)

**Reviewer**: Code Review Agent (Claude claude-4.6-opus)
**Date**: 2026-02-07
**Outcome**: Approved after fixes

**Issues Found**: 1 High, 5 Medium, 1 Low — all fixed.

| # | Severity | Issue | Fix Applied |
|---|----------|-------|-------------|
| 1 | HIGH | Missing TransactionForm tests (currency helper, onSubmit, WO dropdown) | Added 3 tests: currency estimate helper, onSubmit with valid data, WO dropdown options |
| 2 | MEDIUM | Duplicated `formatDateForInput` in TransactionForm + WorkOrderForm | Extracted to `@/lib/dates.ts`, both forms now import from shared utility |
| 3 | MEDIUM | Redundant `useTransactionStore()` call in WorkOrdersPage | Replaced with destructured return from `useTransactions()` |
| 4 | MEDIUM | `getTransactionCount` O(N*M) per render | Replaced with `useMemo` pre-computed count map — O(M) once |
| 5 | MEDIUM | No test for mutual exclusion between WorkOrderForm and TransactionForm | Added integration test verifying forms can't be open simultaneously |
| 6 | MEDIUM | Loose `Record<string, unknown>` typing in test renderForm helper | Changed to `Partial<TransactionFormProps>` |
| 7 | LOW | Unused `transactions.badge.estimated` i18n key | Removed from both en.json and he.json |

**Post-fix verification**: 441 tests passing, `tsc --noEmit` zero errors, ESLint zero warnings.

### Change Log

- **2026-02-07**: Code review fixes — extracted `formatDateForInput` to `@/lib/dates.ts`, removed redundant store call in WorkOrdersPage, memoized transaction counts with `useMemo`, added 4 new tests (3 TransactionForm + 1 mutual exclusion), fixed test typing, removed unused i18n key. 441 tests passing.
- **2026-02-07**: Implemented Story 2.3 — Manual Transaction Entry & Cost/Revenue Linkage. Created transaction type system with Zod schemas, Zustand store with selectors, currency conversion utilities (ILS/USD/EUR), manual transaction form with React Hook Form + searchable WO dropdown, atomic Firestore batch writes for transaction creation + WO cost/revenue linkage (DirectCost → directCostAgora, Revenue → revenueTotalAgora), real transaction count in WorkOrderCard, full i18n support (EN/HE). 49 new tests, 437 total passing.
