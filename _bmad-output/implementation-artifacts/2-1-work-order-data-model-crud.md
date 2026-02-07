# Story 2.1: Work Order Data Model & CRUD

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As **Gal**,
I want to create and edit Work Orders with client name, project description, deadline, and status,
So that I have a container for tracking every game project's financial life.

## Acceptance Criteria

1. **Work Order Zod Schema & TypeScript Type** (`src/types/workOrder.ts`): `workOrderSchema` validates: `id` (string), `clientName` (string, required), `projectDescription` (string), `deadline` (Date, optional), `status` (enum: Lead | Design | Production | Shipped), `revenueTotalAgora` (integer, default 0), `directCostAgora` (integer, default 0), `inventoryCostAgora` (integer, default 0), `overheadAllocationAgora` (integer, default 0), `createdAt` (Timestamp), `updatedAt` (Timestamp). `WorkOrder` TypeScript type is inferred from the Zod schema.

2. **Firestore Collection Compliance**: The `work_orders` collection follows `snake_case` collection naming and `camelCase` field naming per ARCH-21. Currency fields use the `Agora` suffix. Timestamp fields use the `At` suffix.

3. **Zustand Store** (`src/stores/useWorkOrderStore.ts`): Holds `workOrders: WorkOrder[]`, `loading: boolean`, `error: string | null`. Actions: `setWorkOrders`, `setLoading`, `setError`. Selectors defined outside the store: `selectActiveProjects`, `selectWorkOrderById`.

4. **Firestore Real-Time Hook** (`src/features/work-orders/hooks/useWorkOrders.ts`): Subscribes to the `work_orders` collection via `onSnapshot`. Incoming documents are parsed through `workOrderSchema`. Validated data flows into `useWorkOrderStore`. The listener is cleaned up on unmount.

5. **Work Order Creation Form**: When Gal clicks "New Work Order", a creation form appears (React Hook Form) with fields: Client Name (required), Project Description, Deadline (date picker), Status (defaults to Lead). Form validates via Zod schema before submission. On valid submit, a new document is written to Firestore `work_orders`. A success toast confirms creation.

6. **Work Order Editing**: When Gal clicks "Edit" on an existing Work Order, the form pre-fills with current values. Gal can update any field. On save, the Firestore document updates with new `updatedAt` timestamp. The list view reflects changes in real-time.

## Tasks / Subtasks

