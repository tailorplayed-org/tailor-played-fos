import { useFirestoreCollection } from '@/hooks';
import { useInventoryStore } from '@/stores';
import { inventoryItemSchema } from '@/types';

/**
 * Subscribes to the inventory Firestore collection in real-time.
 * Parses documents through inventoryItemSchema and syncs into useInventoryStore.
 */
export function useInventory() {
  const { setInventory, setLoading, setError } = useInventoryStore();

  useFirestoreCollection('inventory', inventoryItemSchema, {
    onData: setInventory,
    onError: setError,
    onLoading: setLoading,
  });

  return useInventoryStore();
}
