import { useState, useRef, useEffect, useCallback, useId } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import styles from './Input.module.scss';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  label: string;
  hideLabel?: boolean;
  error?: string;
  searchable?: boolean;
  placeholder?: string;
  className?: string;
  id?: string;
}

export function Select({
  options,
  value,
  onChange,
  label,
  hideLabel = false,
  error,
  searchable = false,
  placeholder,
  className,
  id: idProp,
}: SelectProps) {
  const { t } = useTranslation();
  const autoId = useId();
  const id = idProp || autoId;
  const errorId = error ? `${id}-error` : undefined;

  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((o) => o.value === value);

  const filtered = searchable && search
    ? options.filter((o) =>
        o.label.toLowerCase().includes(search.toLowerCase())
      )
    : options;

  const updateDropdownPosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setDropdownStyle({
      top: rect.bottom + 4,
      left: rect.left,
      ...(rect.width > 0 ? { width: rect.width } : {}),
    });
  }, []);

  const open = useCallback(() => {
    setIsOpen(true);
    setHighlightIndex(-1);
    setSearch('');
    updateDropdownPosition();
  }, [updateDropdownPosition]);

  const close = useCallback(() => {
    setIsOpen(false);
    setSearch('');
    setHighlightIndex(-1);
    triggerRef.current?.focus();
  }, []);

  const selectOption = useCallback(
    (val: string) => {
      onChange?.(val);
      close();
    },
    [onChange, close]
  );

  // Click outside
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        !triggerRef.current?.contains(e.target as Node) &&
        !dropdownRef.current?.contains(e.target as Node)
      ) {
        close();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen, close]);

  // Close on scroll so dropdown doesn't float away from trigger
  useEffect(() => {
    if (!isOpen) return;
    const handler = () => close();
    window.addEventListener('scroll', handler, true);
    return () => window.removeEventListener('scroll', handler, true);
  }, [isOpen, close]);

  // Focus search when opened
  useEffect(() => {
    if (isOpen && searchable) {
      searchRef.current?.focus();
    }
  }, [isOpen, searchable]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        open();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightIndex((prev) =>
          prev < filtered.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightIndex((prev) =>
          prev > 0 ? prev - 1 : filtered.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightIndex >= 0 && filtered[highlightIndex]) {
          selectOption(filtered[highlightIndex].value);
        }
        break;
      case 'Escape':
        e.preventDefault();
        close();
        break;
    }
  };

  // Portal dropdown — keyboard events bubble through the React tree
  // from the portal to the wrapper div's onKeyDown handler, so we
  // do NOT attach onKeyDown to the search input to avoid double-firing.
  const dropdownContent = isOpen
    ? createPortal(
        <div
          ref={dropdownRef}
          className={styles.dropdown}
          style={dropdownStyle}
          role="listbox"
          aria-label={label}
        >
          {searchable && (
            <input
              ref={searchRef}
              type="text"
              className={styles.searchInput}
              placeholder={t('components.select.search')}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setHighlightIndex(-1);
              }}
            />
          )}
          {filtered.length === 0 && (
            <div className={styles.noResults}>
              {t('components.select.noResults')}
            </div>
          )}
          {filtered.map((option, idx) => (
            <div
              key={option.value}
              role="option"
              aria-selected={option.value === value}
              className={[
                styles.option,
                option.value === value ? styles.optionSelected : '',
                idx === highlightIndex ? styles.optionHighlighted : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => selectOption(option.value)}
              onMouseEnter={() => setHighlightIndex(idx)}
            >
              {option.label}
            </div>
          ))}
        </div>,
        document.body
      )
    : null;

  return (
    <div
      className={[styles.inputWrapper, className].filter(Boolean).join(' ')}
      onKeyDown={handleKeyDown}
    >
      <label
        htmlFor={id}
        className={hideLabel ? styles.srOnly : styles.label}
      >
        {label}
      </label>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        className={[
          styles.input,
          styles.selectTrigger,
          error ? styles.inputError : '',
        ]
          .filter(Boolean)
          .join(' ')}
        onClick={() => (isOpen ? close() : open())}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
      >
        <span className={selectedOption ? styles.selectValue : styles.selectPlaceholder}>
          {selectedOption ? selectedOption.label : (placeholder || '')}
        </span>
        <span className={styles.selectCaret} aria-hidden="true">
          ▾
        </span>
      </button>
      {error && (
        <span id={errorId} className={styles.errorText} role="alert">
          {error}
        </span>
      )}
      {dropdownContent}
    </div>
  );
}
