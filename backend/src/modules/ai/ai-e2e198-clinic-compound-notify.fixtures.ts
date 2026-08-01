/**
 * e2e-bug.198 — customer_clinic_compound step 2 (notify_when_results_ready)
 * must not clarify-fail when the full prompt is "Book … and notify me…".
 */
export type E2E198ClinicNotifyCase = {
  id: string;
  /** Full compound prompt (would hit BOOK_COMPOUND_BLOCK alone). */
  fullPrompt: string;
  /** Decomposed step-2 segment. */
  notifySegment: string;
  expectAspect?: string;
};

export const E2E198_COMPOUND_NOTIFY_CASES: readonly E2E198ClinicNotifyCase[] = [
  {
    id: 'book-lipid-notify-me',
    fullPrompt: 'Book lipid panel and notify me when results are ready',
    notifySegment: 'notify me when results are ready',
    expectAspect: 'subscribe_explain',
  },
  {
    id: 'schedule-panel-alert-me',
    fullPrompt: 'Schedule lipid panel then alert me when results are ready',
    notifySegment: 'alert me when results are ready',
    expectAspect: 'subscribe_explain',
  },
  {
    id: 'book-and-how-notified',
    fullPrompt:
      'Book blood work and tell me how do I get notified when results are ready',
    notifySegment: 'tell me how do I get notified when results are ready',
    expectAspect: 'how_it_works',
  },
  {
    id: 'reserve-then-push',
    fullPrompt: 'Reserve CBC and notify me with push when results are ready',
    notifySegment: 'notify me with push when results are ready',
    expectAspect: 'push_channel',
  },
  {
    id: 'book-lipid-then-notify',
    fullPrompt: 'Book lipid panel then notify me when results are ready',
    notifySegment: 'notify me when results are ready',
    expectAspect: 'subscribe_explain',
  },
  {
    id: 'reserve-lipid-tell-me',
    fullPrompt: 'Reserve lipid panel and tell me when lab results are ready',
    notifySegment: 'tell me when lab results are ready',
    expectAspect: 'subscribe_explain',
  },
  {
    id: 'book-cbc-alert-available',
    fullPrompt: 'Book blood work CBC and alert me when results are available',
    notifySegment: 'alert me when results are available',
    expectAspect: 'subscribe_explain',
  },
];

export const E2E198_STANDALONE_NOTIFY_CASES = [
  {
    id: 'standalone-notify-me',
    prompt: 'Notify me when results are ready',
  },
  {
    id: 'standalone-text-me',
    prompt: 'Text me when results are ready',
  },
] as const;

export const E2E198_NEGATIVE_CASES = [
  {
    id: 'neg-staff-notify-patient',
    prompt: 'Notify patient their lab results are ready',
    forbidAction: 'notify_when_results_ready',
  },
  {
    id: 'neg-track-ready-now',
    prompt: 'Are my results ready yet?',
    forbidAction: 'notify_when_results_ready',
  },
] as const;
