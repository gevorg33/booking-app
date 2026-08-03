/**
 * e2e-bug.260 — recommend_specialists / service extract must not glue trailing
 * time windows into serviceName ("massage this week" → "massage").
 */

export type E2e260ExtractCase = {
  id: string;
  prompt: string;
  expectedServiceName: string;
};

export type E2e260StripCase = {
  id: string;
  polluted: string;
  expected: string | null;
};

export type E2e260OverrideCase = {
  id: string;
  prompt: string;
  params: Record<string, unknown>;
  expectedServiceName: string | null;
  expectedServiceCategory?: string | null;
};

/** Prompt → extractServiceNameFromPrompt */
export const E2E260_EXTRACT_CASES: readonly E2e260ExtractCase[] = [
  {
    id: 'e2e260-extract-massage-this-week',
    prompt: 'best rated specialists for massage this week',
    expectedServiceName: 'massage',
  },
  {
    id: 'e2e260-extract-haircut-tomorrow',
    prompt: 'Who do you recommend for a haircut tomorrow?',
    expectedServiceName: 'haircut',
  },
  {
    id: 'e2e260-extract-facial-next-friday',
    prompt: 'recommend specialists for facial next Friday',
    expectedServiceName: 'facial',
  },
  {
    id: 'e2e260-extract-swedish-this-weekend',
    prompt: 'best specialists for swedish massage this weekend',
    expectedServiceName: 'swedish massage',
  },
  {
    id: 'e2e260-extract-color-tonight',
    prompt: 'Who is best for color tonight?',
    expectedServiceName: 'color',
  },
  {
    id: 'e2e260-extract-massage-evening',
    prompt: 'recommend someone for massage this evening',
    expectedServiceName: 'massage',
  },
  {
    id: 'e2e260-extract-bare-massage',
    prompt: 'Who do you recommend for a massage?',
    expectedServiceName: 'massage',
  },
  {
    id: 'e2e260-extract-trim-next-week',
    prompt: 'top rated for trim next week',
    expectedServiceName: 'trim',
  },
  {
    id: 'e2e260-extract-quoted-polluted',
    prompt: 'recommend specialists for "massage this week"',
    expectedServiceName: 'massage',
  },
  {
    id: 'e2e260-extract-massage-today',
    prompt: 'best rated for massage today',
    expectedServiceName: 'massage',
  },
  // e2e-bug.319 — "later today" (and bare "later") were missing from the
  // day-part boundary/strip lists, so "massage later" got glued together.
  {
    id: 'e2e319-extract-massage-later-today',
    prompt: 'recommend someone for massage later today',
    expectedServiceName: 'massage',
  },
  {
    id: 'e2e319-extract-haircut-later',
    prompt: 'Who do you recommend for a haircut later?',
    expectedServiceName: 'haircut',
  },
];

/** stripTrailingTimeWindowFromServiceName */
export const E2E260_STRIP_CASES: readonly E2e260StripCase[] = [
  {
    id: 'e2e260-strip-massage-this-week',
    polluted: 'massage this week',
    expected: 'massage',
  },
  {
    id: 'e2e260-strip-swedish-tomorrow',
    polluted: 'swedish massage tomorrow',
    expected: 'swedish massage',
  },
  {
    id: 'e2e260-strip-facial-next-friday',
    polluted: 'facial next Friday',
    expected: 'facial',
  },
  {
    id: 'e2e260-strip-haircut-evening',
    polluted: 'haircut this evening',
    expected: 'haircut',
  },
  {
    id: 'e2e260-strip-clean-massage',
    polluted: 'massage',
    expected: 'massage',
  },
  {
    id: 'e2e260-strip-only-this-week',
    polluted: 'this week',
    expected: null,
  },
  {
    id: 'e2e319-strip-massage-later-today',
    polluted: 'massage later today',
    expected: 'massage',
  },
  {
    id: 'e2e319-strip-haircut-later',
    polluted: 'haircut later',
    expected: 'haircut',
  },
  {
    id: 'e2e319-strip-only-later-today',
    polluted: 'later today',
    expected: null,
  },
];

/** applyPromptMentionedServiceOverrideToParams */
export const E2E260_OVERRIDE_CASES: readonly E2e260OverrideCase[] = [
  {
    id: 'e2e260-override-recommend-this-week',
    prompt: 'best rated specialists for massage this week',
    params: {},
    expectedServiceName: null,
    expectedServiceCategory: 'massage',
  },
  {
    id: 'e2e260-override-llm-polluted-params',
    prompt: 'best rated specialists for massage this week',
    params: { serviceName: 'massage this week' },
    expectedServiceName: null,
    expectedServiceCategory: 'massage',
  },
  {
    id: 'e2e260-override-scrub-stale-polluted',
    prompt: 'who works here?',
    params: { serviceName: 'massage this week' },
    expectedServiceName: 'massage',
  },
  {
    id: 'e2e260-override-swedish-multi-token',
    prompt: 'recommend specialists for swedish massage this week',
    params: {},
    expectedServiceName: 'swedish massage',
    expectedServiceCategory: null,
  },
  {
    id: 'e2e319-override-massage-later-today',
    prompt: 'recommend someone for massage later today',
    params: {},
    expectedServiceName: null,
    expectedServiceCategory: 'massage',
  },
];

export type E2e260EnrichCase = {
  id: string;
  prompt: string;
  expectedServiceCategory: string;
  forbidCategory?: string;
};

/** enrichPublicAssistantParamsFromPrompt must not steal rated/specialists */
export const E2E260_ENRICH_CASES: readonly E2e260EnrichCase[] = [
  {
    id: 'e2e260-enrich-best-rated-massage-today',
    prompt: 'best rated for massage today',
    expectedServiceCategory: 'massage',
    forbidCategory: 'rated',
  },
  {
    id: 'e2e260-enrich-best-specialists-facial-weekend',
    prompt: 'best specialists for facial this weekend',
    expectedServiceCategory: 'facial',
    forbidCategory: 'specialists',
  },
  {
    id: 'e2e260-enrich-best-rated-specialists-massage-week',
    prompt: 'best rated specialists for massage this week',
    expectedServiceCategory: 'massage',
  },
  {
    id: 'e2e319-enrich-massage-later-today',
    prompt: 'recommend someone for massage later today',
    expectedServiceCategory: 'massage',
    forbidCategory: 'massage later',
  },
];
