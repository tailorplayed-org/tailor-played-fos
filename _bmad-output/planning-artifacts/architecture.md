---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
lastStep: 8
status: 'complete'
completedAt: '2026-02-06'
inputDocuments:
  - planning-artifacts/prd.md
  - planning-artifacts/prd-validation-report.md
  - planning-artifacts/product-brief-TP-FOS-2026-02-05.md
  - planning-artifacts/ux-design-specification.md
  - user-data/tp-mails.md
  - user-data/user-prd.md
  - user-data/user-summarize.md
  - user-data/design-system.md
workflowType: 'architecture'
project_name: 'TP-FOS'
user_name: 'Galelbaz'
date: '2026-02-06'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements (50 FRs across 8 modules):**

| Module | FRs | Architectural Significance |
|---|---|---|
| **Dashboard & Financial Intelligence** | FR1–FR9 | Real-time aggregation layer. KPIs, Tax Jar, forward projection, Osek Patur threshold alert. Requires computed views over multiple collections. |
| **Work Order Management** | FR10–FR15 | Central entity linking revenue to costs. Nutrition Label = real-time derived calculation (Revenue - Direct - Inventory - Overhead - Buffer). Status lifecycle (Lead → Design → Production → Shipped). |
| **Document Ingestion & AI Processing** | FR16–FR22 | Event-driven pipeline: Gmail API + Pub/Sub → Cloud Functions → Gemini 2.5 Pro → structured JSON → Firestore. Bilingual (Hebrew + English), multi-format (PDF, JPG, PNG, HTML), multi-currency. Highest-risk subsystem. |
| **Transaction Review & Approval** | FR23–FR31, FR50 | Ghost Text UI: AI pre-filled fields with confidence scoring. Single-item confirm + batch "Approve All" (≥ 85%). Manual transaction creation fallback (FR50). Triggers downstream recalculations within 2s. |
| **Inventory Management** | FR32–FR37 | Weighted Average Cost (WAC) engine. Scoop action consumes materials into Work Orders. Over-draft prevention. Full audit log with cost snapshots. |
| **Overhead & Expense Tracking** | FR38–FR41 | Category-based overhead (subscriptions, software, meals, office). Manual + AI-classified entries. Monthly burn rate tracking. |
| **Accountant Integration** | FR42–FR44 | Parallel Fork: Gmail filters forward originals to Paperless independently. FOS is a parallel consumer, never a gatekeeper. Zero direct integration with Paperless. |
| **System & User Management** | FR45–FR49 | Google Auth, 2 whitelisted UIDs. Full i18n (Hebrew RTL / English LTR). Multi-currency display (ILS base, USD/EUR with conversion flagging). Full mobile parity. |

**Non-Functional Requirements:**

| Category | Key Targets | Architectural Impact |
|---|---|---|
| **Performance** | Dashboard < 3s, post-action refresh < 2s, Ghost Text < 1s, AI processing < 30s, Scoop calc < 500ms | Real-time Firestore listeners for < 2s updates. Cloud Functions cold start management for AI processing. Client-side calculation for Scoop WAC. |
| **Security** | 2 whitelisted UIDs, server-side API keys, UID-restricted Firestore/Storage rules | Simple but strict — no complex RBAC. All sensitive operations in Cloud Functions. |
| **Data Integrity** | Integer currency (agora/cents), zero document loss, audit trails, referential integrity | Integer arithmetic throughout. Failed AI parses preserved as "unprocessed." Every mutation logged with before/after snapshots. |
| **Integration Reliability** | Gmail API retry on Pub/Sub, Gemini fallback to manual, Paperless independent, stale currency rate fallback | Each integration point has a defined degradation path. No single point of failure blocks the pipeline. |

**Scale & Complexity:**

- **Primary domain:** Full-stack web (React SPA + Firebase serverless)
- **Complexity level:** Medium — integration pipeline is complex, CRUD layer is straightforward
- **Estimated architectural components:** ~12 (React SPA shell, routing, state management, Firestore data layer, Cloud Functions ingestion pipeline, Gemini AI service, Gmail API integration, WAC calculation engine, i18n system, SCSS design system, auth layer, real-time subscription manager)
- **Data model collections:** ~6–8 (transactions, work_orders, inventory, inventory_log, overhead, system_config, email_log)
- **Cloud Functions:** ~4–6 (email ingestion trigger, AI processing, transaction approval side-effects, WAC recalculation, scheduled cleanup/retry)

### Technical Constraints & Dependencies

| Constraint | Source | Impact |
|---|---|---|
| **React SPA** (no SSR/Next.js) | PRD architecture decision | Simpler deployment (static hosting), no server-side rendering complexity. Client-side routing only. |
| **Firebase ecosystem** | PRD + user preference (existing account) | Firestore (NoSQL) shapes data modeling — denormalization preferred over joins. Cloud Functions for all server-side logic. Firebase Auth for identity. Firebase Storage for document files. Firebase Hosting for SPA. |
| **Gemini 2.5 Pro** | PRD AI choice | 1M token context window. Structured JSON output via function calling. Server-side only (Cloud Functions) to protect API keys. Bilingual Hebrew+English processing capability. |
| **Gmail API + Pub/Sub** | PRD integration architecture | Push-based email notification. Designated mailboxes (orders@, supplies@, developing@, expenses@). Requires Google Cloud project configuration with Pub/Sub topics. |
| **TailorPlayed Design System** | UX spec + design-system.md | SCSS Modules implementation. Custom components built from spec — no third-party UI library. Fredoka font, deep purple/gold palette, specific token system. |
| **2 users only** | PRD scope | No multi-tenancy. Hardcoded UID whitelist in Firestore rules. No role-based access control needed. |
| **Bilingual (Hebrew + English)** | PRD i18n requirement | RTL/LTR switching, CSS logical properties, bidirectional text handling, Hebrew-native Fredoka font subset. |
| **Multi-currency (ILS/USD/EUR)** | PRD domain requirement | ILS base currency. Non-ILS flagged as "Estimated." Integer storage (agora/cents). Conversion rate documentation. |

