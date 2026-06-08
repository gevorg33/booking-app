import type { ClassificationSurface } from './ai-classification-engine.types.js';

export interface SuggestedActionFallbackScenario {
  id: string;
  surface: ClassificationSurface;
  prompt?: string;
  shortlist?: string[];
  semanticCandidates?: Array<{ action: string; label?: string; prompt?: string }>;
  expectCount: number;
  expectFirstId?: string;
}

export const SUGGESTED_ACTION_FALLBACK_SCENARIOS: SuggestedActionFallbackScenario[] =
  [
    {
      id: 'dash-shortlist-top3',
      surface: 'dashboard',
      shortlist: ['list_bookings', 'create_booking', 'check_availability'],
      expectCount: 3,
      expectFirstId: 'list_bookings',
    },
    {
      id: 'customer-shortlist',
      surface: 'customer',
      shortlist: ['list_my_appointments', 'book_appointment'],
      expectCount: 2,
      expectFirstId: 'list_my_appointments',
    },
    {
      id: 'public-static-fallback',
      surface: 'public',
      expectCount: 3,
      expectFirstId: 'check-availability',
    },
    {
      id: 'provider-static-fallback',
      surface: 'provider',
      expectCount: 3,
      expectFirstId: 'list-my-bookings',
    },
    {
      id: 'prompt-ranks-booking',
      surface: 'dashboard',
      prompt: 'I want to book something tomorrow',
      shortlist: ['list_bookings', 'create_booking', 'check_availability'],
      expectCount: 3,
      expectFirstId: 'create_booking',
    },
    {
      id: 'semantic-candidates-preferred',
      surface: 'customer',
      semanticCandidates: [
        { action: 'book_appointment', label: 'Book now' },
        { action: 'list_my_appointments', label: 'My bookings' },
      ],
      expectCount: 2,
      expectFirstId: 'book_appointment',
    },
  ];

export const IMMEDIATE_FALLBACK_SCENARIOS = [
  {
    id: 'unknown-first-turn',
    surface: 'dashboard' as ClassificationSurface,
    action: 'unknown',
    confidence: 0.3,
    expectFallback: true,
  },
  {
    id: 'unknown-with-semantic-candidates-skips',
    surface: 'dashboard' as ClassificationSurface,
    action: 'unknown',
    params: { _semanticClarifyCandidates: [{ action: 'create_booking' }] },
    confidence: 0.3,
    expectFallback: false,
  },
  {
    id: 'high-confidence-known-skips',
    surface: 'dashboard' as ClassificationSurface,
    action: 'list_bookings',
    confidence: 0.9,
    expectFallback: false,
  },
] as const;
