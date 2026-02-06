---
stepsCompleted:
  - step-01-validate-prerequisites
  - step-02-design-epics
  - step-03-create-stories
  - step-04-final-validation
lastStep: 4
status: 'complete'
completedAt: '2026-02-06'
inputDocuments:
  - planning-artifacts/prd.md
  - planning-artifacts/architecture.md
  - planning-artifacts/ux-design-specification.md
workflowType: 'epics-and-stories'
project_name: 'TP-FOS'
user_name: 'Galelbaz'
date: '2026-02-06'
---

# TP-FOS - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for TP-FOS, decomposing the requirements from the PRD, UX Design, and Architecture into implementable stories.

## Requirements Inventory

### Functional Requirements

**1. Dashboard & Financial Intelligence (FR1–FR9)**

- FR1: Gal/Ben can view real-time Net Profit for the current month
- FR2: Gal/Ben can view the Tax Jar reserve amount (configurable: flat 35% or progressive brackets)
- FR3: Gal/Ben can view a count of active projects (Work Orders in Production status)
- FR4: Gal/Ben can view a Project Health Table with client name, status, revenue, cost, and margin percentage
- FR5: Gal/Ben can identify at-risk projects through color-coded margin indicators (green/yellow/red at < 20%)
- FR6: Gal can view a forward financial projection showing cash flow impact of a potential purchase over the next 3–6 months
- FR7: Gal/Ben can view monthly overhead burn by category (subscriptions, software, meals, office)
- FR8: Gal/Ben can receive an alert when annual revenue reaches 80% of the ₪120,000 Osek Patur threshold
- FR9: Gal can configure the Tax Jar calculation method (flat rate vs. bracket-based)

**2. Work Order Management (FR10–FR15)**

- FR10: Gal can create a Work Order with client name, project description, deadline, and status
- FR11: Gal can update Work Order status (Lead → Design → Production → Shipped)
- FR12: Gal can view the Nutrition Label: Revenue, Direct Costs, Inventory Costs (Scoops), Overhead Allocation, Unforeseen Buffer (5%), Net Profit
- FR13: Gal can link revenue (Summit receipts) to a Work Order
- FR14: Gal can link direct costs (vendor invoices) to a Work Order
- FR15: Gal can view margin calculations that update within 2 seconds when costs or revenue change

**3. Document Ingestion & AI Processing (FR16–FR22)**

- FR16: The system detects new emails in designated mailboxes (orders@, supplies@, developing@, expenses@)
- FR17: The system processes email attachments (PDF, JPG, PNG) and HTML content through AI document processing
- FR18: The system extracts structured data from Hebrew and English documents (vendor, date, amount, currency, line items)
- FR19: The system classifies transactions into categories (Direct Cost, Inventory Restock, Overhead, Personal) with confidence scores
- FR20: The system suggests Work Order or Inventory item associations for classified transactions
- FR21: The system processes photo receipts (camera captures) via email with the same reliability as PDFs
- FR22: The system handles multi-currency documents (ILS, USD, EUR) and flags non-ILS amounts as "Estimated"

**4. Transaction Review & Approval (FR23–FR31, FR50)**

- FR23: Gal can view all pending review items in a dedicated interface
- FR24: Gal can see AI-suggested classifications as pre-filled editable fields (Ghost Text)
- FR25: Gal can confirm a suggestion with a single action (Enter key)
- FR26: Gal can edit any field before confirming (vendor, amount, category, project)
- FR27: Gal can reject a transaction (irrelevant / personal)
- FR28: Gal can view confidence indicators — green (≥ 85%) or yellow (< 85% "Check Me")
- FR29: Gal can batch-approve all high-confidence items ("Approve All")
- FR30: Gal can browse pending items before batch-approving
- FR31: The system updates all financial data (Nutrition Labels, KPIs, Tax Jar) within 2 seconds of approval
- FR50: Gal can manually create a transaction (expense or income) with vendor, amount, date, currency, category, and optional Work Order linkage — bypassing the AI pipeline for ad-hoc entries or pipeline failures

**5. Inventory Management (FR32–FR37)**

- FR32: Gal can create and manage inventory items (name, SKU, supplier, quantity, reorder threshold)
- FR33: Gal can record restocks with quantity and cost, triggering WAC recalculation
- FR34: Gal can Scoop materials into a Work Order — search material, input quantity, auto-calculate cost via WAC
- FR35: The system prevents over-drafting (shows remaining stock during Scoop)
- FR36: The system maintains an audit log of all inventory actions with cost snapshots and Work Order references
- FR37: Gal can log waste/scrap with cost impact on relevant Work Orders

**6. Overhead & Expense Tracking (FR38–FR41)**

- FR38: Gal can view overhead expenses by category (subscriptions, software, meals, office, general)
- FR39: Gal can manually create overhead entries with category, amount, date, and recurrence
- FR40: The system auto-categorizes overhead from AI-classified transactions (developing@/expenses@ mailboxes)
- FR41: Gal can view monthly overhead burn rate and trend

**7. Accountant Integration (FR42–FR44)**

- FR42: The system auto-forwards original, untouched documents to Paperless
- FR43: Paperless forwarding operates independently — FOS downtime doesn't affect document delivery
- FR44: The system tracks forwarded documents for audit purposes

**8. System & User Management (FR45–FR49)**

- FR45: Gal and Ben authenticate via SSO (single sign-on)
- FR46: Only 2 whitelisted accounts can access the system
- FR47: Full system available in Hebrew (RTL) or English (LTR)
- FR48: All actions available on desktop and mobile with full feature parity
- FR49: Financial data displays in ILS with USD/EUR showing original and converted values

### Non-Functional Requirements

**Performance**

- NFR1: Dashboard initial load < 3s desktop, < 5s mobile (4G) — first meaningful paint with KPIs
- NFR2: Post-action refresh (KPIs, Nutrition Labels) < 2s after confirm
- NFR3: Ghost Text field load < 1s per item — pre-filled fields appear instantly
- NFR4: AI processing (email-to-pending) < 30s — Gemini parse + JSON + Firestore write
- NFR5: Scoop WAC calculation < 500ms

**Security**

- NFR6: Google Sign-in authentication, 2 whitelisted UIDs only
- NFR7: Firestore read/write restricted to admin UIDs
- NFR8: All API keys server-side only (Cloud Functions environment config)
- NFR9: Firebase Storage UID-restricted access rules
- NFR10: HTTPS enforced (Firebase default)
- NFR11: Financial data never leaves Firebase except Paperless forwarding

**Data Integrity**

- NFR12: Currency stored as integers (agora/cents). High-precision WAC arithmetic
- NFR13: Zero document loss — every email tracked. Failed AI parses preserved and flagged, never silently dropped
- NFR14: Audit trail on all inventory, transaction, and Work Order changes with timestamps and before/after
- NFR15: Referential integrity — every transaction links to source document, every Scoop links to item and Work Order
- NFR16: Firestore automatic backups with point-in-time recovery

**Integration Reliability**

- NFR17: Gmail API unavailable → emails queue in Gmail, retry on next Pub/Sub trigger. No loss
- NFR18: Gemini API error/timeout → document stored as "unprocessed", original preserved, manual entry fallback
- NFR19: Paperless — Gmail filters handle forwarding independently. FOS downtime doesn't affect delivery
- NFR20: Currency API unavailable → last known rate, flagged "Rate may be stale." Never blocks processing

### Additional Requirements

**From Architecture:**

- ARCH-1: **Starter Template** — Vite + React TypeScript (Official). Initialize with `npm create vite@latest tp-fos -- --template react-ts`. This should be Epic 1 Story 1
- ARCH-2: Firebase project setup — separate project (`tp-fos`), Emulator Suite for local development
- ARCH-3: Frontend hosting on Vercel (`fos.tailorplayed.com` subdomain, CNAME via Porkbun)
- ARCH-4: SCSS design system — `_variables.scss`, `_mixins.scss`, `_animations.scss`, `_accessibility.scss`, `global.scss` as foundation
- ARCH-5: Zod schemas for data validation — shared between `src/types/` and `functions/src/shared/`
- ARCH-6: Zustand stores for client state (one store per domain: transactions, workOrders, inventory, overhead, UI)
- ARCH-7: React Router v7 declarative mode — routes: `/`, `/work-orders`, `/work-orders/:id`, `/inventory`, `/overhead`, `/review`
- ARCH-8: react-i18next + CSS logical properties for i18n — translation files `he.json`, `en.json`
- ARCH-9: Firebase Emulator Suite for local development (Firestore, Auth, Functions, Storage)
- ARCH-10: GitHub Actions — CI (lint + test on PR) + Cloud Functions deploy on `/functions` changes
- ARCH-11: Cloud Functions: onEmailReceived (Pub/Sub), processDocument (Firestore onCreate), onTransactionApproved (Firestore onUpdate), verifyWAC (Firestore onWrite), retryFailedProcessing (Scheduled)
- ARCH-12: Firestore flat collections: `transactions`, `work_orders`, `inventory`, `inventory_log`, `overhead`, `email_log`, `system_config`
- ARCH-13: Path aliases: `@/` maps to `src/`. Barrel exports for all directories
- ARCH-14: Co-located tests (*.test.tsx next to *.tsx). Vitest + React Testing Library
- ARCH-15: Feature module boundaries — features never import from other features. Cross-feature communication through Zustand stores
- ARCH-16: Data flow: Firestore → Zod parse → TypeScript type → Zustand store → React component. Never access Firestore directly from components
- ARCH-17: Integer currency arithmetic — `toMinorUnits()`, `toDisplayAmount()`, `formatCurrency()` utility module. All math in agora/cents, formatting at component level
- ARCH-18: React Hook Form for complex forms (Work Order, manual transactions, inventory). Custom controlled components for Ghost Text
- ARCH-19: Error handling: React Error Boundaries (component crash), Toast notifications (operation failure), Inline field errors (validation)
- ARCH-20: Loading states: Skeleton screens (initial load), Shimmer overlay (data refresh), Spinner in button (action), Background processing (no UI block, toast on completion)
- ARCH-21: Naming conventions enforced: camelCase (code/fields), PascalCase (components/types), snake_case (Firestore collections), UPPER_SNAKE_CASE (constants), `Agora` suffix for currency fields, `At` suffix for timestamps
- ARCH-22: Firestore Security Rules — single `isAdmin()` function checking 2 whitelisted UIDs across all collections
- ARCH-23: Cloud Functions auth — Pub/Sub = internal GCP (no auth), Callable = verify `context.auth.uid` against whitelist

**From UX Design:**

