'use client';

import { PhoneInput } from '@/components/public-booking/phone-input';
import { defaultCountryFromCallingCode } from '@/lib/phone-format';
import { useI18n } from '@/i18n';
import './dashboard-phone-input.css';

interface DashboardPhoneInputProps {
  value?: string;
  onChange: (value: string | undefined) => void;
  defaultCountryCode?: string;
  label?: string;
  required?: boolean;
}

export function DashboardPhoneInput({
  value,
  onChange,
  defaultCountryCode = '374',
  label,
  required,
}: DashboardPhoneInputProps) {
  const { t, locale } = useI18n();

  return (
    <div className="dashboard-phone-field">
      {label && <label className="label">{label}</label>}
      <PhoneInput
        value={value}
        onChange={onChange}
        defaultCountry={defaultCountryFromCallingCode(defaultCountryCode)}
        placeholder={t('public.phonePlaceholder')}
        searchPlaceholder={t('public.phoneCountrySearch')}
        searchNotFound={t('public.phoneCountryNotFound')}
        locale={locale}
        required={required}
      />
    </div>
  );
}