### Cross-Cutting Concerns Identified

| Concern | Affected Components | Architectural Approach Needed |
|---|---|---|
| **Bilingual/RTL** | Every UI component, layout system, text rendering, form inputs | Global direction toggle via CSS custom properties + logical properties. i18n string management. |
| **Real-time data sync** | Dashboard, Nutrition Labels, KPIs, Tax Jar, pending count | Firestore `onSnapshot` listeners with efficient subscription management to avoid listener leaks. |
| **Integer currency arithmetic** | All financial calculations, WAC engine, Tax Jar, margin percentages | Utility layer for currency math — store as integers, display with formatting. Rounding strategy for WAC. |
| **Audit trail** | Transactions, inventory actions, Work Order changes | Consistent logging pattern across all mutations — timestamp, actor, before/after, source reference. |
| **AI confidence scoring** | Transaction review, Ghost Text display, batch approval threshold | Confidence as a first-class data field that drives UI state (green/yellow), batch eligibility (≥ 85%), and user trust signaling. |
| **Error resilience / graceful degradation** | Email pipeline, AI processing, currency API | Every external dependency has a defined fallback: queue, manual entry, stale rate. No silent failures. |

## Starter Template Evaluation

### Primary Technology Domain

Full-stack web application (React SPA + Firebase serverless backend) based on project requirements analysis.

### Starter Options Considered

| Option | Verdict | Reason |
|---|---|---|
| **Vite + react-ts** | **Selected** | Official, minimal, zero-opinion on styling/routing/state. Perfect blank canvas for the TailorPlayed design system. |
| Create React App | Rejected | Effectively deprecated. Vite is the standard. |
| Next.js | Rejected | PRD explicitly excludes SSR. Unnecessary complexity. |
| T3 Stack | Rejected | Opinionated full-stack (tRPC, Tailwind, Prisma). Wrong backend, wrong styling. |
| Community starters with Tailwind/MUI | Rejected | Every one brings a styling opinion that conflicts with the existing TailorPlayed SCSS design system. |

### Selected Starter: Vite + React TypeScript (Official)

**Rationale for Selection:**
The official Vite React TypeScript template provides the minimal, unopinionated foundation needed. TP-FOS has a fully specified custom design system (TailorPlayed SCSS) that would conflict with any opinionated starter. Vite's native SCSS support means zero configuration overhead for the styling architecture.

**Initialization Command:**

```bash
npm create vite@latest tp-fos -- --template react-ts
cd tp-fos
npm install
```

**Architectural Decisions Provided by Starter:**

**Language & Runtime:**
TypeScript strict mode. ESM modules. Vite handles transpilation via esbuild (dev) and Rollup (build).

**Styling Solution:**
SCSS Modules with CSS Custom Properties. Files named `*.module.scss`. Vite resolves natively — just install the `sass` package. `vite-plugin-sass-dts` generates TypeScript definitions for type-safe class name access. Global SCSS partials (`_variables.scss`, `_mixins.scss`) imported via `additionalData` in Vite config.

**Build Tooling:**
Vite 7.3.x (stable). Dev server with HMR. Production build via Rollup with tree-shaking. Deploy to Firebase Hosting as static SPA.

**Testing Framework:**
Vitest (Vite-native, drop-in Jest replacement) + React Testing Library. Same config, no separate setup.

**Key Dependencies (verified Feb 6, 2026):**

| Package | Version | Role |
|---|---|---|
| Vite | 7.3.x | Build tool, dev server, SCSS support |
| React | 19.x | UI framework |
| TypeScript | 5.x | Type safety |
| React Router | 7.13.x | SPA routing (declarative mode) |
| Firebase JS SDK | 12.9.0 | Firestore, Auth, Functions, Storage (modular tree-shakeable API) |
| Zustand | latest | Client-side state management |
| sass | latest | SCSS compilation (Vite native support) |
| vite-plugin-sass-dts | latest | TypeScript definitions for SCSS Modules |
| @phosphor-icons/react | latest | Icon library — sole icon source, no emojis |
| react-i18next + i18next | latest | i18n framework for Hebrew/English |

**State Management Decision:**
Zustand over React Context. Rationale: (1) no provider wrapper needed, (2) no unnecessary re-renders when unrelated state changes, (3) DevTools for debugging financial calculations, (4) ~1KB gzipped. Context reserved for truly static concerns (i18n direction, auth user).

**Code Organization:**

```
src/
  components/        # Shared UI components (Button, Card, Badge, etc.)
  features/          # Feature modules (dashboard, work-orders, inventory, etc.)
  hooks/             # Custom React hooks (useFirestore, useAuth, etc.)
  lib/               # Utilities (currency math, date formatting, WAC engine)
  services/          # Firebase service layer (firestore, auth, storage)
  stores/            # Zustand stores (transactions, workOrders, inventory, ui)
  styles/            # Global SCSS (_variables, _mixins, _animations, global)
  i18n/              # Translation files (he.json, en.json)
  types/             # Shared TypeScript interfaces
  App.tsx
  main.tsx
```

**Note:** Project initialization using this command should be the first implementation story.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- Data modeling: Flat Firestore collections with references
- Data validation: Zod schemas shared client + functions
- Currency: Integer arithmetic (agora/cents) with custom utility module
- Auth: Firebase Auth + Google Sign-in, 2 whitelisted UIDs
- Hosting: Vercel (frontend) + Firebase (backend services)

**Important Decisions (Shape Architecture):**
- State management: Zustand + Context for static concerns
- Cloud Functions design: Pub/Sub + Firestore triggers + HTTPS Callable
- Real-time subscriptions: Custom hooks per collection with lifecycle management
- Component architecture: Feature-based with shared design system library
- WAC calculation: Client-side with server-side verification

