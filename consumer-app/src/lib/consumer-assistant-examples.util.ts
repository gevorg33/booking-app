import {
  interpolateAssistantTemplate,
  pickAssistantExampleVars,
  type AssistantExampleTenantInput,
} from './assistant-example-tenant.util.js';
import type { ConsumerCopy } from './consumer-copy.types.js';
import {
  CONSUMER_ASSISTANT_ACTION_EXAMPLE_KEYS,
  CONSUMER_ASSISTANT_GUIDE_EXAMPLE_KEYS,
} from './consumer-assistant-guide.util.js';

const CONSUMER_ACTION_PROMPT_VARS: Partial<
  Record<(typeof CONSUMER_ASSISTANT_ACTION_EXAMPLE_KEYS)[number], string[]>
> = {
  assistantExampleAvailable: ['service'],
  assistantExampleBook: ['service'],
};

export function buildConsumerAssistantExamples(
  copy: ConsumerCopy,
  guideMode: boolean,
  tenant?: AssistantExampleTenantInput | null,
): string[] {
  const keys = guideMode
    ? CONSUMER_ASSISTANT_GUIDE_EXAMPLE_KEYS
    : CONSUMER_ASSISTANT_ACTION_EXAMPLE_KEYS;
  const vars = pickAssistantExampleVars(tenant, {
    provider: copy.assistantFallbackProvider,
    service: copy.assistantFallbackService,
    service2: copy.assistantFallbackService,
    serviceCategory: copy.assistantFallbackServiceCategory,
  });
  return keys.map((key) => {
    const template = copy[key];
    const fields =
      key in CONSUMER_ACTION_PROMPT_VARS
        ? CONSUMER_ACTION_PROMPT_VARS[
            key as keyof typeof CONSUMER_ACTION_PROMPT_VARS
          ]
        : undefined;
    if (!fields?.length) return template;
    const subset: Record<string, string> = {};
    for (const field of fields) subset[field] = vars[field as keyof typeof vars];
    return interpolateAssistantTemplate(template, subset);
  });
}
