import type { CommandSurface } from './ai-command-registry.types.js';
import { IMPLICATION_CORPUS_MULTILINGUAL_SCENARIOS } from './ai-implication-corpus-multilingual.fixtures.js';
import { IMPLICATION_CORPUS_PROVIDER_SCENARIOS } from './ai-implication-corpus-provider.fixtures.js';
import { buildImplicationSurfaceParityScenarios } from './ai-implication-corpus-surface-parity.util.js';

/** pipe-1.11.1 — expanded implication corpus for booking, schedule, availability. */
export const IMPLICATION_CORPUS_PIPE_MARKER = 'pipe-1.11.1';

export type ImplicationTopIntent = 'booking' | 'schedule' | 'availability';

export type ImplicationCorpusScenario = {
  id: string;
  topIntent: ImplicationTopIntent;
  prompt: string;
  surface: CommandSurface;
  expectedAction: string;
  /** Winning anchor id when deterministic matcher should lock to a canonical phrase. */
  expectedTopAnchorId?: string;
  expectedParamHints?: Record<string, unknown>;
  /** Actions that must not win resolveSemanticMatch for this prompt. */
  mustNotMatch?: readonly string[];
  minScore?: number;
  locale?: 'en' | 'hy' | 'ru';
};

const BOOKING: ImplicationCorpusScenario[] = [
  {
    id: 'en-hair-long-implied-booking',
    topIntent: 'booking',
    prompt: 'My hair is getting pretty long, need a trim soon',
    surface: 'dashboard',
    expectedAction: 'create_booking',
    expectedTopAnchorId: 'en-implied-haircut-need',
    minScore: 0.65,
    locale: 'en',
  },
  {
    id: 'hy-trim-implied-booking',
    topIntent: 'booking',
    prompt: 'մազերս երկար են դարձել շուտով կտրվածքի կարիք ունեմ',
    surface: 'dashboard',
    expectedAction: 'create_booking',
    expectedTopAnchorId: 'hy-implied-trim-need',
    minScore: 0.65,
    locale: 'hy',
  },
  {
    id: 'ru-trim-implied-booking',
    topIntent: 'booking',
    prompt: 'волосы стали длинными нужна стрижка скоро',
    surface: 'dashboard',
    expectedAction: 'create_booking',
    expectedTopAnchorId: 'ru-implied-trim-need',
    minScore: 0.65,
    locale: 'ru',
  },
  {
    id: 'en-nails-chipped-implied-booking',
    topIntent: 'booking',
    prompt: 'My nails are chipped and overdue for a manicure soon',
    surface: 'dashboard',
    expectedAction: 'create_booking',
    expectedTopAnchorId: 'en-implied-wellness-need',
    minScore: 0.65,
    locale: 'en',
  },
  {
    id: 'en-roots-color-implied-booking',
    topIntent: 'booking',
    prompt: 'Roots are showing again, really need a color touch-up soon',
    surface: 'dashboard',
    expectedAction: 'create_booking',
    expectedTopAnchorId: 'en-implied-wellness-need',
    minScore: 0.65,
    locale: 'en',
  },
  {
    id: 'en-facial-overdue-implied-booking',
    topIntent: 'booking',
    prompt: 'It has been months since my last facial, due for one soon',
    surface: 'dashboard',
    expectedAction: 'create_booking',
    expectedTopAnchorId: 'en-implied-wellness-need',
    minScore: 0.65,
    locale: 'en',
  },
  {
    id: 'en-massage-need-implied-booking',
    topIntent: 'booking',
    prompt: 'Back is tense, could use a massage session soon',
    surface: 'dashboard',
    expectedAction: 'create_booking',
    expectedTopAnchorId: 'en-implied-wellness-need',
    minScore: 0.65,
    locale: 'en',
  },
  {
    id: 'en-beard-unkempt-implied-booking',
    topIntent: 'booking',
    prompt: 'Beard is getting unkempt, need a trim before the weekend',
    surface: 'dashboard',
    expectedAction: 'create_booking',
    expectedTopAnchorId: 'en-implied-wellness-need',
    minScore: 0.65,
    locale: 'en',
  },
  {
    id: 'en-brows-unruly-implied-booking',
    topIntent: 'booking',
    prompt: 'Eyebrows are getting unruly, want shaping soon',
    surface: 'dashboard',
    expectedAction: 'create_booking',
    expectedTopAnchorId: 'en-implied-wellness-need',
    minScore: 0.65,
    locale: 'en',
  },
  {
    id: 'en-physio-overdue-implied-booking',
    topIntent: 'booking',
    prompt: 'Knee is stiff, overdue for a physio session soon',
    surface: 'dashboard',
    expectedAction: 'create_booking',
    expectedTopAnchorId: 'en-implied-wellness-need',
    minScore: 0.65,
    locale: 'en',
  },
  {
    id: 'en-makeup-event-implied-booking',
    topIntent: 'booking',
    prompt: 'Overdue for a makeup session, need an appointment soon',
    surface: 'dashboard',
    expectedAction: 'create_booking',
    expectedTopAnchorId: 'en-implied-wellness-need',
    minScore: 0.65,
    locale: 'en',
  },
  {
    id: 'en-dental-due-implied-booking',
    topIntent: 'booking',
    prompt: 'Overdue for a dental cleaning, need a visit soon',
    surface: 'dashboard',
    expectedAction: 'create_booking',
    expectedTopAnchorId: 'en-implied-wellness-need',
    minScore: 0.65,
    locale: 'en',
  },
  {
    id: 'en-hair-long-not-schedule',
    topIntent: 'booking',
    prompt: 'My hair is getting pretty long, need a trim soon',
    surface: 'dashboard',
    expectedAction: 'create_booking',
    mustNotMatch: ['create_direct_schedule'],
    locale: 'en',
  },
];