**Deferred Decisions (Post-MVP):**
- Advanced caching strategies (evaluate after real usage patterns emerge)
- Performance monitoring tooling (Firebase Performance or custom)
- Automated alerting (Osek Patur threshold email alerts)

### Data Architecture

| Decision | Choice | Rationale |
|---|---|---|
| **Data Modeling** | Flat collections with ID references | Dashboard needs cross-entity aggregations. Subcollections complicate global queries. Transactions reference `workOrderId`, Scoops reference `inventoryItemId` + `workOrderId`. |
| **Data Validation** | Zod schemas (shared client + Cloud Functions) | Define shape once, validate both sides. Zod provides TypeScript type inference for free. Firestore Security Rules as backstop. |
| **Currency Storage** | Integer (agora/cents) | Prevents floating-point drift in financial calculations. Custom utility module: `toMinorUnits()`, `toDisplayAmount()`, `formatCurrency()`. No external library needed for 3 currencies. |
| **WAC Calculation** | Client-side with server verification | Client calculates instantly (< 500ms NFR). Cloud Function `onWrite` trigger verifies and corrects if needed. 2-user system makes race conditions negligible. |
| **Audit Trail** | Consistent logging on all mutations | Timestamp, actor UID, before/after snapshot, source reference. Applied to transactions, inventory actions, Work Order changes. |

**Firestore Collections:**

| Collection | Purpose | Key Fields |
|---|---|---|
| `transactions` | Financial documents (AI-classified + manual) | vendorName, amount (integer), currency, category, workOrderId, status, aiConfidence, originalFileUrl |
| `work_orders` | Client projects linking revenue to costs | clientName, status, revenueTotalAgora, directCostAgora, inventoryCostAgora, overheadAllocationAgora |
| `inventory` | Material stock with WAC tracking | name, sku, supplier, currentQty, wacAgora, reorderThreshold |
| `inventory_log` | Audit trail for all inventory actions | itemId, action (restock/consume/waste), qtyChange, costSnapshotAgora, workOrderRef |
| `overhead` | Recurring and one-time overhead expenses | category, amountAgora, date, recurrence, source (manual/ai) |
| `email_log` | Every email entering the system | messageId, mailbox, receivedAt, status (processed/unprocessed/failed), transactionId |
| `system_config` | App configuration (tax rate, thresholds) | taxMethod, flatRate, currencyRates, osPaturThreshold |

### Authentication & Security

| Decision | Choice | Rationale |
|---|---|---|
| **Auth Provider** | Firebase Auth + Google Sign-in | PRD requirement. Same Google account used across TailorPlayed ecosystem. |
| **Authorization** | Single `isAdmin()` function in Firestore rules | 2 whitelisted UIDs. Global gate on all collections. No per-collection complexity. |
| **API Key Protection** | Cloud Functions environment config | Gemini API key, Gmail credentials — never client-side. Vite `import.meta.env` for Firebase client config only. |
| **Storage Rules** | UID-restricted, matching Firestore rules | Same `isAdmin()` pattern. Only whitelisted users can read/write document files. |
| **Cloud Functions Auth** | Pub/Sub = internal GCP (no auth). Callable = verify `context.auth.uid` | System-triggered functions need no user auth. Client-triggered functions verify UID against whitelist. |

### API & Communication Patterns

| Decision | Choice | Rationale |
|---|---|---|
| **Client ↔ Database** | Direct Firestore SDK (reads + writes) | No API layer needed. Firestore Security Rules protect data. Real-time listeners for live updates. |
| **Server Processing** | Cloud Functions (3 trigger types) | Pub/Sub for email ingestion, Firestore `onWrite` for side-effects, HTTPS Callable for admin actions. |
| **Error Handling** | Structured: Client (Error Boundaries + Toasts) / Server (Cloud Logging + status tracking) | Failed AI parses → `status: 'unprocessed'` preserved with error. Client shows toast with retry. |
| **Real-time Subscriptions** | Custom React hooks with Firestore `onSnapshot` | Per-collection hooks manage listener lifecycle. Dashboard listeners persist; detail-view listeners activate on navigation. Cleanup on unmount. |

**Cloud Functions Inventory:**

| Function | Trigger | Purpose |
|---|---|---|
| `onEmailReceived` | Pub/Sub (Gmail push) | Detect new email, download attachments, store in Firebase Storage, queue for AI processing |
| `processDocument` | Firestore `onCreate` on email_log | Send document to Gemini 2.5 Pro, parse response, create transaction with `status: 'pending_review'` |
| `onTransactionApproved` | Firestore `onUpdate` on transactions | Update Work Order totals, recalculate Nutrition Label, log audit trail |
| `verifyWAC` | Firestore `onWrite` on inventory | Recalculate WAC as authoritative check after client-side Scoop |
| `retryFailedProcessing` | Scheduled (Cloud Scheduler) | Find `status: 'unprocessed'` documents older than 1 hour, retry AI processing |

### Frontend Architecture

| Decision | Choice | Rationale |
|---|---|---|
| **Component Architecture** | Feature-based + shared design system | `src/components/` for design system atoms. `src/features/` for self-contained feature modules (dashboard, work-orders, inventory, overhead, review). |
| **State Management** | Zustand (client state) + Context (static concerns) | Zustand for transactions, workOrders, inventory, UI state. Context for auth user and i18n direction only. |
| **Form Handling** | React Hook Form (complex forms) + Custom (Ghost Text) | RHF for Work Order creation, manual transactions, inventory entry. Custom controlled components for Ghost Text confirm/edit/reject flow. |
| **Routing** | React Router v7 (declarative mode) | SPA routes: `/` (dashboard), `/work-orders`, `/work-orders/:id`, `/inventory`, `/overhead`, `/review`. |
| **i18n** | react-i18next + CSS logical properties | Translation files (he.json, en.json). `dir` attribute toggle. CSS logical properties throughout. |
| **Design System** | TailorPlayed SCSS Modules (custom build) | `_variables.scss`, `_mixins.scss`, `_animations.scss` as foundation. Component-scoped `.module.scss` files. `vite-plugin-sass-dts` for type safety. |