- UX-1: **Top segmented navigation** (no sidebar) — logo left, segmented pill tabs center (Dashboard | Work Orders | Inventory | Overhead), pending badge right
- UX-2: **Hero Stat** — portfolio-style centered display of Net Profit as the primary KPI, greeting line, delta badge
- UX-3: **KPI Cards row** — Tax Jar, Active Projects, Monthly Overhead, Pending Review (clickable, glows on hover)
- UX-4: **Project List with icon cards** — Phosphor icon + name + phase + revenue + margin % + mini progress bar, red-tinted border for < 20%
- UX-5: **Ghost Text visual states** — muted/dashed (AI suggested) → bright/solid gold (user edited) → confirmed. Muted-to-solid text transition as signature interaction
- UX-6: **Ghost Text Card** anatomy — invoice preview, Ghost Text fields, confidence bar, AI reasoning bubble, Confirm/Edit/Reject buttons with keyboard shortcuts
- UX-7: **Keyboard shortcuts** — Enter=Confirm, E=Edit, Del=Reject, Esc=Close, ←→=Navigate between pending items
- UX-8: **Approve All Bar** — sticky bottom bar, only for ≥ 85% confidence, shows count + summary before executing
- UX-9: **Mobile: Bottom navigation** — Home | Orders | Review | More (4 items, icon + label)
- UX-10: **Mobile: Full-screen Ghost Text** — back arrow, "Review 1 of 3" counter, full-width Confirm button
- UX-11: **Mobile: Horizontal scroll KPI row** (swipeable)
- UX-12: **Responsive breakpoints** — 375px (mobile min), 768px (tablet), 1024px (desktop), 1280px (wide, content max 1080px)
- UX-13: **Accessibility** — 44px touch targets, gold focus rings (2px, offset), `prefers-reduced-motion` support, semantic HTML, ARIA labels
- UX-14: **RTL implementation** — CSS logical properties, `dir` attribute toggle, numbers always LTR, directional icons flip via scaleX(-1)
- UX-15: **Color + text rule** — never color alone for financial states, always paired with text label + icon
- UX-16: **Feedback patterns** — success toast (gold, 3s), batch toast (4s), warning inline card (persistent), error toast with retry (5s), loading skeleton, updating shimmer
- UX-17: **Empty states** — warm tone ("You're all caught up"), CTA for action, muted illustrations
- UX-18: **Button hierarchy** — max 1 primary per view, primary shows keyboard shortcut, 150ms hover + translateY(-1px) lift
- UX-19: **No modals for primary flows** — Ghost Text and navigation are inline/full-screen, never modal. Confirmation dialogs only for destructive actions
- UX-20: **Design system density adaptations** — dashboard cards use $space-md (16px) padding, table text uses $text-sm (16px), tighter radius, glow reserved for primary CTAs only

### FR Coverage Map

| FR | Epic | Description |
|----|------|-------------|
| FR1 | 3 | Real-time Net Profit |
| FR2 | 3 | Tax Jar reserve view |
| FR3 | 3 | Active projects count |
| FR4 | 3 | Project Health Table |
| FR5 | 3 | Color-coded margin indicators |
| FR6 | 7 | Forward financial projection |
| FR7 | 7 | Monthly overhead burn by category |
| FR8 | 7 | Osek Patur threshold alert |
| FR9 | 7 | Tax Jar config (flat vs. bracket) |
| FR10 | 2 | Create Work Order |
| FR11 | 2 | Update Work Order status |
| FR12 | 2 | Nutrition Label view |
| FR13 | 2 | Link revenue to Work Order |
| FR14 | 2 | Link direct costs to Work Order |
| FR15 | 2 | Real-time margin calculations |
| FR16 | 4 | Email detection in mailboxes |
| FR17 | 4 | Process attachments via AI |
| FR18 | 4 | Extract structured data (bilingual) |
| FR19 | 4 | Classify transactions with confidence |
| FR20 | 4 | Suggest WO/inventory associations |
| FR21 | 4 | Photo receipt processing |
| FR22 | 4 | Multi-currency handling |
| FR23 | 5 | View pending review items |
| FR24 | 5 | Ghost Text pre-filled fields |
| FR25 | 5 | Confirm with Enter |
| FR26 | 5 | Edit fields before confirming |
| FR27 | 5 | Reject transaction |
| FR28 | 5 | Confidence indicators (green/yellow) |
| FR29 | 5 | Batch approve (Approve All) |
| FR30 | 5 | Browse before batch approve |
| FR31 | 5 | Real-time financial data update post-approval |
| FR32 | 6 | Create/manage inventory items |
| FR33 | 6 | Record restocks + WAC recalculation |
| FR34 | 6 | Scoop materials into Work Order |
| FR35 | 6 | Over-draft prevention |
| FR36 | 6 | Inventory audit log |
| FR37 | 6 | Log waste/scrap |
| FR38 | 7 | View overhead by category |
| FR39 | 7 | Create overhead entries |
| FR40 | 7 | Auto-categorize overhead from AI |
| FR41 | 7 | Monthly overhead burn rate/trend |
| FR42 | 4 | Auto-forward docs to Paperless |
| FR43 | 4 | Independent Paperless forwarding |
| FR44 | 4 | Track forwarded documents |
| FR45 | 1 | SSO authentication |
| FR46 | 1 | 2 whitelisted accounts |
| FR47 | 1 | Hebrew (RTL) / English (LTR) i18n |
| FR48 | 1 | Full mobile feature parity |
| FR49 | 2 | Multi-currency display (ILS/USD/EUR) |
| FR50 | 2 | Manual transaction creation |

## Epic List

### Epic 1: Project Foundation & App Shell
Gal and Ben can authenticate, see the app navigation on any device, and switch between Hebrew and English. Complete design system, responsive shell, and all foundational infrastructure.
**FRs covered:** FR45, FR46, FR47, FR48
**Additional:** ARCH-1 through ARCH-10, ARCH-13, ARCH-14, ARCH-17, ARCH-21, ARCH-22, UX-1, UX-9, UX-12, UX-13, UX-14

### Epic 2: Work Orders & Manual Financial Tracking
Gal can create Work Orders, track project status, manually enter transactions (expenses and income), link costs and revenue to projects, and see live margin calculations via the Nutrition Label. System is fully usable for financial tracking without the AI pipeline.
**FRs covered:** FR10, FR11, FR12, FR13, FR14, FR15, FR49, FR50
**Additional:** ARCH-12 (transactions, work_orders), ARCH-15, ARCH-16, ARCH-18, ARCH-19, ARCH-20, UX-4, UX-15, UX-16, UX-17, UX-18, UX-19, UX-20

### Epic 3: Dashboard & Project Health
Gal and Ben can open the app and immediately see real-time Net Profit, Tax Jar reserve, active project count, and a Project Health Table with color-coded margin indicators — answering "how's the business?" at a glance.
**FRs covered:** FR1, FR2, FR3, FR4, FR5
**Additional:** UX-2, UX-3, UX-4, UX-11, UX-20

### Epic 4: Email Ingestion & AI Document Processing
Financial documents arriving via email are automatically detected, processed by AI (Hebrew + English), classified with confidence scores, and queued for human review. Originals are auto-forwarded to the accountant untouched.
**FRs covered:** FR16, FR17, FR18, FR19, FR20, FR21, FR22, FR42, FR43, FR44
**Additional:** ARCH-11 (onEmailReceived, processDocument, retryFailedProcessing), ARCH-12 (email_log), ARCH-23, NFR4, NFR13, NFR17–NFR20

### Epic 5: Ghost Text Review & Transaction Approval
Gal can review AI-classified transactions through the Ghost Text UI — confirming correct suggestions with Enter, editing incorrect fields inline, rejecting irrelevant items, and batch-approving high-confidence items. The defining interaction of TP-FOS.
**FRs covered:** FR23, FR24, FR25, FR26, FR27, FR28, FR29, FR30, FR31
**Additional:** ARCH-11 (onTransactionApproved), UX-5, UX-6, UX-7, UX-8, UX-10, UX-19

### Epic 6: Inventory Management & WAC Engine
Gal can manage shared materials, record restocks with cost, consume inventory into Work Orders via Scoop (with automatic WAC cost calculation), track audit history, and log waste — providing accurate COGS in Nutrition Labels.
**FRs covered:** FR32, FR33, FR34, FR35, FR36, FR37
**Additional:** ARCH-11 (verifyWAC), ARCH-12 (inventory, inventory_log), NFR5

### Epic 7: Overhead, Tax Intelligence & Forward Projections
Gal can track all overhead expenses by category, view monthly burn rate trends, configure the Tax Jar (flat vs. bracket), receive Osek Patur threshold alerts, and model the cash flow impact of future purchases — completing the full financial intelligence picture.
**FRs covered:** FR6, FR7, FR8, FR9, FR38, FR39, FR40, FR41
**Additional:** ARCH-12 (overhead, system_config), UX-3 (overhead KPI)

---

## Epic 1: Project Foundation & App Shell

Gal and Ben can authenticate, see the app navigation on any device, and switch between Hebrew and English. Complete design system, responsive shell, and all foundational infrastructure.

### Story 1.1: Project Scaffold & Development Environment

As a **developer**,
I want a fully configured Vite + React TypeScript project with Firebase, Vercel deployment, linting, testing, and the complete directory structure,
So that all future development has a stable, consistent foundation to build on.

**Acceptance Criteria:**

**Given** a fresh project directory
**When** the scaffold is initialized with `npm create vite@latest tp-fos -- --template react-ts`
**Then** the project compiles with zero errors in TypeScript strict mode
**And** `npm run dev` starts a Vite dev server with HMR working

**Given** the scaffolded project
**When** Firebase SDK packages are installed (`firebase`, `firebase-admin`, `firebase-tools`)
**Then** `firebase.json` is configured for Firestore, Auth, Storage, and Functions emulators
**And** `.firebaserc` points to the `tp-fos` project
**And** `firebase emulators:start` launches all emulators successfully

**Given** the project with Firebase configured
**When** the `/functions` directory is initialized
**Then** it has its own `package.json` and `tsconfig.json`
**And** `functions/src/index.ts` exports an empty entry point that compiles

**Given** the project
**When** path aliases are configured
**Then** `@/` resolves to `src/` in both `tsconfig.json` and `vite.config.ts`
**And** imports like `import { x } from '@/lib'` compile and resolve correctly

**Given** the project
**When** ESLint and Prettier are configured
**Then** `npm run lint` passes with zero warnings on the scaffold
**And** `.eslintrc.cjs` and `.prettierrc` enforce consistent code style

**Given** the project
**When** Vitest is configured
**Then** `npm run test` executes with zero failures
**And** `vitest.config.ts` supports React Testing Library and path aliases

**Given** the project
**When** the directory structure is created
**Then** all directories from the Architecture spec exist: `src/components/`, `src/features/` (dashboard, work-orders, review, inventory, overhead, auth), `src/hooks/`, `src/lib/`, `src/services/`, `src/stores/`, `src/types/`, `src/i18n/`, `src/styles/`, `public/fonts/`
**And** each directory has an `index.ts` barrel export file

**Given** the project
**When** environment configuration is set up
**Then** `.env.example` documents all required variables (`VITE_FIREBASE_*`)
**And** `.env.local` is in `.gitignore`

**Given** the project is pushed to the repository
**When** Vercel is connected
**Then** `npm run build` produces a deployable static SPA in `dist/`

---

### Story 1.2: Design System Tokens & Global Styles

As a **developer**,
I want the complete TailorPlayed SCSS design system foundation implemented with all tokens, mixins, animations, and global styles,
So that every component built from this point forward uses consistent, spec-compliant visual styling.

**Acceptance Criteria:**

**Given** the `src/styles/` directory
**When** `_variables.scss` is created
**Then** it contains all color tokens (`$bg-primary: #120022`, `$bg-secondary: #1e0038`, `$bg-tertiary: #2d0052`, `$bg-elevated: #3d006d`, `$gold: #fcb700`, `$gold-light: #ffd54f`, `$brand-purple: #3c0366`, `$success: #00BA7B`, `$warning: #FA9700`, `$error: #ff4d6d`, `$info: #2A7EFF`)
**And** text tokens (`$text-primary`, `$text-secondary`, `$text-muted`)
**And** typography scale (`$text-2xl: 40px` through `$text-xs: 14px`)
**And** spacing scale (`$space-xs: 4px` through `$space-3xl: 64px`)
**And** radius tokens (`$radius-sm: 8px`, `$radius-md: 12px`, `$radius-lg: 16px`, `$radius-full: 9999px`)
**And** shadow tokens (`$shadow-sm`, `$shadow-md`, `$shadow-lg`, `$shadow-glow`)
**And** border tokens (`$border-subtle`)
**And** transition tokens
**And** CSS Custom Properties are generated from SCSS variables for runtime theming

**Given** `_variables.scss` exists
**When** `_mixins.scss` is created
**Then** it contains `@mixin card-surface` (bg-tertiary, border, radius, shadow)
**And** `@mixin elevated-surface` (bg-elevated variant)
**And** `@mixin focus-ring` (2px solid $gold, 2px offset)
**And** `@mixin interactive-reset` (button/link reset)
**And** `@mixin rtl { [dir="rtl"] & { @content; } }` for RTL overrides

