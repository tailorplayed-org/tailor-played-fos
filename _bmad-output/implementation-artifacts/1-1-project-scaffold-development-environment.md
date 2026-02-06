# Story 1.1: Project Scaffold & Development Environment

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **developer**,
I want a fully configured Vite + React TypeScript project with Firebase, Vercel deployment, linting, testing, and the complete directory structure,
So that all future development has a stable, consistent foundation to build on.

## Acceptance Criteria

1. **Project Initialization**: `npm create vite@latest tp-fos -- --template react-ts` produces a project that compiles with zero errors in TypeScript strict mode, and `npm run dev` starts Vite dev server with HMR.

2. **Firebase Configuration**: Firebase SDK packages installed (`firebase`). `firebase.json` configured for Firestore, Auth, Storage, and Functions emulators. `.firebaserc` points to `tp-fos`. `firebase emulators:start` launches all emulators.

3. **Cloud Functions Directory**: `/functions` has its own `package.json` and `tsconfig.json`. `functions/src/index.ts` exports an empty entry point that compiles.

4. **Path Aliases**: `@/` resolves to `src/` in both `tsconfig.json` and `vite.config.ts`. `import { x } from '@/lib'` compiles and resolves.

5. **Linting & Formatting**: `npm run lint` passes with zero warnings. `.eslintrc.cjs` and `.prettierrc` enforce consistent code style.

6. **Testing Framework**: `npm run test` executes with zero failures. `vitest.config.ts` supports React Testing Library and path aliases.

7. **Directory Structure**: All directories from Architecture spec exist with `index.ts` barrel exports: `src/components/`, `src/features/` (dashboard, work-orders, review, inventory, overhead, auth), `src/hooks/`, `src/lib/`, `src/services/`, `src/stores/`, `src/types/`, `src/i18n/`, `src/styles/`, `public/fonts/`.

8. **Environment Config**: `.env.example` documents all required `VITE_FIREBASE_*` variables. `.env.local` is in `.gitignore`.

9. **Build Output**: `npm run build` produces a deployable static SPA in `dist/`.

## Tasks / Subtasks

