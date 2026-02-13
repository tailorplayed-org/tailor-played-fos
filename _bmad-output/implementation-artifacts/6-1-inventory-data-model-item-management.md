# Story 6.1: Inventory Data Model & Item Management

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As **Gal**,
I want to create and manage an inventory of shared materials with stock levels and costs,
So that I can track what materials I have and what they're worth.

## Acceptance Criteria

1. **Inventory Type & Schema**: Given `src/types/inventory.ts`, when the InventoryItem type and Zod schema are created, then `inventoryItemSchema` validates: `id` (string), `name` (string, required), `sku` (string, optional), `supplier` (string, optional), `currentQty` (number, >= 0), `wacAgora` (integer, weighted average cost per unit in agora), `reorderThreshold` (number, optional), `unit` (string, e.g., "sheets", "kg", "units"), `createdAt` (Timestamp), `updatedAt` (Timestamp). `InventoryItem` TypeScript type is inferred from schema.

2. **Zustand Store**: Given `src/stores/useInventoryStore.ts`, when the Zustand store is created, then it holds `inventory: InventoryItem[]`, `loading: boolean`, `error: string | null`. Selectors: `selectByName(query)` (fuzzy name search), `selectLowStock` (items where `currentQty <= reorderThreshold`).

3. **Firestore Real-Time Hook**: Given `src/features/inventory/hooks/useInventory.ts`, when the hook is created, then it subscribes to the `inventory` collection via `onSnapshot`, data flows through Zod validation into `useInventoryStore`, and cleanup occurs on unmount.

4. **Inventory Table**: Given the Inventory page (`/inventory`), when inventory items exist, then a table renders with columns: Name, SKU, Supplier, Current Qty, WAC/Unit (formatted via `formatCurrency`), Total Value (qty x WAC, formatted), Reorder Threshold. Table uses `$text-sm` body text, sticky header with `$bg-elevated`, sortable columns. Rows where `currentQty <= reorderThreshold` show a warning indicator (orange left border + "Low Stock" badge).

5. **Empty State**: Given the Inventory page, when no inventory items exist, then a warm empty state displays: "Add your first material" with a CTA button.

6. **Add Material Form**: Given the Inventory page, when Gal clicks "Add Material", then a creation form appears (React Hook Form) with fields: Name (required), SKU, Supplier, Unit (required), Initial Quantity (default 0), Initial Cost per Unit (optional — sets initial WAC), Reorder Threshold. Form validates via Zod schema. On submit, a document is created in Firestore `inventory` collection. A success toast confirms creation.

7. **Edit Material**: Given an existing inventory item, when Gal clicks Edit, then the form pre-fills with current values (name, SKU, supplier, unit, reorder threshold). Quantity and WAC are NOT directly editable — they change only via restocks and scoops (data integrity).

8. **Mobile Responsive**: Given the Inventory page on mobile, when rendered on a small viewport, then the table adapts: Name + Qty + WAC visible, other columns hidden or available via horizontal scroll. Rows are tappable with >= 44px height.

## Tasks / Subtasks