### Infrastructure & Deployment

| Decision | Choice | Rationale |
|---|---|---|
| **Frontend Hosting** | Vercel (new project: `tp-fos`) | Consistent with existing TailorPlayed infrastructure. Same dashboard, same workflow, same DNS pattern. Git push → auto-deploy. |
| **Backend Services** | Separate Firebase project (`tp-fos`) | Clean isolation from main TailorPlayed Firebase project. Independent Firestore, Auth, Storage, Cloud Functions. No risk to live site. |
| **Domain** | `fos.tailorplayed.com` (subdomain) | CNAME in Porkbun → Vercel. Same family, zero coupling. Admin panel links directly. |
| **CI/CD** | Vercel auto-deploy (frontend) + GitHub Actions (Cloud Functions) | Frontend deploys on git push to main. Cloud Functions deploy via `firebase deploy --only functions` triggered by GitHub Action on changes to `/functions` directory. |
| **Environment Config** | Vite `.env` (client) + Firebase Functions config (server) | Client: Firebase project config via `import.meta.env`. Server: Gemini API key, Gmail OAuth credentials via `firebase functions:config:set`. |
| **Local Development** | Firebase Emulator Suite | Local Firestore, Auth, Functions, Storage emulators. No cost, no risk to production data. |
| **Firebase Project Structure** | Single project, emulators for dev | One Firebase project (`tp-fos`). Emulator Suite for local development. Production data protected by Auth rules. |

### Decision Impact Analysis

**Implementation Sequence:**
1. Firebase project setup + Vite scaffold + Vercel deployment
2. SCSS design system tokens + global styles
3. Firebase Auth + Firestore security rules
4. Zustand stores + Firestore hooks (real-time subscriptions)
5. Core UI components (design system atoms)
6. Feature modules (dashboard → work orders → review → inventory → overhead)
7. Cloud Functions (email ingestion → AI processing → side-effects)
8. i18n + RTL polish
9. Mobile responsive refinement

**Cross-Component Dependencies:**
- Zod schemas are shared between `src/types/`, Zustand stores, and Cloud Functions — changes ripple across
- SCSS variables/mixins are imported by every component — token changes are global
- Firestore collection structure affects security rules, Cloud Functions triggers, and client hooks simultaneously
- i18n direction toggle affects every layout component via CSS logical properties

## Implementation Patterns & Consistency Rules

### Naming Patterns

**Firestore Collections & Fields:**

| Element | Convention | Example |
|---|---|---|
| Collection names | `snake_case`, plural | `work_orders`, `inventory_log`, `email_log` |
| Document fields | `camelCase` | `vendorName`, `workOrderId`, `aiConfidence` |
| Integer currency fields | Suffix with `Agora` | `amountAgora`, `revenueTotalAgora`, `wacAgora` |
| Timestamp fields | Suffix with `At` | `createdAt`, `updatedAt`, `receivedAt`, `approvedAt` |
| Boolean fields | Prefix with `is` or `has` | `isConfirmed`, `hasAttachment`, `isRecurring` |
| Reference fields | Suffix with `Id` or `Ref` | `workOrderId`, `inventoryItemId`, `sourceEmailRef` |

**Code Naming:**

| Element | Convention | Example |
|---|---|---|
| React components | PascalCase | `GhostTextField`, `KpiCard`, `NutritionLabel` |
| Component files | PascalCase `.tsx` | `GhostTextField.tsx`, `KpiCard.tsx` |
| SCSS module files | PascalCase `.module.scss` | `GhostTextField.module.scss`, `KpiCard.module.scss` |
| SCSS class names | camelCase (in module) | `.ghostField`, `.kpiValue`, `.marginBar` |
| Hooks | `use` prefix, camelCase | `useWorkOrders()`, `useTransactions()`, `useAuth()` |
| Zustand stores | `use` prefix + `Store` suffix | `useTransactionStore`, `useWorkOrderStore` |
| Utility functions | camelCase | `toMinorUnits()`, `formatCurrency()`, `calculateWAC()` |
| Constants | UPPER_SNAKE_CASE | `TAX_FLAT_RATE`, `CONFIDENCE_THRESHOLD`, `MAX_BATCH_SIZE` |
| Types/Interfaces | PascalCase, no `I` prefix | `Transaction`, `WorkOrder`, `InventoryItem` |
| Zod schemas | camelCase + `Schema` suffix | `transactionSchema`, `workOrderSchema` |
| Cloud Functions | camelCase, verb-first | `onEmailReceived`, `processDocument`, `verifyWAC` |
| i18n keys | dot-notation, nested | `dashboard.kpi.netProfit`, `review.ghostText.confirm` |

**Route Naming:**

| Route | Path | Component |
|---|---|---|
| Dashboard | `/` | `DashboardPage` |
| Work Orders list | `/work-orders` | `WorkOrdersPage` |
| Work Order detail | `/work-orders/:id` | `WorkOrderDetailPage` |
| Inventory | `/inventory` | `InventoryPage` |
| Overhead | `/overhead` | `OverheadPage` |
| Review queue | `/review` | `ReviewPage` |

### Structure Patterns

**Feature Module Structure:**

```
src/features/work-orders/
  components/           # Feature-specific components
    WorkOrderCard.tsx
    WorkOrderCard.module.scss
    NutritionLabel.tsx
    NutritionLabel.module.scss
  hooks/                # Feature-specific hooks
    useWorkOrderDetail.ts
  WorkOrdersPage.tsx    # Route-level page component
  WorkOrderDetailPage.tsx
  index.ts              # Public exports (barrel file)
```

**Shared Component Structure:**

```
src/components/Button/
  Button.tsx
  Button.module.scss
  Button.test.tsx       # Co-located test
  index.ts              # Re-export
```

**Tests:** Co-located with the component (`*.test.tsx` next to `*.tsx`). No separate `__tests__` folder.