const SCHEDULE: ImplicationCorpusScenario[] = [
  {
    id: 'en-work-time-implied-schedule',
    topIntent: 'schedule',
    prompt: 'They need regular work time on the calendar next week',
    surface: 'dashboard',
    expectedAction: 'create_direct_schedule',
    expectedTopAnchorId: 'en-implied-work-time',
    minScore: 0.65,
    locale: 'en',
  },
  {
    id: 'hy-work-hours-implied-schedule',
    topIntent: 'schedule',
    prompt: 'սահմանել աշխատանքային ժամերը հաջորդ շաբաթվա համար',
    surface: 'dashboard',
    expectedAction: 'create_direct_schedule',
    expectedTopAnchorId: 'hy-set-work-hours',
    minScore: 0.65,
    locale: 'hy',
  },
  {
    id: 'ru-work-hours-implied-schedule',
    topIntent: 'schedule',
    prompt: 'установить рабочие часы на следующую неделю',
    surface: 'dashboard',
    expectedAction: 'create_direct_schedule',
    expectedTopAnchorId: 'ru-set-work-hours',
    minScore: 0.65,
    locale: 'ru',
  },
  {
    id: 'en-new-hire-shifts-implied-schedule',
    topIntent: 'schedule',
    prompt: 'New hire needs standard shifts on the roster next month',
    surface: 'dashboard',
    expectedAction: 'create_direct_schedule',
    expectedTopAnchorId: 'en-implied-shift-roster',
    minScore: 0.65,
    locale: 'en',
  },
  {
    id: 'en-weekday-blocks-implied-schedule',
    topIntent: 'schedule',
    prompt: 'Staff member needs morning shift blocks on weekdays on the grid',
    surface: 'dashboard',
    expectedAction: 'create_direct_schedule',
    expectedTopAnchorId: 'en-set-work-hours',
    minScore: 0.65,
    locale: 'en',
  },
  {
    id: 'en-recurring-shifts-implied-schedule',
    topIntent: 'schedule',
    prompt: 'Block recurring work shifts for the stylist through Friday',
    surface: 'dashboard',
    expectedAction: 'create_direct_schedule',
    expectedTopAnchorId: 'en-implied-shift-roster',
    minScore: 0.65,
    locale: 'en',
  },
  {
    id: 'en-normal-hours-grid-implied-schedule',
    topIntent: 'schedule',
    prompt: 'Add normal operating hours to the schedule for next week',
    surface: 'dashboard',
    expectedAction: 'create_direct_schedule',
    expectedTopAnchorId: 'en-set-work-hours',
    minScore: 0.65,
    locale: 'en',
  },
  {
    id: 'en-shift-pattern-week-implied-schedule',
    topIntent: 'schedule',
    prompt: 'Set up a shift pattern on the planner for the coming week',
    surface: 'dashboard',
    expectedAction: 'create_direct_schedule',
    expectedTopAnchorId: 'en-set-work-hours',
    minScore: 0.65,
    locale: 'en',
  },
  {
    id: 'en-coverage-blocks-planner-implied-schedule',
    topIntent: 'schedule',
    prompt: 'Need coverage blocks on the roster for weekday afternoons',
    surface: 'dashboard',
    expectedAction: 'create_direct_schedule',
    expectedTopAnchorId: 'en-set-work-hours',
    minScore: 0.65,
    locale: 'en',
  },
  {
    id: 'en-morning-blocks-implied-schedule',
    topIntent: 'schedule',
    prompt: 'Staff member needs their usual hours opened on the calendar',
    surface: 'dashboard',
    expectedAction: 'create_direct_schedule',
    expectedTopAnchorId: 'en-implied-work-time',
    minScore: 0.65,
    locale: 'en',
  },
  {
    id: 'en-work-time-not-booking',
    topIntent: 'schedule',
    prompt: 'They need regular work time on the calendar next week',
    surface: 'dashboard',
    expectedAction: 'create_direct_schedule',
    mustNotMatch: ['create_booking'],
    locale: 'en',
  },
];

