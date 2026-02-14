import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CaretRight, CheckCircle, WarningCircle, ChartBar, Trash } from '@phosphor-icons/react';
import { formatCurrency, calculateMargin, calculateBuffer, getMarginStatus } from '@/lib';
import type { WorkOrder, Transaction, InventoryLogEntry } from '@/types';
import styles from './NutritionLabel.module.scss';

export interface NutritionLabelProps {
  workOrder: WorkOrder;
  transactions: Transaction[];
  inventoryLogs?: InventoryLogEntry[];
  inventoryItemNames?: Record<string, string>;
  loading?: boolean;
}

function AmountCell({ amount, loading }: { amount: number; loading?: boolean }) {
  if (loading) {
    return <span className={styles.shimmer} aria-hidden="true" />;
  }
  return <span>{formatCurrency(amount)}</span>;
}

export function NutritionLabel({ workOrder, transactions, inventoryLogs = [], inventoryItemNames = {}, loading = false }: NutritionLabelProps) {
  const { t, i18n } = useTranslation();
  const [expandedDirectCosts, setExpandedDirectCosts] = useState(false);
  const [expandedInventoryCosts, setExpandedInventoryCosts] = useState(false);

  const directCostTransactions = useMemo(
    () => transactions.filter((txn) => txn.category === 'DirectCost' && txn.workOrderId === workOrder.id),
    [transactions, workOrder.id],
  );

  const revenueAgora = workOrder.revenueTotalAgora;
  const directCostAgora = workOrder.directCostAgora;
  const inventoryCostAgora = workOrder.inventoryCostAgora;
  const overheadAgora = workOrder.overheadAllocationAgora;
  const totalCostAgora = directCostAgora + inventoryCostAgora + overheadAgora;
  const bufferAgora = calculateBuffer(totalCostAgora);
  const netProfitAgora = revenueAgora - totalCostAgora - bufferAgora;
  const margin = calculateMargin(revenueAgora, totalCostAgora, bufferAgora);
  const marginStatus = getMarginStatus(margin);
  const hasRevenue = revenueAgora > 0;
  const isNegativeProfit = netProfitAgora < 0;

  const marginColorClass =
    marginStatus === 'healthy'
      ? styles.marginHealthy
      : marginStatus === 'watch'
        ? styles.marginWatch
        : styles.marginDanger;

  const marginBarWidth = Math.max(0, Math.min(100, margin));

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <ChartBar size={20} weight="fill" />
        <h3 className={styles.title}>{t('nutritionLabel.title')}</h3>
      </div>

      {/* Revenue */}
      <div className={styles.row}>
        <span className={styles.label}>{t('nutritionLabel.revenue')}</span>
        <span className={styles.amount}>
          <AmountCell amount={revenueAgora} loading={loading} />
        </span>
      </div>

      <div className={styles.divider} />

      {/* Direct Costs — expandable */}
      <button
        type="button"
        className={styles.expandableRow}
        onClick={() => setExpandedDirectCosts((prev) => !prev)}
        aria-expanded={expandedDirectCosts}
        aria-label={
          expandedDirectCosts
            ? t('nutritionLabel.collapse', { section: t('nutritionLabel.directCosts') })
            : t('nutritionLabel.expand', { section: t('nutritionLabel.directCosts') })
        }
      >
        <span className={styles.label}>
          <CaretRight
            size={14}
            weight="bold"
            className={`${styles.chevron} ${expandedDirectCosts ? styles.chevronExpanded : ''}`}
          />
          {t('nutritionLabel.directCosts')}
        </span>
        <span className={styles.amount}>
          <AmountCell amount={directCostAgora} loading={loading} />
        </span>
      </button>

      {expandedDirectCosts && (
        <div className={styles.transactionList}>
          {directCostTransactions.length > 0 ? (
            directCostTransactions.map((txn) => (
              <div key={txn.id} className={styles.transactionItem}>
                <span className={styles.transactionVendor}>{txn.vendorName}</span>
                <span className={styles.transactionDate}>
                  {txn.date.toLocaleDateString(i18n.language)}
                </span>
                <span className={styles.transactionAmount}>
                  {formatCurrency(txn.amountAgora, txn.currency)}
                </span>
              </div>
            ))
          ) : (
            <div className={styles.placeholder}>{t('nutritionLabel.noTransactions')}</div>
          )}
        </div>
      )}

      {/* Inventory Costs — expandable */}
      <button
        type="button"
        className={styles.expandableRow}
        onClick={() => setExpandedInventoryCosts((prev) => !prev)}
        aria-expanded={expandedInventoryCosts}
        aria-label={
          expandedInventoryCosts
            ? t('nutritionLabel.collapse', { section: t('nutritionLabel.inventoryCosts') })
            : t('nutritionLabel.expand', { section: t('nutritionLabel.inventoryCosts') })
        }
      >
        <span className={styles.label}>
          <CaretRight
            size={14}
            weight="bold"
            className={`${styles.chevron} ${expandedInventoryCosts ? styles.chevronExpanded : ''}`}
          />
          {t('nutritionLabel.inventoryCosts')}
        </span>
        <span className={styles.amount}>
          <AmountCell amount={inventoryCostAgora} loading={loading} />
        </span>
      </button>

      {expandedInventoryCosts && (
        <div className={styles.transactionList}>
          {inventoryLogs.length > 0 ? (
            inventoryLogs.map((log) => {
              const itemName = inventoryItemNames[log.itemId] ?? log.itemId;
              const isWaste = log.action === 'waste';
              return (
                <div key={log.id} className={styles.transactionItem}>
                  <span className={styles.transactionVendor}>
                    {isWaste && <Trash size={14} className={styles.wasteIcon} />}
                    {itemName}{isWaste && log.reason ? ` (${t('nutritionLabel.waste')}: ${log.reason})` : ''}
                  </span>
                  <span className={styles.transactionDate}>
                    {log.timestamp.toLocaleDateString(i18n.language)}
                  </span>
                  <span className={styles.transactionAmount}>
                    {formatCurrency(log.costSnapshotAgora)}
                  </span>
                </div>
              );
            })
          ) : (
            <div className={styles.placeholder}>{t('nutritionLabel.noScoops')}</div>
          )}
        </div>
      )}

      {/* Overhead Allocation — static */}
      <div className={styles.row}>
        <span className={styles.label}>{t('nutritionLabel.overheadAllocation')}</span>
        <span className={styles.amount}>
          <AmountCell amount={overheadAgora} loading={loading} />
        </span>
      </div>

      <div className={styles.divider} />

      {/* Total Costs */}
      <div className={styles.row}>
        <span className={styles.label}>{t('nutritionLabel.totalCosts')}</span>
        <span className={styles.amount}>
          <AmountCell amount={totalCostAgora} loading={loading} />
        </span>
      </div>

      {/* Buffer */}
      <div className={styles.row}>
        <span className={styles.label}>{t('nutritionLabel.buffer')}</span>
        <span className={styles.amount}>
          <AmountCell amount={bufferAgora} loading={loading} />
        </span>
      </div>

      <div className={styles.divider} />

      {/* Net Profit */}
      <div className={styles.netProfitRow}>
        <span className={styles.netProfitLabel}>{t('nutritionLabel.netProfit')}</span>
        <span className={`${styles.netProfitAmount} ${isNegativeProfit ? styles.netProfitNegative : ''}`}>
          <AmountCell amount={netProfitAgora} loading={loading} />
        </span>
      </div>

      {/* Margin */}
      <div className={styles.marginSection}>
        <div className={styles.marginRow}>
          <span className={styles.marginLabel}>
            {marginStatus === 'healthy' ? (
              <CheckCircle size={18} weight="fill" className={marginColorClass} />
            ) : (
              <WarningCircle size={18} weight="fill" className={marginColorClass} />
            )}
            {t('nutritionLabel.margin')}
          </span>
          <span className={`${styles.marginValue} ${marginColorClass}`}>
            {hasRevenue ? `${Math.round(margin)}%` : '—'}
          </span>
        </div>
        <div className={styles.marginBar} role="progressbar" aria-label={t('nutritionLabel.margin')} aria-valuenow={hasRevenue ? Math.round(margin) : 0} aria-valuemin={0} aria-valuemax={100}>
          <div
            className={`${styles.marginBarFill} ${marginColorClass}`}
            style={{ inlineSize: `${marginBarWidth}%` }}
          />
        </div>
      </div>
    </div>
  );
}
