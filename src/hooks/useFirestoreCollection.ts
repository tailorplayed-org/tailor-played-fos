import { useEffect, useRef } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
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
 * Generic real-time Firestore collection listener.
 * Subscribes on mount, parses documents through Zod schema, cleans up on unmount.
 * Automatically converts Firestore Timestamp fields to JS Date objects.
 */
export function useFirestoreCollection<T>(
  collectionName: string,
  schema: ZodSchema<T>,
  callbacks: {
    onData: (data: T[]) => void;
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
    const q = query(collection(db, collectionName));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: T[] = [];
        snapshot.forEach((doc) => {
          const raw = doc.data({ serverTimestamps: 'estimate' });
          const converted = {
            ...convertTimestamps(raw),
            id: doc.id,
          };
          const result = schema.safeParse(converted);
          if (result.success) {
            items.push(result.data);
          } else {
            console.warn(`[useFirestoreCollection] Failed to parse document ${doc.id}:`, result.error);
          }
        });
        callbacksRef.current.onData(items);
        callbacksRef.current.onLoading(false);
      },
      (error) => {
        console.error(`[useFirestoreCollection] Listener error on ${collectionName}:`, error);
        callbacksRef.current.onError(error.message);
        callbacksRef.current.onLoading(false);
      }
    );

    return () => unsubscribe();
  }, [collectionName, schema]);
}
