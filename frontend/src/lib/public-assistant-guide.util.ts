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

/**
 * e2e-bug.109 — when a guide panel is shown, still surface informational
 * `messageText` that is not already rendered as `guide.summary`.
 *
 * Post-failure fallback concatenates `status\n\nguideSnippet` into summary and
 * sets guide.summary to the snippet — return the status prefix.
 * When the status text is entirely distinct from guide.summary (e.g. gift-card
 * / support failures), return the full message text so it is not discarded.
 */
export function extractPublicAssistantGuidePrefixText(
  messageText: string | null | undefined,
  guideSummary: string | null | undefined,
): string {
  const text = (messageText ?? '').trim();
  if (!text) return '';

  const summary = (guideSummary ?? '').trim();
  if (!summary) return text;
  if (text === summary) return '';

  const summaryIndex = text.indexOf(summary);
  if (summaryIndex >= 0) {
    return text.slice(0, summaryIndex).replace(/\n+$/, '').trim();
  }

  return text;
}
