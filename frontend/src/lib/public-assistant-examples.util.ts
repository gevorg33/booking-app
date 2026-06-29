import {
  interpolateAssistantTemplate,
  mapPublicProvidersForAssistantExamples,
  mapPublicServicesForAssistantExamples,
  pickAssistantExampleVars,
  type AssistantExampleTenantInput,
} from '@/lib/assistant-example-tenant.util';
import type { AiTranslateFn } from '@/lib/ai-assistant-i18n';
import {
  PUBLIC_ASSISTANT_ACTION_EXAMPLE_KEYS,
  PUBLIC_ASSISTANT_GUIDE_EXAMPLE_KEYS,
} from '@/lib/public-assistant-guide.util';

const PUBLIC_ACTION_PROMPT_VARS: Partial<
  Record<(typeof PUBLIC_ASSISTANT_ACTION_EXAMPLE_KEYS)[number], string[]>
> = {
  'public.exampleAvailable': ['service'],
  'public.exampleServices': ['service'],
  'public.exampleBook': ['service'],
};

export function buildPublicAssistantExamples(
  guideMode: boolean,
  t: AiTranslateFn,
  tenant?: AssistantExampleTenantInput | null,
): string[] {
  const keys = guideMode
    ? PUBLIC_ASSISTANT_GUIDE_EXAMPLE_KEYS
    : PUBLIC_ASSISTANT_ACTION_EXAMPLE_KEYS;
  const vars = pickAssistantExampleVars(tenant, {
    provider: t('public.fallbackProvider'),
    service: t('public.fallbackService'),
    service2: t('public.fallbackService'),
    serviceCategory: t('public.fallbackServiceCategory'),
  });
  return keys.map((key) => {
    const template = t(key);
    const fields =
      key in PUBLIC_ACTION_PROMPT_VARS
        ? PUBLIC_ACTION_PROMPT_VARS[key as keyof typeof PUBLIC_ACTION_PROMPT_VARS]
        : undefined;
    if (!fields?.length) return template;
    const subset: Record<string, string> = {};
    for (const field of fields) subset[field] = vars[field as keyof typeof vars];
    return interpolateAssistantTemplate(template, subset);
  });
}

export function buildPublicAssistantExampleTenant(input: {
  services?: Array<{ id: string; name: string; category?: { name?: string | null } | null }>;
  providers?: Array<{ id: string; name: string }>;
}): AssistantExampleTenantInput {
  return {
    services: mapPublicServicesForAssistantExamples(input.services ?? []),
    providers: mapPublicProvidersForAssistantExamples(input.providers ?? []),
  };
}
