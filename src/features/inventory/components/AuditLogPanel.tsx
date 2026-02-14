import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { ArrowFatUp, ArrowBendDownRight, Trash, X, Package } from '@phosphor-icons/react';
import { Button, Select } from '@/components';
import { formatCurrency } from '@/lib/currency';
import type { InventoryLogEntry, InventoryItem, WorkOrder } from '@/types';
import styles from './AuditLogPanel.module.scss';

export interface AuditLogPanelProps {
  logs: InventoryLogEntry[];
  inventoryItems: InventoryItem[];
  workOrders: WorkOrder[];
  loading?: boolean;
  onClose: () => void;
}

interface RunningBalanceEntry {
  log: InventoryLogEntry;
  balanceAfter: number;
}

function calculateRunningBalance(
  logs: InventoryLogEntry[],
  currentQty: number,
): RunningBalanceEntry[] {
  // Sort oldest → newest for balance calculation
  const sorted = [...logs].sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
  );

  // Work backwards from currentQty to find starting qty
  const totalChange = sorted.reduce((sum, log) => sum + log.qtyChange, 0);
  const startingQty = currentQty - totalChange;

  let runningQty = startingQty;
  return sorted.map((log) => {
    runningQty += log.qtyChange;
    return { log, balanceAfter: runningQty };
  });
}

const ACTION_CONFIG = {
  restock: { Icon: ArrowFatUp, colorClass: 'iconRestock', labelKey: 'inventory.audit.actions.restock' },
  consume: { Icon: ArrowBendDownRight, colorClass: 'iconConsume', labelKey: 'inventory.audit.actions.consume' },
  waste: { Icon: Trash, colorClass: 'iconWaste', labelKey: 'inventory.audit.actions.waste' },
} as const;

export function AuditLogPanel({
  logs,
  inventoryItems,
  workOrders,
  loading,
  onClose,
}: AuditLogPanelProps) {
  const { t, i18n } = useTranslation();
  const [filterItemId, setFilterItemId] = useState('');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const filterOptions = [
    { value: '', label: t('inventory.audit.filterAll') },
    ...inventoryItems.map((inv) => ({ value: inv.id, label: inv.name })),
  ];

  const filteredLogs = useMemo(() => {
    const items = filterItemId ? logs.filter((l) => l.itemId === filterItemId) : logs;
    // Sort newest first for display
    return [...items].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [logs, filterItemId]);

  const selectedItem = filterItemId
    ? inventoryItems.find((i) => i.id === filterItemId)
    : null;

  const runningBalance = useMemo(() => {
    if (!selectedItem || !filterItemId) return null;
    const itemLogs = logs.filter((l) => l.itemId === filterItemId);
    return calculateRunningBalance(itemLogs, selectedItem.currentQty);
  }, [logs, filterItemId, selectedItem]);

  const startingQty = useMemo(() => {
    if (!runningBalance || runningBalance.length === 0 || !selectedItem) return null;
    const totalChange = runningBalance.reduce((sum, e) => sum + e.log.qtyChange, 0);
    return selectedItem.currentQty - totalChange;
  }, [runningBalance, selectedItem]);

  const getWorkOrderName = (woRef: string | null) => {
    if (!woRef) return null;
    const wo = workOrders.find((w) => w.id === woRef);
    return wo?.clientName ?? woRef;
  };

  const getItemName = (itemId: string) => {
    const item = inventoryItems.find((i) => i.id === itemId);
    return item?.name ?? itemId;
  };

  const toggleExpand = (logId: string) => {
    setExpandedLogId((prev) => (prev === logId ? null : logId));
  };

  if (loading) {
    return (
      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <span className={styles.panelTitle}>{t('inventory.audit.title')}</span>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label={t('inventory.audit.close')}>
            <X size={18} weight="bold" />
          </Button>
        </div>
        <div className={styles.emptyState}>
          <span>{t('inventory.audit.title')}...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <span className={styles.panelTitle}>{t('inventory.audit.title')}</span>
        <Button variant="ghost" size="sm" onClick={onClose} aria-label={t('inventory.audit.close')}>
          <X size={18} weight="bold" />
        </Button>
      </div>

      <div className={styles.filterRow}>
        <Select
          label={t('inventory.audit.filterByItem')}
          hideLabel
          options={filterOptions}
          value={filterItemId}
          onChange={setFilterItemId}
          searchable
          placeholder={t('inventory.audit.filterAll')}
        />
      </div>

      {selectedItem && startingQty != null && (
        <div className={styles.runningBalance} data-testid="running-balance">
          {t('inventory.audit.runningBalance', {
            startQty: startingQty,
            currentQty: selectedItem.currentQty,
          })}
        </div>
      )}

      {filteredLogs.length === 0 ? (
        <div className={styles.emptyState}>
          <Package size={32} />
          <span>{t('inventory.audit.emptyState')}</span>
        </div>
      ) : (
        <div className={styles.logList}>
          {filteredLogs.map((log) => {
            const config = ACTION_CONFIG[log.action];
            const { Icon } = config;
            const woName = getWorkOrderName(log.workOrderRef);
            const isExpanded = expandedLogId === log.id;

            return (
              <div
                key={log.id}
                className={styles.logEntry}
                onClick={() => toggleExpand(log.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleExpand(log.id);
                  }
                }}
              >
                <span className={`${styles.logIcon} ${styles[config.colorClass]}`}>
                  <Icon size={20} weight="bold" />
                </span>
                <span className={styles.logAction}>{t(config.labelKey)}</span>
                {!filterItemId && (
                  <span className={styles.logItemName}>{getItemName(log.itemId)}</span>
                )}
                <span className={styles.logQty}>
                  {log.qtyChange > 0 ? '+' : ''}
                  {log.qtyChange}
                </span>
                <span className={styles.logCost}>
                  {t('inventory.audit.cost')}: {formatCurrency(log.costSnapshotAgora)}
                </span>
                <span className={styles.logWac}>
                  {t('inventory.audit.wac')}: {formatCurrency(log.wacAfterAgora)}
                </span>
                {woName && (
                  <Link
                    to={`/work-orders/${log.workOrderRef}`}
                    className={styles.logWorkOrder}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {woName}
                  </Link>
                )}
                <span className={styles.logTimestamp}>
                  {log.timestamp.toLocaleDateString(i18n.language)}
                </span>

                {/* Mobile expandable details */}
                <div
                  className={`${styles.logDetails} ${isExpanded ? styles.expanded : ''}`}
                >
                  <span>
                    {t('inventory.audit.cost')}: {formatCurrency(log.costSnapshotAgora)}
                  </span>
                  <span>
                    {t('inventory.audit.wac')}: {formatCurrency(log.wacAfterAgora)}
                  </span>
                  {woName && (
                    <Link
                      to={`/work-orders/${log.workOrderRef}`}
                      className={styles.logWorkOrder}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {t('inventory.audit.workOrder')}: {woName}
                    </Link>
                  )}
                  {log.reason && <span>{log.reason}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
