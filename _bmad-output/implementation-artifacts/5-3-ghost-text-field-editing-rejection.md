# Story 5.3: Ghost Text Field Editing & Rejection

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **Gal (Financial Operator)**,
I want to edit incorrect AI suggestions inline and reject irrelevant transactions,
So that I can correct misclassifications without re-entering data from scratch.

## Acceptance Criteria

1. **Ghost Text Field Component**: When a Ghost Text field is in AI-suggested state (default), it renders with `$text-muted` (50% gold) italic text, dashed `$border-subtle` border, and `$bg-tertiary` background. Hovering brightens the border slightly.

2. **Edit Mode Activation**: When Gal presses `E`, Tabs to a field, or clicks a Ghost Text field:
   - Edit mode activates: border changes from dashed to solid `$gold`, text changes from `$text-muted` italic to `$text-primary` normal weight, cursor appears in the field
   - The existing AI-suggested value remains in the field (never cleared — user edits within the suggestion)

3. **Category Searchable Dropdown**: When the Category Ghost Text field is activated in edit mode:
   - A searchable dropdown overlay opens below the field with options: Direct Cost, Inventory Restock, Overhead, Revenue, Personal
   - Typing filters the list (fuzzy matching: "dir" matches "Direct Cost")
   - Selecting an option updates the field and shows solid `$gold` border + checkmark (✓)

4. **Project Searchable Dropdown**: When the Project Ghost Text field is activated in edit mode:
   - A searchable dropdown opens with all Work Orders (name + status)
   - Fuzzy search: "david" matches "David's Game"
   - Selecting a Work Order updates the `suggestedWorkOrderId`

5. **User-Edited Visual State**: When a Ghost Text field has been user-edited:
   - It shows: solid `$gold` border, `$text-primary` bright text (non-italic), a small checkmark (✓) indicator
   - This visual state clearly distinguishes "human-verified" from "AI-suggested"

6. **Read-Only Fields**: Vendor and Amount fields are read-only (from the AI/document) — not editable in Ghost Text flow, styled with no dashed border, solid muted border.

7. **Confirm with Edits**: When Gal presses Enter to confirm a card with edited fields:
   - All field values (original AI + user edits) are saved to the Firestore transaction document
   - The transaction `status` updates to `'approved'`
   - Any changed fields are included in the `updateDoc` payload (category, suggestedWorkOrderId/workOrderId)
   - The same gold glow → solidify → exit animation sequence from Story 5.2 applies

8. **Reject Flow**: When Gal presses `Delete` or clicks Reject:
   - A brief confirmation dialog appears: "Reject this item? It will be archived." with Cancel and Reject buttons
   - On confirm: transaction `status` updates to `'rejected'` in Firestore via `updateDoc`
   - The card fades out with a subtle red border flash animation
   - A toast confirms: `t('review.ghostText.rejected')` ("Transaction rejected")

9. **Reject Persistence**: When a transaction is rejected:
   - It is removed from the pending queue (automatic via `usePendingReview` Firestore listener)
   - It remains in Firestore with `status: 'rejected'` (not deleted — audit trail preserved)
   - The pending count decrements automatically

10. **Escape Layering**: When Escape is pressed:
    - If a dropdown is open → close the dropdown only
    - If no dropdown is open → close the Ghost Text Card (existing behavior)
    - Click-away also closes dropdowns

11. **Mobile Responsive**: On mobile (< 768px):
    - Ghost Text fields are full-width with appropriate padding
    - Searchable dropdowns render full-width below the field
    - Touch targets >= 44px height
    - CSS logical properties for RTL support throughout

## Tasks / Subtasks

