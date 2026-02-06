# TP-FOS — TailorPlayed Financial Operations System

A single-user financial operations dashboard for a small tailoring business. Built with **Vite 7 + React 19 + TypeScript 5.9** (strict mode), backed by **Firebase** (Firestore, Auth, Functions, Storage).

## Tech Stack

| Layer | Technology |
|---|---|
| Build | Vite 7, TypeScript 5.9 (strict) |
| UI | React 19, SCSS Modules, Phosphor Icons |
| Routing | React Router 7 (declarative SPA) |
| State | Zustand 5 |
| Backend | Firebase (Firestore, Auth, Functions, Storage) |
| i18n | react-i18next (Hebrew / English) |
| Validation | Zod |
| Testing | Vitest, React Testing Library |

## Getting Started

```bash
# Install dependencies
npm install

# Install Cloud Functions dependencies
cd functions && npm install && cd ..

# Start dev server
npm run dev

# Start Firebase emulators (requires Firebase CLI)
firebase emulators:start
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Type-check and build for production |
| `npm run lint` | Run ESLint |
| `npm run test` | Run Vitest test suite |
| `npm run test:watch` | Run Vitest in watch mode |
| `npm run preview` | Preview production build locally |

## Environment Variables

Copy `.env.example` to `.env.local` and fill in your Firebase project values:

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

## Project Structure

```
src/
├── components/     # Shared UI components (Button, Card, Input, etc.)
├── features/       # Feature modules (dashboard, work-orders, review, inventory, overhead, auth)
├── hooks/          # Shared custom hooks
├── lib/            # Utility functions (currency, dates, margins, WAC, tax)
├── services/       # Firebase service layer (auth, firestore, storage)
├── stores/         # Zustand state stores
├── types/          # TypeScript type definitions
├── i18n/           # Internationalization config and translations
├── styles/         # Global SCSS, design tokens, mixins
├── App.tsx         # Root component
├── router.tsx      # Route definitions
└── main.tsx        # Entry point
functions/          # Firebase Cloud Functions (separate package)
```

## Conventions

- **Path aliases**: `@/` resolves to `src/` — use it for all imports
- **Barrel exports**: Every directory has an `index.ts` — import from the directory
- **SCSS Modules**: All component styles use `.module.scss` — no CSS-in-JS, no Tailwind
- **Modular Firebase SDK**: Tree-shakeable imports only — never use compat API
- **Co-located tests**: Test files live next to source files (`Component.test.tsx`)
