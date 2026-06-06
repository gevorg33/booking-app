'use client';

import { Check } from 'lucide-react';
import { useId, type ReactNode } from 'react';

export const DASHBOARD_PRIMARY = '#2563eb';

type StylishChoiceProps = {
  type?: 'checkbox' | 'radio';
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: ReactNode;
  disabled?: boolean;
  className?: string;
  labelClassName?: string;
  primaryColor?: string;
  name?: string;
  value?: string;
};

/** Circular control (radio look) for checkbox or radio inputs. */
export function StylishChoice({
  type = 'checkbox',
  checked,
  onChange,
  label,
  disabled,
  className = '',
  labelClassName = 'text-sm text-gray-600',
  primaryColor = DASHBOARD_PRIMARY,
  name,
  value,
}: StylishChoiceProps) {
  const id = useId();
  const accent = primaryColor;

  return (
    <label
      htmlFor={id}
      className={`inline-flex items-start gap-3 cursor-pointer select-none ${
        disabled ? 'opacity-60 pointer-events-none' : ''
      } ${className}`}
    >
      <span className="relative mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
        <input
          id={id}
          type={type}
          name={name}
          value={value}
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <span
          aria-hidden
          className="h-5 w-5 rounded-full border-2 bg-white transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2 dark:peer-focus-visible:ring-offset-gray-900"
          style={{
            borderColor: checked ? accent : '#d1d5db',
          }}
        />
        <span
          aria-hidden
          className="pointer-events-none absolute h-2.5 w-2.5 rounded-full transition-transform"
          style={{
            backgroundColor: accent,
            transform: checked ? 'scale(1)' : 'scale(0)',
          }}
        />
      </span>
      {label != null && <span className={labelClassName}>{label}</span>}
    </label>
  );
}

export type ToggleChoiceVariant = 'light' | 'dashboard';

type CheckboxChoiceProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: ReactNode;
  disabled?: boolean;
  className?: string;
  labelClassName?: string;
  primaryColor?: string;
};

/** Square dashboard checkbox (settings-style), for multi-select lists. */
export function CheckboxChoice({
  checked,
  onChange,
  label,
  disabled,
  className = '',
  labelClassName = 'text-sm text-gray-700 dark:text-gray-200',
  primaryColor = DASHBOARD_PRIMARY,
}: CheckboxChoiceProps) {
  const id = useId();
  const accent = primaryColor;

  return (
    <label
      htmlFor={id}
      className={`flex w-full min-h-[44px] items-center gap-3 cursor-pointer select-none ${
        disabled ? 'pointer-events-none opacity-60' : ''
      } ${className}`}
    >
      <span className="relative flex h-5 w-5 shrink-0 items-center justify-center">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <span
          aria-hidden
          className="flex h-5 w-5 items-center justify-center rounded border-2 border-gray-300 bg-white transition-colors dark:border-gray-600 dark:bg-gray-900 peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2 dark:peer-focus-visible:ring-offset-gray-900"
          style={{
            borderColor: checked ? accent : undefined,
            backgroundColor: checked ? accent : undefined,
          }}
        >
          <Check
            className={`h-3.5 w-3.5 text-white transition-opacity ${checked ? 'opacity-100' : 'opacity-0'}`}
            strokeWidth={3}
          />
        </span>
      </span>
      {label != null && <span className={`min-w-0 flex-1 ${labelClassName}`}>{label}</span>}
    </label>
  );
}

type ToggleChoiceProps = {
  checked: boolean;
  onChange: (value: boolean) => void;
  label?: ReactNode;
  primaryColor?: string;
  disabled?: boolean;
  className?: string;
  variant?: ToggleChoiceVariant;
  /** `inline` — label beside switch; `spread` — label left, switch far right; `toggle-first` — switch left, aligned column */
  layout?: 'inline' | 'spread' | 'toggle-first';
};

function toggleLabelClass(variant: ToggleChoiceVariant, layout: 'inline' | 'spread' | 'toggle-first') {
  const base =
    variant === 'dashboard'
      ? 'text-sm text-gray-700 dark:text-gray-200 leading-snug min-w-0'
      : 'text-sm text-gray-700 leading-snug min-w-0';
  return layout === 'spread' || layout === 'toggle-first' ? `${base} flex-1` : base;
}

function toggleTrackOffClass(variant: ToggleChoiceVariant) {
  return variant === 'dashboard'
    ? 'bg-gray-200 shadow-inner dark:bg-gray-600'
    : 'bg-gray-200 shadow-inner';
}

/** Label + switch (no Yes/No pills). Use in public booking and dashboard settings. */
export function ToggleChoice({
  checked,
  onChange,
  label,
  primaryColor = DASHBOARD_PRIMARY,
  disabled,
  className = '',
  variant = 'light',
  layout,
}: ToggleChoiceProps) {
  const id = useId();
  const accent = primaryColor;
  /** Public booking stacks toggles — align switches on one column at the right. */
  const resolvedLayout = layout ?? (variant === 'light' ? 'spread' : 'inline');
  const fullWidth = resolvedLayout === 'spread' || resolvedLayout === 'toggle-first';

  const labelEl =
    label != null ? (
      <span className={toggleLabelClass(variant, resolvedLayout)}>{label}</span>
    ) : null;

  const toggleEl = (
    <span
      className="relative isolate h-7 w-12 shrink-0 rounded-full"
      style={{ ['--toggle-accent' as string]: accent }}
    >
      <input
        id={id}
        type="checkbox"
        role="switch"
        aria-checked={checked}
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className={`absolute inset-0 rounded-full transition-[background-color,box-shadow] duration-200 peer-checked:bg-[var(--toggle-accent)] peer-checked:shadow-[0_1px_6px_color-mix(in_srgb,var(--toggle-accent)_30%,transparent)] peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--toggle-accent)]/35 peer-focus-visible:ring-offset-2 dark:peer-focus-visible:ring-offset-gray-900 ${toggleTrackOffClass(variant)}`}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform duration-200 ease-out peer-checked:translate-x-5"
      />
    </span>
  );

  return (
    <label
      htmlFor={id}
      className={`flex max-w-full cursor-pointer select-none items-center gap-3 py-2 ${
        fullWidth ? 'w-full' : 'w-fit'
      } ${resolvedLayout === 'spread' ? 'justify-between' : 'justify-start'} ${
        disabled ? 'pointer-events-none opacity-60' : ''
      } ${className}`}
    >
      {resolvedLayout === 'toggle-first' ? (
        <>
          {toggleEl}
          {labelEl}
        </>
      ) : (
        <>
          {labelEl}
          {toggleEl}
        </>
      )}
    </label>
  );
}

type RadioCardProps = {
  checked: boolean;
  onSelect: () => void;
  name: string;
  value: string;
  primaryColor?: string;
  children: ReactNode;
  className?: string;
};

/** Large selectable card with a stylish radio indicator (public checkout options). */
export function RadioCard({
  checked,
  onSelect,
  name,
  value,
  primaryColor = DASHBOARD_PRIMARY,
  children,
  className = '',
}: RadioCardProps) {
  const accent = primaryColor;

  return (
    <label
      className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
        checked ? 'ring-2' : 'border-gray-200'
      } ${className}`}
      style={
        checked
          ? { borderColor: accent, boxShadow: `0 0 0 1px ${accent}22` }
          : undefined
      }
    >
      <StylishChoice
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={(next) => {
          if (next) onSelect();
        }}
        primaryColor={accent}
        className="mt-0.5"
      />
      <div className="flex-1 min-w-0">{children}</div>
    </label>
  );
}
