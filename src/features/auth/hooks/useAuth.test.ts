import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { User, Unsubscribe } from 'firebase/auth';
import { useAuth } from './useAuth';

// Track the onAuthStateChanged callback so we can trigger it in tests
let authStateCallback: ((user: User | null) => void) | null = null;
const mockUnsubscribe: Unsubscribe = vi.fn();

const mockSignInWithGoogle = vi.fn();
const mockSignOutUser = vi.fn();

vi.mock('@/services/auth', () => ({
  signInWithGoogle: (...args: unknown[]) => mockSignInWithGoogle(...args),
  signOutUser: (...args: unknown[]) => mockSignOutUser(...args),
  onAuthStateChanged: (callback: (user: User | null) => void) => {
    authStateCallback = callback;
    return mockUnsubscribe;
  },
}));

const mockUser = {
  uid: 'test-uid',
  email: 'test@example.com',
  displayName: 'Test User',
} as User;

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authStateCallback = null;
  });

  it('starts with loading=true and user=null', () => {
    const { result } = renderHook(() => useAuth());

    expect(result.current.loading).toBe(true);
    expect(result.current.user).toBeNull();
  });

  it('sets loading=false and user after auth state resolves', () => {
    const { result } = renderHook(() => useAuth());

    act(() => {
      authStateCallback?.(mockUser);
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.user).toBe(mockUser);
  });

  it('sets loading=false with null user when not authenticated', () => {
    const { result } = renderHook(() => useAuth());

    act(() => {
      authStateCallback?.(null);
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('calls signInWithGoogle when signIn is invoked', async () => {
    mockSignInWithGoogle.mockResolvedValue(mockUser);
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signIn();
    });

    expect(mockSignInWithGoogle).toHaveBeenCalledOnce();
  });

  it('calls signOutUser when signOut is invoked', async () => {
    mockSignOutUser.mockResolvedValue(undefined);
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signOut();
    });

    expect(mockSignOutUser).toHaveBeenCalledOnce();
  });

  it('unsubscribes from auth state on unmount', () => {
    const { unmount } = renderHook(() => useAuth());

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalledOnce();
  });
});