**Given** `_mixins.scss` exists
**When** `_animations.scss` is created
**Then** it contains `@keyframes fadeIn`, `slideUp`, `scaleIn`, `pulse`, `shimmer`, `spin`
**And** all animations respect `prefers-reduced-motion: reduce`

**Given** all SCSS partials exist
**When** `_accessibility.scss` is created
**Then** it contains `.sr-only` class for screen-reader-only content
**And** focus ring styles via `:focus-visible`
**And** `forced-colors: active` support for Windows High Contrast
**And** reduced motion media query that disables Tier 2/3 animations

**Given** all partials exist
**When** `global.scss` is created
**Then** it applies base reset (box-sizing, margin, padding)
**And** sets Fredoka as the sole font family
**And** applies `$bg-primary` as page background
**And** styles scrollbar (thumb: `$brand-purple`, track: `$bg-primary`)
**And** styles text selection (gold on purple)

**Given** the styles directory is complete
**When** Vite config `css.preprocessorOptions.scss.additionalData` is set
**Then** `_variables.scss` and `_mixins.scss` are automatically available in all SCSS modules without explicit import

**Given** `public/fonts/` directory
**When** Fredoka variable font is added
**Then** `Fredoka-Variable.woff2` is self-hosted with Latin, Latin-Extended, and Hebrew subsets
**And** `@font-face` declaration uses `font-display: swap`
**And** font weight range is 400–600

**Given** `vite-plugin-sass-dts` is installed
**When** a `.module.scss` file is saved
**Then** a corresponding `.module.scss.d.ts` TypeScript definition is generated
**And** component imports get type-safe class name access

---

### Story 1.3: Authentication & Route Protection

As **Gal or Ben**,
I want to sign in with my Google account and have all unauthorized access blocked,
So that only we can access the financial system and our data is secure.

**Acceptance Criteria:**

**Given** the app is loaded without authentication
**When** an unauthenticated user visits any route
**Then** they are redirected to the login screen
**And** no financial data or app shell is visible

**Given** the login screen is displayed
**When** Gal or Ben clicks "Sign in with Google"
**Then** Firebase Auth initiates Google Sign-in flow
**And** upon success, the user is redirected to the dashboard route (`/`)

**Given** a Google account that is NOT in the whitelist
**When** that user completes the Google Sign-in flow
**Then** the sign-in is rejected with a clear message: "Access restricted to authorized users"
**And** the user remains on the login screen
**And** the rejected auth attempt is logged

**Given** an authenticated whitelisted user
**When** they navigate the app
**Then** `AuthGuard` component wraps all protected routes
**And** the user's auth state persists across page refreshes (Firebase session persistence)

**Given** an authenticated user
**When** they click "Sign out"
**Then** Firebase Auth session is cleared
**And** the user is redirected to the login screen

**Given** the Firebase project
**When** Firestore Security Rules are deployed
**Then** a single `isAdmin()` function checks `request.auth.uid` against 2 hardcoded UIDs
**And** ALL collections require `isAdmin()` for read and write
**And** unauthenticated requests are denied

**Given** the Firebase project
**When** Storage Security Rules are deployed
**Then** the same `isAdmin()` pattern restricts all file read/write operations

**Given** `src/services/firebase.ts`
**When** the Firebase app is initialized
**Then** it reads config from `import.meta.env.VITE_FIREBASE_*` variables
**And** exports the initialized `app`, `auth`, `db` (Firestore), and `storage` instances

**Given** `src/services/auth.ts`
**When** auth helpers are created
**Then** `signInWithGoogle()`, `signOut()`, and `onAuthStateChanged` listener are exported
**And** the `useAuth` hook in `src/features/auth/hooks/useAuth.ts` provides `{ user, loading, signIn, signOut }`

---

### Story 1.4: App Shell & Responsive Navigation

As **Gal or Ben**,
I want to see a polished app shell with navigation that works on desktop and mobile,
So that I can move between Dashboard, Work Orders, Inventory, and Overhead from any device.

**Acceptance Criteria:**

**Given** the user is authenticated (desktop, ≥ 1024px)
**When** the app shell renders
**Then** the Top Navigation bar displays: TP logo (left), segmented pill tabs center (Dashboard | Work Orders | Inventory | Overhead), and a Pending Review badge (right)
**And** the active tab is visually distinct (filled background + gold text)
**And** the nav bar uses `$bg-secondary` background

**Given** the user is on mobile (< 768px)
**When** the app shell renders
**Then** the Top Navigation simplifies to: logo + pending badge only
**And** a Bottom Navigation appears with 4 items: Home | Orders | Review | More (icon + label each)
**And** active item shows gold icon + label, inactive shows `$text-muted`
**And** all touch targets are ≥ 44x44px

**Given** the user is on tablet (768–1023px)
**When** the app shell renders
**Then** the top nav is visible with potentially abbreviated labels
**And** no bottom nav is shown
**And** layout adapts with tighter padding

**Given** React Router v7 is configured
**When** routes are defined
**Then** `/` renders `DashboardPage`, `/work-orders` renders `WorkOrdersPage`, `/work-orders/:id` renders `WorkOrderDetailPage`, `/inventory` renders `InventoryPage`, `/overhead` renders `OverheadPage`, `/review` renders `ReviewPage`
**And** all routes are protected by `AuthGuard`
**And** unknown routes redirect to `/`

**Given** the `PageShell` layout component
**When** any page renders inside it
**Then** the page content is centered with max-width 1080px on wide screens (≥ 1280px)
**And** padding uses `$space-2xl` on desktop, adapts on smaller screens
**And** the top nav remains fixed/sticky at the top

**Given** navigation between pages
**When** the user clicks a nav tab/item
**Then** the route changes via SPA navigation (no page reload)
**And** the active tab indicator updates immediately

**Given** each page route
**When** the page has no data yet (initial state)
**Then** a warm empty state is displayed with relevant CTA or message (placeholder for now, full empty states built per feature)

---

### Story 1.5: Internationalization & RTL Support

As **Gal**,
I want to switch the entire UI between Hebrew and English with full RTL/LTR layout support,
So that I can work comfortably in my preferred language.

**Acceptance Criteria:**

**Given** `src/i18n/config.ts`
**When** react-i18next is initialized
**Then** Hebrew (`he`) is set as the default language
**And** English (`en`) is available as a secondary language
**And** fallback language is English

**Given** `src/i18n/he.json` and `src/i18n/en.json`
**When** translation files are created
**Then** they contain initial keys for: navigation labels (Dashboard, Work Orders, Inventory, Overhead, Review), common actions (Confirm, Edit, Reject, Cancel, Save, Delete, Approve All), empty state messages ("You're all caught up", "Create your first Work Order"), auth (Sign in, Sign out, Access restricted), and common labels (Net Profit, Tax Jar, Active Projects, Pending)

**Given** the user is in Hebrew mode
**When** the app renders
**Then** `<html dir="rtl" lang="he">` is set
**And** all layout uses CSS logical properties (`padding-inline-start`, `margin-inline-end`, `text-align: start`)
**And** navigation items flow right-to-left
**And** directional icons flip via `transform: scaleX(-1)`

**Given** the user is in English mode
**When** the app renders
**Then** `<html dir="ltr" lang="en">` is set
**And** layout flows left-to-right naturally

**Given** Hebrew RTL layout
**When** currency amounts or percentages are displayed
**Then** numbers are always rendered LTR (`direction: ltr` on numeric elements)
**And** the ₪ symbol appears in the correct position for Hebrew convention

**Given** the navigation bar
**When** a language toggle control is available
**Then** clicking it switches between Hebrew and English instantly (no page reload)
**And** `dir` attribute updates, layout reflows, and all visible text updates
**And** the user's language preference is persisted (localStorage)

**Given** any component in the app
**When** it displays user-facing text
**Then** all strings use `t('key')` from react-i18next, never hardcoded strings

---

### Story 1.6: Core Shared UI Components & Currency Utilities

As a **developer**,
I want a complete library of shared UI components built from the TailorPlayed design system and a currency utility module,
So that all feature development uses consistent, accessible, spec-compliant building blocks.

**Acceptance Criteria:**

**Given** `src/components/Button/`
**When** the Button component is built
**Then** it supports 4 variants: Primary (gold bg, dark text), Secondary (transparent, subtle border), Danger (transparent, red-tinted border), Ghost (no border, text only)
**And** 3 sizes: small, medium (default), large
**And** states: default, hover (150ms transition + translateY(-1px) lift), active, disabled, loading (spinner inside button)
**And** renders keyboard shortcut hint when `shortcut` prop is provided
**And** minimum touch target is 44x44px
**And** focus ring follows `@include focus-ring` mixin
**And** a co-located `Button.test.tsx` validates all variants and states

**Given** `src/components/Card/`
**When** the Card component is built
**Then** it uses `@include card-surface` (bg-tertiary, border-subtle, radius-lg, shadow-sm)
**And** supports hover state with lift + border highlight
**And** supports `clickable` prop that adds cursor pointer and hover glow

**Given** `src/components/Badge/`
**When** Badge components are built
**Then** `Badge` renders a pill-shaped label with semantic color background (15-20% opacity) + matching text
**And** `StatusBadge` maps Work Order statuses (Lead, Design, Production, Shipped) to distinct colors
**And** `ConfidenceBadge` shows green for ≥ 85% and warning amber with "Check Me" for < 85%

**Given** `src/components/Input/`
**When** Input components are built
**Then** `Input` supports text, number, and currency input with `$bg-tertiary` background, `$border-subtle` border, and gold focus state
**And** `Select` renders a custom dropdown with search filter capability
**And** `SearchInput` renders a search-specific input with icon
**And** all inputs support error state (red border + inline error text)
**And** all inputs have associated labels (visible or `.sr-only`)
**And** all inputs are ≥ 44px touch target height

**Given** `src/components/Toast/`
**When** Toast components are built
**Then** `Toast` renders with 4 types: success (gold), error (red + retry action), warning (orange), info (muted)
**And** `ToastContainer` stacks toasts vertically, max 3 visible
**And** success/info auto-dismiss after 3s, error after 5s or manual, warning persistent
**And** toasts never block user interaction

**Given** `src/components/Skeleton/`
**When** the Skeleton component is built
**Then** it renders a shimmer animation (gold-dim opacity pulse) matching the design system
**And** supports `width`, `height`, and `variant` (text, circle, rect) props
**And** respects `prefers-reduced-motion` (static gray instead of shimmer)

**Given** `src/components/ErrorBoundary/`
**When** the ErrorBoundary component is built
**Then** it catches rendering errors and displays a fallback UI
**And** fallback shows a friendly error message with a "Try Again" button
**And** logs error details to console (production: could extend to error reporting)

**Given** `src/lib/currency.ts`
**When** the currency utility module is created
**Then** `toMinorUnits(amount: number, currency: string): number` converts display amounts to integers (agora/cents)
**And** `toDisplayAmount(minorUnits: number, currency: string): number` converts integers to display amounts
**And** `formatCurrency(amountAgora: number, currency: 'ILS' | 'USD' | 'EUR'): string` returns formatted string with symbol (₪82.00, $142.50, €200.00)
**And** all functions handle edge cases (zero, negative, rounding)
**And** co-located tests validate arithmetic precision for WAC scenarios

**Given** `src/components/index.ts`
**When** the barrel export is created
**Then** all shared components are re-exported: `Button`, `Card`, `Badge`, `StatusBadge`, `ConfidenceBadge`, `Input`, `Select`, `SearchInput`, `Toast`, `ToastContainer`, `Skeleton`, `ErrorBoundary`
**And** consumers import via `import { Button, Card } from '@/components'`

---

## Epic 2: Work Orders & Manual Financial Tracking

