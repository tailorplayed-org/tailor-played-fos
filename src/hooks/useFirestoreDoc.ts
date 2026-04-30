import { useEffect, useRef, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/services';
import type { ZodSchema } from 'zod';

// Match ISO 8601 datetimes like "2026-04-30T00:00:00.000Z" so MCP-written
// docs that store dates as strings convert to Date alongside real Timestamps.
const ISO_DATETIME_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;

/**
 * Convert any Firestore Timestamp-like values to JS Date objects.
 * Recognizes Firestore Timestamps (via .toDate()) and ISO 8601 datetime strings.
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
    } else if (typeof value === 'string' && ISO_DATETIME_RE.test(value)) {
      const parsed = new Date(value);
      converted[key] = Number.isNaN(parsed.getTime()) ? value : parsed;
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
): { parseErrors: number } {
  const [parseErrors, setParseErrors] = useState(0);

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
          setParseErrors(0);
          callbacksRef.current.onData(result.data);
        } else {
          setParseErrors(1);
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

  return { parseErrors };
}
