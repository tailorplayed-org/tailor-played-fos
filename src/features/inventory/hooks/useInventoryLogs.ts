import { useState } from 'react';
import { useFirestoreCollection } from '@/hooks';
import { inventoryLogSchema, type InventoryLogEntry } from '@/types';

/**
 * Subscribes to the inventory_log Firestore collection in real-time.
 * Returns all log entries — filter client-side for specific work orders or actions.
 */
export function useInventoryLogs() {
  const [logs, setLogs] = useState<InventoryLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFirestoreCollection('inventory_log', inventoryLogSchema, {
    onData: setLogs,
    onError: setError,
    onLoading: setLoading,
  });

  return { logs, loading, error };
}
