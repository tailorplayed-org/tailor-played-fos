import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, cleanup } from '@testing-library/react';
import { z } from 'zod';
import { onSnapshot } from 'firebase/firestore';
import { useFirestoreDoc } from './useFirestoreDoc';

// Mock firebase/firestore
const mockUnsubscribe = vi.fn();
let snapshotCallback: ((snapshot: unknown) => void) | null = null;
let errorCallback: ((error: Error) => void) | null = null;

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(() => 'mock-doc-ref'),
  onSnapshot: vi.fn((_ref: unknown, onNext: (s: unknown) => void, onError: (e: Error) => void) => {
    snapshotCallback = onNext;
    errorCallback = onError;
    return mockUnsubscribe;
  }),
}));

vi.mock('@/services', () => ({
  db: 'mock-db',
}));

const testSchema = z.object({
  taxMethod: z.enum(['flat', 'bracket']),
  flatRate: z.number(),
});

function createMockDocSnapshot(exists: boolean, data?: Record<string, unknown>) {
  return {
    exists: () => exists,
    data: () => data ?? {},
  };
}

describe('useFirestoreDoc', () => {
  const mockCallbacks = {
    onData: vi.fn(),
    onError: vi.fn(),
    onLoading: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    snapshotCallback = null;
    errorCallback = null;
    cleanup();
  });

  it('subscribes on mount and calls onLoading', () => {
    renderHook(() => useFirestoreDoc('system_config', 'app', testSchema, mockCallbacks));

    expect(mockCallbacks.onLoading).toHaveBeenCalledWith(true);
    expect(onSnapshot).toHaveBeenCalledTimes(1);
  });

  it('unsubscribes on unmount', () => {
    const { unmount } = renderHook(() =>
      useFirestoreDoc('system_config', 'app', testSchema, mockCallbacks)
    );

    unmount();
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });

  it('parses document through schema and calls onData', () => {
    renderHook(() => useFirestoreDoc('system_config', 'app', testSchema, mockCallbacks));

    const mockSnapshot = createMockDocSnapshot(true, {
      taxMethod: 'flat',
      flatRate: 0.35,
    });

    snapshotCallback!(mockSnapshot);

    expect(mockCallbacks.onData).toHaveBeenCalledTimes(1);
    expect(mockCallbacks.onData).toHaveBeenCalledWith({
      taxMethod: 'flat',
      flatRate: 0.35,
    });
  });

  it('handles non-existent document gracefully', () => {
    renderHook(() => useFirestoreDoc('system_config', 'app', testSchema, mockCallbacks));

    const mockSnapshot = createMockDocSnapshot(false);
    snapshotCallback!(mockSnapshot);

    expect(mockCallbacks.onLoading).toHaveBeenCalledWith(false);
    expect(mockCallbacks.onData).not.toHaveBeenCalled();
    expect(mockCallbacks.onError).not.toHaveBeenCalled();
  });

  it('handles listener errors', () => {
    renderHook(() => useFirestoreDoc('system_config', 'app', testSchema, mockCallbacks));

    const error = new Error('Permission denied');
    errorCallback!(error);

    expect(mockCallbacks.onError).toHaveBeenCalledWith('Permission denied');
  });

  it('calls onError for documents failing schema validation', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    renderHook(() => useFirestoreDoc('system_config', 'app', testSchema, mockCallbacks));

    const mockSnapshot = createMockDocSnapshot(true, {
      taxMethod: 'invalid-method',
      flatRate: 0.35,
    });

    snapshotCallback!(mockSnapshot);

    expect(mockCallbacks.onError).toHaveBeenCalledWith('Invalid document format');
    expect(mockCallbacks.onData).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalled();

    warnSpy.mockRestore();
  });

  it('converts Firestore Timestamps to JS Dates', () => {
    const schemaWithDate = z.object({
      name: z.string(),
      updatedAt: z.date(),
    });

    renderHook(() => useFirestoreDoc('test_col', 'doc-1', schemaWithDate, mockCallbacks));

    const now = new Date();
    const mockSnapshot = createMockDocSnapshot(true, {
      name: 'Test',
      updatedAt: { toDate: () => now },
    });

    snapshotCallback!(mockSnapshot);

    expect(mockCallbacks.onData).toHaveBeenCalledWith({
      name: 'Test',
      updatedAt: now,
    });
  });
});
