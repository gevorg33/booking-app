'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { getCountryCallingCode, type Country } from 'react-phone-number-input';

export interface CountrySelectOption {
  value?: string;
  label: string;
}

interface IconComponentProps {
  country?: string;
  label?: string;
  'aria-hidden'?: boolean;
}

export interface SearchableCountrySelectProps {
  value?: string;
  onChange: (country?: string) => void;
  options: CountrySelectOption[];
  iconComponent: React.ComponentType<IconComponentProps>;
  disabled?: boolean;
  readOnly?: boolean;
  className?: string;
  onFocus?: () => void;
  onBlur?: () => void;
  searchPlaceholder?: string;
  searchNotFound?: string;
}

function filterCountryOptions(options: CountrySelectOption[], query: string): CountrySelectOption[] {
  const raw = query.trim().toLowerCase();
  if (!raw) return options;

  const dialQuery = raw.replace(/^\+/, '');

  return options.filter((option) => {
    if (!option.value) {
      return option.label.toLowerCase().includes(raw);
    }

    const country = option.value as Country;
    const dial = getCountryCallingCode(country);
    const label = option.label.toLowerCase();
    const iso = option.value.toLowerCase();

    return (
      dial.startsWith(dialQuery) ||
      `+${dial}`.includes(raw) ||
      label.includes(raw) ||
      iso.includes(raw)
    );
  });
}

export function SearchableCountrySelect({
  value,
  onChange,
  options,
  iconComponent: Icon,
  disabled,
  readOnly,
  className,
  onFocus,
  onBlur,
  searchPlaceholder = 'Search country or +code',
  searchNotFound = 'No countries found',
}: SearchableCountrySelectProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selected = options.find((option) => option.value === value) ?? options[0];
  const filtered = useMemo(() => filterCountryOptions(options, search), [options, search]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setSearch('');
        onBlur?.();
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open, onBlur]);

  useEffect(() => {
    if (open) {
      searchRef.current?.focus();
    }
  }, [open]);

  const pickCountry = (country?: string) => {
    onChange(country);
    setOpen(false);
    setSearch('');
    onBlur?.();
  };

  const dialCode = value ? `+${getCountryCallingCode(value as Country)}` : '';

  return (
    <div ref={rootRef} className={`searchable-country-select ${className ?? ''}`.trim()}>
      <button
        type="button"
        className="searchable-country-select__trigger"
        disabled={disabled || readOnly}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => {
          if (disabled || readOnly) return;
          if (!open) onFocus?.();
          setOpen((prev) => !prev);
          if (open) {
            setSearch('');
            onBlur?.();
          }
        }}
      >
        <Icon country={value} label={selected?.label ?? ''} aria-hidden />
        <span className="searchable-country-select__dial">{dialCode}</span>
        <span className="searchable-country-select__chevron" aria-hidden>
          ▾
        </span>
      </button>

      {open && (
        <div className="searchable-country-select__menu" role="listbox">
          <input
            ref={searchRef}
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="searchable-country-select__search"
            aria-label={searchPlaceholder}
          />
          <ul className="searchable-country-select__list">
            {filtered.length === 0 ? (
              <li className="searchable-country-select__empty">{searchNotFound}</li>
            ) : (
              filtered.map((option) => {
                const code = option.value ? `+${getCountryCallingCode(option.value as Country)}` : '';
                const active = option.value === value;
                return (
                  <li key={option.value ?? 'intl'}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={active}
                      className={`searchable-country-select__option${active ? ' is-active' : ''}`}
                      onClick={() => pickCountry(option.value)}
                    >
                      <Icon country={option.value} label={option.label} aria-hidden />
                      <span className="searchable-country-select__name">{option.label}</span>
                      {code && <span className="searchable-country-select__code">{code}</span>}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
