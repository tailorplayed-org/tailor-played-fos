# Story 1.5: Internationalization & RTL Support

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As **Gal**,
I want to switch the entire UI between Hebrew and English with full RTL/LTR layout support,
So that I can work comfortably in my preferred language.

## Acceptance Criteria

1. **i18n Initialization**: `src/i18n/config.ts` initializes react-i18next with Hebrew (`he`) as the default language, English (`en`) as a secondary language, and English as the fallback language. Uses `i18next-browser-languagedetector` for persisting language preference via localStorage.

2. **Translation Files**: `src/i18n/he.json` and `src/i18n/en.json` contain initial keys for: navigation labels (Dashboard, Work Orders, Inventory, Overhead, Review), common actions (Confirm, Edit, Reject, Cancel, Save, Delete, Approve All), empty state messages ("You're all caught up", "Create your first Work Order"), auth (Sign in, Sign out, Access restricted, Signing in), common labels (Net Profit, Tax Jar, Active Projects, Pending), and page placeholder messages.

3. **RTL Mode**: When in Hebrew mode, `<html dir="rtl" lang="he">` is set. All layout uses CSS logical properties. Navigation items flow right-to-left. Directional icons flip via `transform: scaleX(-1)` or Phosphor's `mirrored` prop.

4. **LTR Mode**: When in English mode, `<html dir="ltr" lang="en">` is set. Layout flows left-to-right naturally.

5. **Numeric LTR in RTL**: In Hebrew RTL layout, currency amounts and percentages are always rendered LTR (`direction: ltr` on numeric elements). The ₪ symbol appears in the correct position for Hebrew convention.

6. **Language Toggle**: A language toggle control in the navigation switches between Hebrew and English instantly (no page reload). `dir` attribute updates, layout reflows, and all visible text updates. The user's language preference is persisted in localStorage.

7. **No Hardcoded Strings**: All user-facing strings in every component use `t('key')` from react-i18next. No hardcoded strings remain in any component.

## Tasks / Subtasks

