import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { renderHook, cleanup } from '@testing-library/react';
import { z } from 'zod';
import { onSnapshot } from 'firebase/firestore';
import { useFirestoreCollection } from './useFirestoreCollection';

// Mock firebase/firestore
const mockUnsubscribe = vi.fn();
let snapshotCallback: ((snapshot: unknown) => void) | null = null;
let errorCallback: ((error: Error) => void) | null = null;

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(() => 'mock-collection-ref'),
  query: vi.fn((ref: unknown) => ref),
  onSnapshot: vi.fn((_q: unknown, onNext: (s: unknown) => void, onError: (e: Error) => void) => {
    snapshotCallback = onNext;
    errorCallback = onError;
    return mockUnsubscribe;
  }),
}));

vi.mock('@/services', () => ({
  db: 'mock-db',
}));

const testSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

type TestItem = z.infer<typeof testSchema>;

function createMockSnapshot(docs: Array<{ id: string; data: Record<string, unknown> }>) {
  return {
    forEach: (cb: (doc: { id: string; data: () => Record<string, unknown> }) => void) => {
      docs.forEach((d) => cb({ id: d.id, data: () => d.data }));
    },
  };
}

describe('useFirestoreCollection', () => {
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
    renderHook(() => useFirestoreCollection('test_items', testSchema, mockCallbacks));

    expect(mockCallbacks.onLoading).toHaveBeenCalledWith(true);
    expect(onSnapshot).toHaveBeenCalledTimes(1);
  });

  it('unsubscribes on unmount', () => {
    const { unmount } = renderHook(() =>
      useFirestoreCollection('test_items', testSchema, mockCallbacks)
    );

    unmount();
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });

  it('parses documents through schema and calls onData, then sets loading false', () => {
    renderHook(() => useFirestoreCollection('test_items', testSchema, mockCallbacks));

    const now = new Date();
    const mockSnapshot = createMockSnapshot([
      {
        id: 'doc-1',
        data: {
          name: 'Test Item',
          createdAt: { toDate: () => now },
          updatedAt: { toDate: () => now },
        },
      },
    ]);

    snapshotCallback!(mockSnapshot);

    expect(mockCallbacks.onData).toHaveBeenCalledTimes(1);
    const items: TestItem[] = (mockCallbacks.onData as Mock).mock.calls[0][0];
    expect(items).toHaveLength(1);
    expect(items[0].id).toBe('doc-1');
    expect(items[0].name).toBe('Test Item');
    // Verify loading set to false after data received
    expect(mockCallbacks.onLoading).toHaveBeenCalledWith(false);
  });

  it('handles listener errors and sets loading false', () => {
    renderHook(() => useFirestoreCollection('test_items', testSchema, mockCallbacks));

    const error = new Error('Permission denied');
    errorCallback!(error);

    expect(mockCallbacks.onError).toHaveBeenCalledWith('Permission denied');
    // Verify loading set to false after error
    expect(mockCallbacks.onLoading).toHaveBeenCalledWith(false);
  });

  it('skips documents that fail schema validation', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    renderHook(() => useFirestoreCollection('test_items', testSchema, mockCallbacks));

    const now = new Date();
    const mockSnapshot = createMockSnapshot([
      {
        id: 'valid-doc',
        data: {
          name: 'Valid',
          createdAt: { toDate: () => now },
          updatedAt: { toDate: () => now },
        },
      },
      {
        id: 'invalid-doc',
        data: {
          // name is missing — will fail schema
          createdAt: { toDate: () => now },
          updatedAt: { toDate: () => now },
        },
      },
    ]);

    snapshotCallback!(mockSnapshot);

    const items: TestItem[] = (mockCallbacks.onData as Mock).mock.calls[0][0];
    expect(items).toHaveLength(1);
    expect(items[0].id).toBe('valid-doc');
    expect(warnSpy).toHaveBeenCalled();

    warnSpy.mockRestore();
  });
});