const AVAILABILITY: ImplicationCorpusScenario[] = [
  {
    id: 'en-wondering-fit-in-implied-availability',
    topIntent: 'availability',
    prompt: 'Wondering if anyone has an opening tomorrow for lashes',
    surface: 'dashboard',
    expectedAction: 'check_providers_for_service',
    expectedTopAnchorId: 'en-implied-availability-opening',
    minScore: 0.65,
    locale: 'en',
  },
  {
    id: 'en-hoping-opening-massage-implied-availability',
    topIntent: 'availability',
    prompt: 'Hoping someone has an opening for massage this week',
    surface: 'dashboard',
    expectedAction: 'check_providers_for_service',
    expectedTopAnchorId: 'en-implied-availability-opening',
    minScore: 0.65,
    locale: 'en',
  },
  {
    id: 'en-curious-room-highlights-implied-availability',
    topIntent: 'availability',
    prompt: 'Curious which specialists have room for highlights tomorrow evening',
    surface: 'dashboard',
    expectedAction: 'check_providers_for_service',
    expectedTopAnchorId: 'en-implied-availability-opening',
    minScore: 0.65,
    locale: 'en',
  },
  {
    id: 'en-trying-find-opening-implied-availability',
    topIntent: 'availability',
    prompt: 'Trying to figure out if there is an opening for a trim tonight',
    surface: 'dashboard',
    expectedAction: 'check_providers_for_service',
    expectedTopAnchorId: 'en-implied-availability-opening',
    minScore: 0.65,
    locale: 'en',
  },
  {
    id: 'en-before-commit-openings-implied-availability',
    topIntent: 'availability',
    prompt: 'Before I commit, see who has openings for a service Thursday evening',
    surface: 'dashboard',
    expectedAction: 'check_providers_for_service',
    expectedTopAnchorId: 'en-implied-availability-opening',
    minScore: 0.65,
    locale: 'en',
  },
  {
    id: 'en-squeeze-in-facial-implied-availability',
    topIntent: 'availability',
    prompt: 'Hoping the team has an opening Saturday morning for a facial',
    surface: 'dashboard',
    expectedAction: 'check_providers_for_service',
    expectedTopAnchorId: 'en-implied-availability-opening',
    minScore: 0.65,
    locale: 'en',
  },
  {
    id: 'en-anyone-floor-blowouts-implied-availability',
    topIntent: 'availability',
    prompt: 'Wondering if there is anyone on the floor who can do blowouts tomorrow',
    surface: 'dashboard',
    expectedAction: 'check_providers_for_service',
    minScore: 0.65,
    locale: 'en',
  },
  {
    id: 'en-team-time-brows-implied-availability',
    topIntent: 'availability',
    prompt: 'Curious which team members have room for brow shaping on Friday',
    surface: 'dashboard',
    expectedAction: 'check_providers_for_service',
    expectedTopAnchorId: 'en-implied-availability-opening',
    minScore: 0.65,
    locale: 'en',
  },
  {
    id: 'en-specialists-room-spa-implied-availability',
    topIntent: 'availability',
    prompt: 'Looking for whoever can take new clients for a spa package next week',
    surface: 'dashboard',
    expectedAction: 'check_providers_for_service',
    expectedTopAnchorId: 'en-implied-availability-opening',
    minScore: 0.65,
    locale: 'en',
  },
  {
    id: 'en-not-sure-color-tomorrow-implied-availability',
    topIntent: 'availability',
    prompt: 'Not sure who is doing color tomorrow afternoon',
    surface: 'dashboard',
    expectedAction: 'check_providers_for_service',
    expectedTopAnchorId: 'en-check-who-free',
    minScore: 0.65,
    locale: 'en',
  },
  {
    id: 'en-chance-slot-tonight-implied-availability',
    topIntent: 'availability',
    prompt: 'Hoping somebody on staff can handle highlights tomorrow night',
    surface: 'dashboard',
    expectedAction: 'check_providers_for_service',
    expectedTopAnchorId: 'en-implied-availability-opening',
    minScore: 0.65,
    locale: 'en',
  },
];