Gal can create Work Orders, track project status, manually enter transactions (expenses and income), link costs and revenue to projects, and see live margin calculations via the Nutrition Label. System is fully usable for financial tracking without the AI pipeline.

### Story 2.1: Work Order Data Model & CRUD

As **Gal**,
I want to create and edit Work Orders with client name, project description, deadline, and status,
So that I have a container for tracking every game project's financial life.

**Acceptance Criteria:**

**Given** `src/types/workOrder.ts`
**When** the Work Order type and Zod schema are created
**Then** `workOrderSchema` validates: `id` (string), `clientName` (string, required), `projectDescription` (string), `deadline` (Date, optional), `status` (enum: Lead | Design | Production | Shipped), `revenueTotalAgora` (integer, default 0), `directCostAgora` (integer, default 0), `inventoryCostAgora` (integer, default 0), `overheadAllocationAgora` (integer, default 0), `createdAt` (Timestamp), `updatedAt` (Timestamp)
**And** the `WorkOrder` TypeScript type is inferred from the Zod schema

**Given** the Firestore `work_orders` collection
**When** the collection is accessed
**Then** documents follow `snake_case` collection naming and `camelCase` field naming per ARCH-21
**And** currency fields use the `Agora` suffix
**And** timestamp fields use the `At` suffix

**Given** `src/stores/useWorkOrderStore.ts`
**When** the Zustand store is created
**Then** it holds `workOrders: WorkOrder[]`, `loading: boolean`, `error: string | null`
**And** actions: `setWorkOrders`, `setLoading`, `setError`
**And** selectors are defined outside the store: `selectActiveProjects`, `selectWorkOrderById`

**Given** `src/features/work-orders/hooks/useWorkOrders.ts`
**When** the Firestore real-time hook is created
**Then** it subscribes to the `work_orders` collection via `onSnapshot`
**And** incoming documents are parsed through `workOrderSchema`
**And** validated data flows into `useWorkOrderStore`
**And** the listener is cleaned up on unmount

**Given** the Work Orders page
**When** Gal clicks "New Work Order"
**Then** a creation form appears (React Hook Form) with fields: Client Name (required), Project Description, Deadline (date picker), Status (defaults to Lead)
**And** form validates via Zod schema before submission
**And** on valid submit, a new document is written to Firestore `work_orders`
**And** a success toast confirms creation

**Given** an existing Work Order
**When** Gal clicks "Edit"
**Then** the form pre-fills with current values
**And** Gal can update any field
**And** on save, the Firestore document updates with new `updatedAt` timestamp
**And** the list view reflects changes in real-time

---

### Story 2.2: Work Order Status Lifecycle & List View

As **Gal**,
I want to see all my projects in a scannable list with status progression and visual health indicators,
So that I can quickly assess which projects need attention.

**Acceptance Criteria:**

**Given** the Work Orders list page (`/work-orders`)
**When** Work Orders exist
**Then** each project displays as an icon card row: Phosphor icon (in tinted rounded rect), project name, current phase badge, cost count, revenue amount, and margin percentage with mini progress bar
**And** rows are sorted by status (Production first, then Design, Lead, Shipped)

**Given** the Work Orders list page
**When** no Work Orders exist
**Then** a warm empty state displays: illustration + "Create your first Work Order" + CTA button
**And** message uses i18n translation keys

**Given** a Work Order card
**When** the project margin is calculated
**Then** margin ≥ 30% shows green (`$success`) text + bar fill
**And** margin 20-29% shows yellow (`$warning`) text + bar fill
**And** margin < 20% shows red (`$error`) text + bar fill + subtle red-tinted border on the card
**And** color is always paired with the percentage number (never color alone per UX-15)

**Given** a Work Order with status "Design"
**When** Gal clicks the status area or a "Change Status" action
**Then** a `StatusStepper` component shows the full lifecycle: Lead → Design → Production → Shipped
**And** the current stage is highlighted
**And** Gal can advance to the next status or move back
**And** status change is saved to Firestore immediately
**And** `updatedAt` timestamp updates

**Given** the status stepper
**When** a Work Order is moved to "Shipped"
**Then** it is visually distinguished in the list (muted styling, moved to bottom or separate section)

**Given** the Work Orders list on mobile (< 768px)
**When** the page renders
**Then** project rows show: icon + name + margin percentage (simplified)
**And** revenue column is hidden to save space
**And** touch targets are ≥ 44px

---

### Story 2.3: Manual Transaction Entry & Cost/Revenue Linkage

As **Gal**,
I want to manually create transactions and link them to Work Orders,
So that I can track costs and revenue even before the AI email pipeline is built.

**Acceptance Criteria:**

**Given** `src/types/transaction.ts`
**When** the Transaction type and Zod schema are created
**Then** `transactionSchema` validates: `id` (string), `vendorName` (string, required), `amountAgora` (integer, required), `currency` (enum: ILS | USD | EUR), `date` (Date, required), `category` (enum: DirectCost | InventoryRestock | Overhead | Revenue | Personal), `workOrderId` (string, optional), `inventoryItemId` (string, optional), `status` (enum: pending_review | approved | rejected), `aiConfidence` (number, optional), `originalFileUrl` (string, optional), `source` (enum: manual | ai), `notes` (string, optional), `createdAt` (Timestamp), `updatedAt` (Timestamp)
**And** `Transaction` TypeScript type is inferred from schema

**Given** `src/stores/useTransactionStore.ts`
**When** the Zustand store is created
**Then** it holds `transactions: Transaction[]`, `loading: boolean`, `error: string | null`
**And** selectors: `selectByWorkOrder(woId)`, `selectPendingReview`, `selectByCategory`

**Given** a Work Order detail page or a dedicated entry point
**When** Gal clicks "Add Transaction" or "Add Expense" / "Add Revenue"
**Then** a form appears with fields: Vendor Name, Amount (number input), Currency (ILS default, USD/EUR options), Date, Category (dropdown), Work Order (searchable dropdown, optional), Notes (optional)
**And** the form uses React Hook Form with Zod validation
**And** amount is converted to agora/cents via `toMinorUnits()` before saving

**Given** a transaction with currency USD or EUR
**When** the transaction is displayed anywhere in the app
**Then** the original amount and currency are shown alongside the ILS equivalent
**And** non-ILS amounts display an "Estimated" badge per FR22/FR49
**And** the conversion rate used is documented

**Given** a valid manual transaction form submission
**When** Gal submits the form
**Then** a document is created in Firestore `transactions` collection with `source: 'manual'` and `status: 'approved'` (manual entries skip review)
**And** if a Work Order is linked, the Work Order's `directCostAgora` or `revenueTotalAgora` updates accordingly
**And** a success toast confirms the transaction was saved

**Given** a transaction linked to a Work Order
**When** the transaction is a DirectCost category
**Then** the Work Order's `directCostAgora` field increments by the transaction amount
**And** the Nutrition Label recalculates within 2 seconds

**Given** a transaction linked to a Work Order
**When** the transaction is a Revenue category
**Then** the Work Order's `revenueTotalAgora` field increments by the transaction amount

**Given** the transactions list on a Work Order detail
**When** transactions exist for that Work Order
**Then** they display with: vendor name, amount (formatted via `formatCurrency`), date, category badge
**And** the list is sorted by date (newest first)

---

### Story 2.4: Nutrition Label & Margin Calculations

As **Gal**,
I want to see a financial "Nutrition Label" for each project showing revenue, all cost types, buffer, and net profit with a live margin,
So that I know the true profitability of every game I'm building.

**Acceptance Criteria:**

**Given** `src/features/work-orders/components/NutritionLabel.tsx`
**When** the Nutrition Label component renders for a Work Order
**Then** it displays in order: Revenue (total), Direct Costs (sum of DirectCost transactions), Inventory Costs / Scoops (placeholder showing ₪0 until Epic 6), Overhead Allocation (proportional share), Unforeseen Buffer (5% of total costs), Net Profit (Revenue - all costs - buffer)
**And** each line shows the amount formatted via `formatCurrency`

**Given** the Nutrition Label
**When** Net Profit and margin are calculated
**Then** margin = (Revenue - Total Costs - Buffer) / Revenue × 100
**And** margin ≥ 30% renders in `$success` green with a healthy indicator
**And** margin 20-29% renders in `$warning` yellow
**And** margin < 20% renders in `$error` red with a warning icon
**And** if Revenue is 0, margin shows "—" (no division by zero)

**Given** the Nutrition Label
**When** cost categories are displayed
**Then** Direct Costs and Inventory Costs sections are expandable/collapsible
**And** expanding shows individual transactions/scoops that contribute to the total
**And** tapping an individual cost shows the source document reference

**Given** the Nutrition Label
**When** Overhead Allocation is calculated
**Then** it shows the Work Order's proportional share of monthly overhead
**And** allocation method: equal split across active (Production status) Work Orders
**And** if no overhead exists yet, shows ₪0

**Given** a Work Order with linked transactions
**When** a new transaction is added or an existing one is modified
**Then** the Nutrition Label recalculates and updates within 2 seconds (FR15, NFR2)
**And** during recalculation, a brief shimmer overlay appears on the affected values

**Given** the Nutrition Label on mobile
**When** rendered on a small viewport
**Then** it remains fully readable in a single-column layout
**And** expand/collapse controls are touch-friendly (≥ 44px targets)
**And** all currency amounts are formatted with proper symbols

**Given** `src/lib/margins.ts`
**When** margin utility functions are created
**Then** `calculateMargin(revenueAgora, totalCostAgora, bufferAgora): number` returns percentage
**And** `getMarginStatus(marginPercent): 'healthy' | 'watch' | 'danger'` maps to thresholds
**And** co-located tests verify edge cases (zero revenue, zero cost, negative margin)

---

### Story 2.5: Work Order Detail Page

As **Gal**,
I want a complete detail view for each Work Order that assembles all financial data in one place,
So that I can drill into any project and understand its full financial picture.

**Acceptance Criteria:**

**Given** the route `/work-orders/:id`
**When** a valid Work Order ID is provided
**Then** `WorkOrderDetailPage` renders with: project header (client name, description, deadline), Status Stepper (current phase highlighted), Nutrition Label (full financial breakdown), and linked Transactions list

**Given** the Work Order detail page
**When** the user arrived from the Work Orders list
**Then** browser back returns to the Work Orders list with scroll position preserved
**And** a breadcrumb or back navigation is visible

**Given** the Work Order detail page header
**When** it renders
**Then** it shows: client name (`$text-xl`, `$gold`), project description (`$text-base`, `$text-primary`), deadline (formatted DD/MM/YYYY if set), and an Edit button (secondary style)

**Given** the Transactions section
**When** transactions linked to this Work Order exist
**Then** they display in a clean list: date, vendor, amount (formatted with currency symbol), category badge
**And** sorted by date (newest first)
**And** each transaction row is tappable to view details

**Given** the Transactions section
**When** no transactions are linked
**Then** an empty state shows: "No costs or revenue tracked yet" with a hint about adding transactions manually
**And** "Add Transaction" CTA button is visible

**Given** the Work Order detail page
**When** Gal clicks "Add Transaction" from this page
**Then** the manual transaction form (from Story 2.3) opens with the Work Order pre-selected in the linkage field

**Given** an invalid or non-existent Work Order ID in the URL
**When** the page attempts to load
**Then** an error state displays: "Work Order not found" with a "Back to Work Orders" link

**Given** the detail page on mobile
**When** rendered on a small viewport
**Then** sections stack vertically: Header → Status Stepper → Nutrition Label → Transactions
**And** all sections are fully functional with touch-friendly controls

---

## Epic 3: Dashboard & Project Health

Gal and Ben can open the app and immediately see real-time Net Profit, Tax Jar reserve, active project count, and a Project Health Table with color-coded margin indicators — answering "how's the business?" at a glance.

### Story 3.1: Hero Stat & KPI Cards

As **Gal or Ben**,
I want to see the single most important number (Net Profit) front and center, with key financial indicators below it,
So that I can assess the health of the business in under 3 seconds.

