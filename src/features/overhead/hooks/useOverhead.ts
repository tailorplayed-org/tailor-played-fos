import { useFirestoreCollection } from '@/hooks';
import { useOverheadStore } from '@/stores';
import { overheadSchema } from '@/types';

export function useOverhead() {
  const { setOverhead, setLoading, setError } = useOverheadStore();

  useFirestoreCollection('overhead', overheadSchema, {
    onData: setOverhead,
    onError: setError,
    onLoading: setLoading,
  });

  return useOverheadStore();
}
