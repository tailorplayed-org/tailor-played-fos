import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { User } from 'firebase/auth';

// Hoist mock variables so they're available inside vi.mock factories
const {
  mockSignInWithPopup,
  mockFirebaseSignOut,
  mockFirebaseOnAuthStateChanged,
  mockAuth,
} = vi.hoisted(() => ({
  mockSignInWithPopup: vi.fn(),
  mockFirebaseSignOut: vi.fn(),
  mockFirebaseOnAuthStateChanged: vi.fn(),
  mockAuth: { name: 'auth' },
}));

// Mock Firebase Auth module
vi.mock('firebase/auth', () => ({
  signInWithPopup: (...args: unknown[]) => mockSignInWithPopup(...args),
  signOut: (...args: unknown[]) => mockFirebaseSignOut(...args),
  onAuthStateChanged: (...args: unknown[]) =>
    mockFirebaseOnAuthStateChanged(...args),
  GoogleAuthProvider: vi.fn(),
}));

// Mock Firebase app instance
vi.mock('./firebase', () => ({
  auth: mockAuth,
}));

import { signInWithGoogle, signOutUser, onAuthStateChanged } from './auth';

// Resolve the actual whitelisted UIDs — matches what auth.ts computes at module load
const resolvedWhitelistedUids: string[] = import.meta.env.VITE_WHITELISTED_UIDS
  ? (import.meta.env.VITE_WHITELISTED_UIDS as string)
      .split(',')
      .map((s) => s.trim())
  : ['REPLACE_WITH_GAL_UID', 'REPLACE_WITH_BEN_UID'];

const whitelistedUser = {
  uid: resolvedWhitelistedUids[0],
  email: 'gal@example.com',
} as User;

const nonWhitelistedUser = {
  uid: 'non-whitelisted-uid-that-definitely-does-not-match',
  email: 'intruder@example.com',
} as User;

describe('Auth Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('signInWithGoogle', () => {
    it('returns the user when UID is whitelisted', async () => {
      mockSignInWithPopup.mockResolvedValue({ user: whitelistedUser });

      const result = await signInWithGoogle();

      expect(result).toBe(whitelistedUser);
      expect(mockFirebaseSignOut).not.toHaveBeenCalled();
    });

    it('signs out and throws when UID is not whitelisted', async () => {
      mockSignInWithPopup.mockResolvedValue({ user: nonWhitelistedUser });
      mockFirebaseSignOut.mockResolvedValue(undefined);

      await expect(signInWithGoogle()).rejects.toThrow(
        'Access restricted to authorized users',
      );
      expect(mockFirebaseSignOut).toHaveBeenCalledWith(mockAuth);
    });

    it('logs rejected sign-in attempt to console', async () => {
      mockSignInWithPopup.mockResolvedValue({ user: nonWhitelistedUser });
      mockFirebaseSignOut.mockResolvedValue(undefined);
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      await expect(signInWithGoogle()).rejects.toThrow();

      expect(consoleSpy).toHaveBeenCalledWith(
        'Rejected auth attempt:',
        nonWhitelistedUser.email,
        nonWhitelistedUser.uid,
      );
      consoleSpy.mockRestore();
    });
  });

  describe('signOutUser', () => {
    it('calls Firebase signOut with the auth instance', async () => {
      mockFirebaseSignOut.mockResolvedValue(undefined);

      await signOutUser();

      expect(mockFirebaseSignOut).toHaveBeenCalledWith(mockAuth);
    });
  });

  describe('onAuthStateChanged', () => {
    it('passes whitelisted user to callback', () => {
      const callback = vi.fn();
      mockFirebaseOnAuthStateChanged.mockImplementation(
        (_auth: unknown, cb: (user: User | null) => void) => {
          cb(whitelistedUser);
          return vi.fn();
        },
      );

      onAuthStateChanged(callback);

      expect(callback).toHaveBeenCalledWith(whitelistedUser);
    });

    it('passes null through when user is not authenticated', () => {
      const callback = vi.fn();
      mockFirebaseOnAuthStateChanged.mockImplementation(
        (_auth: unknown, cb: (user: User | null) => void) => {
          cb(null);
          return vi.fn();
        },
      );

      onAuthStateChanged(callback);

      expect(callback).toHaveBeenCalledWith(null);
    });

    it('signs out and passes null for non-whitelisted user session', () => {
      const callback = vi.fn();
      mockFirebaseSignOut.mockResolvedValue(undefined);
      mockFirebaseOnAuthStateChanged.mockImplementation(
        (_auth: unknown, cb: (user: User | null) => void) => {
          cb(nonWhitelistedUser);
          return vi.fn();
        },
      );

      onAuthStateChanged(callback);

      expect(mockFirebaseSignOut).toHaveBeenCalledWith(mockAuth);
      expect(callback).toHaveBeenCalledWith(null);
    });
  });
});
