# Story 1.3: Authentication & Route Protection

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As **Gal or Ben**,
I want to sign in with my Google account and have all unauthorized access blocked,
So that only we can access the financial system and our data is secure.

## Acceptance Criteria

1. **Unauthenticated Redirect**: Any unauthenticated user visiting any route is redirected to the login screen. No financial data or app shell is visible until authenticated.

2. **Google Sign-In Flow**: Clicking "Sign in with Google" on the login screen triggers Firebase Auth Google Sign-in via `signInWithPopup`. Upon success, the user is redirected to the dashboard route (`/`).

3. **Whitelist Enforcement**: If a Google account NOT in the UID whitelist completes sign-in, the sign-in is rejected with a clear message ("Access restricted to authorized users"), the user remains on the login screen, and the rejected attempt is logged to the console.

4. **AuthGuard Protection**: An `AuthGuard` component wraps all protected routes. Auth state persists across page refreshes via Firebase session persistence (default `browserLocalPersistence`).

5. **Sign-Out Flow**: Clicking "Sign out" clears the Firebase Auth session and redirects the user to the login screen.

6. **Firestore Security Rules**: A single `isAdmin()` function checks `request.auth.uid` against 2 hardcoded UIDs. ALL collections require `isAdmin()` for read and write. Unauthenticated requests are denied. *(Already implemented in scaffold — verify and update UIDs.)*

7. **Storage Security Rules**: Same `isAdmin()` pattern restricts all file read/write operations. *(Already implemented in scaffold — verify and update UIDs.)*

8. **Firebase Service Initialization**: `src/services/firebase.ts` initializes the Firebase app from `import.meta.env.VITE_FIREBASE_*` environment variables and exports `app`, `auth`, `db` (Firestore), and `storage` instances.

9. **Auth Service Layer**: `src/services/auth.ts` exports `signInWithGoogle()`, `signOut()`, and `onAuthStateChanged` listener functions using the Firebase modular SDK.

10. **useAuth Hook**: `src/features/auth/hooks/useAuth.ts` provides `{ user, loading, signIn, signOut }` — reactive auth state for components.

## Tasks / Subtasks

