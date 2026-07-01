'use client';

import { useMemo } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Sparkles } from 'lucide-react';
import { useI18n } from '@/i18n';
import { getPublicServices } from '@/lib/public-api';
import { buildPublicAssistantExampleTenant } from '@/lib/public-assistant-examples.util';
import { firePublicAssistantRun } from '@/lib/public-assistant-events';
import {
  buildPublicAssistantStarterChips,
  resolvePublicAssistantStarterSurface,
} from '@/lib/public-assistant-starter-chips.util';

interface PublicAssistantStarterChipsProps {
  slug: string;
  primaryColor?: string;
  className?: string;
}

/** Inline one-tap chips on checkout + service list (ai-cmd-customer-4.9.2). */
export function PublicAssistantStarterChips({
  slug,
  primaryColor = '#7c3aed',
  className = '',
}: PublicAssistantStarterChipsProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { t, locale } = useI18n();
  const surface = resolvePublicAssistantStarterSurface(pathname);
  const { data: publicServices = [] } = useQuery({
    queryKey: ['public-services', slug, locale, 'starter-chips'],
    queryFn: async () => {
      const response = await getPublicServices(slug, { locale });
      return response.services ?? [];
    },
    enabled: Boolean(slug) && surface === 'service-list',
    staleTime: 60_000,
  });
  const exampleTenant = useMemo(
    () => buildPublicAssistantExampleTenant({ services: publicServices }),
    [publicServices],
  );
  const chips = useMemo(() => {
    const search = searchParams.toString();
    return buildPublicAssistantStarterChips(
      pathname,
      t,
      surface === 'service-list' ? exampleTenant : null,
      search ? `?${search}` : '',
    );
  }, [exampleTenant, pathname, searchParams, surface, t]);

  if (!surface || chips.length === 0) return null;

  return (
    <section
      className={`rounded-2xl border border-violet-100 bg-violet-50/70 px-3 py-3 ${className}`}
      aria-label={t('public.assistantStarterChipsTitle')}
    >
      <div className="flex items-center gap-1.5 mb-2">
        <Sparkles className="w-3.5 h-3.5 shrink-0" style={{ color: primaryColor }} />
        <p className="text-xs font-semibold text-gray-700">{t('public.assistantStarterChipsTitle')}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {chips.map((chip) => (
          <button
            key={chip.id}
            type="button"
            onClick={() => firePublicAssistantRun(chip.prompt)}
            className="inline-flex max-w-full items-center rounded-full border border-violet-200 bg-white px-3 py-1.5 text-left text-xs font-medium text-gray-700 transition-colors hover:border-violet-300 hover:bg-violet-50 hover:text-violet-900"
          >
            <span className="line-clamp-2">{chip.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