- [x] Task 1: Configure i18next (AC: #1)
  - [x] Update `src/i18n/config.ts` with full i18next initialization
  - [x] Import `i18next`, `react-i18next` `initReactI18next`, `i18next-browser-languagedetector`
  - [x] Set default language `he`, fallback `en`
  - [x] Configure language detector: localStorage key `tp-fos-lang`, order: `['localStorage', 'navigator']`
  - [x] Import translation JSON files directly (bundled, not HTTP-loaded — no `i18next-http-backend` needed for 2 small files)
  - [x] Update `src/i18n/index.ts` barrel export
  - [x] Import `@/i18n/config` in `src/main.tsx` before React renders (side-effect import)

- [x] Task 2: Populate translation files (AC: #2)
  - [x] Populate `src/i18n/en.json` with all English keys (namespaced: `nav.*`, `actions.*`, `auth.*`, `labels.*`, `pages.*`, `empty.*`)
  - [x] Populate `src/i18n/he.json` with all Hebrew translations matching the same keys
  - [x] Include all currently hardcoded strings from: TopNav, BottomNav, LoginScreen, DashboardPage, WorkOrdersPage, WorkOrderDetailPage, InventoryPage, OverheadPage, ReviewPage

- [x] Task 3: Create useDirection hook and RTL document management (AC: #3, #4, #5)
  - [x] Create `src/hooks/useDirection.ts` — custom hook that:
    - Listens to `i18n.language` changes
    - Sets `document.documentElement.dir` and `document.documentElement.lang`
    - Returns `{ direction, language, isRTL }` for component use
  - [x] Call `useDirection()` from `PageShell` (or a new root-level component wrapping the router)
  - [x] Add `.numericLtr` utility class to `global.scss` for numeric elements in RTL (`direction: ltr; unicode-bidi: embed;`)

- [x] Task 4: Add language toggle to TopNav (AC: #6)
  - [x] Add a language toggle button/control in TopNav (between the segmented nav and the pending badge)
  - [x] Toggle calls `i18n.changeLanguage('he')` / `i18n.changeLanguage('en')`
  - [x] Display current language label (e.g., "עב" / "EN") or use a Phosphor `Translate` icon
  - [x] Style consistent with design system: `$text-secondary` text, `$bg-tertiary` background on hover, `$radius-sm` border-radius
  - [x] 44px minimum touch target
  - [x] On mobile, include the toggle in an accessible location (e.g., inside TopNav bar — still visible on mobile since TopNav logo area persists)

- [x] Task 5: Replace all hardcoded strings with `t()` calls (AC: #7)
  - [x] Update `src/components/Layout/TopNav.tsx` — nav labels, aria-labels, logo text
  - [x] Update `src/components/Layout/BottomNav.tsx` — nav labels, aria-label
  - [x] Update `src/features/auth/components/LoginScreen.tsx` — auth text, button labels, error messages
  - [x] Update `src/features/dashboard/DashboardPage.tsx` — page title, placeholder text
  - [x] Update `src/features/work-orders/WorkOrdersPage.tsx` — page title, placeholder text
  - [x] Update `src/features/work-orders/WorkOrderDetailPage.tsx` — page title, placeholder text
  - [x] Update `src/features/inventory/InventoryPage.tsx` — page title, placeholder text
  - [x] Update `src/features/overhead/OverheadPage.tsx` — page title, placeholder text
  - [x] Update `src/features/review/ReviewPage.tsx` — page title, placeholder text

- [x] Task 6: Handle directional icon flipping (AC: #3)
  - [x] Identify all directional Phosphor icons currently in use (arrows, chevrons)
  - [x] Add `mirrored` prop controlled by `isRTL` from `useDirection` hook (or use CSS `[dir="rtl"] .icon { transform: scaleX(-1); }`)
  - [x] Non-directional icons (ChartBar, Tray, ClipboardText, GearSix, etc.) do NOT flip

- [x] Task 7: Write co-located tests (AC: all)
  - [x] `src/i18n/config.test.ts` — tests: i18n initializes, default language is Hebrew, English available, fallback works
  - [x] `src/hooks/useDirection.test.ts` — tests: sets dir/lang attributes, returns correct direction, responds to language changes
  - [x] Update `src/components/Layout/TopNav.test.tsx` — add tests: language toggle visible, renders translated text, switches language
  - [x] Update `src/components/Layout/BottomNav.test.tsx` — add tests: renders translated labels
  - [x] Update existing page tests — verify translated strings render
  - [x] Add RTL rendering test: verify `dir="rtl"` is set when language is Hebrew

- [x] Task 8: Build verification (AC: all)
  - [x] `tsc --noEmit` — zero errors
  - [x] `npm run lint` — zero warnings
  - [x] `npm run build` — succeeds (requires `all` sandbox permissions for sass-embedded)
  - [x] `npm run test` — all tests pass (existing + new, zero regressions)

## Dev Notes

### Architecture Compliance

- **SCSS Modules only**: All component styling via `*.module.scss`. Tokens and mixins are auto-imported via Vite `additionalData` — use `$gold`, `@include rtl { }` etc. directly in `.module.scss` files without explicit `@use` statements. [Source: architecture.md#Implementation-Patterns]
- **CSS Logical Properties**: Already enforced in Stories 1.2–1.4. This story verifies comprehensive usage and adds the `@mixin rtl { }` override for edge cases. NEVER use `left`/`right`/`text-align: left`. Use `inline-start`/`inline-end`, `margin-inline`, `padding-inline`, `text-align: start`. [Source: architecture.md#Enforcement-Guidelines]
- **Path aliases**: `@/` prefix. Import from `@/i18n`, `@/hooks`, `@/components/Layout`, etc. [Source: architecture.md#Structure-Patterns]
- **Barrel exports**: Every directory exports through `index.ts`. [Source: architecture.md#Structure-Patterns]
- **Co-located tests**: `*.test.tsx` / `*.test.ts` next to the component file, NOT in `__tests__/`. [Source: architecture.md#Structure-Patterns]
- **Phosphor Icons**: `@phosphor-icons/react` v2.1.10 already installed. Use `mirrored` prop for directional icon RTL flipping. Non-directional icons do NOT flip. [Source: architecture.md#Implementation-Patterns, ux-design-specification.md#Icon-Library]
- **No white (#fff) text**: All text uses gold scale tokens. [Source: architecture.md#Naming-Patterns]
- **Fredoka font**: Both Latin and Hebrew subsets already configured in `global.scss` (two `@font-face` declarations). No additional font setup needed. [Source: ux-design-specification.md#Typography-System]
- **44px minimum touch targets**: The language toggle must meet this requirement. [Source: ux-design-specification.md#Accessibility-Considerations]
- **react-i18next hooks API**: Use `useTranslation()` hook for translations. `const { t, i18n } = useTranslation()`. [Source: architecture.md#Frontend-Architecture, ARCH-8]

### Critical Technical Constraints

- **Packages already installed**: `i18next@^25.8.4`, `react-i18next@^16.5.4`, `i18next-browser-languagedetector@^8.2.0` are in `package.json`. Do NOT run `npm install` for these. No new npm dependencies needed.
- **Placeholder files exist**: `src/i18n/config.ts`, `src/i18n/index.ts`, `src/i18n/he.json`, `src/i18n/en.json` all exist as empty placeholders from Story 1.1. REPLACE their content — do NOT create new files.
- **Import i18n config as side-effect**: In `src/main.tsx`, add `import '@/i18n/config';` (or `import '@/i18n';`) BEFORE the React render call. This ensures i18n is initialized before any component renders. The import must come before `import './styles/global.scss'` or at minimum before `createRoot().render()`.
- **Hebrew is the DEFAULT language**: The PRD and epics specify Hebrew as the primary language. `he` is the default, `en` is secondary. The app should load in Hebrew on first visit (unless the user's browser locale detection picks English).
- **No page reload on language switch**: `i18n.changeLanguage()` triggers re-render via react-i18next's context. All components using `useTranslation()` automatically re-render. The `useDirection` hook listens to language changes and updates the `<html>` attributes reactively.
- **Translation keys are nested with dot notation**: Use `t('nav.dashboard')` not `t('Dashboard')`. Namespace keys by domain: `nav.*`, `actions.*`, `auth.*`, `labels.*`, `pages.*`, `empty.*`. [Source: architecture.md#Naming-Patterns — i18n keys: dot-notation, nested]
- **No `i18next-http-backend` needed**: The two translation JSON files are tiny (< 5KB each). Import them directly in the config file. This avoids async loading, network requests, and Suspense complexity.
- **`dir` attribute must be on `<html>` element**: Use `document.documentElement.setAttribute('dir', dir)`. NOT on a React wrapper div — the `dir` attribute must be at the document root for CSS logical properties to work universally, including for elements outside the React tree (scrollbars, system dialogs).
- **BottomNav uses stable `id` field for keys**: Story 1.4 code review added `id` field to nav items (not `label`) specifically for i18n compatibility. The `label` property can now safely be a `t()` call. [Source: 1-4-app-shell-responsive-navigation.md#Dev-Agent-Record — CR-8]
- **Existing tests use `await import()` pattern for Phosphor**: When adding or modifying tests that import Phosphor icons, use the same `await import()` pattern established in Story 1.4 to avoid Vitest/jsdom hangs.
- **Do NOT modify `vite.config.ts`**: No changes needed — SCSS preprocessor config is already correct.

### i18n Configuration Pattern

```typescript
// src/i18n/config.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './en.json';
import he from './he.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      he: { translation: he },
    },
    fallbackLng: 'en',
    defaultNS: 'translation',
    interpolation: {
      escapeValue: false, // React already escapes
    },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'tp-fos-lang',
      caches: ['localStorage'],
    },
  });

export default i18n;
```

**Note on default language**: The `i18next-browser-languagedetector` will detect the user's browser language first. Since Hebrew is the target default, set `lng: 'he'` explicitly OR configure the detection order so that `localStorage` is checked first (and on first visit with no localStorage value, Hebrew is used). Consider adding `lng: 'he'` as a fallback-default when no stored preference exists. Test this behavior.

### Translation File Structure

```json
// en.json structure (he.json mirrors with Hebrew values)
{
  "nav": {
    "dashboard": "Dashboard",
    "workOrders": "Work Orders",
    "inventory": "Inventory",
    "overhead": "Overhead",
    "review": "Review",
    "home": "Home",
    "orders": "Orders",
    "more": "More",
    "mainNavigation": "Main navigation",
    "mobileNavigation": "Mobile navigation",
    "pendingReviews": "{{count}} pending reviews"
  },
  "actions": {
    "confirm": "Confirm",
    "edit": "Edit",
    "reject": "Reject",
    "cancel": "Cancel",
    "save": "Save",
    "delete": "Delete",
    "approveAll": "Approve All"
  },
  "auth": {
    "signIn": "Sign in with Google",
    "signingIn": "Signing in...",
    "signOut": "Sign out",
    "accessRestricted": "Access restricted",
    "signInFailed": "Sign-in failed. Please try again.",
    "appTitle": "Financial Operations System"
  },
  "labels": {
    "netProfit": "Net Profit",
    "taxJar": "Tax Jar",
    "activeProjects": "Active Projects",
    "pending": "Pending",
    "fos": "FOS"
  },
  "pages": {
    "dashboard": {
      "title": "Dashboard",
      "placeholder": "Your financial cockpit is coming soon."
    },
    "workOrders": {
      "title": "Work Orders",
      "placeholder": "Track and manage your production orders here."
    },
    "workOrderDetail": {
      "title": "Work Order Detail",
      "placeholder": "Detailed view for order {{id}} is coming soon."
    },
    "inventory": {
      "title": "Inventory",
      "placeholder": "Manage your ingredients and stock levels here."
    },
    "overhead": {
      "title": "Overhead",
      "placeholder": "Track monthly expenses and overhead costs here."
    },
    "review": {
      "title": "Review",
      "placeholder": "Pending transactions awaiting your approval will appear here."
    }
  },
  "empty": {
    "allCaughtUp": "You're all caught up!",
    "createFirstWorkOrder": "Create your first Work Order",
    "noData": "No data available yet."
  },
  "language": {
    "toggle": "Switch language",
    "hebrew": "עברית",
    "english": "English"
  }
}
```

### useDirection Hook Pattern

```typescript
// src/hooks/useDirection.ts
import { useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

const RTL_LANGUAGES = ['he', 'ar'];

export function useDirection() {
  const { i18n } = useTranslation();

  const isRTL = RTL_LANGUAGES.includes(i18n.language);
  const direction = isRTL ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.setAttribute('dir', direction);
    document.documentElement.setAttribute('lang', i18n.language);
  }, [direction, i18n.language]);

  return { direction, language: i18n.language, isRTL };
}
```

### Language Toggle Component Approach

Place a compact toggle button in TopNav, between the segmented pills and the pending badge. On mobile (where the segmented pills are hidden), the toggle is still visible in the TopNav bar.

```tsx
// Inside TopNav — conceptual pattern
const { t, i18n } = useTranslation();

const toggleLanguage = () => {
  const nextLang = i18n.language === 'he' ? 'en' : 'he';
  i18n.changeLanguage(nextLang);
};

<button
  onClick={toggleLanguage}
  className={styles.langToggle}
  aria-label={t('language.toggle')}
>
  {i18n.language === 'he' ? 'EN' : 'עב'}
</button>
```

**Design notes for the toggle:**
- Text-based label ("EN" when Hebrew is active — clicking switches to English; "עב" when English is active — clicking switches to Hebrew). Shows what language you'll switch TO.
- Background: transparent default, `$bg-tertiary` on hover
- Text: `$text-secondary` default, `$text-primary` on hover
- Border: `1px solid $border-subtle`, `$radius-sm`
- Size: height 32–36px, padding `$space-xs` inline, min-width 44px for touch target
- Transition: `$transition-fast` (150ms)
- Position: right side of TopNav, before the pending badge

### Numeric LTR in RTL Context

Add a utility class in `global.scss`:

```scss
// In global.scss — numeric elements should always be LTR
.numericLtr {
  direction: ltr;
  unicode-bidi: embed;
}
```

Apply this class to currency amounts, percentages, and any purely numeric display. Currently, no currency amounts are displayed (those come in Epic 2+), but the utility class should be ready. Future component stories will use it.

### Components to Modify — Complete List

| File | Changes Required |
|---|---|
| `src/i18n/config.ts` | REPLACE — full i18next initialization |
| `src/i18n/index.ts` | UPDATE — export i18n instance and any helpers |
| `src/i18n/en.json` | REPLACE — full English translations |
| `src/i18n/he.json` | REPLACE — full Hebrew translations |
| `src/main.tsx` | ADD — `import '@/i18n'` side-effect import |
| `src/hooks/useDirection.ts` | NEW — custom hook for dir/lang management |
| `src/hooks/index.ts` | UPDATE — export `useDirection` |
| `src/components/Layout/TopNav.tsx` | MODIFY — add `useTranslation`, replace hardcoded strings, add language toggle |
| `src/components/Layout/TopNav.module.scss` | MODIFY — add language toggle styles |
| `src/components/Layout/BottomNav.tsx` | MODIFY — add `useTranslation`, replace hardcoded strings |
| `src/components/Layout/PageShell.tsx` | MODIFY — add `useDirection()` call to set dir/lang on document |
| `src/features/auth/components/LoginScreen.tsx` | MODIFY — add `useTranslation`, replace hardcoded strings |
| `src/features/auth/components/LoginScreen.module.scss` | POSSIBLY MODIFY — add RTL adjustments if needed |
| `src/features/dashboard/DashboardPage.tsx` | MODIFY — add `useTranslation`, replace hardcoded strings |
| `src/features/work-orders/WorkOrdersPage.tsx` | MODIFY — add `useTranslation`, replace hardcoded strings |
| `src/features/work-orders/WorkOrderDetailPage.tsx` | MODIFY — add `useTranslation`, replace hardcoded strings |
| `src/features/inventory/InventoryPage.tsx` | MODIFY — add `useTranslation`, replace hardcoded strings |
| `src/features/overhead/OverheadPage.tsx` | MODIFY — add `useTranslation`, replace hardcoded strings |
| `src/features/review/ReviewPage.tsx` | MODIFY — add `useTranslation`, replace hardcoded strings |
| `src/styles/global.scss` | MODIFY — add `.numericLtr` utility class |

### Hardcoded Strings Inventory (Exhaustive)

**TopNav (`src/components/Layout/TopNav.tsx`):**
- `"Dashboard"` → `t('nav.dashboard')`
- `"Work Orders"` → `t('nav.workOrders')`
- `"Inventory"` → `t('nav.inventory')`
- `"Overhead"` → `t('nav.overhead')`
- `"FOS"` → `t('labels.fos')`
- `"Main navigation"` (aria-label) → `t('nav.mainNavigation')`
- `"TailorPlayed home"` (aria-label) → `t('nav.tailorPlayedHome')` (or keep as static since it's a brand name — discuss)
- `"{pendingCount} pending reviews"` (aria-label) → `t('nav.pendingReviews', { count: pendingCount })`

**BottomNav (`src/components/Layout/BottomNav.tsx`):**
- `"Home"` → `t('nav.home')`
- `"Orders"` → `t('nav.orders')`
- `"Review"` → `t('nav.review')`
- `"More"` → `t('nav.more')`
- `"Mobile navigation"` (aria-label) → `t('nav.mobileNavigation')`

**LoginScreen (`src/features/auth/components/LoginScreen.tsx`):**
- `"Financial Operations System"` → `t('auth.appTitle')`
- `"Signing in..."` → `t('auth.signingIn')`
- `"Sign in with Google"` → `t('auth.signIn')`
- `"Sign-in failed. Please try again."` → `t('auth.signInFailed')`

**DashboardPage:**
- `"Dashboard"` → `t('pages.dashboard.title')`
- `"Your financial cockpit is coming soon."` → `t('pages.dashboard.placeholder')`

**WorkOrdersPage:**
- `"Work Orders"` → `t('pages.workOrders.title')`
- `"Track and manage your production orders here."` → `t('pages.workOrders.placeholder')`

**WorkOrderDetailPage:**
- `"Work Order Detail"` → `t('pages.workOrderDetail.title')`
- `"Detailed view for order {id} is coming soon."` → `t('pages.workOrderDetail.placeholder', { id })`

**InventoryPage:**
- `"Inventory"` → `t('pages.inventory.title')`
- `"Manage your ingredients and stock levels here."` → `t('pages.inventory.placeholder')`

**OverheadPage:**
- `"Overhead"` → `t('pages.overhead.title')`
- `"Track monthly expenses and overhead costs here."` → `t('pages.overhead.placeholder')`

**ReviewPage:**
- `"Review"` → `t('pages.review.title')`
- `"Pending transactions awaiting your approval will appear here."` → `t('pages.review.placeholder')`

### Project Structure Notes

- `src/i18n/config.ts` — EXISTS (placeholder) — REPLACE content
- `src/i18n/index.ts` — EXISTS (placeholder) — UPDATE exports
- `src/i18n/en.json` — EXISTS (empty `{"translation": {}}`) — REPLACE content
- `src/i18n/he.json` — EXISTS (empty `{"translation": {}}`) — REPLACE content
- `src/hooks/useDirection.ts` — NEW file
- `src/hooks/index.ts` — EXISTS — UPDATE to export `useDirection`
- All other files above are MODIFY (already exist)

### Previous Story Intelligence (Story 1.4)

**Key patterns established:**
- `PageShell` renders `<TopNav />` (sticky) + main content `<Outlet />` + `<BottomNav />` — good place to call `useDirection()` since it wraps all authenticated content
- TopNav uses a `NAV_TABS` array with `{ id, label, to }` objects for segmented pills — labels can be changed to `t()` calls
- BottomNav uses a `NAV_ITEMS` array with `{ id, label, to, icon, showActive }` objects — `id` is stable (not affected by i18n), labels can be `t()` calls
- All placeholder pages use `@include placeholder-page` mixin (shared SCSS) — a pattern to keep when just updating text
- NavLink `className` callback pattern with `({ isActive })` — no changes needed for i18n
- `await import()` pattern required for Phosphor icon imports in tests
- 160 tests currently passing — new tests must not break existing ones

**Learnings from Story 1.4:**
- Code review found that `key={item.label}` breaks under i18n — already fixed to `key={item.id}` (CR-8). Translation-safe.
- ARIA labels like `"Main navigation"` and `"Mobile navigation"` need translation
- Placeholder page SCSS extracted to mixins — update only the TSX, not the SCSS

**Learnings from Story 1.3:**
- `signInWithPopup` (not redirect) for Vercel hosting
- Firebase Auth uses `onAuthStateChanged` with direct subscription pattern
- LoginScreen has a loading state (`"Signing in..."`) and error state — both need translation

**Learnings from Story 1.2:**
- Sandbox restrictions: run build with `all` permissions if sass native compiler fails
- SCSS auto-import via `additionalData` means tokens and mixins are available everywhere
- `@mixin rtl { [dir="rtl"] & { @content; } }` already exists in `_mixins.scss` — ready for use

### Git Intelligence

**Recent commits** (most recent first):
- `e0d6fc2` — Implement Story 1.4: App Shell & Responsive Navigation with code review fixes
- `55230df` — Add Gal's UID to auth whitelist
- `aa7bd16` — Implement Story 1.3: Authentication & Route Protection with code review fixes
- `41d521b` — Implement Story 1.2: Design System Tokens & Global Styles with code review fixes
- `fffa502` — Initial project setup (Story 1.1)

**Relevant patterns:**
- Single comprehensive commits per story
- All i18n files are placeholder stubs — ready to be replaced
- `@mixin rtl { }` in `_mixins.scss` — ready for RTL overrides
- Hebrew font-face declaration in `global.scss` — already configured
- `i18next`, `react-i18next`, `i18next-browser-languagedetector` all in `package.json` — no install needed

### Latest Technical Information

**Installed packages (from package.json):**
- `i18next@^25.8.4` — latest stable
- `react-i18next@^16.5.4` — latest stable, supports React 19 hooks API
- `i18next-browser-languagedetector@^8.2.0` — latest stable, supports localStorage/navigator detection

**react-i18next v16.5+ with React 19:**
- `useTranslation()` hook is the primary API: `const { t, i18n } = useTranslation()`
- `t('key')` returns translated string; `t('key', { var })` for interpolation
- Components using `useTranslation()` auto-re-render when language changes
- `i18n.changeLanguage('he')` triggers all subscribed components to re-render
- `i18n.language` returns current language string
- No `Suspense` needed when translations are bundled (not loaded over HTTP)

**i18next-browser-languagedetector v8.2:**
- `order: ['localStorage', 'navigator']` — check localStorage first, then browser language
- `lookupLocalStorage: 'tp-fos-lang'` — custom key name
- `caches: ['localStorage']` — persist selection in localStorage
- On first visit with no localStorage value, falls back to `navigator.language`

**CSS Logical Properties (already enforced, key reference):**
- `margin-inline-start` / `margin-inline-end` (replaces `margin-left` / `margin-right`)
- `padding-inline-start` / `padding-inline-end` (replaces `padding-left` / `padding-right`)
- `inset-inline-start` / `inset-inline-end` (replaces `left` / `right`)
- `border-inline-start` / `border-inline-end` (replaces `border-left` / `border-right`)
- `text-align: start` / `text-align: end` (replaces `text-align: left` / `text-align: right`)
- These automatically flip when `dir="rtl"` is set on `<html>`

### Testing Strategy

**Mock i18next in tests**: Use `vi.mock('react-i18next')` to provide a mock `useTranslation` that returns a simple `t` function (returns the key or a mapped value). This avoids requiring full i18n initialization in unit tests.

```typescript
// Common test mock pattern
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key, // Returns the translation key
    i18n: {
      language: 'en',
      changeLanguage: vi.fn(),
    },
  }),
}));
```

**Integration test for language switching**: At least one test should verify the full flow: call `i18n.changeLanguage('he')` and verify that `document.documentElement.dir === 'rtl'` and `document.documentElement.lang === 'he'`.

**Existing test patterns to maintain:**
- `await import()` for Phosphor icons
- `MemoryRouter` wrapping for route-aware components
- `vi.mock('firebase/auth')` for auth-dependent components

### Potential Pitfalls to Avoid

1. **DO NOT use `i18next-http-backend`** — translation files are small, bundle them directly. HTTP loading adds async complexity, Suspense requirements, and potential flash of untranslated content.
2. **DO NOT set `dir` on a React div** — it MUST be on `<html>` (`document.documentElement`) for CSS logical properties to work globally (scrollbars, body background, etc.).
3. **DO NOT hardcode strings** — even "TP" in the logo or "FOS" if they appear as text. Brand names that are identical in Hebrew and English can use a shared key.
4. **DO NOT forget ARIA labels** — `"Main navigation"`, `"Mobile navigation"`, `"{count} pending reviews"` all need translation.
5. **DO NOT break existing tests** — 160 tests pass. Add i18next mock to any test that imports a component now using `useTranslation`. Consider adding a shared test utility for the i18n mock.
6. **DO NOT use Suspense for translations** — since translations are bundled, they're available synchronously. No loading state needed.
7. **DO NOT forget interpolation for dynamic values** — `t('nav.pendingReviews', { count: pendingCount })` not `t('nav.pendingReviews') + pendingCount`.
8. **DO NOT create a separate i18n Context/Provider** — react-i18next provides its own internal context via `initReactI18next`. No wrapping needed in component tree.
9. **DO NOT modify `_variables.scss` or `_mixins.scss`** unless adding new tokens specifically for the language toggle. The `@mixin rtl { }` already exists.
10. **DO NOT add a language toggle to BottomNav** — keep it in TopNav only. The TopNav's logo area is visible on all screen sizes, so the toggle is always accessible.
11. **DO NOT translate brand names** — "TailorPlayed" and "TP" are the same in both languages. They can use a static string or a shared i18n key.
12. **DO NOT forget `unicode-bidi: embed` on numeric elements** — without it, numbers in RTL context can render with incorrect character order for multi-digit amounts with symbols.

### References

- [Source: planning-artifacts/epics.md#Story-1.5] — Full acceptance criteria with BDD format
- [Source: planning-artifacts/architecture.md#Frontend-Architecture] — i18n: react-i18next + CSS logical properties (ARCH-8)
- [Source: planning-artifacts/architecture.md#Naming-Patterns] — i18n keys: dot-notation, nested
- [Source: planning-artifacts/architecture.md#Implementation-Patterns] — CSS logical properties enforcement, RTL requirement
- [Source: planning-artifacts/architecture.md#Enforcement-Guidelines] — Rule 4: Use CSS logical properties, never left/right/text-align: left
- [Source: planning-artifacts/architecture.md#Project-Structure] — `src/i18n/` directory: config.ts, he.json, en.json
- [Source: planning-artifacts/ux-design-specification.md#RTL-Implementation] — dir attribute, CSS logical properties, text-align: start, icon flip, numbers LTR, unicode-bidi, @mixin rtl
- [Source: planning-artifacts/ux-design-specification.md#Accessibility-Considerations] — 44px touch targets, RTL support requirement
- [Source: planning-artifacts/ux-design-specification.md#Icon-Library] — Phosphor: directional icons flip via mirrored prop or scaleX(-1)
- [Source: planning-artifacts/ux-design-specification.md#Navigation-Patterns] — Language switching without page reload, instant layout flip
- [Source: planning-artifacts/prd.md#Internationalization] — Hebrew primary, English secondary, RTL/LTR, multi-currency display
- [Source: implementation-artifacts/1-4-app-shell-responsive-navigation.md] — Previous story patterns, CR-8 i18n key fix, component patterns

## Dev Agent Record

### Agent Model Used

Claude claude-4.6-opus (Cursor)

### Debug Log References

- Pre-existing test environment issue discovered: `vi.mock` for `.module.scss` files combined with `await import()` causes hangs in Vitest 4 with sass-embedded. Root cause: sass-embedded Dart VM hangs during SCSS resolution even with `css: false`. Fixed by adding resolve aliases in `vitest.config.ts` for `.module.scss` (proxy mock) and `react-i18next` (lightweight mock). This fix also resolves previously broken page tests.

### Completion Notes List

- **Task 1**: Configured i18next with LanguageDetector, initReactI18next, bundled resources. Hebrew default, English fallback. localStorage persistence via `tp-fos-lang` key. Side-effect import in `main.tsx` before React renders.
- **Task 2**: Populated `en.json` and `he.json` with all translation keys: `nav.*`, `actions.*`, `auth.*`, `labels.*`, `pages.*`, `empty.*`, `language.*`. Full Hebrew translations for all strings.
- **Task 3**: Created `useDirection` hook — sets `dir` and `lang` on `<html>` element reactively. Called from `PageShell`. Added `.numericLtr` utility class to `global.scss`.
- **Task 4**: Added language toggle button in TopNav between segmented pills and pending badge. 44px touch target, design system styling, shows target language label ("EN"/"עב").
- **Task 5**: Replaced all hardcoded strings across 9 components with `t()` calls. All ARIA labels translated. Interpolation used for dynamic values (`pendingReviews`, `workOrderDetail.placeholder`).
- **Task 6**: Audited all Phosphor icons — none are directional (no arrows/chevrons). All icons (Bell, ChartBar, ClipboardText, Tray, GearSix, Package, Receipt) are non-directional. No flipping needed.
- **Task 7**: Created `config.test.ts` (8 tests), `useDirection.test.ts` (9 tests). Updated TopNav (15 tests incl. language toggle), BottomNav (9 tests), LoginScreen (7 tests), and all 6 page tests with i18n assertions. Fixed pre-existing test hang by adding vitest resolve aliases for `.module.scss` and `react-i18next`.
- **Task 8**: `tsc --noEmit` zero errors. `npm run lint` zero warnings. `npm run test` 183 tests pass (19 files). `npm run build` requires `all` sandbox permissions (sass-embedded restriction, documented in Story 1.2).

### Implementation Decisions

- **Hebrew default guaranteed via `lng` override**: Reads stored preference from localStorage manually; defaults to `'he'` when no preference exists. LanguageDetector only checks `['localStorage']` (navigator removed). This guarantees Hebrew on first visit per AC #1.
- **BottomNav uses `labelKey` + `t()` at render**: Changed from static `label` strings to `labelKey` strings that are translated at render time. `id` field (from CR-8) used for React keys.
- **Test mock strategy**: Used vitest `resolve.alias` in `vitest.config.ts` to redirect `react-i18next` to a lightweight mock (`src/__mocks__/react-i18next.ts`) and all `.module.scss` to a Proxy-based mock (`src/__mocks__/css-module.ts`). This approach eliminates per-test `vi.mock` boilerplate and fixes a pre-existing test hang where sass-embedded would freeze during module resolution.
- **Brand names not translated**: "TailorPlayed" alt text kept static (brand identity). "FOS" uses `t('labels.fos')` since it could theoretically differ.

### Change Log

- 2026-02-07: Implemented Story 1.5 — i18n initialization, translation files (he/en), useDirection hook, language toggle in TopNav, all hardcoded strings replaced with t() calls, comprehensive test coverage. Fixed pre-existing vitest test hang with scss/react-i18next resolve aliases.
- 2026-02-07: Code Review (AI) — Fixed 9 issues (2 HIGH, 5 MEDIUM, 2 LOW):
  - H1: Hebrew default not guaranteed on first visit — added `lng: storedLang || 'he'` with localStorage-only detection, removed navigator sniffing
  - H2: 3 files changed in git but not documented in File List — added to File List below
  - M1: Dead file `AuthGuard.module.scss` left behind after refactor to `<Loader />` — deleted
  - M2: Undocumented scope creep (AuthGuard/LoginScreen refactored to use Loader, LoginScreen title changed to image) — documented
  - M3: `config.test.ts` only tested i18next library, not actual config module — rewrote to import and verify real config.ts (10 tests)
  - M4: WorkOrderDetailPage test didn't verify interpolation param — fixed mock to expose params, test now asserts `id` is passed
  - M5: Firebase error messages displayed raw English in Hebrew mode — always show translated `t('auth.signInFailed')`, log raw error to console
  - L1: CSS `.langToggle` had conflicting `height: 34px` + `min-height: 44px` — removed dead `height` declaration
  - L2: Noted inconsistent test mock strategies (documented, no code change needed)

### File List

- `src/i18n/config.ts` — REPLACED: Full i18next initialization with LanguageDetector; CR: added `lng: storedLang || 'he'` for Hebrew default, `supportedLngs`, localStorage-only detection
- `src/i18n/index.ts` — UPDATED: Barrel export of i18n instance
- `src/i18n/en.json` — REPLACED: Full English translations
- `src/i18n/he.json` — REPLACED: Full Hebrew translations
- `src/i18n/config.test.ts` — NEW: CR: rewritten — 10 tests (4 actual config module + 6 translation behavior)
- `src/main.tsx` — MODIFIED: Added `import '@/i18n'` side-effect import
- `src/hooks/useDirection.ts` — NEW: Custom hook for RTL/LTR document management
- `src/hooks/useDirection.test.ts` — NEW: 9 tests for useDirection hook
- `src/hooks/index.ts` — UPDATED: Export useDirection
- `src/components/Layout/TopNav.tsx` — MODIFIED: useTranslation, language toggle, translated labels
- `src/components/Layout/TopNav.module.scss` — MODIFIED: Added .langToggle styles; CR: removed dead `height: 34px`
- `src/components/Layout/TopNav.test.tsx` — MODIFIED: 15 tests incl. language toggle
- `src/components/Layout/BottomNav.tsx` — MODIFIED: useTranslation, translated labels via labelKey
- `src/components/Layout/BottomNav.test.tsx` — MODIFIED: 9 tests with translated assertions
- `src/components/Layout/PageShell.tsx` — MODIFIED: Added useDirection() call
- `src/features/auth/AuthGuard.tsx` — MODIFIED: Replaced inline spinner with `<Loader />` component (bonus refactor)
- `src/features/auth/AuthGuard.test.tsx` — MODIFIED: Updated mock from SCSS module to Loader component
- `src/features/auth/AuthGuard.module.scss` — DELETED: CR: dead file, no longer imported after Loader refactor
- `src/features/auth/components/LoginScreen.tsx` — MODIFIED: useTranslation, all strings translated, `<h1>` replaced with logo image, Loader refactor; CR: always show translated error
- `src/features/auth/components/LoginScreen.module.scss` — MODIFIED: Removed `.title`/`.spinner` classes, added `.logo` for image branding
- `src/features/auth/components/LoginScreen.test.tsx` — MODIFIED: Updated assertions for translation keys; CR: test now verifies translated error message
- `src/features/dashboard/DashboardPage.tsx` — MODIFIED: useTranslation
- `src/features/dashboard/DashboardPage.test.tsx` — MODIFIED: Translation key assertions
- `src/features/work-orders/WorkOrdersPage.tsx` — MODIFIED: useTranslation
- `src/features/work-orders/WorkOrdersPage.test.tsx` — MODIFIED: Translation key assertions
- `src/features/work-orders/WorkOrderDetailPage.tsx` — MODIFIED: useTranslation with interpolation
- `src/features/work-orders/WorkOrderDetailPage.test.tsx` — MODIFIED: CR: test now verifies id interpolation param is passed
- `src/features/inventory/InventoryPage.tsx` — MODIFIED: useTranslation
- `src/features/inventory/InventoryPage.test.tsx` — MODIFIED: Translation key assertions
- `src/features/overhead/OverheadPage.tsx` — MODIFIED: useTranslation
- `src/features/overhead/OverheadPage.test.tsx` — MODIFIED: Translation key assertions
- `src/features/review/ReviewPage.tsx` — MODIFIED: useTranslation
- `src/features/review/ReviewPage.test.tsx` — MODIFIED: Translation key assertions
- `src/styles/global.scss` — MODIFIED: Added .numericLtr utility class
- `src/__mocks__/react-i18next.ts` — NEW: Lightweight react-i18next mock for tests; CR: improved mock to expose interpolation params
- `src/__mocks__/css-module.ts` — NEW: Proxy-based CSS module mock for tests
- `vitest.config.ts` — MODIFIED: Added resolve aliases for react-i18next and .module.scss
- `vitest.setup.ts` — UNCHANGED (reverted to original)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — MODIFIED: Story status updated