**Acceptance Criteria:**

**Given** the Dashboard page (`/`)
**When** it loads for an authenticated user
**Then** a Hero Stat block renders centered: greeting line ("Good morning, Gal" — time-aware), large Net Profit amount (`$text-2xl`, 40px, `$gold`, Fredoka 600), label ("Net Profit — February 2026"), and a delta badge showing % change from previous month
**And** delta badge is green (`$success`) for positive, red (`$error`) for negative

**Given** the Hero Stat
**When** Net Profit is calculated
**Then** it sums all approved Revenue transactions minus all approved cost transactions (DirectCost + Overhead) for the current month
**And** amounts use `formatCurrency` with ILS

**Given** the Dashboard below the Hero Stat
**When** KPI cards render
**Then** 4 cards display in a row: Tax Jar (₪ amount + "set aside from net profit"), Active Projects (count + "in production"), Monthly Overhead (₪ amount + delta badge if changed), Pending Review (count + confidence breakdown)
**And** each card uses `$bg-tertiary` background, `$space-md` padding (dashboard density), `$radius-md` border radius

**Given** the Pending Review KPI card
**When** pending items exist
**Then** the card shows a warm glow border on hover (`$shadow-glow`)
**And** clicking it navigates to `/review`
**And** it shows breakdown: "X green, Y to check"

**Given** the Pending Review KPI card
**When** no pending items exist
**Then** the card shows "0" with "All caught up" subtitle
**And** no glow effect, not clickable

**Given** the Tax Jar KPI card
**When** it renders
**Then** it shows the current Tax Jar reserve calculated as 35% (flat default) of net taxable income
**And** the framing is "set aside" (positive) not "owed" (per emotional design principle)

**Given** the Dashboard on mobile (< 768px)
**When** KPI cards render
**Then** they display in a horizontal scrollable row (swipeable per UX-11)
**And** Hero Stat amount reduces to 36px (from 52px desktop)
**And** all cards are touch-friendly with ≥ 44px height

**Given** Dashboard data is loading
**When** the page first renders
**Then** the Hero Stat and KPI cards show skeleton shimmer placeholders
**And** skeletons match the approximate shape and size of the real content

---

### Story 3.2: Project Health Table

As **Gal or Ben**,
I want to see all active projects in a scannable list with margin health indicators,
So that I can instantly identify which projects are profitable and which need attention.

**Acceptance Criteria:**

**Given** the Dashboard below the KPI cards
**When** Work Orders exist
**Then** a Project Health section renders with project rows — each showing: Phosphor icon (in tinted background), project name + current phase, revenue amount, total cost, and margin percentage with a mini progress bar
**And** rows are sorted by status priority (Production → Design → Lead), then by margin (lowest first, so at-risk projects surface)

**Given** a project row
**When** margin is ≥ 30%
**Then** the margin percentage text and bar fill use `$success` green
**And** no additional indicator is needed

**Given** a project row
**When** margin is 20-29%
**Then** the margin percentage text and bar fill use `$warning` yellow
**And** a small caution icon appears next to the percentage

**Given** a project row
**When** margin is < 20%
**Then** the margin percentage text and bar fill use `$error` red
**And** the entire row gets a subtle red-tinted border
**And** a warning icon appears next to the percentage

**Given** a project row
**When** the user clicks/taps it
**Then** navigation goes to `/work-orders/:id` (Work Order detail page)
**And** the row shows a hover state (bg shift + border highlight) on desktop

**Given** the Dashboard
**When** no Work Orders exist
**Then** the Project Health section shows an empty state: "No projects yet — create your first Work Order" with a CTA button linking to `/work-orders`

**Given** the Project Health Table on mobile
**When** rendered on a small viewport
**Then** rows simplify to: icon + name + margin percentage (revenue column hidden)
**And** rows remain tappable with ≥ 44px height

---

### Story 3.3: Real-Time Dashboard Data Layer

As **Gal or Ben**,
I want the dashboard numbers to always reflect the latest data without manual refresh,
So that I can trust that what I see is current and accurate.

**Acceptance Criteria:**

**Given** `src/features/dashboard/hooks/useDashboardData.ts`
**When** the dashboard hook is created
**Then** it subscribes to real-time Firestore listeners for: `transactions` (approved, current month), `work_orders` (all), and `system_config` (tax settings)
**And** it computes: Net Profit (revenue - costs for current month), Tax Jar (Net Profit × tax rate from config), Active Projects (Work Orders with status "Production"), Pending Review count (transactions with status "pending_review")
**And** all listeners are cleaned up on unmount

**Given** the dashboard is open
**When** a transaction is approved (via Ghost Text review or manual entry elsewhere)
**Then** the Net Profit hero stat updates within 2 seconds (NFR2)
**And** the Tax Jar KPI recalculates
**And** the affected project's margin updates in the Project Health section
**And** the Pending Review count decrements

**Given** the dashboard
**When** initial data loads
**Then** first meaningful paint (Hero Stat + KPI cards visible) occurs in < 3 seconds on desktop (NFR1)
**And** < 5 seconds on mobile over 4G
**And** skeleton states are shown during loading, replaced by real data via smooth `fadeIn` transition

**Given** the dashboard hook
**When** month boundaries are handled
**Then** "current month" is determined by the user's local timezone
**And** Net Profit and Tax Jar reflect only the current calendar month's transactions
**And** delta badge compares to the previous complete month

**Given** `src/lib/taxJar.ts`
**When** the Tax Jar utility is created
**Then** `calculateTaxReserve(netProfitAgora: number, method: 'flat' | 'bracket', flatRate?: number): number` returns the tax reserve amount in agora
**And** flat mode applies the configured rate (default 35%) to net profit
**And** bracket mode applies Israeli 2026 progressive brackets (10%/14%/20%/31%/35%/47%/50%)
**And** co-located tests verify both calculation modes with known amounts

**Given** real-time listeners
**When** the user navigates away from the dashboard
**Then** dashboard-specific listeners are paused/unsubscribed
**And** when the user returns, listeners reactivate and data refreshes

---

## Epic 4: Email Ingestion & AI Document Processing

Financial documents arriving via email are automatically detected, processed by AI (Hebrew + English), classified with confidence scores, and queued for human review. Originals are auto-forwarded to the accountant untouched.

### Story 4.1: Gmail API Integration & Email Detection

As a **system**,
I want to detect new emails in designated mailboxes and download their contents,
So that financial documents are captured automatically without manual forwarding.

**Acceptance Criteria:**

**Given** the Google Cloud project for TP-FOS
**When** Gmail API and Pub/Sub are configured
**Then** a Pub/Sub topic (`tp-fos-email-ingestion`) receives push notifications when new emails arrive in the connected Gmail account
**And** OAuth 2.0 credentials are stored in Cloud Functions environment config (never client-side)

**Given** a new email arrives in `orders@tailorplayed.com`, `supplies@`, `developing@`, or `expenses@`
**When** the Pub/Sub notification triggers `onEmailReceived` Cloud Function
**Then** the function identifies which designated mailbox received the email
**And** downloads the email metadata (from, subject, date, body)
**And** downloads all attachments (PDF, JPG, PNG) and HTML body content

**Given** downloaded email content
**When** attachments are processed
**Then** each attachment is stored in Firebase Storage under `documents/{emailId}/{filename}`
**And** storage path is recorded for later AI processing

**Given** `functions/src/email/onEmailReceived.ts`
**When** the Cloud Function executes
**Then** a document is created in Firestore `email_log` collection with: `messageId` (Gmail message ID), `mailbox` (which designated address), `receivedAt` (timestamp), `status: 'received'`, `attachmentUrls` (array of Storage paths), `subject`, `from`
**And** the email_log document ID is used to trigger downstream processing

**Given** `src/types/email.ts` (and corresponding `functions/src/shared/`)
**When** the EmailLog type and Zod schema are created
**Then** `emailLogSchema` validates: `id`, `messageId`, `mailbox` (enum), `receivedAt`, `status` (enum: received | processing | processed | unprocessed | failed), `attachmentUrls`, `transactionId` (optional, set after AI processing), `errorMessage` (optional)

**Given** the `email_log` collection
**When** any email enters the system
**Then** it is tracked regardless of processing outcome — zero emails silently dropped (NFR13)
**And** the `status` field always reflects current processing state

**Given** `functions/src/email/gmailClient.ts`
**When** the Gmail API wrapper is created
**Then** it exports: `getEmailById(messageId)`, `getAttachments(messageId)`, `markAsRead(messageId)`
**And** all calls use service account or OAuth credentials from Cloud Functions config
**And** errors are caught and logged, never silently swallowed

---

### Story 4.2: Paperless Auto-Forward (Accountant Integration)

As **the system**,
I want original, untouched documents to be auto-forwarded to Paperless independently of FOS processing,
So that the accountant always receives documents even if FOS is down.

**Acceptance Criteria:**

**Given** the Gmail account for Tailor Played
**When** Gmail filters are configured
**Then** emails arriving at `orders@`, `supplies@`, `developing@`, and `expenses@` are auto-forwarded to the Paperless accountant email address
**And** forwarding uses Gmail's native filter/forwarding feature (not FOS code)
**And** the original email and attachments are forwarded untouched — no AI modification, no compression, no format conversion (FR42)

**Given** FOS is operational
**When** a new email arrives
**Then** Gmail filter forwards the original to Paperless AND Pub/Sub triggers FOS processing
**And** both happen independently — neither blocks the other

**Given** FOS is down or Cloud Functions are unavailable
**When** a new email arrives
**Then** Gmail filter still forwards the original to Paperless (FR43)
**And** the email remains in Gmail for FOS to process when it recovers
**And** Pub/Sub notifications are retained and delivered when the function becomes available

**Given** the `email_log` collection
**When** a document is processed by FOS
**Then** the log tracks whether the email was also forwarded to Paperless (`paperlessForwarded: true`)
**And** forwarding status is derived from Gmail filter configuration, not FOS logic (FOS trusts Gmail filters)

**Given** audit requirements
**When** Gal checks the email_log
**Then** she can verify which documents were forwarded to Paperless and when (FR44)
**And** the audit trail includes: email subject, sender, received date, mailbox, forwarding status

---

### Story 4.3: AI Document Processing with Gemini

As a **system**,
I want to send financial documents to Gemini 2.5 Pro and extract structured data,
So that invoices and receipts are automatically parsed into usable financial records.

**Acceptance Criteria:**

**Given** `functions/src/ai/processDocument.ts`
**When** a new `email_log` document is created with `status: 'received'`
**Then** a Firestore `onCreate` trigger fires the `processDocument` Cloud Function
**And** the function updates `email_log.status` to `'processing'`

**Given** the Cloud Function has a document to process
**When** it sends the document to Gemini 2.5 Pro
**Then** the prompt instructs Gemini to extract: vendor name, date, total amount, currency (ILS/USD/EUR), line items (description + amount each), document type (invoice, receipt, quote), and language detected (Hebrew/English/mixed)
**And** Gemini returns structured JSON via function calling
**And** the API key is read from Cloud Functions environment config (ARCH-8, NFR8)

**Given** `functions/src/ai/geminiClient.ts`
**When** the Gemini wrapper is created
**Then** it exports `parseFinancialDocument(documentUrl: string, mimeType: string): Promise<ParsedDocument>`
**And** it handles PDF, JPG, PNG, and HTML content types
**And** timeout is set to 25 seconds (within 30s NFR4 budget, leaving 5s for Firestore writes)

**Given** a Hebrew invoice (e.g., "חשבונית מס" from a local supplier)
**When** processed by Gemini
**Then** vendor name is extracted in Hebrew
**And** amounts are parsed correctly (₪ symbol, Israeli number format)
**And** date is parsed as DD/MM/YYYY (Israeli convention)

