import type { AiTranslateFn } from '@/lib/ai-assistant-i18n';
import {
  interpolateAssistantTemplate,
  pickAssistantExampleVars,
  type AssistantExampleTenantInput,
} from '@/lib/assistant-example-tenant.util';
import {
  CONSUMER_PAGE_SUGGESTION_I18N_KEYS,
  type ConsumerPageSuggestionId,
} from '@/lib/consumer-page-suggestions.types';
import { isPublicBookCheckoutPath } from '@/lib/consumer-page-suggestions.util';

export type PublicAssistantStarterSurface = 'checkout' | 'service-list';

export type PublicAssistantStarterChip = {
  id: string;
  label: string;
  prompt: string;
};

const STARTER_SURFACE_PAGE_ID: Record<
  PublicAssistantStarterSurface,
  ConsumerPageSuggestionId
> = {
  checkout: 'book',
  'service-list': 'service-list',
};

const SERVICE_INTERPOLATION_KEYS = new Set([
  'public.pageSuggestions.serviceList.servicePrice',
  'public.pageSuggestions.serviceList.payOnlineOrCash',
]);

/** Pages that show inline starter chips (ai-cmd-customer-4.9.2). */
export function resolvePublicAssistantStarterSurface(
  pathname: string,
): PublicAssistantStarterSurface | null {
  if (isPublicBookCheckoutPath(pathname)) return 'checkout';
  if (/\/services(\/|$|\?)/i.test(pathname)) return 'service-list';
  return null;
}

export function buildPublicAssistantStarterChips(
  pathname: string,
  t: AiTranslateFn,
  tenant?: AssistantExampleTenantInput | null,
  search = '',
): PublicAssistantStarterChip[] {
  void search;
  const surface = resolvePublicAssistantStarterSurface(pathname);
  if (!surface) return [];

  const pageId = STARTER_SURFACE_PAGE_ID[surface];
  const keys = CONSUMER_PAGE_SUGGESTION_I18N_KEYS[pageId];
  const vars = pickAssistantExampleVars(tenant, {
    provider: t('public.fallbackProvider'),
    service: t('public.fallbackService'),
    service2: t('public.fallbackService'),
    serviceCategory: t('public.fallbackServiceCategory'),
  });

  return keys.map((key) => {
    const template = t(key);
    const prompt = SERVICE_INTERPOLATION_KEYS.has(key)
      ? interpolateAssistantTemplate(template, { service: vars.service })
      : template;
    return {
      id: `${surface}-${key}`,
      label: prompt,
      prompt,
    };
  });
}
