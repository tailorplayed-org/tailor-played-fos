import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { db } from '@/services';
import { toast } from '@/components/Toast';
import type { CreateWorkOrderInput } from '@/types';

export function useWorkOrderActions() {
  const { t } = useTranslation();

  const createWorkOrder = async (data: CreateWorkOrderInput) => {
    try {
      await addDoc(collection(db, 'work_orders'), {
        ...data,
        deadline: data.deadline ?? null,
        revenueTotalAgora: 0,
        directCostAgora: 0,
        inventoryCostAgora: 0,
        overheadAllocationAgora: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast.success(t('workOrders.toast.created'));
    } catch (error) {
      toast.error(t('workOrders.toast.createError'));
      throw error;
    }
  };

  const updateWorkOrder = async (id: string, data: Partial<CreateWorkOrderInput>) => {
    try {
      await updateDoc(doc(db, 'work_orders', id), {
        ...data,
        updatedAt: serverTimestamp(),
      });
      toast.success(t('workOrders.toast.updated'));
    } catch (error) {
      toast.error(t('workOrders.toast.updateError'));
      throw error;
    }
  };

  return { createWorkOrder, updateWorkOrder };
}
