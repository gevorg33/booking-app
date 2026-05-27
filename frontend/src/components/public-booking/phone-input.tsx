'use client';

import PhoneInputWithCountry, { type Country } from 'react-phone-number-input';
import en from 'react-phone-number-input/locale/en.json';
import hy from 'react-phone-number-input/locale/hy.json';
import ru from 'react-phone-number-input/locale/ru.json';
import 'react-phone-number-input/style.css';
import { SearchableCountrySelect } from '@/components/public-booking/searchable-country-select';
import './phone-input.css';

const LABELS = { en, hy, ru } as const;

interface PhoneInputProps {
  value?: string;
  onChange: (value: string | undefined) => void;
  defaultCountry: Country;
  label?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  searchNotFound?: string;
  required?: boolean;
  locale?: string;
}

export function PhoneInput({
  value,
  onChange,
  defaultCountry,
  label,
  placeholder,
  searchPlaceholder,
  searchNotFound,
  required,
  locale = 'en',
}: PhoneInputProps) {
  const labels = LABELS[locale as keyof typeof LABELS] ?? en;

  return (
    <div className="public-phone-field">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required ? ' *' : ''}
        </label>
      )}
      <PhoneInputWithCountry
        international
        defaultCountry={defaultCountry}
        labels={labels}
        addInternationalOption={false}
        countryCallingCodeEditable={false}
        countrySelectComponent={SearchableCountrySelect}
        countrySelectProps={{ searchPlaceholder, searchNotFound }}
        value={value}
        onChange={(next) => onChange(next)}
        placeholder={placeholder}
        numberInputProps={{ required }}
      />
    </div>
  );
}