**Given** an English invoice (e.g., Game Crafter, USD)
**When** processed by Gemini
**Then** vendor name, amounts ($ symbol), and dates are extracted correctly
**And** currency is identified as USD

**Given** a successfully parsed document
**When** structured data is returned from Gemini
**Then** a new `transactions` document is created in Firestore with: `vendorName`, `amountAgora` (converted to integer), `currency`, `date`, `status: 'pending_review'`, `source: 'ai'`, `aiConfidence` (from Gemini), `originalFileUrl` (Storage path), `sourceEmailRef` (email_log ID)
**And** `email_log.status` updates to `'processed'`
**And** `email_log.transactionId` links to the created transaction

**Given** the entire email-to-pending pipeline
**When** timed end-to-end
**Then** processing completes in < 30 seconds from email arrival to pending transaction in Firestore (NFR4)

---

### Story 4.4: Transaction Classification & Confidence Scoring

As a **system**,
I want to classify each transaction into a category and suggest project/inventory linkage with confidence scores,
So that Gal reviews pre-classified suggestions instead of starting from scratch.

**Acceptance Criteria:**

**Given** the Gemini processing prompt (Story 4.3)
**When** extended for classification
**Then** the prompt also instructs Gemini to: classify into category (Direct Cost, Inventory Restock, Overhead, Personal), assign a confidence score (0-100%), suggest a Work Order match based on vendor history and email context, suggest an Inventory item match for restock-type transactions
**And** classification reasoning is included in the response (1-2 sentences explaining why)

**Given** a transaction from a known vendor (e.g., "Game Crafter" linked to "David's Game" 3 times before)
**When** classified by Gemini
**Then** confidence is high (≥ 85%)
**And** Work Order suggestion matches the historical pattern
**And** reasoning states: "Matched to David's Game — vendor linked 3 times previously" (FR20)

**Given** a transaction from a new or ambiguous vendor
**When** classified by Gemini
**Then** confidence is lower (< 85%)
**And** the transaction is flagged with `aiConfidence < 85`
**And** the category may be suggested with lower certainty

**Given** a transaction with non-ILS currency (USD or EUR)
**When** processed
**Then** the original amount and currency are preserved in the transaction document
**And** an estimated ILS equivalent is calculated using the last known conversion rate
**And** `isEstimatedConversion: true` flag is set on the transaction (FR22)
**And** `conversionRate` and `conversionRateDate` are stored

**Given** a photo receipt (camera capture sent via email)
**When** processed by Gemini
**Then** it is handled with the same pipeline as PDF/image attachments (FR21)
**And** Gemini's vision capability extracts text from the photo
**And** processing reliability is equivalent to PDF documents

**Given** the `transactions` document created by AI processing
**When** all classification fields are populated
**Then** the document includes: `category`, `aiConfidence`, `suggestedWorkOrderId`, `suggestedInventoryItemId`, `classificationReasoning`, `isEstimatedConversion`, `conversionRate`

---

### Story 4.5: Error Handling, Retry & Pipeline Resilience

As a **system**,
I want graceful error handling at every stage of the pipeline with automatic retries,
So that no financial document is ever lost and failures are recoverable.

**Acceptance Criteria:**

**Given** `functions/src/scheduled/retryFailedProcessing.ts`
**When** the scheduled Cloud Function runs (every hour via Cloud Scheduler)
**Then** it queries `email_log` for documents with `status: 'unprocessed'` or `status: 'failed'` that are older than 1 hour
**And** re-triggers AI processing for each (up to 10 per run to avoid quota issues)
**And** increments a `retryCount` field on the email_log document
**And** after 3 failed retries, status is set to `'failed_permanent'` and Gal is notified via a persistent entry in the review queue

**Given** the Gmail API is unavailable
**When** a Pub/Sub notification arrives but email download fails
**Then** the email_log document is created with `status: 'received'` and `errorMessage` describing the failure
**And** the email remains in Gmail — no data is lost (NFR17)
**And** the retry function picks it up on the next scheduled run

**Given** the Gemini API returns an error or times out
**When** AI processing fails
**Then** the email_log status updates to `'unprocessed'`
**And** the original document is preserved in Firebase Storage
**And** `errorMessage` describes the failure (timeout, rate limit, parse error)
**And** the manual entry fallback (FR50) remains available — Gal can create the transaction manually (NFR18)

**Given** currency conversion is needed but the rate API is unavailable
**When** conversion is attempted
**Then** the last known rate is used (from `system_config` collection)
**And** the transaction is flagged with `isEstimatedConversion: true` and `conversionRateStale: true`
**And** the rate staleness is visible in the review UI: "Rate may be stale" (NFR20)

**Given** any processing stage
**When** an error occurs
**Then** it is logged to Cloud Logging with: function name, email_log ID, error type, error message, timestamp
**And** the error never causes silent data loss — the email_log always reflects the true state

**Given** the pipeline is recovering after downtime
**When** multiple Pub/Sub notifications are delivered at once (backlog)
**Then** the system processes them sequentially (concurrency limit on Cloud Function)
**And** each email is handled independently — one failure doesn't block others
**And** rate limits on Gemini API are respected (backoff strategy)

---

## Epic 5: Ghost Text Review & Transaction Approval

Gal can review AI-classified transactions through the Ghost Text UI — confirming correct suggestions with Enter, editing incorrect fields inline, rejecting irrelevant items, and batch-approving high-confidence items. The defining interaction of TP-FOS.

### Story 5.1: Review Queue & Pending Items List

As **Gal**,
I want to see all pending review items in a dedicated queue with confidence indicators,
So that I know exactly what needs my attention and can prioritize yellow-flagged items.

**Acceptance Criteria:**

**Given** the Review page (`/review`)
**When** pending transactions exist
**Then** a list renders with each item showing: vendor name, amount (formatted with currency), confidence indicator (green dot for ≥ 85%, yellow "Check Me" badge for < 85%), date (relative: "Today", "Yesterday", "3 days ago"), and mailbox source
**And** items are sorted by confidence ascending (yellow/low-confidence first — needs attention)
**And** a counter displays at the top: "3 pending"

**Given** the Review page
**When** no pending items exist
**Then** a warm empty state displays: checkmark icon + "You're all caught up!" + timestamp of last review
**And** the message uses i18n translation keys

**Given** `src/features/review/hooks/usePendingReview.ts`
**When** the hook is created
**Then** it subscribes to `transactions` collection filtered by `status: 'pending_review'` via Firestore `onSnapshot`
**And** data flows through Zod validation into `useTransactionStore`
**And** the listener updates in real-time (new AI-processed items appear without refresh)
**And** cleanup on unmount

**Given** the Review page
**When** a pending item is clicked/tapped
**Then** the Ghost Text Card opens for that item (Story 5.2)
**And** the list remains visible in the background on desktop

**Given** the pending count
**When** displayed in the Top Nav badge and KPI card
**Then** it reflects the real-time count from the same Firestore listener
**And** decrements immediately when items are confirmed/rejected

**Given** the Review page on mobile
**When** rendered on a small viewport
**Then** the list is full-width, single column
**And** each item row is ≥ 44px height with touch-friendly tap targets
**And** tapping an item opens full-screen Ghost Text (Story 5.5)

---

### Story 5.2: Ghost Text Card — Core Confirmation Flow

As **Gal**,
I want to see AI-classified invoice details in a focused card and confirm correct suggestions with a single keystroke,
So that I can process each item in under 5 seconds when the AI is right.

**Acceptance Criteria:**

**Given** `src/features/review/components/GhostTextCard.tsx`
**When** a pending item is selected
**Then** a focused review card renders (centered, ~500px wide on desktop) with:
- Header: Phosphor FileText icon + vendor name + date + amount with currency symbol (and "Estimated" badge if non-ILS conversion)
- Body: Ghost Text fields for Category and Project (dashed border, italic `$text-muted` text)
- Confidence bar: visual progress + percentage number (green `$success` for ≥ 85%, yellow `$warning` for < 85%)
- AI reasoning bubble: 1-2 sentence explanation ("Matched to David's Game — vendor linked 3 times previously")
- Actions: Confirm (primary, shows "Enter"), Edit (secondary, shows "E"), Reject (danger, shows "Del")
- Footer: "View original document →" link

**Given** a Ghost Text Card for a high-confidence item (≥ 85%)
**When** Gal presses Enter (or clicks Confirm)
**Then** the card shows a brief gold glow pulse (`$shadow-glow`, 200ms)
**And** Ghost Text fields transition from muted to solid (`$text-muted` → `$text-primary`, `fadeIn`)
**And** the card slides down and fades out (300ms)
**And** the transaction status updates to `'approved'` in Firestore
**And** a success toast appears: "Transaction confirmed"

**Given** a Ghost Text Card
**When** it opens
**Then** the dashboard/list dims behind it (`$bg-primary` at 70% opacity overlay)
**And** the card uses `scaleIn` animation (300ms) on entrance
**And** focus is trapped inside the card (keyboard nav stays within)

**Given** keyboard navigation on desktop
**When** the Ghost Text Card is open
**Then** `Enter` confirms all fields as shown
**And** `E` enters edit mode (Story 5.3)
**And** `Delete` initiates reject flow (Story 5.3)
**And** `Escape` closes the card without action (returns to pending queue)
**And** `→` navigates to the next pending item without closing flow
**And** `←` navigates to the previous pending item

**Given** the "View original document" link
**When** clicked
**Then** the original document (PDF/image) opens in a new tab from Firebase Storage

**Given** the confirmation flow
**When** the card dissolves after confirmation
**Then** the dashboard KPIs and Nutrition Label behind are already updated with the new data
**And** the pending count badge decrements
**And** the next pending item's card auto-loads if items remain

---

### Story 5.3: Ghost Text Field Editing & Rejection

As **Gal**,
I want to edit incorrect AI suggestions inline and reject irrelevant transactions,
So that I can correct misclassifications without re-entering data from scratch.

**Acceptance Criteria:**

**Given** `src/features/review/components/GhostTextField.tsx`
**When** a Ghost Text field is in AI-suggested state (default)
**Then** it renders with: `$text-muted` (50% gold) italic text, dashed `$border-subtle` border, `$bg-tertiary` background
**And** hovering brightens the border slightly

**Given** a Ghost Text field
**When** Gal presses `E` or Tab to the field or clicks it
**Then** edit mode activates: border changes from dashed to solid `$gold`, text changes from `$text-muted` italic to `$text-primary` normal weight, cursor appears in the field
**And** the existing AI-suggested value remains in the field (never cleared — user edits within the suggestion per UX form patterns)

**Given** the Category Ghost Text field in edit mode
**When** activated
**Then** a searchable dropdown overlay opens below the field with options: Direct Cost, Inventory Restock, Overhead, Revenue, Personal
**And** typing filters the list (fuzzy matching: "dir" matches "Direct Cost")
**And** selecting an option updates the field and shows solid gold border + checkmark

**Given** the Project Ghost Text field in edit mode
**When** activated
**Then** a searchable dropdown opens with all Work Orders (name + status)
**And** fuzzy search: "david" matches "David's Game"
**And** selecting a Work Order updates the `suggestedWorkOrderId`

**Given** a Ghost Text field that has been user-edited
**When** it renders after the edit
**Then** it shows: solid `$gold` border, `$text-primary` bright text (non-italic), a small checkmark (✓) indicator
**And** this visual state clearly distinguishes "human-verified" from "AI-suggested" (the defining visual metaphor per UX-5)

**Given** the Vendor and Amount fields
**When** displayed in the Ghost Text Card
**Then** they are read-only (from the AI/document) — not editable in Ghost Text flow
**And** styled differently to indicate they are locked (no dashed border, solid muted border)

**Given** a Ghost Text Card with edited fields
**When** Gal presses Enter to confirm
**Then** all field values (original AI + user edits) are saved to the Firestore transaction document
**And** the transaction status updates to `'approved'`
**And** any changed fields are logged in the audit trail (before/after)

