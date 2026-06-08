import type { ClassificationSurface } from './ai-classification-engine.types.js';

export const SOMETHING_ELSE_ESCAPE_LABEL = 'Something else';

export const SOMETHING_ELSE_FOLLOWUP_PHRASES = [
  'something else',
  'none of these',
  'none of them',
  'not any of these',
  'neither',
  'other',
  'something different',
  'այլ բան',
  'не то',
] as const;

export interface SomethingElseEscapeScenario {
  id: string;
  prompt: string;
  surface: ClassificationSurface;
  shortlist?: string[];
  clarifyCandidates?: Array<{ action: string; label: string }>;
  excludedActions?: string[];
  expectCount: number;
  expectFollowUp?: boolean;
}

export const SOMETHING_ELSE_ESCAPE_SCENARIOS: SomethingElseEscapeScenario[] = [
  {
    id: 'dash-intent-escape',
    prompt: 'move my thing tomorrow',
    surface: 'dashboard',
    shortlist: ['reschedule_booking', 'cancel_booking', 'create_booking', 'list_bookings'],
    clarifyCandidates: [
      { action: 'reschedule_booking', label: 'Reschedule booking' },
      { action: 'cancel_booking', label: 'Cancel booking' },
    ],
    expectCount: 2,
  },
  {
    id: 'customer-intent-escape',
    prompt: 'fix my appointment',
    surface: 'customer',
    shortlist: ['book_appointment', 'list_my_appointments', 'cancel_my_booking', 'reschedule_my_booking'],
    clarifyCandidates: [
      { action: 'book_appointment', label: 'Book appointment' },
      { action: 'list_my_appointments', label: 'My appointments' },
    ],
    expectCount: 2,
  },
  {
    id: 'dash-followup-phrase',
    prompt: 'none of these',
    surface: 'dashboard',
    shortlist: ['create_booking', 'list_bookings', 'check_availability'],
    expectFollowUp: true,
    expectCount: 3,
  },
];
