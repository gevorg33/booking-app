export interface ConsumerAiGuideStep {
  title: string;
  body: string;
  navigate?: { path: string; query?: Record<string, string> };
}

export interface ConsumerAiGuideResponse {
  summary: string;
  steps: ConsumerAiGuideStep[];
  navigate?: { path: string; query?: Record<string, string> };
  topicId?: string;
}

export function hasConsumerAssistantGuideSteps(
  guide: ConsumerAiGuideResponse | null | undefined,
): guide is ConsumerAiGuideResponse {
  return Boolean(guide?.steps?.length);
}

export const CONSUMER_ASSISTANT_GUIDE_EXAMPLE_KEYS = [
  'assistantExampleGuideBook',
  'assistantExampleGuideCheckout',
  'assistantExampleGuideServices',
  'assistantExampleGuideLocation',
] as const;

export const CONSUMER_ASSISTANT_ACTION_EXAMPLE_KEYS = [
  'assistantExampleAvailable',
  'assistantExampleServices',
  'assistantExampleBook',
  'assistantExampleLocation',
] as const;

export function resolveConsumerAssistantExampleKeys(
  guideMode: boolean,
): readonly string[] {
  return guideMode
    ? CONSUMER_ASSISTANT_GUIDE_EXAMPLE_KEYS
    : CONSUMER_ASSISTANT_ACTION_EXAMPLE_KEYS;
}