**Barrel exports:** Every directory with multiple exports has an `index.ts`. Import from the directory, not individual files.

```typescript
// Good
import { Button, Card, Badge } from '@/components';
// Bad
import { Button } from '@/components/Button/Button';
```

**Path aliases:** `@/` maps to `src/`. Configured in `tsconfig.json` and `vite.config.ts`.

### Data Flow Patterns

**Firestore → Client Data Flow:**

```
Firestore document → Zod schema parse → TypeScript type → Zustand store → React component
```

1. Firestore listener receives raw document
2. Zod schema validates and transforms (e.g., Firestore `Timestamp` → JS `Date`)
3. Typed data enters Zustand store
4. Components read from store via selectors

Never access Firestore directly from components. Always go through hooks that manage subscriptions.

**Currency Display Flow:**

```
Firestore (integer agora) → formatCurrency(amountAgora, currency) → "₪82.00" or "$142.50"
```

All math happens in agora/cents. Formatting to display happens at the component level, never in stores or services.

### State Management Patterns

**Zustand Store Pattern:**

```typescript
interface WorkOrderStore {
  // Data
  workOrders: WorkOrder[];
  loading: boolean;
  error: string | null;
  
  // Actions
  setWorkOrders: (orders: WorkOrder[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

// Selectors defined outside the store
const selectActiveProjects = (state: WorkOrderStore) => 
  state.workOrders.filter(wo => wo.status === 'production');
```

**Rules:**
- One store per domain: `useTransactionStore`, `useWorkOrderStore`, `useInventoryStore`, `useUIStore`
- Store holds data + loading + error. Derived values are selectors, not stored state.
- Actions are synchronous setters. Async operations happen in hooks, which call store actions.
- No business logic in stores. Stores are data containers. Logic lives in hooks and utilities.

### Error Handling Patterns

**Client-side errors — three tiers:**

| Tier | Handling | Example |
|---|---|---|
| **Component crash** | React Error Boundary → fallback UI | Unexpected render error |
| **Operation failure** | Toast notification with retry action | "Failed to save — Retry" |
| **Validation error** | Inline field error (red border + text) | "Amount must be positive" |

**Cloud Functions errors:**

```typescript
throw new functions.https.HttpsError('not-found', 'Work order not found', {
  workOrderId: id,
  code: 'WORK_ORDER_NOT_FOUND'
});
```

**Toast format:** `{ type: 'success' | 'error' | 'warning' | 'info', message: string, action?: { label: string, onClick: () => void } }`

### Loading State Patterns

| Context | Pattern | Visual |
|---|---|---|
| **Initial page load** | Skeleton screens (shimmer) | Gold-dim opacity pulse matching design system |
| **Data refresh after action** | Shimmer overlay on component | Nutrition Label shimmer after transaction confirm |
| **Button action** | Loading spinner inside button + disabled | Confirm button shows spinner |
| **Background processing** | No UI blocking, toast on completion | AI processing happens silently, toast when done |

**Loading state naming in stores:** `loading: boolean` (not `isLoading`, not `status`).

### Date & Time Patterns

| Context | Format | Example |
|---|---|---|
| **Firestore storage** | Firestore `Timestamp` | `Timestamp.now()` |
| **Client-side** | JS `Date` object (parsed from Timestamp by Zod) | `new Date()` |
| **Display (Hebrew/English)** | DD/MM/YYYY (Israeli convention) | 06/02/2026 |
| **Relative time** | "Today", "Yesterday", "3 days ago" | For pending review items |

### Enforcement Guidelines

**All AI Agents MUST:**
1. Run `tsc --noEmit` before considering a task complete — zero TypeScript errors
2. Validate all Firestore data through Zod schemas — no raw document access
3. Use currency utility functions — never raw arithmetic on agora values
4. Use CSS logical properties — never `left`/`right`/`text-align: left`
5. Add `*.test.tsx` for every new component — co-located, not in `__tests__`
6. Import via `@/` aliases and barrel exports — no relative path depth > 2
7. Follow the naming conventions above exactly — including the `Agora` suffix for currency fields

## Project Structure & Boundaries

### Complete Project Directory Structure

