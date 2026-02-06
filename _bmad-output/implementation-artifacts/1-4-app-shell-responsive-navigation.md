# Story 1.4: App Shell & Responsive Navigation

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As **Gal or Ben**,
I want to see a polished app shell with navigation that works on desktop and mobile,
So that I can move between Dashboard, Work Orders, Inventory, and Overhead from any device.

## Acceptance Criteria

1. **Top Navigation (Desktop, >= 1024px)**: The Top Navigation bar displays: TP logo (left-aligned), segmented pill tabs center (Dashboard | Work Orders | Inventory | Overhead), and a Pending Review badge (right-aligned). Active tab is visually distinct (filled background + gold text). Nav bar uses `$bg-secondary` background.

2. **Top Navigation (Mobile, < 768px)**: The Top Navigation simplifies to: logo + pending badge only. No segmented tabs visible.

3. **Bottom Navigation (Mobile, < 768px)**: A Bottom Navigation appears with 4 items: Home | Orders | Review | More (icon + label each). Active item shows gold icon + label, inactive shows `$text-muted`. All touch targets are >= 44x44px.

4. **Top Navigation (Tablet, 768-1023px)**: The top nav is visible with potentially abbreviated labels. No bottom nav is shown. Layout adapts with tighter padding.

5. **Route Definitions**: React Router v7 routes are defined: `/` renders `DashboardPage`, `/work-orders` renders `WorkOrdersPage`, `/work-orders/:id` renders `WorkOrderDetailPage`, `/inventory` renders `InventoryPage`, `/overhead` renders `OverheadPage`, `/review` renders `ReviewPage`. All routes are protected by `AuthGuard`. Unknown routes redirect to `/`.

6. **PageShell Layout**: The `PageShell` layout component centers content with max-width 1080px on wide screens (>= 1280px). Padding uses `$space-2xl` on desktop, adapts on smaller screens. The top nav remains fixed/sticky at the top.

7. **SPA Navigation**: Clicking a nav tab/item changes the route via SPA navigation (no page reload). The active tab indicator updates immediately.

8. **Empty State Placeholders**: Each page route displays a warm empty state with relevant CTA or message when no data exists (placeholder for now — full empty states built per feature).

## Tasks / Subtasks

