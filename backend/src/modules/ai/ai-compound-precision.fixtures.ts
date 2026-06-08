import type { CommandSurface } from './ai-command-registry.types.js';

/** acc-3.9 — single-intent prompts that must not split into compounds. */
export interface FalseCompoundGuardScenario {
  id: string;
  prompt: string;
  surface?: CommandSurface;
  reason:
    | 'availability_conjunction'
    | 'datetime_range'
    | 'multi_service_booking'
    | 'dual_entity_read'
    | 'orchestration_fallback'
    | 'vague_single_intent';
}

/** acc-3.9 — genuine multi-action prompts that must decompose. */
export interface TrueCompoundGuardScenario {
  id: string;
  prompt: string;
  surface: CommandSurface;
  minSteps?: number;
  orderedActions?: string[];
}

export const FALSE_COMPOUND_GUARD_SCENARIOS: ReadonlyArray<FalseCompoundGuardScenario> =
  [
    {
      id: 'availability-and-who-free',
      prompt: 'Who is free tomorrow and who can do lashes',
      reason: 'availability_conjunction',
    },
    {
      id: 'availability-and-evening',
      prompt: 'Who is available tomorrow evening for massage and who has open slots',
      reason: 'availability_conjunction',
    },
    {
      id: 'multi-service-haircut-beard',
      prompt: 'Book haircut and beard trim Tuesday 10am with Anna for Maria',
      reason: 'multi_service_booking',
    },
    {
      id: 'multi-service-massage-facial',
      prompt: 'Schedule massage and facial tomorrow at 14:00 with Gevorg',
      reason: 'multi_service_booking',
    },
    {
      id: 'dual-entity-show-providers',
      prompt: 'Show appointments for Gevorg and Maria tomorrow',
      reason: 'dual_entity_read',
    },
    {
      id: 'dual-entity-list-customers',
      prompt: 'List bookings for Anna and James on Friday',
      reason: 'dual_entity_read',
    },
    {
      id: 'datetime-range-between',
      prompt: 'Cancel all appointments between 16:30 and 17:30 tomorrow',
      reason: 'datetime_range',
    },
    {
      id: 'datetime-range-from-to',
      prompt: 'Hide appointments from 09:00 and 11:00 on Friday',
      reason: 'datetime_range',
    },
    {
      id: 'orchestration-fallback-chain',
      prompt:
        'Book facemassage on Gevorg tomorrow at 9; if not available then Mary at 9',
      reason: 'orchestration_fallback',
    },
    {
      id: 'orchestration-otherwise-book',
      prompt:
        'Book massage with Gevorg tomorrow at 10, otherwise book whoever is free',
      reason: 'orchestration_fallback',
    },
  ];

export const TRUE_COMPOUND_GUARD_SCENARIOS: ReadonlyArray<TrueCompoundGuardScenario> =
  [
    {
      id: 'cancel-notify-waitlist',
      prompt: 'Cancel package visit and notify waitlist for Friday',
      surface: 'dashboard',
      orderedActions: ['cancel_package_visit', 'fill_slot_from_waitlist'],
    },
    {
      id: 'summarize-export-plus',
      prompt: 'Summarize unpaid bookings plus export accounting',
      surface: 'dashboard',
      minSteps: 2,
      orderedActions: ['summarize_unpaid', 'export_accounting'],
    },
    {
      id: 'customer-book-promo',
      prompt: 'Book spa day package and apply promo code SPRING25',
      surface: 'customer',
      orderedActions: ['book_package', 'promo_code_help'],
    },
    {
      id: 'semicolon-tag-vip',
      prompt: 'List subscriptions for Anna; tag customer as VIP',
      surface: 'dashboard',
      orderedActions: ['list_customer_subscriptions', 'tag_customer'],
    },
    {
      id: 'then-export-accounting',
      prompt: 'Summarize unpaid bookings then export accounting',
      surface: 'dashboard',
      orderedActions: ['summarize_unpaid', 'export_accounting'],
    },
    {
      id: 'check-book-nearest',
      prompt:
        'check who is free tomorrow evening for permanent lashes, book the nearest slot',
      surface: 'dashboard',
      minSteps: 2,
    },
  ];

/** Minimum false-compound guard scenarios in CI (acc-3.9). */
export const ACC_COMPOUND_PRECISION_MIN_FALSE_GUARD_CASES = 8;

/** Minimum true-compound guard scenarios in CI (acc-3.9). */
export const ACC_COMPOUND_PRECISION_MIN_TRUE_GUARD_CASES = 5;