**Given** the reject flow
**When** Gal presses Delete or clicks Reject
**Then** a brief confirmation dialog appears: "Reject this item? It will be archived." with Cancel and Reject buttons (Bit-style explicit confirmation)
**And** on confirm: transaction status updates to `'rejected'`
**And** the card fades out with a subtle red border flash
**And** a toast confirms: "Transaction rejected"

**Given** the reject flow
**When** a transaction is rejected
**Then** it is removed from the pending queue
**And** it remains in Firestore with `status: 'rejected'` (not deleted — audit trail preserved)
**And** the pending count decrements

**Given** all overlays and dropdowns
**When** Escape is pressed
**Then** the dropdown closes (if open), or the card closes (if no dropdown open)
**And** click-away also closes dropdowns

---

### Story 5.4: Post-Approval Side Effects & Real-Time Updates

As **the system**,
I want confirmed transactions to automatically update all related financial data,
So that the dashboard, Nutrition Labels, and Tax Jar always reflect the latest truth.

**Acceptance Criteria:**

**Given** `functions/src/triggers/onTransactionApproved.ts`
**When** a transaction document in Firestore changes `status` from `'pending_review'` to `'approved'`
**Then** the `onUpdate` Cloud Function triggers

**Given** an approved transaction with `category: 'DirectCost'` and a `workOrderId`
**When** the trigger fires
**Then** the linked Work Order's `directCostAgora` is incremented by `amountAgora`
**And** the Work Order's `updatedAt` timestamp is set
**And** the Nutrition Label on any open client recalculates via real-time Firestore listener

**Given** an approved transaction with `category: 'Revenue'` and a `workOrderId`
**When** the trigger fires
**Then** the linked Work Order's `revenueTotalAgora` is incremented by `amountAgora`

**Given** an approved transaction with `category: 'Overhead'`
**When** the trigger fires
**Then** the `overhead` collection is updated (or a new overhead document created if from AI)
**And** monthly overhead totals recalculate

**Given** any transaction approval
**When** the trigger completes
**Then** an audit trail document is created with: `transactionId`, `action: 'approved'`, `actorUid`, `timestamp`, `beforeSnapshot`, `afterSnapshot`
**And** the entire trigger completes within 2 seconds (FR31, NFR2)

**Given** the dashboard is open when a transaction is approved
**When** Firestore listeners detect the Work Order and transaction changes
**Then** Net Profit KPI updates
**And** Tax Jar recalculates
**And** Project Health Table margin updates
**And** Pending Review count decrements
**And** all updates are visible to the user without manual refresh

**Given** a batch of transactions approved simultaneously (Approve All)
**When** multiple triggers fire
**Then** each is processed independently
**And** Work Order totals reflect the sum of all approved amounts
**And** no race conditions occur (Firestore transactions used for counter increments)

---

### Story 5.5: Batch Approval (Approve All) & Mobile Review

As **Gal**,
I want to batch-approve all high-confidence items at once and review on mobile with full functionality,
So that I can clear a backlog in seconds and process items from anywhere.

**Acceptance Criteria:**

**Given** the Review page with ≥ 2 high-confidence items (confidence ≥ 85%)
**When** the Approve All bar becomes visible
**Then** a sticky bottom bar appears showing: count of eligible items ("9 items ready"), total amount summary, and an "Approve All" primary button
**And** the bar uses `$bg-elevated` background with gold border top

**Given** the Approve All bar
**When** Gal clicks "Approve All"
**Then** a confirmation summary displays first: "Approve 9 items totaling ₪X,XXX?" with Confirm and Cancel (Bit-style explicit confirmation per UX-8)
**And** only items with `aiConfidence ≥ 85` are included — yellow items are always excluded

**Given** Gal browses pending items before batch-approving (FR30)
**When** she scrolls through the green items in the list
**Then** she can review vendor names, amounts, and categories without opening each card
**And** she can open any individual item to inspect before deciding on Approve All

**Given** batch approval is confirmed
**When** the items are processed
**Then** all eligible transactions update to `status: 'approved'` in Firestore
**And** the Approve All button shows a spinner during processing
**And** on completion: a success toast shows "9 items approved"
**And** the pending list updates to show only remaining yellow items (if any)
**And** all Cloud Function side effects (Story 5.4) trigger for each approved item

**Given** the Review page on mobile (< 768px)
**When** a pending item is tapped
**Then** a full-screen Ghost Text Card renders (fills the viewport)
**And** a back arrow is visible at the top with "Review 1 of 3" counter
**And** invoice preview is collapsible (tap to expand/collapse)
**And** Ghost Text fields are stacked vertically, full-width
**And** "Confirm" is a full-width primary button at the bottom
**And** "Edit" and "Reject" are secondary buttons in a row below Confirm

**Given** mobile Ghost Text review
**When** Gal taps Confirm
**Then** the same confirmation flow executes (status update, side effects, toast)
**And** the view transitions to the next pending item (or "All caught up" if none remain)

**Given** mobile with batch-eligible items
**When** the Approve All bar renders
**Then** it appears as a sticky bar above the bottom navigation
**And** touch targets are ≥ 44px
**And** the same confirmation summary appears before executing

---

## Epic 6: Inventory Management & WAC Engine

Gal can manage shared materials, record restocks with cost, consume inventory into Work Orders via Scoop (with automatic WAC cost calculation), track audit history, and log waste — providing accurate COGS in Nutrition Labels.

### Story 6.1: Inventory Data Model & Item Management

As **Gal**,
I want to create and manage an inventory of shared materials with stock levels and costs,
So that I can track what materials I have and what they're worth.

**Acceptance Criteria:**

**Given** `src/types/inventory.ts`
**When** the InventoryItem type and Zod schema are created
**Then** `inventoryItemSchema` validates: `id` (string), `name` (string, required), `sku` (string, optional), `supplier` (string, optional), `currentQty` (number, ≥ 0), `wacAgora` (integer, weighted average cost per unit in agora), `reorderThreshold` (number, optional), `unit` (string, e.g., "sheets", "kg", "units"), `createdAt` (Timestamp), `updatedAt` (Timestamp)
**And** `InventoryItem` TypeScript type is inferred from schema

**Given** `src/stores/useInventoryStore.ts`
**When** the Zustand store is created
**Then** it holds `inventory: InventoryItem[]`, `loading: boolean`, `error: string | null`
**And** selectors: `selectByName(query)`, `selectLowStock` (items where `currentQty ≤ reorderThreshold`)

**Given** `src/features/inventory/hooks/useInventory.ts`
**When** the Firestore real-time hook is created
**Then** it subscribes to the `inventory` collection via `onSnapshot`
**And** data flows through Zod validation into `useInventoryStore`
**And** cleanup on unmount

**Given** the Inventory page (`/inventory`)
**When** inventory items exist
**Then** a table renders with columns: Name, SKU, Supplier, Current Qty, WAC/Unit (formatted via `formatCurrency`), Total Value (qty × WAC, formatted), Reorder Threshold
**And** table uses `$text-sm` body text, sticky header with `$bg-elevated`, sortable columns
**And** rows where `currentQty ≤ reorderThreshold` show a warning indicator (orange left border + "Low Stock" badge)

**Given** the Inventory page
**When** no inventory items exist
**Then** a warm empty state displays: "Add your first material" with a CTA button

**Given** the Inventory page
**When** Gal clicks "Add Material"
**Then** a creation form appears (React Hook Form) with fields: Name (required), SKU, Supplier, Unit (required), Initial Quantity (default 0), Initial Cost per Unit (optional — sets initial WAC), Reorder Threshold
**And** form validates via Zod schema
**And** on submit, a document is created in Firestore `inventory` collection
**And** a success toast confirms creation

**Given** an existing inventory item
**When** Gal clicks Edit
**Then** the form pre-fills with current values (name, SKU, supplier, unit, reorder threshold)
**And** quantity and WAC are NOT directly editable — they change only via restocks and scoops (data integrity)

**Given** the Inventory page on mobile
**When** rendered on a small viewport
**Then** the table adapts: Name + Qty + WAC visible, other columns hidden or available via horizontal scroll
**And** rows are tappable with ≥ 44px height

---

### Story 6.2: Restock & WAC Recalculation

As **Gal**,
I want to record material restocks that automatically recalculate the weighted average cost,
So that COGS calculations always reflect the true blended cost of my inventory.

**Acceptance Criteria:**

**Given** an inventory item detail or a "Restock" action
**When** Gal initiates a restock
**Then** a restock form appears with: Material (pre-selected or searchable), Quantity Added (required, > 0), Total Cost of Restock (required, currency input in agora), and a calculated Unit Cost preview (Total Cost / Quantity)

**Given** a restock form with valid inputs
**When** Gal submits the restock
**Then** WAC is recalculated: `newWAC = (existingQty × oldWAC + restockQty × restockUnitCostAgora) / (existingQty + restockQty)`
**And** the calculation uses integer arithmetic throughout (agora precision, rounding to nearest agora)
**And** the item's `currentQty` increases by the restock quantity
**And** the item's `wacAgora` updates to the new WAC
**And** `updatedAt` timestamp updates

**Given** `src/lib/wac.ts`
**When** the WAC utility is created
**Then** `calculateWAC(existingQty, existingWacAgora, addedQty, addedTotalCostAgora): number` returns new WAC in agora
**And** edge cases are handled: first restock (existingQty = 0), zero cost restock, single unit
**And** co-located tests verify precision against manual calculations (must match within 1 agora)

**Given** a restock is saved
**When** the inventory_log is updated
**Then** a new document is created in `inventory_log` with: `itemId`, `action: 'restock'`, `qtyChange` (positive), `costSnapshotAgora` (restock total cost), `wacBeforeAgora`, `wacAfterAgora`, `timestamp`, `actorUid`

**Given** `functions/src/triggers/verifyWAC.ts`
**When** the `inventory` collection receives a write (onWrite trigger)
**Then** the Cloud Function independently recalculates WAC from the `inventory_log` entries for that item
**And** if the client-side WAC diverges from server calculation by > 1 agora, the server value overwrites
**And** verification is logged

**Given** the WAC recalculation
**When** performed client-side
**Then** the calculation completes in < 500ms (NFR5)
**And** the inventory table and any open Scoop modals reflect the new WAC immediately

---

### Story 6.3: Scoop Action — Consume Inventory into Work Orders

As **Gal**,
I want to consume materials from inventory into a Work Order and see the cost automatically calculated,
So that Nutrition Labels reflect accurate inventory-based COGS for each project.

**Acceptance Criteria:**

**Given** a Work Order detail page or Inventory page
**When** Gal initiates a Scoop action
**Then** a Scoop modal opens with: searchable material selector (fuzzy search by name), Quantity to consume (number input), Available Stock display (current qty — updates as user types), Calculated Cost display (quantity × WAC, formatted via `formatCurrency`, updates in real-time as quantity changes), Work Order selector (searchable dropdown, pre-selected if initiated from a WO detail page)

**Given** the Scoop modal
**When** Gal enters a quantity that exceeds available stock
**Then** the quantity field shows a red error: "Only X available"
**And** the Confirm button is disabled (FR35 — over-draft prevention)
**And** the Available Stock display turns red

**Given** valid Scoop inputs
**When** Gal confirms the Scoop
**Then** the inventory item's `currentQty` decreases by the scoop quantity
**And** the linked Work Order's `inventoryCostAgora` increases by (scoop qty × current WAC)
**And** the Nutrition Label for that Work Order updates in real-time (Inventory Costs line reflects new total)
**And** a success toast confirms: "Scooped X units of [material] → [Work Order name]"

**Given** a Scoop is completed
**When** the inventory_log is updated
**Then** a new document is created with: `itemId`, `action: 'consume'`, `qtyChange` (negative), `costSnapshotAgora` (scoop qty × WAC at time of scoop), `wacAtTimeAgora`, `workOrderRef`, `timestamp`, `actorUid`

