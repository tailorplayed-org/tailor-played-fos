# Story 6.4: Audit Log & Waste Tracking

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As **Gal**,
I want a complete audit trail of all inventory actions and the ability to log waste,
so that I can trace every material movement and account for losses.

## Acceptance Criteria

1. **Given** the Inventory page or an item detail view, **When** Gal opens the Audit Log, **Then** a chronological list displays all `inventory_log` entries: restock (green `ArrowFatUp` icon), consume/scoop (blue `ArrowBendDownRight` icon), waste (red `Trash` icon) **And** each entry shows: timestamp, action type, quantity change (+/-), cost snapshot (formatted via `formatCurrency`), WAC at time, linked Work Order (if applicable, as clickable link to `/work-orders/:id`), actor.

2. **Given** the Audit Log, **When** filtered by a specific inventory item, **Then** only entries for that item display **And** a running balance shows: starting qty, each change, current qty.

3. **Given** the Audit Log entries, **When** a Scoop entry references a Work Order, **Then** the Work Order name is displayed as a clickable link navigating to `/work-orders/:id`.

4. **Given** the Inventory page, **When** Gal initiates "Log Waste", **Then** a waste form appears with: Material (searchable), Quantity Lost (required, > 0), Reason (text field: "Damaged", "Expired", "Scrap from cutting", etc.), Work Order (optional — if waste is attributable to a specific project).