- [x] Task 1: Initialize Vite project (AC: #1)
  - [x] Run `npm create vite@latest tp-fos -- --template react-ts`
  - [x] Verify TypeScript strict mode compiles cleanly
  - [x] Verify `npm run dev` starts with HMR

- [x] Task 2: Install all project dependencies (AC: #1, #2, #6)
  - [x] Install core: `firebase@12.9.0`, `react-router@7.13.x`, `zustand@5.0.11`
  - [x] Install styling: `sass`, `vite-plugin-sass-dts`
  - [x] Install i18n: `react-i18next`, `i18next`, `i18next-browser-languagedetector`
  - [x] Install icons: `@phosphor-icons/react`
  - [x] Install validation: `zod`
  - [x] Install forms: `react-hook-form`
  - [x] Install dev: `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `jsdom`
  - [x] Install dev: `@vitejs/plugin-react`

- [x] Task 3: Configure TypeScript (AC: #1, #4)
  - [x] Set `strict: true` in `tsconfig.json`
  - [x] Configure path alias `@/*` → `src/*` in `tsconfig.json` paths
  - [x] Create `tsconfig.node.json` for Vite config

- [x] Task 4: Configure Vite (AC: #1, #4, #9)
  - [x] Add `@vitejs/plugin-react` plugin
  - [x] Configure `resolve.alias` for `@/` → `src/`
  - [x] Configure `css.preprocessorOptions.scss.additionalData` to auto-import `_variables.scss` and `_mixins.scss`
  - [x] Add `vite-plugin-sass-dts` plugin for SCSS module type generation

- [x] Task 5: Configure Firebase project files (AC: #2)
  - [x] Create `firebase.json` with Firestore, Auth, Storage, Functions, and Emulator config
  - [x] Create `.firebaserc` pointing to `tp-fos`
  - [x] Create `firestore.rules` with placeholder `isAdmin()` function
  - [x] Create `storage.rules` with placeholder `isAdmin()` function

- [x] Task 6: Set up Cloud Functions directory (AC: #3)
  - [x] Initialize `functions/package.json` with TypeScript, firebase-functions, firebase-admin
  - [x] Create `functions/tsconfig.json` targeting Node 20+
  - [x] Create `functions/src/index.ts` with empty export
  - [x] Create `functions/src/shared/` directory with placeholder files (`schemas.ts`, `currency.ts`, `types.ts`)
  - [x] Create `functions/src/config.ts` placeholder

- [x] Task 7: Create complete directory structure with barrel exports (AC: #7)
  - [x] Create `src/components/` with subdirectories (Button, Card, Badge, Input, Table, Toast, Skeleton, Layout, ErrorBoundary) each with `index.ts`
  - [x] Create `src/features/` with subdirectories (dashboard, work-orders, review, inventory, overhead, auth) each with `components/`, `hooks/`, and `index.ts`
  - [x] Create `src/hooks/index.ts`
  - [x] Create `src/lib/index.ts` (with placeholder files: `currency.ts`, `wac.ts`, `dates.ts`, `margins.ts`, `taxJar.ts`)
  - [x] Create `src/services/index.ts` (with placeholder files: `firebase.ts`, `firestore.ts`, `auth.ts`, `storage.ts`)
  - [x] Create `src/stores/index.ts` (with placeholder files: `useTransactionStore.ts`, `useWorkOrderStore.ts`, `useInventoryStore.ts`, `useOverheadStore.ts`, `useUIStore.ts`)
  - [x] Create `src/types/index.ts` (with placeholder files: `transaction.ts`, `workOrder.ts`, `inventory.ts`, `overhead.ts`, `email.ts`, `config.ts`)
  - [x] Create `src/i18n/` with `config.ts`, `he.json`, `en.json` placeholders
  - [x] Create `src/styles/` with `_variables.scss`, `_mixins.scss`, `_animations.scss`, `_accessibility.scss`, `global.scss` placeholders
  - [x] Create `public/fonts/` directory
  - [x] Create root `src/App.tsx`, `src/main.tsx`, `src/router.tsx`, `src/vite-env.d.ts`

- [x] Task 8: Configure ESLint & Prettier (AC: #5)
  - [x] Create `eslint.config.js` with TypeScript + React rules (flat config, Vite 7 standard)
  - [x] Create `.prettierrc` with project formatting rules
  - [x] Add `lint` script to `package.json`
  - [x] Verify `npm run lint` passes with zero warnings

- [x] Task 9: Configure Vitest (AC: #6)
  - [x] Create `vitest.config.ts` with jsdom environment, globals, path aliases
  - [x] Create `vitest.setup.ts` with React Testing Library cleanup and jest-dom matchers
  - [x] Add `test` script to `package.json`
  - [x] Create a sample test to verify setup works
  - [x] Verify `npm run test` passes

- [x] Task 10: Configure environment variables (AC: #8)
  - [x] Create `.env.example` documenting: `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`
  - [x] Ensure `.env.local` is in `.gitignore`

- [x] Task 11: Configure CI/CD files (AC: #9)
  - [x] Create `.github/workflows/ci.yml` for lint + test on PR
  - [x] Create `.github/workflows/deploy-functions.yml` for Firebase Functions deploy
  - [x] Verify `npm run build` produces `dist/` with static SPA

- [x] Task 12: Final validation (AC: all)
  - [x] `tsc --noEmit` passes with zero errors
  - [x] `npm run lint` passes with zero warnings
  - [x] `npm run test` passes
  - [x] `npm run build` succeeds
  - [x] All barrel exports resolve correctly

## Dev Notes

### Architecture Compliance

- **Hosting Split**: Frontend on Vercel (`fos.tailorplayed.com`), backend on Firebase (`tp-fos` project). These are separate deployments — this story sets up both foundations.
- **No SSR/Next.js**: This is a pure Vite SPA. React Router v7 in declarative mode only. No server-side rendering.
- **Firebase Emulator Suite**: Must be fully configured for local development. No calls to production during development.
- **Modular Firebase SDK**: Use `firebase@12.9.0` modular/tree-shakeable imports exclusively. Never use the namespaced (compat) API.

### Critical Technical Constraints

- **TypeScript Strict Mode**: `strict: true` in `tsconfig.json` is mandatory. All code must compile cleanly.
- **SCSS Modules only**: No CSS-in-JS, no Tailwind, no third-party UI library. All styling via `.module.scss` files with the TailorPlayed design system.
- **CSS Custom Properties**: SCSS variables must also generate CSS custom properties for runtime theming.
- **Path aliases**: `@/` → `src/` must work in both TypeScript compilation AND Vite bundling. Configure in both `tsconfig.json` (paths) and `vite.config.ts` (resolve.alias).
- **Barrel exports**: Every directory with multiple exports needs an `index.ts`. Consumers import from the directory, not individual files.

### Dependency Versions (Verified Feb 6, 2026)

| Package | Version | Role |
|---|---|---|
| vite | ^7.3.0 | Build tool, dev server, SCSS support |
| @vitejs/plugin-react | latest | React Fast Refresh + JSX transform |
| react | ^19.0.0 | UI framework |
| react-dom | ^19.0.0 | DOM renderer |
| typescript | ^5.0.0 | Type safety (strict mode) |
| react-router | ^7.13.0 | SPA routing (declarative mode, NOT framework mode) |
| firebase | 12.9.0 | Firestore, Auth, Functions, Storage (modular API) |
| zustand | ^5.0.11 | Client-side state management |
| sass | latest | SCSS compilation (Vite native support) |
| vite-plugin-sass-dts | latest | TypeScript definitions for SCSS Modules |
| @phosphor-icons/react | latest | Icon library (sole icon source, no emojis in UI) |
| react-i18next | latest | i18n framework for Hebrew/English |
| i18next | latest | i18n core |
| zod | latest | Schema validation (shared client + functions) |
| react-hook-form | latest | Form handling |
| vitest | latest | Testing framework (Vite-native) |
| @testing-library/react | latest | React component testing |
| @testing-library/jest-dom | latest | DOM matchers |
| @testing-library/user-event | latest | User interaction simulation |
| jsdom | latest | DOM environment for tests |

### Firebase Configuration Details

**firebase.json structure:**
```json
{
  "firestore": { "rules": "firestore.rules" },
  "storage": { "rules": "storage.rules" },
  "functions": { "source": "functions" },
  "emulators": {
    "auth": { "port": 9099 },
    "firestore": { "port": 8080 },
    "storage": { "port": 9199 },
    "functions": { "port": 5001 },
    "ui": { "enabled": true }
  }
}
```

**Firestore Rules placeholder:**
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAdmin() {
      return request.auth != null && request.auth.uid in ['UID_1', 'UID_2'];
    }
    match /{document=**} {
      allow read, write: if isAdmin();
    }
  }
}
```

### Vite Config Requirements

```typescript
// vite.config.ts key settings
{
  plugins: [react(), sassDts()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') }
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use "@/styles/variables" as *; @use "@/styles/mixins" as *;`
      }
    }
  }
}
```

**IMPORTANT**: The `additionalData` SCSS imports use `@use` (modern Sass), NOT `@import` (deprecated). All SCSS partials must use `@use`/`@forward` syntax.

### Vitest Config Requirements

```typescript
// vitest.config.ts
{
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts',
    include: ['src/**/*.test.{ts,tsx}']
  }
}
```

### Cloud Functions Setup

- `functions/` is a **separate npm package** — its own `package.json`, `tsconfig.json`
- Target Node 20+ runtime
- Install `firebase-functions`, `firebase-admin`, `typescript` in functions dir
- `functions/src/index.ts` exports nothing initially — just compiles
- Shared schemas/types are **manually copied** between client and functions (no symlinks)

### Project Structure Notes

- All directory paths from architecture.md Section "Complete Project Directory Structure" must exist
- Every subdirectory in `src/components/` must have its own `index.ts` with a placeholder export
- Every feature in `src/features/` must have `components/`, `hooks/`, and `index.ts`
- Placeholder files should have minimal valid TypeScript (export empty objects/types) to prevent import errors
- File naming: Components use PascalCase `.tsx`, hooks use camelCase `.ts`, styles use PascalCase `.module.scss`

### Anti-Patterns to Avoid

- **DO NOT** install Create React App or any CRA-related packages
- **DO NOT** use Tailwind, MUI, Chakra, or any UI framework
- **DO NOT** use the Firebase compat/namespaced API — modular only
- **DO NOT** create a Next.js or framework-mode React Router setup
- **DO NOT** use `@import` in SCSS — use `@use`/`@forward` only
- **DO NOT** create `__tests__/` directories — tests are co-located with components
- **DO NOT** use relative imports deeper than 2 levels — use `@/` path aliases
- **DO NOT** install `firebase-admin` in the client package — it's for `functions/` only
- **DO NOT** skip barrel exports — every directory needs `index.ts`

### References

- [Source: architecture.md#Starter-Template-Evaluation] — Vite + react-ts selection rationale
- [Source: architecture.md#Core-Architectural-Decisions] — Technology stack and versions
- [Source: architecture.md#Implementation-Patterns] — Naming conventions and structure patterns
- [Source: architecture.md#Complete-Project-Directory-Structure] — Full file tree
- [Source: architecture.md#Infrastructure-and-Deployment] — Vercel + Firebase hosting split
- [Source: epics.md#Story-1.1] — Full acceptance criteria with BDD format
- [Source: architecture.md#Enforcement-Guidelines] — 7 mandatory AI agent rules

## Dev Agent Record

### Agent Model Used

Claude claude-4.6-opus (Cursor)

### Debug Log References

- Sandbox restriction caused Sass native compiler to fail during `npm run build`. Resolved by running build with full permissions. CI environment (GitHub Actions) will not have this limitation.

### Completion Notes List

- **Task 1**: Scaffolded Vite 7.3.1 project with react-ts template (create-vite@8.2.0). Moved files from subdirectory to repo root.
- **Task 2**: Installed all 13 production deps and 5 dev deps. All versions verified: firebase@12.9.0, react-router@7.13.0, zustand@5.0.11, vitest@4.0.18, react@19.2.0.
- **Task 3**: `strict: true` was already set by Vite template in `tsconfig.app.json`. Added `baseUrl` and `paths` for `@/*` → `src/*` alias.
- **Task 4**: Configured `vite.config.ts` with react plugin, sass-dts plugin, `@/` path alias, and SCSS `additionalData` using `@use` syntax.
- **Task 5**: Created `firebase.json`, `.firebaserc`, `firestore.rules`, `storage.rules` per story spec.
- **Task 6**: Created `functions/` directory with `package.json` (Node 20, firebase-functions, firebase-admin), `tsconfig.json`, `src/index.ts`, `src/config.ts`, and `src/shared/` placeholders.
- **Task 7**: Created full directory structure: 9 component dirs, 6 feature dirs (each with components/hooks/index.ts), hooks, lib (5 files), services (4 files), stores (5 files), types (6 files), i18n (config + 2 JSON), styles (5 SCSS files), public/fonts. All barrel exports in place.
- **Task 8**: Used Vite 7's modern flat ESLint config (`eslint.config.js`) instead of legacy `.eslintrc.cjs`. Created `.prettierrc`. Zero lint warnings.
- **Task 9**: Created `vitest.config.ts` with jsdom, globals, path aliases, and setup file. Created `vitest.setup.ts` with jest-dom matchers. Sample App test + path alias resolution test pass.
- **Task 10**: Created `.env.example` with all 6 VITE_FIREBASE_* vars. `.env.local` already in `.gitignore`.
- **Task 11**: Created `.github/workflows/ci.yml` (lint+test+build on PR) and `deploy-functions.yml` (deploy on push to main when functions/ changed).
- **Task 12**: All validation passed: `tsc -b` zero errors, `npm run lint` zero warnings, `npm run test` 5/5 pass, `npm run build` produces `dist/`.
- **Decision**: Used `eslint.config.js` (flat config) instead of `.eslintrc.cjs` because Vite 7/create-vite@8 scaffolds flat config by default. This is the modern ESLint standard.
- **Decision**: Excluded test files from `tsconfig.app.json` with `"exclude": ["src/**/*.test.ts", "src/**/*.test.tsx"]` so test-only types (jest-dom) don't affect production build.

