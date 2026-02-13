import { useState, useCallback, useRef, useEffect } from 'react';
import { Select } from '@/components/Input/Select';
import type { SelectOption } from '@/components/Input/Select';
import styles from './GhostTextField.module.scss';

export interface GhostTextFieldProps {
  /** Field label displayed above the value */
  label: string;
  /** The current field value (e.g., 'DirectCost', work order id) */
  value: string;
  /** Field type: category/project enable searchable dropdown, readonly disables interaction */
  type: 'category' | 'project' | 'readonly';
  /** Dropdown options for category/project types */
  options?: SelectOption[];
  /** Whether the field has been user-edited (shows checkmark + gold border) */
  isEdited: boolean;
  /** Called when user selects a new value from the dropdown */
  onChange?: (value: string) => void;
  /** Reports dropdown open/close state for Escape key layering */
  onDropdownToggle?: (isOpen: boolean) => void;
}

/**
 * Ghost Text Field — editable field with AI-suggested, editing, user-edited, and readonly states.
 *
 * Default: dashed border, muted italic text (AI-suggested).
 * Click/focus: activates Select dropdown (category/project types).
 * After selection: solid gold border, checkmark indicator (user-edited).
 * Readonly: solid muted border, no interaction.
 */
export function GhostTextField({
  label,
  value,
  type,
  options = [],
  isEdited,
  onChange,
  onDropdownToggle,
}: GhostTextFieldProps) {
  const [isActive, setIsActive] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const selectContainerRef = useRef<HTMLDivElement>(null);

  // Resolve display value from options; fall back to raw value
  const displayValue = options.find((o) => o.value === value)?.label ?? value;

  // Auto-open Select dropdown when entering edit mode
  useEffect(() => {
    if (isActive && selectContainerRef.current) {
      requestAnimationFrame(() => {
        const trigger = selectContainerRef.current?.querySelector('button');
        trigger?.click();
      });
    }
  }, [isActive]);

  // Deactivate when focus leaves the component entirely
  useEffect(() => {
    if (!isActive) return;

    const handleFocusOut = () => {
      // Delay to allow focus to settle (portal transitions)
      requestAnimationFrame(() => {
        const activeEl = document.activeElement;
        // Still inside wrapper?
        if (wrapperRef.current?.contains(activeEl)) return;
        // Inside a portal dropdown?
        if (activeEl?.closest('[role="listbox"]')) return;

        setIsActive(false);
        onDropdownToggle?.(false);
      });
    };

    const wrapper = wrapperRef.current;
    wrapper?.addEventListener('focusout', handleFocusOut);
    return () => wrapper?.removeEventListener('focusout', handleFocusOut);
  }, [isActive, onDropdownToggle]);

  const handleActivate = useCallback(() => {
    if (type === 'readonly' || isActive) return;
    setIsActive(true);
    onDropdownToggle?.(true);
  }, [type, isActive, onDropdownToggle]);

  const handleChange = useCallback(
    (newValue: string) => {
      onChange?.(newValue);
      setIsActive(false);
      onDropdownToggle?.(false);
    },
    [onChange, onDropdownToggle],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (type === 'readonly') return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleActivate();
      }
    },
    [type, handleActivate],
  );

  // Build class names
  const fieldClasses = [
    styles.ghostTextField,
    type === 'readonly' ? styles.readonly : '',
    isActive ? styles.editing : '',
    isEdited && !isActive ? styles.userEdited : '',
  ]
    .filter(Boolean)
    .join(' ');

  // Readonly: solid muted border, no interaction
  if (type === 'readonly') {
    return (
      <div className={fieldClasses} ref={wrapperRef} data-testid="ghost-text-field">
        <span className={styles.label}>{label}</span>
        <span className={styles.value}>{displayValue}</span>
      </div>
    );
  }

  // Active: show Select component with searchable dropdown
  if (isActive) {
    return (
      <div className={fieldClasses} ref={wrapperRef} data-testid="ghost-text-field">
        <span className={styles.label}>{label}</span>
        <div ref={selectContainerRef} className={styles.selectContainer}>
          <Select
            label={label}
            hideLabel
            options={options}
            value={value}
            onChange={handleChange}
            searchable
          />
        </div>
      </div>
    );
  }

  // Default: ghost text display (clickable)
  return (
    <div
      className={fieldClasses}
      ref={wrapperRef}
      onClick={handleActivate}
      onFocus={handleActivate}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`${label}: ${displayValue}`}
      data-testid="ghost-text-field"
    >
      <span className={styles.label}>{label}</span>
      <span className={styles.value}>{displayValue}</span>
      {isEdited && (
        <span className={styles.checkmark} aria-hidden="true">
          ✓
        </span>
      )}
    </div>
  );
}