- [x] Task 1: Create `GhostTextField` component (AC: #1, #2, #3, #4, #5, #6, #11)
  - [x] Create `src/features/review/components/GhostTextField.tsx`
  - [x] Create `src/features/review/components/GhostTextField.module.scss`
  - [x] Props: `label`, `value`, `type: 'category' | 'project' | 'readonly'`, `options: SelectOption[]`, `isEdited: boolean`, `onChange: (value: string) => void`, `onDropdownToggle: (isOpen: boolean) => void`
  - [x] Default state: dashed `$border-subtle` border, `$text-muted` italic, `$bg-tertiary` — matches existing `.ghostField` styling
  - [x] Hover state: border brightens slightly (`$border-subtle` → `$gold-light` at 40%)
  - [x] Click/focus activates edit mode: solid `$gold` border, text changes to `$text-primary`, AI value stays in the field
  - [x] Edit mode for `category`/`project` types: reuse existing `Select` component from `@/components/Input/Select` with `searchable={true}`
  - [x] User-edited state: solid `$gold` border, `$text-primary` non-italic, checkmark ✓ indicator
  - [x] Readonly type: solid muted border, no dashed, no hover effect, not clickable
  - [x] Report dropdown open/close state to parent via `onDropdownToggle` for Escape key layering
  - [x] Mobile: full-width, 44px min touch target, logical CSS properties for RTL
  - [x] Export from `src/features/review/components/index.ts`
  - [x] Create co-located test: `GhostTextField.test.tsx`

- [x] Task 2: Create `RejectConfirmDialog` component (AC: #8)
  - [x] Create `src/features/review/components/RejectConfirmDialog.tsx`
  - [x] Create `src/features/review/components/RejectConfirmDialog.module.scss`
  - [x] Render a small inline confirmation within the card: "Reject this item? It will be archived." with Cancel and Reject buttons
  - [x] Cancel returns to normal card view; Reject triggers rejection
  - [x] Use existing `Button` component: Cancel (variant="secondary"), Reject (variant="danger")
  - [x] Focus trap within the dialog buttons
  - [x] Accessible: `role="alertdialog"`, `aria-describedby` pointing to the message
  - [x] Export from `src/features/review/components/index.ts`
  - [x] Create co-located test: `RejectConfirmDialog.test.tsx`

- [x] Task 3: Create `useRejectTransaction` hook (AC: #8, #9)
  - [x] Create `src/features/review/hooks/useRejectTransaction.ts`
  - [x] Accept `transactionId: string` parameter
  - [x] Use `updateDoc` from `firebase/firestore` to set `status: 'rejected'` and `updatedAt: serverTimestamp()`
  - [x] Return `{ reject, isRejecting }` — `reject` is the async action, `isRejecting` is loading state
  - [x] On success: call `toast.success(t('review.ghostText.rejected'))`
  - [x] On error: call `toast.error(t('review.ghostText.rejectError'))`, do NOT close card
  - [x] Export from `src/features/review/hooks/index.ts`
  - [x] Create co-located test: `useRejectTransaction.test.ts`

- [x] Task 4: Update `GhostTextCard` to use `GhostTextField` and support edit mode (AC: #1, #2, #3, #4, #5, #6, #7, #8, #10)
  - [x] Replace static ghost text field divs with `GhostTextField` components
  - [x] Add `editMode: boolean` prop — when true, ghost text fields become editable
  - [x] Add `editedCategory: TransactionCategory | null` and `editedProjectId: string | null` props for tracking edited values
  - [x] Add `onCategoryChange: (value: TransactionCategory) => void` and `onProjectChange: (projectId: string) => void` callbacks
  - [x] Add `onDropdownToggle: (isOpen: boolean) => void` prop to report dropdown state for Escape layering
  - [x] Add `showRejectConfirm: boolean` and `onRejectCancel: () => void` props for reject dialog
  - [x] Pass `isRejecting: boolean` prop for reject button loading state
  - [x] Render `RejectConfirmDialog` when `showRejectConfirm` is true (replaces action buttons area)
  - [x] Category field options: mapped from `TransactionCategory` via i18n keys
  - [x] Project field options: mapped from `useWorkOrderStore` work orders (value=id, label=name + status)
  - [x] Update existing tests in `GhostTextCard.test.tsx`

- [x] Task 5: Update `useGhostTextKeyboard` for edit mode and Escape layering (AC: #2, #10)
  - [x] Add `isEditing: boolean` option — when true, `E` key does NOT trigger `onEdit` (user is typing in a field)
  - [x] Add `isDropdownOpen: boolean` option — when true, Escape closes dropdown (calls `onCloseDropdown`) instead of closing the card
  - [x] Add `onCloseDropdown: () => void` callback
  - [x] When `isEditing` is true: only handle `Escape` (to close dropdown or card) and `Enter` (to confirm) — do NOT intercept letter keys, arrow keys, or Delete (they're needed for text input and dropdown navigation)
  - [x] Update existing tests in `useGhostTextKeyboard.test.ts`

- [x] Task 6: Update `ReviewPage` to integrate edit mode and reject flow (AC: #2, #7, #8, #9, #10)
  - [x] Add state: `isEditing: boolean`, `editedCategory: TransactionCategory | null`, `editedProjectId: string | null`, `showRejectConfirm: boolean`, `isDropdownOpen: boolean`
  - [x] Import and use `useRejectTransaction` hook
  - [x] `handleEdit`: set `isEditing = true` (replaces "coming soon" toast)
  - [x] `handleReject`: set `showRejectConfirm = true` (replaces "coming soon" toast)
  - [x] `handleRejectConfirm`: call `useRejectTransaction.reject()`, on success play red flash exit animation, advance to next item
  - [x] `handleRejectCancel`: set `showRejectConfirm = false`
  - [x] `handleConfirm`: if edited values exist, include them in the Firestore `updateDoc` payload (extend `useConfirmTransaction` or do an inline `updateDoc`)
  - [x] `handleCategoryChange`: update `editedCategory` state
  - [x] `handleProjectChange`: update `editedProjectId` state
  - [x] `handleDropdownToggle`: update `isDropdownOpen` state
  - [x] Pass `isEditing`, `isDropdownOpen` to `useGhostTextKeyboard`
  - [x] Reset edit state when navigating to next/previous item or closing
  - [x] Update `ReviewPage.test.tsx` with edit and reject integration tests

- [x] Task 7: Update `useConfirmTransaction` to accept edited fields (AC: #7)
  - [x] Extend the hook to accept optional `overrides: { category?: TransactionCategory; workOrderId?: string }` parameter
  - [x] When overrides are provided, include them in the `updateDoc` payload alongside `status: 'approved'`
  - [x] If `workOrderId` is overridden, also clear `suggestedWorkOrderId` and set `workOrderId` to the selected value
  - [x] Update existing tests in `useConfirmTransaction.test.ts`

- [x] Task 8: Add rejection animation keyframe (AC: #8)
  - [x] Add `rejectFlash` keyframe to `src/styles/_animations.scss` (subtle red `$error` border flash, 200ms)
  - [x] Add `rejectExiting` animation phase to `GhostTextCard.module.scss` (red border flash → slideDownFadeOut)

- [x] Task 9: Add i18n keys for editing and rejection (AC: #3, #4, #8)
  - [x] Add to `src/i18n/en.json`:
    - `review.ghostText.rejected`: "Transaction rejected"
    - `review.ghostText.rejectError`: "Failed to reject transaction"
    - `review.ghostText.rejectConfirmTitle`: "Reject this item?"
    - `review.ghostText.rejectConfirmMessage`: "It will be archived."
    - `review.ghostText.cancel`: "Cancel"
    - `review.ghostText.editMode`: "Edit mode"
    - `review.ghostText.fieldEdited`: "Edited"
  - [x] Add matching Hebrew translations to `src/i18n/he.json`:
    - `review.ghostText.rejected`: "העסקה נדחתה"
    - `review.ghostText.rejectError`: "שגיאה בדחיית העסקה"
    - `review.ghostText.rejectConfirmTitle`: "לדחות פריט זה?"
    - `review.ghostText.rejectConfirmMessage`: "הוא יועבר לארכיון."
    - `review.ghostText.cancel`: "ביטול"
    - `review.ghostText.editMode`: "מצב עריכה"
    - `review.ghostText.fieldEdited`: "נערך"

## Dev Notes

### Architecture & Patterns

- **Data flow for edits**: User enters edit mode → selects new category/project from dropdown → edited values stored in ReviewPage state (`editedCategory`, `editedProjectId`) → on Enter/Confirm, `useConfirmTransaction` includes overrides in `updateDoc` → Firestore listener auto-updates pending list
- **Data flow for rejection**: User presses Delete → `showRejectConfirm = true` → inline confirmation dialog renders → user clicks Reject → `useRejectTransaction.reject()` calls `updateDoc(status: 'rejected')` → red flash animation → card exits → Firestore listener removes item from pending list
- **State management**: NO new Zustand store. All edit state lives in `ReviewPage` via `useState`. The `GhostTextField` component is controlled (value + onChange). Dropdown open state flows up to `ReviewPage` for keyboard Escape layering.
- **Feature isolation**: All new files go under `src/features/review/`. Import shared components from `@/components`, stores from `@/stores`, utilities from `@/lib`, types from `@/types`, services from `@/services`. NEVER import from other feature directories.

### Existing Components to Reuse (DO NOT recreate)

| Component | Location | Usage |
|---|---|---|
| `Select` | `@/components/Input/Select` | Searchable dropdown for Category and Project fields. Already supports `searchable`, `options`, `value`, `onChange`, portal dropdown, keyboard nav (ArrowUp/Down, Enter, Escape), click-outside close. |
| `Button` | `@/components/Button` | Cancel (secondary), Reject (danger) in confirmation dialog. Confirm (primary) in action buttons. |
| `Badge` | `@/components/Badge` | "Estimated" badge (already in GhostTextCard) |
| `toast` | `@/stores/useUIStore` | `toast.success()`, `toast.error()` for rejection notifications. Import: `import { toast } from '@/stores/useUIStore'` |

### Existing Utilities to Use (DO NOT recreate)

| Utility | Location | Usage |
|---|---|---|
| `formatCurrency(amountAgora, currency)` | `@/lib/currency` | Already used in GhostTextCard header |
| `relativeTime(date, undefined, t)` | `@/lib/dates` | Already used in GhostTextCard header |
| `useFirestoreCollection` | `@/hooks` | Already used by `usePendingReview` — DO NOT add another listener |
| `selectWorkOrderById` | `@/stores/useWorkOrderStore` | Already used in GhostTextCard for project name resolution |

### Existing Store (DO NOT recreate or modify)

`useTransactionStore` already has everything needed:
- `transactions: Transaction[]` — holds all loaded transactions
- `selectPendingReview` — filters `status === 'pending_review'`
- Store auto-updates when Firestore documents change. Do NOT manually remove items after confirmation or rejection.

`useWorkOrderStore` provides work order data for project dropdown:
- `workOrders: WorkOrder[]` — all work orders
- `selectWorkOrderById(id)` — find single work order by ID
- WorkOrder fields: `id`, `name` (clientName), `status` ('Lead' | 'Design' | 'Production' | 'Shipped')

### Transaction Fields Relevant to This Story

From `src/types/transaction.ts`:
- `category: TransactionCategory` — editable via Category dropdown. Type: `'DirectCost' | 'InventoryRestock' | 'Overhead' | 'Revenue' | 'Personal'`
- `suggestedWorkOrderId: string | null` — AI-suggested work order, editable via Project dropdown
- `workOrderId: string | null` — confirmed work order link (set when user manually selects)
- `status: 'pending_review' | 'approved' | 'rejected'` — update to `'approved'` or `'rejected'`

### Firestore Update Patterns

**Confirm with edits:**
```typescript
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/services';

const updates: Record<string, unknown> = {
  status: 'approved',
  updatedAt: serverTimestamp(),
};

if (editedCategory) {
  updates.category = editedCategory;
}
if (editedProjectId) {
  updates.workOrderId = editedProjectId;
  updates.suggestedWorkOrderId = editedProjectId;
}

await updateDoc(doc(db, 'transactions', transactionId), updates);
```

**Reject:**
```typescript
await updateDoc(doc(db, 'transactions', transactionId), {
  status: 'rejected',
  updatedAt: serverTimestamp(),
});
```

Do NOT update the store manually. The `usePendingReview` hook's `onSnapshot` listener will detect changes and update the store automatically.

### Select Component Integration for Ghost Text Fields

The existing `Select` component at `@/components/Input/Select` already supports:
- `searchable={true}` — enables search input in dropdown
- `options: SelectOption[]` — `{ value: string; label: string }`
- `value: string` — current selected value
- `onChange: (value: string) => void` — selection callback
- Portal rendering via `createPortal(dropdown, document.body)`
- Keyboard navigation: ArrowUp/Down, Enter to select, Escape to close
- Click-outside to close dropdown

**IMPORTANT**: The `Select` component uses `includes()` for filtering, not fuzzy matching. The epics specify fuzzy matching ("dir" → "Direct Cost"). Options:
1. **Simplest**: Use `includes()` as-is — it already handles "dir" → "Direct Cost" since "dir" is contained in "Direct Cost". This covers most cases.
2. **If needed**: Extend `Select` to accept a custom `filterFn` prop for advanced fuzzy matching.

Recommendation: Use `includes()` as-is — it satisfies the AC for the examples given ("dir" matches "Direct Cost", "david" matches "David's Game").

**Wrapping Select for Ghost Text styling**: Create `GhostTextField` as a wrapper that:
1. Shows the read-only ghost text display (dashed border, muted) by default
2. On click/focus, replaces display with `Select` component in searchable mode
3. After selection, shows the user-edited state (solid gold, checkmark)

### Category Options Mapping

```typescript
import type { TransactionCategory } from '@/types';
import type { SelectOption } from '@/components/Input/Select';

const CATEGORY_OPTIONS: SelectOption[] = [
  { value: 'DirectCost', label: t('transactions.category.DirectCost') },
  { value: 'InventoryRestock', label: t('transactions.category.InventoryRestock') },
  { value: 'Overhead', label: t('transactions.category.Overhead') },
  { value: 'Revenue', label: t('transactions.category.Revenue') },
  { value: 'Personal', label: t('transactions.category.Personal') },
];
```

These i18n keys already exist in `en.json` / `he.json` (added in earlier stories).

### Project Options Mapping

```typescript
import { useWorkOrderStore } from '@/stores';
import type { SelectOption } from '@/components/Input/Select';

const workOrders = useWorkOrderStore((state) => state.workOrders);

const projectOptions: SelectOption[] = workOrders.map((wo) => ({
  value: wo.id,
  label: `${wo.name} (${wo.status})`,
}));
```

### Keyboard Behavior Changes for Edit Mode

The `useGhostTextKeyboard` hook currently intercepts all key events (Enter, E, Delete, Escape, arrows) at the document level. In edit mode, this must change:

**When `isEditing = false` (current behavior):**
- `Enter` → confirm, `E` → enter edit mode, `Delete` → reject, `Escape` → close card, arrows → navigate

**When `isEditing = true` (new behavior):**
- `Enter` → confirm (still works — the Select component handles Enter for option selection internally via React event bubbling, so the document-level Enter fires after the Select has processed it)
- `E` key → **DO NOT intercept** (user may be typing in search field)
- `Delete` key → **DO NOT intercept** (user may be deleting text in search field)
- Arrow keys → **DO NOT intercept** (Select uses ArrowUp/Down for option navigation)
- `Escape` → if dropdown open, close dropdown; if dropdown closed, close card

**Critical**: The existing `useGhostTextKeyboard` already ignores events when `event.target` is `INPUT`, `TEXTAREA`, or `SELECT`. When a `Select` dropdown is open with `searchable`, the search `<input>` will be focused, so most keys will naturally be ignored. However, the `isEditing` flag provides an additional safety layer for edge cases where the input might not be focused but edit mode is active.

### Escape Key Layering Logic

```typescript
// In useGhostTextKeyboard
case 'Escape':
  e.preventDefault();
  if (isDropdownOpen) {
    onCloseDropdown?.();  // Close dropdown only
  } else {
    onClose();  // Close entire card
  }
  break;
```

The `onDropdownToggle` callback from `GhostTextField` reports dropdown state to `ReviewPage`, which passes `isDropdownOpen` to `useGhostTextKeyboard`.

### Reject Flow Animation Sequence

1. **Show confirmation dialog**: Replace action buttons with `RejectConfirmDialog`
2. **On reject confirm**: Set animation phase to `'rejectExiting'`
3. **Phase 1 — Red Flash** (200ms): Apply `$error` border color pulse via CSS
4. **Phase 2 — Card Exit** (300ms): `slideDownFadeOut` keyframe
5. After exit: advance to next item or clear selection

### Reject Confirmation Dialog Pattern

The dialog renders inline within the `GhostTextCard` (NOT as a separate modal/overlay). It replaces the action buttons section:

```tsx
{showRejectConfirm ? (
  <RejectConfirmDialog
    onCancel={onRejectCancel}
    onConfirm={onReject}
    isRejecting={isRejecting}
  />
) : (
  <div className={styles.actionButtons}>
    {/* Confirm, Edit, Reject buttons */}
  </div>
)}
```

### Animation Phase Extension

Extend the `AnimationPhase` type in `ReviewPage`:

```typescript
type AnimationPhase = 'idle' | 'glowing' | 'solidifying' | 'exiting' | 'rejectExiting';
```

In `GhostTextCard.module.scss`:
```scss
&.rejectExiting {
  @include motion-safe {
    border-color: $error;
    animation: rejectFlash 200ms ease, slideDownFadeOut 300ms ease 200ms both;
  }
}
```

### SCSS Patterns

- Use SCSS Modules (`.module.scss`) — import as `styles`
- `_variables.scss` is auto-imported via Vite `additionalData` — do NOT add `@use '@/styles/variables'`. Tokens like `$gold`, `$bg-primary`, `$text-muted` are available without explicit import.
- Mixins DO need explicit `@use '@/styles/mixins' as *;`
- Ghost Text field states:
  - AI-suggested (default): dashed `$border-subtle`, `$text-muted` italic, `$bg-tertiary`
  - Hover: border `rgba($gold-light, 0.4)`
  - Editing: solid `$gold` border, `$text-primary`
  - User-edited: solid `$gold` border, `$text-primary` non-italic, ✓ checkmark
  - Read-only: solid `$border-subtle` (non-dashed), no hover, not clickable
- RTL: use CSS logical properties exclusively (`padding-inline-start`, `margin-inline-end`, `border-inline-start`). NEVER use `left`/`right`.
- Touch targets: min 44px height on all interactive elements
- Transitions: `$transition-fast` (150ms) for hover, `$transition-normal` (300ms) for state changes

### Naming Conventions

- Component files: `PascalCase.tsx` + `PascalCase.module.scss`
- SCSS class names: `camelCase` (e.g., `.ghostTextField`, `.editMode`, `.userEdited`, `.rejectDialog`)
- Hook files: `camelCase.ts` (e.g., `useRejectTransaction.ts`)
- i18n keys: dot-notation nested (e.g., `review.ghostText.rejected`)
- Test files: co-located `*.test.tsx` / `*.test.ts` next to the component/hook

### Testing Standards

- Co-located tests next to the component (e.g., `GhostTextField.test.tsx` alongside `GhostTextField.tsx`)
- Use Vitest + React Testing Library
- **GhostTextField tests**: renders AI-suggested state (dashed, muted, italic), activates edit mode on click, renders searchable dropdown, selecting option updates value and shows user-edited state (gold, checkmark), readonly type is not clickable, hover brightens border
- **RejectConfirmDialog tests**: renders message and buttons, Cancel calls onCancel, Reject calls onConfirm, shows loading state when isRejecting
- **useRejectTransaction tests**: calls `updateDoc` with `status: 'rejected'`, shows success toast, shows error toast on failure, sets `isRejecting` during operation
- **GhostTextCard updated tests**: renders GhostTextField components, edit mode props are passed through, reject confirmation dialog replaces actions when `showRejectConfirm` is true
- **useGhostTextKeyboard updated tests**: when `isEditing` is true, E/Delete/arrows are NOT intercepted; Escape closes dropdown when `isDropdownOpen` is true
- **ReviewPage integration tests**: clicking Edit enters edit mode, changing category/project updates state, confirming with edits passes overrides, clicking Reject shows confirmation dialog, confirming rejection updates Firestore, canceling rejection returns to normal view, Escape closes dropdown before card
- Mock Firestore: mock `firebase/firestore` module (`updateDoc`, `doc`, `serverTimestamp`)
- Run `tsc --noEmit` before considering complete — zero TypeScript errors

### Project Structure Notes

New files to create:
```
src/features/review/
  components/
    GhostTextField.tsx              # Editable Ghost Text field with searchable dropdown
    GhostTextField.module.scss      # Field styling for all states
    GhostTextField.test.tsx         # Field rendering and interaction tests
    RejectConfirmDialog.tsx         # Inline rejection confirmation
    RejectConfirmDialog.module.scss # Dialog styling
    RejectConfirmDialog.test.tsx    # Dialog behavior tests
    index.ts                        # Update barrel — add GhostTextField, RejectConfirmDialog
  hooks/
    useRejectTransaction.ts         # Firestore reject action
    useRejectTransaction.test.ts    # Reject hook tests
    index.ts                        # Update barrel — add useRejectTransaction
```

Files to modify:
```
src/features/review/components/GhostTextCard.tsx         # Replace static fields with GhostTextField, add edit/reject props
src/features/review/components/GhostTextCard.module.scss # Add rejectExiting animation phase
src/features/review/components/GhostTextCard.test.tsx    # Update tests for edit mode and reject dialog
src/features/review/hooks/useGhostTextKeyboard.ts        # Add isEditing, isDropdownOpen, onCloseDropdown
src/features/review/hooks/useGhostTextKeyboard.test.ts   # Add edit mode and dropdown layering tests
src/features/review/hooks/useConfirmTransaction.ts       # Accept optional overrides for edited fields
src/features/review/hooks/useConfirmTransaction.test.ts  # Test overrides in updateDoc payload
src/features/review/ReviewPage.tsx                       # Add edit state, reject flow, dropdown state
src/features/review/ReviewPage.test.tsx                  # Add edit and reject integration tests
src/i18n/en.json                                         # Add review.ghostText.rejected, rejectError, etc.
src/i18n/he.json                                         # Add matching Hebrew translations
src/styles/_animations.scss                              # Add rejectFlash keyframe
```

Files that already exist and should NOT be modified (unless adding barrel exports):
```
src/stores/useTransactionStore.ts          # Already has what's needed
src/stores/useWorkOrderStore.ts            # Read-only — use workOrders + selectWorkOrderById
src/stores/useUIStore.ts                   # toast.success/error already available
src/types/transaction.ts                   # Already has full schema with TransactionCategory
src/components/Input/Select.tsx            # Already supports searchable — reuse as-is
src/components/Button/Button.tsx           # Already supports variant + shortcut + loading
src/components/Badge/Badge.tsx             # Already in use
src/hooks/useFirestoreCollection.ts        # Already in use by usePendingReview
src/services/firebase.ts                   # Already exports db
```

### Previous Story Learnings (from Story 5.2)

1. **Animation phase management**: `useState<AnimationPhase>` with `setTimeout` chains works well for multi-phase animation sequences. Use the same pattern for the reject flash → exit sequence.
2. **Firestore update pattern**: `updateDoc` with `serverTimestamp()` is the correct pattern. `usePendingReview` listener auto-removes items. No manual store manipulation.
3. **Focus trap in GhostTextOverlay**: Already implements Tab cycling within card boundaries. When adding edit mode with Select dropdown (which uses portal rendering), the dropdown will be outside the focus trap. This is acceptable because the Select component manages its own keyboard navigation internally.
4. **`useGhostTextKeyboard` already ignores input elements**: The hook checks `event.target.tagName` against `INPUT`, `TEXTAREA`, `SELECT`. When a searchable Select dropdown is open, the search input is focused, so letter keys naturally pass through. The `isEditing` flag is an additional safety layer.
5. **SCSS auto-import**: `_variables.scss` is auto-imported via Vite `additionalData`. Do NOT add `@use '@/styles/variables'` — it causes duplicate CSS. Mixins DO need explicit `@use '@/styles/mixins' as *;`.
6. **Toast usage**: Import `toast` directly from `@/stores/useUIStore`. Call `toast.success(message)` — no hook needed.
7. **Store selectors**: Use targeted selectors like `useWorkOrderStore((state) => state.workOrders)` to minimize re-renders.
8. **relativeTime i18n**: Always pass `t` from `useTranslation()` to `relativeTime()`.
9. **Button shortcut prop**: `<Button shortcut="Enter">` renders a `<kbd>` element. Keep using this pattern.
10. **Portal z-index**: GhostTextOverlay uses `z-index: 100` for overlay, `z-index: 101` for card. The Select dropdown portal also needs appropriate z-index — check that Select's dropdown has sufficient z-index to appear above the overlay (it renders at `document.body` level, so stacking context should be fine, but verify).

### Git Intelligence (Recent Commits)

Most recent commits:
- `ac5fc7d` — Fix SCSS error: use `$error` token instead of undefined `$danger`
- `3d2f189` — Implement Story 5.1: Review Queue & Pending Items List with code review fixes

Key patterns from Story 5.1/5.2 implementation:
- `ReviewPage.tsx` manages `selectedTransactionId` and `animationPhase` as `useState`
- Edit/Reject handlers were placeholder toasts — now being replaced with real implementations
- `useConfirmTransaction` returns `{ confirm, isConfirming }` pattern — reuse same pattern for `useRejectTransaction`
- `GhostTextCard` uses `animationPhase` prop to drive CSS class application

### Scope Boundaries

**IN scope for this story:**
- `GhostTextField` component with AI-suggested, editing, user-edited, and readonly states
- Searchable dropdown for Category (5 options from TransactionCategory)
- Searchable dropdown for Project (from useWorkOrderStore work orders)
- Confirm with edited fields (include overrides in updateDoc payload)
- Reject flow with inline confirmation dialog
- Reject animation (red flash + exit)
- Escape key layering (dropdown → card)
- i18n for all new strings (EN + HE)

**OUT of scope (deferred to later stories):**
- Story 5.4: Cloud Function side effects (`onTransactionApproved`/`onTransactionRejected` triggers), audit trail documents
- Story 5.5: Batch approval ("Approve All"), full-screen mobile Ghost Text with swipe gestures
- Audit trail logging (before/after field changes) — this will be handled by Cloud Functions in Story 5.4

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Epic 5, Story 5.3, lines 1356-1420]
- [Source: _bmad-output/planning-artifacts/architecture.md — Frontend Architecture, Component Patterns, State Management, Animation Tiers]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — Ghost Text Review Flow, Edit path, Reject path, Keyboard shortcuts]
- [Source: _bmad-output/planning-artifacts/prd.md — FR24, FR25, FR26, FR27, FR28]
- [Source: _bmad-output/implementation-artifacts/5-2-ghost-text-card-core-confirmation-flow.md — Previous Story Learnings, Existing Components, Store Patterns, Animation Sequence, SCSS Patterns]
- [Source: src/features/review/components/GhostTextCard.tsx — Current ghost field rendering, CATEGORY_KEYS, animationPhase]
- [Source: src/features/review/components/GhostTextCard.module.scss — Current ghost field CSS states (.ghostField, .solidified)]
- [Source: src/features/review/ReviewPage.tsx — Current handleEdit/handleReject placeholders, animation state management]
- [Source: src/features/review/hooks/useConfirmTransaction.ts — updateDoc pattern for approval]
- [Source: src/features/review/hooks/useGhostTextKeyboard.ts — Current keyboard handler with INPUT/TEXTAREA/SELECT check]
- [Source: src/components/Input/Select.tsx — Searchable dropdown with portal, keyboard nav, click-outside]
- [Source: src/stores/useWorkOrderStore.ts — selectWorkOrderById, workOrders array]
- [Source: src/stores/useTransactionStore.ts — selectPendingReview, Transaction type]
- [Source: src/stores/useUIStore.ts — toast.success/error convenience API]
- [Source: src/types/transaction.ts — TransactionCategory type, Transaction schema]
- [Source: src/styles/_variables.scss — $gold, $shadow-glow, $text-muted, $border-subtle, $bg-tertiary, $error]
- [Source: src/styles/_animations.scss — Existing keyframes: goldGlow, fadeOut, slideDownFadeOut, scaleIn, fadeIn]
- [Source: src/styles/_mixins.scss — focus-ring, motion-safe, rtl, card-surface, smooth-transition]

## Dev Agent Record

### Agent Model Used

Claude claude-4.6-opus (Cursor)

### Debug Log References

- GhostTextCard test: `btn-secondary` assertion failed initially because RejectConfirmDialog also renders a secondary button. Fixed by checking for `btn-primary` absence and dialog-specific content instead.

### Completion Notes List

- **Task 1**: Created `GhostTextField` component with AI-suggested, editing, user-edited, and readonly states. Uses existing `Select` component for searchable dropdown. Auto-opens dropdown on activation via programmatic trigger click. Deactivates on focusout. 15 tests pass.
- **Task 2**: Created `RejectConfirmDialog` inline confirmation component with `role="alertdialog"`, Cancel (secondary) and Reject (danger) buttons. Auto-focuses cancel button. 7 tests pass.
- **Task 3**: Created `useRejectTransaction` hook mirroring `useConfirmTransaction` pattern. Sets `status: 'rejected'` via Firestore `updateDoc`. Includes double-rejection guard via ref. 7 tests pass.
- **Task 4**: Updated `GhostTextCard` to conditionally render `GhostTextField` components when `editMode` is true (static display otherwise). Added `AnimationPhase` type export with `'rejectExiting'`. Added `RejectConfirmDialog` rendering when `showRejectConfirm` is true. Category/project options built from i18n keys and `useWorkOrderStore`. 24 tests pass.
- **Task 5**: Extended `useGhostTextKeyboard` with `isEditing`, `isDropdownOpen`, and `onCloseDropdown`. When editing, only Enter and Escape are intercepted. Escape layering: dropdown open → close dropdown; otherwise → close card. 21 tests pass.
- **Task 6**: Updated `ReviewPage` with edit state (`isEditing`, `editedCategory`, `editedProjectId`, `isDropdownOpen`) and reject state (`showRejectConfirm`). `handleEdit` activates edit mode. `handleReject` shows confirmation. `handleRejectConfirm` calls reject + plays red flash animation + advances. Edit state resets on navigation/close. Confirm passes overrides to `useConfirmTransaction`. 13 tests pass.
- **Task 7**: Extended `useConfirmTransaction` to accept optional `ConfirmOverrides` parameter (`category`, `workOrderId`). When `workOrderId` is overridden, both `workOrderId` and `suggestedWorkOrderId` are set. 10 tests pass.
- **Task 8**: Added `rejectFlash` keyframe to `_animations.scss` (hardcoded `$error` color for consistency with `goldGlow` pattern). Added `.rejectExiting` class to `GhostTextCard.module.scss` with flash + slideDownFadeOut sequence.
- **Task 9**: Added 7 new i18n keys to both `en.json` and `he.json` for rejection flow and edit mode.

### Change Log

- 2026-02-13: Implemented Story 5.3 — Ghost Text field editing with searchable dropdowns for Category/Project, inline reject confirmation dialog, reject flow with Firestore persistence, confirm-with-edits via overrides, Escape key layering, reject animation, i18n keys (EN + HE). All 756 tests pass, zero TypeScript errors.

### File List

New files:
- `src/features/review/components/GhostTextField.tsx`
- `src/features/review/components/GhostTextField.module.scss`
- `src/features/review/components/GhostTextField.test.tsx`
- `src/features/review/components/RejectConfirmDialog.tsx`
- `src/features/review/components/RejectConfirmDialog.module.scss`
- `src/features/review/components/RejectConfirmDialog.test.tsx`
- `src/features/review/hooks/useRejectTransaction.ts`
- `src/features/review/hooks/useRejectTransaction.test.ts`

Modified files:
- `src/features/review/components/GhostTextCard.tsx`
- `src/features/review/components/GhostTextCard.module.scss`
- `src/features/review/components/GhostTextCard.test.tsx`
- `src/features/review/components/index.ts`
- `src/features/review/hooks/useGhostTextKeyboard.ts`
- `src/features/review/hooks/useGhostTextKeyboard.test.ts`
- `src/features/review/hooks/useConfirmTransaction.ts`
- `src/features/review/hooks/useConfirmTransaction.test.ts`
- `src/features/review/hooks/index.ts`
- `src/features/review/ReviewPage.tsx`
- `src/features/review/ReviewPage.test.tsx`
- `src/i18n/en.json`
- `src/i18n/he.json`
- `src/styles/_animations.scss`
