# Story 6.3: Scoop Action — Consume Inventory into Work Orders

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As **Gal**,
I want to consume materials from inventory into a Work Order and see the cost automatically calculated,
so that Nutrition Labels reflect accurate inventory-based COGS for each project.

## Acceptance Criteria

1. **Given** a Work Order detail page or Inventory page, **When** Gal initiates a Scoop action, **Then** a Scoop modal opens with: searchable material selector (fuzzy search by name), Quantity to consume (number input), Available Stock display (current qty — updates as user types), Calculated Cost display (quantity × WAC, formatted via `formatCurrency`, updates in real-time as quantity changes), Work Order selector (searchable dropdown, pre-selected if initiated from a WO detail page).

2. **Given** the Scoop modal, **When** Gal enters a quantity that exceeds available stock, **Then** the quantity field shows a red error: "Only X available" **And** the Confirm button is disabled (FR35 — over-draft prevention) **And** the Available Stock display turns red.

3. **Given** valid Scoop inputs, **When** Gal confirms the Scoop, **Then** the inventory item's `currentQty` decreases by the scoop quantity **And** the linked Work Order's `inventoryCostAgora` increases by (scoop qty × current WAC) **And** the Nutrition Label for that Work Order updates in real-time (Inventory Costs line reflects new total) **And** a success toast confirms: "Scooped X units of [material] → [Work Order name]".

4. **Given** a Scoop is completed, **When** the inventory_log is updated, **Then** a new document is created with: `itemId`, `action: 'consume'`, `qtyChange` (negative), `costSnapshotAgora` (scoop qty × WAC at time of scoop), `wacBeforeAgora`, `wacAfterAgora` (same — WAC unchanged on consume), `workOrderRef`, `timestamp`, `actorUid`.

5. **Given** the Scoop calculation, **When** performed client-side, **Then** cost calculation (qty × WAC) completes in < 500ms (NFR5) **And** the result uses integer arithmetic (agora) with no floating-point drift.

6. **Given** the Scoop modal on mobile, **When** rendered on a small viewport, **Then** the modal is full-screen with stacked fields **And** the material search is touch-friendly **And** the Confirm button is full-width at the bottom **And** all controls are ≥ 44px touch targets.

## Tasks / Subtasks

