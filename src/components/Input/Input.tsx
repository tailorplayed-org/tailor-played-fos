import { type InputHTMLAttributes, useId } from 'react';
import styles from './Input.module.scss';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: string;
  hideLabel?: boolean;
  error?: string;
  helperText?: string;
}

export function Input({
  label,
  hideLabel = false,
  error,
  helperText,
  id: idProp,
  className,
  ...props
}: InputProps) {
  const autoId = useId();
  const id = idProp || autoId;
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className={[styles.inputWrapper, className].filter(Boolean).join(' ')}>
      <label
        htmlFor={id}
        className={hideLabel ? styles.srOnly : styles.label}
      >
        {label}
      </label>
      <input
        id={id}
        className={[styles.input, error ? styles.inputError : '']
          .filter(Boolean)
          .join(' ')}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
        {...props}
      />
      {error && (
        <span id={errorId} className={styles.errorText} role="alert">
          {error}
        </span>
      )}
      {helperText && !error && (
        <span className={styles.helperText}>{helperText}</span>
      )}
    </div>
  );
}
