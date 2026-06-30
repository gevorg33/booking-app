import {
  interpolateAssistantTemplate,
  pickAssistantExampleVars,
  type AssistantExampleTenantInput,
} from './assistant-example-tenant.util';

export type ProviderAiTranslateFn = (
  key: string,
  vars?: Record<string, string | number>,
) => string;

const PROVIDER_EXAMPLE_KEYS = [
  'provider.exampleSickCancel',
  'provider.exampleMarkJohn',
  'provider.exampleMarkAllPaid',
  'provider.exampleScheduleToday',
  'provider.exampleCountAppointmentsTomorrow',
  'provider.exampleRevenueLastWeek',
  'provider.exampleExplainPushSetup',
  'provider.exampleEnablePush',
] as const;

const PROVIDER_EXAMPLE_VARS: Partial<
  Record<(typeof PROVIDER_EXAMPLE_KEYS)[number], string[]>
> = {
  'provider.exampleMarkJohn': ['service'],
};

function resolveProviderExampleFallbacks(t: ProviderAiTranslateFn) {
  return {
    provider: t('provider.fallbackProvider'),
    service: t('provider.fallbackService'),
    service2: t('provider.fallbackService'),
    serviceCategory: t('provider.fallbackServiceCategory'),
  };
}

export function buildProviderAiExamples(
  t: ProviderAiTranslateFn,
  tenant?: AssistantExampleTenantInput | null,
): string[] {
  const vars = pickAssistantExampleVars(tenant, resolveProviderExampleFallbacks(t));
  return PROVIDER_EXAMPLE_KEYS.map((key) => {
    const template = t(key);
    const fields = PROVIDER_EXAMPLE_VARS[key];
    if (!fields?.length) return template;
    const subset: Record<string, string> = {};
    for (const field of fields) subset[field] = vars[field as keyof typeof vars];
    return interpolateAssistantTemplate(template, subset);
  });
}
