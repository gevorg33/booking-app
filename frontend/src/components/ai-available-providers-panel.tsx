'use client';

import { CalendarClock } from 'lucide-react';
import { useI18n } from '@/i18n';
import {
  buildProviderBookingPrompt,
  listProviderBookableTimes,
  type AiAvailableProvider,
} from '@/lib/ai-available-providers.util';

interface AiAvailableProviderSlotSelection {
  provider: AiAvailableProvider;
  time?: string;
  prompt: string;
}

interface AiAvailableProvidersPanelProps {
  providers: AiAvailableProvider[];
  serviceName?: string;
  date?: string;
  onBook: (prompt: string) => void;
  onSelectSlot?: (selection: AiAvailableProviderSlotSelection) => void;
  variant?: 'dark' | 'light';
  primaryColor?: string;
}

export function AiAvailableProvidersPanel({
  providers,
  serviceName,
  date,
  onBook,
  onSelectSlot,
  variant = 'dark',
  primaryColor,
}: AiAvailableProvidersPanelProps) {
  const handleSlotPress = (
    provider: AiAvailableProvider,
    prompt: string,
    time?: string,
  ) => {
    if (onSelectSlot) {
      onSelectSlot({ provider, time, prompt });
      return;
    }
    onBook(prompt);
  };

  const { t } = useI18n();
  const isLight = variant === 'light';

  if (providers.length === 0) return null;

  return (
    <div
      className={
        isLight
          ? 'mt-2 rounded-xl border border-gray-200 bg-white p-2 space-y-1.5'
          : 'mt-2 rounded-lg border border-violet-500/30 bg-violet-950/20 p-2 space-y-1.5'
      }
    >
      <p
        className={
          isLight
            ? 'text-[10px] uppercase tracking-wide text-gray-500'
            : 'text-[10px] uppercase tracking-wide text-violet-300/80'
        }
      >
        {t('ai.availableProvidersTitle')}
      </p>
      {providers.map((provider) => {
        const times = listProviderBookableTimes(provider);
        const rowKey = provider.id ?? provider.name;
        const slotButtonClass = isLight
          ? 'rounded-lg border border-gray-200 bg-white hover:bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-800 transition-colors'
          : 'rounded-md border border-violet-500/30 bg-gray-900/40 hover:bg-violet-900/30 px-2.5 py-1 text-xs font-medium text-violet-100 transition-colors';

        return (
          <div
            key={rowKey}
            className={
              isLight
                ? 'rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-2'
                : 'rounded-md border border-violet-500/20 bg-gray-900/50 px-2.5 py-2'
            }
          >
            <p
              className={
                isLight
                  ? 'text-sm text-gray-900 font-medium truncate'
                  : 'text-sm text-violet-50 font-medium truncate'
              }
            >
              {provider.name}
              {provider.role ? (
                <span
                  className={
                    isLight
                      ? 'text-gray-500 font-normal'
                      : 'text-violet-300/70 font-normal'
                  }
                >
                  {' '}
                  · {provider.role}
                </span>
              ) : null}
            </p>
            {times.length > 0 ? (
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <CalendarClock
                  className={
                    isLight
                      ? 'w-3 h-3 shrink-0 text-gray-400'
                      : 'w-3 h-3 shrink-0 text-violet-300/70'
                  }
                />
                {times.map((time) => (
                  <button
                    key={`${rowKey}-${time}`}
                    type="button"
                    onClick={() =>
                      handleSlotPress(
                        provider,
                        buildProviderBookingPrompt({
                          provider,
                          serviceName,
                          date,
                          time,
                        }),
                        time,
                      )
                    }
                    className={slotButtonClass}
                    style={
                      isLight && primaryColor
                        ? { borderColor: `${primaryColor}44`, color: primaryColor }
                        : undefined
                    }
                  >
                    {time}
                  </button>
                ))}
              </div>
            ) : (
              <button
                type="button"
                onClick={() =>
                  handleSlotPress(
                    provider,
                    buildProviderBookingPrompt({
                      provider,
                      serviceName,
                      date,
                    }),
                  )
                }
                className={`mt-1.5 ${slotButtonClass}`}
                style={isLight && primaryColor ? { color: primaryColor } : undefined}
              >
                {t('ai.bookProvider')}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
