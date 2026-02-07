import { type InputHTMLAttributes, useId } from 'react';
import { useTranslation } from 'react-i18next';
import { MagnifyingGlass, X } from '@phosphor-icons/react';
import styles from './Input.module.scss';

export interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  /** Accessible label for the search input. Defaults to i18n 'Search' key if omitted. */
  label?: string;
  hideLabel?: boolean;
  value: string;
  onClear?: () => void;
}

export function SearchInput({
  label,
  hideLabel = true,
  value,
  onClear,
  onChange,
  id: idProp,
  className,
  ...props
}: SearchInputProps) {
  const { t } = useTranslation();
  const autoId = useId();
  const id = idProp || autoId;

  const resolvedLabel = label || t('components.searchInput.label');

  return (
    <div className={[styles.inputWrapper, styles.searchWrapper, className].filter(Boolean).join(' ')}>
      <label
        htmlFor={id}
        className={hideLabel ? styles.srOnly : styles.label}
      >
        {resolvedLabel}
      </label>
      <div className={styles.searchContainer}>
        <MagnifyingGlass className={styles.searchIcon} size={20} aria-hidden="true" />
        <input
          id={id}
          type="search"
          className={[styles.input, styles.searchField].filter(Boolean).join(' ')}
          value={value}
          onChange={onChange}
          {...props}
        />
        {value && (
          <button
            type="button"
            className={styles.clearButton}
            onClick={onClear}
            aria-label={t('components.searchInput.clear')}
          >
            <X size={18} aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}
