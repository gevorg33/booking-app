'use client';

import { useMemo, useState } from 'react';
import { useI18n } from '@/i18n';
import { ToggleChoice } from '@/components/ui/radio-choice';

interface MarketingAlertsSettingsPanelProps {
  enabled: boolean;
  emails: string[];
  onChange: (next: {
    emailOnNewCustomerRegistration: boolean;
    marketingTeamEmails: string[];
  }) => void;
}

export function MarketingAlertsSettingsPanel({
  enabled,
  emails,
  onChange,
}: MarketingAlertsSettingsPanelProps) {
  const { t } = useI18n();
  const [emailsInput, setEmailsInput] = useState(emails.join(', '));

  const parsedEmails = useMemo(() => {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const part of emailsInput.split(/[,;\n]+/)) {
      const email = part.trim().toLowerCase();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || seen.has(email)) continue;
      seen.add(email);
      result.push(email);
    }
    return result;
  }, [emailsInput]);

  return (
    <div className="border-t border-gray-100 dark:border-gray-800 pt-4 mt-2 space-y-3">
      <ToggleChoice
        variant="dashboard"
        checked={enabled}
        onChange={(emailOnNewCustomerRegistration) =>
          onChange({
            emailOnNewCustomerRegistration,
            marketingTeamEmails: parsedEmails.length ? parsedEmails : emails,
          })
        }
        label={t('settings.emailOnNewCustomerRegistration')}
      />

      <label className="block text-sm">
        <span className="text-gray-600 dark:text-gray-400">{t('settings.marketingTeamEmails')}</span>
        <input
          className="input w-full text-sm mt-1"
          value={emailsInput}
          placeholder="marketing@salon.com, owner@salon.com"
          onChange={(e) => {
            const nextInput = e.target.value;
            setEmailsInput(nextInput);
            const nextEmails: string[] = [];
            const seen = new Set<string>();
            for (const part of nextInput.split(/[,;\n]+/)) {
              const email = part.trim().toLowerCase();
              if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || seen.has(email)) continue;
              seen.add(email);
              nextEmails.push(email);
            }
            onChange({
              emailOnNewCustomerRegistration: enabled,
              marketingTeamEmails: nextEmails,
            });
          }}
        />
        <p className="text-xs text-gray-500 mt-1">{t('settings.marketingTeamEmailsHint')}</p>
      </label>
    </div>
  );
}
