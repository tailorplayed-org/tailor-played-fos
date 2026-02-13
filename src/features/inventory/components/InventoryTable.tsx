import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Table, type Column } from '@/components/Table';
import { Badge } from '@/components/Badge/Badge';
import { formatCurrency } from '@/lib/currency';
import type { InventoryItem } from '@/types';
import styles from './InventoryTable.module.scss';

interface InventoryTableProps {
  items: InventoryItem[];
  loading: boolean;
  onRowClick?: (item: InventoryItem) => void;
  emptyState?: React.ReactNode;
}

type SortKey = 'name' | 'sku' | 'supplier' | 'currentQty' | 'wacAgora' | 'totalValue' | 'reorderThreshold';
type SortDirection = 'asc' | 'desc';

function isLowStock(item: InventoryItem): boolean {
  return item.reorderThreshold != null && item.currentQty <= item.reorderThreshold;
}

export function InventoryTable({ items, loading, onRowClick, emptyState }: InventoryTableProps) {
  const { t } = useTranslation();
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = useCallback(
    (key: string) => {
      if (key === sortKey) {
        setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortKey(key as SortKey);
        setSortDirection('asc');
      }
    },
    [sortKey]
  );

  const sortedItems = useMemo(() => {
    const sorted = [...items].sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;

      if (sortKey === 'totalValue') {
        aVal = a.currentQty * a.wacAgora;
        bVal = b.currentQty * b.wacAgora;
      } else if (sortKey === 'name' || sortKey === 'sku' || sortKey === 'supplier') {
        aVal = (a[sortKey] ?? '').toLowerCase();
        bVal = (b[sortKey] ?? '').toLowerCase();
      } else {
        aVal = a[sortKey] ?? 0;
        bVal = b[sortKey] ?? 0;
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [items, sortKey, sortDirection]);

  const columns: Column<InventoryItem>[] = useMemo(
    () => [
      {
        key: 'name',
        header: t('inventory.columns.name'),
        sortable: true,
        render: (item) => (
          <span className={styles.nameCell}>
            {item.name}
            {isLowStock(item) && (
              <Badge label={t('inventory.lowStock')} color="warning" />
            )}
          </span>
        ),
      },
      {
        key: 'sku',
        header: t('inventory.columns.sku'),
        hideOnMobile: true,
        render: (item) => item.sku ?? '—',
      },
      {
        key: 'supplier',
        header: t('inventory.columns.supplier'),
        hideOnMobile: true,
        render: (item) => item.supplier ?? '—',
      },
      {
        key: 'currentQty',
        header: t('inventory.columns.currentQty'),
        sortable: true,
        align: 'end',
        render: (item) => item.currentQty,
      },
      {
        key: 'wacAgora',
        header: t('inventory.columns.wacPerUnit'),
        sortable: true,
        align: 'end',
        render: (item) => formatCurrency(item.wacAgora, 'ILS'),
      },
      {
        key: 'totalValue',
        header: t('inventory.columns.totalValue'),
        sortable: true,
        align: 'end',
        hideOnMobile: true,
        render: (item) => formatCurrency(item.currentQty * item.wacAgora, 'ILS'),
      },
      {
        key: 'reorderThreshold',
        header: t('inventory.columns.reorderThreshold'),
        hideOnMobile: true,
        align: 'end',
        render: (item) => item.reorderThreshold ?? '—',
      },
    ],
    [t]
  );

  const rowClassName = useCallback(
    (item: InventoryItem) => (isLowStock(item) ? styles.lowStockRow : undefined),
    []
  );

  return (
    <Table
      columns={columns}
      data={sortedItems}
      sortKey={sortKey}
      sortDirection={sortDirection}
      onSort={handleSort}
      onRowClick={onRowClick}
      emptyState={emptyState}
      loading={loading}
      rowClassName={rowClassName}
      keyExtractor={(item) => item.id}
    />
  );
}
