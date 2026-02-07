# Story 1.6: Core Shared UI Components & Currency Utilities

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **developer**,
I want a complete library of shared UI components built from the TailorPlayed design system and a currency utility module,
So that all feature development uses consistent, accessible, spec-compliant building blocks.

## Acceptance Criteria

1. **Button Component** (`src/components/Button/`): Supports 4 variants — Primary (gold bg, dark text), Secondary (transparent, subtle border), Danger (transparent, red-tinted border), Ghost (no border, text only). 3 sizes: small, medium (default), large. States: default, hover (150ms transition + `translateY(-1px)` lift), active, disabled, loading (spinner inside button). Renders keyboard shortcut hint when `shortcut` prop is provided. 44x44px minimum touch target. Focus ring via `@include focus-ring`. Co-located `Button.test.tsx` validates all variants, sizes, and states.

2. **Card Component** (`src/components/Card/`): Uses `@include card-surface` (`$bg-tertiary`, `$border-subtle`, `$radius-lg`, `$shadow-md`). Supports hover state with lift + border highlight. Supports `clickable` prop that adds cursor pointer and hover glow. Co-located `Card.test.tsx`.

3. **Badge Components** (`src/components/Badge/`): `Badge` renders a pill-shaped label with semantic color background (15-20% opacity) + matching text color. `StatusBadge` maps Work Order statuses (Lead, Design, Production, Shipped) to distinct colors. `ConfidenceBadge` shows green (`$success`) for >= 85% and warning amber (`$warning`) with "Check Me" text for < 85%. Co-located tests.

4. **Input Components** (`src/components/Input/`): `Input` supports text, number, and currency input with `$bg-tertiary` background, `$border-subtle` border, and gold focus state. `Select` renders a custom dropdown with search filter capability. `SearchInput` renders a search-specific input with icon. All inputs support error state (red border + inline error text). All inputs have associated labels (visible or `.sr-only`). All inputs >= 44px touch target height. Co-located tests.

5. **Toast Components** (`src/components/Toast/`): `Toast` renders with 4 types: success (gold), error (red + retry action), warning (orange), info (muted). `ToastContainer` stacks toasts vertically, max 3 visible, renders via `createPortal`. Success/info auto-dismiss after 3s, error after 5s or manual, warning persistent. Toasts never block user interaction. Co-located tests.

6. **Skeleton Component** (`src/components/Skeleton/`): Renders a shimmer animation (gold-dim opacity pulse) matching the design system. Supports `width`, `height`, and `variant` (text, circle, rect) props. Respects `prefers-reduced-motion` (static gray instead of shimmer). Co-located `Skeleton.test.tsx`.

7. **ErrorBoundary Component** (`src/components/ErrorBoundary/`): Catches rendering errors and displays a fallback UI. Fallback shows a friendly error message with a "Try Again" button. Logs error details to console. Co-located `ErrorBoundary.test.tsx`.

8. **Currency Utility Module** (`src/lib/currency.ts`): `toMinorUnits(amount: number, currency: string): number` converts display amounts to integers (agora/cents). `toDisplayAmount(minorUnits: number, currency: string): number` converts integers to display amounts. `formatCurrency(amountAgora: number, currency: 'ILS' | 'USD' | 'EUR'): string` returns formatted string with symbol (`₪82.00`, `$142.50`, `€200.00`). All functions handle edge cases (zero, negative, rounding). Co-located tests validate arithmetic precision for WAC scenarios.

9. **Barrel Export** (`src/components/index.ts`): All shared components re-exported: `Button`, `Card`, `Badge`, `StatusBadge`, `ConfidenceBadge`, `Input`, `Select`, `SearchInput`, `Toast`, `ToastContainer`, `Skeleton`, `ErrorBoundary`. Consumers import via `import { Button, Card } from '@/components'`.

## Tasks / Subtasks

