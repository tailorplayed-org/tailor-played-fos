import { writeBatch, doc, collection, increment, serverTimestamp } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { db } from '@/services';
import { toast } from '@/components/Toast';
import { toMinorUnits, toIlsAgora } from '@/lib';
import type { CreateTransactionInput } from '@/types';

export function useTransactionActions() {
  const { t } = useTranslation();

  const createTransaction = async (data: CreateTransactionInput) => {
    try {
      const amountAgora = toMinorUnits(data.amount, data.currency);
      const ilsAmountAgora = toIlsAgora(amountAgora, data.currency);
      const batch = writeBatch(db);

      // 1. Create transaction document
      const txnRef = doc(collection(db, 'transactions'));
      batch.set(txnRef, {
        vendorName: data.vendorName,
        amountAgora,
        currency: data.currency,
        date: data.date,
        category: data.category,
        workOrderId: data.workOrderId || null,
        inventoryItemId: null,
        status: 'approved', // Manual entries skip review
        aiConfidence: null,
        originalFileUrl: null,
        source: 'manual',
        notes: data.notes || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // 2. Update Work Order cost/revenue if linked
      if (data.workOrderId) {
        const woRef = doc(db, 'work_orders', data.workOrderId);
        if (data.category === 'DirectCost') {
          batch.update(woRef, {
            directCostAgora: increment(ilsAmountAgora),
            updatedAt: serverTimestamp(),
          });
        } else if (data.category === 'Revenue') {
          batch.update(woRef, {
            revenueTotalAgora: increment(ilsAmountAgora),
            updatedAt: serverTimestamp(),
          });
        }
      }

      // 3. Atomic commit
      await batch.commit();
      toast.success(t('transactions.toast.created'));
    } catch (error) {
      toast.error(t('transactions.toast.createError'));
      throw error;
    }
  };

  return { createTransaction };
}