export const BOOKING_IMPLICATION_SCENARIOS = BOOKING;
export const SCHEDULE_IMPLICATION_SCENARIOS = SCHEDULE;
export const AVAILABILITY_IMPLICATION_SCENARIOS = AVAILABILITY;

export const AI_IMPLICATION_CORPUS_EN_DASHBOARD_SCENARIOS: ImplicationCorpusScenario[] = [
  ...BOOKING,
  ...SCHEDULE,
  ...AVAILABILITY,
];

export const AI_IMPLICATION_CORPUS_SURFACE_SCENARIOS: ImplicationCorpusScenario[] =
  buildImplicationSurfaceParityScenarios(AI_IMPLICATION_CORPUS_EN_DASHBOARD_SCENARIOS);

const AI_IMPLICATION_CORPUS_EN_SCENARIOS: ImplicationCorpusScenario[] = [
  ...AI_IMPLICATION_CORPUS_EN_DASHBOARD_SCENARIOS,
  ...AI_IMPLICATION_CORPUS_SURFACE_SCENARIOS,
];

export const AI_IMPLICATION_CORPUS_SCENARIOS: ImplicationCorpusScenario[] = [
  ...AI_IMPLICATION_CORPUS_EN_SCENARIOS,
  ...IMPLICATION_CORPUS_MULTILINGUAL_SCENARIOS,
  ...IMPLICATION_CORPUS_PROVIDER_SCENARIOS,
];

export const IMPLICATION_CORPUS_BY_INTENT: Record<
  ImplicationTopIntent,
  ImplicationCorpusScenario[]
> = {
  booking: BOOKING_IMPLICATION_SCENARIOS,
  schedule: SCHEDULE_IMPLICATION_SCENARIOS,
  availability: AVAILABILITY_IMPLICATION_SCENARIOS,
};