```
tp-fos/
├── README.md
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── vitest.config.ts
├── .env.local                      # Firebase client config (VITE_FIREBASE_*)
├── .env.example                    # Template for env vars
├── .gitignore
├── .eslintrc.cjs
├── .prettierrc
├── firebase.json                   # Firebase project config (hosting, functions, emulators)
├── firestore.rules                 # Firestore security rules
├── storage.rules                   # Storage security rules
├── .firebaserc                     # Firebase project alias
├── .github/
│   └── workflows/
│       ├── ci.yml                  # Lint + test on PR
│       └── deploy-functions.yml    # Firebase Functions deploy on /functions changes
│
├── functions/                      # Cloud Functions (separate package)
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── index.ts                # Function exports entry point
│   │   ├── email/
│   │   │   ├── onEmailReceived.ts  # Pub/Sub trigger: Gmail push notification
│   │   │   └── gmailClient.ts     # Gmail API wrapper
│   │   ├── ai/
│   │   │   ├── processDocument.ts  # Firestore onCreate: AI classification
│   │   │   └── geminiClient.ts     # Gemini 2.5 Pro wrapper
│   │   ├── triggers/
│   │   │   ├── onTransactionApproved.ts  # Firestore onUpdate: recalculate totals
│   │   │   └── verifyWAC.ts              # Firestore onWrite: WAC verification
│   │   ├── scheduled/
│   │   │   └── retryFailedProcessing.ts  # Cloud Scheduler: retry unprocessed
│   │   ├── shared/
│   │   │   ├── schemas.ts          # Zod schemas (shared with client via copy)
│   │   │   ├── currency.ts         # Currency utilities (shared logic)
│   │   │   └── types.ts            # Shared TypeScript types
│   │   └── config.ts               # Environment config access
│   └── tests/
│       ├── email.test.ts
│       ├── ai.test.ts
│       └── triggers.test.ts
│
├── public/
│   ├── favicon.ico
│   └── fonts/
│       └── Fredoka-Variable.woff2  # Self-hosted Fredoka (Latin + Hebrew)
│
└── src/
    ├── main.tsx                    # App entry point
    ├── App.tsx                     # Root component (Router + Providers)
    ├── router.tsx                  # Route definitions
    ├── vite-env.d.ts               # Vite type declarations
    │
    ├── components/                 # Shared design system components
    │   ├── Button/
    │   │   ├── Button.tsx
    │   │   ├── Button.module.scss
    │   │   ├── Button.test.tsx
    │   │   └── index.ts
    │   ├── Card/
    │   │   ├── Card.tsx
    │   │   ├── Card.module.scss
    │   │   ├── Card.test.tsx
    │   │   └── index.ts
    │   ├── Badge/
    │   │   ├── Badge.tsx
    │   │   ├── StatusBadge.tsx
    │   │   ├── ConfidenceBadge.tsx
    │   │   ├── Badge.module.scss
    │   │   └── index.ts
    │   ├── Input/
    │   │   ├── Input.tsx
    │   │   ├── Select.tsx
    │   │   ├── SearchInput.tsx
    │   │   ├── Input.module.scss
    │   │   └── index.ts
    │   ├── Table/
    │   │   ├── Table.tsx
    │   │   ├── SortableHeader.tsx
    │   │   ├── Table.module.scss
    │   │   └── index.ts
    │   ├── Toast/
    │   │   ├── Toast.tsx
    │   │   ├── ToastContainer.tsx
    │   │   ├── Toast.module.scss
    │   │   └── index.ts
    │   ├── Skeleton/
    │   │   ├── Skeleton.tsx
    │   │   ├── Skeleton.module.scss
    │   │   └── index.ts
    │   ├── Layout/
    │   │   ├── TopNav.tsx
    │   │   ├── BottomNav.tsx          # Mobile only
    │   │   ├── PageShell.tsx
    │   │   ├── Layout.module.scss
    │   │   └── index.ts
    │   ├── ErrorBoundary/
    │   │   ├── ErrorBoundary.tsx
    │   │   └── index.ts
    │   └── index.ts                    # Barrel export for all components
    │
    ├── features/                       # Feature modules
    │   ├── dashboard/
    │   │   ├── components/
    │   │   │   ├── HeroStat.tsx
    │   │   │   ├── HeroStat.module.scss
    │   │   │   ├── KpiCard.tsx
    │   │   │   ├── KpiCard.module.scss
    │   │   │   ├── ProjectRow.tsx
    │   │   │   ├── ProjectRow.module.scss
    │   │   │   ├── ProjectList.tsx
    │   │   │   └── PendingBadge.tsx
    │   │   ├── hooks/
    │   │   │   └── useDashboardData.ts
    │   │   ├── DashboardPage.tsx
    │   │   └── index.ts
    │   │
    │   ├── work-orders/
    │   │   ├── components/
    │   │   │   ├── WorkOrderCard.tsx
    │   │   │   ├── WorkOrderCard.module.scss
    │   │   │   ├── WorkOrderForm.tsx
    │   │   │   ├── NutritionLabel.tsx
    │   │   │   ├── NutritionLabel.module.scss
    │   │   │   ├── StatusStepper.tsx
    │   │   │   └── ScoopModal.tsx
    │   │   ├── hooks/
    │   │   │   ├── useWorkOrders.ts
    │   │   │   └── useWorkOrderDetail.ts
    │   │   ├── WorkOrdersPage.tsx
    │   │   ├── WorkOrderDetailPage.tsx
    │   │   └── index.ts
    │   │
    │   ├── review/
    │   │   ├── components/
    │   │   │   ├── GhostTextCard.tsx
    │   │   │   ├── GhostTextCard.module.scss
    │   │   │   ├── GhostTextField.tsx
    │   │   │   ├── GhostTextField.module.scss
    │   │   │   ├── ConfidenceBar.tsx
    │   │   │   ├── ApproveAllBar.tsx
    │   │   │   ├── ApproveAllBar.module.scss
    │   │   │   └── ReviewQueue.tsx
    │   │   ├── hooks/
    │   │   │   └── usePendingReview.ts
    │   │   ├── ReviewPage.tsx
    │   │   └── index.ts
    │   │
    │   ├── inventory/
    │   │   ├── components/
    │   │   │   ├── InventoryTable.tsx
    │   │   │   ├── InventoryForm.tsx
    │   │   │   ├── RestockForm.tsx
    │   │   │   └── AuditLog.tsx
    │   │   ├── hooks/
    │   │   │   └── useInventory.ts
    │   │   ├── InventoryPage.tsx
    │   │   └── index.ts
    │   │
    │   ├── overhead/
    │   │   ├── components/
    │   │   │   ├── OverheadTable.tsx
    │   │   │   ├── OverheadForm.tsx
    │   │   │   └── CategoryBreakdown.tsx
    │   │   ├── hooks/
    │   │   │   └── useOverhead.ts
    │   │   ├── OverheadPage.tsx
    │   │   └── index.ts
    │   │
    │   └── auth/
    │       ├── components/
    │       │   └── LoginScreen.tsx
    │       ├── hooks/
    │       │   └── useAuth.ts
    │       ├── AuthGuard.tsx
    │       └── index.ts
    │
    ├── hooks/                          # Shared hooks
    │   ├── useFirestoreCollection.ts   # Generic real-time collection listener
    │   ├── useFirestoreDoc.ts          # Generic real-time document listener
    │   └── index.ts
    │
    ├── lib/                            # Utilities
    │   ├── currency.ts                 # toMinorUnits, toDisplayAmount, formatCurrency
    │   ├── wac.ts                      # calculateWAC, applyScoopCost
    │   ├── dates.ts                    # formatDate, relativeTime, toFirestoreTimestamp
    │   ├── margins.ts                  # calculateMargin, getMarginStatus (green/yellow/red)
    │   ├── taxJar.ts                   # calculateTaxReserve (flat + bracket modes)
    │   └── index.ts
    │
    ├── services/                       # Firebase service layer
    │   ├── firebase.ts                 # Firebase app initialization
    │   ├── firestore.ts                # Firestore instance + helpers
    │   ├── auth.ts                     # Auth instance + sign-in/out
    │   ├── storage.ts                  # Storage instance + upload/download
    │   └── index.ts
    │
    ├── stores/                         # Zustand stores
    │   ├── useTransactionStore.ts
    │   ├── useWorkOrderStore.ts
    │   ├── useInventoryStore.ts
    │   ├── useOverheadStore.ts
    │   ├── useUIStore.ts               # Toasts, modals, sidebar state
    │   └── index.ts
    │
    ├── types/                          # Shared TypeScript types + Zod schemas
    │   ├── transaction.ts              # Transaction type + transactionSchema
    │   ├── workOrder.ts                # WorkOrder type + workOrderSchema
    │   ├── inventory.ts                # InventoryItem type + inventoryItemSchema
    │   ├── overhead.ts                 # Overhead type + overheadSchema
    │   ├── email.ts                    # EmailLog type + emailLogSchema
    │   ├── config.ts                   # SystemConfig type
    │   └── index.ts
    │
    ├── i18n/
    │   ├── config.ts                   # i18next initialization
    │   ├── he.json                     # Hebrew translations
    │   └── en.json                     # English translations
    │
    └── styles/                         # Global SCSS
        ├── _variables.scss             # All design tokens (colors, typography, spacing, etc.)
        ├── _mixins.scss                # Component mixins (card-surface, focus-ring, rtl, etc.)
        ├── _animations.scss            # Keyframes (fadeIn, slideUp, shimmer, spin, etc.)
        ├── _accessibility.scss         # Focus rings, reduced motion, high contrast
        └── global.scss                 # Base reset, typography, scrollbar, selection
```

