import type { IntentCandidate } from './command-understanding.types.js';
import type { CommandSurface } from './ai-command-registry.types.js';

export type NarrowShortlistScenario = {
  id: string;
  surface: CommandSurface;
  ranked: IntentCandidate[];
  mustInclude: readonly string[];
  mustExclude?: readonly string[];
  maxLength?: number;
};

const candidate = (
  action: string,
  confidence: number,
  source: IntentCandidate['source'] = 'classifier',
): IntentCandidate => ({
  action,
  confidence,
  source,
  reasoning: 'fixture',
});

/** pipe-1.4.7 / acc-3.3 — narrow shortlist build scenarios. */
export const NARROW_SHORTLIST_SCENARIOS: NarrowShortlistScenario[] = [
  {
    id: 'booking-vs-availability-expands-neighbors',
    surface: 'dashboard',
    ranked: [
      candidate('create_booking', 0.7),
      candidate('check_providers_for_service', 0.68, 'semantic_match'),
    ],
    mustInclude: [
      'create_booking',
      'check_providers_for_service',
      'check_availability',
      'lookup_service_assignment',
    ],
    maxLength: 10,
  },
  {
    id: 'schedule-ambiguity-expands-schedule-neighbors',
    surface: 'dashboard',
    ranked: [
      candidate('create_direct_schedule', 0.66),
      candidate('apply_schedule', 0.64),
    ],
    mustInclude: [
      'create_direct_schedule',
      'apply_schedule',
      'clear_schedule',
      'fill_unused_slots',
    ],
    mustExclude: ['create_booking'],
    maxLength: 10,
  },
  {
    id: 'public-surface-filters-dashboard-only-actions',
    surface: 'public',
    ranked: [
      candidate('book_appointment', 0.71),
      candidate('check_availability', 0.69, 'semantic_match'),
    ],
    mustInclude: ['book_appointment', 'check_availability', 'list_providers'],
    mustExclude: [
      'create_booking',
      'check_providers_for_service',
      'create_direct_schedule',
    ],
    maxLength: 10,
  },
  {
    id: 'dedupes-duplicate-actions-by-highest-confidence',
    surface: 'dashboard',
    ranked: [
      candidate('create_booking', 0.72),
      candidate('create_booking', 0.55, 'semantic_match'),
      candidate('check_providers_for_service', 0.7),
    ],
    mustInclude: ['create_booking', 'check_providers_for_service'],
    maxLength: 10,
  },
  {
    id: 'caps-at-ten-intents',
    surface: 'dashboard',
    ranked: [
      candidate('create_booking', 0.7),
      candidate('check_providers_for_service', 0.69),
      candidate('check_availability', 0.68),
      candidate('book_nearest_slot', 0.67),
      candidate('lookup_service_assignment', 0.66),
      candidate('show_appointments', 0.65),
      candidate('list_bookings', 0.64),
      candidate('summarize_bookings', 0.63),
      candidate('create_direct_schedule', 0.62),
      candidate('apply_schedule', 0.61),
      candidate('clear_schedule', 0.6),
    ],
    mustInclude: ['create_booking', 'check_providers_for_service'],
    maxLength: 10,
  },
];