- [x] Task 1: Button Component (AC: #1)
  - [x] Create `src/components/Button/Button.tsx` with typed props: `variant` (`'primary' | 'secondary' | 'danger' | 'ghost'`), `size` (`'sm' | 'md' | 'lg'`), `loading` (boolean), `shortcut` (string), `disabled` (boolean), plus standard `ButtonHTMLAttributes<HTMLButtonElement>`
  - [x] Create `src/components/Button/Button.module.scss` with variant styles, size scales, hover lift (`translateY(-1px)`), focus ring (`@include focus-ring`), loading spinner state, 44px min touch target, `$transition-fast` (150ms) for hover
  - [x] Update `src/components/Button/index.ts` to export `Button` component and `ButtonProps` type
  - [x] Create `src/components/Button/Button.test.tsx` — tests: renders all 4 variants, renders all 3 sizes, shows loading spinner, shows shortcut hint, disabled state prevents interaction, focus ring visible, accessibility (role=button, aria-disabled, aria-busy)

- [x] Task 2: Card Component (AC: #2)
  - [x] Create `src/components/Card/Card.tsx` with props: `clickable` (boolean), `onClick`, `children`, `className`
  - [x] Create `src/components/Card/Card.module.scss` using `@include card-surface`, hover lift with `$shadow-md` → `$shadow-lg`, clickable variant adds cursor pointer + `$shadow-glow` on hover
  - [x] Update `src/components/Card/index.ts` to export `Card` and `CardProps`
  - [x] Create `src/components/Card/Card.test.tsx` — tests: renders children, applies card-surface styles, clickable adds cursor pointer, onClick fires, non-clickable has no pointer, hover class exists

- [x] Task 3: Badge Components (AC: #3)
  - [x] Create `src/components/Badge/Badge.tsx` — generic pill badge with `color` prop (`'success' | 'warning' | 'error' | 'info' | 'default'`), `label` prop; renders with 15-20% opacity semantic color bg + matching text
  - [x] Create `src/components/Badge/StatusBadge.tsx` — maps `status: 'Lead' | 'Design' | 'Production' | 'Shipped'` to predefined colors; uses `Badge` internally
  - [x] Create `src/components/Badge/ConfidenceBadge.tsx` — takes `confidence: number` (0-100); renders green (`$success`) for >= 85, amber (`$warning`) + "Check Me" text for < 85
  - [x] Create `src/components/Badge/Badge.module.scss` — pill shape (`$radius-sm`), `$text-xs` (14px), `$font-medium` (500), semantic color system
  - [x] Update `src/components/Badge/index.ts` to export all badge components and types
  - [x] Create `src/components/Badge/Badge.test.tsx` — tests for all 3 badge types: Badge renders with correct color, StatusBadge maps statuses correctly, ConfidenceBadge threshold behavior at 84/85/86

- [x] Task 4: Input Components (AC: #4)
  - [x] Create `src/components/Input/Input.tsx` — supports `type: 'text' | 'number' | 'currency'`, `label`, `error`, `helperText`, `id`, standard input attrs; renders `<label>` (visible or `.sr-only` via `hideLabel` prop) + `<input>` with error display
  - [x] Create `src/components/Input/Select.tsx` — custom dropdown: `options: { value: string; label: string }[]`, `label`, `error`, `searchable` (boolean, enables filter), `onChange`, `value`; uses portal for dropdown overlay; keyboard nav (ArrowUp/Down, Enter, Escape); click-outside-to-close
  - [x] Create `src/components/Input/SearchInput.tsx` — wraps `Input` with `MagnifyingGlass` icon from Phosphor, type="search", clear button when value exists
  - [x] Create `src/components/Input/Input.module.scss` — `$bg-tertiary` background, `$border-subtle` border, `$gold` focus border, `$error` error border + error text, `$radius-md` (12px), 44px min height, `$text-base` font size, label styles in `$text-secondary` + `$text-xs`, dropdown styles for Select
  - [x] Update `src/components/Input/index.ts` to export all input components and types
  - [x] Create `src/components/Input/Input.test.tsx` — tests: Input renders label, shows error, handles change; Select renders options, filters on search, keyboard nav; SearchInput renders icon, clears value; all inputs meet 44px height; sr-only label works

- [x] Task 5: Toast System (AC: #5)
  - [x] Create/update `src/stores/useUIStore.ts` — Zustand store with `toasts: Toast[]`, `addToast(toast)`, `removeToast(id)` actions; `Toast` type: `{ id: string; type: 'success' | 'error' | 'warning' | 'info'; message: string; action?: { label: string; onClick: () => void } }`
  - [x] Create `src/components/Toast/Toast.tsx` — single toast rendering: icon per type, message, optional action link, close button; type-specific styling (success=gold border, error=red border, warning=orange border, info=muted border)
  - [x] Create `src/components/Toast/ToastContainer.tsx` — renders via `createPortal` to `document.body`; reads toasts from `useUIStore`; stacks max 3 visible (latest on top); manages auto-dismiss timers (success/info: 3s, error: 5s, warning: persistent); `slideDown` entry animation
  - [x] Create `src/components/Toast/Toast.module.scss` — toast card styling (`@include elevated-surface`), type-specific left-border colors, `slideDown` + `fadeIn` animations, stacking layout, close button, action link in `$gold`
  - [x] Update `src/components/Toast/index.ts` to export `Toast`, `ToastContainer`; also export a convenience `toast` object from store: `toast.success(msg)`, `toast.error(msg, action?)`, `toast.warning(msg)`, `toast.info(msg)`
  - [x] Create `src/components/Toast/Toast.test.tsx` — tests: renders message, shows correct type styling, action button works, close button removes toast, auto-dismiss fires after timeout, max 3 visible, portal renders outside component tree
  - [x] Update `src/stores/index.ts` to export `useUIStore`

- [x] Task 6: Skeleton Component (AC: #6)
  - [x] Create `src/components/Skeleton/Skeleton.tsx` — props: `width`, `height`, `variant: 'text' | 'circle' | 'rect'`, `className`; applies shimmer animation; text variant has `$radius-sm` + default height 16px; circle variant has `$radius-full`; rect variant has `$radius-md`
  - [x] Create `src/components/Skeleton/Skeleton.module.scss` — shimmer animation using `@keyframes shimmer` (gold-dim gradient sweep), `$bg-tertiary` base, `$bg-elevated` shimmer highlight; `@media (prefers-reduced-motion: reduce)` shows static `$bg-tertiary` with no animation
  - [x] Update `src/components/Skeleton/index.ts` to export `Skeleton` and `SkeletonProps`
  - [x] Create `src/components/Skeleton/Skeleton.test.tsx` — tests: renders with correct dimensions, text/circle/rect variants apply correct border-radius, shimmer class present, reduced-motion handling

- [x] Task 7: ErrorBoundary Component (AC: #7)
  - [x] Create `src/components/ErrorBoundary/ErrorBoundary.tsx` — React class component (required for `getDerivedStateFromError`); `state: { hasError: boolean; error: Error | null }`; `componentDidCatch` logs to console; renders fallback UI with friendly message, error details (dev only), and "Try Again" button that resets state; accepts `fallback` prop for custom fallback; accepts `children`
  - [x] Create `src/components/ErrorBoundary/ErrorBoundary.module.scss` — centered fallback layout (`@include flex-column-center`), `$error` accent, "Try Again" button styled as secondary button, `$space-lg` padding
  - [x] Update `src/components/ErrorBoundary/index.ts` to export `ErrorBoundary`
  - [x] Create `src/components/ErrorBoundary/ErrorBoundary.test.tsx` — tests: renders children when no error, catches child error and shows fallback, "Try Again" resets and re-renders children, logs error to console, custom fallback renders, error details shown

- [x] Task 8: Currency Utility Module (AC: #8)
  - [x] Create `src/lib/currency.ts` with:
    - `toMinorUnits(amount: number, currency: 'ILS' | 'USD' | 'EUR'): number` — multiplies by 100, rounds to nearest integer; handles floating-point precision via `Math.round(amount * 100)`
    - `toDisplayAmount(minorUnits: number, currency: 'ILS' | 'USD' | 'EUR'): number` — divides by 100, returns 2-decimal number
    - `formatCurrency(amountAgora: number, currency: 'ILS' | 'USD' | 'EUR'): string` — converts from minor units, formats via `Intl.NumberFormat` with correct locale per currency (ILS→'he-IL', USD→'en-US', EUR→'de-DE'); returns `₪82.00`, `$142.50`, `€200.00`
    - Type: `Currency = 'ILS' | 'USD' | 'EUR'`
    - Constant: `CURRENCY_CONFIG` mapping currency to `{ code, locale, symbol, minorUnitsPerMajor }`
  - [x] Update `src/lib/index.ts` to export currency functions and types (already has `export * from './currency'`)
  - [x] Create `src/lib/currency.test.ts` — tests: toMinorUnits precision (82.00→8200, 0.01→1, 99.99→9999), toDisplayAmount inverse (8200→82, 1→0.01), formatCurrency all 3 currencies, edge cases (zero, negative amounts, large numbers), floating-point safety (`0.1 + 0.2` scenarios), WAC calculation precision scenario

- [x] Task 9: Barrel Export Updates (AC: #9)
  - [x] Update `src/components/index.ts` — verify all new components are re-exported (Button, Card, Badge, StatusBadge, ConfidenceBadge, Input, Select, SearchInput, Toast, ToastContainer, Skeleton, ErrorBoundary)
  - [x] Update `src/stores/index.ts` — export `useUIStore`

- [x] Task 10: Build Verification (AC: all)
  - [x] `tsc --noEmit` — zero TypeScript errors
  - [x] `npm run lint` — zero warnings
  - [x] `npm run test` — all tests pass (existing 183 + new 112 = 295, zero regressions)
  - [x] `npm run build` — succeeds (requires `all` sandbox permissions for sass-embedded)

## Dev Notes

### Architecture Compliance

- **SCSS Modules only**: All component styling via `*.module.scss`. Tokens and mixins are auto-imported via Vite `additionalData` — use `$gold`, `@include card-surface`, `@include focus-ring`, etc. directly in `.module.scss` files without explicit `@use` statements. [Source: architecture.md#Implementation-Patterns]
- **CSS Logical Properties ONLY**: NEVER use `left`/`right`/`text-align: left`. Use `inline-start`/`inline-end`, `margin-inline`, `padding-inline`, `text-align: start`. All components must work in both RTL and LTR. [Source: architecture.md#Enforcement-Guidelines]
- **Path aliases**: `@/` prefix for all imports. Import from `@/components`, `@/lib`, `@/stores`, etc. [Source: architecture.md#Structure-Patterns]
- **Barrel exports**: Every directory exports through `index.ts`. Consumers import from the directory, not individual files. `import { Button, Card } from '@/components'` — NOT `import { Button } from '@/components/Button/Button'`. [Source: architecture.md#Structure-Patterns]
- **Co-located tests**: `*.test.tsx` / `*.test.ts` next to the component file, NOT in `__tests__/`. [Source: architecture.md#Structure-Patterns]
- **Naming conventions**: Components PascalCase (`Button.tsx`), SCSS modules PascalCase (`Button.module.scss`), SCSS class names camelCase (`.buttonPrimary`), hooks `use` prefix, utility functions camelCase, types PascalCase no `I` prefix, constants UPPER_SNAKE_CASE. [Source: architecture.md#Naming-Patterns]
- **No white (#fff) text**: All text uses gold scale tokens (`$text-primary`, `$text-secondary`, `$text-muted`). [Source: architecture.md#Naming-Patterns]
- **Phosphor Icons**: `@phosphor-icons/react` v2.1.10 already installed. Use for icons in SearchInput (MagnifyingGlass), Toast (CheckCircle, XCircle, Warning, Info), etc. Default 24px for inline, 20px for nav, 18px for badges. [Source: architecture.md#Implementation-Patterns]
- **No new npm dependencies**: All required packages are already installed. Do NOT run `npm install`. Use only what's in `package.json`. [Source: architecture.md#Implementation-Patterns]
- **Zustand store pattern**: One store per domain. Store holds data + loading + error. Actions are synchronous setters. Derived values are selectors outside the store. No business logic in stores. [Source: architecture.md#State-Management]
- **Currency utility functions required**: Never raw arithmetic on agora values. Use `toMinorUnits`, `toDisplayAmount`, `formatCurrency` from `@/lib/currency`. [Source: architecture.md#Enforcement-Guidelines]
- **Integer currency storage**: All financial amounts stored as integers (agora for ILS, cents for USD/EUR). Field names use `Agora` suffix. Display formatting happens at component level via `formatCurrency()`. [Source: architecture.md#Currency-Storage]

### Critical Technical Constraints

- **Packages already installed** (DO NOT run npm install):
  - `react@^19.2.0`, `react-dom@^19.2.0`
  - `zustand@^5.0.11` — for `useUIStore` (toast state)
  - `@phosphor-icons/react@^2.1.10` — for icons in SearchInput, Toast
  - `zod@^4.3.6` — available if needed for prop validation (optional)
  - `react-hook-form@^7.71.1` — available but NOT needed for this story's components
  - `i18next@^25.8.4`, `react-i18next@^16.5.4` — i18n already configured; new components should use `t()` for any user-facing strings

- **Placeholder files already exist** — REPLACE content, do NOT create new files at these paths:
  - `src/components/Button/index.ts` (empty `export {}`)
  - `src/components/Card/index.ts` (empty `export {}`)
  - `src/components/Badge/index.ts` (empty `export {}`)
  - `src/components/Input/index.ts` (empty `export {}`)
  - `src/components/Toast/index.ts` (empty `export {}`)
  - `src/components/Skeleton/index.ts` (empty `export {}`)
  - `src/components/ErrorBoundary/index.ts` (empty `export {}`)
  - `src/lib/currency.ts` (empty `export {}`)
  - `src/stores/useUIStore.ts` (empty `export {}`)

- **Existing barrel exports already reference these directories**: `src/components/index.ts` already has `export * from './Button'`, `export * from './Card'`, etc. And `src/lib/index.ts` already has `export * from './currency'`. These barrels do NOT need modification — they'll automatically pick up new exports when the placeholder files are replaced. Just make sure the new component files export correctly.

- **SCSS auto-import**: `_variables.scss` and `_mixins.scss` are auto-imported via Vite `additionalData` into every `.module.scss` file. Tokens (`$gold`, `$bg-tertiary`, etc.) and mixins (`@include card-surface`, `@include focus-ring`, etc.) are available without `@use` statements. [Source: Stories 1.2, 1.5]

- **Animation keyframes available globally**: `@keyframes shimmer`, `fadeIn`, `slideDown`, `pulse`, `spin`, `scaleIn` are defined in `_animations.scss` and loaded via `global.scss`. Reference them directly in `.module.scss` files via `animation-name: shimmer`. No import needed. [Source: Story 1.2]

- **Toast portal target**: Use `createPortal(jsx, document.body)` — no need for a separate `<div id="toast-root">`. React portals to `document.body` work fine. Keep it simple.

- **ErrorBoundary must be a class component**: React 19 still requires class components for `getDerivedStateFromError` and `componentDidCatch`. There is no hook equivalent. Use `Component<Props, State>` from React. [Source: Web research, React 19 docs]

- **i18n for user-facing strings in components**: New shared components that display user-facing text (like ErrorBoundary "Try Again", Toast action labels, ConfidenceBadge "Check Me") should use `t()` from `react-i18next`. Add keys to both `en.json` and `he.json`. [Source: Story 1.5 patterns]

- **DO NOT modify `vite.config.ts`**: No changes needed.

- **DO NOT modify `vitest.config.ts`**: Test mocks for `react-i18next` and `.module.scss` are already configured via resolve aliases from Story 1.5. New component tests benefit automatically.

- **Existing test mock infrastructure**: `src/__mocks__/react-i18next.ts` provides a lightweight `useTranslation` mock that returns the key. `src/__mocks__/css-module.ts` provides a Proxy-based CSS module mock. Both are registered as resolve aliases in `vitest.config.ts`. No per-test `vi.mock` boilerplate needed for these.

- **`await import()` pattern for Phosphor icons in tests**: When testing components that import Phosphor icons, use the same `await import()` dynamic import pattern established in Story 1.4 to avoid Vitest/jsdom hangs. Example:

```typescript
// In test file — use dynamic import for component with Phosphor icons
const { SearchInput } = await import('./SearchInput');
```

### Component Design Specifications

#### Button Design Spec

| Property | Primary | Secondary | Danger | Ghost |
|---|---|---|---|---|
| Background | `$gold` | transparent | transparent | transparent |
| Text Color | `$bg-primary` (#120022) | `$text-secondary` | `$error` | `$text-secondary` |
| Border | none | `1px solid $border-subtle` | `1px solid rgba($error, 0.4)` | none |
| Hover BG | `$gold-light` | `rgba($gold, 0.1)` | `rgba($error, 0.1)` | `rgba($gold, 0.1)` |
| Hover Effect | `translateY(-1px)` + `$shadow-glow` | `translateY(-1px)` | `translateY(-1px)` | none |

| Size | Height | Padding Inline | Font Size | Icon Size |
|---|---|---|---|---|
| `sm` | 36px (min 44px touch via padding) | `$space-md` (16px) | `$text-xs` (14px) | 18px |
| `md` | 44px | `$space-lg` (24px) | `$text-sm` (16px) | 20px |
| `lg` | 52px | `$space-xl` (32px) | `$text-base` (18px) | 24px |

- **Loading state**: Replace content with a `spin` animation spinner (use `@keyframes spin`). Set `pointer-events: none` + `opacity: 0.7`. Add `aria-busy="true"`.
- **Shortcut hint**: Small pill right of label text — `$text-muted` color, `$text-xs` size, `$bg-elevated` background, `$radius-sm` border-radius.
- **Disabled**: `opacity: 0.5`, `cursor: not-allowed`, `pointer-events: none`.
- **Focus**: `@include focus-ring` (2px solid `$gold`, 2px offset).
- **Border radius**: `$radius-md` (12px) for all sizes.
- **Font**: `$font-medium` (500) weight, `$font-family` (Fredoka).
- **Transition**: `$transition-fast` (150ms ease) on background, transform, box-shadow, opacity.
- **Max 1 primary button per view** — this is a UX rule the dev should know, not enforced in code.

#### Card Design Spec

- **Surface**: `@include card-surface` → `$bg-tertiary` bg, `1px solid $border-subtle`, `$radius-lg` (16px), `$shadow-md`.
- **Hover** (non-clickable): `$shadow-lg` shadow, subtle border brighten.
- **Clickable hover**: `cursor: pointer`, `$shadow-glow` (gold glow), `$shadow-lg`, border color brightens to `$gold`.
- **Padding**: `$space-md` (16px) for dashboard-density cards, `$space-lg` (24px) for detail views. Default to `$space-md`.
- **Transition**: `$transition-fast` on box-shadow, border-color, transform.
- **Children**: Renders `{children}` — no internal layout opinions. Card is a surface container.

#### Badge Design Spec

- **Shape**: Pill — `$radius-sm` (8px), inline-flex, `padding: $space-xs $space-sm` (4px 8px).
- **Typography**: `$text-xs` (14px), `$font-medium` (500).
- **Color mapping** (bg opacity 15-20%):
  - `success`: bg `rgba($success, 0.15)`, text `$success`
  - `warning`: bg `rgba($warning, 0.15)`, text `$warning`
  - `error`: bg `rgba($error, 0.15)`, text `$error`
  - `info`: bg `rgba($info, 0.15)`, text `$info`
  - `default`: bg `rgba($text-muted, 0.15)`, text `$text-secondary`
- **StatusBadge mappings**: Lead→`info`, Design→`warning`, Production→`success`, Shipped→`default` (or a custom purple).
- **ConfidenceBadge**: >= 85% → `success` color, just shows percentage. < 85% → `warning` color, shows percentage + "Check Me" text.
- **Icon sizing in badges**: 18px if icon included.

#### Input Design Spec

- **Base Input**: `$bg-tertiary` bg, `1px solid $border-subtle` border, `$radius-md` (12px), min-height 44px, `$text-base` (18px) font, `$text-primary` text color, `$text-muted` placeholder.
- **Focus**: Border becomes `$gold` (solid), subtle `$shadow-glow`.
- **Error**: Border becomes `$error`, error text below in `$error` color + `$text-xs`.
- **Label**: Above input, `$text-secondary`, `$text-xs`, `$font-medium`. `hideLabel` prop wraps label in `.sr-only`.
- **Padding inline**: `$space-md` (16px).
- **Transition**: `$transition-fast` on border-color, box-shadow.

- **Select (Custom Dropdown)**:
  - Trigger: Styled same as Input, with `CaretDown` icon from Phosphor on inline-end.
  - Dropdown overlay: `$bg-elevated` bg, `$border-subtle` border, `$radius-md`, `$shadow-lg`, max-height 240px with scroll.
  - Options: `$space-sm $space-md` padding, `$text-base`, hover → `$bg-tertiary` bg.
  - Search input at top of dropdown when `searchable=true` — fuzzy filter on option labels.
  - Keyboard: ArrowDown/Up navigates, Enter selects, Escape closes.
  - Click outside closes dropdown.
  - Render dropdown via `createPortal(jsx, document.body)` to avoid overflow clipping.

- **SearchInput**: Input with `MagnifyingGlass` icon (Phosphor) on inline-start, `type="search"`, `X` (clear) icon on inline-end when value present.

#### Toast Design Spec

- **Toast types**:
  - Success: `$gold` left border (3px), `CheckCircle` icon in `$gold`
  - Error: `$error` left border (3px), `XCircle` icon in `$error`, optional "Retry" action link
  - Warning: `$warning` left border (3px), `Warning` icon in `$warning`, persistent (no auto-dismiss)
  - Info: `$text-muted` left border (3px), `Info` icon in `$text-secondary`

- **ToastContainer layout**: Fixed position, `inset-block-start: $space-lg`, `inset-inline-end: $space-lg`, z-index 9999, max 3 visible stacked with `$space-sm` gap, width 360px max (full width on mobile minus padding).
- **Animation**: `slideDown` + `fadeIn` entry (300ms), `fadeOut` exit.
- **Auto-dismiss**: Success/Info = 3000ms, Error = 5000ms, Warning = never.
- **Close button**: `X` icon, top-inline-end corner, `$text-muted`, hover `$text-primary`.
- **Action link**: Inline text button in `$gold`, appears after message text.
- **Toast card**: `@include elevated-surface`, `$space-md` padding, `$radius-md`.

- **Zustand store for toasts** (`src/stores/useUIStore.ts`):

```typescript
import { create } from 'zustand';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  action?: { label: string; onClick: () => void };
}

interface UIStore {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  toasts: [],
  addToast: (toast) =>
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id: crypto.randomUUID() }],
    })),
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));

// Convenience functions for direct use without hooks
export const toast = {
  success: (message: string) =>
    useUIStore.getState().addToast({ type: 'success', message }),
  error: (message: string, action?: Toast['action']) =>
    useUIStore.getState().addToast({ type: 'error', message, action }),
  warning: (message: string) =>
    useUIStore.getState().addToast({ type: 'warning', message }),
  info: (message: string) =>
    useUIStore.getState().addToast({ type: 'info', message }),
};
```

#### Skeleton Design Spec

- **Base**: `$bg-tertiary` background, `border-radius` per variant.
- **Shimmer**: Linear gradient sweep — `$bg-tertiary` → `$bg-elevated` → `$bg-tertiary`, `background-size: 200% 100%`, `animation: shimmer 1.5s ease-in-out infinite`.
- **Variants**: `text` → `$radius-sm`, default height 16px, width 100%. `circle` → `$radius-full`, equal width/height. `rect` → `$radius-md`, explicit width/height.
- **Reduced motion**: `@media (prefers-reduced-motion: reduce)` → static `$bg-tertiary`, no animation.
- **Props**: `width?: string | number`, `height?: string | number`, `variant?: 'text' | 'circle' | 'rect'`, `className?: string`.

#### ErrorBoundary Design Spec

- **Must be class component** — React 19 requires `getDerivedStateFromError` for error boundaries.
- **Props**: `children: ReactNode`, `fallback?: ReactNode` (custom fallback), `onError?: (error: Error, info: ErrorInfo) => void` (callback hook).
- **Default fallback**: Centered (`@include flex-column-center`), `$space-lg` padding, friendly message ("Something went wrong"), `$text-secondary` description, "Try Again" button (secondary variant styling), `$error` accent icon (Phosphor `WarningCircle`).
- **"Try Again" button**: Resets `hasError` state via `setState({ hasError: false, error: null })`, which re-renders children.
- **Error logging**: `componentDidCatch(error, info)` → `console.error('[ErrorBoundary]', error, info.componentStack)`.
- **Error message UX**: Specific, not vague. "Something went wrong" + details in dev mode. "The feeling should never be confusion or helplessness." [Source: ux-design-specification.md#Error-States]

#### Currency Utility Design Spec

```typescript
// src/lib/currency.ts

export type Currency = 'ILS' | 'USD' | 'EUR';

const CURRENCY_CONFIG: Record<Currency, { locale: string; symbol: string }> = {
  ILS: { locale: 'he-IL', symbol: '₪' },
  USD: { locale: 'en-US', symbol: '$' },
  EUR: { locale: 'de-DE', symbol: '€' },
};

/**
 * Convert a display amount (e.g., 82.00) to minor units (agora/cents).
 * Uses Math.round to prevent floating-point drift.
 */
export function toMinorUnits(amount: number, currency: Currency = 'ILS'): number {
  return Math.round(amount * 100);
}

/**
 * Convert minor units (agora/cents) back to a display amount.
 */
export function toDisplayAmount(minorUnits: number, currency: Currency = 'ILS'): number {
  return minorUnits / 100;
}

/**
 * Format a minor-units amount as a currency string.
 * Input is in agora/cents — converts to display amount before formatting.
 * Returns e.g., "₪82.00", "$142.50", "€200.00"
 */
export function formatCurrency(amountAgora: number, currency: Currency = 'ILS'): string {
  const config = CURRENCY_CONFIG[currency];
  const displayAmount = toDisplayAmount(amountAgora, currency);
  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(displayAmount);
}
```

- **Key design decision**: Use `Intl.NumberFormat` for locale-aware formatting. This handles symbol placement, thousand separators, and decimal separators correctly per locale.
- **All math in integers**: `toMinorUnits` uses `Math.round(amount * 100)` to prevent floating-point issues. Division by 100 in `toDisplayAmount` is safe for display (never used in further calculations).
- **Three currencies only**: ILS (base), USD, EUR. No need for an external currency library.
- **Edge cases**: Zero → `₪0.00`, Negative → `-₪82.00`, Very large → proper thousand separators.

### i18n Keys to Add

New components need translation keys. Add to both `src/i18n/en.json` and `src/i18n/he.json`:

```json
{
  "components": {
    "errorBoundary": {
      "title": "Something went wrong",
      "description": "An unexpected error occurred. Please try again.",
      "tryAgain": "Try Again"
    },
    "toast": {
      "close": "Close notification"
    },
    "confidenceBadge": {
      "checkMe": "Check Me"
    },
    "select": {
      "search": "Search...",
      "noResults": "No results found"
    },
    "searchInput": {
      "clear": "Clear search"
    }
  }
}
```

Hebrew equivalents:

```json
{
  "components": {
    "errorBoundary": {
      "title": "משהו השתבש",
      "description": "אירעה שגיאה לא צפויה. אנא נסו שוב.",
      "tryAgain": "נסו שוב"
    },
    "toast": {
      "close": "סגור התראה"
    },
    "confidenceBadge": {
      "checkMe": "בדוק אותי"
    },
    "select": {
      "search": "חיפוש...",
      "noResults": "לא נמצאו תוצאות"
    },
    "searchInput": {
      "clear": "נקה חיפוש"
    }
  }
}
```

### Project Structure Notes

**New files to create** (all under `src/`):

| File | Type | Notes |
|---|---|---|
| `components/Button/Button.tsx` | NEW | Component |
| `components/Button/Button.module.scss` | NEW | Styles |
| `components/Button/Button.test.tsx` | NEW | Tests |
| `components/Button/index.ts` | REPLACE | Was empty placeholder |
| `components/Card/Card.tsx` | NEW | Component |
| `components/Card/Card.module.scss` | NEW | Styles |
| `components/Card/Card.test.tsx` | NEW | Tests |
| `components/Card/index.ts` | REPLACE | Was empty placeholder |
| `components/Badge/Badge.tsx` | NEW | Generic badge |
| `components/Badge/StatusBadge.tsx` | NEW | Work Order status |
| `components/Badge/ConfidenceBadge.tsx` | NEW | AI confidence |
| `components/Badge/Badge.module.scss` | NEW | Shared styles |
| `components/Badge/Badge.test.tsx` | NEW | Tests for all 3 |
| `components/Badge/index.ts` | REPLACE | Was empty placeholder |
| `components/Input/Input.tsx` | NEW | Base input |
| `components/Input/Select.tsx` | NEW | Custom dropdown |
| `components/Input/SearchInput.tsx` | NEW | Search variant |
| `components/Input/Input.module.scss` | NEW | Shared styles |
| `components/Input/Input.test.tsx` | NEW | Tests for all 3 |
| `components/Input/index.ts` | REPLACE | Was empty placeholder |
| `components/Toast/Toast.tsx` | NEW | Single toast |
| `components/Toast/ToastContainer.tsx` | NEW | Portal stack |
| `components/Toast/Toast.module.scss` | NEW | Styles |
| `components/Toast/Toast.test.tsx` | NEW | Tests |
| `components/Toast/index.ts` | REPLACE | Was empty placeholder |
| `components/Skeleton/Skeleton.tsx` | NEW | Component |
| `components/Skeleton/Skeleton.module.scss` | NEW | Shimmer styles |
| `components/Skeleton/Skeleton.test.tsx` | NEW | Tests |
| `components/Skeleton/index.ts` | REPLACE | Was empty placeholder |
| `components/ErrorBoundary/ErrorBoundary.tsx` | NEW | Class component |
| `components/ErrorBoundary/ErrorBoundary.module.scss` | NEW | Fallback styles |
| `components/ErrorBoundary/ErrorBoundary.test.tsx` | NEW | Tests |
| `components/ErrorBoundary/index.ts` | REPLACE | Was empty placeholder |
| `lib/currency.ts` | REPLACE | Was empty placeholder |
| `lib/currency.test.ts` | NEW | Currency tests |
| `stores/useUIStore.ts` | REPLACE | Was empty placeholder |
| `i18n/en.json` | MODIFY | Add component keys |
| `i18n/he.json` | MODIFY | Add component keys |

**Files NOT to modify** (already correct):
- `src/components/index.ts` — already has all barrel re-exports
- `src/lib/index.ts` — already has `export * from './currency'`
- `src/styles/_variables.scss`, `_mixins.scss`, `_animations.scss` — all tokens/mixins/keyframes ready
- `vite.config.ts`, `vitest.config.ts` — no changes needed

### Previous Story Intelligence (Story 1.5)

**Key patterns established in Story 1.5 (Internationalization & RTL):**

- SCSS Modules work with auto-imported tokens and mixins — use `$gold`, `@include card-surface` directly.
- `src/__mocks__/react-i18next.ts` mock returns translation key as string. The mock also exposes interpolation params as `__params` on the returned string for testing. Components using `useTranslation` will have `t()` calls return keys in tests.
- `src/__mocks__/css-module.ts` provides Proxy-based CSS module mock for tests — all `.module.scss` imports resolve to `className` strings matching the property name.
- `vitest.config.ts` resolve aliases handle both mocks automatically — no per-test setup needed.
- `useDirection` hook in `PageShell` sets `dir` and `lang` on `<html>` — CSS logical properties in `.module.scss` files automatically respond to RTL/LTR.
- BottomNav uses `labelKey` + `t()` at render for i18n-safe labels.
- Sandbox restriction: `npm run build` requires `all` permissions due to sass-embedded. Tests work in normal sandbox.
- 183 tests currently passing across 19 test files — new tests must not break these.

**Critical learning from Story 1.5 code review:**
- H1: Hebrew default not guaranteed on first visit — fixed with `lng: storedLang || 'he'`. Be aware of this pattern.
- M1: Dead files left behind after refactor — clean up any files that become unused.
- M3: Tests should test actual module behavior, not just library functionality.
- L2: Inconsistent test mock strategies are documented — use the global mock infrastructure, avoid per-test `vi.mock` where possible.

**Learnings from Story 1.4 (App Shell):**
- `await import()` pattern required for Phosphor icon imports in Vitest to avoid jsdom hangs.
- `MemoryRouter` wrapping needed for route-aware component tests.
- Single comprehensive commits per story.

**Learnings from Story 1.2 (Design System):**
- Sandbox restrictions: run build with `all` permissions if sass native compiler fails.
- `@mixin rtl { [dir="rtl"] & { @content; } }` exists in `_mixins.scss` — use for RTL-specific overrides.
- CSS Custom Properties are generated in `global.scss` (not in `_variables.scss`) to prevent duplication when auto-imported.

### Git Intelligence

**Recent commits** (most recent first):
- `65263d4` — Implement Story 1.5: Internationalization & RTL Support with code review fixes
- `e0d6fc2` — Implement Story 1.4: App Shell & Responsive Navigation with code review fixes
- `55230df` — Add Gal's UID to auth whitelist
- `aa7bd16` — Implement Story 1.3: Authentication & Route Protection with code review fixes
- `41d521b` — Implement Story 1.2: Design System Tokens & Global Styles with code review fixes
- `fffa502` — Initial project setup (Story 1.1)

**Key patterns from git history:**
- Single comprehensive commit per story with code review fixes included.
- All component directories created as placeholder stubs in Story 1.1, ready to be populated.
- `_variables.scss`, `_mixins.scss`, `_animations.scss` fully defined in Story 1.2 — all design tokens ready.
- Phosphor icons imported and working since Story 1.4.
- i18n infrastructure (react-i18next, translation files, useDirection hook) fully operational since Story 1.5.
- Vitest mock infrastructure (CSS modules, react-i18next) fully configured since Story 1.5.

### Latest Technical Information

**React 19 ErrorBoundary:**
- Class components are STILL required for `getDerivedStateFromError` and `componentDidCatch`. No hook alternative exists in React 19.
- React 19 adds `onUncaughtError` and `onCaughtError` at the root level (in `createRoot` options) for enhanced error tracking. These complement, not replace, ErrorBoundary components.
- The `react-error-boundary` library exists as a wrapper but is NOT needed — the custom class component is simple and avoids an extra dependency.

**React 19 createPortal for Toast:**
- `createPortal(jsx, document.body)` works unchanged in React 19.
- Portals render elements outside the parent DOM hierarchy while maintaining React event bubbling.
- Ideal for Toast and Select dropdown to escape overflow/z-index issues.

**Intl.NumberFormat for Currency:**
- `new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS' }).format(82)` → `"‏82.00 ₪"` (with RTL mark in Hebrew locale).
- `new Intl.NumberFormat('en-US', { style: 'currency', currency: 'ILS' }).format(82)` → `"₪82.00"`.
- For consistency, the `formatCurrency` function should produce clean output. Consider using `en-IL` locale for ILS to get `₪82.00` format (symbol before number, no RTL marks), or use `Intl.NumberFormat` with `currencyDisplay: 'narrowSymbol'` to strip extra spacing.
- **Recommendation**: Test the actual `Intl.NumberFormat` output in the Node/browser environment and adjust locale if needed. The goal is: `₪82.00`, `$142.50`, `€200.00`. If Hebrew locale adds RTL marks, use `'en-IL'` for ILS instead.

**Zustand 5.0:**
- `create` function signature unchanged from v4 — `create<State>((set, get) => ({ ... }))`.
- `getState()` for accessing store state outside React (used for toast convenience functions).
- No breaking changes from v4 for the patterns used here.

### Testing Strategy

**General approach**: Co-located tests using Vitest + React Testing Library. Each component has a `*.test.tsx` file next to it.

**Test mock infrastructure** (already configured in `vitest.config.ts`):
- `react-i18next` → resolves to `src/__mocks__/react-i18next.ts` (returns translation keys)
- `*.module.scss` → resolves to `src/__mocks__/css-module.ts` (Proxy returning class names)

**Phosphor icons in tests**: Use `await import()` for any component that imports Phosphor icons:

```typescript
it('renders search icon', async () => {
  const { SearchInput } = await import('./SearchInput');
  render(<SearchInput value="" onChange={() => {}} />);
  // assertions...
});
```

**Testing priority per component:**
1. **Button**: Variant rendering, size classes, loading state, shortcut display, disabled, focus ring, click handler
2. **Card**: Children rendering, clickable behavior, hover class
3. **Badge**: Color mapping, StatusBadge status mapping, ConfidenceBadge threshold behavior (test boundary: 84, 85, 86)
4. **Input**: Label rendering, value change, error display, sr-only label
5. **Select**: Option rendering, search filter, keyboard navigation, portal rendering, click-outside-close
6. **SearchInput**: Icon rendering, clear button, value handling
7. **Toast**: Type-specific rendering, action button, close, auto-dismiss timing (use `vi.useFakeTimers`)
8. **ToastContainer**: Portal rendering, max 3 limit, toast stacking
9. **Skeleton**: Variant-specific border-radius, dimensions, shimmer class
10. **ErrorBoundary**: Error catching, fallback rendering, reset behavior, console.error logging
11. **Currency**: Precision tests, all 3 currencies, edge cases, WAC scenario

**Zustand store testing**: Test `useUIStore` separately — `addToast` adds toast, `removeToast` removes, toast convenience functions work.

**What NOT to test**: Don't test CSS visual output (colors, shadows) — test class names and structural rendering. Don't test `Intl.NumberFormat` internals — test that `formatCurrency` returns expected strings.

### Potential Pitfalls to Avoid

1. **DO NOT create a separate `<div id="toast-root">` in `index.html`** — just use `document.body` as portal target. Adding HTML requires modifying `index.html` which is unnecessary.
2. **DO NOT use `useState` for toast state** — use `useUIStore` Zustand store so toasts can be triggered from anywhere (hooks, event handlers, non-component code).
3. **DO NOT use `position: fixed` with `left`/`right`** for ToastContainer — use `inset-inline-start`/`inset-inline-end` for RTL support.
4. **DO NOT use native `<select>` element** for the Select component — the requirement is a custom dropdown with search filter.
5. **DO NOT use `setTimeout` directly in components for toast auto-dismiss** — manage timers in `ToastContainer` with proper cleanup via `useEffect` return.
6. **DO NOT forget `aria-live="polite"` on ToastContainer** — screen readers need to announce toasts.
7. **DO NOT use `@use` in `.module.scss` files for variables/mixins** — they're auto-imported via Vite `additionalData`. Adding `@use` causes duplication or errors.
8. **DO NOT use `left`/`right`/`text-align: left`** — use CSS logical properties exclusively.
9. **DO NOT use `#fff` (white)** for any text — use `$text-primary`, `$text-secondary`, or `$text-muted`.
10. **DO NOT add new npm dependencies** — everything needed is already installed.
11. **DO NOT use `React.FC` type** — use explicit function declarations with typed props: `export function Button({ variant, ...props }: ButtonProps)`.
12. **DO NOT put tests in `__tests__/` directories** — co-locate next to the component file.
13. **DO NOT forget to handle the `className` prop** on components — allow consumers to pass additional class names: `className={clsx(styles.button, className)}`. Note: `clsx` is not installed. Use template literals or simple string concatenation: `className={[styles.button, className].filter(Boolean).join(' ')}`.
14. **DO NOT create a `useToast` hook** as a React hook — use Zustand's `getState()` for convenience functions (the `toast` object). The toast convenience functions work outside React component trees.
15. **DO NOT forget `key` prop when rendering toast list** — use the `toast.id` (UUID).
16. **DO NOT use `react-error-boundary` library** — implement the class component directly. Keep it simple, no extra deps.
17. **DO NOT forget `prefers-reduced-motion`** on Skeleton shimmer — required by UX spec and accessibility rules.
18. **DO NOT make ErrorBoundary a functional component** — `getDerivedStateFromError` requires class component in React 19.

### References

- [Source: planning-artifacts/epics.md#Story-1.6] — Full acceptance criteria
- [Source: planning-artifacts/architecture.md#Frontend-Architecture] — Tech stack, component patterns, Zustand
- [Source: planning-artifacts/architecture.md#Naming-Patterns] — File/class/variable naming conventions
- [Source: planning-artifacts/architecture.md#Implementation-Patterns] — SCSS Modules, CSS logical properties, Phosphor icons
- [Source: planning-artifacts/architecture.md#Enforcement-Guidelines] — Currency utilities, testing, co-location rules
- [Source: planning-artifacts/architecture.md#Project-Structure] — Full directory tree, component structure
- [Source: planning-artifacts/architecture.md#Currency-Storage] — Integer storage, agora/cents, formatting at component level
- [Source: planning-artifacts/ux-design-specification.md#Button-Hierarchy] — 4 variants, hover, shortcut, max 1 primary
- [Source: planning-artifacts/ux-design-specification.md#Component-Strategy] — Foundation tokens per component
- [Source: planning-artifacts/ux-design-specification.md#Feedback-Patterns] — Toast types, durations, stacking rules
- [Source: planning-artifacts/ux-design-specification.md#Background-Elevation-Scale] — Card/input bg colors
- [Source: planning-artifacts/ux-design-specification.md#Financial-Semantic-Colors] — Badge color mappings
- [Source: planning-artifacts/ux-design-specification.md#Typography-Scale] — Font sizes per component
- [Source: planning-artifacts/ux-design-specification.md#Shadow-System] — Card shadows, glow
- [Source: planning-artifacts/ux-design-specification.md#Border-Radius] — Component-specific radii
- [Source: planning-artifacts/ux-design-specification.md#Accessibility-Considerations] — Touch targets, focus rings, reduced motion, RTL
- [Source: planning-artifacts/ux-design-specification.md#RTL-Implementation] — Logical properties, numbers LTR, icon flip
- [Source: planning-artifacts/ux-design-specification.md#Empty-States] — ErrorBoundary fallback tone
- [Source: implementation-artifacts/1-5-internationalization-rtl-support.md] — Previous story patterns, test mock infrastructure, i18n setup
- [Source: React 19 docs] — ErrorBoundary requires class component, createPortal unchanged
- [Source: MDN Intl.NumberFormat] — Currency formatting with ILS/USD/EUR locales

## Dev Agent Record

### Agent Model Used

Claude claude-4.6-opus (via Cursor)

### Debug Log References

- Badge `default` color class collided with CSS module mock's `default` export handler → renamed to `colorDefault` in SCSS, mapped via `COLOR_CLASS_MAP` in component.
- Phosphor icon dynamic imports in SearchInput and Toast cause slow first-load in full test suite → increased test timeout to 15s for first import tests.

### Completion Notes List

- **Task 1**: Button component with 4 variants (primary/secondary/danger/ghost), 3 sizes (sm/md/lg), loading spinner, keyboard shortcut hint, disabled state, focus ring. 14 tests.
- **Task 2**: Card component with `@include card-surface`, clickable variant with gold glow hover, keyboard accessible. 9 tests.
- **Task 3**: Badge (generic pill), StatusBadge (Lead/Design/Production/Shipped mapping), ConfidenceBadge (>=85 green, <85 warning "Check Me"). 15 tests.
- **Task 4**: Input (label, error, helper text, sr-only), Select (custom dropdown with portal, search filter, keyboard nav, click-outside), SearchInput (Phosphor MagnifyingGlass icon, clear button). 21 tests.
- **Task 5**: Toast system — Zustand useUIStore with addToast/removeToast, convenience `toast.success/error/warning/info`, ToastContainer with createPortal, max 3 visible, auto-dismiss timers (success/info 3s, error 5s, warning persistent), aria-live polite. 14 tests.
- **Task 6**: Skeleton with text/circle/rect variants, shimmer animation, prefers-reduced-motion respects. 9 tests.
- **Task 7**: ErrorBoundary class component, getDerivedStateFromError, componentDidCatch logging, Try Again reset, custom fallback prop, onError callback. 6 tests.
- **Task 8**: Currency utilities — toMinorUnits (Math.round for float safety), toDisplayAmount, formatCurrency (Intl.NumberFormat per locale), CURRENCY_CONFIG constant, Currency type. 22 tests including WAC precision scenario.
- **Task 9**: i18n keys added to en.json and he.json (errorBoundary, toast, confidenceBadge, select, searchInput). Barrel exports already in place.
- **Task 10**: tsc 0 errors, lint 0 warnings, 295/295 tests pass (112 new + 183 existing), build succeeds.

### Change Log

- 2026-02-07: Implemented Story 1.6 — all 10 tasks complete. 112 new tests added (295 total). 8 new components, 1 utility module, 1 Zustand store, i18n keys for both locales.
- 2026-02-07: Code review fixes applied (2H, 4M, 3L issues found and fixed):
  - H1: ErrorBoundary now uses i18n via extracted DefaultFallback functional component
  - H2: Select dropdown now positions relative to trigger via getBoundingClientRect + closes on scroll
  - M1: Removed duplicate onKeyDown from Select search input (portal event bubbling handles it)
  - M2: Changed ILS locale from he-IL to en-IL for clean ₪82.00 format; EUR locale from de-DE to en-DE for €200.00 format
  - M3: Replaced role="status" with role="listitem" on Toast to avoid duplicate aria-live with container
  - M4: SearchInput now always renders an accessible label (defaults to i18n key when label prop omitted)
  - L1: Card non-clickable hover now includes subtle border brighten per spec
  - L3: Tightened all currency test assertions to exact toBe() matches
  - New file: src/components/ErrorBoundary/DefaultFallback.tsx
  - 1 new test added (296 total), 0 regressions

### File List

**New files:**
- src/components/Button/Button.tsx
- src/components/Button/Button.module.scss
- src/components/Button/Button.test.tsx
- src/components/Card/Card.tsx
- src/components/Card/Card.module.scss
- src/components/Card/Card.test.tsx
- src/components/Badge/Badge.tsx
- src/components/Badge/StatusBadge.tsx
- src/components/Badge/ConfidenceBadge.tsx
- src/components/Badge/Badge.module.scss
- src/components/Badge/Badge.test.tsx
- src/components/Input/Input.tsx
- src/components/Input/Select.tsx
- src/components/Input/SearchInput.tsx
- src/components/Input/Input.module.scss
- src/components/Input/Input.test.tsx
- src/components/Toast/Toast.tsx
- src/components/Toast/ToastContainer.tsx
- src/components/Toast/Toast.module.scss
- src/components/Toast/Toast.test.tsx
- src/components/Skeleton/Skeleton.tsx
- src/components/Skeleton/Skeleton.module.scss
- src/components/Skeleton/Skeleton.test.tsx
- src/components/ErrorBoundary/ErrorBoundary.tsx
- src/components/ErrorBoundary/DefaultFallback.tsx
- src/components/ErrorBoundary/ErrorBoundary.module.scss
- src/components/ErrorBoundary/ErrorBoundary.test.tsx
- src/lib/currency.test.ts

**Replaced (were empty placeholders):**
- src/components/Button/index.ts
- src/components/Card/index.ts
- src/components/Badge/index.ts
- src/components/Input/index.ts
- src/components/Toast/index.ts
- src/components/Skeleton/index.ts
- src/components/ErrorBoundary/index.ts
- src/lib/currency.ts
- src/stores/useUIStore.ts

**Modified:**
- src/i18n/en.json (added components.* keys)
- src/i18n/he.json (added components.* keys)

**Sprint tracking:**
- _bmad-output/implementation-artifacts/sprint-status.yaml (1-6 status: in-progress → review)
- _bmad-output/implementation-artifacts/1-6-core-shared-ui-components-currency-utilities.md (status: ready-for-dev → review)
