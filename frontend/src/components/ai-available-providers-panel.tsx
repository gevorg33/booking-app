'use client';

import { CalendarClock } from 'lucide-react';
import { useI18n } from '@/i18n';
import {
  buildProviderBookingPrompt,
  formatProviderTimes,
  type AiAvailableProvider,
} from '@/lib/ai-available-providers.util';

interface AiAvailableProvidersPanelProps {
  providers: AiAvailableProvider[];
  serviceName?: string;
  date?: string;
  onBook: (prompt: string) => void;
}

export function AiAvailableProvidersPanel({
  providers,
  serviceName,
  date,
  onBook,
}: AiAvailableProvidersPanelProps) {
  const { t } = useI18n();

  if (providers.length === 0) return null;

  return (
    <div className="mt-2 rounded-lg border border-violet-500/30 bg-violet-950/20 p-2 space-y-1.5">
      <p className="text-[10px] uppercase tracking-wide text-violet-300/80">
        {t('ai.availableProvidersTitle')}
      </p>
      {providers.map((provider) => {
        const times = formatProviderTimes(provider);
        return (
          <button
            key={provider.id ?? provider.name}
            type="button"
            onClick={() =>
              onBook(
                buildProviderBookingPrompt({
                  provider,
                  serviceName,
                  date,
                }),
              )
            }
            className="w-full text-left rounded-md border border-violet-500/20 bg-gray-900/50 hover:bg-violet-900/30 px-2.5 py-2 transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm text-violet-50 font-medium truncate">
                  {provider.name}
                  {provider.role ? (
                    <span className="text-violet-300/70 font-normal"> · {provider.role}</span>
                  ) : null}
                </p>
                {times ? (
                  <p className="text-[11px] text-violet-200/80 mt-0.5 flex items-center gap-1">
                    <CalendarClock className="w-3 h-3 shrink-0" />
                    <span className="truncate">{times}</span>
                  </p>
                ) : null}
              </div>
              <span className="text-[10px] text-violet-300 shrink-0 pt-0.5">
                {t('ai.bookProvider')}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
