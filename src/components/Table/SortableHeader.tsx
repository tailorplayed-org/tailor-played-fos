import { ArrowUp, ArrowDown } from '@phosphor-icons/react';
import styles from './Table.module.scss';

export interface SortableHeaderProps {
  label: string;
  sortKey: string;
  currentSortKey?: string;
  sortDirection?: 'asc' | 'desc';
  onSort: (key: string) => void;
}

export function SortableHeader({
  label,
  sortKey,
  currentSortKey,
  sortDirection,
  onSort,
}: SortableHeaderProps) {
  const isActive = currentSortKey === sortKey;

  return (
    <button
      type="button"
      className={styles.sortableHeader}
      onClick={() => onSort(sortKey)}
      aria-sort={
        isActive
          ? sortDirection === 'asc'
            ? 'ascending'
            : 'descending'
          : undefined
      }
    >
      <span>{label}</span>
      {isActive && (
        <span className={styles.sortIcon} aria-hidden="true">
          {sortDirection === 'asc' ? (
            <ArrowUp size={14} weight="bold" />
          ) : (
            <ArrowDown size={14} weight="bold" />
          )}
        </span>
      )}
    </button>
  );
}