- [x] Task 1: Implement Firebase service initialization (AC: #8)
  - [x] Replace placeholder in `src/services/firebase.ts` with real Firebase app initialization
  - [x] Read config from `import.meta.env.VITE_FIREBASE_*` variables
  - [x] Export initialized `app`, `auth` (from `firebase/auth`), `db` (from `firebase/firestore`), `storage` (from `firebase/storage`)
  - [x] Update `src/services/firestore.ts` to re-export Firestore instance from `firebase.ts`
  - [x] Update `src/services/storage.ts` to re-export Storage instance from `firebase.ts`
  - [x] Update `src/services/auth.ts` placeholder (service functions in Task 2)
  - [x] Update `src/services/index.ts` barrel to export all services

- [x] Task 2: Implement auth service layer (AC: #9)
  - [x] Implement `signInWithGoogle()` using `signInWithPopup` + `GoogleAuthProvider`
  - [x] Implement `signOutUser()` using `signOut` from Firebase Auth
  - [x] Export `onAuthStateChanged` re-bound to the app's auth instance
  - [x] Define `WHITELISTED_UIDS` constant (2 hardcoded UIDs) — use placeholder values that must be replaced in `.env.local`
  - [x] Implement UID whitelist check: after sign-in, verify `user.uid` is in whitelist, if not → sign out immediately + throw error

- [x] Task 3: Implement useAuth hook (AC: #10)
  - [x] Create `src/features/auth/hooks/useAuth.ts`
  - [x] Use `useState` for `user` (Firebase `User | null`) and `loading` (boolean, starts `true`)
  - [x] Use `useEffect` to subscribe to `onAuthStateChanged` — set user + loading=false on callback
  - [x] Expose `signIn` (calls `signInWithGoogle()`), `signOut` (calls `signOutUser()`), `user`, `loading`
  - [x] Update barrel exports in `src/features/auth/hooks/index.ts`

- [x] Task 4: Implement AuthGuard component (AC: #1, #4)
  - [x] Create `src/features/auth/AuthGuard.tsx`
  - [x] Uses `useAuth()` hook
  - [x] If `loading` → render a full-screen loading spinner (centered, uses design system tokens)
  - [x] If `!user` → redirect to `/login` (use `Navigate` from react-router)
  - [x] If `user` → render `<Outlet />` (child routes)
  - [x] Update barrel exports in `src/features/auth/index.ts`

- [x] Task 5: Implement LoginScreen component (AC: #2, #3)
  - [x] Create `src/features/auth/components/LoginScreen.tsx`
  - [x] Create `src/features/auth/components/LoginScreen.module.scss`
  - [x] Full-screen centered layout on `$bg-primary` background
  - [x] Display TP logo/title text ("TailorPlayed FOS" or similar branding)
  - [x] "Sign in with Google" button using design system tokens (`$gold` border/text, `$bg-tertiary` background)
  - [x] Error message display area for rejected sign-in attempts
  - [x] Loading state on button during sign-in flow
  - [x] If user is already authenticated → redirect to `/` (use `Navigate`)
  - [x] Update barrel exports in `src/features/auth/components/index.ts`

- [x] Task 6: Configure router with auth protection (AC: #1, #4)
  - [x] Update `src/router.tsx` with nested route structure:
    - `/login` → `LoginScreen` (public, no AuthGuard)
    - `/` → `AuthGuard` layout wrapping all protected routes
    - `index` → `App` (temporary dashboard placeholder)
    - `*` → redirect to `/`
  - [x] Update `src/App.tsx` if needed (it's currently a placeholder)

- [x] Task 7: Verify Firestore and Storage Security Rules (AC: #6, #7)
  - [x] Verify `firestore.rules` has `isAdmin()` with correct pattern
  - [x] Verify `storage.rules` has matching `isAdmin()` pattern
  - [x] Note: Actual UID values should be set when deploying to production — placeholder UIDs are acceptable for development with Firebase emulators

- [x] Task 8: Write co-located tests (AC: all)
  - [x] `src/features/auth/AuthGuard.test.tsx` — tests: renders children when authenticated, redirects when unauthenticated, shows loading spinner during auth check
  - [x] `src/features/auth/components/LoginScreen.test.tsx` — tests: renders sign-in button, shows error on rejected sign-in, redirects if already authenticated
  - [x] `src/features/auth/hooks/useAuth.test.ts` — tests: provides user after auth, loading state management, signIn/signOut functions work
  - [x] `src/services/firebase.test.ts` — tests: Firebase app initializes, exports auth/db/storage instances

- [x] Task 9: Build verification (AC: all)
  - [x] `tsc --noEmit` — zero errors
  - [x] `npm run lint` — zero warnings
  - [x] `npm run build` — succeeds
  - [x] `npm run test` — all tests pass (existing + new)

## Dev Notes

### Architecture Compliance

- **Firebase Modular SDK (v12.9.0)**: Use tree-shakeable modular imports — `import { getAuth, signInWithPopup } from 'firebase/auth'`. NEVER use the compat/namespaced API.
- **SCSS Modules only**: LoginScreen styling via `LoginScreen.module.scss`. No CSS-in-JS, no Tailwind.
- **CSS Logical Properties**: Use `padding-inline-start`, `margin-inline-end`, `text-align: start` — NEVER `left`/`right`.
- **Path aliases**: Import via `@/` prefix. Components from `@/features/auth`, services from `@/services`.
- **Barrel exports**: Every directory exports through `index.ts`. Import from directory, not individual files.
- **Co-located tests**: `*.test.tsx` next to the component file, NOT in a `__tests__` folder.
- **State management**: Auth state via React Context (useAuth hook), NOT Zustand. Architecture specifies: "Context reserved for truly static concerns (i18n direction, auth user)."

### Critical Technical Constraints

- **signInWithPopup (NOT signInWithRedirect)**: The app is hosted on Vercel (not Firebase Hosting), so `signInWithRedirect` has cross-origin storage issues with Chrome M115+ third-party storage partitioning. Use `signInWithPopup` for reliable cross-browser auth.
- **UID Whitelist is client-side convenience only**: The real security gate is Firestore/Storage Security Rules with `isAdmin()`. Client-side whitelist prevents unauthorized users from seeing the app shell, but the server rules are the actual enforcement.
- **Session Persistence**: Firebase Auth defaults to `browserLocalPersistence` (survives page refreshes and browser restarts). Do NOT change this default — it matches AC #4.
- **No white (#fff) text**: All text uses gold scale tokens (`$text-primary`, `$text-secondary`, `$text-muted`).
- **44px minimum touch targets**: The Google Sign-In button must meet this minimum.
- **Fredoka is the sole typeface**: Login screen must use the project font (already set in `global.scss`).

### Firebase Service Initialization Pattern

```typescript
// src/services/firebase.ts
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

### Auth Service Pattern

```typescript
// src/services/auth.ts
import {
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  GoogleAuthProvider,
  type User,
  type Unsubscribe,
} from 'firebase/auth';
import { auth } from './firebase';

const googleProvider = new GoogleAuthProvider();

// Whitelist of authorized UIDs (Gal + Ben)
// IMPORTANT: Replace with actual UIDs from Firebase Auth console
const WHITELISTED_UIDS = [
  'REPLACE_WITH_GAL_UID',
  'REPLACE_WITH_BEN_UID',
];

export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  if (!WHITELISTED_UIDS.includes(result.user.uid)) {
    // Unauthorized user — sign out immediately
    await firebaseSignOut(auth);
    console.error('Rejected auth attempt:', result.user.email, result.user.uid);
    throw new Error('Access restricted to authorized users');
  }
  return result.user;
}

export async function signOutUser(): Promise<void> {
  await firebaseSignOut(auth);
}

export function onAuthStateChanged(
  callback: (user: User | null) => void
): Unsubscribe {
  return firebaseOnAuthStateChanged(auth, callback);
}
```

### useAuth Hook Pattern

```typescript
// src/features/auth/hooks/useAuth.ts
import { useState, useEffect, useCallback } from 'react';
import type { User } from 'firebase/auth';
import { signInWithGoogle, signOutUser, onAuthStateChanged } from '@/services/auth';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged((firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signIn = useCallback(async () => {
    return signInWithGoogle();
  }, []);

  const signOut = useCallback(async () => {
    await signOutUser();
  }, []);

  return { user, loading, signIn, signOut };
}
```

### AuthGuard Pattern

```typescript
// src/features/auth/AuthGuard.tsx
import { Navigate, Outlet } from 'react-router';
import { useAuth } from './hooks/useAuth';

export function AuthGuard() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />; // Full-screen centered spinner
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
```

### Router Configuration Pattern

```typescript
// src/router.tsx
import { createBrowserRouter, Navigate } from 'react-router';
import { AuthGuard } from '@/features/auth';
import { LoginScreen } from '@/features/auth';
import App from './App';

export const router = createBrowserRouter([
  {
    path: '/login',
    Component: LoginScreen,
  },
  {
    path: '/',
    Component: AuthGuard, // Layout route — renders <Outlet /> for children
    children: [
      {
        index: true,
        Component: App, // Temporary dashboard placeholder
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
```

### LoginScreen Design Requirements

- **Background**: Full-screen `$bg-primary` (#120022)
- **Layout**: Centered vertically and horizontally (use `@include flex-center` or `@include flex-column-center`)
- **Branding**: "TailorPlayed" title in `$gold`, "Financial Operations System" subtitle in `$text-secondary`
- **Sign-In Button**: `$bg-tertiary` background, 1px `$border-subtle` border, `$gold` text, `$radius-md` border-radius, min-height 44px for touch target, hover state with `$bg-elevated`
- **Error Message**: `$error` color (#ff4d6d), appears below button when sign-in is rejected
- **Loading State**: Button shows a spinner (use `@keyframes spin` from `_animations.scss`) and is disabled during sign-in
- **Animations**: Use `fadeIn` animation for the card container entry (wrap in `@include motion-safe` or `prefers-reduced-motion: no-preference`)

### Project Structure Notes

- `src/services/firebase.ts` — currently empty placeholder, REPLACE entirely
- `src/services/auth.ts` — currently empty placeholder, REPLACE entirely
- `src/services/firestore.ts` — currently empty placeholder, add Firestore instance export
- `src/services/storage.ts` — currently empty placeholder, add Storage instance export
- `src/services/index.ts` — currently empty barrel, update with real exports
- `src/features/auth/hooks/useAuth.ts` — NEW file (directory exists)
- `src/features/auth/AuthGuard.tsx` — NEW file (directory exists)
- `src/features/auth/components/LoginScreen.tsx` — NEW file (directory exists)
- `src/features/auth/components/LoginScreen.module.scss` — NEW file
- `src/features/auth/index.ts` — currently exports barrels, update if needed
- `src/features/auth/hooks/index.ts` — currently empty, update with useAuth export
- `src/features/auth/components/index.ts` — currently empty, update with LoginScreen export
- `src/router.tsx` — currently minimal, REPLACE with auth-aware routing
- `src/App.tsx` — currently a placeholder, may need minor updates
- `firestore.rules` — already has `isAdmin()` with placeholder UIDs, verify
- `storage.rules` — already has `isAdmin()` with placeholder UIDs, verify

### Previous Story Intelligence (Story 1.2)

**Key patterns established:**
- Vite 7.3 with `@vitejs/plugin-react` and `vite-plugin-sass-dts`
- `additionalData` uses `@use` syntax: `@use "@/styles/variables" as *; @use "@/styles/mixins" as *;` — tokens and mixins available in all `.module.scss` without explicit import
- Fredoka variable font self-hosted in `public/fonts/` (3 subset files: Latin, Latin-Extended, Hebrew)
- Design system fully implemented: 47 SCSS variables, 14 mixins, 8 keyframe animations, accessibility classes
- 95 tests currently passing

**Learnings from Story 1.2:**
- Sandbox restrictions may cause sass native compiler to fail during build — run build with full permissions if needed
- `_mixins.scss` needs `@use 'variables' as *` despite being auto-imported via `additionalData` — Sass module system isolates mixin bodies to their defining module scope
- ESLint uses flat config (`eslint.config.js`), not legacy `.eslintrc.cjs`
- `*.d.scss.ts` is in `.gitignore` — auto-generated SCSS type declarations

**Files modified in Stories 1.1 and 1.2 relevant to this story:**
- `vite.config.ts` — DO NOT modify (SCSS config, path aliases already set)
- `src/main.tsx` — Uses `RouterProvider` with `router` from `./router` — already configured for routing
- `src/styles/` — Complete design system (use tokens and mixins in LoginScreen)
- `package.json` — Firebase v12.9.0 and React Router v7.13.0 already installed
- `firestore.rules` / `storage.rules` — Placeholder `isAdmin()` already in place

### Git Intelligence

**Recent commits** (most recent first):
- `41d521b` — Implement Story 1.2: Design System Tokens & Global Styles with code review fixes
- `fffa502` — Add initial project setup for TP-FOS with Vite, React, and Firebase integration (Story 1.1)

**Relevant patterns:**
- Single comprehensive commits per story
- Firebase SDK (v12.9.0) already in `package.json` — no new npm installs needed for auth
- React Router v7.13 already installed — routing infrastructure ready
- All service files exist as empty placeholders — ready to be implemented

### Latest Technical Information

**Firebase Auth v12 (Modular SDK):**
- Use `signInWithPopup` (NOT `signInWithRedirect`) — Vercel hosting triggers Chrome M115+ third-party storage partitioning issues with redirect flow
- Modular imports for tree-shaking: `import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from 'firebase/auth'`
- `onAuthStateChanged` returns an `Unsubscribe` function — call it in `useEffect` cleanup
- `signInWithPopup` returns `UserCredential` with `.user` property containing `uid`, `email`, `displayName`, `photoURL`

**React Router v7.13 (Declarative/Data Mode):**
- `createBrowserRouter` supports layout routes — a route with `children` but no `element`/`Component` acts as a layout wrapper
- `<Outlet />` renders child routes within the layout component (AuthGuard uses this)
- `<Navigate to="/login" replace />` for redirect — `replace` prevents back-button issues
- Route definitions support `Component` property (lazy function component) alongside `element` (JSX)

### Potential Pitfalls to Avoid

1. **DO NOT use `signInWithRedirect`** — Vercel hosting (not Firebase Hosting) means third-party storage blocking breaks the redirect flow in Chrome, Safari, and Firefox.
2. **DO NOT store auth state in Zustand** — Architecture says auth goes in React Context. The `useAuth` hook IS the auth state manager.
3. **DO NOT create an AuthContext Provider component** — The `useAuth` hook directly subscribes to Firebase's `onAuthStateChanged`. Each component calling `useAuth()` gets its own subscription. For this 2-user app, this is perfectly efficient. If shared context is needed later, it can be added.
4. **DO NOT hardcode real UIDs in source code** — Use recognizable placeholder values. Real UIDs go in `.env.local` or are set via environment variables. Consider using `import.meta.env.VITE_WHITELISTED_UIDS` if you want them configurable.
5. **DO NOT add new npm dependencies** — Firebase (v12.9.0) and React Router (v7.13.0) are already installed.
6. **DO NOT modify `vite.config.ts`** — All configuration is already correct.
7. **DO NOT use `left`/`right` CSS properties** — Use logical properties (`inline-start`/`inline-end`).
8. **DO NOT use white (#fff) text** — All text uses the gold token scale.
9. **DO NOT forget the loading spinner** — Without it, there's a flash of login screen on every page refresh before Firebase restores the session.
10. **DO NOT skip the whitelist check on sign-in** — The client-side check prevents unauthorized users from seeing the app shell. Server rules (Firestore/Storage) are the real security gate, but the UX must also block.
11. **CRITICAL: Handle the case where `onAuthStateChanged` fires with a user who is NOT whitelisted** — This can happen if a previously-signed-in non-whitelisted user's session is restored. Check UID in the `onAuthStateChanged` callback too, or rely on Firestore rules failing when they try to load data.
12. **DO NOT create a separate `AuthProvider` context component unless truly needed** — The `useAuth()` hook pattern with direct Firebase subscription is simpler and sufficient for 2 users.

### References

- [Source: planning-artifacts/epics.md#Story-1.3] — Full acceptance criteria with BDD format (authentication, whitelist, AuthGuard, security rules)
- [Source: planning-artifacts/architecture.md#Authentication-&-Security] — Auth decisions: Firebase Auth + Google Sign-in, `isAdmin()` Firestore rules, 2 whitelisted UIDs
- [Source: planning-artifacts/architecture.md#Frontend-Architecture] — State management: Zustand (client state) + Context (static/auth), React Router v7 declarative mode
- [Source: planning-artifacts/architecture.md#Implementation-Patterns] — Naming conventions, barrel exports, path aliases, co-located tests
- [Source: planning-artifacts/architecture.md#Project-Structure] — Feature module structure: `src/features/auth/` with AuthGuard, LoginScreen, useAuth
- [Source: planning-artifacts/architecture.md#Enforcement-Guidelines] — 7 mandatory AI agent rules
- [Source: implementation-artifacts/1-2-design-system-tokens-global-styles.md] — Previous story patterns, SCSS system, learnings
- [Source: Firebase Auth Docs] — signInWithPopup recommended over signInWithRedirect for non-Firebase-hosted apps (Chrome M115+ storage partitioning)
- [Source: React Router v7 Docs] — createBrowserRouter layout routes with Outlet for protected route patterns

## Dev Agent Record

### Agent Model Used

Claude claude-4.6-opus (Cursor Agent)

### Debug Log References

- firebase.test.ts: Fixed mock accumulation across vi.resetModules() by using explicit mockClear() in beforeEach
- LoginScreen.test.tsx: Fixed act() warning by wrapping promise resolution in act()

### Completion Notes List

- **Task 1**: Replaced empty `firebase.ts` with full Firebase app initialization using `import.meta.env.VITE_FIREBASE_*` env vars. Updated `firestore.ts`, `storage.ts` to re-export instances. Updated `index.ts` barrel.
- **Task 2**: Implemented `signInWithGoogle()` with `signInWithPopup` + UID whitelist check, `signOutUser()`, and `onAuthStateChanged` wrapper. Whitelist reads from `VITE_WHITELISTED_UIDS` env var (comma-separated) with fallback to placeholder values.
- **Task 3**: Created `useAuth` hook with `useState` for user/loading, `useEffect` for `onAuthStateChanged` subscription with cleanup, and memoized `signIn`/`signOut` callbacks.
- **Task 4**: Created `AuthGuard` component with loading spinner, unauthenticated redirect to `/login`, and `<Outlet />` for authenticated users. Created `AuthGuard.module.scss` with design system tokens.
- **Task 5**: Created `LoginScreen` with full-screen centered layout, branding, Google sign-in button with loading/error states, and redirect for authenticated users. Created `LoginScreen.module.scss` with all design system tokens, logical CSS properties, 44px min touch target, fadeIn animation with motion-safe wrapper.
- **Task 6**: Updated `router.tsx` with `/login` (public), `/` with AuthGuard layout + App child, and `*` catch-all redirect.
- **Task 7**: Verified `firestore.rules` and `storage.rules` both have `isAdmin()` function with correct pattern. Placeholder UIDs in place.
- **Task 8**: Created 29 new tests across 5 test files — all passing. Total: 124 tests (was 95).
- **Task 9**: `tsc --noEmit` zero errors, `npm run lint` zero warnings, `npm run build` succeeds, `npm run test` 124/124 passing.

### Implementation Decisions

- **VITE_WHITELISTED_UIDS env var**: Made whitelist configurable via `import.meta.env.VITE_WHITELISTED_UIDS` (comma-separated string) instead of only hardcoded values. Falls back to placeholder UIDs if env var not set.
- **No AuthContext Provider**: Per architecture guidance, `useAuth()` subscribes directly to Firebase `onAuthStateChanged`. Sufficient for 2-user app.
- **SCSS logical properties**: Used `border-block-start-color`, `margin-block-start`, `padding-inline-start` — no `left`/`right` properties.
- **App.tsx unchanged**: Placeholder content preserved as-is; will be replaced in future dashboard stories.

### Change Log

- 2026-02-06: Implemented Story 1.3 — Authentication & Route Protection (all 9 tasks, 22 new tests)
- 2026-02-06: Code Review Fixes — (1) onAuthStateChanged now checks whitelist to prevent non-whitelisted session restore bypass (Pitfall #11), (2) Added .trim() to VITE_WHITELISTED_UIDS parsing to prevent silent whitespace mismatch, (3) Added auth.test.ts with 7 direct unit tests for auth service layer, (4) Updated File List with missing firestore.rules, storage.rules, .firebaserc

### File List

- `src/services/firebase.ts` — Modified: Firebase app initialization with env vars
- `src/services/auth.ts` — Modified: Auth service layer (signInWithGoogle, signOutUser, onAuthStateChanged, whitelist)
- `src/services/firestore.ts` — Modified: Re-export db from firebase.ts
- `src/services/storage.ts` — Modified: Re-export storage from firebase.ts
- `src/services/index.ts` — Modified: Updated barrel exports
- `src/services/firebase.test.ts` — New: 6 tests for Firebase initialization
- `src/services/auth.test.ts` — New: 7 tests for auth service layer (signInWithGoogle whitelist, signOutUser, onAuthStateChanged whitelist gate)
- `src/features/auth/hooks/useAuth.ts` — New: useAuth hook
- `src/features/auth/hooks/useAuth.test.ts` — New: 6 tests for useAuth hook
- `src/features/auth/hooks/index.ts` — Modified: Export useAuth
- `src/features/auth/AuthGuard.tsx` — New: AuthGuard route protection component
- `src/features/auth/AuthGuard.module.scss` — New: AuthGuard loading spinner styles
- `src/features/auth/AuthGuard.test.tsx` — New: 3 tests for AuthGuard
- `src/features/auth/components/LoginScreen.tsx` — New: Login screen component
- `src/features/auth/components/LoginScreen.module.scss` — New: Login screen styles
- `src/features/auth/components/LoginScreen.test.tsx` — New: 7 tests for LoginScreen
- `src/features/auth/components/index.ts` — Modified: Export LoginScreen
- `src/features/auth/index.ts` — Modified: Export AuthGuard, LoginScreen, useAuth
- `src/router.tsx` — Modified: Auth-aware routing with AuthGuard layout
- `firestore.rules` — Modified: Updated isAdmin() UIDs
- `storage.rules` — Modified: Updated isAdmin() UIDs
- `.firebaserc` — Modified: Set default Firebase project to tailor-played
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — Modified: Story status updated
