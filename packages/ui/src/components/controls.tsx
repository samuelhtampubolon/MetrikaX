/**
 * P08: the data entry controls.
 */

import { useId, type ChangeEvent, type KeyboardEvent, type ReactNode } from 'react';
import { bevelClass } from './primitives.tsx';

export interface NumericFieldProps {
  readonly label: string;
  readonly value: string;
  readonly onChange: (next: string) => void;
  /** The unit suffix. It is rendered outside the field, never inside it. */
  readonly suffix?: string;
  readonly disabled?: boolean;
  readonly describedBy?: string;
  readonly autoFocus?: boolean;
}

/** Characters a numeric field accepts. Everything else is rejected at the keystroke. */
const NUMERIC_KEY = /^[0-9.,\-+eE]$/;
const EDITING_KEY = new Set([
  'Backspace',
  'Delete',
  'Tab',
  'Enter',
  'Escape',
  'Home',
  'End',
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
]);

/**
 * NumericField: sunken, white, right aligned, monospace. It rejects non-numeric keys rather than
 * accepting them and complaining afterwards, and it shows its unit outside the field so the value
 * the user reads is the value the engine holds.
 */
export function NumericField({
  label,
  value,
  onChange,
  suffix = '',
  disabled = false,
  describedBy,
  autoFocus = false,
}: NumericFieldProps): ReactNode {
  const id = useId();

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (EDITING_KEY.has(event.key)) return;
    if (!NUMERIC_KEY.test(event.key)) event.preventDefault();
  };

  return (
    <div className="mk-field-row">
      <label className="mk-field-row__label" htmlFor={id} title={label}>
        {label}
      </label>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        className={bevelClass('sunken', 'mk-numeric')}
        value={value}
        disabled={disabled}
        autoFocus={autoFocus}
        aria-describedby={describedBy}
        onKeyDown={handleKeyDown}
        onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
      />
      <span className="mk-field-row__suffix" aria-hidden={suffix === ''}>
        {suffix}
      </span>
    </div>
  );
}

export interface ComboBoxOption {
  readonly value: string;
  readonly label: string;
}

export interface ComboBoxProps {
  readonly label: string;
  readonly value: string;
  readonly options: readonly ComboBoxOption[];
  readonly onChange: (next: string) => void;
  readonly disabled?: boolean;
}

/** ComboBox: 22px, sunken field with a raised 16px drop button bearing a text caret glyph. */
export function ComboBox({
  label,
  value,
  options,
  onChange,
  disabled = false,
}: ComboBoxProps): ReactNode {
  return (
    <span className={bevelClass('sunken', 'mk-combo')}>
      <select
        className="mk-combo__select"
        aria-label={label}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <span className={bevelClass('raised', 'mk-combo__button')} aria-hidden="true">
        v
      </span>
    </span>
  );
}

export interface PushButtonProps {
  readonly children: ReactNode;
  readonly onClick?: () => void;
  readonly disabled?: boolean;
  /** The default action of the surrounding form, bound to Enter. */
  readonly isDefault?: boolean;
  readonly type?: 'button' | 'submit';
  readonly title?: string;
}

/** PushButton: raised by default, sunken while active, dotted focus rectangle inset 3px. */
export function PushButton({
  children,
  onClick,
  disabled = false,
  isDefault = false,
  type = 'button',
  title,
}: PushButtonProps): ReactNode {
  return (
    <button
      type={type}
      className={bevelClass('raised', 'mk-button')}
      data-default={String(isDefault)}
      disabled={disabled}
      title={title}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export interface SearchFieldProps {
  readonly label: string;
  readonly value: string;
  readonly onChange: (next: string) => void;
  readonly inputRef?: React.Ref<HTMLInputElement>;
}

/** A plain text field, sunken like every other field. Filters as the user types. */
export function SearchField({ label, value, onChange, inputRef }: SearchFieldProps): ReactNode {
  return (
    <input
      ref={inputRef}
      type="search"
      className={bevelClass('sunken', 'mk-numeric')}
      style={{ textAlign: 'left', fontFamily: 'var(--font-ui)' }}
      aria-label={label}
      placeholder=""
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}