### Architectural Boundaries

**Frontend ↔ Backend Boundary:**
- React SPA communicates with Firebase via Firebase JS SDK
- No custom REST API. Direct Firestore reads/writes protected by security rules
- HTTPS Callable functions for admin actions (retry processing, manual triggers)
- Cloud Functions operate independently — triggered by Pub/Sub, Firestore events, or Scheduler

**Feature Module Boundaries:**
- Each feature in `src/features/` is self-contained: own components, hooks, page
- Features import from `@/components` (shared), `@/stores`, `@/lib`, `@/types`
- Features NEVER import from other features directly
- Cross-feature communication happens through Zustand stores

**Cloud Functions Boundary:**
- `functions/` is a separate npm package with its own `package.json` and `tsconfig.json`
- Shares Zod schemas and currency logic with client via manual copy (not symlink)
- Deployed independently via Firebase CLI
- No shared runtime between client and functions

### Requirements to Structure Mapping

| FR Module | Feature Directory | Key Files |
|---|---|---|
| **Dashboard (FR1–FR9)** | `src/features/dashboard/` | `HeroStat`, `KpiCard`, `ProjectList`, `DashboardPage` |
| **Work Orders (FR10–FR15)** | `src/features/work-orders/` | `NutritionLabel`, `ScoopModal`, `WorkOrderForm`, `StatusStepper` |
| **AI Ingestion (FR16–FR22)** | `functions/src/email/` + `functions/src/ai/` | `onEmailReceived`, `processDocument`, `geminiClient` |
| **Review (FR23–FR31, FR50)** | `src/features/review/` | `GhostTextCard`, `GhostTextField`, `ApproveAllBar`, `ReviewPage` |
| **Inventory (FR32–FR37)** | `src/features/inventory/` | `InventoryTable`, `RestockForm`, `AuditLog` |
| **Overhead (FR38–FR41)** | `src/features/overhead/` | `OverheadTable`, `CategoryBreakdown`, `OverheadForm` |
| **Accountant (FR42–FR44)** | Gmail filters (external) | No FOS code — Gmail handles forwarding independently |
| **Auth/i18n (FR45–FR49)** | `src/features/auth/` + `src/i18n/` | `AuthGuard`, `LoginScreen`, `he.json`, `en.json` |

**Cross-Cutting Concerns Mapping:**

| Concern | Location |
|---|---|
| Currency arithmetic | `src/lib/currency.ts` + `functions/src/shared/currency.ts` |
| Zod schemas | `src/types/*.ts` + `functions/src/shared/schemas.ts` |
| Real-time subscriptions | `src/hooks/useFirestoreCollection.ts` + feature-specific hooks |
| Audit trail | `functions/src/triggers/onTransactionApproved.ts` (server-side logging) |
| RTL/i18n | `src/i18n/config.ts` + `src/styles/_variables.scss` (CSS logical properties) |
| Error handling | `src/components/ErrorBoundary/` + `src/components/Toast/` + `src/stores/useUIStore.ts` |
| Design system | `src/styles/` (tokens) + `src/components/` (atoms) |

### External Integration Points

| Integration | Boundary | Entry Point |
|---|---|---|
| **Gmail API** | Cloud Functions only | `functions/src/email/gmailClient.ts` |
| **Gemini 2.5 Pro** | Cloud Functions only | `functions/src/ai/geminiClient.ts` |
| **Firebase Auth** | Client SDK | `src/services/auth.ts` |
| **Firestore** | Client SDK + Cloud Functions | `src/services/firestore.ts` + function triggers |
| **Firebase Storage** | Client SDK + Cloud Functions | `src/services/storage.ts` + `functions/src/email/` |
| **Vercel** | Deployment only | Git push → auto-deploy (no code dependency) |

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**
All technology choices work together without conflicts. Vite 7.3 + React 19 + TypeScript 5 + Firebase 12.9 (modular) + Zustand + React Router 7 + SCSS Modules — standard, well-tested combination. Vercel serves static SPA, Firebase handles backend — clean separation. No version incompatibilities detected.

