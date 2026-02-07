import { useEffect, useRef } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/services';
import type { ZodSchema } from 'zod';

/**
 * Convert any Firestore Timestamp-like values to JS Date objects.
 * Detects timestamps by checking for a `.toDate()` method.
 */
function convertTimestamps(data: Record<string, unknown>): Record<string, unknown> {
  const converted: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (
      value != null &&
      typeof value === 'object' &&
      'toDate' in value &&
      typeof (value as { toDate: unknown }).toDate === 'function'
    ) {
      converted[key] = (value as { toDate: () => Date }).toDate();
    } else {
      converted[key] = value;
    }
  }
  return converted;
}

/**
 * Generic real-time Firestore single document listener.
 * Subscribes on mount, parses document through Zod schema, cleans up on unmount.
 * Automatically converts Firestore Timestamp fields to JS Date objects.
 */
export function useFirestoreDoc<T>(
  collectionName: string,
  docId: string,
  schema: ZodSchema<T>,
  callbacks: {
    onData: (data: T) => void;
    onError: (error: string) => void;
    onLoading: (loading: boolean) => void;
  }
) {
  // Use ref to always access latest callbacks without re-subscribing
  const callbacksRef = useRef(callbacks);
  useEffect(() => {
    callbacksRef.current = callbacks;
  });

  useEffect(() => {
    callbacksRef.current.onLoading(true);
    const docRef = doc(db, collectionName, docId);
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          // Document doesn't exist — not an error, just no config yet
          callbacksRef.current.onLoading(false);
          return;
        }
        const raw = snapshot.data({ serverTimestamps: 'estimate' });
        const converted = convertTimestamps(raw);
        const result = schema.safeParse(converted);
        if (result.success) {
          callbacksRef.current.onData(result.data);
        } else {
          console.warn(`[useFirestoreDoc] Failed to parse ${collectionName}/${docId}:`, result.error);
          callbacksRef.current.onError('Invalid document format');
        }
      },
      (error) => {
        console.error(`[useFirestoreDoc] Listener error on ${collectionName}/${docId}:`, error);
        callbacksRef.current.onError(error.message);
      }
    );
    return () => unsubscribe();
  }, [collectionName, docId, schema]);
}