**Given** the Scoop calculation
**When** performed client-side
**Then** cost calculation (qty × WAC) completes in < 500ms (NFR5)
**And** the result uses integer arithmetic (agora) with no floating-point drift

**Given** the Scoop modal on mobile
**When** rendered on a small viewport
**Then** the modal is full-screen with stacked fields
**And** the material search is touch-friendly
**And** the Confirm button is full-width at the bottom
**And** all controls are ≥ 44px touch targets

---

### Story 6.4: Audit Log & Waste Tracking

As **Gal**,
I want a complete audit trail of all inventory actions and the ability to log waste,
So that I can trace every material movement and account for losses.

**Acceptance Criteria:**

**Given** the Inventory page or an item detail view
**When** Gal opens the Audit Log
**Then** a chronological list displays all `inventory_log` entries: restock (green + icon), consume/scoop (blue + icon), waste (red + icon)
**And** each entry shows: timestamp, action type, quantity change (+/-), cost snapshot (formatted), WAC at time, linked Work Order (if applicable), actor

**Given** the Audit Log
**When** filtered by a specific inventory item
**Then** only entries for that item display
**And** a running balance shows: starting qty, each change, current qty

**Given** the Audit Log entries
**When** a Scoop entry references a Work Order
**Then** the Work Order name is displayed as a clickable link navigating to `/work-orders/:id`

**Given** the Inventory page
**When** Gal initiates "Log Waste"
**Then** a waste form appears with: Material (searchable), Quantity Lost (required, > 0), Reason (text field: "Damaged", "Expired", "Scrap from cutting", etc.), Work Order (optional — if waste is attributable to a specific project)

**Given** a valid waste submission
**When** Gal confirms
**Then** the inventory item's `currentQty` decreases by the waste quantity
**And** if a Work Order is linked, that Work Order's cost increases by (waste qty × current WAC) — waste is a real cost
**And** if no Work Order is linked, waste is tracked as general overhead loss

**Given** a waste action
**When** the inventory_log is updated
**Then** a new document is created with: `itemId`, `action: 'waste'`, `qtyChange` (negative), `costSnapshotAgora`, `reason`, `workOrderRef` (optional), `timestamp`, `actorUid`
**And** the Nutrition Label updates if a Work Order is linked (FR37)

**Given** the Audit Log
**When** rendered on mobile
**Then** entries show in a compact list: icon + action + qty change + timestamp
**And** tapping an entry expands to show full details (cost, WAC, Work Order link)

---

## Epic 7: Overhead, Tax Intelligence & Forward Projections

Gal can track all overhead expenses by category, view monthly burn rate trends, configure the Tax Jar (flat vs. bracket), receive Osek Patur threshold alerts, and model the cash flow impact of future purchases — completing the full financial intelligence picture.

### Story 7.1: Overhead Data Model & Expense Management

As **Gal**,
I want to track all overhead expenses by category with manual entry and AI auto-classification,
So that I have full visibility into the fixed costs of running the business.

**Acceptance Criteria:**

**Given** `src/types/overhead.ts`
**When** the Overhead type and Zod schema are created
**Then** `overheadSchema` validates: `id` (string), `category` (enum: subscriptions | software | meals | office | general), `amountAgora` (integer, required), `currency` (enum: ILS | USD | EUR, default ILS), `date` (Date, required), `description` (string, optional), `recurrence` (enum: one_time | monthly | yearly, default one_time), `source` (enum: manual | ai), `transactionId` (optional — links to AI-classified transaction if applicable), `isActive` (boolean, for recurring items), `createdAt` (Timestamp), `updatedAt` (Timestamp)
**And** `Overhead` TypeScript type is inferred from schema

**Given** `src/stores/useOverheadStore.ts`
**When** the Zustand store is created
**Then** it holds `overhead: Overhead[]`, `loading: boolean`, `error: string | null`
**And** selectors: `selectByCategory`, `selectCurrentMonth`, `selectRecurring`

**Given** `src/features/overhead/hooks/useOverhead.ts`
**When** the Firestore real-time hook is created
**Then** it subscribes to the `overhead` collection via `onSnapshot`
**And** data flows through Zod validation into `useOverheadStore`

**Given** the Overhead page (`/overhead`)
**When** overhead entries exist
**Then** a category breakdown displays: each category (subscriptions, software, meals, office, general) with total amount for current month
**And** entries are listed below by category with: description, amount (formatted), date, recurrence badge, source badge (manual / AI)
**And** recurring items show a "Monthly" or "Yearly" badge

**Given** the Overhead page
**When** no overhead entries exist
**Then** a warm empty state displays: "No overhead tracked yet" with hint about categories and a CTA to add an entry

**Given** the Overhead page
**When** Gal clicks "Add Overhead"
**Then** a form appears (React Hook Form) with: Category (dropdown, required), Amount (currency input), Date, Description, Recurrence (one-time / monthly / yearly)
**And** form validates via Zod schema
**And** on submit, a document is created in Firestore `overhead` with `source: 'manual'`
**And** success toast confirms

**Given** a transaction approved with `category: 'Overhead'` via the AI pipeline (FR40)
**When** the `onTransactionApproved` Cloud Function processes it
**Then** a corresponding `overhead` document is created with `source: 'ai'` and `transactionId` linking back
**And** the category is derived from the AI classification (developing@ → software, expenses@ → general, or per AI suggestion)

**Given** the Overhead page on mobile
**When** rendered on a small viewport
**Then** categories stack vertically with totals
**And** entry rows are compact with touch-friendly targets

---

### Story 7.2: Monthly Overhead Burn Rate & Trends

As **Gal or Ben**,
I want to see the monthly overhead burn rate with trends and category proportions,
So that I can understand and control the fixed costs of the business.

**Acceptance Criteria:**

**Given** the Overhead page
**When** a "Monthly Burn" summary section renders
**Then** it shows: current month total overhead (formatted, large text), previous month total, and a delta badge (↑/↓ percentage change, green for decrease, red for increase)
**And** monthly total includes: all one-time entries for the current month + all active recurring entries (monthly prorated, yearly divided by 12)

**Given** the Overhead page
**When** a category breakdown section renders
**Then** each category shows: category name, total amount, and a proportional visual indicator (colored segment or mini bar) showing its share of total overhead
**And** categories are sorted by amount (highest first)
**And** each category uses a distinct but harmonious color from the design system

**Given** the Dashboard KPI card for Monthly Overhead (from Epic 3)
**When** overhead data exists
**Then** the KPI card now shows real calculated data instead of placeholder
**And** it displays: current month burn amount + delta badge from previous month
**And** data is pulled from the same `useOverheadStore` / Firestore listener

**Given** overhead burn calculation
**When** recurring items are factored in
**Then** monthly recurrence adds the full amount each month
**And** yearly recurrence adds amount / 12 per month
**And** items with `isActive: false` are excluded from current burn

**Given** the burn rate view on mobile
**When** rendered on small viewport
**Then** monthly total and delta are prominent
**And** category breakdown stacks vertically

---

### Story 7.3: Tax Jar Configuration & Osek Patur Alert

As **Gal**,
I want to configure how the Tax Jar is calculated and be alerted when approaching the Osek Patur threshold,
So that I can set aside the right amount for taxes and plan for regulatory changes.

**Acceptance Criteria:**

**Given** `src/types/config.ts`
**When** the SystemConfig type is created
**Then** it includes: `taxMethod` (enum: flat | bracket), `flatRate` (number, default 0.35), `osPaturThreshold` (integer, default 12000000 agora = ₪120,000), `osPaturAlertPercent` (number, default 0.80), `currencyRates` (object: { USD: number, EUR: number }), `currencyRatesUpdatedAt` (Timestamp)

**Given** the Firestore `system_config` collection
**When** accessed
**Then** a single document `'global'` holds all configuration
**And** it is readable by authenticated users and writable by admin UIDs

**Given** a settings section (accessible from Overhead page or a Phosphor GearSix icon)
**When** Gal opens Tax Jar configuration
**Then** she sees: current method (flat / bracket) with toggle, flat rate input (default 35%, editable), and a preview showing "Current Tax Jar: ₪X,XXX" based on the selected method

**Given** the flat tax method is selected
**When** Tax Jar is calculated
**Then** Tax Jar = Net Profit (current period) × flat rate
**And** the calculation uses `calculateTaxReserve` from `src/lib/taxJar.ts` (created in Epic 3)

**Given** the bracket tax method is selected
**When** Tax Jar is calculated
**Then** Israeli 2026 progressive brackets are applied: 10% (up to ₪84,120), 14% (₪84,121–₪120,720), 20% (₪120,721–₪193,800), 31% (₪193,801–₪269,280), 35% (₪269,281–₪560,280), 47% (₪560,281–₪721,560), 50% (above ₪721,560)
**And** annual income is projected from year-to-date net profit
**And** the bracket breakdown is shown to Gal for transparency

**Given** Gal changes the tax method or rate
**When** she saves the configuration
**Then** the `system_config` document updates in Firestore
**And** the Dashboard Tax Jar KPI recalculates immediately (real-time listener)
**And** a success toast confirms: "Tax Jar settings updated"

**Given** annual revenue tracking
**When** total approved Revenue transactions for the current calendar year approach 80% of ₪120,000 (FR8)
**Then** a persistent warning banner appears on the Dashboard: "Annual revenue at X% of Osek Patur threshold (₪120,000). Consider consulting your accountant about transitioning to Osek Murshe."
**And** the warning uses `$warning` amber styling — informative, not alarming (per emotional design principles)
**And** the banner is dismissible but reappears on next login if still above threshold

**Given** annual revenue is below 80% of threshold
**When** the Dashboard loads
**Then** no Osek Patur warning is shown

---

### Story 7.4: Forward Financial Projection

As **Gal**,
I want to model the cash flow impact of a potential purchase,
So that I can answer "can we afford this?" with data instead of gut feeling.

**Acceptance Criteria:**

**Given** a Forward Projection view (accessible from Dashboard or a dedicated route)
**When** Gal opens it
**Then** she sees the current financial snapshot: Net Profit (current month), Tax Jar reserve (set aside), Monthly Overhead (current burn rate), Available Buffer (Net Profit - Tax Jar - Overhead), and Expected Incoming Revenue (from Work Orders in Production/Shipped status with unrealized revenue)

**Given** the projection input
**When** Gal enters a proposed purchase amount (e.g., ₪2,800)
**Then** the system models the impact: Available Buffer after purchase, whether next month's overhead is covered, whether Tax Jar remains funded, and the number of months until the purchase is "absorbed" by incoming revenue

**Given** the projection result
**When** the buffer after purchase is healthy (covers ≥ 2 months overhead + Tax Jar)
**Then** the result shows a green assessment: "You have headroom. Overhead and Tax Jar are covered."
**And** the recommendation is positive

**Given** the projection result
**When** the buffer after purchase is tight (covers < 2 months but > 0)
**Then** the result shows a yellow assessment: "Tight — next month's overhead is covered, but limited buffer."
**And** the recommendation is cautious

**Given** the projection result
**When** the buffer after purchase would be negative
**Then** the result shows a red assessment: "This purchase would exceed your available buffer."
**And** specific numbers show: shortfall amount, when revenue would recover the position

**Given** the projection view
**When** modeling a purchase
**Then** the projection factors in: current cash position, Tax Jar reserve (locked), monthly overhead burn (projected forward), and expected revenue from Work Orders with `status: 'Production'` or `status: 'Shipped'` (upcoming invoices)
**And** if the purchase is for inventory (bulk buy), the note explains: "Investment consumed across future projects via Scoops — one-time hit, not recurring"

**Given** the projection view on mobile
**When** rendered on small viewport
**Then** the input and results stack vertically
**And** the financial snapshot is scannable
**And** the assessment (green/yellow/red) is prominently displayed with icon + text (never color alone)
