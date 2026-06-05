'use client';

import { useMemo, useState } from 'react';
import { useI18n } from '@/i18n';
import { ToggleChoice } from '@/components/ui/radio-choice';

function parseHoursInput(raw: string): number[] {
  const seen = new Set<number>();
  const result: number[] = [];
  for (const part of raw.split(/[,\s]+/)) {
    const hours = Math.round(Number(part.trim()));
    if (!Number.isFinite(hours) || hours < 1 || hours > 168 || seen.has(hours)) continue;
    seen.add(hours);
    result.push(hours);
  }
  return result.sort((a, b) => b - a);
}

interface CustomerReminderSettingsPanelProps {
  enabled: boolean;
  optionsHours: number[];
  defaultHours: number | null;
  onChange: (next: {
    allowCustomerReminderChoice: boolean;
    customerReminderOptionsHours: number[];
    defaultCustomerReminderHours: number | null;
  }) => void;
}

export function CustomerReminderSettingsPanel({
  enabled,
  optionsHours,
  defaultHours,
  onChange,
}: CustomerReminderSettingsPanelProps) {
  const { t } = useI18n();
  const [hoursInput, setHoursInput] = useState(optionsHours.join(', '));

  const parsedHours = useMemo(() => parseHoursInput(hoursInput), [hoursInput]);
  const effectiveDefault =
    defaultHours != null && parsedHours.includes(defaultHours) ? defaultHours : parsedHours[0] ?? null;

  return (
    <div className="border-t border-gray-100 dark:border-gray-800 pt-4 mt-2 space-y-3">
      <ToggleChoice
        variant="dashboard"
        layout="toggle-first"
        checked={enabled}
        onChange={(allowCustomerReminderChoice) =>
          onChange({
            allowCustomerReminderChoice,
            customerReminderOptionsHours: parsedHours.length ? parsedHours : optionsHours,
            defaultCustomerReminderHours: effectiveDefault,
          })
        }
        label={t('settings.allowCustomerReminderChoice')}
      />

      {enabled && (
        <>
          <label className="block text-sm">
            <span className="text-gray-600 dark:text-gray-400">{t('settings.customerReminderOptions')}</span>
            <input
              className="input w-full text-sm mt-1"
              value={hoursInput}
              placeholder="24, 12, 6, 1"
              onChange={(e) => {
                const nextInput = e.target.value;
                setHoursInput(nextInput);
                const nextHours = parseHoursInput(nextInput);
                onChange({
                  allowCustomerReminderChoice: true,
                  customerReminderOptionsHours: nextHours.length ? nextHours : optionsHours,
                  defaultCustomerReminderHours:
                    effectiveDefault != null && nextHours.includes(effectiveDefault)
                      ? effectiveDefault
                      : nextHours[0] ?? null,
                });
              }}
            />
            <p className="text-xs text-gray-500 mt-1">{t('settings.customerReminderOptionsHint')}</p>
          </label>

          {parsedHours.length > 0 && (
            <label className="block text-sm">
              <span className="text-gray-600 dark:text-gray-400">{t('settings.defaultCustomerReminder')}</span>
              <select
                className="input w-full text-sm mt-1"
                value={effectiveDefault ?? ''}
                onChange={(e) =>
                  onChange({
                    allowCustomerReminderChoice: true,
                    customerReminderOptionsHours: parsedHours,
                    defaultCustomerReminderHours: e.target.value ? Number(e.target.value) : null,
                  })
                }
              >
                {parsedHours.map((hours) => (
                  <option key={hours} value={hours}>
                    {hours === 1 ? '1 hour before' : `${hours} hours before`}
                  </option>
                ))}
              </select>
            </label>
          )}
        </>
      )}
    </div>
  );
}