- [x] Task 1: Create InventoryItem type + Zod schemas (AC: #1)
  - [x] Define `inventoryItemSchema` in `src/types/inventory.ts` with all fields
  - [x] Export `InventoryItem` type inferred from schema
  - [x] Define `createInventoryItemSchema` (form input subset — no id, currentQty, wacAgora, timestamps)
  - [x] Export `CreateInventoryItemInput` type
  - [x] Add unit test for schema validation in `src/types/inventory.test.ts`

- [x] Task 2: Create Zustand store with selectors (AC: #2)
  - [x] Implement `useInventoryStore` in `src/stores/useInventoryStore.ts`
  - [x] State: `inventory: InventoryItem[]`, `loading: boolean`, `error: string | null`
  - [x] Actions: `setInventory`, `setLoading`, `setError`
  - [x] External selectors: `selectByName(query)`, `selectLowStock`

- [x] Task 3: Create shared Table + SortableHeader components (AC: #4)
  - [x] Build `src/components/Table/Table.tsx` — reusable data table
  - [x] Build `src/components/Table/Table.module.scss`
  - [x] Build `src/components/Table/SortableHeader.tsx` — clickable header with sort indicators
  - [x] SortableHeader styles integrated in `Table.module.scss` (no separate file needed)
  - [x] Create `src/components/Table/Table.test.tsx`
  - [x] Update `src/components/Table/index.ts` barrel export

- [x] Task 4: Create `useInventory` Firestore real-time hook (AC: #3)
  - [x] Implement `src/features/inventory/hooks/useInventory.ts`
  - [x] Subscribe to `inventory` collection using `useFirestoreCollection`
  - [x] Wire to `useInventoryStore` (same pattern as `useWorkOrders`)
  - [x] Update `src/features/inventory/hooks/index.ts` barrel export

- [x] Task 5: Build InventoryTable component (AC: #4, #8)
  - [x] Create `src/features/inventory/components/InventoryTable.tsx`
  - [x] Create `src/features/inventory/components/InventoryTable.module.scss`
  - [x] Implement sortable columns: Name, SKU, Supplier, Current Qty, WAC/Unit, Total Value, Reorder Threshold
  - [x] Low Stock indicator: orange left border + `<Badge label="Low Stock" color="warning" />`
  - [x] Mobile responsive: hide SKU, Supplier, Reorder Threshold columns < 768px
  - [x] Row click → opens edit form
  - [x] Create `src/features/inventory/components/InventoryTable.test.tsx`

- [x] Task 6: Build InventoryForm component (AC: #6, #7)
  - [x] Create `src/features/inventory/components/InventoryForm.tsx`
  - [x] Create `src/features/inventory/components/InventoryForm.module.scss`
  - [x] React Hook Form + zodResolver with `createInventoryItemSchema`
  - [x] Fields: Name (required), SKU, Supplier, Unit (required), Initial Qty, Initial Cost/Unit, Reorder Threshold
  - [x] Edit mode: pre-fill values, hide qty/WAC fields
  - [x] Create mode: show initial qty and cost fields
  - [x] Create `src/features/inventory/components/InventoryForm.test.tsx`

- [x] Task 7: Implement InventoryPage (AC: #4, #5, #6, #7, #8)
  - [x] Replace placeholder in `src/features/inventory/InventoryPage.tsx`
  - [x] Update `src/features/inventory/InventoryPage.module.scss`
  - [x] Wire `useInventory` hook for data subscription
  - [x] Empty state with Package icon + "Add your first material" CTA
  - [x] "Add Material" button → show InventoryForm (create mode)
  - [x] Row click → show InventoryForm (edit mode)
  - [x] Firestore CRUD: `addDoc` for create, `updateDoc` for edit
  - [x] Toast on success/error
  - [x] Update `src/features/inventory/InventoryPage.test.tsx`

- [x] Task 8: Add i18n translation keys (AC: #4, #5, #6, #7)
  - [x] Add `inventory.*` keys to `src/i18n/en.json`
  - [x] Add `inventory.*` keys to `src/i18n/he.json`

- [x] Task 9: Update barrel exports
  - [x] Update `src/features/inventory/components/index.ts`
  - [x] Verify `src/features/inventory/index.ts` exports
  - [x] Verify `src/components/Table/index.ts` exports

## Dev Notes

### Architecture & Patterns

- **Feature boundary**: All inventory-specific code goes in `src/features/inventory/`. Shared Table components go in `src/components/Table/`. No cross-feature imports.
- **Data flow**: `Firestore onSnapshot → Zod parse → InventoryItem type → useInventoryStore → React component`
- **Currency**: All monetary values stored as integers (agora). Display via `formatCurrency(amountAgora, 'ILS')` from `@/lib/currency`. Never do raw arithmetic on display values.
- **Total Value column**: Computed in the component as `currentQty * wacAgora`, displayed via `formatCurrency`. NOT stored in Firestore — it's a derived value.
- **WAC field immutability**: `wacAgora` and `currentQty` are NEVER directly editable by the user. They only change through restocks (Story 6.2) and scoops (Story 6.3). The edit form must NOT include these fields.
- **Initial WAC**: When creating a new item with initial quantity and cost per unit, set `wacAgora = initialCostPerUnitAgora` and `currentQty = initialQty`. If no initial cost is provided, `wacAgora = 0`.

### Existing Components to REUSE (Do NOT Recreate)

| Component | Location | Reuse For |
|---|---|---|
| `Button` | `src/components/Button/Button.tsx` | "Add Material" CTA, form submit/cancel buttons |
| `Input` | `src/components/Input/Input.tsx` | All form text/number fields. Props: `label`, `error`, `helperText`, extends native `<input>` |
| `Select` | `src/components/Input/Select.tsx` | Unit dropdown (searchable). Props: `options: SelectOption[]`, `value`, `onChange`, `label`, `searchable` |
| `SearchInput` | `src/components/Input/SearchInput.tsx` | Optional search/filter on inventory table |
| `Card` | `src/components/Card/Card.tsx` | Form container, empty state container |
| `Badge` | `src/components/Badge/Badge.tsx` | "Low Stock" warning badge. Use `<Badge label={t('inventory.lowStock')} color="warning" />` |
| `Skeleton` | `src/components/Skeleton/Skeleton.tsx` | Loading state for table rows |
| `toast` | `src/stores/useUIStore.ts` | `toast.success(msg)` and `toast.error(msg, action)` for CRUD feedback |
| `useFirestoreCollection` | `src/hooks/useFirestoreCollection.ts` | Real-time Firestore subscription (signature below) |
| `formatCurrency` | `src/lib/currency.ts` | WAC/unit and Total Value column display. Always pass agora value + 'ILS' |

### `useFirestoreCollection` Hook Signature

```typescript
function useFirestoreCollection<T>(
  collectionName: string,
  schema: ZodSchema<T>,
  callbacks: {
    onData: (data: T[]) => void;
    onError: (error: string) => void;
    onLoading: (loading: boolean) => void;
  }
)
```

Handles: real-time `onSnapshot`, Zod validation, Firestore `Timestamp → Date` conversion, adds `id` from document ID, cleanup on unmount.

### Critical Import Patterns

```typescript
// Types + schemas
import type { InventoryItem } from '@/types';
import { inventoryItemSchema, createInventoryItemSchema, type CreateInventoryItemInput } from '@/types';

// Store
import { useInventoryStore, selectByName, selectLowStock } from '@/stores';

// Hooks
import { useFirestoreCollection } from '@/hooks';

// Services
import { db } from '@/services';

// Firestore operations — CORRECT modular imports
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';

// Currency
import { formatCurrency, toMinorUnits } from '@/lib';

// Forms
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

// Components
import { Button, Card, Badge, Input, Select, Skeleton } from '@/components';

// Icons (Phosphor only — no emojis in code)
import { Package, Plus, PencilSimple, ArrowUp, ArrowDown, WarningCircle } from '@phosphor-icons/react';

// Toast
import { toast } from '@/stores/useUIStore';

// i18n
import { useTranslation } from 'react-i18next';
```

### Zustand Store Pattern (Follow Exactly)

```typescript
import { create } from 'zustand';
import type { InventoryItem } from '@/types';

interface InventoryStore {
  inventory: InventoryItem[];
  loading: boolean;
  error: string | null;
  setInventory: (items: InventoryItem[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useInventoryStore = create<InventoryStore>((set) => ({
  inventory: [],
  loading: true,
  error: null,
  setInventory: (inventory) => set({ inventory, loading: false, error: null }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error, loading: false }),
}));

// Selectors (OUTSIDE store per architecture pattern)
export const selectByName = (query: string) => (state: InventoryStore) =>
  state.inventory.filter((item) =>
    item.name.toLowerCase().includes(query.toLowerCase())
  );

export const selectLowStock = (state: InventoryStore) =>
  state.inventory.filter(
    (item) => item.reorderThreshold != null && item.currentQty <= item.reorderThreshold
  );
```

### `useInventory` Hook Pattern (Follow `useWorkOrders` Exactly)

```typescript
import { useFirestoreCollection } from '@/hooks';
import { useInventoryStore } from '@/stores';
import { inventoryItemSchema } from '@/types';

export function useInventory() {
  const { setInventory, setLoading, setError } = useInventoryStore();

  useFirestoreCollection('inventory', inventoryItemSchema, {
    onData: setInventory,
    onError: setError,
    onLoading: setLoading,
  });

  return useInventoryStore();
}
```

### Zod Schema Pattern (Zod v4 — Important)

```typescript
import { z } from 'zod';

export const inventoryItemSchema = z.object({
  id: z.string(),
  name: z.string().min(1, { error: 'Name is required' }),
  sku: z.string().nullable().default(null),
  supplier: z.string().nullable().default(null),
  currentQty: z.number().min(0).default(0),
  wacAgora: z.number().int().default(0),
  reorderThreshold: z.number().nullable().default(null),
  unit: z.string().min(1, { error: 'Unit is required' }),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type InventoryItem = z.infer<typeof inventoryItemSchema>;

// Form input schema — no id, computed costs, timestamps
// No .default() — form provides defaults via defaultValues to avoid Zod 4 input/output type divergence
export const createInventoryItemSchema = z.object({
  name: z.string().min(1, { error: 'Name is required' }),
  sku: z.string().nullable(),
  supplier: z.string().nullable(),
  unit: z.string().min(1, { error: 'Unit is required' }),
  initialQty: z.number().min(0),
  initialCostPerUnitAgora: z.number().int().nullable(),
  reorderThreshold: z.number().nullable(),
});

export type CreateInventoryItemInput = z.infer<typeof createInventoryItemSchema>;
```

**Zod v4 Notes:**
- Use `{ error: "message" }` instead of `{ message: "message" }` for error customization
- Use `z.string().nullable().default(null)` for optional string fields stored as null in Firestore
- Follow existing `workOrderSchema` pattern in `src/types/workOrder.ts` for consistency

### Shared Table Component Design

Build `src/components/Table/Table.tsx` as a generic, reusable data table:

```typescript
// Table.tsx
interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render: (item: T) => React.ReactNode;
  hideOnMobile?: boolean;  // Hide below 768px
  align?: 'start' | 'end' | 'center';
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  onRowClick?: (item: T) => void;
  emptyState?: React.ReactNode;
  loading?: boolean;
  className?: string;
}
```

**Table Styling Requirements:**
- Sticky header: `position: sticky; top: 0; background: $bg-elevated; z-index: 1`
- Header text: `$text-sm`, `$font-semibold`, `$text-secondary`, uppercase, `0.05em` letter-spacing
- Body text: `$text-sm`, `$text-primary`
- No shadows on table — use `1px solid $border-subtle` border
- Row hover: `background: $bg-secondary`
- Row height: minimum 44px for touch targets
- Cell padding: `$space-sm` (dense/data mode)
- `border-radius: $radius-md` on table wrapper
- Use CSS logical properties (`padding-inline-start`, `text-align: start`) for RTL

**SortableHeader Component:**

```typescript
interface SortableHeaderProps {
  label: string;
  sortKey: string;
  currentSortKey?: string;
  sortDirection?: 'asc' | 'desc';
  onSort: (key: string) => void;
}
```

Uses Phosphor `ArrowUp` / `ArrowDown` icons for sort direction indicator.

### InventoryForm Design

Follow `WorkOrderForm` pattern exactly:
- React Hook Form with `zodResolver(createInventoryItemSchema)`
- Use `<Input>` for text/number fields, `<Select>` for Unit dropdown
- Default unit options: "sheets", "kg", "units", "meters", "liters", "pieces" (i18n keys)
- Currency field for Initial Cost per Unit: convert display value to agora via `toMinorUnits()` on submit
- Edit mode: omit `initialQty` and `initialCostPerUnitAgora` fields (WAC/qty are immutable)
- Create mode: show all fields

### Firestore CRUD Operations

```typescript
// CREATE inventory item
const docRef = await addDoc(collection(db, 'inventory'), {
  name: data.name,
  sku: data.sku || null,
  supplier: data.supplier || null,
  unit: data.unit,
  currentQty: data.initialQty ?? 0,
  wacAgora: data.initialCostPerUnitAgora ?? 0,
  reorderThreshold: data.reorderThreshold ?? null,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
});

// UPDATE inventory item (metadata only)
await updateDoc(doc(db, 'inventory', itemId), {
  name: data.name,
  sku: data.sku || null,
  supplier: data.supplier || null,
  unit: data.unit,
  reorderThreshold: data.reorderThreshold ?? null,
  updatedAt: serverTimestamp(),
});
```

**Do NOT update `currentQty` or `wacAgora` in edit — only through restocks/scoops.**

### InventoryPage Layout

```
┌─────────────────────────────────────────────────┐
│ [Package icon] Inventory        [+ Add Material] │
├─────────────────────────────────────────────────┤
│ [SearchInput: Filter materials...]               │
├─────────────────────────────────────────────────┤
│ Name↕ | SKU | Supplier | Qty↕ | WAC/Unit | ...  │
│───────────────────────────────────────────────── │
│ ▌Fabric A  | FAB-001 | TextileCo | 50 | ₪12.00  │
│ ▌Cardboard | CBR-002 | PaperInc  | 5  | ₪3.50   │  ← orange border (low stock)
│  ...                                             │
└─────────────────────────────────────────────────┘

Empty State:
┌─────────────────────────────────────────────────┐
│        [Package icon, 48px, muted]               │
│        "Add your first material"                 │
│        [+ Add Material] (primary button)         │
└─────────────────────────────────────────────────┘
```

### SCSS Styling Notes

- Global SCSS partials (`_variables.scss`, `_mixins.scss`) are auto-imported via Vite `additionalData`
- Use `@use '@/styles/variables' as *` and `@use '@/styles/mixins' as *` ONLY if the auto-import isn't sufficient (check existing modules)
- Existing modules (e.g., WorkOrderForm) do NOT include explicit `@use` — rely on Vite auto-import
- Use CSS logical properties: `padding-inline-start` not `padding-left`, `margin-block-end` not `margin-bottom`
- Never use `#fff` / white text — all text uses gold scale tokens
- Use `$error` not `$danger` (confirmed non-existent) for red/destructive colors

### Low Stock Indicator Design

```scss
.lowStockRow {
  border-inline-start: 3px solid $warning;  // Orange left border (RTL-safe)
}
```

Use `<Badge label={t('inventory.lowStock')} color="warning" />` next to the quantity.

### Mobile Responsive Strategy

```scss
// Hide non-essential columns on mobile
.hideOnMobile {
  @media (max-width: #{$bp-md - 1px}) {
    display: none;
  }
}
```

Mobile visible columns: Name, Current Qty, WAC/Unit
Hidden on mobile: SKU, Supplier, Total Value, Reorder Threshold
Rows must be >= 44px height for touch targets.

### i18n Keys to Add

**English (`en.json`) — under `inventory` key:**
```json
{
  "inventory": {
    "title": "Inventory",
    "addMaterial": "Add Material",
    "editMaterial": "Edit Material",
    "emptyState": "Add your first material",
    "emptyStateHint": "Track your shared materials, stock levels, and costs",
    "lowStock": "Low Stock",
    "searchPlaceholder": "Filter materials...",
    "columns": {
      "name": "Name",
      "sku": "SKU",
      "supplier": "Supplier",
      "currentQty": "Qty",
      "wacPerUnit": "WAC/Unit",
      "totalValue": "Total Value",
      "reorderThreshold": "Reorder At",
      "unit": "Unit"
    },
    "form": {
      "name": "Material Name",
      "nameRequired": "Material name is required",
      "sku": "SKU (Optional)",
      "supplier": "Supplier (Optional)",
      "unit": "Unit of Measure",
      "unitRequired": "Unit is required",
      "initialQty": "Initial Quantity",
      "initialCostPerUnit": "Initial Cost per Unit (₪)",
      "reorderThreshold": "Reorder Threshold (Optional)",
      "create": "Add Material",
      "update": "Save Changes",
      "cancel": "Cancel"
    },
    "units": {
      "sheets": "Sheets",
      "kg": "Kg",
      "units": "Units",
      "meters": "Meters",
      "liters": "Liters",
      "pieces": "Pieces"
    },
    "toast": {
      "created": "Material added successfully",
      "updated": "Material updated",
      "createError": "Failed to add material",
      "updateError": "Failed to update material"
    }
  }
}
```

**Hebrew (`he.json`) — under `inventory` key:**
```json
{
  "inventory": {
    "title": "מלאי",
    "addMaterial": "הוספת חומר",
    "editMaterial": "עריכת חומר",
    "emptyState": "הוסף את החומר הראשון שלך",
    "emptyStateHint": "עקוב אחרי חומרים משותפים, רמות מלאי ועלויות",
    "lowStock": "מלאי נמוך",
    "searchPlaceholder": "סינון חומרים...",
    "columns": {
      "name": "שם",
      "sku": "מק״ט",
      "supplier": "ספק",
      "currentQty": "כמות",
      "wacPerUnit": "עלות/יחידה",
      "totalValue": "ערך כולל",
      "reorderThreshold": "סף הזמנה",
      "unit": "יחידה"
    },
    "form": {
      "name": "שם החומר",
      "nameRequired": "שם חומר נדרש",
      "sku": "מק״ט (אופציונלי)",
      "supplier": "ספק (אופציונלי)",
      "unit": "יחידת מידה",
      "unitRequired": "יחידה נדרשת",
      "initialQty": "כמות התחלתית",
      "initialCostPerUnit": "עלות ליחידה (₪)",
      "reorderThreshold": "סף הזמנה מחדש (אופציונלי)",
      "create": "הוספת חומר",
      "update": "שמירת שינויים",
      "cancel": "ביטול"
    },
    "units": {
      "sheets": "גיליונות",
      "kg": "ק״ג",
      "units": "יחידות",
      "meters": "מטרים",
      "liters": "ליטרים",
      "pieces": "חלקים"
    },
    "toast": {
      "created": "החומר נוסף בהצלחה",
      "updated": "החומר עודכן",
      "createError": "הוספת חומר נכשלה",
      "updateError": "עדכון חומר נכשל"
    }
  }
}
```

### Testing Patterns

Follow existing project conventions:
- **Framework**: Vitest + React Testing Library
- **Co-located**: `*.test.tsx` next to `*.tsx` (e.g., `InventoryTable.test.tsx` next to `InventoryTable.tsx`)
- **Mock Firestore**: Mock `firebase/firestore` — `addDoc`, `updateDoc`, `doc`, `collection`, `serverTimestamp`
- **Mock i18n**: Mock `react-i18next` with `useTranslation` returning passthrough `t` function
- **Mock toast**: Mock `@/stores/useUIStore` toast functions
- **Mock hooks**: Mock `useFirestoreCollection` for component tests

**Test focus areas:**
- Schema validates correctly for valid and invalid data
- Store selectors filter correctly (`selectByName`, `selectLowStock`)
- Table renders all columns with correct data
- Low stock badge appears for items at/below reorder threshold
- Empty state renders when no items
- Form validates required fields (name, unit)
- Form submit calls `addDoc` with correct Firestore payload
- Edit form pre-fills correctly and omits qty/WAC fields
- Mobile: hidden columns not rendered below 768px
- Sort toggling works on sortable columns

**Mock pattern:**
```typescript
vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual('firebase/firestore');
  return {
    ...actual,
    addDoc: vi.fn().mockResolvedValue({ id: 'new-item-id' }),
    updateDoc: vi.fn().mockResolvedValue(undefined),
    doc: vi.fn((_, collection, id) => ({ path: `${collection}/${id}` })),
    collection: vi.fn((_, name) => ({ path: name })),
    serverTimestamp: vi.fn(() => 'mock-server-timestamp'),
  };
});
```

### Previous Story Intelligence

Since this is the first story in Epic 6 (new epic), there is no direct previous story. However, from Epic 5 learnings:

1. **SCSS token**: `$danger` does NOT exist — always use `$error` for red/destructive colors.
2. **Zod v4**: Use `z.record(z.string(), z.any())` instead of `z.record(z.unknown())` if needed.
3. **Firestore writes**: `addDoc` for creates, `updateDoc` for edits. Use `serverTimestamp()` for timestamps.
4. **Toast patterns**: `toast.success(message)` and `toast.error(message)` from `@/stores/useUIStore`.
5. **Test mock patterns**: Mock Firebase at the module level with `vi.mock()`.
6. **SCSS auto-import**: Global variables and mixins are auto-imported. Check existing module files — they do NOT include explicit `@use` statements.
7. **Form patterns**: Follow `WorkOrderForm` exactly — `useForm` + `zodResolver` + `Controller` for Select + `handleSubmit`.
8. **Real-time listeners**: `useFirestoreCollection` handles everything — just pass collection name, schema, and callbacks.
9. **Store pattern**: One store per domain. Selectors defined OUTSIDE the store. No business logic in stores.

### Git Intelligence (Recent Commits)

```
cf96f04 Implement Story 5.5: Batch Approval (Approve All) & Mobile Review with code review fixes
ecce50e Implement Story 5.4: Post-Approval Side Effects & Real-Time Updates with code review fixes
13d8da0 Implement Story 5.3: Ghost Text Field Editing & Rejection with code review fixes
45b651b Implement Story 5.2: Ghost Text Card Core Confirmation Flow with code review fixes
ac5fc7d Fix SCSS error: use $error token instead of undefined $danger
```

Key patterns:
- Each story → single commit with review fixes
- SCSS bug confirmed: never use `$danger`, always use `$error`
- Tests co-located, all passing before commit
- `tsc --noEmit` zero errors before commit

### Project Structure Notes

**New files to create:**
```
src/types/inventory.ts                              # Replace placeholder (InventoryItem + schemas)
src/types/inventory.test.ts                         # Schema validation tests
src/stores/useInventoryStore.ts                     # Replace placeholder (Zustand store + selectors)
src/components/Table/Table.tsx                      # Shared reusable data table
src/components/Table/Table.module.scss              # Table styles
src/components/Table/SortableHeader.tsx             # Sortable column header
src/components/Table/SortableHeader.module.scss     # SortableHeader styles (if needed)
src/components/Table/Table.test.tsx                 # Table component tests
src/features/inventory/hooks/useInventory.ts        # Firestore real-time hook
src/features/inventory/components/InventoryTable.tsx        # Inventory data table
src/features/inventory/components/InventoryTable.module.scss
src/features/inventory/components/InventoryTable.test.tsx
src/features/inventory/components/InventoryForm.tsx          # Add/Edit material form
src/features/inventory/components/InventoryForm.module.scss
src/features/inventory/components/InventoryForm.test.tsx
```

**Files to modify:**
```
src/features/inventory/InventoryPage.tsx             # Replace placeholder with full implementation
src/features/inventory/InventoryPage.module.scss     # Replace placeholder styles
src/features/inventory/InventoryPage.test.tsx        # Update tests for full implementation
src/features/inventory/components/index.ts           # Export InventoryTable, InventoryForm
src/features/inventory/hooks/index.ts                # Export useInventory
src/components/Table/index.ts                        # Export Table, SortableHeader
src/i18n/en.json                                     # Add inventory.* keys
src/i18n/he.json                                     # Add inventory.* keys (Hebrew)
```

**Files that already exist and should NOT be modified (unless barrel exports need updating):**
```
src/components/Button/Button.tsx                     # Use as-is
src/components/Input/Input.tsx                       # Use as-is
src/components/Input/Select.tsx                      # Use as-is for unit dropdown
src/components/Card/Card.tsx                         # Use as-is for form/empty state container
src/components/Badge/Badge.tsx                       # Use as-is for "Low Stock" badge
src/components/Skeleton/Skeleton.tsx                 # Use as-is for loading states
src/stores/useUIStore.ts                             # Use toast API as-is
src/hooks/useFirestoreCollection.ts                  # Use as-is for Firestore subscriptions
src/lib/currency.ts                                  # Use formatCurrency, toMinorUnits as-is
src/services/firebase.ts                             # Use db export as-is
src/router.tsx                                       # /inventory route already exists
```

### Scope Boundaries

**IN scope:**
- InventoryItem type + Zod schemas + tests
- Zustand store + selectors
- Shared Table + SortableHeader components (new shared components)
- useInventory Firestore hook
- InventoryTable (sortable, responsive, low stock indicators)
- InventoryForm (create + edit modes via React Hook Form)
- InventoryPage (full replacement of placeholder)
- Empty state
- i18n keys (EN + HE)
- Co-located tests for all new components

**OUT of scope (do NOT implement):**
- Restock functionality (Story 6.2)
- WAC recalculation logic (Story 6.2)
- Scoop/consume actions (Story 6.3)
- Audit log display (Story 6.4)
- Waste tracking (Story 6.4)
- `src/lib/wac.ts` implementation (Story 6.2)
- `functions/src/triggers/verifyWAC.ts` Cloud Function (Story 6.2)
- `inventory_log` Firestore collection (Story 6.4)
- RestockForm component (Story 6.2)
- AuditLog component (Story 6.4)
- ScoopModal component (Story 6.3)
- Firestore security rules changes
- Delete inventory item functionality (not in any AC)

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Epic 6, Story 6.1]
- [Source: _bmad-output/planning-artifacts/architecture.md — Firestore Collections (inventory), Feature Module Structure, Naming Conventions, Zustand Store Pattern, Data Flow Pattern, Testing Standards]
- [Source: _bmad-output/planning-artifacts/prd.md — FR32 (inventory CRUD), FR35 (over-draft prevention), FR36 (audit log)]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — Table Patterns (sticky header, sortable, dense), Empty States ("Add your first material"), Responsive Strategy (mobile column hiding), Badge Patterns (warning color), Button Hierarchy, Toast Patterns]
- [Source: src/types/workOrder.ts — Zod schema pattern with .default() and type inference]
- [Source: src/stores/useWorkOrderStore.ts — Zustand store pattern with external selectors]
- [Source: src/features/work-orders/hooks/useWorkOrders.ts — useFirestoreCollection hook wiring pattern]
- [Source: src/features/work-orders/components/WorkOrderForm.tsx — React Hook Form + zodResolver + Controller pattern]
- [Source: src/hooks/useFirestoreCollection.ts — Generic real-time listener with Zod validation]
- [Source: src/lib/currency.ts — formatCurrency, toMinorUnits utility functions]
- [Source: src/styles/_variables.scss — All design tokens: colors, spacing, typography, shadows, breakpoints]
- [Source: src/components/Badge/Badge.tsx — Badge component with color prop ('warning' for Low Stock)]

## Dev Agent Record

### Agent Model Used

Claude claude-4.6-opus (Cursor)

### Debug Log References

No blocking issues encountered during implementation.

### Completion Notes List

- **Task 1**: Implemented `inventoryItemSchema` and `createInventoryItemSchema` with full Zod v4 validation. 16 unit tests covering valid items, defaults, required fields, type constraints (int for wacAgora, min 0 for currentQty).
- **Task 2**: Created `useInventoryStore` Zustand store with `setInventory`, `setLoading`, `setError` actions. External selectors `selectByName` (fuzzy case-insensitive) and `selectLowStock` (qty <= threshold, null threshold excluded). 10 unit tests.
- **Task 3**: Built generic reusable `Table<T>` component with `Column` interface, loading skeletons, empty state, sortable headers, keyboard-accessible clickable rows, RTL-safe CSS logical properties, mobile column hiding. `SortableHeader` with Phosphor ArrowUp/ArrowDown icons. 10 unit tests.
- **Task 4**: Created `useInventory` hook following `useWorkOrders` pattern exactly — subscribes to `inventory` collection via `useFirestoreCollection`, syncs to `useInventoryStore`.
- **Task 5**: Built `InventoryTable` with all 7 columns (Name, SKU, Supplier, Qty, WAC/Unit, Total Value, Reorder At). Sortable columns with in-component state management. Low stock badge (orange border + warning Badge) for items at/below threshold. Mobile responsive (hides SKU, Supplier, Total Value, Reorder At < 768px). 10 unit tests.
- **Task 6**: Built `InventoryForm` with React Hook Form + zodResolver. Create mode shows all fields including initial qty and cost. Edit mode hides qty/WAC fields (immutable). Searchable unit Select dropdown. 8 unit tests covering both modes, validation, and cancel.
- **Task 7**: Replaced placeholder `InventoryPage` with full implementation. FormMode state machine (closed/create/edit). Firestore CRUD with `addDoc`/`updateDoc`. Toast notifications. Error state display. Empty state with Package icon and CTA. 10 unit tests.
- **Task 8**: Added all `inventory.*` i18n keys to both `en.json` and `he.json` — title, form labels, column headers, unit names, toast messages, empty state.
- **Task 9**: Updated all barrel exports: `components/index.ts`, `hooks/index.ts`, `Table/index.ts`. Verified feature and types barrel exports already correct.

### Change Log

- 2026-02-13: Implemented Story 6.1 — Inventory Data Model & Item Management. Created InventoryItem types/schemas, Zustand store with selectors, shared Table component, Firestore real-time hook, InventoryTable, InventoryForm, full InventoryPage replacement, i18n keys (EN+HE), barrel exports. All 862 tests pass, zero TypeScript errors.
- 2026-02-13: Code review completed (Claude claude-4.6-opus). Fixed 5 issues:
  - HIGH: Currency conversion — renamed `initialCostPerUnitAgora` to `initialCostPerUnit`, removed `.int()`, added `toMinorUnits()` conversion in InventoryPage submit handler
  - HIGH: Form NaN handling — replaced `valueAsNumber: true` with `setValueAs` transforms for number fields to properly handle empty/cleared inputs
  - MEDIUM: Removed duplicate `helperText` on cost field and added `step="0.01"` for decimal ILS input
  - MEDIUM: Removed stale `pages.inventory` placeholder keys from en.json and he.json
  - MEDIUM: Added `keyExtractor` prop to Table component, InventoryTable passes `(item) => item.id` for stable row keys
  All 863 tests pass, zero TypeScript errors.

### File List

**New files:**
- `src/types/inventory.ts` — InventoryItem + CreateInventoryItemInput schemas
- `src/types/inventory.test.ts` — Schema validation tests (16 tests)
- `src/stores/useInventoryStore.ts` — Zustand store + selectors
- `src/stores/useInventoryStore.test.ts` — Store tests (10 tests)
- `src/components/Table/Table.tsx` — Generic reusable data table
- `src/components/Table/Table.module.scss` — Table + SortableHeader styles
- `src/components/Table/SortableHeader.tsx` — Sortable column header
- `src/components/Table/Table.test.tsx` — Table component tests (10 tests)
- `src/features/inventory/hooks/useInventory.ts` — Firestore real-time hook
- `src/features/inventory/components/InventoryTable.tsx` — Inventory data table
- `src/features/inventory/components/InventoryTable.module.scss` — InventoryTable styles
- `src/features/inventory/components/InventoryTable.test.tsx` — InventoryTable tests (10 tests)
- `src/features/inventory/components/InventoryForm.tsx` — Add/Edit material form
- `src/features/inventory/components/InventoryForm.module.scss` — InventoryForm styles
- `src/features/inventory/components/InventoryForm.test.tsx` — InventoryForm tests (8 tests)

**Modified files:**
- `src/features/inventory/InventoryPage.tsx` — Replaced placeholder with full implementation
- `src/features/inventory/InventoryPage.module.scss` — Replaced placeholder styles
- `src/features/inventory/InventoryPage.test.tsx` — Updated tests (10 tests)
- `src/features/inventory/components/index.ts` — Export InventoryTable, InventoryForm
- `src/features/inventory/hooks/index.ts` — Export useInventory
- `src/components/Table/index.ts` — Export Table, SortableHeader
- `src/i18n/en.json` — Added inventory.* keys
- `src/i18n/he.json` — Added inventory.* keys (Hebrew)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — Status updates
