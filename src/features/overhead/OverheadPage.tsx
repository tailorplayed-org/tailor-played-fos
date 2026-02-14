import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Receipt, Plus, GearSix } from '@phosphor-icons/react';
import { addDoc, collection, serverTimestamp, Timestamp } from 'firebase/firestore';
import { Button, Skeleton } from '@/components';
import { formatCurrency, toMinorUnits } from '@/lib/currency';
import { toIlsAgora } from '@/lib';
import { calculateBurn, useTransactionStore, useSystemConfigStore } from '@/stores';
import { OVERHEAD_CATEGORIES } from '@/types';
import type { Overhead, CreateOverheadInput } from '@/types';
import { db } from '@/services';
import { toast } from '@/stores/useUIStore';
import { useOverhead } from './hooks';
import { CategoryBreakdown, OverheadForm, TaxJarSettings } from './components';
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
  const [showSettings, setShowSettings] = useState(false);

  // Read full store state — safe, no selector-returning-array issue (SAFER pattern)
  const txnStore = useTransactionStore();
  const configStore = useSystemConfigStore();

  // SAFER pattern: derive filtered data via useMemo from the full overhead array
  // (avoids React 19 + Zustand v5 infinite loop from selectors returning new arrays)
  const currentMonthEntries = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    return overhead.filter((item) => {
      if (item.recurrence === 'one_time') {
        return item.date.getFullYear() === year && item.date.getMonth() === month;
      }
      return item.isActive;
    });
  }, [overhead]);

  const previousMonthEntries = useMemo(() => {
    const now = new Date();
    const prevMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
    const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    return overhead.filter((item) => {
      if (item.recurrence === 'one_time') {
        return item.date.getFullYear() === prevYear && item.date.getMonth() === prevMonth;
      }
      return item.isActive;
    });
  }, [overhead]);

  const currentBurnAgora = useMemo(() => calculateBurn(currentMonthEntries), [currentMonthEntries]);
  const previousBurnAgora = useMemo(() => calculateBurn(previousMonthEntries), [previousMonthEntries]);

  // Delta for overhead: decrease = positive (green), increase = negative (red)
  // This is INVERTED from revenue delta because lower costs are good
  const burnDelta = useMemo(() => {
    if (previousBurnAgora === 0) return null;
    const change = ((currentBurnAgora - previousBurnAgora) / Math.abs(previousBurnAgora)) * 100;
    const value = Math.abs(Math.round(change));
    if (value === 0) return null;
    // INVERTED: increase = negative (red), decrease = positive (green)
    return {
      value,
      type: (change >= 0 ? 'negative' : 'positive') as 'positive' | 'negative',
      direction: (change >= 0 ? 'up' : 'down') as 'up' | 'down',
    };
  }, [currentBurnAgora, previousBurnAgora]);

  // SAFER pattern: derive net profit via useMemo from full transaction array
  const currentNetProfitAgora = useMemo(() => {
    if (txnStore.transactions.length === 0) return null;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const rates = configStore.config?.currencyRates;

    const approved = txnStore.transactions.filter((t) => t.status === 'approved');
    const currentMonthApproved = approved.filter(
      (t) => t.date.getMonth() === currentMonth && t.date.getFullYear() === currentYear,
    );

    const revenue = currentMonthApproved
      .filter((t) => t.category === 'Revenue')
      .reduce((sum, t) => sum + toIlsAgora(t.amountAgora, t.currency, rates), 0);
    const costs = currentMonthApproved
      .filter((t) => t.category === 'DirectCost' || t.category === 'Overhead')
      .reduce((sum, t) => sum + toIlsAgora(t.amountAgora, t.currency, rates), 0);

    return revenue - costs;
  }, [txnStore.transactions, configStore.config]);

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
        <div className={styles.headerActions}>
          <button
            onClick={() => setShowSettings((prev) => !prev)}
            className={styles.settingsButton}
            aria-label={t('settings.taxJar.title')}
            aria-expanded={showSettings}
          >
            <GearSix size={22} weight={showSettings ? 'fill' : 'regular'} />
          </button>
          <Button onClick={() => setFormMode({ type: 'create' })}>
            <Plus size={18} weight="bold" />
            {t('overhead.addButton')}
          </Button>
        </div>
      </div>

      {showSettings && (
        <TaxJarSettings
          currentNetProfitAgora={currentNetProfitAgora != null && currentNetProfitAgora > 0 ? currentNetProfitAgora : null}
          onClose={() => setShowSettings(false)}
        />
      )}

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
          <div className={styles.burnSummary}>
            <span className={styles.burnLabel}>{t('overhead.burn.currentMonth')}</span>
            <span className={styles.burnAmount}>{formatCurrency(currentBurnAgora)}</span>

            {burnDelta && (
              <span
                className={`${styles.burnDelta} ${
                  burnDelta.type === 'positive' ? styles.burnDeltaPositive : styles.burnDeltaNegative
                }`}
                data-testid="burn-delta"
              >
                {burnDelta.direction === 'up' ? '↑' : '↓'} {burnDelta.value}%
              </span>
            )}

            {previousBurnAgora > 0 && (
              <span className={styles.burnPreviousMonth}>
                {t('overhead.burn.previousMonth')}: {formatCurrency(previousBurnAgora)}
              </span>
            )}
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
