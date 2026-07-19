import type { ExplainRtlLayoutAspect } from './ai-explain-rtl-layout.fixtures.js';
import type { DocumentDirection } from './ai-explain-rtl-layout.util.js';

/**
 * e2e-bug.86 — explain_rtl_layout customer-facing copy leaked
 * `adoption-a11y.css` (and related internal selectors) into summary/nextSteps.
 */
export const E2E86_RTL_GUIDANCE_CASES = [
  {
    id: 'e2e86-locale-direction-hy',
    aspect: 'locale_direction' as ExplainRtlLayoutAspect,
    documentDirection: 'ltr' as DocumentDirection,
    locale: 'hy',
  },
  {
    id: 'e2e86-generic-en',
    aspect: 'generic' as ExplainRtlLayoutAspect,
    documentDirection: 'ltr' as DocumentDirection,
    locale: 'en',
  },
  {
    id: 'e2e86-assistant-messages-rtl',
    aspect: 'assistant_messages' as ExplainRtlLayoutAspect,
    documentDirection: 'rtl' as DocumentDirection,
    locale: 'ar',
  },
  {
    id: 'e2e86-logical-css',
    aspect: 'logical_css' as ExplainRtlLayoutAspect,
    documentDirection: 'ltr' as DocumentDirection,
    locale: 'en',
  },
  {
    id: 'e2e86-why-right-aligned-ltr',
    aspect: 'why_right_aligned' as ExplainRtlLayoutAspect,
    documentDirection: 'ltr' as DocumentDirection,
    locale: 'en',
  },
  {
    id: 'e2e86-why-right-aligned-rtl',
    aspect: 'why_right_aligned' as ExplainRtlLayoutAspect,
    documentDirection: 'rtl' as DocumentDirection,
    locale: 'ar',
  },
] as const;

export const E2E86_LEAKY_SAMPLE_STRINGS = [
  {
    id: 'e2e86-leaky-stylesheet',
    text: 'adoption-a11y.css uses logical spacing so layouts stay readable in both directions.',
  },
  {
    id: 'e2e86-leaky-selector',
    text: 'Check document direction — adoption-a11y.css swaps .consumer-ai-msg alignment under [dir="rtl"].',
  },
] as const;

export const E2E86_HANDLER_PROMPTS = [
  {
    id: 'e2e86-what-is-rtl',
    prompt: 'What is RTL?',
    params: { locale: 'hy' },
  },
  {
    id: 'e2e86-padding-inline',
    prompt: 'Explain padding-inline RTL-safe layout',
    params: { locale: 'en' },
  },
  {
    id: 'e2e86-chat-bubbles',
    prompt: 'Why are chat bubbles flipped?',
    params: { locale: 'en', documentDirection: 'rtl' },
  },
] as const;