**Pattern Consistency:**
Naming conventions are consistent across all areas: `camelCase` for code/fields, `PascalCase` for components/types, `snake_case` for Firestore collections, `UPPER_SNAKE_CASE` for constants. Data flow pattern (Firestore → Zod → Store → Component) is uniform across all features. Feature module boundary rule (no cross-feature imports) is enforced by barrel exports.

**Structure Alignment:**
Project structure supports all architectural decisions. Every FR module maps to a specific feature directory. Cross-cutting concerns have dedicated shared locations. Cloud Functions boundary is clean — separate package, no shared runtime.

### Requirements Coverage ✅

**Functional Requirements (50/50 covered):**

| Module | FRs | Status |
|---|---|---|
| Dashboard & Financial Intelligence | FR1–FR9 | ✅ HeroStat, KpiCards, ProjectList, forward projection |
| Work Order Management | FR10–FR15 | ✅ NutritionLabel, StatusStepper, ScoopModal, WorkOrderForm |
| Document Ingestion & AI Processing | FR16–FR22 | ✅ onEmailReceived (Pub/Sub), processDocument (Gemini), gmailClient |
| Transaction Review & Approval | FR23–FR31, FR50 | ✅ GhostTextCard, GhostTextField, ApproveAllBar, manual entry |
| Inventory Management | FR32–FR37 | ✅ InventoryTable, RestockForm, AuditLog, WAC engine |
| Overhead & Expense Tracking | FR38–FR41 | ✅ OverheadTable, CategoryBreakdown, OverheadForm |
| Accountant Integration | FR42–FR44 | ✅ Gmail filters (external, by design) |
| System & User Management | FR45–FR49 | ✅ AuthGuard, i18n, CSS logical properties |
| Manual Transaction Fallback | FR50 | ✅ Manual transaction form in review feature |

**Non-Functional Requirements (all addressed):**

| NFR Target | Architectural Support | Status |
|---|---|---|
| Dashboard < 3s | Vite tree-shaking + code splitting + Firestore cache | ✅ |
| Post-action < 2s | Real-time onSnapshot + optimistic updates | ✅ |
| Ghost Text < 1s | Client-side render, data in Zustand store | ✅ |
| AI processing < 30s | Cloud Function + Gemini API | ✅ |
| Scoop < 500ms | Client-side WAC in lib/wac.ts | ✅ |
| 2 whitelisted UIDs | isAdmin() Firestore rules + AuthGuard | ✅ |
| Integer currency | Agora suffix + lib/currency.ts | ✅ |
| Zero document loss | email_log tracks every email, failures preserved | ✅ |
| Audit trails | Cloud Function triggers log before/after | ✅ |
| Integration fallbacks | Defined for Gmail, Gemini, currency, Paperless | ✅ |

### Implementation Readiness ✅

**Decision Completeness:** All critical decisions documented with verified versions. 10 key packages specified. Rationale documented for every decision.

**Structure Completeness:** ~80 files mapped across client and functions. All directories have defined purposes. Integration points clearly specified with entry files.

**Pattern Completeness:** Naming, structure, data flow, state management, error handling, loading states, and date handling patterns all defined with concrete examples. 7 enforcement guidelines for AI agents.

### Gap Analysis

**Critical Gaps:** 0

**Minor Gaps (non-blocking):**

| Gap | Resolution |
|---|---|
| Currency conversion rate source | Manual entry in `system_config` initially; scheduled Cloud Function later |
| Shared Zod schema sync (client ↔ functions) | Document copy process; consider shared package if drift occurs |
| Forward Projection component not named | Will be component in `src/features/dashboard/components/` |
| Osek Patur threshold check mechanism | Client-side computed check on dashboard load |

### Architecture Completeness Checklist

**✅ Requirements Analysis**
- [x] Project context thoroughly analyzed (8 input documents)
- [x] Scale and complexity assessed (medium)
- [x] Technical constraints identified (8 constraints)
- [x] Cross-cutting concerns mapped (6 concerns)

**✅ Architectural Decisions**
- [x] Critical decisions documented with versions
- [x] Technology stack fully specified (10 packages, versions verified)
- [x] Integration patterns defined (5 Cloud Functions, 4 external integrations)
- [x] Performance considerations addressed (all 5 NFR targets)

**✅ Implementation Patterns**
- [x] Naming conventions established (Firestore, code, routes)
- [x] Structure patterns defined (feature modules, shared components)
- [x] Data flow patterns specified (Firestore → Zod → Store → Component)
- [x] Process patterns documented (error handling, loading states, dates)

**✅ Project Structure**
- [x] Complete directory structure defined (~80 files)
- [x] Component boundaries established (feature isolation)
- [x] Integration points mapped (6 external)
- [x] Requirements to structure mapping complete (all 50 FRs)

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION

**Confidence Level:** High

**Key Strengths:**
- Complete FR coverage with zero critical gaps
- Clean separation: Vercel (frontend) / Firebase (backend) / Gmail (email)
- Well-defined patterns prevent agent conflicts on naming, structure, and data flow
- TailorPlayed design system fully integrated into architecture
- Every external integration has a defined fallback path

**Areas for Future Enhancement:**
- Monorepo structure for shared schemas (if drift becomes an issue)
- Firebase Performance Monitoring integration (post-MVP)
- E2E testing strategy (Playwright/Cypress — deferred)
- Advanced caching (evaluate after real usage patterns)

### Implementation Handoff

**AI Agent Guidelines:**
- Follow all architectural decisions exactly as documented
- Use implementation patterns consistently across all components
- Respect project structure and boundaries — features never import from other features
- Refer to this document for all architectural questions
- Validate code against enforcement guidelines before considering tasks complete

**First Implementation Priority:**

```bash
npm create vite@latest tp-fos -- --template react-ts
cd tp-fos
npm install
```

Then: Firebase project setup → SCSS design system tokens → Auth + Firestore rules → Core UI components → Feature modules → Cloud Functions → i18n → Mobile polish