- [x] Task 1: Work Order Type & Zod Schema (AC: #1, #2)
  - [x] Replace `src/types/workOrder.ts` placeholder with full Zod schema and inferred type
  - [x] Define `WorkOrderStatus` enum type: `'Lead' | 'Design' | 'Production' | 'Shipped'`
  - [x] Define `workOrderSchema` with all fields, defaults, and validation rules
  - [x] Export `WorkOrder` type inferred from schema via `z.infer<typeof workOrderSchema>`
  - [x] Define `createWorkOrderSchema` (subset for form input — excludes id, computed costs, timestamps)
  - [x] Create `src/types/workOrder.test.ts` — tests: valid schema parsing, required field validation, status enum validation, default values, Agora fields as integers, optional deadline

- [x] Task 2: Zustand Store (AC: #3)
  - [x] Replace `src/stores/useWorkOrderStore.ts` placeholder with full Zustand store
  - [x] Implement `workOrders`, `loading`, `error` state fields
  - [x] Implement `setWorkOrders`, `setLoading`, `setError` actions
  - [x] Define `selectActiveProjects` selector (filters status === 'Production')
  - [x] Define `selectWorkOrderById` selector (finds by id)
  - [x] Create `src/stores/useWorkOrderStore.test.ts` — tests: initial state, setWorkOrders, setLoading, setError, selectActiveProjects, selectWorkOrderById

- [x] Task 3: Generic Firestore Collection Hook (AC: #4 — shared infrastructure)
  - [x] Create `src/hooks/useFirestoreCollection.ts` — generic real-time listener hook: `useFirestoreCollection<T>(collectionName, schema)` returns `{ data, loading, error }`
  - [x] Uses `onSnapshot` from Firebase modular API (`collection`, `onSnapshot` from `firebase/firestore`)
  - [x] Parses each document through provided Zod schema
  - [x] Returns `unsubscribe` cleanup on unmount via `useEffect` return
  - [x] Update `src/hooks/index.ts` barrel to export new hook
  - [x] Create `src/hooks/useFirestoreCollection.test.ts` — tests: subscribes on mount, unsubscribes on unmount, parses documents, handles errors

- [x] Task 4: Work Orders Real-Time Hook (AC: #4)
  - [x] Create `src/features/work-orders/hooks/useWorkOrders.ts`
  - [x] Uses `useFirestoreCollection` with `work_orders` collection and `workOrderSchema`
  - [x] Syncs data into `useWorkOrderStore` via `setWorkOrders`, `setLoading`, `setError`
  - [x] Update `src/features/work-orders/hooks/index.ts` barrel to export `useWorkOrders`
  - [x] Create `src/features/work-orders/hooks/useWorkOrders.test.ts` — tests: hook syncs to store, loading states, error handling

- [x] Task 5: Install `@hookform/resolvers` dependency (AC: #5)
  - [x] Run `npm install @hookform/resolvers` — required for Zod + React Hook Form integration
  - [x] Verify package resolves correctly in imports

- [x] Task 6: Work Order Form Component (AC: #5, #6)
  - [x] Create `src/features/work-orders/components/WorkOrderForm.tsx` — uses React Hook Form + zodResolver with `createWorkOrderSchema`
  - [x] Fields: Client Name (Input, required), Project Description (Input), Deadline (native date input), Status (Select dropdown, defaults to Lead)
  - [x] Create `src/features/work-orders/components/WorkOrderForm.module.scss` — form layout using design system tokens
  - [x] Props: `onSubmit(data)`, `defaultValues?` (for edit mode), `onCancel`
  - [x] Edit mode: pre-fills all fields from `defaultValues` prop
  - [x] On valid submit: calls `onSubmit` callback with validated data
  - [x] Uses existing shared components: `Input`, `Select`, `Button` from `@/components`
  - [x] Update `src/features/work-orders/components/index.ts` to export `WorkOrderForm`
  - [x] Create `src/features/work-orders/components/WorkOrderForm.test.tsx` — tests: renders all fields, validates required Client Name, submits valid data, pre-fills in edit mode, cancel triggers callback

- [x] Task 7: Firestore CRUD Operations (AC: #5, #6)
  - [x] Create `src/features/work-orders/hooks/useWorkOrderActions.ts`
  - [x] `createWorkOrder(data)` — writes new document to `work_orders` collection with generated id, `createdAt: serverTimestamp()`, `updatedAt: serverTimestamp()`, financial defaults (all 0)
  - [x] `updateWorkOrder(id, data)` — updates existing document with changed fields + `updatedAt: serverTimestamp()`
  - [x] Both operations show success/error toast via `toast.success()` / `toast.error()`
  - [x] Update `src/features/work-orders/hooks/index.ts` to export `useWorkOrderActions`
  - [x] Create `src/features/work-orders/hooks/useWorkOrderActions.test.ts` — tests: create writes to Firestore, update writes to Firestore, error handling

- [x] Task 8: Work Orders Page — Full Implementation (AC: #5, #6)
  - [x] Replace `src/features/work-orders/WorkOrdersPage.tsx` placeholder with full implementation
  - [x] Integrates `useWorkOrders` hook for real-time data
  - [x] Renders list of Work Orders (simple cards with client name, status badge, description)
  - [x] "New Work Order" button opens `WorkOrderForm` (inline or modal)
  - [x] Each Work Order has "Edit" action opening pre-filled `WorkOrderForm`
  - [x] Loading state shows Skeleton components
  - [x] Empty state: warm illustration + "Create your first Work Order" CTA (per UX spec)
  - [x] Replace `src/features/work-orders/WorkOrdersPage.module.scss` with full styles
  - [x] All strings use i18n `t()` keys
  - [x] Create/update `src/features/work-orders/WorkOrdersPage.test.tsx` — tests: renders list, empty state, create flow, edit flow, loading state

- [x] Task 9: i18n Translation Keys (AC: all)
  - [x] Add Work Order-related keys to `src/i18n/en.json`
  - [x] Add Work Order-related keys to `src/i18n/he.json`
  - [x] Keys needed: page title, form labels, status names, empty state, success/error messages, buttons

- [x] Task 10: Build Verification (AC: all)
  - [x] `tsc --noEmit` — zero TypeScript errors
  - [x] `npm run lint` — zero warnings
  - [x] `npm run test` — all tests pass (existing 296 + new tests, zero regressions)
  - [x] `npm run build` — succeeds (requires `all` sandbox permissions for sass-embedded)

## Dev Notes

### Architecture Compliance

- **SCSS Modules only**: All component styling via `*.module.scss`. Tokens and mixins are auto-imported via Vite `additionalData` — use `$gold`, `@include card-surface`, `@include focus-ring`, etc. directly in `.module.scss` files without explicit `@use` statements. [Source: architecture.md#Implementation-Patterns]
- **CSS Logical Properties ONLY**: NEVER use `left`/`right`/`text-align: left`. Use `inline-start`/`inline-end`, `margin-inline`, `padding-inline`, `text-align: start`. All components must work in both RTL and LTR. [Source: architecture.md#Enforcement-Guidelines]
- **Path aliases**: `@/` prefix for all imports. Import from `@/components`, `@/lib`, `@/stores`, `@/types`, etc. [Source: architecture.md#Structure-Patterns]
- **Barrel exports**: Every directory exports through `index.ts`. Consumers import from the directory, not individual files. `import { Button, Card } from '@/components'` — NOT `import { Button } from '@/components/Button/Button'`. [Source: architecture.md#Structure-Patterns]
- **Co-located tests**: `*.test.tsx` / `*.test.ts` next to the component file, NOT in `__tests__/`. [Source: architecture.md#Structure-Patterns]
- **Naming conventions**: Components PascalCase (`WorkOrderForm.tsx`), SCSS modules PascalCase (`WorkOrderForm.module.scss`), SCSS class names camelCase (`.formField`), hooks `use` prefix, utility functions camelCase, types PascalCase no `I` prefix, constants UPPER_SNAKE_CASE, Zod schemas camelCase + `Schema` suffix. [Source: architecture.md#Naming-Patterns]
- **Firestore conventions**: Collection names `snake_case` plural (`work_orders`), document fields `camelCase`, currency fields suffix with `Agora`, timestamp fields suffix with `At`, boolean fields prefix with `is`/`has`, reference fields suffix with `Id`/`Ref`. [Source: architecture.md#Naming-Patterns]
- **No white (#fff) text**: All text uses gold scale tokens (`$text-primary`, `$text-secondary`, `$text-muted`). [Source: architecture.md#Naming-Patterns]
- **Phosphor Icons**: `@phosphor-icons/react` v2.1.10 already installed. Use for icons. Default 24px inline, 20px nav, 18px badges. [Source: architecture.md#Implementation-Patterns]
- **Zustand store pattern**: One store per domain. Store holds data + loading + error. Actions are synchronous setters. Derived values are selectors outside the store. No business logic in stores. [Source: architecture.md#State-Management]
- **Data flow**: Firestore document → Zod schema parse → TypeScript type → Zustand store → React component. Never access Firestore directly from components. [Source: architecture.md#Data-Flow-Patterns]
- **React Hook Form for complex forms**: RHF for Work Order creation/editing forms. Custom controlled components for simpler interactions. [Source: architecture.md#Frontend-Architecture]
- **Feature module boundaries**: Features in `src/features/` are self-contained. Features import from `@/components`, `@/stores`, `@/lib`, `@/types`. Features NEVER import from other features directly. [Source: architecture.md#Architectural-Boundaries]

### Critical Technical Constraints

- **Packages already installed** (DO NOT run npm install except for `@hookform/resolvers`):
  - `react@^19.2.0`, `react-dom@^19.2.0`
  - `firebase@^12.9.0` — Firestore, Auth, Functions, Storage (modular tree-shakeable API)
  - `zustand@^5.0.11` — client-side state management
  - `zod@^4.3.6` — schema validation and TypeScript inference
  - `react-hook-form@^7.71.1` — form handling
  - `@phosphor-icons/react@^2.1.10` — icon library
  - `i18next@^25.8.4`, `react-i18next@^16.5.4` — i18n
  - `sass@^1.87.0` — SCSS compilation (Vite native support)

- **MUST INSTALL** `@hookform/resolvers` — NOT currently in `package.json`. Required for `zodResolver` to connect React Hook Form with Zod validation:
  ```bash
  npm install @hookform/resolvers
  ```

- **Placeholder files already exist** — REPLACE content, do NOT create new files at these paths:
  - `src/types/workOrder.ts` (has `export {}`)
  - `src/stores/useWorkOrderStore.ts` (has `export {}`)
  - `src/features/work-orders/WorkOrdersPage.tsx` (has placeholder UI)
  - `src/features/work-orders/WorkOrdersPage.module.scss` (has placeholder styles)
  - `src/features/work-orders/WorkOrderDetailPage.tsx` (has placeholder UI — DO NOT MODIFY, that's Story 2.5)
  - `src/features/work-orders/hooks/index.ts` (has `export {}`)
  - `src/features/work-orders/components/index.ts` (empty)

- **Existing barrel exports already reference these directories**: `src/types/index.ts` already has `export * from './workOrder'`. `src/stores/index.ts` already has `export * from './useWorkOrderStore'` (via the placeholder pattern). `src/features/work-orders/index.ts` already exports `WorkOrdersPage`, `WorkOrderDetailPage`, plus re-exports from `./components` and `./hooks`. These barrels do NOT need modification — they'll automatically pick up new exports.

- **SCSS auto-import**: `_variables.scss` and `_mixins.scss` are auto-imported via Vite `additionalData` into every `.module.scss` file. Tokens (`$gold`, `$bg-tertiary`, etc.) and mixins (`@include card-surface`, `@include focus-ring`, etc.) are available without `@use` statements. [Source: Stories 1.2, 1.5]

- **Animation keyframes available globally**: `@keyframes shimmer`, `fadeIn`, `slideDown`, `pulse`, `spin`, `scaleIn` defined in `_animations.scss` and loaded via `global.scss`. Reference directly in `.module.scss` files. No import needed. [Source: Story 1.2]

- **Toast system available**: `toast.success(msg)`, `toast.error(msg, action?)`, `toast.warning(msg)`, `toast.info(msg)` from `@/components/Toast` — can be called outside React components. [Source: Story 1.6]

- **Shared components available from Story 1.6**: Button (4 variants, 3 sizes, loading, shortcut), Card (clickable, hover), Badge/StatusBadge/ConfidenceBadge, Input (text/number/currency), Select (searchable dropdown), SearchInput, Toast/ToastContainer, Skeleton, ErrorBoundary. Import via `import { Button, Card, Input, Select, ... } from '@/components'`.

- **Currency utilities available from Story 1.6**: `toMinorUnits()`, `toDisplayAmount()`, `formatCurrency()` from `@/lib/currency`. Use for any financial amount display.

- **Firebase initialized**: `src/services/firebase.ts` exports `db` (Firestore instance). Import Firestore functions from `firebase/firestore` and use `db` from `@/services`. [Source: Story 1.1]

- **i18n configured**: `react-i18next` working with Hebrew/English. Use `const { t } = useTranslation()` in components. Add keys to both `en.json` and `he.json`. [Source: Story 1.5]

- **Test infrastructure ready**: Vitest + React Testing Library. CSS module mocks and react-i18next mocks already configured globally. Use `await import()` for components with Phosphor icons to avoid jsdom hangs. Use `MemoryRouter` wrapping for route-aware tests. 296 tests currently passing.

### Firestore Data Model — Work Orders

```typescript
// Firestore collection: work_orders
// Document structure:
{
  id: string,              // Auto-generated Firestore document ID
  clientName: string,      // Required — e.g., "David's Game", "Rina's Wedding Game"
  projectDescription: string, // Optional description
  deadline: Timestamp | null, // Optional deadline
  status: 'Lead' | 'Design' | 'Production' | 'Shipped',
  revenueTotalAgora: number,   // Integer (agora) — default 0, updated by transaction linkage (Story 2.3)
  directCostAgora: number,     // Integer (agora) — default 0, updated by transaction linkage (Story 2.3)
  inventoryCostAgora: number,  // Integer (agora) — default 0, updated by Scoop action (Epic 6)
  overheadAllocationAgora: number, // Integer (agora) — default 0, calculated proportionally (Story 2.4)
  createdAt: Timestamp,
  updatedAt: Timestamp,
}
```

**Important**: The cost fields (`revenueTotalAgora`, `directCostAgora`, etc.) default to 0 in this story. They will be populated by transaction linkage in Story 2.3 and Scoop action in Epic 6. This story only creates the data model and CRUD — do NOT build transaction linkage or Nutrition Label (those are Stories 2.3 and 2.4).

### Zod Schema Design

```typescript
// src/types/workOrder.ts
import { z } from 'zod';

export const WORK_ORDER_STATUSES = ['Lead', 'Design', 'Production', 'Shipped'] as const;
export type WorkOrderStatus = typeof WORK_ORDER_STATUSES[number];

export const workOrderSchema = z.object({
  id: z.string(),
  clientName: z.string().min(1, 'Client name is required'),
  projectDescription: z.string().default(''),
  deadline: z.date().nullable().default(null),
  status: z.enum(WORK_ORDER_STATUSES).default('Lead'),
  revenueTotalAgora: z.number().int().default(0),
  directCostAgora: z.number().int().default(0),
  inventoryCostAgora: z.number().int().default(0),
  overheadAllocationAgora: z.number().int().default(0),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type WorkOrder = z.infer<typeof workOrderSchema>;

// Form input schema — subset for create/edit (no id, computed costs, timestamps)
export const createWorkOrderSchema = z.object({
  clientName: z.string().min(1, 'Client name is required'),
  projectDescription: z.string().default(''),
  deadline: z.date().nullable().default(null),
  status: z.enum(WORK_ORDER_STATUSES).default('Lead'),
});

export type CreateWorkOrderInput = z.infer<typeof createWorkOrderSchema>;
```

**Note on Firestore Timestamps**: When reading from Firestore, `Timestamp` objects need to be converted to JS `Date` objects. The Zod schema expects `Date`. The `useFirestoreCollection` hook should handle this conversion: `doc.data().createdAt?.toDate()`.

### Zustand Store Design

```typescript
// src/stores/useWorkOrderStore.ts
import { create } from 'zustand';
import type { WorkOrder } from '@/types';

interface WorkOrderStore {
  workOrders: WorkOrder[];
  loading: boolean;
  error: string | null;
  setWorkOrders: (orders: WorkOrder[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useWorkOrderStore = create<WorkOrderStore>((set) => ({
  workOrders: [],
  loading: true,
  error: null,
  setWorkOrders: (workOrders) => set({ workOrders, loading: false, error: null }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error, loading: false }),
}));

// Selectors (defined outside store per architecture pattern)
export const selectActiveProjects = (state: WorkOrderStore) =>
  state.workOrders.filter((wo) => wo.status === 'Production');

export const selectWorkOrderById = (id: string) => (state: WorkOrderStore) =>
  state.workOrders.find((wo) => wo.id === id);
```

### Generic Firestore Collection Hook Design

```typescript
// src/hooks/useFirestoreCollection.ts
import { useEffect } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/services';
import type { ZodSchema } from 'zod';

/**
 * Generic real-time Firestore collection listener.
 * Subscribes on mount, parses documents through Zod schema, cleans up on unmount.
 */
export function useFirestoreCollection<T>(
  collectionName: string,
  schema: ZodSchema<T>,
  callbacks: {
    onData: (data: T[]) => void;
    onError: (error: string) => void;
    onLoading: (loading: boolean) => void;
  }
) {
  useEffect(() => {
    callbacks.onLoading(true);
    const q = query(collection(db, collectionName));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: T[] = [];
        snapshot.forEach((doc) => {
          const raw = doc.data();
          // Convert Firestore Timestamps to Date objects
          const converted = {
            ...raw,
            id: doc.id,
            createdAt: raw.createdAt?.toDate?.() ?? new Date(),
            updatedAt: raw.updatedAt?.toDate?.() ?? new Date(),
            deadline: raw.deadline?.toDate?.() ?? null,
          };
          const result = schema.safeParse(converted);
          if (result.success) {
            items.push(result.data);
          } else {
            console.warn(`[useFirestoreCollection] Failed to parse document ${doc.id}:`, result.error);
          }
        });
        callbacks.onData(items);
      },
      (error) => {
        console.error(`[useFirestoreCollection] Listener error on ${collectionName}:`, error);
        callbacks.onError(error.message);
      }
    );

    return () => unsubscribe();
  }, [collectionName]); // Only re-subscribe if collection name changes
}
```

**Design rationale**: The generic hook accepts callbacks instead of returning state directly, so it can feed into the Zustand store pattern. Feature-specific hooks (like `useWorkOrders`) wrap this generic hook and pass the store actions as callbacks.

### React Hook Form + Zod Integration

```typescript
// In WorkOrderForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createWorkOrderSchema, type CreateWorkOrderInput } from '@/types';

const { register, handleSubmit, formState: { errors }, reset } = useForm<CreateWorkOrderInput>({
  resolver: zodResolver(createWorkOrderSchema),
  defaultValues: {
    clientName: '',
    projectDescription: '',
    deadline: null,
    status: 'Lead',
  },
});
```

**Important**: The existing shared `Input` and `Select` components from Story 1.6 use their own props pattern. React Hook Form's `register` returns `{ onChange, onBlur, name, ref }`. You may need to use `Controller` from react-hook-form for the `Select` component (custom dropdown) since it doesn't use native `<select>`:

```typescript
import { Controller } from 'react-hook-form';

<Controller
  name="status"
  control={control}
  render={({ field }) => (
    <Select
      label={t('workOrders.form.status')}
      options={statusOptions}
      value={field.value}
      onChange={field.onChange}
      error={errors.status?.message}
    />
  )}
/>
```

For the `Input` component, check if it forwards `ref` properly. If `Input` wraps a native `<input>`, `register` should work with spread. If not, use `Controller` for controlled behavior.

### Firestore Write Operations

```typescript
// In useWorkOrderActions.ts
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/services';
import { toast } from '@/components/Toast';

export function useWorkOrderActions() {
  const createWorkOrder = async (data: CreateWorkOrderInput) => {
    try {
      await addDoc(collection(db, 'work_orders'), {
        ...data,
        revenueTotalAgora: 0,
        directCostAgora: 0,
        inventoryCostAgora: 0,
        overheadAllocationAgora: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast.success(t('workOrders.toast.created'));
    } catch (error) {
      toast.error(t('workOrders.toast.createError'));
      throw error;
    }
  };

  const updateWorkOrder = async (id: string, data: Partial<CreateWorkOrderInput>) => {
    try {
      await updateDoc(doc(db, 'work_orders', id), {
        ...data,
        updatedAt: serverTimestamp(),
      });
      toast.success(t('workOrders.toast.updated'));
    } catch (error) {
      toast.error(t('workOrders.toast.updateError'));
      throw error;
    }
  };

  return { createWorkOrder, updateWorkOrder };
}
```

### i18n Keys to Add

Add to both `src/i18n/en.json` and `src/i18n/he.json`:

**English:**
```json
{
  "workOrders": {
    "title": "Work Orders",
    "newWorkOrder": "New Work Order",
    "editWorkOrder": "Edit Work Order",
    "emptyState": {
      "title": "No projects yet",
      "description": "Create your first Work Order to start tracking project finances.",
      "cta": "Create First Work Order"
    },
    "form": {
      "clientName": "Client Name",
      "clientNameRequired": "Client name is required",
      "projectDescription": "Project Description",
      "deadline": "Deadline",
      "status": "Status",
      "save": "Save",
      "cancel": "Cancel",
      "create": "Create Work Order",
      "update": "Update Work Order"
    },
    "status": {
      "Lead": "Lead",
      "Design": "Design",
      "Production": "Production",
      "Shipped": "Shipped"
    },
    "toast": {
      "created": "Work Order created successfully",
      "updated": "Work Order updated successfully",
      "createError": "Failed to create Work Order",
      "updateError": "Failed to update Work Order"
    },
    "card": {
      "edit": "Edit",
      "noDescription": "No description"
    }
  }
}
```

**Hebrew:**
```json
{
  "workOrders": {
    "title": "הזמנות עבודה",
    "newWorkOrder": "הזמנת עבודה חדשה",
    "editWorkOrder": "עריכת הזמנת עבודה",
    "emptyState": {
      "title": "אין פרויקטים עדיין",
      "description": "צרו את הזמנת העבודה הראשונה כדי להתחיל לעקוב אחר כספי הפרויקט.",
      "cta": "צור הזמנת עבודה ראשונה"
    },
    "form": {
      "clientName": "שם הלקוח",
      "clientNameRequired": "שם הלקוח נדרש",
      "projectDescription": "תיאור הפרויקט",
      "deadline": "תאריך יעד",
      "status": "סטטוס",
      "save": "שמור",
      "cancel": "ביטול",
      "create": "צור הזמנת עבודה",
      "update": "עדכן הזמנת עבודה"
    },
    "status": {
      "Lead": "ליד",
      "Design": "עיצוב",
      "Production": "ייצור",
      "Shipped": "נשלח"
    },
    "toast": {
      "created": "הזמנת העבודה נוצרה בהצלחה",
      "updated": "הזמנת העבודה עודכנה בהצלחה",
      "createError": "יצירת הזמנת העבודה נכשלה",
      "updateError": "עדכון הזמנת העבודה נכשל"
    },
    "card": {
      "edit": "עריכה",
      "noDescription": "אין תיאור"
    }
  }
}
```

### Project Structure Notes

**New files to create:**

| File | Type | Notes |
|---|---|---|
| `src/types/workOrder.test.ts` | NEW | Zod schema validation tests |
| `src/stores/useWorkOrderStore.test.ts` | NEW | Store state and selector tests |
| `src/hooks/useFirestoreCollection.ts` | NEW | Generic real-time listener (shared) |
| `src/hooks/useFirestoreCollection.test.ts` | NEW | Hook tests |
| `src/features/work-orders/hooks/useWorkOrders.ts` | NEW | Feature-specific real-time hook |
| `src/features/work-orders/hooks/useWorkOrders.test.ts` | NEW | Hook tests |
| `src/features/work-orders/hooks/useWorkOrderActions.ts` | NEW | CRUD operations |
| `src/features/work-orders/hooks/useWorkOrderActions.test.ts` | NEW | CRUD tests |
| `src/features/work-orders/components/WorkOrderForm.tsx` | NEW | Create/edit form |
| `src/features/work-orders/components/WorkOrderForm.module.scss` | NEW | Form styles |
| `src/features/work-orders/components/WorkOrderForm.test.tsx` | NEW | Form tests |

**Files to REPLACE (were placeholders):**

| File | Action | Notes |
|---|---|---|
| `src/types/workOrder.ts` | REPLACE | Was `export {}` — now full Zod schema |
| `src/stores/useWorkOrderStore.ts` | REPLACE | Was `export {}` — now full Zustand store |
| `src/features/work-orders/WorkOrdersPage.tsx` | REPLACE | Was stub — now full page implementation |
| `src/features/work-orders/WorkOrdersPage.module.scss` | REPLACE | Was stub — now full styles |

**Files to MODIFY:**

| File | Action | Notes |
|---|---|---|
| `src/hooks/index.ts` | ADD EXPORT | Add `useFirestoreCollection` |
| `src/features/work-orders/hooks/index.ts` | ADD EXPORTS | Add `useWorkOrders`, `useWorkOrderActions` |
| `src/features/work-orders/components/index.ts` | ADD EXPORT | Add `WorkOrderForm` |
| `src/i18n/en.json` | ADD KEYS | `workOrders.*` keys |
| `src/i18n/he.json` | ADD KEYS | `workOrders.*` keys |

**Files NOT to modify:**
- `src/types/index.ts` — already has `export * from './workOrder'`
- `src/stores/index.ts` — already exports `useWorkOrderStore`
- `src/features/work-orders/index.ts` — already re-exports components and hooks
- `src/features/work-orders/WorkOrderDetailPage.tsx` — belongs to Story 2.5
- `vite.config.ts`, `vitest.config.ts` — no changes needed

### Previous Story Intelligence (Story 1.6 — Last in Epic 1)

**Key patterns established:**
- SCSS Modules work with auto-imported tokens and mixins — use `$gold`, `@include card-surface` directly
- `src/__mocks__/react-i18next.ts` mock returns translation key as string. Components using `useTranslation` will have `t()` calls return keys in tests
- `src/__mocks__/css-module.ts` provides Proxy-based CSS module mock — all `.module.scss` imports resolve to `className` strings matching property name
- `vitest.config.ts` resolve aliases handle both mocks automatically — no per-test setup needed
- `await import()` pattern required for Phosphor icon imports in Vitest to avoid jsdom hangs
- `MemoryRouter` wrapping needed for route-aware component tests
- Toast convenience functions (`toast.success()`, etc.) work outside React component trees via `useUIStore.getState()`
- ErrorBoundary is a class component — React 19 still requires it

**Critical learning from Story 1.6 code review:**
- H2: Select dropdown positions relative to trigger via `getBoundingClientRect` — important for form usage
- M2: ILS locale uses `en-IL` (not `he-IL`) for clean `₪82.00` format
- Badge `default` color class uses `colorDefault` in SCSS to avoid CSS module collision

**Learnings from Story 1.4 (App Shell):**
- `await import()` pattern for Phosphor icon imports in tests
- `MemoryRouter` wrapping for route-aware tests
- Single comprehensive commits per story

### Git Intelligence

**Recent commits (most recent first):**
- `c3f5157` — Implement Story 1.6: Core Shared UI Components & Currency Utilities with code review fixes
- `65263d4` — Implement Story 1.5: Internationalization & RTL Support with code review fixes
- `e0d6fc2` — Implement Story 1.4: App Shell & Responsive Navigation with code review fixes
- `55230df` — Add Gal's UID to auth whitelist
- `aa7bd16` — Implement Story 1.3: Authentication & Route Protection with code review fixes
- `41d521b` — Implement Story 1.2: Design System Tokens & Global Styles with code review fixes
- `fffa502` — Initial project setup (Story 1.1)

**Patterns established:**
- Single comprehensive commit per story with code review fixes included
- All component directories created as placeholder stubs in Story 1.1, ready to be populated
- Design tokens fully defined in Story 1.2, Phosphor icons since Story 1.4, i18n since Story 1.5, shared components since Story 1.6
- 296 tests passing across the codebase — new tests must not break these

### Latest Technical Information

**Zod 4.x (installed ^4.3.6):**
- `z.object()`, `z.string()`, `z.number()`, `z.enum()`, `z.date()` — standard API unchanged
- `z.infer<typeof schema>` for TypeScript type inference
- `.safeParse()` returns `{ success: true, data }` or `{ success: false, error }` — use for Firestore document parsing
- `.default()` sets default values in schema
- `.nullable()` allows `null` values
- `.int()` ensures integer (important for Agora currency fields)

**React Hook Form 7.71.x + @hookform/resolvers:**
- `useForm<T>({ resolver: zodResolver(schema) })` connects Zod validation
- `register()` for native inputs, `Controller` for custom components (like the `Select` dropdown)
- `formState.errors` provides field-level error messages from Zod
- `handleSubmit(onValid, onInvalid)` handles form submission
- `reset()` clears form or sets new default values (useful for switching between create/edit mode)

**Firebase Firestore Modular API (SDK 12.9.0):**
- `import { collection, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, query } from 'firebase/firestore'`
- `onSnapshot(query, onNext, onError)` — returns `Unsubscribe` function
- `addDoc(collectionRef, data)` — auto-generates document ID
- `updateDoc(docRef, data)` — partial update
- `serverTimestamp()` — server-generated timestamp (resolves to Firestore Timestamp)
- `doc.data()` returns raw data; Timestamps have `.toDate()` method to convert to JS Date

**Zustand 5.0.x:**
- `create<T>((set, get) => ({...}))` — unchanged API
- `getState()` for accessing store outside React (used for toast convenience functions)
- Selectors defined as standalone functions for memoization

### Potential Pitfalls to Avoid

1. **DO NOT build Nutrition Label, transaction linkage, or margin calculations in this story** — those are Stories 2.3 and 2.4. This story only creates the Work Order data model, CRUD operations, and basic list/form UI. The cost fields (`directCostAgora`, etc.) default to 0.

2. **DO NOT build the StatusStepper component** — that's Story 2.2. The status field in this story is a simple Select dropdown in the form.

3. **DO NOT modify `WorkOrderDetailPage.tsx`** — that's Story 2.5. Only modify `WorkOrdersPage.tsx`.

4. **DO NOT use native `<select>` element** — use the custom `Select` component from `@/components` (built in Story 1.6) for the status dropdown.

5. **DO NOT forget to install `@hookform/resolvers`** — it's the ONLY new npm dependency needed. Everything else is already installed.

6. **DO NOT use `doc.data()` without converting Timestamps** — Firestore Timestamps are NOT JS Dates. Always call `.toDate()` before passing to Zod schema parsing.

7. **DO NOT use `left`/`right` in CSS** — use CSS logical properties (`inline-start`/`inline-end`).

8. **DO NOT use `#fff` for text** — use `$text-primary`, `$text-secondary`, or `$text-muted`.

9. **DO NOT forget `aria-live`, proper labels, and focus management** — the form should be accessible. All inputs must have labels (visible or `.sr-only`).

10. **DO NOT use `React.FC` type** — use explicit function declarations with typed props.

11. **DO NOT put tests in `__tests__/` directories** — co-locate next to the component file.

12. **DO NOT use `@use` in `.module.scss` files** — tokens and mixins are auto-imported via Vite.

13. **DO NOT forget empty state UX** — when no Work Orders exist, show warm empty state per UX spec: "No projects yet" + illustration + CTA.

14. **DO NOT mock Firestore in a way that couples tests to implementation** — mock at the service level (`firebase/firestore` module) and test behavior, not implementation details.

15. **DO NOT forget to handle the loading state** — show `Skeleton` components while `useWorkOrders` is fetching initial data.

16. **DO NOT create a `useFirestoreDoc` hook yet** — that will be needed for detail pages (Story 2.5). Only create `useFirestoreCollection` for this story.

17. **BE CAREFUL with Zod 4 + React Hook Form** — Zod 4's type inference may differ slightly from Zod 3. Verify that `zodResolver` from `@hookform/resolvers/zod` works correctly with Zod 4. If there are compatibility issues, consider using `@hookform/resolvers/zod/v4` import if available, or use Zod's `.parse()` manually in the `onSubmit` handler as a fallback.

18. **Deadline field handling**: The `deadline` field is a `Date | null`. In the form, use a native `<input type="date">` with the `Input` component. Convert between `YYYY-MM-DD` string format (HTML date input) and JS `Date` object. When saving to Firestore, convert to Firestore Timestamp or save as null.

### WorkOrdersPage Design Spec

- **Page Layout**: Title + "New Work Order" button in header row, Work Order list below
- **Work Order Cards**: Use `Card` component. Each card shows: client name (`$text-lg`, `$gold`), project description (`$text-sm`, `$text-primary`), `StatusBadge` (from `@/components`), deadline if set
- **Empty State**: Centered, warm message with `ClipboardText` Phosphor icon (already used in placeholder), title, description, CTA button (primary variant)
- **Loading State**: 3-4 `Skeleton` cards stacked
- **Form Display**: Inline within the page (slide down below header) or as a focused card overlay — developer's choice, but inline is simpler for this story
- **Mobile**: Cards stack single-column, full-width. "New Work Order" button full-width. Touch targets >= 44px

### Cross-Story Context (Epic 2)

This is the **first story in Epic 2** — it establishes the foundation that all subsequent stories build on:

- **Story 2.2** (Status Lifecycle & List View) adds the StatusStepper, margin color coding, and sort/filter to the list — it expects `WorkOrder` type and `useWorkOrderStore` to exist
- **Story 2.3** (Manual Transaction Entry) creates the `Transaction` type and links transactions to Work Orders — it expects `workOrderId` field and `useWorkOrderActions` to exist
- **Story 2.4** (Nutrition Label) creates margin calculations using the cost fields — it expects all `*Agora` fields to exist with defaults
- **Story 2.5** (Work Order Detail Page) assembles everything into a detail view — it expects all prior stories

**This story's scope is deliberately focused**: Data model + CRUD + basic list + form. No margins, no status stepper, no transaction linkage. Keep it clean.

### References

- [Source: planning-artifacts/epics.md#Story-2.1] — Full acceptance criteria
- [Source: planning-artifacts/architecture.md#Data-Architecture] — Firestore collections, Zod schemas, currency storage
- [Source: planning-artifacts/architecture.md#Naming-Patterns] — File/class/variable/collection naming conventions
- [Source: planning-artifacts/architecture.md#Implementation-Patterns] — SCSS Modules, CSS logical properties, Phosphor icons
- [Source: planning-artifacts/architecture.md#Enforcement-Guidelines] — Currency utilities, testing, co-location rules
- [Source: planning-artifacts/architecture.md#State-Management] — Zustand store patterns, selectors
- [Source: planning-artifacts/architecture.md#Data-Flow-Patterns] — Firestore → Zod → Store → Component
- [Source: planning-artifacts/architecture.md#Frontend-Architecture] — React Hook Form, feature modules, routing
- [Source: planning-artifacts/architecture.md#API-Communication] — Firestore SDK, onSnapshot, Cloud Functions triggers
- [Source: planning-artifacts/architecture.md#Project-Structure] — Full directory tree
- [Source: planning-artifacts/prd.md#Work-Order-Management] — FR10-FR15
- [Source: planning-artifacts/prd.md#Manual-Transaction-Fallback] — FR50 (Story 2.3)
- [Source: planning-artifacts/ux-design-specification.md#Component-Strategy] — KPI Card, Project Row, Nutrition Label specs
- [Source: planning-artifacts/ux-design-specification.md#Empty-States] — Warm empty state patterns
- [Source: planning-artifacts/ux-design-specification.md#Form-Patterns] — Tab order, validation display
- [Source: planning-artifacts/ux-design-specification.md#Feedback-Patterns] — Toast types and durations
- [Source: planning-artifacts/ux-design-specification.md#Loading-State-Patterns] — Skeleton shimmer
- [Source: implementation-artifacts/1-6-core-shared-ui-components-currency-utilities.md] — Previous story patterns, shared components, test infrastructure
- [Source: Zod 4 docs] — Schema definition, type inference, safeParse
- [Source: React Hook Form 7 docs] — useForm, zodResolver, Controller, register
- [Source: Firebase Firestore modular API] — onSnapshot, addDoc, updateDoc, serverTimestamp

## Dev Agent Record

### Agent Model Used

Claude claude-4.6-opus (Cursor Agent)

### Debug Log References

- Zod 4 `.default()` creates input/output type divergence with `zodResolver` — removed defaults from `createWorkOrderSchema` and used form `defaultValues` instead
- SCSS variable is `$bp-sm` not `$breakpoint-sm` — fixed in both `.module.scss` files
- Phosphor icon dynamic imports in jsdom cause slow module loading during parallel test execution — added `beforeAll` with 30s timeout for pre-loading component modules
- `@hookform/resolvers` v5.2.2 installed — `zodResolver` from `@hookform/resolvers/zod` works with Zod 4

### Completion Notes List

- ✅ Task 1: Full Zod schema with `workOrderSchema` (all fields, defaults, validation) and `createWorkOrderSchema` (form subset). 18 tests.
- ✅ Task 2: Zustand store with `workOrders`, `loading`, `error` state + 3 actions + 2 selectors. 9 tests.
- ✅ Task 3: Generic `useFirestoreCollection<T>` hook — real-time listener with Zod parsing, Timestamp-to-Date conversion, unmount cleanup. 5 tests.
- ✅ Task 4: `useWorkOrders` hook — wraps generic hook for `work_orders` collection, syncs to store. 4 tests.
- ✅ Task 5: Installed `@hookform/resolvers@5.2.2`.
- ✅ Task 6: `WorkOrderForm` component — React Hook Form + zodResolver, all 4 fields, create/edit modes, Input/Select/Button shared components. 7 tests.
- ✅ Task 7: `useWorkOrderActions` hook — `createWorkOrder`/`updateWorkOrder` with Firestore writes, serverTimestamp, toast notifications. 6 tests.
- ✅ Task 8: Full `WorkOrdersPage` — list view with cards, StatusBadge, create/edit form, loading skeleton, empty state, error display. 8 tests.
- ✅ Task 9: i18n keys added to both `en.json` and `he.json` — 25+ translation keys for page, form, status, toast, empty state.
- ✅ Task 10: `tsc --noEmit` clean, `npm run lint` zero warnings, 351 tests pass (55 new, 0 regressions), `npm run build` succeeds.

### Change Log

- 2026-02-07: Implemented Story 2.1 — Work Order Data Model & CRUD. Created Zod schema, Zustand store, Firestore real-time hooks, CRUD operations, form component, and full page implementation with i18n support. 55 new tests, zero regressions.

### File List

**New files:**
- `src/types/workOrder.test.ts`
- `src/stores/useWorkOrderStore.test.ts`
- `src/hooks/useFirestoreCollection.ts`
- `src/hooks/useFirestoreCollection.test.ts`
- `src/features/work-orders/hooks/useWorkOrders.ts`
- `src/features/work-orders/hooks/useWorkOrders.test.ts`
- `src/features/work-orders/hooks/useWorkOrderActions.ts`
- `src/features/work-orders/hooks/useWorkOrderActions.test.ts`
- `src/features/work-orders/components/WorkOrderForm.tsx`
- `src/features/work-orders/components/WorkOrderForm.module.scss`
- `src/features/work-orders/components/WorkOrderForm.test.tsx`
- `src/features/work-orders/WorkOrdersPage.test.tsx`

**Replaced (were placeholders):**
- `src/types/workOrder.ts`
- `src/stores/useWorkOrderStore.ts`
- `src/features/work-orders/WorkOrdersPage.tsx`
- `src/features/work-orders/WorkOrdersPage.module.scss`

**Modified:**
- `src/hooks/index.ts` — added `useFirestoreCollection` export
- `src/features/work-orders/hooks/index.ts` — added `useWorkOrders`, `useWorkOrderActions` exports
- `src/features/work-orders/components/index.ts` — added `WorkOrderForm` export
- `src/i18n/en.json` — added `workOrders.*` keys
- `src/i18n/he.json` — added `workOrders.*` keys
- `package.json` — added `@hookform/resolvers` dependency
- `package-lock.json` — updated lockfile
