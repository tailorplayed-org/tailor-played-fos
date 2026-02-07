import { useFirestoreCollection } from '@/hooks';
import { useWorkOrderStore } from '@/stores';
import { workOrderSchema } from '@/types';

/**
 * Subscribes to the work_orders Firestore collection in real-time.
 * Parses documents through workOrderSchema and syncs into useWorkOrderStore.
 */
export function useWorkOrders() {
  const { setWorkOrders, setLoading, setError } = useWorkOrderStore();

  useFirestoreCollection('work_orders', workOrderSchema, {
    onData: setWorkOrders,
    onError: setError,
    onLoading: setLoading,
  });

  return useWorkOrderStore();
}