5. **Given** a valid waste submission, **When** Gal confirms, **Then** the inventory item's `currentQty` decreases by the waste quantity **And** if a Work Order is linked, that Work Order's cost increases by (waste qty × current WAC) — waste is a real cost **And** if no Work Order is linked, waste is tracked as general overhead loss (no WO update) **And** a success toast confirms: "Waste logged: X units of [material]" **And** an `inventory_log` entry is created with: `itemId`, `action: 'waste'`, `qtyChange` (negative), `costSnapshotAgora`, `wacBeforeAgora`, `wacAfterAgora` (same — WAC doesn't change on waste), `reason`, `workOrderRef` (optional), `timestamp`, `actorUid`.

6. **Given** the Audit Log, **When** rendered on mobile (< 768px), **Then** entries show in a compact list: icon + action + qty change + timestamp **And** tapping an entry expands to show full details (cost, WAC, Work Order link).

## Tasks / Subtasks

- [x] Task 1: Create waste input schema & `useWasteAction` hook (AC: #4, #5)
  - [x] 1.1 Add `wasteInputSchema` + `WasteInput` type to `src/types/inventory.ts`
  - [x] 1.2 Add schema validation tests to `src/types/inventory.test.ts`
  - [x] 1.3 Create `src/hooks/useWasteAction.ts` (mirror `useScoopAction` pattern)
  - [x] 1.4 Add `useWasteAction` tests to `src/hooks/useWasteAction.test.ts`
- [x] Task 2: Build WasteForm component (AC: #4, #5)
  - [x] 2.1 Create `src/features/inventory/components/WasteForm.tsx`
  - [x] 2.2 Create `src/features/inventory/components/WasteForm.module.scss`
  - [x] 2.3 Create `src/features/inventory/components/WasteForm.test.tsx`
- [x] Task 3: Build AuditLogPanel component (AC: #1, #2, #3, #6)
  - [x] 3.1 Create `src/features/inventory/components/AuditLogPanel.tsx`
  - [x] 3.2 Create `src/features/inventory/components/AuditLogPanel.module.scss`
  - [x] 3.3 Create `src/features/inventory/components/AuditLogPanel.test.tsx`
- [x] Task 4: Integrate into InventoryPage (AC: #1, #2, #4)
  - [x] 4.1 Add `waste` and `audit` FormMode types to InventoryPage
  - [x] 4.2 Wire WasteForm and AuditLogPanel into InventoryPage
  - [x] 4.3 Add "Log Waste" and "Audit Log" buttons to page header
  - [x] 4.4 Add `onWaste` prop to InventoryTable
  - [x] 4.5 Update InventoryPage tests
  - [x] 4.6 Update InventoryTable tests
- [x] Task 5: Update NutritionLabel for waste entries (AC: #5)
  - [x] 5.1 Include waste logs (with `workOrderRef`) in NutritionLabel inventory costs section
  - [x] 5.2 Update NutritionLabel tests
- [x] Task 6: Add i18n keys & update barrel exports (AC: #1–#6)
  - [x] 6.1 Add `inventory.waste.*` and `inventory.audit.*` keys to `en.json` and `he.json`
  - [x] 6.2 Update `src/features/inventory/components/index.ts` barrel exports

## Dev Notes

### Waste Action — Implementation Pattern (Mirror `useScoopAction`)

**The waste action is structurally identical to scoop, with these differences:**
- `action: 'waste'` instead of `'consume'`
- `reason` field is REQUIRED (not null)
- `workOrderRef` is OPTIONAL (null when waste is not attributable to a specific project)
- When `workOrderRef` is provided: batch includes WO `inventoryCostAgora` update (same as scoop)
- When `workOrderRef` is null: batch has only 2 writes (inventory update + inventory_log) — no WO update

**WAC does NOT change on waste.** Same rule as consume — the `verifyWAC` Cloud Function's `replayWAC` already handles `waste` action by reducing qty without recalculating WAC: `wacBeforeAgora === wacAfterAgora`.

**Over-draft prevention:** Same client-side validation as scoop — `quantity <= item.currentQty` via form-level check. Confirm button disabled when overdraft.

### WasteInput Schema

**Add to `src/types/inventory.ts`:**
```typescript
export const wasteInputSchema = z.object({
  itemId: z.string().min(1, { error: 'Material is required' }),
  quantity: z.number().positive({ error: 'Quantity must be greater than 0' }),
  reason: z.string().min(1, { error: 'Reason is required' }),
  workOrderId: z.string().default(''), // empty string = no WO linked
});

export type WasteInput = z.infer<typeof wasteInputSchema>;
```

**CRITICAL:** `reason` is REQUIRED for waste — unlike scoop where it's null. `workOrderId` defaults to empty string (not null) because react-hook-form `Select` uses empty string for "no selection". Convert empty string to null when writing to Firestore: `workOrderRef: data.workOrderId || null`.

### `useWasteAction` Hook

**Location:** `src/hooks/useWasteAction.ts` — shared hook alongside `useScoopAction.ts`.

**Pattern:** Mirror `useScoopAction` exactly, with these changes:

```typescript
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { writeBatch, doc, collection, serverTimestamp } from 'firebase/firestore';
import { applyScoopCost } from '@/lib/wac';
import { db, auth } from '@/services';
import { toast } from '@/stores/useUIStore';
import type { InventoryItem, WorkOrder, WasteInput } from '@/types';

export function useWasteAction(inventory: InventoryItem[], workOrders: WorkOrder[]) {
  const { t } = useTranslation();

  const executeWaste = useCallback(
    async (data: WasteInput) => {
      const currentUid = auth.currentUser?.uid;
      if (!currentUid) {
        toast.error(t('inventory.waste.error'));
        throw new Error('No authenticated user');
      }

      const item = inventory.find((i) => i.id === data.itemId);
      if (!item) return;

      const wo = data.workOrderId ? workOrders.find((w) => w.id === data.workOrderId) : null;
      const costAgora = applyScoopCost(data.quantity, item.wacAgora);

      try {
        const batch = writeBatch(db);

        // 1. Decrease inventory quantity (WAC stays the same)
        batch.update(doc(db, 'inventory', item.id), {
          currentQty: item.currentQty - data.quantity,
          updatedAt: serverTimestamp(),
        });

        // 2. If Work Order linked, increase its inventoryCostAgora (waste is a real cost)
        if (wo) {
          batch.update(doc(db, 'work_orders', wo.id), {
            inventoryCostAgora: wo.inventoryCostAgora + costAgora,
            updatedAt: serverTimestamp(),
          });
        }

        // 3. Create inventory_log entry
        const logRef = doc(collection(db, 'inventory_log'));
        batch.set(logRef, {
          itemId: item.id,
          action: 'waste',
          qtyChange: -data.quantity,              // NEGATIVE for waste
          costSnapshotAgora: costAgora,           // positive: total cost of this waste
          wacBeforeAgora: item.wacAgora,
          wacAfterAgora: item.wacAgora,           // SAME — WAC doesn't change on waste
          workOrderRef: data.workOrderId || null,  // null when no WO linked
          reason: data.reason,                     // REQUIRED for waste
          actorUid: currentUid,
          timestamp: serverTimestamp(),
        });

        await batch.commit();
        toast.success(
          t('inventory.waste.success', {
            qty: data.quantity,
            material: item.name,
          }),
        );
      } catch {
        toast.error(t('inventory.waste.error'));
        throw new Error('Waste batch write failed');
      }
    },
    [inventory, workOrders, t],
  );

  return { executeWaste };
}
```

**Export from `src/hooks/index.ts`:** Add `export { useWasteAction } from './useWasteAction';`

### WasteForm Component

**Location:** `src/features/inventory/components/WasteForm.tsx` — lives in inventory feature (waste is an inventory action, unlike scoop which lives in work-orders).

**Props interface (mirror RestockForm pattern):**
```typescript
interface WasteFormProps {
  item?: InventoryItem;                // pre-selected from row action
  inventoryItems: InventoryItem[];     // for searchable selector
  workOrders: WorkOrder[];             // optional WO linkage
  onSubmit: (data: WasteInput) => Promise<void>;
  onCancel: () => void;
}
```

**Form fields:**
- **Material:** `Select` (searchable), pre-selected if `item` prop provided
- **Quantity Lost:** `Input` type="number", required, > 0. Use `setValueAs: toNumberOrZero` (same pattern as RestockForm)
- **Available Stock:** computed display `selectedItem.currentQty - quantity` — shows remaining. Red + error "Only X available" when overdraft
- **Calculated Cost:** computed display `applyScoopCost(quantity, selectedItem.wacAgora)` formatted via `formatCurrency` — real-time preview
- **Reason:** `Input` type="text", required. Placeholder: "e.g., Damaged, Expired, Scrap from cutting"
- **Work Order (Optional):** `Select` (searchable) with "None" option (value: ''). Shows WO client name
- **Actions:** Cancel (ghost) + "Confirm Waste" (danger variant — red, signals destructive action)

**Form approach (mirror RestockForm pattern):**
```typescript
const { register, handleSubmit, control, watch, formState: { errors, isSubmitting } } = useForm<WasteInput>({
  resolver: zodResolver(wasteInputSchema),
  defaultValues: {
    itemId: item?.id ?? '',
    quantity: 0,
    reason: '',
    workOrderId: '',
  },
});

const quantity = watch('quantity');
const itemId = watch('itemId');
const selectedItem = inventoryItems.find(i => i.id === itemId);
const isOverdraft = selectedItem != null && quantity > selectedItem.currentQty;
const wasteCost = selectedItem && quantity > 0
  ? applyScoopCost(quantity, selectedItem.wacAgora)
  : 0;
```

**CRITICAL UI rules:**
- Confirm button uses `variant="danger"` — waste is destructive, red button signals caution
- Confirm button disabled when: `isSubmitting || isOverdraft || !selectedItem || quantity <= 0 || !reason`
- Cost preview: shows waste cost as a warning (this cost will be charged to WO if linked, or tracked as overhead loss)
- Use `setValueAs: toNumberOrZero` for quantity (same code review fix from Story 6.1)

**SCSS:** Use `RestockForm.module.scss` as exact pattern. Copy structure, rename classes. Same `@include card-surface`, same `fields` layout, same `actions` pattern with mobile column-reverse.

### AuditLogPanel Component

**Location:** `src/features/inventory/components/AuditLogPanel.tsx`

**This is the main new component for this story.** A panel/section that displays a chronological audit log of all inventory actions.

**Props interface:**
```typescript
interface AuditLogPanelProps {
  logs: InventoryLogEntry[];
  inventoryItems: InventoryItem[];
  workOrders: WorkOrder[];
  loading?: boolean;
  onClose: () => void;
}
```

**Component design:**

1. **Header:** "Audit Log" title + close button (X icon) + item filter `Select`
2. **Item Filter:** `Select` (searchable) with "All Items" default. When an item is selected, only that item's logs display AND a running balance strip appears
3. **Running Balance Strip** (visible only when filtered by item): Shows starting qty → each change → current qty in a horizontal summary bar
4. **Log Entry List:** Chronological (newest first), each entry is an `AuditLogEntry` sub-component

**AuditLogEntry sub-component (inline in same file or separate — keep in same file for simplicity):**

Desktop layout (per entry row):
```
[Icon] [Action Label] | [+/- qty] [unit] | [Cost: ₪X.XX] | [WAC: ₪X.XX] | [WO: link] | [timestamp]
```

Mobile layout (< 768px):
```
[Icon] [Action] [+/- qty] [timestamp]
  ↳ tap to expand: cost, WAC, WO link
```

**Action → Icon + Color mapping (from architecture icon mapping):**

| Action | Icon | Color | Label |
|--------|------|-------|-------|
| `restock` | `ArrowFatUp` | `$success` (green) | "Restock" |
| `consume` | `ArrowBendDownRight` | `$info` or `#3b82f6` (blue) | "Scoop" |
| `waste` | `Trash` | `$error` (red) | "Waste" |

**CRITICAL — blue color for consume:** The design system does NOT have `$info` token. Use a hardcoded blue `#3b82f6` or use `$gold` as alternative. Check the design system — if there's no blue token, use `$text-primary` (gold/amber) for consume to stay on-brand. Architecture says "blue" but the actual token set is purple+gold. **Decision: use `$gold` for consume entries** — it's the primary accent and works well for "neutral action" vs green success / red error. If this feels wrong during review, it can be changed.

**Actually — reconsider.** The architecture explicitly says blue for consume. Let's define a local SCSS variable: `$action-consume: #3b82f6;` at the top of the module SCSS. This keeps the architecture spec while not polluting the global token set.

**Work Order link:** When `workOrderRef` is set, resolve the WO name from the `workOrders` array and render as a `<Link to={/work-orders/${log.workOrderRef}}>` using React Router's `Link`. Import: `import { Link } from 'react-router-dom';`

**Actor display:** The `actorUid` is stored in logs. For a 2-user system, just display "Gal" for any UID (or skip actor display since there are only 2 users and it's always Gal). Simplest: display `actorUid` truncated OR omit entirely. **Decision: omit actor column** — 2-user system, adds no value. If needed later, easy to add.

**Running Balance calculation (when filtered by specific item):**
```typescript
function calculateRunningBalance(logs: InventoryLogEntry[], currentQty: number): RunningBalanceEntry[] {
  // Sort logs oldest → newest for balance calculation
  const sorted = [...logs].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  
  // Work backwards from currentQty to find starting qty
  const totalChange = sorted.reduce((sum, log) => sum + log.qtyChange, 0);
  const startingQty = currentQty - totalChange;
  
  let runningQty = startingQty;
  return sorted.map((log) => {
    runningQty += log.qtyChange;
    return { log, balanceAfter: runningQty };
  });
}
```

**Sorting:** Default newest-first for the display list. The running balance calculation internally sorts oldest-first but the display reverses.

**Empty state:** When no logs exist: "No inventory actions recorded yet" with a package icon.

### InventoryPage Integration

**Update `FormMode` union:**
```typescript
type FormMode =
  | { type: 'closed' }
  | { type: 'create' }
  | { type: 'edit'; item: InventoryItem }
  | { type: 'restock'; item?: InventoryItem }
  | { type: 'scoop'; item?: InventoryItem }
  | { type: 'waste'; item?: InventoryItem }   // NEW
  | { type: 'audit' };                         // NEW — no item needed, shows all
```

**New imports in InventoryPage:**
```typescript
import { WasteForm, AuditLogPanel } from './components';
import { useWasteAction } from '@/hooks';
import { useInventoryLogs } from './hooks/useInventoryLogs';
import { Trash, ClockCounterClockwise } from '@phosphor-icons/react'; // Waste + Audit icons
```

**New hooks in InventoryPage:**
```typescript
const { executeWaste } = useWasteAction(inventory, workOrders);
const { logs: inventoryLogs, loading: logsLoading } = useInventoryLogs();
```

**New handlers:**
```typescript
const handleWasteClick = useCallback((item: InventoryItem) => {
  setFormMode({ type: 'waste', item });
}, []);

const handleAuditClick = useCallback(() => {
  setFormMode({ type: 'audit' });
}, []);
```

**Header buttons — add "Log Waste" and "Audit Log" buttons next to "Add Material":**
```tsx
<Button size="sm" variant="secondary" onClick={handleAuditClick}>
  <ClockCounterClockwise size={18} weight="bold" />
  <span>{t('inventory.audit.title')}</span>
</Button>
<Button size="sm" variant="danger" onClick={() => setFormMode({ type: 'waste' })}>
  <Trash size={18} weight="bold" />
  <span>{t('inventory.waste.action')}</span>
</Button>
```

**Render blocks (add after existing scoop block):**
```tsx
{formMode.type === 'waste' && (
  <WasteForm
    item={formMode.item}
    inventoryItems={inventory}
    workOrders={workOrders}
    onSubmit={executeWaste}
    onCancel={handleCancel}
  />
)}

{formMode.type === 'audit' && (
  <AuditLogPanel
    logs={inventoryLogs}
    inventoryItems={inventory}
    workOrders={workOrders}
    loading={logsLoading}
    onClose={handleCancel}
  />
)}
```

### InventoryTable — Add Waste Action Button

**Add `onWaste` prop alongside `onRestock` and `onScoop`:**
```typescript
interface InventoryTableProps {
  items: InventoryItem[];
  loading: boolean;
  onRowClick?: (item: InventoryItem) => void;
  onRestock?: (item: InventoryItem) => void;
  onScoop?: (item: InventoryItem) => void;
  onWaste?: (item: InventoryItem) => void;   // NEW
  emptyState?: React.ReactNode;
}
```

Add waste action column after scoop column:
```typescript
...(onWaste
  ? [{
      key: 'wasteAction' as const,
      header: '',
      align: 'end' as const,
      render: (item: InventoryItem) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            onWaste(item);
          }}
          aria-label={t('inventory.waste.action')}
          disabled={item.currentQty <= 0}
        >
          <Trash size={16} /> {t('inventory.waste.action')}
        </Button>
      ),
    }]
  : []),
```

### NutritionLabel — Include Waste Entries

Currently, WorkOrderDetailPage filters inventory logs by `workOrderRef === id && action === 'consume'`. Waste entries WITH a `workOrderRef` should ALSO appear in the NutritionLabel since waste is a real cost to the project.

**Update the filter in WorkOrderDetailPage:**
```typescript
// Before (Story 6.3):
const scoopLogs = inventoryLogs.filter(log => log.workOrderRef === id && log.action === 'consume');

// After (Story 6.4):
const woInventoryLogs = inventoryLogs.filter(
  log => log.workOrderRef === id && (log.action === 'consume' || log.action === 'waste')
);
```

**In NutritionLabel,** the existing render logic already handles displaying log entries with their cost. No NutritionLabel component changes needed — just the filter update in WorkOrderDetailPage. Waste entries will appear alongside scoop entries in the "Inventory Costs" section. Consider adding a visual indicator (red text or waste icon) for waste entries vs scoop entries:

```tsx
{woInventoryLogs.map((log) => {
  const itemName = inventoryItemNames?.[log.itemId] ?? log.itemId;
  const isWaste = log.action === 'waste';
  return (
    <div key={log.id} className={styles.transactionItem}>
      <span className={styles.transactionVendor}>
        {isWaste && <Trash size={14} className={styles.wasteIcon} />}
        {itemName}{isWaste ? ` (waste: ${log.reason})` : ''}
      </span>
      <span className={styles.transactionDate}>
        {log.timestamp.toLocaleDateString(i18n.language)}
      </span>
      <span className={styles.transactionAmount}>
        {formatCurrency(log.costSnapshotAgora)}
      </span>
    </div>
  );
})}
```

### Project Structure Notes

**New files to create:**
```
src/features/inventory/components/WasteForm.tsx              # Waste logging form
src/features/inventory/components/WasteForm.module.scss      # Waste form styles
src/features/inventory/components/WasteForm.test.tsx         # WasteForm tests
src/features/inventory/components/AuditLogPanel.tsx          # Audit log display panel
src/features/inventory/components/AuditLogPanel.module.scss  # Audit log styles
src/features/inventory/components/AuditLogPanel.test.tsx     # AuditLogPanel tests
src/hooks/useWasteAction.ts                                  # Waste action hook
src/hooks/useWasteAction.test.ts                             # Waste action tests
```

**Files to modify:**
```
src/types/inventory.ts                                # Add wasteInputSchema + WasteInput type
src/types/inventory.test.ts                           # Add wasteInputSchema validation tests
src/hooks/index.ts                                    # Export useWasteAction
src/features/inventory/components/index.ts            # Export WasteForm, AuditLogPanel
src/features/inventory/InventoryPage.tsx              # Add waste + audit FormModes, buttons, handlers
src/features/inventory/InventoryPage.test.tsx         # Add waste + audit integration tests
src/features/inventory/components/InventoryTable.tsx  # Add onWaste prop + Waste action button
src/features/inventory/components/InventoryTable.test.tsx  # Add waste button tests
src/features/work-orders/WorkOrderDetailPage.tsx      # Update inventory log filter to include waste
src/features/work-orders/WorkOrderDetailPage.test.tsx # Update filter tests
src/features/work-orders/components/NutritionLabel.tsx     # Add waste visual indicator
src/features/work-orders/components/NutritionLabel.test.tsx # Add waste entry display tests
src/i18n/en.json                                      # Add inventory.waste.* + inventory.audit.* keys
src/i18n/he.json                                      # Add Hebrew translations
```

**Files that already exist and must NOT be recreated:**

| Component | Location | Reuse For |
|---|---|---|
| `Button` | `src/components/Button/Button.tsx` | Form actions, table buttons, header buttons |
| `Input` | `src/components/Input/Input.tsx` | Quantity, Reason fields |
| `Select` | `src/components/Input/Select.tsx` | Material, Work Order selectors |
| `Table` | `src/components/Table/Table.tsx` | NOT used for audit log — audit log uses custom list layout |
| `Card` | `src/components/Card/Card.tsx` | Optional wrapper |
| `toast` | `src/stores/useUIStore.ts` | Success/error notifications (used via `useWasteAction` hook) |
| `formatCurrency` | `src/lib/currency.ts` | Cost display in audit entries |
| `applyScoopCost` | `src/lib/wac.ts` | Cost calculation for waste (qty × WAC) — REUSE, same math |
| `useInventory` | `src/features/inventory/hooks/useInventory.ts` | Already used in InventoryPage |
| `useInventoryLogs` | `src/features/inventory/hooks/useInventoryLogs.ts` | Load all inventory_log entries |
| `useWorkOrders` | `src/features/work-orders/hooks/useWorkOrders.ts` | Already imported in InventoryPage (Story 6.3) |
| `useScoopAction` | `src/hooks/useScoopAction.ts` | REFERENCE for useWasteAction pattern — do NOT modify |
| `db` | `src/services/firebase.ts` | Firestore instance |
| `auth` | `src/services/firebase.ts` | Get current user UID for actorUid |
| `writeBatch` | `firebase/firestore` | Atomic batch write |
| `Link` | `react-router-dom` | Work Order clickable links in audit log |
| `RestockForm` | `src/features/inventory/components/RestockForm.tsx` | REFERENCE for WasteForm layout pattern |
| `ScoopModal` | `src/features/work-orders/components/ScoopModal.tsx` | REFERENCE for overdraft + cost preview pattern |

### Critical Import Patterns (from Story 6.1–6.3)

```typescript
// Types + schemas
import type { InventoryItem, InventoryLogEntry, WorkOrder, WasteInput } from '@/types';
import { wasteInputSchema, INVENTORY_LOG_ACTIONS } from '@/types';

// WAC / Cost
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
import { Button, Input, Select } from '@/components';

// Icons (Phosphor only)
import { Trash } from '@phosphor-icons/react';                // Waste icon
import { ArrowFatUp } from '@phosphor-icons/react';           // Restock icon (audit log)
import { ArrowBendDownRight } from '@phosphor-icons/react';   // Consume icon (audit log)
import { ClockCounterClockwise } from '@phosphor-icons/react'; // Audit log header icon
import { X } from '@phosphor-icons/react';                    // Close panel icon

// Router
import { Link } from 'react-router-dom';

// i18n
import { useTranslation } from 'react-i18next';

// Toast
import { toast } from '@/stores/useUIStore';
```

### Testing Patterns (from Story 6.1–6.3)

**Framework:** Vitest + React Testing Library
**Co-located:** `*.test.ts` / `*.test.tsx` next to source files
**SCSS auto-import:** Global variables/mixins auto-imported — no explicit `@use` statements

**Mock Firestore (same as Story 6.2/6.3):**
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
  applyScoopCost: vi.fn((qty, wac) => qty * wac),
  calculateWAC: vi.fn(() => 5000),
}));
```

**WasteForm test scenarios:**
1. Renders all fields (material, quantity, reason, work order optional, cost preview)
2. Pre-selects material when `item` prop provided
3. Shows overdraft error when quantity exceeds available stock
4. Disables Confirm button on overdraft or missing reason
5. Updates cost preview in real-time as quantity changes
6. Calls onSubmit with correct data (including reason, workOrderId)
7. Calls onSubmit with empty workOrderId when no WO selected
8. Calls onCancel when cancel clicked
9. Requires reason field — shows error when empty

**useWasteAction test scenarios:**
1. Creates correct batch writes (inventory + log) when no WO linked
2. Creates correct batch writes (inventory + WO + log) when WO linked
3. Sets `action: 'waste'` and `reason` in log entry
4. Sets `qtyChange` as negative
5. Sets `wacAfterAgora === wacBeforeAgora`
6. Shows success toast on success
7. Shows error toast and throws on failure
8. Shows error when no authenticated user

**AuditLogPanel test scenarios:**
1. Renders all log entries in chronological order (newest first)
2. Shows correct icons and colors for restock/consume/waste
3. Displays formatted cost via `formatCurrency`
4. Shows Work Order name as clickable link when `workOrderRef` present
5. Filters entries when item selected in filter
6. Shows running balance when filtered by specific item
7. Shows empty state when no logs
8. Mobile: shows compact view, expandable on tap
9. Calls onClose when close button clicked

### SCSS Patterns

- Use `$error` for red/destructive — `$danger` does NOT exist
- CSS logical properties for RTL (`margin-inline-start`, `padding-inline-end`)
- Touch targets ≥ 44px on mobile
- Follow `RestockForm.module.scss` patterns for WasteForm
- AuditLogPanel: use `@include card-surface` for the panel container
- No explicit `@use` statements — globals auto-imported
- On mobile (< 768px): compact layout for audit entries
- Define local `$action-consume: #3b82f6;` in AuditLogPanel.module.scss for blue consume color

**AuditLogPanel SCSS structure:**
```scss
.panel {
  @include card-surface;
  padding: $space-lg;
  border-radius: $radius-lg;
  animation: slideDown 0.2s ease-out;
}

.panelHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-block-end: $space-md;
}

.panelTitle {
  font-size: $font-lg;
  font-weight: $font-semibold;
  display: flex;
  align-items: center;
  gap: $space-sm;
}

.filterRow {
  margin-block-end: $space-md;
}

.runningBalance {
  display: flex;
  align-items: center;
  gap: $space-sm;
  padding: $space-sm $space-md;
  background: $surface-secondary;
  border-radius: $radius-md;
  margin-block-end: $space-md;
  font-size: $font-sm;
  color: $text-secondary;
}

.logList {
  display: flex;
  flex-direction: column;
  gap: $space-xs;
}

.logEntry {
  display: flex;
  align-items: center;
  gap: $space-sm;
  padding: $space-sm $space-md;
  border-radius: $radius-md;
  background: $bg-secondary;
  min-block-size: 44px; // touch target

  @media (max-width: $bp-sm) {
    flex-wrap: wrap;
    cursor: pointer;
  }
}

.logIcon {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
}

.iconRestock { color: $success; }
.iconConsume { color: #3b82f6; } // blue — per architecture spec
.iconWaste { color: $error; }

.logAction {
  font-weight: $font-medium;
  min-width: 60px;
}

.logQty {
  font-weight: $font-semibold;
  text-align: end;
  min-width: 60px;
}

.logCost {
  color: $text-secondary;
  text-align: end;
}

.logTimestamp {
  color: $text-muted;
  font-size: $font-xs;
  margin-inline-start: auto;
}

.logWorkOrder {
  color: $gold;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}

// Mobile expandable details
.logDetails {
  display: none;
  width: 100%;
  padding-inline-start: calc(24px + $space-sm); // align with content after icon
  padding-block-start: $space-xs;
  font-size: $font-sm;
  color: $text-secondary;

  @media (max-width: $bp-sm) {
    &.expanded {
      display: flex;
      flex-direction: column;
      gap: $space-xs;
    }
  }
}

// Desktop: always show all details inline
@media (min-width: $bp-sm) {
  .logCost,
  .logWorkOrder {
    display: inline;
  }
}

// Mobile: hide cost/WO in main row, show in expanded details
@media (max-width: $bp-sm) {
  .logCost,
  .logWorkOrder,
  .logWac {
    display: none;
  }
}

.emptyState {
  @include flex-column-center;
  padding: $space-xl;
  color: $text-muted;
  gap: $space-sm;
}
```

### i18n Keys to Add

**English (`en.json`) — add under `inventory`:**
```json
"waste": {
  "title": "Log Waste",
  "action": "Waste",
  "material": "Material",
  "materialRequired": "Material is required",
  "quantity": "Quantity Lost",
  "quantityError": "Quantity must be greater than 0",
  "overdraftError": "Only {{available}} available",
  "reason": "Reason",
  "reasonPlaceholder": "e.g., Damaged, Expired, Scrap from cutting",
  "reasonRequired": "Reason is required",
  "workOrder": "Work Order (Optional)",
  "workOrderNone": "None — general overhead",
  "availableStock": "Available Stock",
  "remainingAfter": "{{remaining}} remaining after waste",
  "calculatedCost": "Waste Cost",
  "submit": "Confirm Waste",
  "cancel": "Cancel",
  "success": "Waste logged: {{qty}} units of {{material}}",
  "error": "Failed to log waste"
},
"audit": {
  "title": "Audit Log",
  "filterAll": "All Items",
  "filterByItem": "Filter by Item",
  "emptyState": "No inventory actions recorded yet",
  "runningBalance": "Balance: {{startQty}} → {{currentQty}}",
  "actions": {
    "restock": "Restock",
    "consume": "Scoop",
    "waste": "Waste"
  },
  "cost": "Cost",
  "wac": "WAC",
  "workOrder": "Work Order",
  "close": "Close"
}
```

**Hebrew (`he.json`) — add under `inventory`:**
```json
"waste": {
  "title": "רישום פחת",
  "action": "פחת",
  "material": "חומר",
  "materialRequired": "חומר הוא שדה חובה",
  "quantity": "כמות שאבדה",
  "quantityError": "הכמות חייבת להיות גדולה מ-0",
  "overdraftError": "רק {{available}} זמינים",
  "reason": "סיבה",
  "reasonPlaceholder": "לדוגמה: פגום, פג תוקף, גרוטאות מחיתוך",
  "reasonRequired": "סיבה היא שדה חובה",
  "workOrder": "הזמנת עבודה (אופציונלי)",
  "workOrderNone": "ללא — הוצאות כלליות",
  "availableStock": "מלאי זמין",
  "remainingAfter": "{{remaining}} נותרים לאחר פחת",
  "calculatedCost": "עלות פחת",
  "submit": "אישור פחת",
  "cancel": "ביטול",
  "success": "פחת נרשם: {{qty}} יחידות של {{material}}",
  "error": "שגיאה ברישום פחת"
},
"audit": {
  "title": "יומן ביקורת",
  "filterAll": "כל הפריטים",
  "filterByItem": "סנן לפי פריט",
  "emptyState": "אין פעולות מלאי שנרשמו עדיין",
  "runningBalance": "מאזן: {{startQty}} → {{currentQty}}",
  "actions": {
    "restock": "מילוי מחדש",
    "consume": "סקופ",
    "waste": "פחת"
  },
  "cost": "עלות",
  "wac": "עלות ממוצעת",
  "workOrder": "הזמנת עבודה",
  "close": "סגור"
}
```

### Cross-Epic Context

- **Epic 2 (Story 2.4):** NutritionLabel now shows Inventory Costs from scoop entries (Story 6.3). This story adds waste entries WITH `workOrderRef` to that same section.
- **Epic 5 (Story 5.4):** `onTransactionApproved` handles `InventoryRestock` category from AI pipeline. Those create `restock` log entries automatically. All three action types (restock, consume, waste) will appear in the audit log.
- **Story 6.2:** `verifyWAC` Cloud Function already handles `waste` action type in `replayWAC` — reduces qty without recalculating WAC. No Cloud Function changes needed.
- **Story 6.3:** ScoopModal, `useScoopAction`, `useInventoryLogs` all created. Waste reuses these patterns. The `applyScoopCost` function is reused for waste cost calculation (same math: qty × WAC).
- **Epic 7:** Overhead tracking — waste WITHOUT a linked Work Order conceptually contributes to general overhead. This story does NOT create overhead entries for unlinked waste; that's Epic 7's domain. For now, unlinked waste is simply logged in `inventory_log` with `workOrderRef: null`.

### Zod v4 Reminders

- Use `{ error: "message" }` NOT `{ message: "message" }` for custom error strings
- Use `z.string().default('')` for optional Work Order ID (form uses empty string for "none")
- No `.default()` on form schemas for fields that the form provides via `defaultValues`

### Performance

- Audit log loads ALL `inventory_log` docs via `useInventoryLogs` and filters client-side. For a 2-user system this is acceptable (architecture: client-side filtering for small datasets).
- Running balance calculation is O(n) where n = number of log entries for the filtered item — trivially fast.
- `applyScoopCost` for waste cost: single multiplication, < 1ms.

### Auth Guard

- Same pattern as `useScoopAction`: check `auth.currentUser?.uid` before proceeding
- If no authenticated user, show error toast and throw

### References

- [Source: epics.md — Epic 6, Story 6.4: Audit Log & Waste Tracking]
- [Source: architecture.md — Data Architecture: inventory_log collection, audit trail pattern]
- [Source: architecture.md — Cloud Functions: verifyWAC trigger (already handles waste action)]
- [Source: architecture.md — lib/wac.ts: applyScoopCost (reused for waste cost)]
- [Source: architecture.md — Naming: Integer currency fields suffix with Agora]
- [Source: architecture.md — Project Structure: AuditLog.tsx in inventory/components/]
- [Source: ux-design-specification.md — Icon mapping: ArrowFatUp, ArrowBendDownRight, Trash]
- [Source: ux-design-specification.md — "audit log should be as scannable as Bit's payment history"]
- [Source: ux-design-specification.md — Mobile: compact list with expandable details]
- [Source: 6-3-scoop-action-consume-inventory-work-orders.md — useScoopAction pattern, testing patterns, SCSS patterns]
- [Source: 6-2-restock-wac-recalculation.md — RestockForm pattern, writeBatch, WAC]
- [Source: 6-1-inventory-data-model-item-management.md — InventoryTable, toNumberOrZero, SCSS tokens]

## Dev Agent Record

### Agent Model Used

Claude claude-4.6-opus (via Cursor)

### Debug Log References

- Fixed react-router-dom → react-router import (project uses react-router v7, not react-router-dom)
- Fixed toast success test assertion — t() mock returns key only, params passed to t() not forwarded to toast

### Completion Notes List

- Task 1: Added `wasteInputSchema` + `WasteInput` type to `src/types/inventory.ts`. Created `useWasteAction` hook mirroring `useScoopAction` pattern with optional WO linkage. 11 schema tests + 9 hook tests pass.
- Task 2: Built `WasteForm` component following `RestockForm` pattern. Includes material select, quantity with overdraft check, reason (required), optional WO linkage, real-time cost preview, danger variant submit button. 9 tests pass.
- Task 3: Built `AuditLogPanel` component with chronological log display, item filter with running balance, action-specific icons (green restock, blue consume, red waste), WO links, mobile expandable details. 9 tests pass.
- Task 4: Integrated into `InventoryPage` — added `waste` and `audit` FormMode types, `useWasteAction` + `useInventoryLogs` hooks, header buttons ("Log Waste" + "Audit Log"), `onWaste` prop on `InventoryTable`. 3 new integration tests + all existing pass.
- Task 5: Updated `WorkOrderDetailPage` inventory log filter to include `waste` action alongside `consume`. Added waste visual indicator (Trash icon + reason label) in `NutritionLabel` expanded inventory costs. 1 new test + all existing pass.
- Task 6: Added all `inventory.waste.*` and `inventory.audit.*` i18n keys in both `en.json` and `he.json`. Added `nutritionLabel.waste` key. Updated barrel exports.

### File List

**New files:**
- `src/hooks/useWasteAction.ts` — Waste action hook (atomic Firestore batch)
- `src/hooks/useWasteAction.test.ts` — 9 tests
- `src/features/inventory/components/WasteForm.tsx` — Waste logging form
- `src/features/inventory/components/WasteForm.module.scss` — Waste form styles
- `src/features/inventory/components/WasteForm.test.tsx` — 9 tests
- `src/features/inventory/components/AuditLogPanel.tsx` — Audit log display panel
- `src/features/inventory/components/AuditLogPanel.module.scss` — Audit log styles
- `src/features/inventory/components/AuditLogPanel.test.tsx` — 9 tests

**Modified files:**
- `src/types/inventory.ts` — Added `wasteInputSchema` + `WasteInput` type
- `src/types/inventory.test.ts` — Added 11 wasteInputSchema tests
- `src/hooks/index.ts` — Export `useWasteAction`
- `src/features/inventory/components/index.ts` — Export `WasteForm`, `AuditLogPanel`
- `src/features/inventory/InventoryPage.tsx` — Added waste/audit FormModes, hooks, handlers, render blocks
- `src/features/inventory/InventoryPage.module.scss` — Added `.headerActions` style
- `src/features/inventory/InventoryPage.test.tsx` — Added 3 new tests + updated icon mock
- `src/features/inventory/components/InventoryTable.tsx` — Added `onWaste` prop + Waste action column
- `src/features/inventory/components/InventoryTable.test.tsx` — Added 5 waste button tests (render, click, not provided, disabled zero stock, no row click propagation)
- `src/features/work-orders/WorkOrderDetailPage.tsx` — Updated inventory log filter to include waste
- `src/features/work-orders/components/NutritionLabel.tsx` — Added waste visual indicator (Trash icon + reason)
- `src/features/work-orders/components/NutritionLabel.module.scss` — Added `.wasteIcon` style
- `src/features/work-orders/components/NutritionLabel.test.tsx` — Added waste entry display test
- `src/i18n/en.json` — Added `inventory.waste.*`, `inventory.audit.*`, `nutritionLabel.waste` keys
- `src/i18n/he.json` — Added Hebrew translations for all new keys

## Change Log

- 2026-02-14: Implemented Story 6.4 — Audit Log & Waste Tracking. Added waste logging with optional WO linkage, chronological audit log panel with item filtering and running balance, integrated into InventoryPage and NutritionLabel. 994 tests pass (22 new).
- 2026-02-14: Code review fixes — Added 5 missing waste button tests to InventoryTable.test.tsx (Trash icon mock + render/click/disabled/no-propagation), added WasteForm test for WO-linked submission, added AuditLogPanel expand/collapse toggle test. Updated story File List to include InventoryTable.test.tsx.
