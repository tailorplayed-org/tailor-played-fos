# Story 6.2: Restock & WAC Recalculation

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As **Gal**,
I want to record material restocks that automatically recalculate the weighted average cost,
so that COGS calculations always reflect the true blended cost of my inventory.

## Acceptance Criteria

1. **Given** an inventory item detail or a "Restock" action, **When** Gal initiates a restock, **Then** a restock form appears with: Material (pre-selected or searchable), Quantity Added (required, > 0), Total Cost of Restock (required, currency input in ILS — converted to agora on submit), and a calculated Unit Cost preview (Total Cost / Quantity).

2. **Given** a restock form with valid inputs, **When** Gal submits the restock, **Then** WAC is recalculated: `newWAC = (existingQty × oldWAC + restockQty × restockUnitCostAgora) / (existingQty + restockQty)` — using integer arithmetic throughout (agora precision, rounding to nearest agora) — the item's `currentQty` increases by the restock quantity — the item's `wacAgora` updates to the new WAC — `updatedAt` timestamp updates.

3. **Given** `src/lib/wac.ts`, **When** the WAC utility is created, **Then** `calculateWAC(existingQty, existingWacAgora, addedQty, addedTotalCostAgora): number` returns new WAC in agora. Edge cases handled: first restock (existingQty = 0), zero cost restock, single unit. Co-located tests verify precision against manual calculations (must match within 1 agora).

4. **Given** a restock is saved, **When** the inventory_log is updated, **Then** a new document is created in `inventory_log` with: `itemId`, `action: 'restock'`, `qtyChange` (positive), `costSnapshotAgora` (restock total cost), `wacBeforeAgora`, `wacAfterAgora`, `timestamp`, `actorUid`.

5. **Given** `functions/src/triggers/verifyWAC.ts`, **When** the `inventory` collection receives a write (onDocumentWritten trigger), **Then** the Cloud Function independently recalculates WAC from the `inventory_log` entries for that item. If the client-side WAC diverges from server calculation by > 1 agora, the server value overwrites. Verification is logged.

6. **Given** the WAC recalculation, **When** performed client-side, **Then** the calculation completes in < 500ms (NFR5). The inventory table and any open forms reflect the new WAC immediately.

## Tasks / Subtasks

