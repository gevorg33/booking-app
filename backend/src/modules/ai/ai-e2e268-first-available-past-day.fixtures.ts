/**
 * e2e-bug.268 — first-available create_booking / reschedule_booking must never
 * start on (or return) a past calendar day in the business timezone.
 */

export type E2e268ClampCase = {
  id: string;
  requestedDate: string | null | undefined;
  timeZone: string;
  /** Frozen "today" in that timezone for assertions (YYYY-MM-DD). */
  referenceToday: string;
  expectedStart: string;
};

/**
 * Clamp cases use real getTodayDateKey — unit tests stub via injecting expected
 * relative to wall-clock today when referenceToday matches live today, or test
 * the pure inequality rules with synthetic past/future ISO strings.
 */
export const E2E268_CLAMP_RULES: readonly {
  id: string;
  requestedDate: string | null | undefined;
  /** Relative to today: 'past' | 'today' | 'future' | 'empty' | 'non-iso' */
  kind: 'past' | 'today' | 'future' | 'empty' | 'non-iso';
  expect: 'today' | 'requested' | 'today-from-empty';
}[] = [
  {
    id: 'e2e268-clamp-past-iso',
    requestedDate: '2026-01-08',
    kind: 'past',
    expect: 'today',
  },
  {
    id: 'e2e268-clamp-past-march',
    requestedDate: '2026-03-08',
    kind: 'past',
    expect: 'today',
  },
  {
    id: 'e2e268-clamp-empty',
    requestedDate: null,
    kind: 'empty',
    expect: 'today-from-empty',
  },
  {
    id: 'e2e268-clamp-blank',
    requestedDate: '   ',
    kind: 'empty',
    expect: 'today-from-empty',
  },
  {
    id: 'e2e268-clamp-non-iso-garbage',
    requestedDate: 'not-a-date',
    kind: 'non-iso',
    expect: 'today',
  },
  {
    id: 'e2e268-keep-future',
    requestedDate: '2099-12-15',
    kind: 'future',
    expect: 'requested',
  },
];

export const E2E268_DROP_PAST_KEYS: readonly {
  id: string;
  dateKeys: string[];
  /** Keys that must survive (ISO ≥ today). Past keys must be removed. */
  mustDrop: string[];
}[] = [
  {
    id: 'e2e268-drop-jan-keep-future',
    dateKeys: ['2026-01-08', '2099-08-01', '2026-03-08'],
    mustDrop: ['2026-01-08', '2026-03-08'],
  },
  {
    id: 'e2e268-drop-non-iso',
    dateKeys: ['January 8, 2026', '2099-08-02'],
    mustDrop: ['January 8, 2026'],
  },
];

/** Live dashboard prompts that previously landed on past days. */
export const E2E268_LIVE_PROMPTS: readonly {
  id: string;
  prompt: string;
  expectedAction: 'reschedule_booking' | 'create_booking';
}[] = [
  {
    id: 'live-reschedule-soonest-tomorrow',
    prompt: 'Reschedule Gevorg appointment to the soonest free slot tomorrow',
    expectedAction: 'reschedule_booking',
  },
  {
    id: 'live-reschedule-nearest-monday',
    prompt: "Move Gevorg's appointment to the first available slot Monday",
    expectedAction: 'reschedule_booking',
  },
  {
    id: 'live-book-nearest-swedish-tomorrow',
    prompt: 'Book the nearest available slot for Swedish massage tomorrow',
    expectedAction: 'create_booking',
  },
  {
    id: 'live-book-soonest-any-provider',
    prompt:
      'Book the soonest free slot for Face Pilling with any provider',
    expectedAction: 'create_booking',
  },
];
