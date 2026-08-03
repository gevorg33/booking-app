/**
 * e2e-bug.87 — hy-locale customer/public guide copy must not ship as
 * mixed-script garbage (Armenian + Latin transliteration + stray Cyrillic).
 * Live samples from the audit; the QA gate must reject these shapes.
 */
export const E2E87_CORRUPTED_HY_GUIDE_SAMPLES = [
  {
    id: 'e2e87-cyrillic-splice',
    text: '«Ծառայություններ» вкладկայում',
    reason: 'Cyrillic вклад spliced into Armenian',
  },
  {
    id: 'e2e87-latin-translit-title',
    text: 'Գlխavar, Ծառayutyunner ev Հashiv',
    reason: 'Armenian letters mixed with Latin transliteration',
  },
  {
    id: 'e2e87-underscore-latin-fragment',
    text: 'Ընտրեք ծառայություն կամ «Որքան էլի_hasaneli»։',
    reason: 'underscore-joined Latin fragment mid-sentence',
  },
  {
    id: 'e2e87-latin-run-in-step',
    text: 'Բացեք Services вкладկայում և ընտրեք ծառայությունը։',
    reason: 'Latin Services + Cyrillic вклад in a step body',
  },
  // Worse variant from live audit (2-step consumer-booking-flow fallback):
  // full Latin transliteration with zero Armenian in the step body.
  {
    id: 'e2e87-full-latin-translit-step',
    text: 'Yntreq masnaget kam «Vorqan eli hasaneli»:',
    reason: 'entirely Latin transliteration, zero Armenian characters',
  },
  {
    id: 'e2e87-stray-latin-ayc',
    text: 'Ահա ինչպես ամրագրել ayc այս էջում.',
    reason: 'stray Latin ayc mid Armenian sentence (should be այց)',
  },
  {
    id: 'e2e87-midword-latin-splice',
    text: 'Ահա ինչպես ամragreլ ayc այս էջում.',
    reason: 'Latin splice mid Armenian word (ամragreլ)',
  },
  {
    id: 'e2e87-corrupted-source-label',
    text: 'Ամragreլ ayc',
    reason: 'topic/source label mixed-script garbage',
  },
] as const;

/** Live prompts that must return clean hy guide copy (no Yntreq/ayc/_hasaneli). */
export const E2E87_LIVE_HY_GUIDE_PROMPTS = [
  {
    id: 'e2e87-live-booking-help',
    prompt: 'booking help',
    expectAction: 'booking_help',
    minSteps: 0,
  },
  {
    id: 'e2e87-live-how-book-en',
    prompt: 'How do I book an appointment step by step?',
    expectAction: 'booking_help',
    minSteps: 0,
  },
  {
    id: 'e2e87-live-hy-how-book-full',
    prompt: 'Ինչպե՞ս ամրագրել այցելություն քայլ առ քայլ',
    expectAction: 'booking_help',
    minSteps: 0,
  },
  {
    id: 'e2e87-live-2step-any-provider-fallback',
    prompt: 'what happens after I pick a professional?',
    // May clarify, but attached guide must be clean Armenian (the worse-variant repro).
    expectGuideTopic: 'consumer-booking-flow',
    minSteps: 2,
  },
  {
    id: 'e2e87-live-3step-packages',
    prompt: 'How do I buy a package?',
    expectAction: 'guide_user_flow',
    expectGuideTopic: 'consumer-packages-gift-cards',
    minSteps: 3,
  },
  {
    id: 'e2e87-live-3step-home-tabs',
    prompt: 'How do I use the Home tab?',
    expectAction: 'explain_app_feature',
    expectGuideTopic: 'consumer-tabs',
    minSteps: 3,
  },
  {
    id: 'e2e87-live-walkthrough',
    prompt: 'walk me through booking',
    expectAction: 'booking_help',
    minSteps: 0,
  },
] as const;

export const E2E87_CORRUPTION_MARKERS = [
  'Yntreq',
  'Vorqan',
  'hasaneli',
  'ayc',
  'ամragre',
  'Ամragre',
  'вклад',
  '_hasaneli',
] as const;

/** Canonical clean replacements for the worse-variant live samples. */
export const E2E87_CLEAN_WORSE_VARIANT_REPLACEMENTS = [
  {
    id: 'e2e87-clean-booking-intro',
    text: 'Ահա ինչպես ամրագրել այց այս էջում.',
  },
  {
    id: 'e2e87-clean-any-provider-step',
    text: 'Ընտրեք մասնագետ կամ «Ցանկացած ազատ մասնագետ»։',
  },
  {
    id: 'e2e87-clean-booking-source-label',
    text: 'Ամրագրել այց',
  },
] as const;

export const E2E87_CLEAN_HY_GUIDE_SAMPLES = [
  {
    id: 'e2e87-clean-title',
    text: 'Գլխավոր, Ծառայություններ և Հաշիվ',
  },
  {
    id: 'e2e87-clean-step',
    text: 'Բացեք «Ծառայություններ» և ընտրեք անհրաժեշտ ծառայությունը։',
  },
  {
    id: 'e2e87-clean-loanwords-email-sms',
    text: 'Մուտք գործեք email-ով կամ SMS կոդով։',
  },
  {
    id: 'e2e87-clean-loanword-ai',
    text: 'Ամրագրման AI օգնական',
  },
  {
    id: 'e2e46-clean-placeholder',
    text: 'Ձեր հաջորդ հաճախորդը՝ {customerName}, ժամը {time}։',
  },
] as const;