- [x] Task 1: Implement WAC calculation utility (AC: #3)
  - [x] 1.1 Create `calculateWAC` in `src/lib/wac.ts`
  - [x] 1.2 Create co-located tests `src/lib/wac.test.ts`
- [x] Task 2: Create InventoryLog type & schema (AC: #4)
  - [x] 2.1 Add `InventoryLogEntry` type + `inventoryLogSchema` to `src/types/inventory.ts`
  - [x] 2.2 Add schema validation tests
- [x] Task 3: Build RestockForm component (AC: #1)
  - [x] 3.1 Create `src/features/inventory/components/RestockForm.tsx`
  - [x] 3.2 Create `src/features/inventory/components/RestockForm.module.scss`
  - [x] 3.3 Create `src/features/inventory/components/RestockForm.test.tsx`
- [x] Task 4: Integrate restock into InventoryPage (AC: #1, #2, #4)
  - [x] 4.1 Add restock mode to InventoryPage formMode state machine
  - [x] 4.2 Implement Firestore batch write: update inventory item + create inventory_log entry
  - [x] 4.3 Add "Restock" button to inventory table rows
  - [x] 4.4 Update InventoryPage tests
- [x] Task 5: Create verifyWAC Cloud Function (AC: #5)
  - [x] 5.1 Add `inventoryLogSchema` to `functions/src/shared/schemas.ts` (server-side copy, use `z.any()` for Timestamps)
  - [x] 5.2 Create `functions/src/triggers/verifyWAC.ts`
  - [x] 5.3 Export from `functions/src/index.ts`
  - [x] 5.4 Create `functions/src/triggers/verifyWAC.test.ts`
- [x] Task 6: Add i18n keys & update barrel exports (AC: #1)
  - [x] 6.1 Add `inventory.restock.*` keys to `en.json` and `he.json`
  - [x] 6.2 Update barrel exports (`components/index.ts`, `types/index.ts`)

## Dev Notes

### WAC Calculation — CRITICAL Implementation Details

**Formula (integer arithmetic ONLY):**
```typescript
function calculateWAC(
  existingQty: number,
  existingWacAgora: number,
  addedQty: number,
  addedTotalCostAgora: number
): number {
  if (existingQty + addedQty === 0) return 0;
  // First restock: WAC = totalCost / qty
  if (existingQty === 0) return Math.round(addedTotalCostAgora / addedQty);
  // Standard WAC
  const totalValue = existingQty * existingWacAgora + addedTotalCostAgora;
  const totalQty = existingQty + addedQty;
  return Math.round(totalValue / totalQty);
}
```

**Edge cases to test:**
- First restock (existingQty = 0): WAC = addedTotalCostAgora / addedQty
- Zero cost restock: WAC decreases (dilution)
- Single unit restock: WAC = total cost
- Large quantities: verify no integer overflow (use standard JS number — safe up to 2^53)
- Result must match manual calculation within 1 agora

**Export also `applyScoopCost` stub (placeholder for Story 6.3):**
```typescript
export function applyScoopCost(qty: number, wacAgora: number): number {
  return qty * wacAgora;
}
```
[Source: architecture.md — `lib/wac.ts` exports `calculateWAC`, `applyScoopCost`]

### InventoryLogEntry Schema

**New type to add to `src/types/inventory.ts`:**
```typescript
export const inventoryLogSchema = z.object({
  id: z.string(),
  itemId: z.string(),
  action: z.enum(['restock', 'consume', 'waste']),
  qtyChange: z.number(), // positive for restock, negative for consume/waste
  costSnapshotAgora: z.number().int(), // total cost of this action in agora
  wacBeforeAgora: z.number().int(),
  wacAfterAgora: z.number().int(),
  workOrderRef: z.string().nullable().default(null), // only for consume/waste
  reason: z.string().nullable().default(null), // only for waste
  actorUid: z.string(),
  timestamp: z.date(),
});

export type InventoryLogEntry = z.infer<typeof inventoryLogSchema>;
```
[Source: architecture.md — `inventory_log` collection fields; epics.md Story 6.2 AC #4]

### RestockForm Component

**Props interface:**
```typescript
interface RestockFormProps {
  item?: InventoryItem; // pre-selected item (from row action)
  inventoryItems: InventoryItem[]; // for searchable selector if no pre-selected item
  onSubmit: (data: RestockInput) => Promise<void>;
  onCancel: () => void;
}
```

**Form fields:**
- Material: `Select` component (searchable), pre-selected if `item` prop provided
- Quantity Added: `Input` type="number", required, > 0
- Total Cost (ILS): `Input` type="number", step="0.01", required, > 0
- Unit Cost preview (computed): `totalCost / quantity` — display only, updates in real-time

**Zod schema for form validation:**
```typescript
export const restockInputSchema = z.object({
  itemId: z.string().min(1, { error: 'Material is required' }),
  quantity: z.number().positive({ error: 'Quantity must be greater than 0' }),
  totalCostIls: z.number().positive({ error: 'Total cost must be greater than 0' }),
});

export type RestockInput = z.infer<typeof restockInputSchema>;
```

**CRITICAL:** The form captures cost in ILS (major units). Convert to agora using `toMinorUnits()` in the submit handler, NOT in the schema. This follows the pattern established in Story 6.1 (code review fix #1).

**Use `setValueAs` transforms for number fields** — NOT `valueAsNumber: true` (Story 6.1 code review fix #2 — NaN on empty inputs).

### Firestore Batch Write on Restock Submit

**In InventoryPage, the restock submit handler must perform an atomic batch write:**
```typescript
import { writeBatch, doc, collection, serverTimestamp } from 'firebase/firestore';
import { calculateWAC } from '@/lib/wac';
import { toMinorUnits } from '@/lib/currency';

const handleRestock = async (data: RestockInput) => {
  const item = inventory.find(i => i.id === data.itemId);
  if (!item) return;

  const totalCostAgora = toMinorUnits(data.totalCostIls);
  const newWAC = calculateWAC(item.currentQty, item.wacAgora, data.quantity, totalCostAgora);

  const batch = writeBatch(db);

  // 1. Update inventory item
  batch.update(doc(db, 'inventory', item.id), {
    currentQty: item.currentQty + data.quantity,
    wacAgora: newWAC,
    updatedAt: serverTimestamp(),
  });

  // 2. Create inventory_log entry
  const logRef = doc(collection(db, 'inventory_log'));
  batch.set(logRef, {
    itemId: item.id,
    action: 'restock',
    qtyChange: data.quantity,
    costSnapshotAgora: totalCostAgora,
    wacBeforeAgora: item.wacAgora,
    wacAfterAgora: newWAC,
    workOrderRef: null,
    reason: null,
    actorUid: auth.currentUser?.uid ?? '',
    timestamp: serverTimestamp(),
  });

  await batch.commit();
  toast.success(t('inventory.restock.success'));
};
```

**CRITICAL — Use `writeBatch` NOT individual writes.** Both the inventory update and the log entry must be atomic. If one fails, neither should persist. This prevents WAC/log inconsistencies.

[Source: Firebase Firestore best practices — atomic operations via batched writes]

### verifyWAC Cloud Function

**Location:** `functions/src/triggers/verifyWAC.ts`

**Pattern:** Follow `onTransactionApproved.ts` structure (same trigger pattern).

**Implementation outline:**
```typescript
import { onDocumentWritten } from 'firebase-functions/firestore';
import { getFirestore } from 'firebase-admin/firestore';
import * as logger from 'firebase-functions/logger';

/**
 * CRITICAL: WAC must be replayed step-by-step through log entries.
 * A simplified "sum all costs / total qty" approach breaks when consume/waste
 * entries exist (Story 6.3+). Replay approach is correct for ALL action types.
 */
function replayWAC(logs: FirebaseFirestore.QuerySnapshot): { qty: number; wac: number } {
  let qty = 0;
  let wacAgora = 0;

  for (const logDoc of logs.docs) {
    const entry = logDoc.data();
    if (entry.action === 'restock') {
      // Standard WAC recalculation on restock
      const totalQty = qty + entry.qtyChange;
      if (totalQty > 0) {
        wacAgora = Math.round((qty * wacAgora + entry.costSnapshotAgora) / totalQty);
      }
      qty = totalQty;
    } else if (entry.action === 'consume' || entry.action === 'waste') {
      // Consume/waste reduces qty but WAC stays the same
      qty += entry.qtyChange; // qtyChange is negative
    }
  }

  return { qty, wac: qty > 0 ? wacAgora : 0 };
}

export const verifyWAC = onDocumentWritten('inventory/{docId}', async (event) => {
  const before = event.data?.before?.data();
  const after = event.data?.after?.data();
  if (!after) return; // document deleted, skip

  // Guard: only verify if wacAgora actually changed (prevents infinite loop)
  if (before && before.wacAgora === after.wacAgora) return;

  const docId = event.params.docId;
  const db = getFirestore();

  // Query all inventory_log entries for this item, ordered by timestamp
  const logs = await db.collection('inventory_log')
    .where('itemId', '==', docId)
    .orderBy('timestamp', 'asc')
    .get();

  if (logs.empty) return; // No log entries yet (initial create)

  const { wac: serverWAC } = replayWAC(logs);
  const clientWAC = after.wacAgora;

  if (Math.abs(serverWAC - clientWAC) > 1) {
    logger.warn(`WAC divergence for ${docId}: client=${clientWAC}, server=${serverWAC}. Correcting.`);
    await event.data?.after?.ref.update({ wacAgora: serverWAC });
  } else {
    logger.info(`WAC verified for ${docId}: ${clientWAC} (diff: ${Math.abs(serverWAC - clientWAC)})`);
  }
});
```

**CRITICAL — Prevent infinite loop:** The `onDocumentWritten` trigger fires on ANY write to `inventory`, including updates made by this Cloud Function itself. The guard is implemented above: compare `before.wacAgora === after.wacAgora` — if WAC didn't change, skip verification entirely. This covers both the self-update case and no-op updates.

**Register in `functions/src/index.ts`:**
```typescript
export { verifyWAC } from './triggers/verifyWAC.js';
```

**Server-side `inventoryLogSchema` in `functions/src/shared/schemas.ts`:**
```typescript
// Server-side inventory log schema (uses z.any() for Firestore Timestamps)
export const INVENTORY_LOG_ACTIONS = ['restock', 'consume', 'waste'] as const;

export const inventoryLogSchema = z.object({
  itemId: z.string(),
  action: z.enum(INVENTORY_LOG_ACTIONS),
  qtyChange: z.number(),
  costSnapshotAgora: z.number().int(),
  wacBeforeAgora: z.number().int(),
  wacAfterAgora: z.number().int(),
  workOrderRef: z.string().nullable(),
  reason: z.string().nullable(),
  actorUid: z.string(),
  timestamp: z.any(), // Firestore Timestamp
});

export type InventoryLogEntry = z.infer<typeof inventoryLogSchema>;
```
Follow existing pattern: server-side schemas use `z.any()` for Timestamps (Admin SDK returns Timestamp objects, not JS Dates).

[Source: architecture.md — Cloud Functions Inventory; Firebase docs — `onDocumentWritten` for create+update+delete; functions/src/shared/schemas.ts pattern]

### Project Structure Notes

**New files to create:**
```
src/lib/wac.ts                                         # Replace placeholder with calculateWAC + applyScoopCost
src/lib/wac.test.ts                                    # Co-located WAC tests
src/features/inventory/components/RestockForm.tsx       # Restock form component
src/features/inventory/components/RestockForm.module.scss
src/features/inventory/components/RestockForm.test.tsx
functions/src/triggers/verifyWAC.ts                    # Server-side WAC verification
functions/src/triggers/verifyWAC.test.ts               # Cloud Function tests
```

**Files to modify:**
```
src/types/inventory.ts          # Add InventoryLogEntry, inventoryLogSchema, restockInputSchema
src/types/inventory.test.ts     # Add schema validation tests for new types
src/features/inventory/InventoryPage.tsx          # Add restock mode + batch write handler
src/features/inventory/InventoryPage.test.tsx     # Add restock flow tests
src/features/inventory/components/InventoryTable.tsx   # Add "Restock" row action button
src/features/inventory/components/InventoryTable.test.tsx
src/features/inventory/components/index.ts        # Export RestockForm
src/i18n/en.json                                  # Add inventory.restock.* keys
src/i18n/he.json                                  # Add inventory.restock.* keys (Hebrew)
functions/src/index.ts                            # Export verifyWAC
functions/src/shared/schemas.ts                   # Add inventoryLogSchema (server-side copy)
```

**Files that already exist and must NOT be recreated:**
| Component | Location | Reuse For |
|---|---|---|
| `Button` | `src/components/Button/Button.tsx` | Form submit/cancel, "Restock" row action |
| `Input` | `src/components/Input/Input.tsx` | Quantity, Total Cost fields |
| `Select` | `src/components/Input/Select.tsx` | Material searchable selector |
| `Card` | `src/components/Card/Card.tsx` | Form container |
| `toast` | `src/stores/useUIStore.ts` | Success/error notifications |
| `formatCurrency` | `src/lib/currency.ts` | Unit cost preview display |
| `toMinorUnits` | `src/lib/currency.ts` | ILS → agora conversion on submit |
| `toDisplayAmount` | `src/lib/currency.ts` | Agora → ILS for display |
| `useFirestoreCollection` | `src/hooks/useFirestoreCollection.ts` | NOT needed for log (write-only) |
| `useInventoryStore` | `src/stores/useInventoryStore.ts` | Existing store — do NOT modify |
| `db` | `src/services/firebase.ts` | Firestore instance |
| `auth` | `src/services/firebase.ts` | Get current user UID for actorUid |

### Critical Import Patterns (from Story 6.1)

```typescript
// Types + schemas
import type { InventoryItem, InventoryLogEntry } from '@/types';
import { restockInputSchema, type RestockInput } from '@/types';

// WAC
import { calculateWAC } from '@/lib/wac';

// Currency
import { formatCurrency, toMinorUnits, toDisplayAmount } from '@/lib/currency';

// Store (DO NOT modify store — read-only from components)
import { useInventoryStore } from '@/stores';

// Firestore
import { writeBatch, doc, collection, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/services/firebase';

// Forms
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

// Components
import { Button, Card, Input, Select } from '@/components';

// Icons (Phosphor only)
import { ArrowCounterClockwise, Plus, Package } from '@phosphor-icons/react';

// i18n
import { useTranslation } from 'react-i18next';

// Toast
import { toast } from '@/stores/useUIStore';
```

### Testing Patterns (from Story 6.1)

**Framework:** Vitest + React Testing Library
**Co-located:** `*.test.ts` / `*.test.tsx` next to source files
**SCSS auto-import:** Global variables/mixins auto-imported — no explicit `@use` statements

**Mock Firestore:**
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
  calculateWAC: vi.fn(() => 5000), // return predictable value
}));
```

### SCSS Patterns

- Use `$error` for red/destructive — `$danger` does NOT exist
- CSS logical properties for RTL (`margin-inline-start`, `padding-inline-end`)
- Touch targets ≥ 44px on mobile
- Follow `InventoryForm.module.scss` patterns for the restock form
- No explicit `@use` statements — globals auto-imported

### Cross-Epic Context

- **Epic 2 (Story 2.4):** Nutrition Label has `Inventory Costs / Scoops` placeholder at ₪0. This story does NOT update it — that happens in Story 6.3 (Scoop).
- **Epic 5 (Story 5.4):** `onTransactionApproved` handles `InventoryRestock` category transactions — those trigger from the AI email pipeline and are separate from this manual restock flow.
- `inventory_log` with `action: 'restock'` entries created here will be consumed by Story 6.4 (Audit Log).

### Zod v4 Reminders

- Use `{ error: "message" }` NOT `{ message: "message" }` for custom error strings
- Use `z.string().nullable().default(null)` for optional fields stored as null in Firestore
- No `.default()` on form schemas — form provides defaults via `defaultValues` to avoid Zod 4 input/output type divergence

### Performance Requirement

- WAC calculation must complete < 500ms client-side (NFR5)
- This is trivially achievable with pure integer math — just don't introduce async or network calls in the calculation path

### References

- [Source: epics.md — Epic 6, Story 6.2: Restock & WAC Recalculation]
- [Source: architecture.md — Data Architecture: WAC Calculation, inventory_log collection]
- [Source: architecture.md — Cloud Functions: verifyWAC trigger]
- [Source: architecture.md — lib/wac.ts: calculateWAC, applyScoopCost]
- [Source: architecture.md — Naming: Integer currency fields suffix with Agora]
- [Source: architecture.md — Non-Functional Requirements: Scoop calc < 500ms]
- [Source: 6-1-inventory-data-model-item-management.md — Dev Notes, Code Patterns, Review Fixes]
- [Source: Firebase docs — onDocumentWritten trigger, writeBatch for atomic operations]

## Dev Agent Record

### Agent Model Used

Claude claude-4.6-opus (Cursor IDE)

### Debug Log References

- No HALT conditions encountered during implementation.
- All tests passed on first attempt except minor mock coverage gaps (Phosphor icons needed full transitive mocking) — fixed immediately.

### Completion Notes List

- **Task 1:** Implemented `calculateWAC` and `applyScoopCost` in `src/lib/wac.ts` with 16 comprehensive tests covering all edge cases (first restock, zero cost dilution, single unit, large quantities, rounding precision). All results match manual calculations within 1 agora.
- **Task 2:** Added `InventoryLogEntry`, `inventoryLogSchema`, `RestockInput`, and `restockInputSchema` to `src/types/inventory.ts`. Added 18 new schema validation tests covering all action types, field constraints, and edge cases.
- **Task 3:** Built `RestockForm` component with searchable material selector (pre-selected when invoked from row action), quantity/cost inputs using `setValueAs` transforms (per Story 6.1 pattern), real-time unit cost preview, and Zod validation. 9 tests covering rendering, pre-selection, submission, validation errors, and cancel.
- **Task 4:** Extended `InventoryPage` FormMode union with `restock` mode. Implemented `handleRestock` using `writeBatch` for atomic Firestore operations (inventory update + inventory_log creation). Added "Restock" action button to `InventoryTable` with `e.stopPropagation()` to prevent row click interference. 8 new tests across InventoryPage and InventoryTable.
- **Task 5:** Created `verifyWAC` Cloud Function with `onDocumentWritten` trigger on `inventory/{docId}`. Implements step-by-step WAC replay from inventory_log entries. Guards against infinite loops (wacAgora unchanged check) and handles all action types (restock/consume/waste). 9 tests. Added server-side `inventoryLogSchema` to `functions/src/shared/schemas.ts`.
- **Task 6:** Added `inventory.restock.*` i18n keys to both `en.json` and `he.json` (13 keys each). Updated `components/index.ts` barrel export to include `RestockForm`.

### Change Log

- **2026-02-14:** Story 6.2 implemented — WAC calculation utility, inventory log schema, restock form, InventoryPage integration, verifyWAC Cloud Function, i18n keys, barrel exports. All 6 tasks complete. Full regression suite passes (914 client tests, 143 functions tests).
- **2026-02-14:** Code review completed. Fixes applied: (M1) Added auth guard to handleRestock — returns early with error toast if no authenticated user, prevents empty actorUid in inventory_log. (M2) Strengthened InventoryPage restock test — now verifies batch.update and batch.set arguments (item update fields, log entry fields). (M3) Added unit cost preview behavior test to RestockForm — verifies preview updates from dash to calculated value when inputs change. (L1) Documented verifyWAC double-trigger behavior — added comment explaining expected second invocation on divergence correction. Full regression: 915 client tests, 143 functions tests — all passing.

### File List

**New files:**
- `src/lib/wac.ts` — WAC calculation utility (calculateWAC + applyScoopCost)
- `src/lib/wac.test.ts` — Co-located WAC tests (16 tests)
- `src/features/inventory/components/RestockForm.tsx` — Restock form component
- `src/features/inventory/components/RestockForm.module.scss` — Restock form styles
- `src/features/inventory/components/RestockForm.test.tsx` — RestockForm tests (9 tests)
- `functions/src/triggers/verifyWAC.ts` — Server-side WAC verification Cloud Function
- `functions/tests/verifyWAC.test.ts` — verifyWAC tests (9 tests)

**Modified files:**
- `src/types/inventory.ts` — Added InventoryLogEntry, inventoryLogSchema, RestockInput, restockInputSchema
- `src/types/inventory.test.ts` — Added inventoryLogSchema + restockInputSchema validation tests (18 new)
- `src/features/inventory/InventoryPage.tsx` — Added restock FormMode, handleRestock (batch write), handleRestockClick
- `src/features/inventory/InventoryPage.test.tsx` — Added restock flow tests (4 new)
- `src/features/inventory/components/InventoryTable.tsx` — Added onRestock prop, Restock action button column
- `src/features/inventory/components/InventoryTable.test.tsx` — Added restock button tests (4 new)
- `src/features/inventory/components/index.ts` — Added RestockForm export
- `src/i18n/en.json` — Added inventory.restock.* keys
- `src/i18n/he.json` — Added inventory.restock.* keys (Hebrew)
- `functions/src/index.ts` — Added verifyWAC export
- `functions/src/shared/schemas.ts` — Added inventoryLogSchema (server-side copy)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — Updated 6-2 status
- `_bmad-output/implementation-artifacts/6-2-restock-wac-recalculation.md` — This story file