### File List

- package.json (new - project manifest with all deps and scripts)
- tsconfig.json (new - TypeScript project references)
- tsconfig.app.json (new - app TypeScript config with strict mode and path aliases)
- tsconfig.node.json (new - Node/Vite TypeScript config)
- vite.config.ts (new - Vite config with React, SCSS, path aliases)
- vitest.config.ts (new - Vitest config with jsdom and path aliases)
- vitest.setup.ts (new - test setup with jest-dom matchers)
- eslint.config.js (new - ESLint flat config for TS + React)
- .prettierrc (new - Prettier formatting rules)
- index.html (new - SPA entry HTML)
- .env.example (new - environment variable documentation)
- firebase.json (new - Firebase project config with emulators)
- .firebaserc (new - Firebase project alias)
- firestore.rules (new - Firestore security rules placeholder)
- storage.rules (new - Storage security rules placeholder)
- .github/workflows/ci.yml (new - CI pipeline)
- .github/workflows/deploy-functions.yml (new - Functions deploy pipeline)
- functions/package.json (new - Cloud Functions manifest)
- functions/tsconfig.json (new - Cloud Functions TypeScript config)
- functions/src/index.ts (new - Functions entry point)
- functions/src/config.ts (new - Functions config placeholder)
- functions/src/shared/schemas.ts (new - shared schemas placeholder)
- functions/src/shared/currency.ts (new - shared currency placeholder)
- functions/src/shared/types.ts (new - shared types placeholder)
- src/main.tsx (new - app entry with RouterProvider)
- src/App.tsx (new - root App component)
- src/App.test.tsx (new - App component test)
- src/router.tsx (new - React Router config)
- src/vite-env.d.ts (new - Vite + SCSS module type declarations)
- src/components/index.ts (new - components barrel)
- src/components/Button/index.ts (new)
- src/components/Card/index.ts (new)
- src/components/Badge/index.ts (new)
- src/components/Input/index.ts (new)
- src/components/Table/index.ts (new)
- src/components/Toast/index.ts (new)
- src/components/Skeleton/index.ts (new)
- src/components/Layout/index.ts (new)
- src/components/ErrorBoundary/index.ts (new)
- src/features/index.ts (new - features barrel)
- src/features/dashboard/index.ts (new)
- src/features/dashboard/components/index.ts (new)
- src/features/dashboard/hooks/index.ts (new)
- src/features/work-orders/index.ts (new)
- src/features/work-orders/components/index.ts (new)
- src/features/work-orders/hooks/index.ts (new)
- src/features/review/index.ts (new)
- src/features/review/components/index.ts (new)
- src/features/review/hooks/index.ts (new)
- src/features/inventory/index.ts (new)
- src/features/inventory/components/index.ts (new)
- src/features/inventory/hooks/index.ts (new)
- src/features/overhead/index.ts (new)
- src/features/overhead/components/index.ts (new)
- src/features/overhead/hooks/index.ts (new)
- src/features/auth/index.ts (new)
- src/features/auth/components/index.ts (new)
- src/features/auth/hooks/index.ts (new)
- src/hooks/index.ts (new)
- src/lib/index.ts (new - lib barrel)
- src/lib/currency.ts (new)
- src/lib/wac.ts (new)
- src/lib/dates.ts (new)
- src/lib/margins.ts (new)
- src/lib/taxJar.ts (new)
- src/lib/alias-test.test.ts (new - path alias resolution test)
- src/services/index.ts (new - services barrel)
- src/services/firebase.ts (new)
- src/services/firestore.ts (new)
- src/services/auth.ts (new)
- src/services/storage.ts (new)
- src/stores/index.ts (new - stores barrel)
- src/stores/useTransactionStore.ts (new)
- src/stores/useWorkOrderStore.ts (new)
- src/stores/useInventoryStore.ts (new)
- src/stores/useOverheadStore.ts (new)
- src/stores/useUIStore.ts (new)
- src/types/index.ts (new - types barrel)
- src/types/transaction.ts (new)
- src/types/workOrder.ts (new)
- src/types/inventory.ts (new)
- src/types/overhead.ts (new)
- src/types/email.ts (new)
- src/types/config.ts (new)
- src/i18n/index.ts (new - i18n barrel)
- src/i18n/config.ts (new)
- src/i18n/he.json (new)
- src/i18n/en.json (new)
- src/styles/global.scss (new)
- src/styles/_variables.scss (new)
- src/styles/_mixins.scss (new)
- src/styles/_animations.scss (new)
- src/styles/_accessibility.scss (new)
- public/fonts/.gitkeep (new - preserves empty fonts directory in git)
- public/vite.svg (new - Vite default favicon)
- package-lock.json (new - npm lock file for reproducible installs)
- functions/package-lock.json (new - npm lock file for Cloud Functions)
- README.md (new - project documentation with setup instructions)
- _bmad-output/implementation-artifacts/sprint-status.yaml (modified - status updated)
- _bmad-output/implementation-artifacts/1-1-project-scaffold-development-environment.md (modified - story completion)

## Change Log

- 2026-02-06: Story implemented - Full project scaffold with Vite 7 + React 19 + TypeScript 5.9 strict mode. All 12 tasks completed. 5 tests passing. All ACs satisfied.
- 2026-02-06: Code review fixes applied — Moved sass/vite-plugin-sass-dts to devDependencies. Generated functions/package-lock.json. Pinned deploy-functions.yml action to v14.0.0. Replaced boilerplate README with project docs. Added public/fonts/.gitkeep. Fixed index.html title to TP-FOS. Removed CI push-to-main duplicate trigger.
