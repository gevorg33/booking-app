import type { FewShotExample, SemanticPhraseEntry } from './ai-classification-engine.types.js';
import { loadStoredCanonicalPhrasingBank } from './ai-semantic-phrasing-bank.util.js';
import { CHECK_AND_BOOK_CLASSIFIER_RULES } from './ai-check-and-book.fixtures.js';

/** Keyword hints for dynamic intent shortlist scoring (acc-3.3). */
export const INTENT_SHORTLIST_KEYWORDS: Record<string, readonly string[]> = {
  create_booking: ['book', 'schedule', 'appointment', 'reserve', 'slot'],
  cancel_bookings: ['cancel', 'drop', 'remove appointment'],
  reschedule_booking: ['reschedule', 'move', 'shift', 'change time'],
  check_availability: ['available', 'free', 'open slot', 'schedule'],
  check_providers_for_service: ['who is free', 'who has availability', 'providers', 'available', 'free'],
  book_nearest_slot: ['nearest', 'soonest', 'first available', 'asap'],
  book_appointment: ['book', 'appointment', 'reserve'],
  list_bookings: ['list bookings', 'show appointments', 'appointments today'],
  show_appointments: ['show appointments', 'calendar', 'schedule today'],
  summarize_bookings: ['how many', 'revenue', 'earnings', 'busiest'],
  summarize_customers: ['top customers', 'vip', 'no-show', 'at risk'],
  clear_schedule: ['clear schedule', 'wipe schedule', 'reset schedule'],
  lookup_service_assignment: ['who can do', 'who is doing', 'who performs'],
  security_blocked: [],
  unknown: [],
};

export const CLASSIFICATION_FEWSHOT_EXAMPLES: FewShotExample[] = [
  {
    id: 'fs-dashboard-book-fixed',
    prompt: 'Book massage with Gevorg tomorrow at 10:00',
    action: 'create_booking',
    surface: 'dashboard',
  },
  {
    id: 'fs-dashboard-check-providers',
    prompt: 'Who is free tomorrow evening for permanent lashes',
    action: 'check_providers_for_service',
    surface: 'dashboard',
  },
  {
    id: 'fs-dashboard-cancel-range',
    prompt: 'Cancel Maria appointments next Friday between 16:30 and 17:30',
    action: 'cancel_bookings',
    surface: 'dashboard',
  },
  {
    id: 'fs-customer-nearest',
    prompt: 'Book the nearest slot for massage tomorrow evening',
    action: 'book_nearest_slot',
    surface: 'customer',
  },
  {
    id: 'fs-public-check-book',
    prompt: "Who's free tomorrow evening for lashes, book the nearest slot",
    action: 'book_appointment',
    surface: 'public',
  },
  {
    id: 'fs-dashboard-revenue',
    prompt: 'How much did we earn today',
    action: 'summarize_bookings',
    surface: 'dashboard',
  },
  {
    id: 'fs-dashboard-clear',
    prompt: 'Clear Gevorg schedule for Friday',
    action: 'clear_schedule',
    surface: 'dashboard',
  },
  {
    id: 'fs-hy-check-book',
    prompt: 'Ով է ազատ վաղը երեկոյան massage-ի համար',
    action: 'check_providers_for_service',
    surface: 'dashboard',
    locale: 'hy',
  },
  {
    id: 'fs-public-check-availability',
    prompt: "Who's free tomorrow evening for permanent lashes",
    action: 'check_availability',
    surface: 'public',
  },
  {
    id: 'fs-provider-mark-paid',
    prompt: 'Record payment for this visit',
    action: 'mark_paid',
    surface: 'provider',
  },
  {
    id: 'fs-provider-list-schedule',
    prompt: 'Show me everything on my schedule tomorrow',
    action: 'show_appointments',
    surface: 'provider',
  },
];

export const SEMANTIC_CANONICAL_PHRASES: SemanticPhraseEntry[] = loadStoredCanonicalPhrasingBank();

export const CLASSIFICATION_AB_VARIANTS = {
  control: { id: 'control', label: 'baseline classifier appendix' },
  fewshot_heavy: {
    id: 'fewshot_heavy',
    label: 'extra few-shot examples in appendix',
  },
} as const;

export function getCheckAndBookClassifierSnippet(): string {
  return CHECK_AND_BOOK_CLASSIFIER_RULES.slice(0, 240);
}
