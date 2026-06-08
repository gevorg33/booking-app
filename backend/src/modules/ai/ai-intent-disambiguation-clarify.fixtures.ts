import type { ClassificationSurface } from './ai-classification-engine.types.js';

export interface IntentDisambiguationCandidate {
  action: string;
  label: string;
  confidence: number;
  source: 'semantic' | 'classifier' | 'shortlist' | 'pattern';
}

export interface IntentDisambiguationScenario {
  id: string;
  prompt: string;
  surface: ClassificationSurface;
  classifierAction: string;
  classifierConfidence: number;
  semanticAction?: string;
  semanticConfidence?: number;
  shortlist?: string[];
  expectClarify: boolean;
  expectCandidateActions?: [string, string];
  expectSummaryIncludes?: string;
}

/** acc-4.2 — top-2 intent disambiguation scenarios (EN; per-surface action names). */
export const INTENT_DISAMBIGUATION_SCENARIOS: IntentDisambiguationScenario[] = [
  {
    id: 'dash-cancel-vs-reschedule',
    prompt: 'change my client appointment tomorrow — cancel or move it?',
    surface: 'dashboard',
    classifierAction: 'cancel_bookings',
    classifierConfidence: 0.44,
    semanticAction: 'reschedule_booking',
    semanticConfidence: 0.61,
    expectClarify: true,
    expectCandidateActions: ['cancel_bookings', 'reschedule_booking'],
    expectSummaryIncludes: 'cancel bookings or reschedule booking',
  },
  {
    id: 'dash-book-vs-check',
    prompt: 'who can do lashes tomorrow evening',
    surface: 'dashboard',
    classifierAction: 'create_booking',
    classifierConfidence: 0.46,
    semanticAction: 'check_providers_for_service',
    semanticConfidence: 0.63,
    expectClarify: true,
    expectCandidateActions: ['create_booking', 'check_providers_for_service'],
  },
  {
    id: 'customer-cancel-vs-reschedule',
    prompt: 'I need to cancel or reschedule my booking tomorrow',
    surface: 'customer',
    classifierAction: 'cancel_my_booking',
    classifierConfidence: 0.41,
    semanticAction: 'reschedule_my_booking',
    semanticConfidence: 0.58,
    expectClarify: true,
    expectCandidateActions: ['cancel_my_booking', 'reschedule_my_booking'],
  },
  {
    id: 'public-book-vs-availability',
    prompt: 'book or check who is free for massage tomorrow',
    surface: 'public',
    classifierAction: 'book_appointment',
    classifierConfidence: 0.43,
    semanticAction: 'check_availability',
    semanticConfidence: 0.6,
    expectClarify: true,
    expectCandidateActions: ['book_appointment', 'check_availability'],
  },
  {
    id: 'provider-mark-paid-vs-list',
    prompt: 'mark paid or show my appointments today',
    surface: 'provider',
    classifierAction: 'mark_paid',
    classifierConfidence: 0.4,
    shortlist: ['mark_paid', 'list_bookings', 'show_appointments'],
    expectClarify: true,
    expectCandidateActions: ['mark_paid', 'list_bookings'],
  },
  {
    id: 'dash-strong-intent-no-clarify',
    prompt: 'show all appointments today',
    surface: 'dashboard',
    classifierAction: 'list_bookings',
    classifierConfidence: 0.91,
    expectClarify: false,
  },
];

export const INTENT_DISAMBIGUATION_PAIRS: Record<
  ClassificationSurface,
  Array<{ pattern: RegExp; actions: [string, string]; labels?: [string, string] }>
> = {
  dashboard: [
    {
      pattern: /\b(cancel|reschedule|move|change|shift)\b.*\b(booking|appointment)\b/i,
      actions: ['cancel_bookings', 'reschedule_booking'],
      labels: ['Cancel booking', 'Reschedule booking'],
    },
    {
      pattern: /\b(book|check|who is free|availability)\b/i,
      actions: ['create_booking', 'check_providers_for_service'],
    },
  ],
  customer: [
    {
      pattern: /\b(cancel|reschedule|move|change)\b.*\b(my )?(booking|appointment)\b/i,
      actions: ['cancel_my_booking', 'reschedule_my_booking'],
      labels: ['Cancel my booking', 'Reschedule my booking'],
    },
  ],
  provider: [
    {
      pattern: /\b(mark paid|paid|payment)\b.*\b(or|vs)\b.*\b(schedule|appointments|bookings)\b/i,
      actions: ['mark_paid', 'list_bookings'],
    },
  ],
  public: [
    {
      pattern: /\b(book|reserve)\b.*\b(or|vs)\b.*\b(free|available|availability)\b/i,
      actions: ['book_appointment', 'check_availability'],
    },
  ],
};
