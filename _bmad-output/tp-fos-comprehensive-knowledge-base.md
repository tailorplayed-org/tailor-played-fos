# TP-FOS — Comprehensive System Knowledge Base

**Generated:** February 6, 2026
**Purpose:** Exhaustive information extraction for development assistant onboarding
**Project:** TailorPlayed Financial Operations System (TP-FOS)
**Users:** Gal (financial operator, primary user) + Ben (business owner, decision consumer)

---

## Table of Contents

1. [Technical Architecture](#1-technical-architecture)
2. [Data Models & Database Schema](#2-data-models--database-schema)
3. [Features & Functionality](#3-features--functionality)
4. [AI & Gemini Integration](#4-ai--gemini-integration)
5. [Current Development Status](#5-current-development-status)
6. [Coding Conventions & Patterns](#6-coding-conventions--patterns)
7. [Integration with TailorPlayed](#7-integration-with-tailorplayed)
8. [Technical Decisions & Challenges](#8-technical-decisions--challenges)
9. [User Experience & UI](#9-user-experience--ui)
10. [Testing & Quality](#10-testing--quality)
11. [Environment & Deployment](#11-environment--deployment)
12. [Documentation](#12-documentation)

---

## 1. Technical Architecture

### 1.1 Tech Stack Summary

| Layer | Technology | Version |
|---|---|---|
| Build Tool / Bundler | **Vite** | 7.2.x |
| UI Framework | **React** | 19.2.x |
| Language | **TypeScript** (strict mode) | 5.9.x |
| Routing | **React Router** (declarative SPA mode) | 7.13.x |
| State Management | **Zustand** | 5.0.x |
| Backend / Database | **Firebase** (Firestore, Auth, Functions, Storage) | 12.9.x (JS SDK) |
| AI Processing | **Gemini 2.5 Pro** (via Cloud Functions) | — |
| Styling | **SCSS Modules** + CSS Custom Properties | Dart Sass 1.97.x |
| Icons | **Phosphor Icons** (@phosphor-icons/react) | 2.1.x |
| i18n | **react-i18next** + i18next | 16.5.x / 25.8.x |
| Validation | **Zod** | 4.3.x |
| Forms | **React Hook Form** | 7.71.x |
| Testing | **Vitest** + React Testing Library | 4.0.x |
| Package Manager | **npm** | — |
| Hosting (Frontend) | **Vercel** (planned: `fos.tailorplayed.com`) | — |
| Hosting (Backend) | **Firebase** (separate project: `tailor-played`) | — |

### 1.2 Project Structure — Exact Directory Layout

```
tp-fos/
├── README.md
├── package.json                    # npm, ESM ("type": "module")
├── package-lock.json
├── tsconfig.json                   # References tsconfig.app.json + tsconfig.node.json
├── tsconfig.app.json               # Strict mode, path aliases @/ → src/
├── tsconfig.node.json
├── vite.config.ts                  # React plugin, sass-dts plugin, @/ alias, SCSS additionalData
├── vitest.config.ts                # jsdom, globals: true, co-located tests
├── vitest.setup.ts                 # Imports @testing-library/jest-dom/vitest
├── eslint.config.js                # Flat config, ts-eslint + react-hooks + react-refresh
├── .prettierrc                     # Single quotes, trailing commas, 100 print width
├── .env.example                    # Firebase client config template (VITE_FIREBASE_*)
├── .firebaserc                     # Default project: "tailor-played"
├── firebase.json                   # Firestore rules, Storage rules, Functions source, Emulators config
├── firestore.rules                 # isAdmin() function — 2 whitelisted UIDs
├── storage.rules                   # Same isAdmin() pattern
├── index.html                      # SPA entry point, mounts #root
│
├── .github/
│   └── workflows/
│       ├── ci.yml                  # PR: lint + test + type-check + build
│       └── deploy-functions.yml    # Push to main (functions/**): deploy Cloud Functions
│
├── public/
│   ├── vite.svg
│   └── fonts/
│       ├── Fredoka-Variable.woff2           # Latin subset
│       ├── Fredoka-Variable-LatinExt.woff2  # Latin Extended subset
│       └── Fredoka-Variable-Hebrew.woff2    # Hebrew subset
│
├── functions/                      # Cloud Functions — SEPARATE npm package
│   ├── package.json                # firebase-admin 13.4, firebase-functions 6.3, Node 20
│   ├── package-lock.json
│   ├── tsconfig.json               # NodeNext module, strict, ES2022 target
│   └── src/
│       ├── index.ts                # Entry point (currently placeholder)
│       ├── config.ts               # Environment config (placeholder)
│       └── shared/
│           ├── types.ts            # Shared types (placeholder)
│           ├── schemas.ts          # Shared Zod schemas (placeholder)
│           └── currency.ts         # Shared currency utils (placeholder)
│
└── src/
    ├── main.tsx                    # Entry: StrictMode + RouterProvider + global.scss import
    ├── App.tsx                     # Root component (currently unused, router takes over)
    ├── App.test.tsx
    ├── router.tsx                  # Route definitions with AuthGuard + PageShell layout
    ├── vite-env.d.ts
    │
    ├── components/                 # Shared design system components
    │   ├── Badge/index.ts          # (placeholder)
    │   ├── Button/index.ts         # (placeholder)
    │   ├── Card/index.ts           # (placeholder)
    │   ├── ErrorBoundary/index.ts  # (placeholder)
    │   ├── Input/index.ts          # (placeholder)
    │   ├── Skeleton/index.ts       # (placeholder)
    │   ├── Table/index.ts          # (placeholder)
    │   ├── Toast/index.ts          # (placeholder)
    │   ├── Layout/
    │   │   ├── TopNav.tsx          # Desktop segmented pill navigation
    │   │   ├── TopNav.module.scss
    │   │   ├── TopNav.test.tsx
    │   │   ├── BottomNav.tsx       # Mobile bottom navigation (4 items)
    │   │   ├── BottomNav.module.scss
    │   │   ├── BottomNav.test.tsx
    │   │   ├── PageShell.tsx       # Layout wrapper: TopNav + <main> + BottomNav
    │   │   ├── PageShell.module.scss
    │   │   ├── PageShell.test.tsx
    │   │   └── index.ts
    │   └── index.ts                # Barrel export for all shared components
    │
    ├── features/
    │   ├── auth/
    │   │   ├── AuthGuard.tsx       # Checks useAuth(), redirects to /login if no user
    │   │   ├── AuthGuard.module.scss
    │   │   ├── AuthGuard.test.tsx
    │   │   ├── components/
    │   │   │   ├── LoginScreen.tsx  # Google Sign-in button, error handling
    │   │   │   ├── LoginScreen.module.scss
    │   │   │   ├── LoginScreen.test.tsx
    │   │   │   └── index.ts
    │   │   ├── hooks/
    │   │   │   ├── useAuth.ts      # Auth state hook: user, loading, signIn, signOut
    │   │   │   ├── useAuth.test.ts
    │   │   │   └── index.ts
    │   │   └── index.ts
    │   │
    │   ├── dashboard/
    │   │   ├── DashboardPage.tsx    # Placeholder: "Your financial cockpit is coming soon"
    │   │   ├── DashboardPage.module.scss
    │   │   ├── DashboardPage.test.tsx
    │   │   ├── components/index.ts  # (placeholder)
    │   │   ├── hooks/index.ts       # (placeholder)
    │   │   └── index.ts
    │   │
    │   ├── work-orders/
    │   │   ├── WorkOrdersPage.tsx         # Placeholder: list view
    │   │   ├── WorkOrdersPage.module.scss
    │   │   ├── WorkOrdersPage.test.tsx
    │   │   ├── WorkOrderDetailPage.tsx    # Placeholder: detail view with :id param
    │   │   ├── WorkOrderDetailPage.module.scss
    │   │   ├── WorkOrderDetailPage.test.tsx
    │   │   ├── components/index.ts        # (placeholder)
    │   │   ├── hooks/index.ts             # (placeholder)
    │   │   └── index.ts
    │   │
    │   ├── inventory/
    │   │   ├── InventoryPage.tsx           # Placeholder
    │   │   ├── InventoryPage.module.scss
    │   │   ├── InventoryPage.test.tsx
    │   │   ├── components/index.ts        # (placeholder)
    │   │   ├── hooks/index.ts             # (placeholder)
    │   │   └── index.ts
    │   │
    │   ├── overhead/
    │   │   ├── OverheadPage.tsx            # Placeholder
    │   │   ├── OverheadPage.module.scss
    │   │   ├── OverheadPage.test.tsx
    │   │   ├── components/index.ts        # (placeholder)
    │   │   ├── hooks/index.ts             # (placeholder)
    │   │   └── index.ts
    │   │
    │   ├── review/
    │   │   ├── ReviewPage.tsx             # Placeholder
    │   │   ├── ReviewPage.module.scss
    │   │   ├── ReviewPage.test.tsx
    │   │   ├── components/index.ts        # (placeholder)
    │   │   ├── hooks/index.ts             # (placeholder)
    │   │   └── index.ts
    │   │
    │   └── index.ts                       # Barrel export for all features
    │
    ├── hooks/
    │   └── index.ts                       # (placeholder, will have useFirestoreCollection, useFirestoreDoc)
    │
    ├── lib/
    │   ├── currency.ts                    # (placeholder — will have toMinorUnits, toDisplayAmount, formatCurrency)
    │   ├── dates.ts                       # (placeholder — will have formatDate, relativeTime)
    │   ├── margins.ts                     # (placeholder — will have calculateMargin, getMarginStatus)
    │   ├── wac.ts                         # (placeholder — will have calculateWAC, applyScoopCost)
    │   ├── taxJar.ts                      # (placeholder — will have calculateTaxReserve)
    │   ├── alias-test.test.ts
    │   └── index.ts
    │
    ├── services/
    │   ├── firebase.ts                    # Initializes Firebase app, exports auth/db/storage
    │   ├── firebase.test.ts
    │   ├── auth.ts                        # signInWithGoogle, signOutUser, onAuthStateChanged + UID whitelist
    │   ├── auth.test.ts
    │   ├── firestore.ts                   # Re-exports db from firebase.ts
    │   ├── storage.ts                     # Re-exports storage from firebase.ts
    │   └── index.ts
    │
    ├── stores/
    │   ├── useTransactionStore.ts         # (placeholder)
    │   ├── useWorkOrderStore.ts           # (placeholder)
    │   ├── useInventoryStore.ts           # (placeholder)
    │   ├── useOverheadStore.ts            # (placeholder)
    │   ├── useUIStore.ts                  # (placeholder — will hold toasts, modals, sidebar state)
    │   └── index.ts
    │
    ├── types/
    │   ├── transaction.ts                 # (placeholder)
    │   ├── workOrder.ts                   # (placeholder)
    │   ├── inventory.ts                   # (placeholder)
    │   ├── overhead.ts                    # (placeholder)
    │   ├── email.ts                       # (placeholder)
    │   ├── config.ts                      # (placeholder)
    │   └── index.ts
    │
    ├── i18n/
    │   ├── config.ts                      # (placeholder — will initialize i18next)
    │   ├── en.json                        # {"translation": {}}
    │   ├── he.json                        # {"translation": {}}
    │   └── index.ts
    │
    └── styles/
        ├── _variables.scss                # ALL design tokens: colors, typography, spacing, radii, shadows, transitions, breakpoints
        ├── _mixins.scss                   # card-surface, elevated-surface, focus-ring, interactive-reset, rtl, flex-center, truncate, responsive breakpoints
        ├── _animations.scss               # Keyframes: spin, fadeIn, slideUp, scaleIn, slideDown, pulse, shimmer, tooltipFadeIn + stagger delays
        ├── _accessibility.scss            # sr-only, focus-visible, forced-colors, prefers-reduced-motion
        ├── global.scss                    # @font-face (Fredoka subsets), CSS custom properties :root, base reset, typography, scrollbar, text selection, links
        ├── design-system.test.ts
        └── SmokeTest.module.scss
```

### 1.3 How React Is Organized

**Entry Flow:**
1. `index.html` → mounts `#root`
2. `src/main.tsx` → `<StrictMode>` + `<RouterProvider router={router} />`
3. `src/router.tsx` → defines all routes with nested layout

**Router Structure:**
```typescript
createBrowserRouter([
  { path: '/login', Component: LoginScreen },
  {
    path: '/',
    Component: AuthGuard,       // Checks auth, redirects to /login if not authenticated
    children: [{
      Component: PageShell,     // TopNav + <main><Outlet/></main> + BottomNav
      children: [
        { index: true, Component: DashboardPage },
        { path: 'work-orders', Component: WorkOrdersPage },
        { path: 'work-orders/:id', Component: WorkOrderDetailPage },
        { path: 'inventory', Component: InventoryPage },
        { path: 'overhead', Component: OverheadPage },
        { path: 'review', Component: ReviewPage },
      ],
    }],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
```

**Component Organization:**
- `src/components/` — Shared design system atoms (Button, Card, Badge, Input, Table, Toast, Skeleton, Layout, ErrorBoundary)
- `src/features/` — Feature modules, each self-contained with `components/`, `hooks/`, page component(s), and `index.ts`
- **Features NEVER import from other features** — cross-feature communication happens through Zustand stores
- Every directory has an `index.ts` barrel export

**State Flow:**
```
Firestore document → Zod schema parse → TypeScript type → Zustand store → React component
```

### 1.4 Firebase Structure

**Firebase Project:** `tailor-played` (configured in `.firebaserc`)

**Services Used:**
- **Firestore** — NoSQL database for all application data
- **Firebase Auth** — Google Sign-in with 2 whitelisted UIDs
- **Firebase Storage** — Document file storage (receipts, invoices)
- **Cloud Functions** — Server-side processing (AI pipeline, side-effects, scheduled tasks)

**Firestore Collections (Planned — flat, not subcollections):**

| Collection | Purpose |
|---|---|
| `transactions` | Financial documents (AI-classified + manual) |
| `work_orders` | Client projects linking revenue to costs |
| `inventory` | Material stock with WAC tracking |
| `inventory_log` | Audit trail for all inventory actions |
| `overhead` | Recurring and one-time overhead expenses |
| `email_log` | Every email entering the system |
| `system_config` | App configuration (tax rate, thresholds, currency rates) |

**Firestore Security Rules:**
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAdmin() {
      return request.auth != null && request.auth.uid in [
        'MKeVSMwPzAVSUg8VGy9EG2L72ha2',  // Gal
        '3lO30cF0OtNBsfTiNWZ35YqdI7l2'   // Ben
      ];
    }
    match /{document=**} {
      allow read, write: if isAdmin();
    }
  }
}
```

**Storage Rules:** Same `isAdmin()` pattern — only whitelisted UIDs can read/write.

**Firebase Emulators (local development):**

| Service | Port |
|---|---|
| Auth | 9099 |
| Firestore | 8080 |
| Storage | 9199 |
| Functions | 5001 |
| Emulator UI | enabled |

**Cloud Functions (Planned):**

| Function | Trigger | Purpose |
|---|---|---|
| `onEmailReceived` | Pub/Sub (Gmail push) | Detect new email, download attachments, store in Storage, queue for AI |
| `processDocument` | Firestore `onCreate` on email_log | Send document to Gemini 2.5 Pro, parse response, create pending transaction |
| `onTransactionApproved` | Firestore `onUpdate` on transactions | Update Work Order totals, recalculate Nutrition Label, log audit trail |
| `verifyWAC` | Firestore `onWrite` on inventory | Recalculate WAC as authoritative check |
| `retryFailedProcessing` | Scheduled (Cloud Scheduler) | Find unprocessed documents older than 1 hour, retry AI processing |

### 1.5 Vercel Configuration (Planned)

- **Project:** `tp-fos` (new Vercel project)
- **Domain:** `fos.tailorplayed.com` (CNAME in Porkbun → Vercel)
- **Auto-deploy:** Git push to `main` → auto-deploy
- **Environment Variables:** Firebase client config only (VITE_FIREBASE_*)
- **Build Command:** `tsc -b && vite build`
- **Output Directory:** `dist`

### 1.6 Gemini API Integration

**Where:** Cloud Functions only (never client-side, to protect API keys)

**Planned Location:** `functions/src/ai/geminiClient.ts` and `functions/src/ai/processDocument.ts`

**How It Works (Planned Pipeline):**
1. Gmail API + Pub/Sub detects new email in designated mailboxes
2. Cloud Function downloads attachment, stores in Firebase Storage
3. Document sent to Gemini 2.5 Pro for processing
4. Gemini returns structured JSON: vendor, date, amount, currency, line items, category, confidence
5. Result saved as transaction with `status: 'pending_review'` in Firestore
6. User reviews via Ghost Text UI

**Currently:** Not yet implemented — all AI/email pipeline is in Epic 4 (backlog).

### 1.7 Key Configuration Files

**Vite Config (`vite.config.ts`):**
```typescript
export default defineConfig({
  plugins: [react(), sassDts()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use "@/styles/variables" as *; @use "@/styles/mixins" as *;`,
      },
    },
  },
});
```

**TypeScript Config (`tsconfig.app.json`):**
- `strict: true`, `noUnusedLocals: true`, `noUnusedParameters: true`
- `target: ES2022`, `module: ESNext`, `moduleResolution: bundler`
- `jsx: react-jsx`
- Path alias: `"@/*": ["src/*"]`

**Prettier Config (`.prettierrc`):**
```json
{
  "semi": true,
  "trailingComma": "all",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "endOfLine": "lf",
  "arrowParens": "always",
  "bracketSpacing": true,
  "jsxSingleQuote": false
}
```

---

## 2. Data Models & Database Schema

### 2.1 Current Status

**All type files are currently placeholders** (`export {};`). The data models are fully designed in the architecture document but not yet implemented in code. Implementation is scheduled for Epic 2 (Work Orders), Epic 4 (AI Ingestion), Epic 5 (Review), Epic 6 (Inventory), and Epic 7 (Overhead).

### 2.2 Planned Firestore Collections — Detailed Schema

#### `transactions` Collection

The central staging area for all financial documents.

| Field | Type | Description |
|---|---|---|
| `id` | string (auto) | Firestore document ID |
| `vendorName` | string | Vendor / supplier name |
| `date` | Timestamp | Transaction date |
| `amountAgora` | integer | Amount in agora/cents (integer currency) |
| `currency` | `'ILS' \| 'USD' \| 'EUR'` | Original currency |
| `category` | `'direct' \| 'inventory' \| 'overhead' \| 'personal'` | Transaction classification |
| `workOrderId` | string? | Reference to work_orders document (if Direct Cost) |
| `inventoryItemId` | string? | Reference to inventory document (if Inventory Restock) |
| `status` | `'pending_review' \| 'approved' \| 'rejected'` | Review workflow status |
| `aiConfidence` | number (0-1) | AI classification confidence score |
| `originalFileUrl` | string | Firebase Storage URL to original document |
| `sourceEmailRef` | string? | Reference to email_log document |
| `isConfirmed` | boolean | Whether user has confirmed |
| `createdAt` | Timestamp | Document creation time |
| `updatedAt` | Timestamp | Last modification time |
| `approvedAt` | Timestamp? | When user approved |

#### `work_orders` Collection

Central entity linking revenue to all cost types.

| Field | Type | Description |
|---|---|---|
| `id` | string (auto) | Firestore document ID |
| `clientName` | string | Client name |
| `projectDescription` | string | Project details |
| `deadline` | Timestamp? | Project deadline |
| `status` | `'lead' \| 'design' \| 'production' \| 'shipped'` | Lifecycle status |
| `revenueTotalAgora` | integer | Total revenue in agora |
| `directCostAgora` | integer | Total direct costs in agora |
| `inventoryCostAgora` | integer | Total inventory (Scoop) costs in agora |
| `overheadAllocationAgora` | integer | Allocated overhead in agora |
| `createdAt` | Timestamp | |
| `updatedAt` | Timestamp | |

**Nutrition Label (Derived Calculation):**
```
Revenue - Direct Costs - Inventory Costs (Scoops) - Overhead Allocation - Unforeseen Buffer (5%) = Net Profit
Margin % = Net Profit / Revenue * 100
```

**Margin Color Coding:**
- Green: >= 20% margin
- Yellow: 10-19% margin
- Red: < 20% margin (highlighted as at-risk)

#### `inventory` Collection

Material stock with Weighted Average Cost tracking.

| Field | Type | Description |
|---|---|---|
| `id` | string (auto) | Firestore document ID |
| `name` | string | Item name |
| `sku` | string | Stock keeping unit |
| `supplier` | string | Supplier name |
| `currentQty` | number | Current quantity in stock |
| `wacAgora` | integer | Weighted Average Cost per unit in agora |
| `reorderThreshold` | number | Low stock alert threshold |
| `createdAt` | Timestamp | |
| `updatedAt` | Timestamp | |

**WAC Calculation:**
```
New WAC = (Current Qty × Current WAC + New Qty × New Cost) / (Current Qty + New Qty)
```
Example: 100 units @ ₪1.00 + 100 units @ ₪2.00 = 200 units @ ₪1.50

#### `inventory_log` Collection

Full audit trail for all inventory actions.

| Field | Type | Description |
|---|---|---|
| `id` | string (auto) | Firestore document ID |
| `itemId` | string | Reference to inventory document |
| `action` | `'restock' \| 'consume' \| 'waste'` | Type of inventory action |
| `qtyChange` | number | Quantity change (positive for restock, negative for consume/waste) |
| `costSnapshotAgora` | integer | WAC at time of action |
| `workOrderRef` | string? | Reference to work_orders document |
| `createdAt` | Timestamp | |

#### `overhead` Collection

Monthly/recurring expense tracking.

| Field | Type | Description |
|---|---|---|
| `id` | string (auto) | Firestore document ID |
| `category` | `'subscriptions' \| 'software' \| 'meals' \| 'office' \| 'general'` | Expense category |
| `description` | string | Expense description |
| `amountAgora` | integer | Amount in agora |
| `date` | Timestamp | Expense date |
| `isRecurring` | boolean | Whether this recurs monthly |
| `source` | `'manual' \| 'ai'` | How this entry was created |
| `createdAt` | Timestamp | |

#### `email_log` Collection

Tracks every email entering the system.

| Field | Type | Description |
|---|---|---|
| `id` | string (auto) | Firestore document ID |
| `messageId` | string | Gmail message ID |
| `mailbox` | `'orders' \| 'supplies' \| 'developing' \| 'expenses'` | Which designated mailbox |
| `receivedAt` | Timestamp | When email was received |
| `status` | `'processed' \| 'unprocessed' \| 'failed'` | Processing status |
| `transactionId` | string? | Reference to resulting transaction |
| `hasAttachment` | boolean | Whether email had an attachment |
| `errorMessage` | string? | Error details if failed |

#### `system_config` Collection

Application-level configuration (single document).

| Field | Type | Description |
|---|---|---|
| `taxMethod` | `'flat' \| 'bracket'` | Tax calculation method |
| `flatRate` | number | Flat tax rate (default: 0.35 = 35%) |
| `currencyRates` | object | `{ USD: number, EUR: number }` — manual exchange rates |
| `osPaturThreshold` | integer | ₪120,000 annual revenue threshold (in agora) |

### 2.3 Currency Model

- **Storage:** Always as integers in agora (1/100 of shekel) or cents
- **Suffix convention:** All currency fields end in `Agora` (e.g., `amountAgora`, `wacAgora`, `revenueTotalAgora`)
- **Base currency:** ILS (₪)
- **Supported currencies:** ILS, USD, EUR
- **Non-ILS handling:** Flagged as "Estimated" with conversion rate documented
- **Utility functions (planned):** `toMinorUnits()`, `toDisplayAmount()`, `formatCurrency()`

### 2.4 Relationships Between Models

```
email_log ──→ transactions (sourceEmailRef → transactionId)
transactions ──→ work_orders (workOrderId)
transactions ──→ inventory (inventoryItemId)
inventory_log ──→ inventory (itemId)
inventory_log ──→ work_orders (workOrderRef)
overhead ←── transactions (auto-categorized from AI)
system_config ←── dashboard (reads tax method, rates)
```

### 2.5 Suppliers

No dedicated `suppliers` collection. Supplier information is:
- Stored as a field (`supplier`) on `inventory` items
- Stored as `vendorName` on `transactions`
- AI learns vendor patterns over time from confirmed transactions

### 2.6 Products/Materials

Materials are tracked in the `inventory` collection. There's no separate "products" collection — the business creates unique, bespoke board games (each is a Work Order), not mass-produced products.

---

## 3. Features & Functionality

### 3.1 Authentication & Route Protection

**Status: BUILT (Story 1-3, Done)**

**What It Does:**
- Google Sign-in via Firebase Auth
- Whitelist of 2 authorized UIDs (Gal + Ben)
- Unauthorized users are immediately signed out
- Protected routes redirect to `/login`

**User Flow:**
1. User navigates to any route
2. `AuthGuard` checks `useAuth()` hook
3. If loading → spinner screen
4. If no user → redirect to `/login`
5. On `/login` → "Sign in with Google" button
6. After Google popup → check UID against whitelist
7. If whitelisted → redirect to `/` (dashboard)
8. If not whitelisted → sign out immediately, show "Access restricted" error

**Components Involved:**
- `AuthGuard.tsx` — Route guard wrapper
- `LoginScreen.tsx` — Login page with Google Sign-in button
- `useAuth.ts` — React hook managing auth state
- `auth.ts` — Firebase Auth service layer with whitelist logic

**Code Details:**
```typescript
// Whitelisted UIDs (hardcoded fallback, overridable via VITE_WHITELISTED_UIDS env var)
const WHITELISTED_UIDS = ['MKeVSMwPzAVSUg8VGy9EG2L72ha2', '3lO30cF0OtNBsfTiNWZ35YqdI7l2'];
```

### 3.2 App Shell & Responsive Navigation

**Status: IN PROGRESS (Story 1-4)**

**What It Does:**
- `PageShell` wraps all authenticated content with consistent layout
- `TopNav` — sticky header with logo, segmented pill tabs (desktop), pending review badge
- `BottomNav` — fixed bottom bar (mobile only, hidden on tablet+)
- Responsive layout with content max-width 1080px on wide screens

**Navigation Items:**

Desktop (TopNav segmented pills):
| Label | Route | End Match |
|---|---|---|
| Dashboard | `/` | true |
| Work Orders | `/work-orders` | false |
| Inventory | `/inventory` | false |
| Overhead | `/overhead` | false |

Mobile (BottomNav):
| Label | Icon | Route |
|---|---|---|
| Home | ChartBar | `/` |
| Orders | ClipboardText | `/work-orders` |
| Review | Tray | `/review` |
| More | GearSix | `/` |

**Pending Review Badge:** Orange pill in TopNav showing count of pending items, links to `/review`. Hidden when count is 0.

### 3.3 Dashboard

**Status: PLACEHOLDER (Backlog — Epic 3)**

**Planned Functionality:**
- **Hero Stat:** Large centered Net Profit display, greeting line, delta badge
- **KPI Cards Row:** Tax Jar, Active Projects, Monthly Overhead, Pending Review (clickable, glow on hover)
- **Project Health Table:** Client name, status, revenue, cost, margin % with color coding
- **Osek Patur Alert:** Warning when annual revenue approaches ₪120,000

**User Flow (Planned):**
1. User logs in → lands on Dashboard
2. Sees Net Profit prominently displayed
3. Glances at KPI cards for quick overview
4. Scrolls to Project Health Table for project-level details
5. Red-tinted rows indicate at-risk projects (< 20% margin)
6. Clicks any project row to drill into Work Order detail

### 3.4 Work Orders Management

**Status: PLACEHOLDER (Backlog — Epic 2)**

**Planned Functionality:**
- Full CRUD for Work Orders
- Status lifecycle: Lead → Design → Production → Shipped
- **Nutrition Label:** Visual breakdown of Revenue, Direct Costs, Inventory Costs (Scoops), Overhead Allocation, Unforeseen Buffer (5%), Net Profit
- Link revenue (Summit receipts) to Work Orders
- Link direct costs (vendor invoices) to Work Orders
- Real-time margin calculation (< 2s update)

**Planned Components:**
- `WorkOrderCard.tsx` — Card display in list view
- `WorkOrderForm.tsx` — Create/edit form (React Hook Form)
- `NutritionLabel.tsx` — Financial breakdown visualization
- `StatusStepper.tsx` — Visual status progression
- `ScoopModal.tsx` — Material consumption dialog

### 3.5 AI Receipt Ingestion

**Status: NOT STARTED (Backlog — Epic 4)**

**Planned Pipeline:**
1. **Email Detection:** Gmail API + Pub/Sub detects new emails in designated mailboxes:
   - `orders@tailorplayed.com` — Revenue (Summit receipts)
   - `supplies@tailorplayed.com` — Supply purchases
   - `developing@tailorplayed.com` — Development expenses
   - `expenses@tailorplayed.com` — General expenses
2. **Document Processing:** Cloud Function downloads attachment (PDF, JPG, PNG) or parses HTML email content
3. **AI Classification:** Gemini 2.5 Pro processes document, extracts:
   - Vendor name, date, amount, currency
   - Line items
   - Transaction category (Direct Cost, Inventory Restock, Overhead, Personal)
   - Confidence score (0-1)
   - Suggested Work Order or Inventory item association
4. **Auto-Fork:** Gmail filters independently forward originals to Paperless (accountant system) — FOS is a parallel consumer, never a gatekeeper
5. **Pending Review:** Transaction created in Firestore with `status: 'pending_review'`

**Bilingual Support:** Gemini processes Hebrew and English documents equally. Handles mixed-language content.

**Confidence Scoring:**
- >= 85%: Green badge, eligible for batch approval
- < 85%: Yellow "Check Me" badge, requires individual review

### 3.6 Ghost Text Review (Transaction Approval)

**Status: NOT STARTED (Backlog — Epic 5)**

**Planned "Ghost Text" UX Pattern:**
- AI pre-fills all fields with muted/dashed styling
- User sees suggested values and either:
  - **Confirms** (Enter key) — fields animate to solid gold
  - **Edits** — modifies any field, then confirms
  - **Rejects** (Del key) — marks as irrelevant/personal

**Planned Components:**
- `GhostTextCard.tsx` — Full review card: invoice preview, Ghost Text fields, confidence bar, AI reasoning, action buttons
- `GhostTextField.tsx` — Individual editable pre-filled field with visual state transitions
- `ConfidenceBar.tsx` — Visual confidence indicator
- `ApproveAllBar.tsx` — Sticky bottom bar for batch approval (only for >= 85% confidence items)
- `ReviewQueue.tsx` — List of pending items

**Keyboard Shortcuts:**
- Enter = Confirm
- E = Edit
- Del = Reject
- Esc = Close
- ←/→ = Navigate between pending items

### 3.7 Inventory Management & WAC Engine

**Status: NOT STARTED (Backlog — Epic 6)**

**Planned Functionality:**
- Create/manage inventory items (name, SKU, supplier, quantity, reorder threshold)
- Record restocks with quantity and cost → triggers WAC recalculation
- **Scoop Action:** Search material → input quantity → auto-calculate cost via WAC → deduct from inventory → add to Work Order COGS
- Over-draft prevention (shows remaining stock during Scoop)
- Full audit log with cost snapshots and Work Order references
- Waste/scrap logging with cost impact

### 3.8 Scrap/Waste Tracking

**Status: NOT STARTED (Backlog — Epic 6, Story 6-4)**

- Logged as inventory actions with `action: 'waste'`
- Cost impact calculated using WAC at time of waste
- Links to relevant Work Order
- Shows in audit log

### 3.9 Overhead Tracking

**Status: NOT STARTED (Backlog — Epic 7)**

**Planned Functionality:**
- View overhead by category (subscriptions, software, meals, office, general)
- Manual entry with category, amount, date, recurrence
- Auto-categorization from AI-classified transactions
- Monthly burn rate and trend visualization
- Tax Jar (configurable: flat 35% or Israeli progressive brackets)
- Osek Patur threshold alert (₪120,000 annual revenue)
- Forward financial projection (cash flow impact modeling)

### 3.10 Reporting/Analytics

**Status: NOT STARTED (Post-MVP)**

Planned for Post-MVP:
- PDF reports / accountant-formatted summaries
- Historical margin comparisons
- Predictive pricing from historical data
- Export capabilities (not yet specified)

---

## 4. AI & Gemini Integration

### 4.1 Overview

**Model:** Gemini 2.5 Pro
**Access:** Server-side only via Cloud Functions (API key in Cloud Functions environment config, never client-exposed)
**Status:** Not yet implemented (Epic 4, Backlog)

### 4.2 Planned Prompts/Tasks

1. **Document Processing:** Parse PDF/image receipts and invoices
   - Extract: vendor name, date, amount, currency, line items
   - Handle Hebrew + English + mixed-language documents
   - Handle photo receipts (camera captures) alongside clean PDFs

2. **Transaction Classification:**
   - Categorize: Direct Cost, Inventory Restock, Overhead, Personal
   - Assign confidence score (0-1)
   - Suggest Work Order association (for direct costs)
   - Suggest Inventory item association (for restocks)

3. **Multi-Currency Handling:**
   - Detect currency from document
   - Flag non-ILS amounts as "Estimated"
   - Document conversion rate used

### 4.3 Planned Architecture

```
Gmail push notification (Pub/Sub)
    → onEmailReceived (Cloud Function)
        → Download attachment from Gmail API
        → Store in Firebase Storage
        → Create email_log entry in Firestore

Firestore onCreate on email_log
    → processDocument (Cloud Function)
        → Read document from Storage
        → Send to Gemini 2.5 Pro with structured prompt
        → Parse Gemini's structured JSON response
        → Create transaction in Firestore with status: 'pending_review'
        → On error: set email_log status to 'unprocessed', preserve original
```

### 4.4 Planned Request Format

Gemini will receive:
- Document content (base64 encoded image/PDF or extracted text)
- Context: known vendors, active Work Orders, inventory items
- Structured output schema (function calling / JSON mode)

### 4.5 Planned Response Processing

Gemini returns structured JSON matching the transaction schema. The Cloud Function:
1. Validates response against Zod schema
2. Converts amounts to integer agora
3. Creates Firestore document
4. Sets appropriate confidence level

### 4.6 Caching/Optimization (Planned)

- Vendor matching: Known vendors from previous confirmed transactions help AI classification
- Failed parses are preserved (never silently dropped) and retried by scheduled function
- Retry function runs every hour for documents in 'unprocessed' state

### 4.7 Cost Optimization Strategy

- Use Gemini 2.5 Pro for high accuracy on financial documents
- Process only copies, never originals (Paperless gets originals)
- Batch processing is not needed — expected volume is 2-5 documents/day
- No caching of Gemini responses (each document is unique)

---

## 5. Current Development Status

### 5.1 Sprint Status Overview

**Epic 1: Project Foundation & App Shell — IN PROGRESS**

| Story | Status | Description |
|---|---|---|
| 1-1 Project Scaffold & Dev Environment | **Done** | Vite + React + TypeScript + Firebase setup, CI/CD |
| 1-2 Design System Tokens & Global Styles | **Done** | SCSS variables, mixins, animations, accessibility, global reset |
| 1-3 Authentication & Route Protection | **Done** | Google Sign-in, UID whitelist, AuthGuard, LoginScreen |
| 1-4 App Shell & Responsive Navigation | **In Progress** | TopNav, BottomNav, PageShell |
| 1-5 Internationalization & RTL Support | Backlog | i18next setup, Hebrew/English, CSS logical properties |
| 1-6 Core Shared UI Components & Currency Utilities | Backlog | Button, Card, Badge, Input, Table, Toast, Skeleton, currency utils |

**Epic 2: Work Orders & Manual Financial Tracking — BACKLOG**

| Story | Status | Description |
|---|---|---|
| 2-1 Work Order Data Model & CRUD | Backlog | Zod schema, Firestore operations, Zustand store |
| 2-2 Work Order Status Lifecycle & List View | Backlog | StatusStepper, WorkOrderCard, list page |
| 2-3 Manual Transaction Entry & Cost/Revenue Linkage | Backlog | Manual transaction form, linking to Work Orders |
| 2-4 Nutrition Label & Margin Calculations | Backlog | NutritionLabel component, margin math |
| 2-5 Work Order Detail Page | Backlog | Full detail view with all linked data |

**Epic 3: Dashboard & Project Health — BACKLOG**

| Story | Status | Description |
|---|---|---|
| 3-1 Hero Stat & KPI Cards | Backlog | Net Profit display, KPI card row |
| 3-2 Project Health Table | Backlog | Color-coded project list with margins |
| 3-3 Real-Time Dashboard Data Layer | Backlog | Firestore listeners, computed aggregations |

**Epic 4: Email Ingestion & AI Document Processing — BACKLOG**

| Story | Status | Description |
|---|---|---|
| 4-1 Gmail API Integration & Email Detection | Backlog | Gmail API + Pub/Sub setup |
| 4-2 Paperless Auto-Forward | Backlog | Gmail filter configuration |
| 4-3 AI Document Processing (Gemini) | Backlog | Gemini integration, structured output |
| 4-4 Transaction Classification & Confidence Scoring | Backlog | Category assignment, confidence logic |
| 4-5 Error Handling, Retry, Pipeline Resilience | Backlog | Retry mechanism, error recovery |

**Epic 5: Ghost Text Review & Transaction Approval — BACKLOG**

| Story | Status | Description |
|---|---|---|
| 5-1 Review Queue & Pending Items List | Backlog | ReviewPage with pending items |
| 5-2 Ghost Text Card & Core Confirmation Flow | Backlog | GhostTextCard, confirm action |
| 5-3 Ghost Text Field Editing & Rejection | Backlog | Edit mode, reject action |
| 5-4 Post-Approval Side Effects & Real-Time Updates | Backlog | Cloud Function triggers on approval |
| 5-5 Batch Approval, Approve All, Mobile Review | Backlog | ApproveAllBar, mobile full-screen review |

**Epic 6: Inventory Management & WAC Engine — BACKLOG**

| Story | Status | Description |
|---|---|---|
| 6-1 Inventory Data Model & Item Management | Backlog | Schema, CRUD, Zustand store |
| 6-2 Restock & WAC Recalculation | Backlog | Restock form, WAC math |
| 6-3 Scoop Action (Consume Inventory → Work Orders) | Backlog | ScoopModal, cost calculation |
| 6-4 Audit Log & Waste Tracking | Backlog | inventory_log, waste/scrap logging |

**Epic 7: Overhead, Tax Intelligence & Forward Projections — BACKLOG**

| Story | Status | Description |
|---|---|---|
| 7-1 Overhead Data Model & Expense Management | Backlog | Schema, CRUD, categories |
| 7-2 Monthly Overhead Burn Rate & Trends | Backlog | Burn rate visualization |
| 7-3 Tax Jar Configuration & Osek Patur Alert | Backlog | Tax calculation, threshold alerts |
| 7-4 Forward Financial Projection | Backlog | Cash flow modeling |

### 5.2 What's Built and Working

1. **Project scaffold** — Vite 7 + React 19 + TypeScript 5.9 (strict)
2. **Design system** — Full SCSS token system (colors, typography, spacing, shadows, transitions, breakpoints), mixins, animations, accessibility utilities, Fredoka variable font (Latin + Hebrew subsets)
3. **Firebase initialization** — App, Auth, Firestore, Storage instances configured
4. **Authentication** — Google Sign-in with UID whitelist, AuthGuard route protection
5. **Navigation shell** — TopNav (desktop), BottomNav (mobile), PageShell layout (partially — in progress)
6. **Routing** — All 6 routes defined with nested layout
7. **CI/CD** — GitHub Actions for lint+test on PR, Cloud Functions deploy on push
8. **Placeholder pages** — All feature pages exist as placeholders with icons and "coming soon" messages

### 5.3 What's Planned But Not Started

- Everything in Epics 2-7 (see above)
- i18n configuration and translations
- All Zustand store implementations (currently empty placeholders)
- All type/schema definitions (currently empty placeholders)
- All utility functions (currency, dates, margins, WAC, taxJar)
- All shared UI components (Button, Card, Badge, Input, Table, Toast, Skeleton)
- All Cloud Functions
- Firestore data operations
- Gemini AI integration

### 5.4 Known Issues

- No known bugs (the built portion is infrastructure/scaffold)
- Type files are empty placeholders — need implementation before feature work
- `App.tsx` is currently unused (router bypasses it via `main.tsx` → `RouterProvider`)

---

## 6. Coding Conventions & Patterns

### 6.1 Naming Conventions

**Files:**

| Type | Convention | Example |
|---|---|---|
| React components | PascalCase `.tsx` | `GhostTextField.tsx`, `KpiCard.tsx` |
| SCSS modules | PascalCase `.module.scss` | `GhostTextField.module.scss` |
| Hooks | camelCase `use` prefix `.ts` | `useAuth.ts`, `useWorkOrders.ts` |
| Tests | Same name + `.test.tsx`/`.test.ts` | `Button.test.tsx`, `useAuth.test.ts` |
| Utilities | camelCase `.ts` | `currency.ts`, `wac.ts` |
| Stores | camelCase `use` + `Store` `.ts` | `useTransactionStore.ts` |
| Types | camelCase `.ts` | `workOrder.ts`, `transaction.ts` |
| SCSS partials | `_` prefix | `_variables.scss`, `_mixins.scss` |

**Code:**

| Type | Convention | Example |
|---|---|---|
| Components | PascalCase | `GhostTextField`, `KpiCard` |
| Component props | PascalCase + `Props` | `TopNavProps` |
| Hooks | `use` prefix, camelCase | `useAuth()`, `useWorkOrders()` |
| Zustand stores | `use` prefix + `Store` | `useTransactionStore` |
| Utility functions | camelCase | `toMinorUnits()`, `formatCurrency()` |
| Constants | UPPER_SNAKE_CASE | `TAX_FLAT_RATE`, `CONFIDENCE_THRESHOLD` |
| Types/Interfaces | PascalCase, no `I` prefix | `Transaction`, `WorkOrder` |
| Zod schemas | camelCase + `Schema` | `transactionSchema`, `workOrderSchema` |
| SCSS class names | camelCase (in module) | `.ghostField`, `.kpiValue` |

**Firestore:**

| Type | Convention | Example |
|---|---|---|
| Collection names | snake_case, plural | `work_orders`, `inventory_log` |
| Document fields | camelCase | `vendorName`, `workOrderId` |
| Currency fields | Suffix with `Agora` | `amountAgora`, `wacAgora` |
| Timestamp fields | Suffix with `At` | `createdAt`, `approvedAt` |
| Boolean fields | Prefix with `is`/`has` | `isConfirmed`, `hasAttachment` |
| Reference fields | Suffix with `Id`/`Ref` | `workOrderId`, `sourceEmailRef` |

**Routes:** kebab-case — `/work-orders`, `/work-orders/:id`

**i18n keys:** dot-notation, nested — `dashboard.kpi.netProfit`, `review.ghostText.confirm`

### 6.2 Component Structure

**All components are functional** (no class components).

**Standard component pattern:**
```typescript
import styles from './ComponentName.module.scss';

interface ComponentNameProps {
  /** JSDoc prop description */
  propName: string;
}

export function ComponentName({ propName }: ComponentNameProps) {
  return (
    <div className={styles.wrapper}>
      {propName}
    </div>
  );
}
```

**Key rules:**
- Named exports only (no default exports for components)
- Props interface defined in same file
- SCSS Module import for all styling
- JSDoc comments on props

### 6.3 Props Patterns

- Props interfaces defined with JSDoc `/** */` comments
- Optional props use `?` and provide defaults via destructuring
- Children passed via `children?: React.ReactNode` when needed
- Event handlers named `on` + verb: `onClick`, `onConfirm`, `onReject`

### 6.4 Error Handling

Three tiers:

| Tier | Pattern | Use Case |
|---|---|---|
| Component crash | React Error Boundary → fallback UI | Unexpected render error |
| Operation failure | Toast notification with retry action | "Failed to save — Retry" |
| Validation error | Inline field error (red border + text) | "Amount must be positive" |

Cloud Functions use `functions.https.HttpsError` with structured error codes.

### 6.5 Form Handling

- **Complex forms:** React Hook Form (Work Order creation, manual transactions, inventory entry)
- **Ghost Text:** Custom controlled components (not React Hook Form)
- **Validation:** Zod schemas integrated with React Hook Form via resolver

### 6.6 Styling Approach

- **SCSS Modules** — Every component has a co-located `.module.scss` file
- **No CSS-in-JS, no Tailwind**
- **Design tokens** in `_variables.scss` (auto-imported via Vite `additionalData`)
- **Mixins** in `_mixins.scss` (auto-imported via Vite `additionalData`)
- **CSS Custom Properties** defined in `:root` in `global.scss`
- **CSS logical properties** used throughout for RTL support (`padding-inline`, `margin-block`, `border-block-start`, `inset-inline`, etc.)
- **BEM-like naming** but with camelCase inside modules

### 6.7 TypeScript Usage

- **Strict mode** enabled (`strict: true` in tsconfig)
- Types defined in `src/types/*.ts` with Zod schemas for runtime validation
- `type` keyword preferred over `interface` for data shapes (since Zod infers types)
- `interface` used for component props
- No `I` prefix on interfaces
- Path alias `@/` for all imports
- `import type` for type-only imports (enforced by `verbatimModuleSyntax`)

### 6.8 Import Rules

- Use `@/` alias for all imports (never relative paths deeper than 2 levels)
- Import from barrel files (directory), not individual files
- Features never import from other features

```typescript
// Good
import { Button, Card } from '@/components';
import { useAuth } from '@/features/auth';

// Bad
import { Button } from '@/components/Button/Button';
import { useWorkOrders } from '@/features/work-orders/hooks/useWorkOrders';
```

---

## 7. Integration with TailorPlayed

### 7.1 Relationship

TP-FOS is a **completely standalone project** — it is NOT part of a monorepo. It has:
- Its own Git repository
- Its own `package.json` and dependencies
- Its own Firebase project (`tailor-played`)
- Its own Vercel deployment (planned: `fos.tailorplayed.com`)

### 7.2 Connection Points

| Integration | How |
|---|---|
| **Domain** | `fos.tailorplayed.com` subdomain (CNAME via Porkbun → Vercel) |
| **Firebase project** | Shared Firebase project name `tailor-played` but could be separate |
| **Google Auth** | Same Google accounts (Gal + Ben) across TailorPlayed and FOS |
| **Email** | Designated mailboxes under `@tailorplayed.com` domain |
| **Summit receipts** | Revenue enters FOS via email ingestion from Summit notification emails |

### 7.3 How Orders Enter FOS

Orders from the main TailorPlayed business enter FOS through email:
1. **Revenue (Summit):** Summit generates receipts → sends email notification → email arrives at `orders@tailorplayed.com` → FOS AI processes it → creates transaction → links to Work Order revenue
2. **Expenses:** Vendor invoices arrive at designated mailboxes → FOS AI processes → creates pending review transaction

There is **no direct API integration** between TailorPlayed's main site and FOS. All data flows through email.

### 7.4 Shared Data

- No shared database or API
- No shared code or packages
- The only shared resource is the Google Workspace domain (`tailorplayed.com`)

---

## 8. Technical Decisions & Challenges

### 8.1 Technology Choices and Rationale

| Decision | Choice | Why |
|---|---|---|
| **React (not Angular/Vue)** | React SPA | Simpler for internal tool. No SSR needed. Rich ecosystem. Developer familiarity. |
| **No Next.js** | Plain React SPA | PRD explicitly excludes SSR. No SEO needed. Unnecessary complexity for 2-user internal tool. |
| **Firebase (not Supabase/custom)** | Firebase ecosystem | Real-time database (Firestore), serverless functions, Google Auth, Storage — all integrated. Already had Google Cloud account. |
| **Firestore (not PostgreSQL)** | NoSQL | Real-time listeners (`onSnapshot`) for < 2s updates. Denormalization preferred over joins for this use case. Simple security rules. |
| **Vite (not Webpack/CRA)** | Vite 7 | CRA is deprecated. Vite is the standard. Native SCSS support. HMR. Fast builds. |
| **Zustand (not Redux/Context)** | Zustand 5 | No provider wrapper needed. No unnecessary re-renders. DevTools for debugging. ~1KB. Way simpler than Redux for 2-user app. |
| **SCSS Modules (not Tailwind/CSS-in-JS)** | SCSS Modules | TailorPlayed has an existing design system specification. Custom tokens need to be expressed. No utility classes needed. Type-safe via sass-dts plugin. |
| **Zod (not Yup/io-ts)** | Zod 4 | TypeScript type inference for free. Works both client and server. JSON-friendly for Firestore data. |
| **React Hook Form (not Formik)** | RHF 7 | Better performance (uncontrolled by default). Built-in Zod resolver. Smaller bundle. |
| **Phosphor Icons (not Heroicons/Lucide)** | Phosphor | Rich set, multiple weights (thin to bold), React-native components. Design system specifies it. |
| **Gemini 2.5 Pro (not GPT-4)** | Gemini | 1M token context window. Good structured output. Function calling support. Server-side via Cloud Functions. Google ecosystem alignment. |
| **Vercel (not Firebase Hosting)** | Vercel | Consistent with existing TailorPlayed infrastructure. Same dashboard, same workflow. Git push → auto-deploy. |
| **Gmail API + Pub/Sub (not Zapier/Make)** | Native Google APIs | Already in Google Workspace. No third-party service dependency. Push-based notifications. |

### 8.2 Known Challenges

| Challenge | Impact | Mitigation |
|---|---|---|
| Gmail → Gemini pipeline complexity | Core system blocked | Build and validate ingestion first. If pipeline works, rest is UI. |
| Gemini Hebrew OCR reliability | Misclassified invoices | Test with real Hebrew receipts early. Fallback: manual entry. |
| WAC rounding over time | Margin drift | High-precision integer arithmetic. Validate against manual calculations. |
| RTL/LTR mixed content | Broken layouts | CSS logical properties throughout. Test bilingual scenarios early. |
| Currency conversion staleness | Cost calculations off | Flag as "Estimated", show rate used. Last-known-rate fallback. |
| Cloud Functions cold starts | Slow AI processing | Optimize function size. Monitor cold start times. |

### 8.3 Trade-offs Made

1. **Flat Firestore collections over subcollections** — Makes cross-entity dashboard queries possible, at the cost of no built-in parent-child relationships
2. **Manual Zod schema sync (client ↔ functions)** — Copy instead of shared package. Simpler but risk of drift.
3. **Client-side WAC calculation with server verification** — Fast UX (< 500ms) but requires double-check Cloud Function
4. **2-user hardcoded whitelist** — No RBAC system. Simple but not scalable. Acceptable for this use case.
5. **No offline/PWA** — Keeps architecture simple. Acceptable since this is used in office/home with internet.

---

## 9. User Experience & UI

### 9.1 Main Screens/Views

| Route | Page | Description |
|---|---|---|
| `/login` | LoginScreen | Google Sign-in button, centered card |
| `/` | DashboardPage | Financial cockpit: Hero Stat, KPI cards, Project Health Table |
| `/work-orders` | WorkOrdersPage | List of all Work Orders with status and margin |
| `/work-orders/:id` | WorkOrderDetailPage | Full Work Order detail with Nutrition Label |
| `/inventory` | InventoryPage | Inventory items, stock levels, WAC values |
| `/overhead` | OverheadPage | Overhead expenses by category, burn rate |
| `/review` | ReviewPage | Pending transaction review queue (Ghost Text) |

### 9.2 Navigation Structure

**Desktop (768px+):**
- Sticky top bar with segmented pill tabs: Dashboard | Work Orders | Inventory | Overhead
- Pending review badge (orange pill) in top-right corner
- No sidebar

**Mobile (< 768px):**
- Same sticky top bar (simplified — logo + pending badge, no tabs)
- Fixed bottom navigation: Home | Orders | Review | More
- Full-screen views for detail pages

### 9.3 Mobile-First or Desktop-First?

**Mobile-first responsive design.** Breakpoints use `min-width` (mobile-first pattern):

| Breakpoint | Size | Behavior |
|---|---|---|
| Default | < 640px | Mobile layout, bottom nav, single column |
| `$bp-sm` | 640px | Minor adjustments |
| `$bp-md` | 768px | Bottom nav hidden, top nav pills appear, tablet layout |
| `$bp-lg` | 1024px | Wider padding, larger tab sizes |
| `$bp-xl` | 1280px | Content max-width 1080px |

### 9.4 Design System — Visual Language

**Color Palette:**
```scss
// Backgrounds (Dark-to-Light Elevation)
$bg-primary: #120022;      // Darkest — page background
$bg-secondary: #1e0038;    // Navigation bars
$bg-tertiary: #2d0052;     // Card surfaces
$bg-elevated: #3d006d;     // Active states, elevated elements

// Brand & Accent
$gold: #fcb700;             // Primary brand color
$gold-light: #ffd54f;       // Light gold
$brand-purple: #3c0366;     // Brand purple

// Semantic (Financial)
$success: #00ba7b;           // Profit, healthy margins
$warning: #fa9700;           // Caution, pending review
$error: #ff4d6d;             // Loss, at-risk margins
$info: #2a7eff;              // Informational

// Text Hierarchy
$text-primary: #ffd54f;                  // Gold — headings, primary text
$text-secondary: rgba(255, 213, 79, 0.7); // Muted gold — secondary text
$text-muted: rgba(255, 213, 79, 0.5);    // Dimmer gold — tertiary text
```

**Typography:**
- Font: Fredoka (variable, 300-700 weight) — self-hosted with Latin + Hebrew subsets
- Font sizes: `$text-2xl` (40px) → `$text-xs` (14px)
- Weights: Regular (400), Medium (500), Semibold (600)
- Headings: Gold color, semibold, tight line height

**Spacing Scale:** 4px / 8px / 16px / 24px / 32px / 48px / 64px

**Border Radius:** 8px (sm) / 12px (md) / 16px (lg) / 24px (xl) / 9999px (full/pill)

**Shadows:** Small, Medium, Large, Gold Glow

### 9.5 Accessibility

- **44px minimum touch targets** on all interactive elements
- **Gold focus rings** (2px solid, 2px offset) via `:focus-visible`
- **`prefers-reduced-motion`** support — decorative animations disabled, essential animations (spinners) preserved
- **Forced colors (high contrast)** mode support
- **Screen reader utilities** — `.sr-only` class, `.visually-hidden` mixin
- **Semantic HTML** — `<nav>`, `role="tablist"`, `role="tab"`, `aria-label`
- **No color-only indicators** — financial states always paired with text labels + icons

### 9.6 UI Library

**No third-party UI library** (no MUI, Chakra, Ant Design). All components are custom-built from the TailorPlayed design system specification using SCSS Modules.

Planned shared components:
- Button, Card, Badge (StatusBadge, ConfidenceBadge), Input (Input, Select, SearchInput), Table (Table, SortableHeader), Toast (Toast, ToastContainer), Skeleton, ErrorBoundary

---

## 10. Testing & Quality

### 10.1 Testing Framework

- **Unit/Component Tests:** Vitest 4.0 + React Testing Library
- **Test Environment:** jsdom
- **Setup File:** `vitest.setup.ts` imports `@testing-library/jest-dom/vitest`
- **Test Location:** Co-located with source files (`*.test.tsx` next to `*.tsx`)
- **Run Command:** `npm run test` (single run) or `npm run test:watch` (watch mode)
- **Integration/E2E Tests:** Not yet set up (deferred to post-MVP — Playwright/Cypress)

### 10.2 Test Configuration

```typescript
// vitest.config.ts
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,          // No need to import describe/it/expect
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts',
    include: ['src/**/*.test.{ts,tsx}'],
    css: false,             // Don't process CSS in tests
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
});
```

### 10.3 Linting & Formatting

**ESLint:** Flat config (`eslint.config.js`)
- `@eslint/js` recommended
- `typescript-eslint` recommended
- `react-hooks` recommended
- `react-refresh` for Vite
- Ignores: `dist`, `functions`, `node_modules`

**Prettier:** `.prettierrc`
- Single quotes, trailing commas, 100 char print width, 2-space tabs, LF line endings

### 10.4 Git Workflow

- **Main branch:** `main`
- **Remote:** `origin/main`
- **CI on PR:** Lint + Test + Type-check + Build (GitHub Actions)
- **Cloud Functions deploy:** On push to `main` when `functions/**` changes

### 10.5 CI/CD Setup

**CI Pipeline (`ci.yml`):**
```yaml
on: pull_request → branches: [main]
steps:
  1. Checkout
  2. Setup Node 20
  3. npm ci
  4. npm run lint
  5. npm run test
  6. npx tsc -b
  7. npm run build
```

**Cloud Functions Deploy (`deploy-functions.yml`):**
```yaml
on: push → branches: [main], paths: ['functions/**']
steps:
  1. Checkout
  2. Setup Node 20
  3. npm ci (root)
  4. npm ci (functions)
  5. npm run build (functions)
  6. firebase deploy --only functions (using FIREBASE_TOKEN secret)
```

---

## 11. Environment & Deployment

### 11.1 Environment Variables

**Client-side (`.env.local`):**
```
VITE_FIREBASE_API_KEY=<your_api_key>
VITE_FIREBASE_AUTH_DOMAIN=<your_project_id>.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=<your_project_id>
VITE_FIREBASE_STORAGE_BUCKET=<your_project_id>.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=<your_sender_id>
VITE_FIREBASE_APP_ID=<your_app_id>
VITE_WHITELISTED_UIDS=uid1,uid2  (optional, overrides hardcoded whitelist)
```

**Server-side (Cloud Functions):**
- Gemini API key — via `firebase functions:config:set`
- Gmail OAuth credentials — via Cloud Functions environment config

### 11.2 Development Setup Instructions

```bash
# 1. Clone the repository
git clone <repo-url>
cd tp-fos

# 2. Install frontend dependencies
npm install

# 3. Install Cloud Functions dependencies
cd functions && npm install && cd ..

# 4. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Firebase project values

# 5. Start dev server
npm run dev

# 6. (Optional) Start Firebase emulators
firebase emulators:start
```

### 11.3 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Type-check (`tsc -b`) and build for production |
| `npm run lint` | Run ESLint |
| `npm run test` | Run Vitest test suite (single run) |
| `npm run test:watch` | Run Vitest in watch mode |
| `npm run preview` | Preview production build locally |

**Functions scripts:**

| Command | Description |
|---|---|
| `npm run build` | Compile TypeScript |
| `npm run serve` | Build + start Firebase emulators (functions only) |
| `npm run deploy` | Deploy functions to Firebase |
| `npm run logs` | View Cloud Functions logs |

### 11.4 Build Process

```bash
# Production build
npm run build
# Equivalent to: tsc -b && vite build
# Output: dist/ directory
```

Vite handles:
- TypeScript transpilation (esbuild for dev, Rollup for production)
- SCSS compilation
- Tree-shaking
- Code splitting
- Asset optimization

### 11.5 Deployment Process

**Frontend (Vercel):**
- Git push to `main` → Vercel auto-deploys
- Build command: `tsc -b && vite build`
- Output: `dist/`
- Domain: `fos.tailorplayed.com` (planned)

**Cloud Functions (Firebase):**
- Git push to `main` with changes in `functions/**` → GitHub Actions triggers deployment
- Uses `firebase deploy --only functions` with `FIREBASE_TOKEN` secret
- Node 20 runtime

### 11.6 Monitoring/Logging

- **Cloud Functions:** Firebase Cloud Logging (built-in)
- **Client:** `console.error` / `console.warn` for auth errors
- **Planned:** Firebase Performance Monitoring (post-MVP)
- **Email Pipeline:** `email_log` collection tracks every email with processing status

---

## 12. Documentation

### 12.1 Existing Documentation

| Document | Location | Content |
|---|---|---|
| README.md | Root | Tech stack, getting started, scripts, project structure, conventions |
| PRD | `_bmad-output/planning-artifacts/prd.md` | Full product requirements (50 FRs, NFRs, user journeys) |
| Architecture | `_bmad-output/planning-artifacts/architecture.md` | All architectural decisions, patterns, project structure, validation |
| Epics | `_bmad-output/planning-artifacts/epics.md` | Full epic/story breakdown with FR mapping |
| UX Design | `_bmad-output/planning-artifacts/ux-design-specification.md` | Complete UX specification |
| Sprint Status | `_bmad-output/implementation-artifacts/sprint-status.yaml` | Current development progress tracker |
| Story Files | `_bmad-output/implementation-artifacts/1-*.md` | Individual story implementation details |
| Design System Spec | `user-data/design-system.md` | Original design system specification |
| User PRD | `user-data/user-prd.md` | Original user-written PRD (v2.0) |
| User Summary | `user-data/user-summarize.md` | User's own summary document |
| Email Patterns | `user-data/tp-mails.md` | Email patterns and mailbox configuration |

### 12.2 Code Comments Philosophy

- **JSDoc on component props** — Every prop has a `/** */` description
- **Section headers in SCSS** — `// ═══ SECTION NAME ═══` pattern
- **Placeholder comments in empty files** — `// Module description placeholder`
- **Critical comments** — `// CRITICAL:`, `// IMPORTANT:` for non-obvious decisions
- **No excessive comments** — Code should be self-documenting; comments explain "why" not "what"

### 12.3 API Documentation

No REST API — the system uses direct Firestore SDK reads/writes protected by security rules. Cloud Functions are triggered by events (Pub/Sub, Firestore triggers, Cloud Scheduler), not HTTP endpoints.

HTTPS Callable functions (planned for admin actions) will be documented as they are implemented.

---

## Appendix A: Design System Token Reference

### Colors
| Token | Value | Usage |
|---|---|---|
| `$bg-primary` | `#120022` | Page background |
| `$bg-secondary` | `#1e0038` | Nav bars |
| `$bg-tertiary` | `#2d0052` | Card surfaces |
| `$bg-elevated` | `#3d006d` | Active/elevated states |
| `$gold` | `#fcb700` | Primary brand |
| `$gold-light` | `#ffd54f` | Light brand / text-primary |
| `$brand-purple` | `#3c0366` | Brand purple |
| `$success` | `#00ba7b` | Profit / healthy |
| `$warning` | `#fa9700` | Caution / pending |
| `$error` | `#ff4d6d` | Loss / at-risk |
| `$info` | `#2a7eff` | Informational |

### Typography
| Token | Value |
|---|---|
| `$font-family` | `'Fredoka', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif` |
| `$text-2xl` | `2.5rem` (40px) |
| `$text-xl` | `1.875rem` (30px) |
| `$text-lg` | `1.25rem` (20px) |
| `$text-base` | `1.125rem` (18px) |
| `$text-sm` | `1rem` (16px) |
| `$text-xs` | `0.875rem` (14px) |

### Spacing
| Token | Value |
|---|---|
| `$space-xs` | 4px |
| `$space-sm` | 8px |
| `$space-md` | 16px |
| `$space-lg` | 24px |
| `$space-xl` | 32px |
| `$space-2xl` | 48px |
| `$space-3xl` | 64px |

### Breakpoints
| Token | Value |
|---|---|
| `$bp-sm` | 640px |
| `$bp-md` | 768px |
| `$bp-lg` | 1024px |
| `$bp-xl` | 1280px |

---

## Appendix B: Key File Contents Reference

### Firebase Initialization (`src/services/firebase.ts`)
```typescript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
```

### Auth Service (`src/services/auth.ts`)
```typescript
// Key function: signInWithGoogle
// Uses GoogleAuthProvider + signInWithPopup
// Checks UID against WHITELISTED_UIDS
// Unauthorized users are signed out immediately
// WHITELISTED_UIDS overridable via VITE_WHITELISTED_UIDS env var
// Fallback: ['MKeVSMwPzAVSUg8VGy9EG2L72ha2', '3lO30cF0OtNBsfTiNWZ35YqdI7l2']
```

### Auth Hook (`src/features/auth/hooks/useAuth.ts`)
```typescript
// Returns: { user: User | null, loading: boolean, signIn: () => Promise<User>, signOut: () => Promise<void> }
// Uses: onAuthStateChanged listener with cleanup
// signIn and signOut wrapped in useCallback
```

---

*End of Knowledge Base. This document should be updated as development progresses through the epic backlog.*