- [x] Task 1: Create Scoop input schema & types (AC: #1, #2)
  - [x] 1.1 Add `scoopInputSchema` + `ScoopInput` type to `src/types/inventory.ts`
  - [x] 1.2 Add schema validation tests to `src/types/inventory.test.ts`
- [x] Task 2: Build ScoopModal component (AC: #1, #2, #5, #6)
  - [x] 2.1 Create `src/features/work-orders/components/ScoopModal.tsx`
  - [x] 2.2 Create `src/features/work-orders/components/ScoopModal.module.scss`
  - [x] 2.3 Create `src/features/work-orders/components/ScoopModal.test.tsx`
- [x] Task 3: Integrate Scoop into WorkOrderDetailPage (AC: #1, #3, #4)
  - [x] 3.1 Add Scoop button + ScoopModal to `WorkOrderDetailPage.tsx`
  - [x] 3.2 Implement `handleScoop` using `writeBatch` (inventory update + WO update + inventory_log)
  - [x] 3.3 Update `WorkOrderDetailPage` tests
- [x] Task 4: Integrate Scoop into InventoryPage (AC: #1, #3, #4)
  - [x] 4.1 Add `scoop` FormMode to `InventoryPage.tsx`
  - [x] 4.2 Implement `handleScoop` using same batch pattern
  - [x] 4.3 Add "Scoop" action button to `InventoryTable.tsx`
  - [x] 4.4 Update InventoryPage + InventoryTable tests
- [x] Task 5: Update NutritionLabel to show Scoop breakdown (AC: #3)
  - [x] 5.1 Pass scoop log entries to NutritionLabel (via inventory_log query or prop)
  - [x] 5.2 Display scoop entries in expanded Inventory Costs section
  - [x] 5.3 Update NutritionLabel tests
- [x] Task 6: Add i18n keys & update barrel exports (AC: #1, #3)
  - [x] 6.1 Add `inventory.scoop.*` keys to `en.json` and `he.json`
  - [x] 6.2 Update work-orders components barrel export for ScoopModal

## Dev Notes

### Scoop Cost Calculation — CRITICAL Implementation Details

**The `applyScoopCost` stub already exists in `src/lib/wac.ts`:**
```typescript
// EXISTING — already implemented in Story 6.2:
export function applyScoopCost(qty: number, wacAgora: number): number {
  return qty * wacAgora;
}
```
DO NOT recreate or modify this function. Import it directly: `import { applyScoopCost } from '@/lib/wac';`

**Key rule: WAC does NOT change on a consume/scoop.** WAC only changes on restock. The `verifyWAC` Cloud Function (Story 6.2) already handles this — its `replayWAC` function treats `consume` and `waste` actions as quantity-only changes: `qty += entry.qtyChange` (negative) without recalculating WAC. So `wacBeforeAgora === wacAfterAgora` for every scoop log entry.

**Over-draft prevention (FR35):** Client-side validation ONLY. Check `quantity <= item.currentQty` in the form schema via a Zod `.refine()`. The Confirm button must be disabled when `quantity > available`. There is no server-side guard on inventory overdraft (2-user system, race conditions negligible per architecture).

### ScoopInput Schema

**Add to `src/types/inventory.ts`:**
```typescript
// --- Scoop Form Input (Story 6.3) ---
// No .default() — form provides defaults via defaultValues
// quantity validated against available stock in component (via superRefine or UI-level)

export const scoopInputSchema = z.object({
  itemId: z.string().min(1, { error: 'Material is required' }),
  quantity: z.number().positive({ error: 'Quantity must be greater than 0' }),
  workOrderId: z.string().min(1, { error: 'Work Order is required' }),
});

export type ScoopInput = z.infer<typeof scoopInputSchema>;
```

**CRITICAL:** Over-draft validation is NOT in the Zod schema. The schema validates shape only. The quantity-vs-stock check happens in the component via inline error logic (the form watches `quantity` and compares to the selected item's `currentQty`). This follows the same pattern as RestockForm where amount validation is structural (> 0) and business rules are UI-level.

### ScoopModal Component

**Location:** `src/features/work-orders/components/ScoopModal.tsx` — lives in work-orders feature because the Scoop is conceptually about assigning cost to a Work Order.

**Props interface:**
```typescript
interface ScoopModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ScoopInput) => Promise<void>;
  inventoryItems: InventoryItem[];   // from useInventory hook
  workOrders: WorkOrder[];           // from useWorkOrders hook
  preselectedWorkOrderId?: string;   // when initiated from WO detail page
  preselectedItemId?: string;        // when initiated from Inventory page row action
}
```

**Form fields:**
- Material: `Select` component (searchable, fuzzy), pre-selected if `preselectedItemId` provided
- Quantity: `Input` type="number", required, > 0
- Available Stock: computed display `selectedItem.currentQty - quantity` — shows remaining after scoop. Turns red + shows error "Only X available" when `quantity > selectedItem.currentQty`
- Calculated Cost: computed display `applyScoopCost(quantity, selectedItem.wacAgora)` formatted via `formatCurrency` — updates in real-time as quantity changes
- Work Order: `Select` component (searchable), pre-selected if `preselectedWorkOrderId` provided. Filter to active work orders only (status !== 'Shipped' ideally, or show all — verify with UX)

**Form approach:**
```typescript
const { register, handleSubmit, control, watch, formState: { errors, isSubmitting } } = useForm<ScoopInput>({
  resolver: zodResolver(scoopInputSchema),
  defaultValues: {
    itemId: preselectedItemId ?? '',
    quantity: 0,
    workOrderId: preselectedWorkOrderId ?? '',
  },
});

const quantity = watch('quantity');
const itemId = watch('itemId');
const selectedItem = inventoryItems.find(i => i.id === itemId);
const isOverdraft = selectedItem != null && quantity > selectedItem.currentQty;
const scoopCost = selectedItem && quantity > 0
  ? applyScoopCost(quantity, selectedItem.wacAgora)
  : 0;
```

**CRITICAL UI rules:**
- Confirm button disabled when: `isSubmitting || isOverdraft || !selectedItem || quantity <= 0`
- Available stock display: `selectedItem.currentQty` with a parenthetical `(${selectedItem.currentQty - quantity} after scoop)` — red when overdraft
- Use `setValueAs: toNumberOrZero` for the quantity field (same pattern as RestockForm — prevents NaN on empty inputs, Story 6.1 code review fix #2)
- Modal overlay: use same approach as Ghost Text review — center card with background overlay. NOT a full page takeover on desktop (per UX spec: "ScoopModal" in architecture)
- Mobile (< 768px): modal becomes full-screen with stacked fields, full-width Confirm button at bottom

**Modal overlay pattern — build from scratch using design system tokens:**
```scss
.overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(18, 0, 34, 0.7); // $bg-primary at 70%
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal {
  @include card-surface;
  max-width: 480px;
  width: calc(100% - $space-lg * 2);
  max-height: 90vh;
  overflow-y: auto;
  padding: $space-lg;

  @media (max-width: 767px) {
    max-width: 100%;
    width: 100%;
    height: 100%;
    max-height: 100%;
    border-radius: 0;
  }
}
```

**Keyboard shortcuts:**
- `Escape` — close modal (call `onClose`)
- `Enter` — submit if valid (default form behavior)

### Firestore Batch Write on Scoop Submit

**THREE documents must update atomically via `writeBatch`:**

```typescript
import { writeBatch, doc, collection, serverTimestamp, increment } from 'firebase/firestore';
import { applyScoopCost } from '@/lib/wac';
import { db, auth } from '@/services';

const handleScoop = async (data: ScoopInput) => {
  const currentUid = auth.currentUser?.uid;
  if (!currentUid) {
    toast.error(t('inventory.scoop.error'));
    return;
  }

  const item = inventoryItems.find(i => i.id === data.itemId);
  const wo = workOrders.find(w => w.id === data.workOrderId);
  if (!item || !wo) return;

  const costAgora = applyScoopCost(data.quantity, item.wacAgora);

  const batch = writeBatch(db);

  // 1. Decrease inventory quantity (WAC stays the same)
  batch.update(doc(db, 'inventory', item.id), {
    currentQty: item.currentQty - data.quantity,
    updatedAt: serverTimestamp(),
    // NOTE: wacAgora is NOT updated — WAC stays the same on consume
  });

  // 2. Increase Work Order's inventoryCostAgora
  batch.update(doc(db, 'work_orders', wo.id), {
    inventoryCostAgora: wo.inventoryCostAgora + costAgora,
    updatedAt: serverTimestamp(),
  });

  // 3. Create inventory_log entry
  const logRef = doc(collection(db, 'inventory_log'));
  batch.set(logRef, {
    itemId: item.id,
    action: 'consume',
    qtyChange: -data.quantity,              // NEGATIVE for consume
    costSnapshotAgora: costAgora,           // positive: total cost of this scoop
    wacBeforeAgora: item.wacAgora,
    wacAfterAgora: item.wacAgora,           // SAME — WAC doesn't change on consume
    workOrderRef: wo.id,
    reason: null,
    actorUid: currentUid,
    timestamp: serverTimestamp(),
  });

  await batch.commit();
  toast.success(t('inventory.scoop.success', {
    qty: data.quantity,
    material: item.name,
    workOrder: wo.clientName,
  }));
};
```

**CRITICAL — Use `writeBatch` for atomicity.** All three writes (inventory, work_order, inventory_log) must succeed or fail together. This prevents inventory/cost inconsistencies.

**CRITICAL — `qtyChange` is NEGATIVE for consume.** The `inventoryLogSchema` allows any number; the convention is positive for restock, negative for consume/waste. The `verifyWAC` Cloud Function already expects this (see Story 6.2 dev notes).

**CRITICAL — `wacAfterAgora === wacBeforeAgora` for consume.** WAC only changes on restock. The `verifyWAC` Cloud Function's `replayWAC` handles consume/waste by reducing qty without WAC recalculation.

### WorkOrderDetailPage Integration

**Add a "Scoop" button in the transactions section header, next to "Add Transaction":**
```typescript
import { ArrowBendDownRight } from '@phosphor-icons/react'; // Scoop icon per architecture icon mapping
import { ScoopModal } from './components';
import { useInventory } from '@/features/inventory/hooks/useInventory';
```

**IMPORTANT cross-feature import exception:** The ScoopModal lives in `work-orders/components/` but needs inventory data. Import `useInventory` from `@/features/inventory/hooks/useInventory` — this is a legitimate cross-feature hook import because the Scoop is a cross-domain operation. The architecture says "Features NEVER import from other features directly" — but this means component imports, not hook imports for shared data. The inventory hook subscribes to Firestore; no coupling to inventory feature internals.

**State additions in WorkOrderDetailPage:**
```typescript
const [showScoopModal, setShowScoopModal] = useState(false);
const { inventory } = useInventory();
```

**Scoop button placement:** After the "Add Transaction" button, add:
```tsx
<Button size="sm" variant="secondary" onClick={() => setShowScoopModal(true)}>
  <ArrowBendDownRight size={18} weight="bold" />
  <span>{t('inventory.scoop.action')}</span>
</Button>
```

**ScoopModal usage:**
```tsx
{showScoopModal && (
  <ScoopModal
    open={showScoopModal}
    onClose={() => setShowScoopModal(false)}
    onSubmit={handleScoop}
    inventoryItems={inventory}
    workOrders={workOrders}
    preselectedWorkOrderId={id}
  />
)}
```

### InventoryPage Integration

**Add `scoop` to the FormMode union:**
```typescript
type FormMode =
  | { type: 'closed' }
  | { type: 'create' }
  | { type: 'edit'; item: InventoryItem }
  | { type: 'restock'; item?: InventoryItem }
  | { type: 'scoop'; item?: InventoryItem };
```

**Add a Scoop handler and wire it into `InventoryTable`:**
- Add `onScoop` prop to `InventoryTable` (same pattern as `onRestock`)
- Add a "Scoop" button column in InventoryTable (next to Restock button)
- Use `ArrowBendDownRight` icon for Scoop button
- The `handleScoopClick` sets `formMode: { type: 'scoop', item }`
- Need to load work orders: `import { useWorkOrders } from '@/features/work-orders/hooks';` — same cross-feature hook import pattern

**From InventoryPage, the ScoopModal has `preselectedItemId` but NO `preselectedWorkOrderId`.**

### InventoryTable — Add Scoop Action Button

**Add `onScoop` prop alongside `onRestock`:**
```typescript
interface InventoryTableProps {
  items: InventoryItem[];
  loading: boolean;
  onRowClick?: (item: InventoryItem) => void;
  onRestock?: (item: InventoryItem) => void;
  onScoop?: (item: InventoryItem) => void;   // NEW
  emptyState?: React.ReactNode;
}
```

Add the Scoop column after the Restock column:
```typescript
...(onScoop
  ? [{
      key: 'scoopAction' as const,
      header: '',
      align: 'end' as const,
      render: (item: InventoryItem) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation(); // prevent row click
            onScoop(item);
          }}
          aria-label={t('inventory.scoop.action')}
          disabled={item.currentQty <= 0} // can't scoop from empty stock
        >
          <ArrowBendDownRight size={16} /> {t('inventory.scoop.action')}
        </Button>
      ),
    }]
  : []),
```

### NutritionLabel — Scoop Breakdown in Inventory Costs Section

Currently, the NutritionLabel shows "No scoops" when the Inventory Costs section is expanded (line 141 in `NutritionLabel.tsx`). This needs to show actual scoop entries.

**Approach:** Add an `inventoryLogs` prop to NutritionLabel (scoop entries only):
```typescript
export interface NutritionLabelProps {
  workOrder: WorkOrder;
  transactions: Transaction[];
  inventoryLogs?: InventoryLogEntry[];  // NEW — scoop entries for this WO
  loading?: boolean;
}
```

**In WorkOrderDetailPage**, query inventory_log for this work order:
```typescript
import { useFirestoreCollection } from '@/hooks';
import type { InventoryLogEntry } from '@/types';
import { inventoryLogSchema } from '@/types';

// Inside the component:
const { data: inventoryLogs } = useFirestoreCollection<InventoryLogEntry>(
  'inventory_log',
  inventoryLogSchema,
  { where: [['workOrderRef', '==', id ?? '']] }
);
```

**IMPORTANT:** Check if `useFirestoreCollection` supports a `where` filter. If it does — use it. If not — query the full collection and filter client-side, OR add a minimal query param to the hook. The architecture says "Never access Firestore directly from components" — go through hooks. If `useFirestoreCollection` can't filter, the simplest approach is to load all inventory_log docs and filter: `inventoryLogs.filter(log => log.workOrderRef === id && log.action === 'consume')`.

**Replace the placeholder in NutritionLabel (currently line 141):**
```tsx
{expandedInventoryCosts && (
  <div className={styles.transactionList}>
    {scoopLogs.length > 0 ? (
      scoopLogs.map((log) => {
        const itemName = inventoryItemNames?.[log.itemId] ?? log.itemId;
        return (
          <div key={log.id} className={styles.transactionItem}>
            <span className={styles.transactionVendor}>{itemName}</span>
            <span className={styles.transactionDate}>
              {log.timestamp.toLocaleDateString(i18n.language)}
            </span>
            <span className={styles.transactionAmount}>
              {formatCurrency(log.costSnapshotAgora)}
            </span>
          </div>
        );
      })
    ) : (
      <div className={styles.placeholder}>{t('nutritionLabel.noScoops')}</div>
    )}
  </div>
)}
```

**Item name resolution:** The `inventoryLogs` contain `itemId` but not the item name. To display the material name, either:
- (Preferred) Pass an `inventoryItemNames: Record<string, string>` map prop — built from the inventory array: `Object.fromEntries(inventory.map(i => [i.id, i.name]))`
- (Alternative) Store the item name in the log entry at write time (denormalization) — but this is NOT in the schema and violates existing patterns. Don't do this.

### Project Structure Notes

**New files to create:**
```
src/features/work-orders/components/ScoopModal.tsx          # Scoop modal component
src/features/work-orders/components/ScoopModal.module.scss  # Scoop modal styles
src/features/work-orders/components/ScoopModal.test.tsx     # ScoopModal tests
```

**Files to modify:**
```
src/types/inventory.ts                               # Add ScoopInput, scoopInputSchema
src/types/inventory.test.ts                          # Add scoopInputSchema validation tests
src/features/work-orders/components/index.ts         # Export ScoopModal
src/features/work-orders/WorkOrderDetailPage.tsx     # Add Scoop button + ScoopModal + handleScoop
src/features/work-orders/WorkOrderDetailPage.test.tsx # Add scoop flow tests
src/features/work-orders/components/NutritionLabel.tsx # Replace placeholder with scoop entries
src/features/work-orders/components/NutritionLabel.test.tsx # Update with scoop data tests
src/features/inventory/InventoryPage.tsx              # Add scoop FormMode + handleScoop
src/features/inventory/InventoryPage.test.tsx         # Add scoop flow tests
src/features/inventory/components/InventoryTable.tsx  # Add onScoop prop + Scoop action button
src/features/inventory/components/InventoryTable.test.tsx # Add scoop button tests
src/i18n/en.json                                     # Add inventory.scoop.* keys
src/i18n/he.json                                     # Add inventory.scoop.* keys (Hebrew)
```

**Files that already exist and must NOT be recreated:**
| Component | Location | Reuse For |
|---|---|---|
| `Button` | `src/components/Button/Button.tsx` | Modal buttons, table action buttons |
| `Input` | `src/components/Input/Input.tsx` | Quantity field |
| `Select` | `src/components/Input/Select.tsx` | Material + Work Order searchable selectors |
| `Card` | `src/components/Card/Card.tsx` | Modal inner container |
| `toast` | `src/stores/useUIStore.ts` | Success/error notifications |
| `formatCurrency` | `src/lib/currency.ts` | Cost preview display |
| `applyScoopCost` | `src/lib/wac.ts` | Cost calculation — ALREADY EXISTS |
| `useInventory` | `src/features/inventory/hooks/useInventory.ts` | Load inventory items in WO detail |
| `useWorkOrders` | `src/features/work-orders/hooks/useWorkOrders.ts` | Load work orders in Inventory page |
| `useFirestoreCollection` | `src/hooks/useFirestoreCollection.ts` | Query inventory_log for NutritionLabel |
| `db` | `src/services/firebase.ts` | Firestore instance |
| `auth` | `src/services/firebase.ts` | Get current user UID for actorUid |
| `writeBatch` | `firebase/firestore` | Atomic batch write |

### Critical Import Patterns (from Story 6.1 + 6.2)

```typescript
// Types + schemas
import type { InventoryItem, InventoryLogEntry, WorkOrder, ScoopInput } from '@/types';
import { scoopInputSchema } from '@/types';

// WAC / Scoop cost
import { applyScoopCost } from '@/lib/wac';

// Currency
import { formatCurrency } from '@/lib/currency';

// Firestore
import { writeBatch, doc, collection, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/services';

// Forms
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

// Components
import { Button, Card, Input, Select } from '@/components';

// Icons (Phosphor only)
import { ArrowBendDownRight } from '@phosphor-icons/react';  // Scoop icon per architecture

// i18n
import { useTranslation } from 'react-i18next';

// Toast
import { toast } from '@/stores/useUIStore';
```

### Testing Patterns (from Story 6.1 + 6.2)

**Framework:** Vitest + React Testing Library
**Co-located:** `*.test.ts` / `*.test.tsx` next to source files
**SCSS auto-import:** Global variables/mixins auto-imported — no explicit `@use` statements

**Mock Firestore (same as Story 6.2):**
```typescript
vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual('firebase/firestore');
  return {
    ...actual,
    writeBatch: vi.fn(() => ({
      update: vi.fn(),
      set: vi.fn(),
      commit: vi.fn().mockResolvedValue(undefined),
    })),
    doc: vi.fn((_, collection, id) => ({ path: `${collection}/${id}` })),
    collection: vi.fn((_, name) => ({ path: name })),
    serverTimestamp: vi.fn(() => 'mock-server-timestamp'),
  };
});
```

**Mock WAC:**
```typescript
vi.mock('@/lib/wac', () => ({
  applyScoopCost: vi.fn((qty, wac) => qty * wac),  // real logic for predictable testing
  calculateWAC: vi.fn(() => 5000),
}));
```

**ScoopModal test scenarios:**
1. Renders all fields (material selector, quantity, work order selector, cost preview, available stock)
2. Pre-selects work order when `preselectedWorkOrderId` provided
3. Pre-selects material when `preselectedItemId` provided
4. Shows overdraft error when quantity exceeds available stock
5. Disables Confirm button on overdraft
6. Updates cost preview in real-time as quantity changes
7. Updates available stock display as quantity changes
8. Calls onSubmit with correct data on valid submission
9. Calls onClose when cancel clicked
10. Calls onClose on Escape key

### SCSS Patterns

- Use `$error` for red/destructive — `$danger` does NOT exist
- CSS logical properties for RTL (`margin-inline-start`, `padding-inline-end`)
- Touch targets ≥ 44px on mobile
- Follow `RestockForm.module.scss` patterns for form fields
- Modal overlay uses `$bg-primary` at 70% opacity
- No explicit `@use` statements — globals auto-imported
- On mobile (< 768px): full-screen modal (no border-radius, 100% width/height)

### i18n Keys to Add

**English (`en.json`):**
```json
"scoop": {
  "title": "Scoop — Consume Inventory",
  "action": "Scoop",
  "material": "Material",
  "materialRequired": "Material is required",
  "quantity": "Quantity to Consume",
  "quantityError": "Quantity must be greater than 0",
  "overdraftError": "Only {{available}} available",
  "workOrder": "Work Order",
  "workOrderRequired": "Work Order is required",
  "availableStock": "Available Stock",
  "remainingAfter": "{{remaining}} remaining after scoop",
  "calculatedCost": "Calculated Cost",
  "submit": "Confirm Scoop",
  "cancel": "Cancel",
  "success": "Scooped {{qty}} units of {{material}} → {{workOrder}}",
  "error": "Failed to record scoop"
}
```

**Hebrew (`he.json`):** Provide Hebrew translations following the same key structure. Use the pattern from existing `inventory.restock.*` translations.

### Cross-Epic Context

- **Epic 2 (Story 2.4):** NutritionLabel currently shows `Inventory Costs / Scoops` at ₪0 with "No scoops yet" placeholder. THIS story replaces that placeholder with real scoop data.
- **Epic 5 (Story 5.4):** `onTransactionApproved` handles `InventoryRestock` category transactions from the AI email pipeline. Those are restocks, NOT scoops. Scoops are manual-only.
- **Story 6.2:** The `verifyWAC` Cloud Function already handles `consume` action type in its `replayWAC` — no changes needed to Cloud Functions.
- **Story 6.4:** The Audit Log will consume `inventory_log` entries created here. The `consume` action with `workOrderRef` is already part of the schema. No forward-compatibility changes needed.

### Zod v4 Reminders

- Use `{ error: "message" }` NOT `{ message: "message" }` for custom error strings
- Use `z.string().nullable().default(null)` for optional fields stored as null in Firestore
- No `.default()` on form schemas — form provides defaults via `defaultValues` to avoid Zod 4 input/output type divergence

### Performance Requirement

- Scoop cost calculation (qty × WAC) must complete < 500ms client-side (NFR5)
- `applyScoopCost` is a single multiplication — trivially fast
- The batch write to Firestore will take network time but the UI should respond optimistically via toast

### Auth Guard

- Same pattern as Story 6.2 handleRestock: check `auth.currentUser?.uid` exists before proceeding
- If no authenticated user, show error toast and return early
- Prevents empty `actorUid` in inventory_log

### References

- [Source: epics.md — Epic 6, Story 6.3: Scoop Action — Consume Inventory into Work Orders]
- [Source: architecture.md — Data Architecture: WAC Calculation, inventory_log collection]
- [Source: architecture.md — Cloud Functions: verifyWAC trigger (already handles consume action)]
- [Source: architecture.md — lib/wac.ts: applyScoopCost (already implemented)]
- [Source: architecture.md — Naming: Integer currency fields suffix with Agora]
- [Source: architecture.md — Non-Functional Requirements: Scoop calc < 500ms]
- [Source: architecture.md — Project Structure: ScoopModal in work-orders/components/]
- [Source: ux-design-specification.md — The Scoop Micro-Interaction design challenge]
- [Source: ux-design-specification.md — Component Strategy: Scoop Modal]
- [Source: 6-2-restock-wac-recalculation.md — Dev Notes, Code Patterns, Review Fixes]
- [Source: 6-1-inventory-data-model-item-management.md — Testing Patterns, SCSS Patterns]
- [Source: Firebase docs — writeBatch for atomic operations]

## Dev Agent Record

### Agent Model Used

Claude claude-4.6-opus (Cursor Agent)

### Debug Log References

No blocking issues encountered. All tasks completed in sequence without HALT conditions.

### Completion Notes List

- **Task 1:** Added `scoopInputSchema` and `ScoopInput` type to `src/types/inventory.ts`. Schema validates shape only (itemId, quantity > 0, workOrderId). Overdraft check is UI-level per dev notes. 9 new schema tests added and passing.
- **Task 2:** Created `ScoopModal.tsx` with overlay pattern (not full-page on desktop, full-screen on mobile < 768px). Uses react-hook-form + zodResolver. Real-time cost preview via `applyScoopCost`, overdraft detection via `watch('quantity')` vs `selectedItem.currentQty`. Escape key and overlay click close modal. 14 component tests added and passing.
- **Task 3:** Integrated Scoop button into WorkOrderDetailPage transactions header next to "Add Transaction". Implemented `handleScoop` with atomic `writeBatch` (3 docs: inventory update, WO inventoryCostAgora update, inventory_log entry). `preselectedWorkOrderId` set from route param. Added `useInventory` cross-feature import. 2 new tests added (Scoop button renders, ScoopModal opens), all 19 tests passing.
- **Task 4:** Added `scoop` to InventoryPage `FormMode` union. Implemented `handleScoop` with same atomic batch pattern. Added `onScoop` prop to `InventoryTable` with ArrowBendDownRight icon button (disabled when currentQty <= 0). `preselectedItemId` set from row action. Added `useWorkOrders` cross-feature import. 6 new tests across InventoryPage (3) and InventoryTable (5), all passing.
- **Task 5:** Created `useInventoryLogs` hook (`src/features/inventory/hooks/useInventoryLogs.ts`) that subscribes to inventory_log collection. Added `inventoryLogs` and `inventoryItemNames` props to NutritionLabel. Replaced "No scoops" placeholder with actual scoop entries (material name, date, cost). WorkOrderDetailPage filters logs by workOrderRef and action='consume'. 3 new NutritionLabel tests added and passing.
- **Task 6:** Added 15 `inventory.scoop.*` keys to both `en.json` and `he.json`. Barrel export for ScoopModal added to `src/features/work-orders/components/index.ts`.

### Implementation Plan

Followed red-green-refactor cycle for each task. Used existing patterns from Story 6.2 (RestockForm, writeBatch, WAC calculations). Key design decisions:
- ScoopModal lives in `work-orders/components/` per architecture (scoop assigns cost to a WO)
- Cross-feature hook imports (`useInventory` from WO detail, `useWorkOrders` from Inventory) are legitimate per architecture
- `useInventoryLogs` loads all inventory_log docs and filters client-side (useFirestoreCollection doesn't support `where` — acceptable for 2-user system)
- `wacAfterAgora === wacBeforeAgora` for all consume entries (WAC only changes on restock)
- `qtyChange` is negative for consume entries per convention

### Change Log

- 2026-02-14: Story 6.3 implementation complete — Scoop Action for consuming inventory into Work Orders

### File List

**New files:**
- `src/features/work-orders/components/ScoopModal.tsx`
- `src/features/work-orders/components/ScoopModal.module.scss`
- `src/features/work-orders/components/ScoopModal.test.tsx`
- `src/features/inventory/hooks/useInventoryLogs.ts`

**Modified files:**
- `src/types/inventory.ts` — Added scoopInputSchema + ScoopInput type
- `src/types/inventory.test.ts` — Added scoopInputSchema validation tests
- `src/features/work-orders/components/index.ts` — Added ScoopModal barrel export
- `src/features/work-orders/WorkOrderDetailPage.tsx` — Scoop button, ScoopModal, handleScoop, inventory logs integration
- `src/features/work-orders/WorkOrderDetailPage.module.scss` — Added transactionsActions style
- `src/features/work-orders/WorkOrderDetailPage.test.tsx` — Scoop integration tests
- `src/features/work-orders/components/NutritionLabel.tsx` — inventoryLogs + inventoryItemNames props, scoop entries display
- `src/features/work-orders/components/NutritionLabel.test.tsx` — Scoop entry display tests
- `src/features/inventory/InventoryPage.tsx` — scoop FormMode, handleScoop, ScoopModal, useWorkOrders
- `src/features/inventory/InventoryPage.test.tsx` — Scoop integration tests
- `src/features/inventory/components/InventoryTable.tsx` — onScoop prop, Scoop action button
- `src/features/inventory/components/InventoryTable.test.tsx` — Scoop button tests
- `src/i18n/en.json` — Added inventory.scoop.* keys
- `src/i18n/he.json` — Added inventory.scoop.* keys (Hebrew)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — Status updated to review
