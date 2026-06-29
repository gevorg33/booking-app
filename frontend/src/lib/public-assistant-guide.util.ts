import type { AiGuideResponse } from '@/lib/ai-client.types';

export const PUBLIC_ASSISTANT_ACTION_EXAMPLE_KEYS = [
  'public.exampleAvailable',
  'public.exampleServices',
  'public.exampleBook',
  'public.exampleLocation',
] as const;

export const PUBLIC_ASSISTANT_GUIDE_EXAMPLE_KEYS = [
  'public.exampleGuideBook',
  'public.exampleGuideCheckout',
  'public.exampleGuideServices',
  'public.exampleGuideLocation',
] as const;

export function resolvePublicAssistantExampleKeys(
  guideMode: boolean,
): readonly string[] {
  return guideMode
    ? PUBLIC_ASSISTANT_GUIDE_EXAMPLE_KEYS
    : PUBLIC_ASSISTANT_ACTION_EXAMPLE_KEYS;
}

export function hasPublicAssistantGuideSteps(
  guide: AiGuideResponse | null | undefined,
): guide is AiGuideResponse {
  return Boolean(guide?.steps?.length);
}