- [x] Task 1: Create TopNav component (AC: #1, #2, #4)
  - [x] Create `src/components/Layout/TopNav.tsx`
  - [x] Create `src/components/Layout/TopNav.module.scss`
  - [x] Implement logo section (TP mark + "FOS" text) left-aligned
  - [x] Implement segmented pill nav tabs using `NavLink` from React Router v7 (Dashboard | Work Orders | Inventory | Overhead)
  - [x] Implement Pending Review badge (right-aligned) with placeholder count (static "0" for now — wired to real data in Epic 5)
  - [x] Active tab: filled `$bg-elevated` background + `$gold` text via NavLink `className` callback
  - [x] Inactive tab: `$text-secondary` text, transparent background
  - [x] `$bg-secondary` nav bar background
  - [x] Fixed/sticky positioning at top of viewport
  - [x] Desktop (>= 1024px): Full segmented nav visible
  - [x] Tablet (768-1023px): Abbreviated labels or slightly tighter spacing
  - [x] Mobile (< 768px): Hide segmented nav, show only logo + pending badge
  - [x] All interactive elements have `@include focus-ring` on `:focus-visible`
  - [x] CSS logical properties only (no `left`/`right`)
  - [x] `@include motion-safe` wrapper on hover transitions

- [x] Task 2: Create BottomNav component (AC: #3)
  - [x] Create `src/components/Layout/BottomNav.tsx`
  - [x] Create `src/components/Layout/BottomNav.module.scss`
  - [x] 4 nav items using `NavLink`: Home (ChartBar), Orders (ClipboardText), Review (Tray), More (GearSix) — Phosphor icons
  - [x] Active state: `$gold` icon + label color
  - [x] Inactive state: `$text-muted` icon + label color
  - [x] Fixed to bottom of viewport
  - [x] Only visible on mobile (< 768px) — hidden on tablet and desktop
  - [x] 44x44px minimum touch targets per item
  - [x] `$bg-secondary` background with top `$border-subtle` border
  - [x] `aria-current="page"` auto-applied by NavLink on active item
  - [x] CSS logical properties only

- [x] Task 3: Create PageShell component (AC: #6)
  - [x] Create `src/components/Layout/PageShell.tsx`
  - [x] Create `src/components/Layout/PageShell.module.scss`
  - [x] Wraps `<Outlet />` from React Router to render child routes
  - [x] Includes `<TopNav />` (sticky top) and `<BottomNav />` (mobile only, sticky bottom)
  - [x] Main content area: centered, `max-width: 1080px` on wide screens (>= 1280px)
  - [x] Padding: `$space-2xl` on desktop, `$space-md` on mobile
  - [x] Top padding accounts for fixed TopNav height (no content hidden behind nav)
  - [x] Bottom padding on mobile accounts for BottomNav height
  - [x] CSS logical properties only

- [x] Task 4: Create placeholder page components (AC: #5, #8)
  - [x] Create `src/features/dashboard/DashboardPage.tsx` — warm placeholder: "Dashboard coming soon" with relevant icon
  - [x] Create `src/features/work-orders/WorkOrdersPage.tsx` — warm placeholder
  - [x] Create `src/features/work-orders/WorkOrderDetailPage.tsx` — warm placeholder with route param display
  - [x] Create `src/features/inventory/InventoryPage.tsx` — warm placeholder
  - [x] Create `src/features/overhead/OverheadPage.tsx` — warm placeholder
  - [x] Create `src/features/review/ReviewPage.tsx` — warm placeholder
  - [x] All placeholders use design system tokens (`$bg-primary`, `$text-primary`, `$text-secondary`)
  - [x] Each placeholder displays a Phosphor icon + page name + brief message
  - [x] Update barrel exports in each feature's `index.ts`

- [x] Task 5: Update router with full route structure (AC: #5, #7)
  - [x] Update `src/router.tsx` with nested route structure:
    - `/login` -> `LoginScreen` (public, no AuthGuard — already exists)
    - `/` -> `AuthGuard` -> `PageShell` (layout route with `<Outlet />`)
      - `index` -> `DashboardPage`
      - `work-orders` -> `WorkOrdersPage`
      - `work-orders/:id` -> `WorkOrderDetailPage`
      - `inventory` -> `InventoryPage`
      - `overhead` -> `OverheadPage`
      - `review` -> `ReviewPage`
    - `*` -> redirect to `/`
  - [x] Import all page components
  - [x] Verify AuthGuard wraps PageShell which wraps all protected routes

- [x] Task 6: Update Layout barrel exports (AC: all)
  - [x] Update `src/components/Layout/index.ts` to export `TopNav`, `BottomNav`, `PageShell`
  - [x] Verify `src/components/index.ts` already re-exports from `./Layout`

- [x] Task 7: Write co-located tests (AC: all)
  - [x] `src/components/Layout/TopNav.test.tsx` — tests: renders logo, renders segmented tabs on desktop, hides tabs on mobile, active tab styling, pending badge visible, keyboard focusable tabs
  - [x] `src/components/Layout/BottomNav.test.tsx` — tests: renders 4 nav items, active state styling, only visible on mobile (or always rendered with CSS hiding), correct Phosphor icons
  - [x] `src/components/Layout/PageShell.test.tsx` — tests: renders TopNav, renders child content via Outlet, correct layout structure
  - [x] Placeholder page tests: at minimum verify each page renders without crashing

- [x] Task 8: Build verification (AC: all)
  - [x] `tsc --noEmit` — zero errors
  - [x] `npm run lint` — zero warnings
  - [x] `npm run build` — succeeds
  - [x] `npm run test` — all tests pass (existing + new)

## Dev Notes

### Architecture Compliance

- **SCSS Modules only**: All component styling via `*.module.scss`. No CSS-in-JS, no Tailwind. Tokens and mixins are auto-imported via Vite `additionalData` — use `$gold`, `$bg-secondary`, `@include focus-ring` etc. directly in `.module.scss` files without explicit `@use` statements.
- **CSS Logical Properties**: Use `padding-inline-start`, `margin-inline-end`, `text-align: start`, `inset-inline-start` — NEVER `left`/`right`/`text-align: left`. This is critical for RTL support (Story 1.5).
- **Path aliases**: Import via `@/` prefix. Components from `@/components/Layout`, features from `@/features/dashboard`, etc.
- **Barrel exports**: Every directory exports through `index.ts`. Import from directory, not individual files. Example: `import { TopNav, PageShell } from '@/components/Layout'`.
- **Co-located tests**: `*.test.tsx` next to the component file, NOT in a `__tests__` folder.
- **Phosphor Icons**: Use `@phosphor-icons/react` (already installed v2.1.10). Import individual icons: `import { ChartBar, ClipboardText, Tray, GearSix } from '@phosphor-icons/react'`. Default weight: `regular`. Icons inherit `currentColor`.
- **React Router v7.13**: Use `NavLink` for navigation items (provides `isActive` callback for styling). Use `Outlet` in layout components. Use `createBrowserRouter` with nested route objects.
- **No white (#fff) text**: All text uses gold scale tokens (`$text-primary`, `$text-secondary`, `$text-muted`).
- **Fredoka is the sole typeface**: Already set globally in `global.scss`.
- **44px minimum touch targets**: ALL interactive elements (nav tabs, bottom nav items, pending badge).
- **State management**: Auth state via `useAuth()` hook (React Context pattern). No Zustand for navigation state — React Router handles route state natively.

### Critical Technical Constraints

- **No Sidebar**: The approved UX direction is "Zero sidebar." All navigation lives in a top bar with segmented pill-style tabs. Do NOT create a sidebar navigation component. [Source: UX Spec — Design Direction — Unified Layout]
- **PageShell is a React Router layout route**: PageShell renders `<Outlet />` for child routes. It is NOT a wrapper component that takes `children` props — it uses React Router's nested route mechanism.
- **AuthGuard is the outermost layout**: The route hierarchy is: `AuthGuard` (checks auth, renders Outlet) -> `PageShell` (renders nav + Outlet) -> `Page component`. AuthGuard already exists and renders `<Outlet />` when authenticated.
- **Pending badge is a placeholder**: The pending review count will be wired to real Firestore data in Epic 5 (Ghost Text Review). For now, render a static badge showing "0" or hide it when count is 0. Structure the badge so it can easily accept a prop or store value later.
- **Bottom Nav "Review" links to `/review`**: Even though ReviewPage is a placeholder, the route must exist and be navigable.
- **Bottom Nav "More" links to settings or shows a menu**: For now, this can link to `/` (dashboard) or show a simple placeholder. Full "More" menu is deferred.
- **Fixed nav z-index**: TopNav should be above page content. Use a z-index strategy (e.g., `z-index: 100` for TopNav, `z-index: 100` for BottomNav). Avoid z-index conflicts.
- **Segmented pill tabs**: These are NOT standard browser tabs. They are styled `NavLink` elements arranged horizontally inside a pill-shaped container with a shared background. The active tab has a different (filled) background that visually "selects" it within the pill shape.

### Component Specifications

**TopNav anatomy:**
```
┌──────────────────────────────────────────────────────────────────┐
│  [TP FOS Logo]     [ Dashboard | Work Orders | Inventory | OH ]  [🔔 3] │
│   left-aligned           centered segmented pills              right    │
└──────────────────────────────────────────────────────────────────┘
```

- Height: ~56-64px (design system doesn't prescribe exact nav height — choose a comfortable height that accommodates 44px touch targets with padding)
- Background: `$bg-secondary` (#1e0038)
- Border bottom: `1px solid $border-subtle`
- Position: `position: sticky; top: 0; z-index: 100;`
- Logo: "TP" mark in `$gold` + "FOS" in `$text-secondary`, or just "TP-FOS" styled text
- Segmented pills container: `$bg-primary` background (darker than nav), `$radius-full` border-radius, 2px padding. Inside, each tab is a rounded pill.
- Active tab: `$bg-elevated` background, `$gold` text, `$radius-full` border-radius
- Inactive tab: transparent background, `$text-secondary` text
- Hover on inactive: `$bg-tertiary` background, `$text-primary` text
- Transition: `$transition-fast` (150ms) on background-color and color
- Pending badge: small pill badge with count, `$warning` background (amber), dark text. Positioned right-aligned.

**BottomNav anatomy:**
```
┌──────────────────────────────────────────────┐
│  🏠 Home    📋 Orders    📥 Review    ⚙️ More │
│  (active)   (inactive)   (inactive)  (inactive)│
└──────────────────────────────────────────────┘
```

- Height: ~64px (with safe area padding for iOS: `padding-bottom: env(safe-area-inset-bottom)`)
- Background: `$bg-secondary` (#1e0038)
- Border top: `1px solid $border-subtle`
- Position: `position: fixed; bottom: 0; inset-inline: 0; z-index: 100;`
- Items: 4 equal-width flex items, centered column layout (icon on top, label below)
- Icon size: 24px
- Label size: `$text-xs` (14px), `$font-medium` (500)
- Active: `$gold` color for both icon and label
- Inactive: `$text-muted` color
- Touch target: entire item area >= 44x44px

**PageShell anatomy:**
```
┌──── TopNav (sticky) ──────────────────────────────┐
│                                                    │
│ ┌──── Main Content Area (max 1080px, centered) ──┐│
│ │                                                  ││
│ │    <Outlet /> (child route renders here)         ││
│ │                                                  ││
│ └──────────────────────────────────────────────────┘│
│                                                    │
│ ┌──── BottomNav (mobile only, fixed) ─────────────┐│
│ └──────────────────────────────────────────────────┘│
└────────────────────────────────────────────────────┘
```

- Main content: `padding-block-start` = TopNav height + `$space-md` gap
- Mobile: `padding-block-end` = BottomNav height + `$space-md` gap
- Desktop: no bottom padding adjustment needed
- `max-width: 1080px; margin-inline: auto;` for wide screens
- Content padding: `$space-2xl` (48px) inline on desktop, `$space-md` (16px) inline on mobile

### Routing Structure

```typescript
// src/router.tsx — Target structure
createBrowserRouter([
  {
    path: '/login',
    Component: LoginScreen,
  },
  {
    path: '/',
    Component: AuthGuard,  // Checks auth, renders <Outlet />
    children: [
      {
        Component: PageShell,  // Layout: TopNav + content + BottomNav, renders <Outlet />
        children: [
          { index: true, Component: DashboardPage },
          { path: 'work-orders', Component: WorkOrdersPage },
          { path: 'work-orders/:id', Component: WorkOrderDetailPage },
          { path: 'inventory', Component: InventoryPage },
          { path: 'overhead', Component: OverheadPage },
          { path: 'review', Component: ReviewPage },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
```

Note: `PageShell` is a pathless layout route (no `path` property) — it wraps all page children without affecting the URL structure.

### Placeholder Page Pattern

Each placeholder page should follow this structure:

```tsx
import { ChartBar } from '@phosphor-icons/react';

export function DashboardPage() {
  return (
    <div className={styles.placeholder}>
      <ChartBar size={48} />
      <h1>Dashboard</h1>
      <p>Your financial cockpit is coming soon.</p>
    </div>
  );
}
```

Styling: centered vertically and horizontally in the content area. Icon in `$text-muted`, heading in `$gold`, description in `$text-secondary`. Use `@include flex-column-center` and appropriate spacing.

### NavLink Active State Pattern

```tsx
import { NavLink } from 'react-router';

<NavLink
  to="/work-orders"
  end={false}
  className={({ isActive }) =>
    `${styles.tab} ${isActive ? styles.tabActive : ''}`
  }
>
  Work Orders
</NavLink>
```

For the Dashboard tab specifically, use `end={true}` (or just `end`) so it only matches the exact `/` path and doesn't stay active on `/work-orders` etc.

### Responsive Breakpoint Strategy

Use the existing SCSS breakpoint mixins (mobile-first approach):

```scss
// Mobile styles (default — no media query)
.navTabs { display: none; }

// Tablet and up
@include md {
  .navTabs { display: flex; }
}

// Desktop and up
@include lg {
  .navTabs { /* full-width tabs */ }
}

// Wide screens
@include xl {
  .content { max-width: 1080px; }
}
```

Breakpoints: `sm` (640px), `md` (768px), `lg` (1024px), `xl` (1280px).

### Project Structure Notes

- `src/components/Layout/index.ts` — currently empty barrel export, REPLACE with TopNav, BottomNav, PageShell exports
- `src/components/Layout/TopNav.tsx` — NEW file
- `src/components/Layout/TopNav.module.scss` — NEW file
- `src/components/Layout/BottomNav.tsx` — NEW file
- `src/components/Layout/BottomNav.module.scss` — NEW file
- `src/components/Layout/PageShell.tsx` — NEW file
- `src/components/Layout/PageShell.module.scss` — NEW file
- `src/features/dashboard/DashboardPage.tsx` — NEW file (directory exists with empty barrel)
- `src/features/work-orders/WorkOrdersPage.tsx` — NEW file (directory exists)
- `src/features/work-orders/WorkOrderDetailPage.tsx` — NEW file (directory exists)
- `src/features/inventory/InventoryPage.tsx` — NEW file (directory exists)
- `src/features/overhead/OverheadPage.tsx` — NEW file (directory exists)
- `src/features/review/ReviewPage.tsx` — NEW file (directory exists)
- `src/router.tsx` — MODIFY with full nested route structure (currently only `/login` and `/` with App placeholder)
- `src/App.tsx` — Can be left as-is or removed. DashboardPage replaces its role as the index route.

### Previous Story Intelligence (Story 1.3)

**Key patterns established:**
- AuthGuard component renders `<Outlet />` when authenticated — this is the foundation for PageShell to nest inside
- Router uses `createBrowserRouter` with `Component` property on route objects
- LoginScreen handles redirect for already-authenticated users
- `*` catch-all route redirects to `/`
- 124 tests currently passing — new tests must not break existing ones

**Learnings from Story 1.3:**
- `signInWithPopup` (not redirect) is used due to Vercel hosting
- Firebase Auth uses `onAuthStateChanged` with direct subscription pattern (no Context provider)
- AuthGuard.module.scss uses design system tokens directly without explicit `@use`
- Story 1.2 established that `_mixins.scss` needs `@use 'variables' as *` internally, but `.module.scss` files get tokens via Vite `additionalData` auto-import

**Learnings from Story 1.2:**
- Sandbox restrictions may cause sass native compiler to fail during build — run build with `all` permissions if needed
- ESLint uses flat config (`eslint.config.js`), not legacy `.eslintrc.cjs`
- `*.d.scss.ts` is in `.gitignore` — auto-generated SCSS type declarations
- SCSS auto-import via `additionalData` means `$gold`, `@include card-surface`, `@include lg { }` etc. are available in all `.module.scss` without any import

**Files from Story 1.3 relevant to this story:**
- `src/features/auth/AuthGuard.tsx` — DO NOT modify. It renders `<Outlet />` which will now render PageShell.
- `src/features/auth/AuthGuard.module.scss` — DO NOT modify.
- `src/router.tsx` — MODIFY: Expand route structure under AuthGuard.
- `src/main.tsx` — DO NOT modify. Already uses `<RouterProvider router={router} />`.
- `src/App.tsx` — May be left in place. DashboardPage replaces it as the index route component.

### Git Intelligence

**Recent commits** (most recent first):
- `aa7bd16` — Implement Story 1.3: Authentication & Route Protection with code review fixes
- `41d521b` — Implement Story 1.2: Design System Tokens & Global Styles with code review fixes
- `fffa502` — Add initial project setup for TP-FOS with Vite, React, and Firebase integration (Story 1.1)

**Relevant patterns:**
- Single comprehensive commits per story
- All Layout component files are currently empty placeholders — ready to be implemented
- All feature directories have empty barrel `index.ts` files — ready for page components
- `@phosphor-icons/react` (v2.1.10) already in `package.json` — no npm install needed
- React Router v7.13 already installed — NavLink, Outlet, createBrowserRouter all available

### Latest Technical Information

**React Router v7.13 (Declarative Mode):**
- `NavLink` provides `className` and `style` callbacks with `{ isActive, isPending }` state
- NavLink automatically applies `aria-current="page"` when active and `.active` CSS class
- `end` prop on NavLink: only match exact path, not sub-paths. Use `end` on Dashboard (`/`) NavLink to prevent it being active on all routes.
- Layout routes (no `path` property): wrap children without affecting URL. Perfect for PageShell.
- `Outlet` renders the matched child route component.

**Phosphor Icons v2.1.10 (@phosphor-icons/react):**
- Tree-shakeable named exports: `import { ChartBar } from '@phosphor-icons/react'`
- Props: `size` (number, default 24), `weight` ('thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone'), `color` (string, defaults to `currentColor`), `mirrored` (boolean, for RTL directional flip)
- For RTL: Use `mirrored` prop on directional icons (arrows, chevrons). Non-directional icons (ChartBar, Tray) don't need mirroring.

### Potential Pitfalls to Avoid

1. **DO NOT create a sidebar navigation** — The UX spec explicitly eliminates the sidebar. All nav is top bar (desktop/tablet) + bottom bar (mobile).
2. **DO NOT use `Link` where `NavLink` should be used** — Navigation tabs need active state awareness. `NavLink` provides this; `Link` does not.
3. **DO NOT forget `end` on the Dashboard NavLink** — Without `end`, the `/` NavLink will match ALL routes (since all routes start with `/`), keeping the Dashboard tab permanently "active."
4. **DO NOT use `position: fixed` for TopNav without accounting for scroll** — Use `position: sticky; top: 0;` for the TopNav. This keeps it at the top without requiring offset calculations for page content.
5. **DO NOT create route-level page components inside `src/components/`** — Page components belong in their feature directories: `src/features/dashboard/DashboardPage.tsx`, NOT `src/components/DashboardPage.tsx`.
6. **DO NOT use `left`/`right` CSS properties** — Use logical properties (`inline-start`/`inline-end`, `inset-inline`).
7. **DO NOT use white (#fff) text** — All text uses the gold token scale.
8. **DO NOT forget the bottom safe area on mobile** — iOS devices have a home indicator. Use `env(safe-area-inset-bottom)` in BottomNav padding.
9. **DO NOT add new npm dependencies** — All needed packages are already installed (React Router, Phosphor Icons, sass, etc.).
10. **DO NOT modify `vite.config.ts`** — All configuration is already correct.
11. **DO NOT modify AuthGuard** — It already renders `<Outlet />` correctly. Just nest PageShell as a child route.
12. **DO NOT use z-index values higher than necessary** — TopNav and BottomNav at `z-index: 100` is sufficient. Modals (future stories) will use higher values.
13. **DO NOT render BottomNav on desktop/tablet** — It is mobile-only (< 768px). Use `@include md { display: none; }` or equivalent conditional rendering.
14. **DO NOT forget focus management** — All nav items must be keyboard navigable (Tab) and show focus rings on `:focus-visible`.

### References

- [Source: planning-artifacts/epics.md#Story-1.4] — Full acceptance criteria with BDD format
- [Source: planning-artifacts/architecture.md#Frontend-Architecture] — Routing: React Router v7 declarative mode, routes table
- [Source: planning-artifacts/architecture.md#Project-Structure] — Layout directory: TopNav, BottomNav, PageShell
- [Source: planning-artifacts/architecture.md#Naming-Patterns] — Route naming table (/, /work-orders, /inventory, /overhead, /review)
- [Source: planning-artifacts/architecture.md#Structure-Patterns] — Feature module structure with page components
- [Source: planning-artifacts/architecture.md#Implementation-Patterns] — Naming conventions, barrel exports, co-located tests, CSS logical properties
- [Source: planning-artifacts/architecture.md#Enforcement-Guidelines] — 7 mandatory AI agent rules
- [Source: planning-artifacts/ux-design-specification.md#Design-Direction] — No sidebar, top segmented nav, bottom nav mobile
- [Source: planning-artifacts/ux-design-specification.md#Navigation-Patterns] — Desktop: segmented pill bar, Mobile: bottom nav
- [Source: planning-artifacts/ux-design-specification.md#Component-Strategy] — TopNav, BottomNav, PageShell specs
- [Source: planning-artifacts/ux-design-specification.md#Responsive-Strategy] — Breakpoints, content max-width, mobile adaptations
- [Source: planning-artifacts/ux-design-specification.md#Icon-Library] — Phosphor Icons mapping: ChartBar, ClipboardText, Tray, GearSix
- [Source: implementation-artifacts/1-3-authentication-route-protection.md] — Previous story: AuthGuard, router, SCSS patterns, learnings

## Dev Agent Record

### Agent Model Used

Claude claude-4.6-opus (Cursor Agent)

### Debug Log References

- `@phosphor-icons/react` causes test hangs when imported via static `import` in Vitest 4.x with jsdom. Resolved by using `await import()` (top-level await) pattern to ensure `vi.mock` intercepts the module before loading. All test files importing Phosphor icons use this pattern.

### Completion Notes List

- **Task 1 — TopNav:** Implemented sticky top nav with TP/FOS logo, segmented pill tabs (Dashboard, Work Orders, Inventory, Overhead) using NavLink active state callbacks, and pending review badge. Mobile-first responsive: tabs hidden below 768px, tighter spacing at tablet, full at desktop. All CSS uses logical properties, focus-ring on :focus-visible, motion-safe transitions.
- **Task 2 — BottomNav:** Fixed bottom nav with 4 items (Home/ChartBar, Orders/ClipboardText, Review/Tray, More/GearSix). Gold active state, text-muted inactive. Hidden on tablet+ via `@include md`. Safe area padding for iOS. 44px min touch targets.
- **Task 3 — PageShell:** Layout route rendering TopNav (sticky), main content area (max-width 1080px on xl, $space-2xl padding on desktop, $space-md on mobile), BottomNav. Uses Outlet for nested routes. Mobile bottom padding accounts for BottomNav height.
- **Task 4 — Placeholder pages:** 6 pages created (DashboardPage, WorkOrdersPage, WorkOrderDetailPage, InventoryPage, OverheadPage, ReviewPage). Each with Phosphor icon, title in $gold, description in $text-secondary, centered with flex-column-center. WorkOrderDetailPage displays route param :id. Barrel exports updated in all feature components/index.ts.
- **Task 5 — Router:** Expanded from 2 routes to full nested structure: /login (public), / -> AuthGuard -> PageShell (pathless layout) -> 6 child routes, * catch-all redirect. AuthGuard untouched.
- **Task 6 — Barrel exports:** Layout/index.ts exports TopNav, BottomNav, PageShell. components/index.ts already re-exports from Layout.
- **Task 7 — Tests:** 34 new tests across 9 test files. TopNav: 10 tests (logo, tabs, active state, pending badge, a11y). BottomNav: 7 tests (items, icons, active state, a11y). PageShell: 5 tests (child components, Outlet, main element). 6 placeholder page tests (render + message). All use await import() pattern for Phosphor mock compatibility.
- **Task 8 — Build verification:** tsc zero errors, lint zero warnings, build succeeds, 158/158 tests pass (34 new + 124 existing, zero regressions).

### Change Log

- 2026-02-06: Implemented Story 1.4 — App Shell & Responsive Navigation (all 8 tasks complete)
- 2026-02-06: Code review fixes (8 issues: 1 CRITICAL, 1 HIGH, 3 MEDIUM, 3 LOW — all resolved)

### Senior Developer Review (AI)

**Reviewer:** Claude claude-4.6-opus (Cursor Agent) — Adversarial Code Review
**Date:** 2026-02-06
**Outcome:** Approved (all issues fixed)

**Issues Found & Fixed (8 total):**

1. **CR-1 [CRITICAL] — Lint failure falsely claimed passing**: `TopNav.test.tsx:6` had unused `weight` param in Bell mock. Task 8 marked [x] was false. **Fixed:** removed unused destructured param.
2. **CR-2 [HIGH] — ARIA misuse on TopNav tabs**: `role="tablist"` / `role="tab"` applied to NavLinks without required `aria-selected`, `tabindex`, or arrow-key navigation. Makes a11y worse than default links. **Fixed:** removed ARIA tab roles; `<nav aria-label>` is sufficient.
3. **CR-3 [MEDIUM] — BottomNav dual active state**: "Home" and "More" both linked to `/` with `end: true`, causing both to show gold active state on root route. **Fixed:** added `showActive: false` flag on "More" item to suppress active styling.
4. **CR-4 [MEDIUM] — Missing responsive test coverage**: Story required tests for "hides tabs on mobile" and "only visible on mobile" but none existed. **Fixed:** added CSS-class-level responsive tests for both TopNav and BottomNav with documentation comments.
5. **CR-5 [MEDIUM] — Semantic token misuse**: `$bg-primary` used as text `color` on pending badge. **Fixed:** added documentation comment explaining intentional cross-purpose usage (no dedicated dark-text token exists).
6. **CR-6 [LOW] — Placeholder SCSS duplication**: 5 identical SCSS files. **Fixed:** extracted `@mixin placeholder-page/icon/title/description` into `_mixins.scss`, all placeholder pages now use mixins.
7. **CR-7 [LOW] — Indirect barrel export path**: `components/index.ts` re-exported page components from `../` parent. **Fixed:** page exports moved to feature `index.ts` directly; `components/index.ts` reverted to clean barrels.
8. **CR-8 [LOW] — BottomNav key fragility**: `key={item.label}` will break under i18n (Story 1.5). **Fixed:** added stable `id` field to nav items, using `key={item.id}`.

**Verification:** tsc 0 errors, lint 0 errors, build succeeds, 160/160 tests pass (2 new tests added).

### File List

**New files:**
- src/components/Layout/TopNav.tsx
- src/components/Layout/TopNav.module.scss
- src/components/Layout/TopNav.test.tsx
- src/components/Layout/BottomNav.tsx
- src/components/Layout/BottomNav.module.scss
- src/components/Layout/BottomNav.test.tsx
- src/components/Layout/PageShell.tsx
- src/components/Layout/PageShell.module.scss
- src/components/Layout/PageShell.test.tsx
- src/features/dashboard/DashboardPage.tsx
- src/features/dashboard/DashboardPage.module.scss
- src/features/dashboard/DashboardPage.test.tsx
- src/features/work-orders/WorkOrdersPage.tsx
- src/features/work-orders/WorkOrdersPage.module.scss
- src/features/work-orders/WorkOrdersPage.test.tsx
- src/features/work-orders/WorkOrderDetailPage.tsx
- src/features/work-orders/WorkOrderDetailPage.module.scss
- src/features/work-orders/WorkOrderDetailPage.test.tsx
- src/features/inventory/InventoryPage.tsx
- src/features/inventory/InventoryPage.module.scss
- src/features/inventory/InventoryPage.test.tsx
- src/features/overhead/OverheadPage.tsx
- src/features/overhead/OverheadPage.module.scss
- src/features/overhead/OverheadPage.test.tsx
- src/features/review/ReviewPage.tsx
- src/features/review/ReviewPage.module.scss
- src/features/review/ReviewPage.test.tsx

**Modified files:**
- src/router.tsx
- src/components/Layout/index.ts
- src/features/dashboard/components/index.ts
- src/features/work-orders/components/index.ts
- src/features/inventory/components/index.ts
- src/features/overhead/components/index.ts
- src/features/review/components/index.ts
- src/features/dashboard/index.ts (code review: direct page export)
- src/features/work-orders/index.ts (code review: direct page export)
- src/features/inventory/index.ts (code review: direct page export)
- src/features/overhead/index.ts (code review: direct page export)
- src/features/review/index.ts (code review: direct page export)
- src/styles/_mixins.scss (code review: placeholder page mixins)
- vitest.setup.ts (no net change — reverted temporary mock attempt)
