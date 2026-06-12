import type { CommandSurface } from './ai-command-registry.types.js';

export interface SemanticAllowedActionsScenario {
  id: string;
  surface: CommandSurface;
  lastAction?: string;
  mustInclude: readonly string[];
  mustExclude: readonly string[];
}

/** pipe-1.4.6 — surface + lastAction semantic shortlist scenarios. */
export const SEMANTIC_ALLOWED_ACTIONS_SCENARIOS: SemanticAllowedActionsScenario[] =
  [
    {
      id: 'dashboard-base-booking-availability-schedule',
      surface: 'dashboard',
      mustInclude: [
        'create_booking',
        'book_nearest_slot',
        'check_providers_for_service',
        'create_direct_schedule',
      ],
      mustExclude: [],
    },
    {
      id: 'customer-base-booking-availability',
      surface: 'customer',
      mustInclude: [
        'create_booking',
        'book_nearest_slot',
        'check_providers_for_service',
      ],
      mustExclude: ['create_direct_schedule'],
    },
    {
      id: 'public-base-booking-availability-only',
      surface: 'public',
      mustInclude: ['create_booking', 'check_providers_for_service'],
      mustExclude: ['create_direct_schedule', 'book_nearest_slot'],
    },
    {
      id: 'provider-no-semantic-anchors',
      surface: 'provider',
      mustInclude: [],
      mustExclude: [
        'create_booking',
        'book_nearest_slot',
        'check_providers_for_service',
        'create_direct_schedule',
      ],
    },
    {
      id: 'dashboard-after-check-providers-booking-thread',
      surface: 'dashboard',
      lastAction: 'check_providers_for_service',
      mustInclude: [
        'check_providers_for_service',
        'create_booking',
        'book_nearest_slot',
      ],
      mustExclude: ['create_direct_schedule'],
    },
    {
      id: 'dashboard-after-schedule-ops-schedule-only',
      surface: 'dashboard',
      lastAction: 'create_direct_schedule',
      mustInclude: ['create_direct_schedule'],
      mustExclude: ['create_booking', 'check_providers_for_service'],
    },
    {
      id: 'dashboard-after-list-gaps-schedule-only',
      surface: 'dashboard',
      lastAction: 'list_schedule_gaps',
      mustInclude: ['create_direct_schedule'],
      mustExclude: ['create_booking', 'book_nearest_slot'],
    },
    {
      id: 'customer-after-book-nearest-checkout-thread',
      surface: 'customer',
      lastAction: 'book_nearest_slot',
      mustInclude: ['book_nearest_slot', 'create_booking'],
      mustExclude: ['create_direct_schedule', 'check_providers_for_service'],
    },
    {
      id: 'public-after-check-availability-booking-thread',
      surface: 'public',
      lastAction: 'check_availability',
      mustInclude: ['check_providers_for_service', 'create_booking'],
      mustExclude: ['create_direct_schedule', 'book_nearest_slot'],
    },
    {
      id: 'dashboard-unknown-last-action-keeps-surface-base',
      surface: 'dashboard',
      lastAction: 'summarize_day',
      mustInclude: [
        'create_booking',
        'check_providers_for_service',
        'create_direct_schedule',
      ],
      mustExclude: [],
    },
  ];
