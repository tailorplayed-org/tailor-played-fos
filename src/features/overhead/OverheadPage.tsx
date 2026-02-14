import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Receipt, Plus } from '@phosphor-icons/react';
import { addDoc, collection, serverTimestamp, Timestamp } from 'firebase/firestore';
import { Button, Skeleton } from '@/components';
import { formatCurrency, toMinorUnits } from '@/lib/currency';
import { useOverheadStore, selectCurrentMonth } from '@/stores';
import { OVERHEAD_CATEGORIES } from '@/types';
import type { Overhead, CreateOverheadInput } from '@/types';
import { db } from '@/services';
import { toast } from '@/stores/useUIStore';
import { useOverhead } from './hooks';
import { CategoryBreakdown, OverheadForm } from './components';
import styles from './OverheadPage.module.scss';

type FormMode = { type: 'closed' } | { type: 'create' };

function OverheadEntryRow({ entry }: { entry: Overhead }) {
  const { t, i18n } = useTranslation();
  return (
    <div className={styles.entryRow}>
      <span className={styles.entryDescription}>
        {entry.description || t(`overhead.categories.${entry.category}`)}
      </span>
      <span className={styles.entryAmount}>
        {formatCurrency(entry.amountAgora, entry.currency)}
      </span>
      <span className={styles.entryDate}>
        {entry.date.toLocaleDateString(i18n.language)}
      </span>
      {entry.recurrence !== 'one_time' && (
        <span className={styles.recurrenceBadge}>
          {t(`overhead.recurrence.${entry.recurrence}`)}
        </span>
      )}
      <span className={`${styles.sourceBadge} ${entry.source === 'ai' ? styles.sourceAi : styles.sourceManual}`}>
        {entry.source === 'ai' ? 'AI' : t('overhead.sourceManual')}
      </span>
    </div>
  );
}

export function OverheadPage() {
  const { t } = useTranslation();
  const { overhead, loading } = useOverhead();
  const [formMode, setFormMode] = useState<FormMode>({ type: 'closed' });

  // Current month entries (for totals and display)
  const currentMonthEntries = useOverheadStore(selectCurrentMonth);
  const totalMonthlyAgora = useMemo(
    () =>
      currentMonthEntries.reduce((sum, item) => {
        if (item.recurrence === 'monthly') return sum + item.amountAgora;
        if (item.recurrence === 'yearly') return sum + Math.round(item.amountAgora / 12);
        return sum + item.amountAgora; // one_time
      }, 0),
    [currentMonthEntries],
  );

  const handleAddOverhead = useCallback(async (data: CreateOverheadInput) => {
    try {
      await addDoc(collection(db, 'overhead'), {
        category: data.category,
        amountAgora: toMinorUnits(data.amountIls),
        currency: 'ILS',
        date: Timestamp.fromDate(new Date(data.date)),
        description: data.description || null,
        recurrence: data.recurrence,
        source: 'manual',
        transactionId: null,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast.success(t('overhead.addSuccess'));
      setFormMode({ type: 'closed' });
    } catch {
      toast.error(t('overhead.addError'));
    }
  }, [t]);

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <Skeleton variant="text" width={150} height={32} />
          <Skeleton variant="rect" width={140} height={40} />
        </div>
        <Skeleton variant="rect" width="100%" height={100} />
        <CategoryBreakdown overhead={[]} loading />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.pageTitle}>{t('overhead.pageTitle')}</h1>
        <Button onClick={() => setFormMode({ type: 'create' })}>
          <Plus size={18} weight="bold" />
          {t('overhead.addButton')}
        </Button>
      </div>

      {formMode.type === 'create' && (
        <OverheadForm
          onSubmit={handleAddOverhead}
          onCancel={() => setFormMode({ type: 'closed' })}
        />
      )}

      {overhead.length === 0 && (
        <div className={styles.emptyState}>
          <Receipt size={48} className={styles.emptyIcon} />
          <h2 className={styles.emptyTitle}>{t('overhead.emptyTitle')}</h2>
          <p className={styles.emptyDescription}>{t('overhead.emptyDescription')}</p>
          <Button onClick={() => setFormMode({ type: 'create' })}>
            <Plus size={18} weight="bold" />
            {t('overhead.addButton')}
          </Button>
        </div>
      )}

      {overhead.length > 0 && (
        <>
          <div className={styles.monthlyTotal}>
            <span className={styles.monthlyTotalLabel}>{t('overhead.monthlyTotalLabel')}</span>
            <span className={styles.monthlyTotalAmount}>{formatCurrency(totalMonthlyAgora)}</span>
          </div>

          <CategoryBreakdown overhead={currentMonthEntries} />

          {OVERHEAD_CATEGORIES.map((cat) => {
            const catEntries = overhead.filter((e) => e.category === cat);
            if (catEntries.length === 0) return null;
            return (
              <section key={cat} className={styles.categorySection}>
                <h3 className={styles.categoryTitle}>{t(`overhead.categories.${cat}`)}</h3>
                {catEntries
                  .sort((a, b) => b.date.getTime() - a.date.getTime())
                  .map((entry) => (
                    <OverheadEntryRow key={entry.id} entry={entry} />
                  ))}
              </section>
            );
          })}
        </>
      )}
    </div>
  );
}
