/**
 * e2e-bug.269 — "is anybody open … and schedule the next available appointment"
 * must match isCheckProvidersForServicePrompt and decompose to check+book.
 */

export type E2e269AnybodyOpenCase = {
  id: string;
  prompt: string;
  expectCheckProviders: boolean;
  expectBookNearest: boolean;
  expectCompound: boolean;
  serviceName?: string;
  timeOfDay?: string | null;
};

/** Positives — check_providers + book_nearest compound. */
export const E2E269_ANYBODY_OPEN_POSITIVES: readonly E2e269AnybodyOpenCase[] = [
  {
    id: 'e2e269-anybody-open-schedule-canonical',
    prompt:
      'is anybody open tomorrow morning for massage and schedule the next available appointment',
    expectCheckProviders: true,
    expectBookNearest: true,
    expectCompound: true,
    serviceName: 'massage',
    timeOfDay: 'morning',
  },
  {
    id: 'e2e269-anybody-open-semicolon',
    prompt:
      'is anybody open tomorrow morning for massage; schedule the next available appointment',
    expectCheckProviders: true,
    expectBookNearest: true,
    expectCompound: true,
    serviceName: 'massage',
    timeOfDay: 'morning',
  },
  {
    id: 'e2e269-anyone-open-schedule',
    prompt:
      'is anyone open tomorrow evening for permanent lashes and schedule the next available appointment',
    expectCheckProviders: true,
    expectBookNearest: true,
    expectCompound: true,
    serviceName: 'permanent lashes',
    timeOfDay: 'evening',
  },
  {
    id: 'e2e269-anybody-free-book-next',
    prompt:
      'is anybody free tomorrow for massage and book the next available appointment',
    expectCheckProviders: true,
    expectBookNearest: true,
    expectCompound: true,
    serviceName: 'massage',
  },
  {
    id: 'e2e269-who-open-schedule-next',
    prompt:
      'who is open tomorrow morning for facial and schedule the next available slot',
    expectCheckProviders: true,
    expectBookNearest: true,
    expectCompound: true,
    serviceName: 'facial',
    timeOfDay: 'morning',
  },
  {
    id: 'e2e269-anybody-open-check-only',
    prompt: 'is anybody open tomorrow morning for massage',
    expectCheckProviders: true,
    expectBookNearest: false,
    expectCompound: false,
    serviceName: 'massage',
    timeOfDay: 'morning',
  },
];

/** Negatives — named provider / roster / soonest-only must not steal into check_providers. */
export const E2E269_ANYBODY_OPEN_NEGATIVES: readonly E2e269AnybodyOpenCase[] = [
  {
    id: 'e2e269-neg-named-gevorg',
    prompt: 'is Gevorg open tomorrow morning for massage',
    expectCheckProviders: false,
    expectBookNearest: false,
    expectCompound: false,
  },
  {
    id: 'e2e269-neg-book-only-nearest',
    prompt: 'book the nearest slot for massage tomorrow morning',
    expectCheckProviders: false,
    expectBookNearest: true,
    expectCompound: false,
  },
  {
    id: 'e2e269-neg-who-are-providers',
    prompt: 'who are your providers?',
    expectCheckProviders: false,
    expectBookNearest: false,
    expectCompound: false,
  },
];
