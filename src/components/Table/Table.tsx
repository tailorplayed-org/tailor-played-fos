import type { ReactNode } from 'react';
import { SortableHeader } from './SortableHeader';
import { Skeleton } from '@/components/Skeleton/Skeleton';
import styles from './Table.module.scss';

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render: (item: T) => ReactNode;
  hideOnMobile?: boolean;
  align?: 'start' | 'end' | 'center';
}

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  onRowClick?: (item: T) => void;
  emptyState?: ReactNode;
  loading?: boolean;
  className?: string;
  rowClassName?: (item: T) => string | undefined;
  /** Extracts a stable unique key for each row. Falls back to array index if not provided. */
  keyExtractor?: (item: T, index: number) => string | number;
}

export function Table<T>({
  columns,
  data,
  sortKey,
  sortDirection,
  onSort,
  onRowClick,
  emptyState,
  loading = false,
  className,
  rowClassName,
  keyExtractor,
}: TableProps<T>) {
  if (loading) {
    return (
      <div className={[styles.tableWrapper, className].filter(Boolean).join(' ')}>
        <table className={styles.table}>
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={[
                    styles.th,
                    col.hideOnMobile ? styles.hideOnMobile : '',
                    col.align ? styles[`align-${col.align}`] : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className={styles.tr}>
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={[
                      styles.td,
                      col.hideOnMobile ? styles.hideOnMobile : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    <Skeleton width="80%" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (data.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <div className={[styles.tableWrapper, className].filter(Boolean).join(' ')}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={[
                  styles.th,
                  col.hideOnMobile ? styles.hideOnMobile : '',
                  col.align ? styles[`align-${col.align}`] : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {col.sortable && onSort ? (
                  <SortableHeader
                    label={col.header}
                    sortKey={col.key}
                    currentSortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={onSort}
                  />
                ) : (
                  col.header
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, idx) => (
            <tr
              key={keyExtractor ? keyExtractor(item, idx) : idx}
              className={[
                styles.tr,
                onRowClick ? styles.clickable : '',
                rowClassName?.(item),
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => onRowClick?.(item)}
              role={onRowClick ? 'button' : undefined}
              tabIndex={onRowClick ? 0 : undefined}
              onKeyDown={
                onRowClick
                  ? (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onRowClick(item);
                      }
                    }
                  : undefined
              }
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={[
                    styles.td,
                    col.hideOnMobile ? styles.hideOnMobile : '',
                    col.align ? styles[`align-${col.align}`] : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {col.render(item)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
